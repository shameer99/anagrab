const { v4: uuidv4 } = require('uuid');
const {
  shuffle,
  isValidWord,
  tryTakeFromPot,
  tryToStealWord,
  dictionary,
} = require('./utils/gameLogic');
const { getDB } = require('./config/mongodb');

// Singleton instance for GameManager
let gameManagerInstance = null;

class Game {
  constructor(hostSocketId, settings = {}) {
    // Generate a 4-letter uppercase game code
    this.id = this.generateUniqueGameCode();
    this.host = hostSocketId;
    this.players = {};
    this.playerTokens = new Map(); // Map socket IDs to player tokens
    this.pot = [];
    this.deck = [];
    this.isActive = true;
    this.settings = {
      ...settings,
      autoFlipEnabled: settings.autoFlipEnabled || false,
      autoFlipInterval: settings.autoFlipInterval || 15,
    };
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.autoFlipTimer = null;
    this.nextFlipTime = null;
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }

  // Generate a unique 4-letter game code
  generateUniqueGameCode() {
    // Get all 4-letter words from dictionary
    const fourLetterWords = Array.from(dictionary).filter(word => word.length === 4);

    // Shuffle the array of words to get random ones
    const shuffledWords = shuffle([...fourLetterWords]);

    // Try each word until we find an unused one
    for (const word of shuffledWords) {
      const code = word.toUpperCase();
      const existingGames = gameManagerInstance?.listGames() || [];
      if (!existingGames.some(game => game.id === code)) {
        return code;
      }
    }

    // If all 4-letter words are used (extremely unlikely), fall back to random letters
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I and O to avoid confusion with 1 and 0
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
  }

  initializeDeck() {
    const distribution = {
      A: 13,
      B: 3,
      C: 3,
      D: 6,
      E: 18,
      F: 3,
      G: 4,
      H: 3,
      I: 12,
      J: 2,
      K: 2,
      L: 5,
      M: 3,
      N: 8,
      O: 11,
      P: 3,
      Q: 2,
      R: 9,
      S: 6,
      T: 9,
      U: 6,
      V: 3,
      W: 3,
      X: 2,
      Y: 3,
      Z: 2,
    };

    // Create array of letters based on frequencies
    const letters = Object.entries(distribution).flatMap(([letter, count]) =>
      Array(count).fill(letter)
    );
    this.deck = shuffle(letters);
    this.pot = [];
    console.log(`Game ${this.id}: Deck initialized:`, { deckSize: this.deck.length });
    return this;
  }

  addPlayer(socketId, playerName, playerToken = null) {
    // Generate a player token if not provided
    const token = playerToken || uuidv4();

    // Sanitize player name
    const sanitizedName = playerName
      ? playerName.trim().substring(0, 20) // Limit to 20 characters
      : 'Player';

    this.players[token] = {
      name: sanitizedName,
      words: [],
      lastSeen: new Date(),
      socketId: socketId,
    };

    this.playerTokens.set(socketId, token);

    // Update turn order when new player joins
    this.updateTurnOrder();

    return { token, game: this };
  }

  removePlayer(socketId) {
    const token = this.playerTokens.get(socketId);
    if (token) {
      delete this.players[token];
      this.playerTokens.delete(socketId);
      // Update turn order when player leaves
      this.updateTurnOrder();
    }
    return this;
  }

  updatePlayerSocket(token, newSocketId) {
    const player = this.players[token];
    if (player) {
      const oldSocketId = player.socketId;
      player.socketId = newSocketId;
      player.lastSeen = new Date();

      // Update the socket to token mapping
      this.playerTokens.delete(oldSocketId);
      this.playerTokens.set(newSocketId, token);

      console.log(`Game ${this.id}: Updated socket mapping for player:`, {
        token,
        oldSocketId,
        newSocketId,
      });
      return true;
    }
    return false;
  }

  getPlayerByToken(token) {
    return this.players[token];
  }

  getPlayerBySocket(socketId) {
    const token = this.playerTokens.get(socketId);
    return token ? this.players[token] : null;
  }

  startNewGame() {
    this.initializeDeck();
    // Reset all players' word banks
    for (const playerId in this.players) {
      this.players[playerId].words = [];
    }
    this.isActive = true;
    // Initialize turn order when game starts
    this.initializeTurnOrder();
    // Start auto-flip if enabled
    if (this.settings.autoFlipEnabled) {
      this.startAutoFlipTimer();
    }
    return this;
  }

