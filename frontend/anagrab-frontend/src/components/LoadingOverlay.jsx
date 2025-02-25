import { motion } from 'framer-motion';

const LoadingOverlay = () => {
  return (
    <motion.div
      className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-xl p-6 flex flex-col items-center"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="relative w-16 h-16 mb-4">
          {/* Animated spinner */}
          <div className="absolute inset-0 border-4 border-primary-100 rounded-full"></div>
          <motion.div
            className="absolute inset-0 border-4 border-t-primary-600 border-r-transparent border-b-transparent border-l-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          ></motion.div>
        </div>
        <p className="text-slate-700 font-medium">Loading...</p>
      </motion.div>
    </motion.div>
  );
};

export default LoadingOverlay;
