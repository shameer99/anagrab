const { GameManager } = require('./GameManager');

// Legacy global game state for backward compatibility
// This will be removed in a future update
const gameState = {
  players: {},
  pot: [],
  deck: [],
  isActive: true,
};

// Create a default game for backward compatibility
const defaultGame = GameManager.createGame('system');
const DEFAULT_GAME_ID = defaultGame.id;

function initializeDeck() {
  const distribution =
    'AAAAAAAAAAAABBBCCCDDDDDDEEEEEEEEEEEEEEEEEEFFFGGGGHHHIIIIIIIIIIIIJJKKLLLLLMMMNNNNNNNNOOOOOOOOOOOPPPQQRRRRRRRRRSSSSSSUUUUUUVVVWWWXXYYYZZ'.split(
      ''
    );
  const { shuffle } = require('./utils/gameLogic');
  gameState.deck = shuffle([...distribution]);
  gameState.pot = [];
  console.log('Legacy: Deck initialized:', { deckSize: gameState.deck.length });
}

function addPlayer(socketId, playerName) {
  // Add to both the legacy gameState and the default game
  gameState.players[socketId] = {
    name: playerName,
    words: [],
  };

  // Add to the default game in the GameManager
  GameManager.addPlayerToGame(DEFAULT_GAME_ID, socketId, playerName);

  return gameState;
}

function removePlayer(socketId) {
  // Remove from legacy gameState
  delete gameState.players[socketId];

  // Remove from all games in the GameManager
  GameManager.removePlayerFromAllGames(socketId);

  return gameState;
}

function startNewGame() {
  // Initialize the legacy gameState
  initializeDeck();

  // Reset all players' word banks in legacy gameState
  for (const playerId in gameState.players) {
    gameState.players[playerId].words = [];
  }

  // Start a new game in the default game
  defaultGame.startNewGame();

  return gameState;
}

function flipLetter() {
  console.log('Legacy: Attempting to flip letter. Current state:', {
    deckSize: gameState.deck.length,
    potSize: gameState.pot.length,
  });

  // Flip letter in legacy gameState
  let success = false;
  if (gameState.deck.length > 0) {
    const letter = gameState.deck.pop();
    gameState.pot.push(letter);
    success = true;
  }

  // Flip letter in the default game
  const defaultGameResult = defaultGame.flipLetter();

  // Use the success status from the default game
  return {
    success: defaultGameResult.success,
    state: gameState,
  };
}

function claimWord(word, socketId) {
  // Forward to the default game
  const result = defaultGame.claimWord(word, socketId);

  // If successful, sync the legacy gameState with the default game
  if (result.success) {
    // Sync pot
    gameState.pot = [...defaultGame.pot];

    // Sync player words
    for (const playerId in defaultGame.players) {
      if (gameState.players[playerId]) {
        gameState.players[playerId].words = [...defaultGame.players[playerId].words];
      }
    }
  }

  // Return the result but with the legacy gameState
  if (result.success) {
    return {
      ...result,
      state: gameState,
    };
  }

  return result;
}

function endGame() {
  // End game in legacy gameState
  if (gameState.deck.length === 0) {
    gameState.isActive = false;
  }

  // End game in the default game
  const result = defaultGame.endGame();

  return {
    success: result.success,
    state: gameState,
  };
}

// New multi-game functions
function createGame(hostSocketId, settings = {}) {
  return GameManager.createGame(hostSocketId, settings);
}

function getGame(gameId) {
  return GameManager.getGame(gameId);
}

function joinGame(gameId, socketId, playerName) {
  return GameManager.addPlayerToGame(gameId, socketId, playerName);
}

function leaveGame(gameId, socketId) {
  return GameManager.removePlayerFromGame(gameId, socketId);
}

function getGameByPlayerId(socketId) {
  return GameManager.getGameByPlayerId(socketId);
}

function listGames() {
  return GameManager.listGames();
}

module.exports = {
  // Legacy exports for backward compatibility
  gameState,
  addPlayer,
  removePlayer,
  startNewGame,
  flipLetter,
  claimWord,
  endGame,

  // New multi-game exports
  createGame,
  getGame,
  joinGame,
  leaveGame,
  getGameByPlayerId,
  listGames,
  DEFAULT_GAME_ID,
};
