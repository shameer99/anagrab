const fs = require('fs');

// Load dictionary once at startup
const dictionary = new Set(
  fs
    .readFileSync('./dictionary.txt', 'utf8')
    .split('\n')
    .map(word => word.trim().toLowerCase())
);

// Load transformation whitelist and blacklist
const transformationWhitelist = JSON.parse(
  fs.readFileSync('./data/transformationWhitelist.json', 'utf8')
);

const transformationBlacklist = JSON.parse(
  fs.readFileSync('./data/transformationBlacklist.json', 'utf8')
);

// Create maps for quick lookup of whitelisted and blacklisted transformations
const whitelistedTransformations = new Map();
const blacklistedTransformations = new Map();

transformationWhitelist.transformationGroups.forEach(group => {
  const baseWord = group.baseWord.toLowerCase();
  const variations = group.variations.map(v => v.toLowerCase());

  // Store base word to variations mappings
  variations.forEach(variation => {
    whitelistedTransformations.set(`${baseWord}-${variation}`, true);
    whitelistedTransformations.set(`${variation}-${baseWord}`, true);

    // Also store plural form of base word
    const pluralBase = baseWord + 's';
    whitelistedTransformations.set(`${pluralBase}-${variation}`, true);
    whitelistedTransformations.set(`${variation}-${pluralBase}`, true);
  });

  // Store variation to variation mappings
  for (let i = 0; i < variations.length; i++) {
    for (let j = i + 1; j < variations.length; j++) {
      whitelistedTransformations.set(`${variations[i]}-${variations[j]}`, true);
      whitelistedTransformations.set(`${variations[j]}-${variations[i]}`, true);
    }
  }
});

transformationBlacklist.transformationGroups.forEach(group => {
  const baseWord = group.baseWord.toLowerCase();
  const variations = group.variations.map(v => v.toLowerCase());

  variations.forEach(variation => {
    blacklistedTransformations.set(`${baseWord}-${variation}`, true);
    blacklistedTransformations.set(`${variation}-${baseWord}`, true);
  });
});

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

function tryTakeFromPot(word, pot, playerToken, game) {
  const letters = [...word];
  const potCopy = [...pot];

  // Try to find each letter in the pot
  for (const letter of letters) {
    const index = potCopy.indexOf(letter);
    if (index === -1) {
      return false;
    }
    potCopy.splice(index, 1);
  }

  // If we found all letters, update the game state
  game.pot = potCopy;
  game.players[playerToken].words.push(word);
  return true;
}

function isExactAnagram(word1, word2) {
  return word1.split('').sort().join('') === word2.split('').sort().join('');
}

function sharesSameRoot(word1, word2) {
  word1 = word1.toLowerCase();
  word2 = word2.toLowerCase();

  // Check if this pair is in the whitelist
  if (
    whitelistedTransformations.has(`${word1}-${word2}`) ||
    whitelistedTransformations.has(`${word2}-${word1}`)
  ) {
    return false;
  }

  // Check if this pair is in the blacklist
  if (
    blacklistedTransformations.has(`${word1}-${word2}`) ||
    blacklistedTransformations.has(`${word2}-${word1}`)
  ) {
    return true;
  }

  if (word1 === word2) {
    return true;
  }

  // ensure word2 is longer than word1
  if (word2.length <= word1.length) {
    console.error('word2 expected to be longer than word1');
    return false;
  }

  // return false if word2 doesn't start with (word1 - word1's last letter)
  if (!word2.startsWith(word1.slice(0, -1))) {
    return false;
  }

  if (word2.length - word1.length > 4) {
    return false;
  }

  // check if word2 ends with any of the common suffixes
  const commonSuffixes = [
    'er',
    'ing',
    'es',
    's',
    'ed',
    'en',
    'est',
    'ly',
    'ful',
    'less',
    'ness',
    'ment',
    'able',
    'ible',
    'ize',
    'ise',
    'ify',
    'ship',
    'hood',
    'dom',
    'ion',
  ];

  return commonSuffixes.some(suffix => word2.endsWith(suffix));
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
    // Check if this is an exact anagram or shares same root - if so, return specific error
    if (isExactAnagram(existingWord, word) && existingWord !== word) {
      return {
        success: false,
        error: 'Anagrams are not allowed - must change the root of the word',
      };
    }

    if (sharesSameRoot(existingWord, word)) {
      return {
        success: false,
        error: 'Must change the root of the word (adding -s, -ing, -er etc. is not allowed)',
      };
    }

    let remainingLetters = [...wordLetters];
    let canUseExistingWord = true;

    // Remove letters from existing word
    for (const letter of existingWord) {
      const index = remainingLetters.indexOf(letter);
      if (index === -1) {
        canUseExistingWord = false;
        break;
      }
      remainingLetters.splice(index, 1);
    }

    if (!canUseExistingWord) continue;

    // Check if remaining letters are available in pot
    let canFormFromPot = true;
    for (const letter of remainingLetters) {
      const potIndex = potLetters.indexOf(letter);
      if (potIndex === -1) {
        canFormFromPot = false;
        break;
      }
      potLetters.splice(potIndex, 1);
    }

    if (!canFormFromPot) {
      return {
        success: false,
        error: 'Insufficient letters available to form this word',
      };
    }

    // If we get here with an existing word, we can successfully steal
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

  return {
    success: false,
    error: 'No valid word found that can be used for stealing',
  };
}

module.exports = {
  dictionary,
  isValidWord,
  shuffle,
  tryTakeFromPot,
  tryToStealWord,
  sharesSameRoot,
};
