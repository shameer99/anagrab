import { motion } from 'framer-motion';

const LetterTile = ({ letter, isNew = false }) => {
  return (
    <motion.div
      className={`letter-tile ${isNew ? 'available-letter' : ''}`}
      initial={isNew ? { rotateY: 90, opacity: 0 } : { opacity: 1 }}
      animate={{ rotateY: 0, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        duration: 0.5,
      }}
    >
      {letter}
    </motion.div>
  );
};

export default LetterTile;
