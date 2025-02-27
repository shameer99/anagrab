const fs = require('fs');
const lemmatizer = require('wink-lemmatizer');
// Load dictionary once at startup
const dictionary = new Set(
  fs
    .readFileSync('./dictionary.txt', 'utf8')
    .split('\n')
    .map(word => word.trim().toLowerCase())
);

function isValidWord(word) {
  if (word.length < 4) {
    return { success: false, reason: 'Word must be at least 4 letters long' };
  }
  if (!dictionary.has(word.toLowerCase())) {
    return { success: false, reason: 'Word not found in dictionary' };
  }
  return { success: true };
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

function isAnagram(word1, word2) {
  return word1.split('').sort().join('') === word2.split('').sort().join('');
}

// Helper function to check if two words share the same root
//Since we do not know the part of speech, we check all possible forms using wink-lemmatizer
function sharesSameRoot(word1, word2) {
  // Get all possible lemma forms for both words
  const word1Forms = [
    lemmatizer.noun(word1.toLowerCase()),
    lemmatizer.verb(word1.toLowerCase()),
    lemmatizer.adjective(word1.toLowerCase()),
  ];

  const word2Forms = [
    lemmatizer.noun(word2.toLowerCase()),
    lemmatizer.verb(word2.toLowerCase()),
    lemmatizer.adjective(word2.toLowerCase()),
  ];

  // Check if any form matches between the two words
  return word1Forms.some(form1 => word2Forms.some(form2 => form1 === form2));
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
    // Check if this is an exact anagram - if so, skip this word
    if (
      (isAnagram(existingWord, word) && existingWord !== word) ||
      sharesSameRoot(existingWord, word)
    )
      continue;

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
    if (!canFormFromPot) return { success: false };

    // Find the player who owns the word
    let stolenFromId;
    for (const [playerId, player] of Object.entries(gameState.players)) {
      const wordIndex = player.words.indexOf(existingWord);
      if (wordIndex !== -1) {
        stolenFromId = playerId;
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

    return {
      success: true,
      stolenFrom: stolenFromId,
      originalWord: existingWord,
    };
  }
  return { success: false };
}

module.exports = {
  dictionary,
  isValidWord,
  shuffle,
  tryTakeFromPot,
  tryToStealWord,
  sharesSameRoot,
};
