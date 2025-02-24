const fs = require('fs');

// Load dictionary once at startup
const dictionary = new Set(
  fs
    .readFileSync('./dictionary.txt', 'utf8')
    .split('\n')
    .map(word => word.trim().toLowerCase())
);

function isValidWord(word) {
  return dictionary.has(word.toLowerCase()) && word.length >= 4;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function tryTakeFromPot(word, pot, socketId, gameState) {
  const potLetters = [...pot];
  const wordLetters = word.split('');

  // Check if word can be formed
  for (const letter of wordLetters) {
    const index = potLetters.indexOf(letter);
    if (index === -1) return false;
    potLetters.splice(index, 1);
  }

  // Add word to player's words
  gameState.players[socketId].words.push(word);

  // Remove letters from pot
  for (const letter of wordLetters) {
    const index = gameState.pot.indexOf(letter);
    if (index !== -1) {
      gameState.pot.splice(index, 1);
    }
  }

  return true;
}

function tryToStealWord(word, pot, socketId, gameState) {
  const potLetters = [...pot];
  const wordLetters = word.split('');

  // Get all words from all players
  const allPlayerWords = Object.values(gameState.players).reduce((words, player) => {
    return words.concat(player.words);
  }, []);

  // Try each existing word to see if it can be used for stealing
  for (const existingWord of allPlayerWords) {
    if (existingWord === word) continue;

    let remainingLetters = [...wordLetters];
    let canUseExistingWord = true;

    for (const letter of existingWord) {
      const index = remainingLetters.indexOf(letter);
      if (index === -1) {
        canUseExistingWord = false;
        break;
      }
      remainingLetters.splice(index, 1);
    }

    if (!canUseExistingWord) continue;

    let canFormFromPot = true;
    for (const letter of remainingLetters) {
      const potIndex = potLetters.indexOf(letter);
      if (potIndex === -1) {
        canFormFromPot = false;
        break;
      }
      potLetters.splice(potIndex, 1);
    }
    if (!canFormFromPot) return false;

    // Remove the word from the original player
    for (const [playerId, player] of Object.entries(gameState.players)) {
      const wordIndex = player.words.indexOf(existingWord);
      if (wordIndex !== -1) {
        player.words.splice(wordIndex, 1);
        break;
      }
    }

    // Add the new word to the current player's words
    gameState.players[socketId].words.push(word);

    // Remove used letters from pot
    for (const letter of remainingLetters) {
      const index = gameState.pot.indexOf(letter);
      if (index !== -1) {
        gameState.pot.splice(index, 1);
      }
    }

    return true;
  }
  return false;
}

module.exports = {
  dictionary,
  isValidWord,
  shuffle,
  tryTakeFromPot,
  tryToStealWord,
};