  flipLetter(socketId = null) {
    // Check if it's a manual flip from a player
    if (socketId) {
      // Get the player's token using their socket ID
      const playerToken = this.playerTokens.get(socketId);
      const currentTurn = this.getCurrentTurn();

      // Check if it's their turn using their persistent token
      if (playerToken !== currentTurn) {
        return {
          success: false,
          error: 'Not your turn to flip',
          state: this,
        };
      }

      // If auto-flip is enabled, this is an early flip - clear the timer
      if (this.settings.autoFlipEnabled) {
        this.stopAutoFlipTimer();
      }
    }

    console.log(`Game ${this.id}: Attempting to flip letter. Current state:`, {
      deckSize: this.deck.length,
      potSize: this.pot.length,
    });

    if (this.deck.length > 0) {
      const letter = this.deck.pop();
      this.pot.push(letter);
      console.log(`Game ${this.id}: Letter flipped:`, {
        letter,
        newDeckSize: this.deck.length,
        newPotSize: this.pot.length,
      });

      // Advance to next player's turn
      this.advanceToNextTurn();

      // If auto-flip is enabled, start the timer for the next player
      if (this.settings.autoFlipEnabled) {
        this.startAutoFlipTimer();
      }

      return { success: true, state: this };
    }
    console.log(`Game ${this.id}: Failed to flip letter: deck is empty`);
    return { success: false, state: this };
  }

  claimWord(word, socketId) {
    // Get player token from socket ID
    const playerToken = this.playerTokens.get(socketId);
    if (!playerToken || !this.players[playerToken]) {
      return { success: false, error: 'Player not found in game' };
    }

    const validation = isValidWord(word);
    if (!validation.success) {
      return { success: false, error: validation.reason };
    }

    // Try taking from pot first
    if (tryTakeFromPot(word, this.pot, playerToken, this)) {
      return {
        success: true,
        state: this,
        source: 'pot',
        word,
      };
    }

    // Try stealing
    const stealResult = tryToStealWord(word, this.pot, playerToken, this);
    if (stealResult.success) {
      return {
        success: true,
        state: this,
        source: 'steal',
        stolenFrom: stealResult.stolenFrom,
        originalWord: stealResult.originalWord,
        word,
      };
    }

    // Return the specific error message from tryToStealWord
    return { success: false, error: stealResult.error };
  }

  endGame() {
    if (this.deck.length === 0) {
      this.isActive = false;
      return { success: true, state: this };
    }
    return { success: false, state: this };
  }

  isEmpty() {
    return Object.keys(this.players).length === 0;
  }

  toJSON() {
    return {
      _id: this.id, // Use _id for MongoDB
      host: this.host,
      players: this.players,
      pot: this.pot,
      deck: this.deck,
      isActive: this.isActive,
      settings: this.settings,
      turnOrder: this.turnOrder,
      currentTurnIndex: this.currentTurnIndex,
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      nextFlipTime: this.nextFlipTime,
    };
  }

  static fromJSON(data) {
    const game = new Game(data.host, data.settings);
    game.id = data._id;
    game.players = data.players;
    game.pot = data.pot;
    game.deck = data.deck;
    game.isActive = data.isActive;
    game.turnOrder = data.turnOrder || [];
    game.currentTurnIndex = data.currentTurnIndex || 0;
    game.createdAt = new Date(data.createdAt);
    game.lastActivity = new Date(data.lastActivity);
    game.nextFlipTime = data.nextFlipTime;

    // Rebuild the playerTokens map
    game.playerTokens = new Map();
    Object.entries(game.players).forEach(([token, player]) => {
      if (player.socketId) {
        game.playerTokens.set(player.socketId, token);
      }
    });

    // Restart auto-flip timer if enabled
    if (game.settings.autoFlipEnabled) {
      // Calculate remaining time based on saved nextFlipTime
      if (game.nextFlipTime) {
        const remainingTime = game.nextFlipTime - Date.now();
        if (remainingTime > 0) {
          console.log(`Game ${game.id}: Scheduling auto-flip in ${remainingTime}ms`);
          game.autoFlipTimer = setTimeout(() => {
            const result = game.autoFlip();
            if (result.success) {
              // Save game state after auto-flip
              gameManagerInstance?.saveGameToDB(game);

              // Get the io instance from the GameManager
              const io = gameManagerInstance?.getIO();
              if (io) {
                // Emit all necessary updates
                io.to(game.id).emit('game_state_update', game);
                io.to(game.id).emit('turn_update', result.nextTurn);
                io.to(game.id).emit('auto_flip_update', result.autoFlipStatus);
              }
            }
          }, remainingTime);
        } else {
          // If we missed the flip time, do it immediately
          console.log(`Game ${game.id}: Missed flip time, flipping immediately`);
          const result = game.autoFlip();
          if (result.success) {
            gameManagerInstance?.saveGameToDB(game);
            const io = gameManagerInstance?.getIO();
            if (io) {
              io.to(game.id).emit('game_state_update', game);
              io.to(game.id).emit('turn_update', result.nextTurn);
              io.to(game.id).emit('auto_flip_update', result.autoFlipStatus);
            }
          }
        }
      } else {
        game.startAutoFlipTimer();
      }
    }
    return game;
  }

