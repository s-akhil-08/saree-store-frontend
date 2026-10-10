import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGuestLimit } from '../context/GuestLimitContext';
import { useEffect } from 'react';

export default function GuestLimitPopup() {
  const { showPopup, closePopup } = useGuestLimit();
  const navigate = useNavigate();

  // Prevent background scrolling when popup is open
  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showPopup]);

  const handleLogin = () => {
    closePopup();
    navigate('/login');
  };

  const handleSignup = () => {
    closePopup();
    navigate('/signup');
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div 
          key="guest-popup-container"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-carbon/20 backdrop-blur-md"
            onClick={closePopup}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[400px] bg-paper p-[32px] md:p-[40px] rounded-lg shadow-xl overflow-hidden flex flex-col items-center text-center z-10"
          >
            <button 
              onClick={closePopup}
              className="absolute top-[12px] right-[12px] p-[8px] text-graphite hover:text-carbon hover:bg-stone rounded-full transition-colors"
              aria-label="Close popup"
            >
              <X className="w-[18px] h-[18px]" />
            </button>

            <h2 className="text-display !text-[22px] mb-[12px]">Want to explore more?</h2>
            <p className="text-[13px] text-graphite mb-[24px] leading-relaxed px-[12px]">
              Create an account or log in to continue exploring our exclusive handwoven collection.
            </p>

            <div className="flex flex-col sm:flex-row w-full gap-[12px]">
              <button 
                onClick={handleLogin}
                className="flex-1 px-[24px] py-[12px] border border-carbon text-carbon rounded text-[11px] hover:bg-stone transition-colors font-bold uppercase tracking-wider"
              >
                Login
              </button>
              <button 
                onClick={handleSignup}
                className="flex-1 px-[24px] py-[12px] bg-carbon text-paper border border-carbon rounded text-[11px] hover:bg-carbon/90 transition-colors font-bold uppercase tracking-wider shadow-sm"
              >
                Sign Up
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
