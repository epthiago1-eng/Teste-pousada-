import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PreloaderProps {
  isLoading: boolean;
  message?: string;
  logoUrl?: string;
  establishmentName?: string;
}

export const Preloader: React.FC<PreloaderProps> = ({ 
  isLoading, 
  message = 'Carregando...',
  logoUrl,
  establishmentName = 'PousadaGest'
}) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] bg-indigo-600 flex flex-col items-center justify-center text-white"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-white/20 border-t-white rounded-full"
              />
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-full bg-white" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-2xl font-bold tracking-tighter">PG</span>
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2">{establishmentName}</h2>
            <p className="text-indigo-200">{message}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
