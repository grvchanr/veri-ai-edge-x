import React, { useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadToastProps {
  /** Show the toast when true */
  show: boolean;
  /** Called when the toast auto‑closes */
  onClose?: () => void;
}

/**
 * Small toast that appears after a successful upload.
 * Uses Framer Motion for a lightweight fade/slide animation.
 */
const UploadToast: React.FC<UploadToastProps> = ({ show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-4 right-4 bg-cyber-accent/10 border border-cyber-accent text-cyber-accent px-4 py-2 rounded shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-cyber-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>Upload complete! Analysis started.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(UploadToast);