  // Initialize turn order using player tokens
  initializeTurnOrder() {
    // Use the persistent player tokens for turn order
    this.turnOrder = Object.keys(this.players);
    this.currentTurnIndex = 0;
    console.log(`Game ${this.id}: Initialized turn order:`, this.turnOrder);
    return this;
  }

  // Get current player's turn
  getCurrentTurn() {
    return this.turnOrder[this.currentTurnIndex];
  }

  // Advance to next player
  advanceToNextTurn() {
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
    return this.getCurrentTurn();
  }

  // Update turn order when players join/leave
  updateTurnOrder() {
    const currentPlayer = this.getCurrentTurn();
    // Use the persistent player tokens for turn order
    this.turnOrder = Object.keys(this.players);

    // If current player still exists, keep their turn
    if (currentPlayer && this.turnOrder.includes(currentPlayer)) {
      this.currentTurnIndex = this.turnOrder.indexOf(currentPlayer);
    } else {
      this.currentTurnIndex = 0;
    }

    console.log(`Game ${this.id}: Updated turn order:`, {
      turnOrder: this.turnOrder,
      currentTurnIndex: this.currentTurnIndex,
      currentPlayer: this.getCurrentTurn(),
    });
    return this;
  }

  // Start auto-flip timer
  startAutoFlipTimer() {
    if (this.settings.autoFlipEnabled && !this.autoFlipTimer) {
      // Clear any existing timer
      if (this.autoFlipTimer) {
        clearTimeout(this.autoFlipTimer);
        this.autoFlipTimer = null;
      }

      // Set the next flip time
      this.nextFlipTime = Date.now() + this.settings.autoFlipInterval * 1000;

      // Set the timer
      this.autoFlipTimer = setTimeout(() => {
        this.autoFlip();
      }, this.settings.autoFlipInterval * 1000);

      console.log(
        `Game ${this.id}: Auto-flip timer started, next flip at:`,
        new Date(this.nextFlipTime)
      );
    }
    return this;
  }

  // Auto-flip a letter
  autoFlip() {
    try {
      console.log(`Game ${this.id}: Auto-flipping letter`);
      const result = this.flipLetter(); // No socketId means it's an automatic flip
      this.autoFlipTimer = null;
      this.nextFlipTime = null;

      if (result.success && this.deck.length > 0) {
        console.log(`Game ${this.id}: Auto-flip successful, starting next timer`);
        // Start the next timer immediately
        this.startAutoFlipTimer();
      } else {
        console.log(`Game ${this.id}: Auto-flip failed or deck empty`, result);
        // If auto-flip failed or deck is empty, disable auto-flip
        this.settings.autoFlipEnabled = false;
      }

      // Add additional information needed for client updates
      return {
        ...result,
        nextTurn: {
          currentTurn: this.getCurrentTurn(),
          playerName: this.players[this.getCurrentTurn()]?.name,
        },
        autoFlipStatus: {
          enabled: this.settings.autoFlipEnabled,
          interval: this.settings.autoFlipInterval,
          nextFlipTime: this.nextFlipTime,
        },
      };
    } catch (error) {
      console.error(`Game ${this.id}: Error during auto-flip:`, error);
      this.autoFlipTimer = null;
      this.nextFlipTime = null;
      this.settings.autoFlipEnabled = false;
      return {
        success: false,
        error: 'Auto-flip failed',
        state: this,
        autoFlipStatus: {
          enabled: false,
          interval: this.settings.autoFlipInterval,
          nextFlipTime: null,
        },
      };
    }
  }

  // Stop auto-flip timer
  stopAutoFlipTimer() {
    if (this.autoFlipTimer) {
      clearTimeout(this.autoFlipTimer);
      this.autoFlipTimer = null;
      this.nextFlipTime = null;
    }
    return this;
  }

  // Toggle auto-flip
  toggleAutoFlip(enabled, interval = null) {
    this.settings.autoFlipEnabled = enabled;

    if (interval !== null) {
      this.settings.autoFlipInterval = interval;
    }

    this.stopAutoFlipTimer();
    if (enabled) {
      this.startAutoFlipTimer();
    }

    return this;
  }
}

class GameManager {
  constructor() {
    this.games = new Map();
    this.playerGameMap = new Map(); // Maps player tokens to gameId
    this.db = null;
    this.io = null; // Store io instance

    // Set singleton instance
    gameManagerInstance = this;

    // Initialize database connection
    this.initializeDB();

    // Set up periodic cleanup of inactive games
    setInterval(() => this.cleanupInactiveGames(), 1000 * 60 * 60); // Cleanup every hour
  }

  // Set the io instance
  setIO(io) {
    this.io = io;
  }

  // Get the io instance
  getIO() {
    return this.io;
  }

