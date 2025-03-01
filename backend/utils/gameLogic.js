const fs = require('fs');

const lemmatizer = require('wink-lemmatizer');

// Load dictionary once at startup
const dictionary = new Set(
  fs
    .readFileSync('./dictionary.txt', 'utf8')
    .split('\n')
    .map(word => word.trim().toLowerCase())
);

// Load transformation whitelist
const transformationWhitelist = JSON.parse(
  fs.readFileSync('./data/transformationWhitelist.json', 'utf8')
);

// Create a map for quick lookup of whitelisted transformations
const whitelistedTransformations = new Map();
transformationWhitelist.transformations.forEach(transformation => {
  // Store both directions for easy lookup
  whitelistedTransformations.set(
    `${transformation.word1.toLowerCase()}-${transformation.word2.toLowerCase()}`,
    true
  );
  whitelistedTransformations.set(
    `${transformation.word2.toLowerCase()}-${transformation.word1.toLowerCase()}`,
    true
  );
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

  // this breaks expected false cases like flow -> flower, line -> liner, etc
  return commonSuffixes.some(suffix => word2.endsWith(suffix));
}

// Helper function to check if two words share the same root
//Since we do not know the part of speech, we check all possible forms using wink-lemmatizer
function sharesSameRootOld(word1, word2) {
  word1 = word1.toLowerCase();
  word2 = word2.toLowerCase();

  // First try the lemmatizer
  let word1Forms = [lemmatizer.noun(word1), lemmatizer.verb(word1), lemmatizer.adjective(word1)];

  let word2Forms = [lemmatizer.noun(word2), lemmatizer.verb(word2), lemmatizer.adjective(word2)];

  // remove own word from forms
  word1Forms = word1Forms.filter(form => form !== word1);
  word2Forms = word2Forms.filter(form => form !== word2);

  // Check if any form matches between the two words
  if (word1Forms.some(form1 => word2Forms.some(form2 => form1 === form2))) {
    return true;
  }

  // // If no match with lemmatizer, check custom word roots mapping
  // if (wordRoots[word1] && wordRoots[word2]) {
  //   if (wordRoots[word1] === wordRoots[word2]) {
  //     return true;
  //   }
  // }

  return false;
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
    if (isAnagram(existingWord, word) && existingWord !== word) {
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
