const { v4: uuidv4 } = require('uuid');
const { shuffle, isValidWord, tryTakeFromPot, tryToStealWord } = require('./utils/gameLogic');

class Game {
  constructor(hostSocketId, settings = {}) {
    this.id = uuidv4().substring(0, 6).toUpperCase(); // Short, readable game ID
    this.host = hostSocketId;
    this.players = {};
    this.pot = [];
    this.deck = [];
    this.isActive = true;
    this.settings = settings;
    this.createdAt = Date.now();
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
      id: this.id,
      host: this.host,
      players: this.players,
      pot: this.pot,
      deck: this.deck.length, // Only send the length, not the actual deck
      isActive: this.isActive,
      createdAt: this.createdAt,
    };
  }
}

class GameManager {
  constructor() {
    this.games = new Map();
    this.playerGameMap = new Map(); // Maps socketId to gameId for quick lookup

    // Set up periodic cleanup of inactive games
    setInterval(() => this.cleanupInactiveGames(), 1000 * 60 * 60); // Cleanup every hour
  }

  createGame(hostSocketId, settings = {}) {
    const game = new Game(hostSocketId, settings);
    this.games.set(game.id, game);
    console.log(`Game created: ${game.id} by host: ${hostSocketId}`);
    return game;
  }

  getGame(gameId) {
    return this.games.get(gameId);
  }

  addPlayerToGame(gameId, socketId, playerName) {
    const game = this.games.get(gameId);
    if (!game) {
      console.log(`Failed to add player to game: Game ${gameId} not found`);
      return null;
    }

    // Remove player from any existing game
    this.removePlayerFromAllGames(socketId);

    // Add player to the new game
    game.addPlayer(socketId, playerName);
    this.playerGameMap.set(socketId, gameId);

    console.log(`Player ${playerName} (${socketId}) added to game ${gameId}`);
    return game;
  }

  removePlayerFromGame(gameId, socketId) {
    const game = this.games.get(gameId);
    if (!game) return null;

    game.removePlayer(socketId);
    this.playerGameMap.delete(socketId);

    // If game is empty, schedule it for cleanup
    if (game.isEmpty()) {
      console.log(`Game ${gameId} is now empty, scheduling for cleanup`);
      setTimeout(() => this.cleanupGameIfEmpty(gameId), 1000 * 60 * 5); // Cleanup after 5 minutes if still empty
    }

    return game;
  }

  removePlayerFromAllGames(socketId) {
    const gameId = this.playerGameMap.get(socketId);
    if (gameId) {
      return this.removePlayerFromGame(gameId, socketId);
    }
    return null;
  }

  getGameByPlayerId(socketId) {
    const gameId = this.playerGameMap.get(socketId);
    if (!gameId) return null;
    return this.games.get(gameId);
  }

  cleanupGameIfEmpty(gameId) {
    const game = this.games.get(gameId);
    if (game && game.isEmpty()) {
      console.log(`Cleaning up empty game: ${gameId}`);
      this.games.delete(gameId);
    }
  }

  cleanupInactiveGames() {
    const now = Date.now();
    const ONE_DAY = 1000 * 60 * 60 * 24;

    for (const [gameId, game] of this.games.entries()) {
      // Remove games that are older than 1 day
      if (now - game.createdAt > ONE_DAY) {
        console.log(`Cleaning up inactive game: ${gameId}`);

        // Remove all player mappings for this game
        for (const socketId of Object.keys(game.players)) {
          this.playerGameMap.delete(socketId);
        }

        this.games.delete(gameId);
      }
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
