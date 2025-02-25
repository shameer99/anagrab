import { motion } from 'framer-motion';

const PlayerSection = ({ player, isCurrentPlayer = false, isOpponent = false }) => {
  const { name, words = [] } = player;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 25 },
    },
  };

  return (
    <motion.div
      className={`game-card p-3 sm:p-4 ${isCurrentPlayer ? 'border-l-4 border-primary-500' : ''} ${isOpponent ? 'border-l-4 border-secondary-500' : ''}`}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex items-center justify-between mb-2">
        <h3
          className={`font-semibold text-base sm:text-lg ${isCurrentPlayer ? 'text-primary-700' : isOpponent ? 'text-secondary-700' : 'text-slate-700'}`}
        >
          {isCurrentPlayer ? 'You' : name}
          {isCurrentPlayer && (
            <span className="text-slate-500 ml-2 font-normal text-xs sm:text-sm">({name})</span>
          )}
        </h3>
        <span className="bg-slate-100 text-slate-700 text-xs sm:text-sm font-medium px-2 py-0.5 rounded">
          {words.length} word{words.length !== 1 ? 's' : ''}
        </span>
      </div>

      {words.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {words.map((word, index) => (
            <motion.span
              key={`${word}-${index}`}
              className="word-tag text-xs sm:text-sm px-1.5 py-0.5 sm:px-2 sm:py-1"
              variants={wordVariants}
              whileHover={{ scale: 1.05 }}
            >
              {word}
            </motion.span>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-xs sm:text-sm italic">No words claimed yet</p>
      )}
    </motion.div>
  );
};

export default PlayerSection;
