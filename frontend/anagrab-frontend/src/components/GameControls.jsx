import { motion } from 'framer-motion';

const GameControls = ({ onStartGame, onFlipLetter, onEndGame, deckCount, hasGameStarted }) => {
  const handleStartGame = () => {
    console.log('[UI] Start Game button clicked, hasGameStarted:', hasGameStarted);
    onStartGame();
  };

  const handleFlipLetter = () => {
    console.log('[UI] Flip Letter button clicked, deckCount:', deckCount);
    onFlipLetter();
  };

  const handleEndGame = () => {
    console.log('[UI] End Game button clicked');
    onEndGame();
  };

  return (
    <motion.div
      className="game-card p-3 sm:p-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-row justify-between items-center gap-2 flex-wrap">
        <motion.button
          onClick={handleStartGame}
          className={`button-primary text-sm sm:text-base py-2 px-3 sm:px-4 ${hasGameStarted ? 'bg-secondary-600 hover:bg-secondary-700' : ''}`}
          whileTap={{ scale: 0.95 }}
        >
          {hasGameStarted ? 'Restart Game' : 'Start Game'}
        </motion.button>

        <div className="flex gap-2 items-center">
          {hasGameStarted && (
            <>
              <motion.button
                onClick={handleFlipLetter}
                className="button-primary flex items-center justify-center gap-1 bg-primary-600 px-3 py-2 relative"
                disabled={!hasGameStarted || deckCount === 0}
                whileTap={{ scale: 0.95 }}
                title="Flip Letter"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                >
                  <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v.75c0 1.036.84 1.875 1.875 1.875h17.25c1.035 0 1.875-.84 1.875-1.875v-.75C22.5 3.839 21.66 3 20.625 3H3.375z" />
                  <path
                    fillRule="evenodd"
                    d="M3.087 9l.54 9.176A3 3 0 006.62 21h10.757a3 3 0 002.995-2.824L20.913 9H3.087zm6.163 3.75A.75.75 0 0110 12h4a.75.75 0 010 1.5h-4a.75.75 0 01-.75-.75z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="absolute -top-2 -right-2 bg-white text-primary-700 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-primary-600">
                  {deckCount}
                </span>
              </motion.button>

              <motion.button
                onClick={handleEndGame}
                className="button-secondary text-sm sm:text-base py-2 px-3 sm:px-4"
                whileTap={{ scale: 0.95 }}
                title="End Game"
              >
                End Game
              </motion.button>
            </>
          )}
        </div>
      </div>

      {hasGameStarted && (
        <div className="mt-2 text-center text-slate-600 text-xs sm:text-sm">
          {deckCount > 0 ? (
            <p>
              {deckCount} letter{deckCount !== 1 ? 's' : ''} remaining
            </p>
          ) : (
            <p className="text-error-600 font-medium">No more letters!</p>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default GameControls;