  async initializeDB() {
    try {
      this.db = await getDB();
      await this.loadGamesFromDB();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  async loadGamesFromDB() {
    try {
      const games = await this.db
        .collection('games')
        .find({
          lastActivity: {
            $gt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        })
        .toArray();

      games.forEach(gameData => {
        const game = Game.fromJSON(gameData);
        this.games.set(game.id, game);

        // Rebuild player game map
        Object.keys(game.players).forEach(socketId => {
          this.playerGameMap.set(socketId, game.id);
        });
      });

      console.log(`Loaded ${games.length} games from database`);
    } catch (error) {
      console.error('Failed to load games from database:', error);
    }
  }

  async saveGameToDB(game) {
    try {
      game.lastActivity = new Date();
      await this.db
        .collection('games')
        .updateOne({ _id: game.id }, { $set: game.toJSON() }, { upsert: true });
    } catch (error) {
      console.error(`Failed to save game ${game.id} to database:`, error);
    }
  }

  async createGame(hostSocketId, settings = {}) {
    const game = new Game(hostSocketId, settings);
    game.startNewGame();

    // Ensure unique game code
    let attempts = 0;
    const maxAttempts = 10;

    while (this.games.has(game.id) && attempts < maxAttempts) {
      game.id = game.generateUniqueGameCode();
      attempts++;
    }

    if (this.games.has(game.id)) {
      game.id = game.id + Math.floor(Math.random() * 10);
    }

    this.games.set(game.id, game);
    await this.saveGameToDB(game);

    console.log(`Game created: ${game.id} by host: ${hostSocketId}`);
    return game;
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  async addPlayerToGame(gameId, socketId, playerName, playerToken = null) {
    const game = this.games.get(gameId);
    if (!game) {
      console.log(`Failed to add player to game: Game ${gameId} not found`);
      return null;
    }

    // If player token provided, check if player is already in a game
    if (playerToken) {
      const existingGameId = this.playerGameMap.get(playerToken);
      if (existingGameId && existingGameId !== gameId) {
        await this.removePlayerFromGame(existingGameId, playerToken);
      }
    }

    const { token, game: updatedGame } = game.addPlayer(socketId, playerName, playerToken);
    this.playerGameMap.set(token, gameId);
    await this.saveGameToDB(updatedGame);

    console.log(`Player ${playerName} (${token}) added to game ${gameId}`);
    return { game: updatedGame, playerToken: token };
  }

  async removePlayerFromGame(gameId, identifier) {
    const game = this.games.get(gameId);
    if (!game) return null;

    // Handle both socket IDs and player tokens
    const player =
      typeof identifier === 'string' && identifier.length === 36
        ? game.getPlayerByToken(identifier)
        : game.getPlayerBySocket(identifier);

    if (player) {
      game.removePlayer(player.socketId);
      this.playerGameMap.delete(identifier);
      await this.saveGameToDB(game);

      if (game.isEmpty()) {
        console.log(`Game ${gameId} is now empty, scheduling for cleanup`);
        setTimeout(() => this.cleanupGameIfEmpty(gameId), 1000 * 60 * 5);
      }
    }

    return game;
  }

  async reconnectPlayer(gameId, token, newSocketId) {
    const game = this.games.get(gameId);
    if (!game) return null;

    const success = game.updatePlayerSocket(token, newSocketId);
    if (success) {
      await this.saveGameToDB(game);
      return game;
    }
    return null;
  }

  getGameByPlayerId(identifier) {
    const gameId = this.playerGameMap.get(identifier);
    if (!gameId) return null;
    return this.games.get(gameId);
  }

  async cleanupGameIfEmpty(gameId) {
    const game = this.games.get(gameId);
    if (game && game.isEmpty()) {
      console.log(`Cleaning up empty game: ${gameId}`);
      await this.db.collection('games').deleteOne({ _id: gameId });
      this.games.delete(gameId);
    }
  }

  async cleanupInactiveGames() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      // Delete from MongoDB
      await this.db.collection('games').deleteMany({
        lastActivity: { $lt: oneDayAgo },
      });

      // Clean up memory
      for (const [gameId, game] of this.games.entries()) {
        if (game.lastActivity < oneDayAgo) {
          console.log(`Cleaning up inactive game: ${gameId}`);

          // Remove all player mappings
          Object.keys(game.players).forEach(socketId => {
            this.playerGameMap.delete(socketId);
          });

          this.games.delete(gameId);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup inactive games:', error);
    }
  }

  listGames() {
    const gameList = [];
    for (const [id, game] of this.games.entries()) {
      gameList.push({
        id,
        playerCount: Object.keys(game.players).length,
        isActive: game.isActive,
        createdAt: game.createdAt,
      });
    }
    return gameList;
  }
}

module.exports = {
  GameManager: new GameManager(), // Export a singleton instance
  Game, // Export the Game class for testing
};
