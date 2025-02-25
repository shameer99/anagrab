import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Notification = ({ type = 'success', message }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 4500); // Slightly shorter than the 5 second timeout in the hook

    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    if (type === 'success') {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-success-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-error-600"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`notification-${type} flex items-start gap-3`}
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
          onClick={() => setIsVisible(false)}
        >
          <div className="flex-shrink-0">{getIcon()}</div>
          <div>
            <p className="font-medium">{type === 'success' ? 'Success!' : 'Error!'}</p>
            <p className="text-sm mt-1">{message}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
