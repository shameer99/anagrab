import React, { useState, useEffect } from 'react';

export const AlphabetDisplay = ({ letters = [] }) => {
  // Create a map to count occurrences of each letter
  const letterCounts = letters.reduce((counts, letter) => {
    counts[letter] = (counts[letter] || 0) + 1;
    return counts;
  }, {});

  // Create an array of all 26 letters
  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  // State to store the rows of letters
  const [rows, setRows] = useState([]);

  // Calculate the optimal number of rows based on screen width
  useEffect(() => {
    const calculateRows = () => {
      const width = window.innerWidth;
      let lettersPerRow;

      if (width <= 480) {
        lettersPerRow = 7; // 7 letters per row on very small screens (4 rows)
      } else if (width <= 768) {
        lettersPerRow = 9; // 9 letters per row on mobile (3 rows)
      } else {
        lettersPerRow = 13; // 13 letters per row on larger screens (2 rows)
      }

      // Split the alphabet into rows
      const newRows = [];
      for (let i = 0; i < alphabet.length; i += lettersPerRow) {
        newRows.push(alphabet.slice(i, i + lettersPerRow));
      }

      setRows(newRows);
    };

    // Calculate initially
    calculateRows();

    // Recalculate on window resize
    window.addEventListener('resize', calculateRows);

    // Cleanup
    return () => window.removeEventListener('resize', calculateRows);
  }, []);

  return (
    <div className="alphabet-display">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="alphabet-row">
          {row.map(letter => {
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
      ))}
    </div>
  );
};
