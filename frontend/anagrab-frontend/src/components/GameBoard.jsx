import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LetterTile from './LetterTile';

const GameBoard = ({ letters, onClaimWord, animateNewLetter, isGameInProgress }) => {
  const [wordInput, setWordInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = e => {
    e.preventDefault();

    if (!wordInput.trim()) {
      setError('Please enter a word');
      return;
    }

    onClaimWord(wordInput);
    setWordInput('');
    setError('');
  };

  return (
    <motion.div
      className="game-card p-3 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-lg sm:text-xl font-semibold text-primary-900 mb-2 sm:mb-3 text-center">
        Letter Pool
      </h2>

      {/* Letter Display */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-2 sm:p-4 mb-3 sm:mb-4 min-h-[100px] flex items-center justify-center">
        {letters.length === 0 ? (
          <p className="text-slate-500 text-center italic text-sm sm:text-base">
            {isGameInProgress ? 'Flip a letter to start playing!' : 'Start a new game to begin!'}
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
            <AnimatePresence>
              {letters.map((letter, index) => (
                <LetterTile
                  key={`${letter}-${index}`}
                  letter={letter}
                  isNew={index === letters.length - 1 && animateNewLetter}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Word Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label
            htmlFor="wordInput"
            className="block text-xs sm:text-sm font-medium text-slate-700 mb-1"
          >
            Enter Word to Claim
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="wordInput"
              value={wordInput}
              onChange={e => {
                setWordInput(e.target.value.toUpperCase());
                setError('');
              }}
              className="input-primary flex-grow py-2 px-3 text-sm sm:text-base"
              placeholder="Type your word here"
              disabled={!isGameInProgress || letters.length === 0}
              autoComplete="off"
            />
            <motion.button
              type="submit"
              className="button-primary whitespace-nowrap py-2 px-3 text-sm sm:text-base"
              disabled={!isGameInProgress || letters.length === 0}
              whileTap={{ scale: 0.95 }}
            >
              Claim
            </motion.button>
          </div>
          {error && <p className="text-error-600 text-xs sm:text-sm mt-1">{error}</p>}
        </div>
      </form>

      {!isGameInProgress && (
        <div className="mt-2 p-2 sm:p-3 bg-primary-50 rounded-lg text-primary-800 text-xs sm:text-sm">
          <strong>Tip:</strong> Start a new game to begin playing!
        </div>
      )}
    </motion.div>
  );
};

export default GameBoard;
