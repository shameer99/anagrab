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

function canMakeNewWord(existingWord, targetWord, pot) {
  // Convert words to lowercase for comparison
  existingWord = existingWord.toLowerCase();
  targetWord = targetWord.toLowerCase();
  // Convert pot to lowercase for case-insensitive matching
  const lowerPot = pot.map(letter => letter.toLowerCase());

  // If words are the same, can't steal
  if (existingWord === targetWord) {
    return { success: false };
  }

  if (isExactAnagram(existingWord, targetWord)) {
    return { success: false };
  }

  // If words share same root, can't steal
  if (sharesSameRoot(existingWord, targetWord)) {
    return { success: false };
  }

  // Create arrays of letters for comparison
  const existingLetters = [...existingWord];
  const targetLetters = [...targetWord];
  const potCopy = [...lowerPot];

  // Try to find each target letter in either existing word or pot
  for (const targetLetter of targetLetters) {
    const existingIndex = existingLetters.indexOf(targetLetter);
    if (existingIndex !== -1) {
      // Letter found in existing word, remove it from consideration
      existingLetters.splice(existingIndex, 1);
    } else {
      // Letter not in existing word, try to find in pot
      const potIndex = potCopy.indexOf(targetLetter);
      if (potIndex === -1) {
        // Letter not found in pot either
        return { success: false };
      }
      // Letter found in pot, remove it from consideration
      potCopy.splice(potIndex, 1);
    }
  }

  // Map the remaining lowercase pot letters back to their original case
  const newPot = pot.filter((letter, index) => potCopy.includes(letter.toLowerCase()));

  // If we got here, we found all needed letters
  return {
    success: true,
    newPot: newPot,
  };
}

function tryToStealWord(word, pot, playerToken, game) {
  // Check if any player has a word that could be modified into the target word
  for (const [targetToken, targetPlayer] of Object.entries(game.players)) {
    for (const existingWord of targetPlayer.words) {
      const result = canMakeNewWord(existingWord, word, pot);
      if (result.success) {
        // Remove the stolen word
        const wordIndex = targetPlayer.words.indexOf(existingWord);
        targetPlayer.words.splice(wordIndex, 1);

        // Update the pot
        game.pot = result.newPot;

        // Add the new word to the player's list
        game.players[playerToken].words.push(word);

        return {
          success: true,
          stolenFrom: targetToken,
          originalWord: existingWord,
        };
      }
    }
  }

  return {
    success: false,
    error: 'Cannot make this word from the pot or by modifying existing words',
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
