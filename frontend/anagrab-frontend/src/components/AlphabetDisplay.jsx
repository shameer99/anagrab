import React, { useState, useEffect, useRef } from 'react';

export const AlphabetDisplay = ({ letters = [] }) => {
  const prevLetterCountsRef = useRef({});
  const [updatedLetters, setUpdatedLetters] = useState(new Set());
  const [recentLetter, setRecentLetter] = useState(null);

  // Create a map to count occurrences of each letter
  const letterCounts = letters.reduce((counts, letter) => {
    counts[letter] = (counts[letter] || 0) + 1;
    return counts;
  }, {});

  // Check for updates in letter counts
  useEffect(() => {
    const newUpdatedLetters = new Set();

    // Compare current counts with previous counts
    Object.entries(letterCounts).forEach(([letter, count]) => {
      if (count > (prevLetterCountsRef.current[letter] || 0)) {
        newUpdatedLetters.add(letter);
        // Set this as the most recent letter
        setRecentLetter(letter);
      }
    });

    if (newUpdatedLetters.size > 0) {
      setUpdatedLetters(newUpdatedLetters);
      // Reset only the pop animation after a delay
      setTimeout(() => {
        setUpdatedLetters(new Set());
      }, 500);
    }

    // Store current counts for next comparison
    prevLetterCountsRef.current = letterCounts;
  }, [letters, letterCounts]);

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
            const isUpdated = updatedLetters.has(letter);
            const isRecent = letter === recentLetter;

            return (
              <div
                key={letter}
                className={`alphabet-letter ${isAvailable ? 'available' : 'unavailable'}`}
                data-updated={isUpdated}
                data-recent={isRecent}
              >
                {letter}
                {isAvailable && (
                  <span className="letter-count" data-updated={isUpdated}>
                    {count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
