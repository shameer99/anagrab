const { v4: uuidv4 } = require('uuid');
const { shuffle, isValidWord, tryTakeFromPot, tryToStealWord } = require('./utils/gameLogic');
const { getDB } = require('./config/mongodb');

class Game {
  constructor(hostSocketId, settings = {}) {
    // Generate a 4-letter uppercase game code
    this.id = this.generateUniqueGameCode();
    this.host = hostSocketId;
    this.players = {};
    this.pot = [];
    this.deck = [];
    this.isActive = true;
    this.settings = settings;
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }

  // Generate a unique 4-letter game code
  generateUniqueGameCode() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I and O to avoid confusion with 1 and 0
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return code;
  }

  initializeDeck() {
    const distribution =
      'AAAAAAAAAAAABBBCCCDDDDDDEEEEEEEEEEEEEEEEEEFFFGGGGHHHIIIIIIIIIIIIJJKKLLLLLMMMNNNNNNNNOOOOOOOOOOOPPPQQRRRRRRRRRSSSSSSUUUUUUVVVWWWXXYYYZZ'.split(
        ''
      );
    this.deck = shuffle([...distribution]);
    this.pot = [];
    console.log(`Game ${this.id}: Deck initialized:`, { deckSize: this.deck.length });
    return this;
  }

  addPlayer(socketId, playerName) {
    this.players[socketId] = {
      name: playerName,
      words: [],
    };
    return this;
  }

  removePlayer(socketId) {
    delete this.players[socketId];
    return this;
  }

  startNewGame() {
    this.initializeDeck();
    // Reset all players' word banks
    for (const playerId in this.players) {
      this.players[playerId].words = [];
    }
    this.isActive = true;
    return this;
  }

  flipLetter() {
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
      return { success: true, state: this };
    }
    console.log(`Game ${this.id}: Failed to flip letter: deck is empty`);
    return { success: false, state: this };
  }

  claimWord(word, socketId) {
    if (!this.players[socketId]) {
      return { success: false, error: 'Player not found in game' };
    }

    const validation = isValidWord(word);
    if (!validation.success) {
      return { success: false, error: validation.reason };
    }

    // Try taking from pot first
    if (tryTakeFromPot(word, this.pot, socketId, this)) {
      return {
        success: true,
        state: this,
        source: 'pot',
        word,
      };
    }

    // Try stealing
    const stealResult = tryToStealWord(word, this.pot, socketId, this);
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
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
    };
  }

  static fromJSON(data) {
    const game = new Game(data.host, data.settings);
    game.id = data._id;
    game.players = data.players;
    game.pot = data.pot;
    game.deck = data.deck;
    game.isActive = data.isActive;
    game.createdAt = new Date(data.createdAt);
    game.lastActivity = new Date(data.lastActivity);
    return game;
  }
}

class GameManager {
  constructor() {
    this.games = new Map();
    this.playerGameMap = new Map(); // Maps socketId to gameId for quick lookup
    this.db = null;

    // Initialize database connection
    this.initializeDB();

    // Set up periodic cleanup of inactive games
    setInterval(() => this.cleanupInactiveGames(), 1000 * 60 * 60); // Cleanup every hour
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

  async addPlayerToGame(gameId, socketId, playerName) {
    const game = this.games.get(gameId);
    if (!game) {
      console.log(`Failed to add player to game: Game ${gameId} not found`);
      return null;
    }

    await this.removePlayerFromAllGames(socketId);

    game.addPlayer(socketId, playerName);
    this.playerGameMap.set(socketId, gameId);
    await this.saveGameToDB(game);

    console.log(`Player ${playerName} (${socketId}) added to game ${gameId}`);
    return game;
  }

  async removePlayerFromGame(gameId, socketId) {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.removePlayer(socketId);
    this.playerGameMap.delete(socketId);
    await this.saveGameToDB(game);

    if (game.isEmpty()) {
      console.log(`Game ${gameId} is now empty, scheduling for cleanup`);
      setTimeout(() => this.cleanupGameIfEmpty(gameId), 1000 * 60 * 5);
    }

    return game;
  }

  async removePlayerFromAllGames(socketId) {
    const gameId = this.playerGameMap.get(socketId);
    if (gameId) {
      return await this.removePlayerFromGame(gameId, socketId);
    }
    return null;
  }

  getGameByPlayerId(socketId) {
    const gameId = this.playerGameMap.get(socketId);
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
