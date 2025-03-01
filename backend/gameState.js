const { shuffle, isValidWord, tryTakeFromPot, tryToStealWord } = require('./utils/gameLogic');

let io;

const gameState = {
  players: {},
  pot: [],
  deck: [],
  isActive: true,
  turn: 0, // Index of the current player in the playerOrder array
  playerOrder: [], // Player IDs in order of turns
};

const timerSeconds = 10;
timer = null;

function setIo(socketIo) {
  io = socketIo; // Save the io reference so we can emit events from here
}

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
  if (!gameState.playerOrder.includes(socketId)) {
    gameState.players[socketId] = {
      name: playerName,
      words: [],
    };
    gameState.playerOrder.push(socketId);
  }
  return gameState;
}

function removePlayer(socketId) {
  delete gameState.players[socketId];
  gameState.playerOrder = gameState.playerOrder.filter(player => player !== socketId);
  return gameState;
}

function getCurrentPlayer() {
  return gameState.playerOrder[gameState.turn % gameState.playerOrder.length];
}

function startNewGame() {
  initializeDeck();
  gameState.playerOrder = [];
  // Reset all players' word banks
  for (const playerId in gameState.players) {
    gameState.players[playerId].words = [];
    gameState.playerOrder.push(playerId);
  }
  gameState.turn = 1;

  return gameState;
}

function flipLetter(socketId) {
  const currentPlayerTurn = getCurrentPlayer();

  if (socketId !== currentPlayerTurn) {
    console.log('Incorrect player tried to flip', {
      attemptedFlipPlayer: socketId,
      currentPlayer: currentPlayerTurn,
    });
    return { success: false, state: gameState };
  }

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
    gameState.turn += 1;
    startNewTimer();
    return { success: true, state: gameState };
  }
  console.log('Failed to flip letter: deck is empty');
  return { success: false, state: gameState };
}

function startNewTimer() {
  // If there is an active timeout, cancel it
  console.log('Started Timer');
  if (timer !== null && timer !== undefined) {
    console.log('Timer reset!');
    clearInterval(timer);
  }
  timer = setInterval(() => {
    flipLetter(getCurrentPlayer());
    io.emit('game_state_update', gameState);
  }, 1000 * timerSeconds);
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
  setIo,
};
