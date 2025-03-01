import React from 'react';

export const AlphabetDisplay = ({ letters = [] }) => {
  // Create a map to count occurrences of each letter
  const letterCounts = letters.reduce((counts, letter) => {
    counts[letter] = (counts[letter] || 0) + 1;
    return counts;
  }, {});

  // Create an array of all 26 letters
  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  return (
    <div className="alphabet-display">
      {alphabet.map(letter => {
        const count = letterCounts[letter] || 0;
        const isAvailable = count > 0;

        return (
          <div
            key={letter}
            className={`alphabet-letter ${isAvailable ? 'available' : 'unavailable'}`}
          >
            {letter}
            {isAvailable && <span className="letter-count">{count}</span>}
          </div>
        );
      })}
    </div>
  );
};
