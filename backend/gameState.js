const { shuffle, isValidWord, tryTakeFromPot, tryToStealWord } = require('./utils/gameLogic');

const gameState = {
  players: {},
  pot: [],
  deck: [],
  isActive: true,
};

function initializeDeck() {
  const distribution =
    'AAAAAAAAAAAABBBCCCDDDDDDEEEEEEEEEEEEEEEEEEFFFGGGGHHHIIIIIIIIIIIIJJKKLLLLLMMMNNNNNNNNOOOOOOOOOOOPPPQQRRRRRRRRRSSSSSSUUUUUUVVVWWWXXYYYZZ'.split(
      ''
    );
  gameState.deck = shuffle([...distribution]);
  gameState.pot = [];
  console.log('Deck initialized:', { deckSize: gameState.deck.length });
}

function addPlayer(socketId, playerName) {
  gameState.players[socketId] = {
    name: playerName,
    words: [],
  };
  return gameState;
}

function removePlayer(socketId) {
  delete gameState.players[socketId];
  return gameState;
}

function startNewGame() {
  initializeDeck();
  // Reset all players' word banks
  for (const playerId in gameState.players) {
    gameState.players[playerId].words = [];
  }
  return gameState;
}

function flipLetter() {
  console.log('Attempting to flip letter. Current state:', {
    deckSize: gameState.deck.length,
    potSize: gameState.pot.length,
  });

  if (gameState.deck.length > 0) {
    const letter = gameState.deck.pop();
    gameState.pot.push(letter);
    console.log('Letter flipped:', {
      letter,
      newDeckSize: gameState.deck.length,
      newPotSize: gameState.pot.length,
    });
    return { success: true, state: gameState };
  }
  console.log('Failed to flip letter: deck is empty');
  return { success: false, state: gameState };
}

function claimWord(word, socketId) {
  if (!gameState.players[socketId]) {
    return { success: false, error: 'Player not found in game' };
  }

  const validation = isValidWord(word);
  if (!validation.success) {
    return { success: false, error: validation.reason };
  }

  // Try taking from pot first
  if (tryTakeFromPot(word, gameState.pot, socketId, gameState)) {
    return {
      success: true,
      state: gameState,
      source: 'pot',
      word,
    };
  }

  // Try stealing
  const stealResult = tryToStealWord(word, gameState.pot, socketId, gameState);
  if (stealResult.success) {
    return {
      success: true,
      state: gameState,
      source: 'steal',
      stolenFrom: stealResult.stolenFrom,
      originalWord: stealResult.originalWord,
      word,
    };
  }

  // Return the specific error message from tryToStealWord
  return { success: false, error: stealResult.error };
}

function endGame() {
  if (gameState.deck.length === 0) {
    gameState.isActive = false;
    return { success: true, state: gameState };
  }
  return { success: false, state: gameState };
}

module.exports = {
  gameState,
  addPlayer,
  removePlayer,
  startNewGame,
  flipLetter,
  claimWord,
  endGame,
};
