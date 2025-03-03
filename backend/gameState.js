const { GameManager } = require('./GameManager');

// Export all game-related functions directly from the GameManager
module.exports = {
  createGame: (hostSocketId, settings = {}) => {
    return GameManager.createGame(hostSocketId, settings);
  },

  getGame: gameId => {
    return GameManager.getGame(gameId);
  },

  addPlayerToGame: (gameId, socketId, playerName) => {
    return GameManager.addPlayerToGame(gameId, socketId, playerName);
  },

  removePlayerFromGame: (gameId, socketId) => {
    return GameManager.removePlayerFromGame(gameId, socketId);
  },

  removePlayerFromAllGames: socketId => {
    return GameManager.removePlayerFromAllGames(socketId);
  },

  getGameByPlayerId: socketId => {
    return GameManager.getGameByPlayerId(socketId);
  },

  listGames: () => {
    return GameManager.listGames();
  },

  // Game-specific operations that need a gameId
  startGame: gameId => {
    const game = GameManager.getGame(gameId);
    if (game) {
      return game.startNewGame();
    }
    return null;
  },

  flipLetter: gameId => {
    const game = GameManager.getGame(gameId);
    if (game) {
      return game.flipLetter();
    }
    return { success: false, error: 'Game not found' };
  },

  claimWord: (gameId, word, socketId) => {
    const game = GameManager.getGame(gameId);
    if (game) {
      return game.claimWord(word, socketId);
    }
    return { success: false, error: 'Game not found' };
  },

  endGame: gameId => {
    const game = GameManager.getGame(gameId);
    if (game) {
      return game.endGame();
    }
    return { success: false, error: 'Game not found' };
  },
};
