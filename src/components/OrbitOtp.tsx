import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrbitOtpProps {
  otp: string[];
  onChange: (index: number, value: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  isSuccess: boolean;
  errorMsg: string | null;
  otpInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}

export const OrbitOtp: React.FC<OrbitOtpProps> = ({
  otp,
  onChange,
  onKeyDown,
  onPaste,
  isLoading,
  isSuccess,
  errorMsg,
  otpInputRefs
}) => {
  const [dimensions, setDimensions] = useState({ cellW: 48, gapW: 12 });
  const orbitalRadius = 32; // The radius of the loading orbit
  const N = otp.length;
  const centerIdx = (N - 1) / 2;

  // Track exact screen size for precise orbital collapse math
  useEffect(() => {
    const updateDims = () => {
      if (window.innerWidth >= 640) {
        setDimensions({ cellW: 56, gapW: 16 });
      } else if (window.innerWidth < 380) {
        setDimensions({ cellW: 36, gapW: 8 });
      } else {
        setDimensions({ cellW: 42, gapW: 10 });
      }
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  // Shake animation for error state
  const shakeAnimation = {
    x: [0, -10, 10, -8, 8, -4, 4, 0],
    rotate: 0,
    transition: { duration: 0.5 }
  };

  const parentAnimate = isLoading 
    ? { rotate: 360 } 
    : errorMsg 
      ? shakeAnimation 
      : { rotate: 0, x: 0 };

  const parentTransition = isLoading
    ? { rotate: { repeat: Infinity, duration: 2, ease: "linear" } }
    : { type: "spring" as const, stiffness: 300, damping: 25 };

  return (
    <div className="flex justify-center my-[24px] sm:my-[36px] w-full max-w-full py-[16px] px-[8px] overflow-visible">
      <motion.div 
        className="relative inline-flex gap-[8px] xs:gap-[10px] sm:gap-[16px] items-center justify-center max-w-full min-h-[80px]"
        animate={parentAnimate}
        transition={parentTransition}
      >
        {/* Orbital Track and Hub (Fades in during load) */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center z-0"
            >
              <svg width="120" height="120" viewBox="0 0 120 120" className="overflow-visible">
                <circle 
                  cx="60" cy="60" r={orbitalRadius} 
                  className="stroke-carbon/20"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  fill="none" 
                />
              </svg>
              {/* Central minimalist hub */}
              <div className="absolute w-[8px] h-[8px] bg-carbon rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>

        {otp.map((digit, index) => {
          const isFilled = digit.length > 0;
          let borderColor = 'border-smoke';
          let ringColor = 'focus-within:ring-carbon/20 focus-within:border-carbon';

          if (errorMsg) {
            borderColor = 'border-red-500';
            ringColor = 'focus-within:ring-red-500/20';
          } else if (isSuccess) {
            borderColor = 'border-green-500';
            ringColor = 'focus-within:ring-green-500/20';
          } else if (isFilled) {
            borderColor = 'border-carbon';
          }

          // Orbital math for this specific cell
          const theta = (index / N) * Math.PI * 2;
          const dx = Math.cos(theta) * orbitalRadius;
          const dy = Math.sin(theta) * orbitalRadius;
          const naturalX = (index - centerIdx) * (dimensions.cellW + dimensions.gapW);
          const targetX = dx - naturalX;
          const targetY = dy;

          const childAnimate = isLoading
            ? { 
                x: targetX, 
                y: targetY, 
                scale: 0.35, 
                borderRadius: '50%', 
                rotate: -360, // Counter-rotate to stay upright!
              }
            : { 
                x: 0, 
                y: 0, 
                scale: 1, 
                borderRadius: '8px', 
                rotate: 0,
              };

          const childTransition = isLoading
            ? { 
                rotate: { repeat: Infinity, duration: 2, ease: "linear" },
                x: { type: "spring" as const, stiffness: 200, damping: 25 },
                y: { type: "spring" as const, stiffness: 200, damping: 25 },
                scale: { duration: 0.4 },
                borderRadius: { duration: 0.4 }
              }
            : { type: "spring" as const, stiffness: 300, damping: 25 };

          return (
            <motion.div
              key={index}
              initial={false}
              animate={childAnimate}
              transition={childTransition}
              className={`
                relative w-[36px] h-[46px] xs:w-[42px] xs:h-[52px] sm:w-[56px] sm:h-[64px] 
                border ${isLoading ? 'border-carbon bg-carbon' : borderColor + ' bg-paper'}
                transition-colors duration-300 z-10
                ${ringColor} focus-within:ring-2
                overflow-hidden shadow-sm rounded-lg
              `}
            >
              {/* Preserved Rotating Digit Animation */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <AnimatePresence mode="popLayout">
                  {digit && !isLoading && (
                    <motion.span
                      key={digit}
                      initial={{ y: 10, opacity: 0, filter: 'blur(4px)', scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, filter: 'blur(0px)', scale: 1 }}
                      exit={{ y: -10, opacity: 0, filter: 'blur(4px)', scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
                      className={`
                        text-[20px] sm:text-[24px] font-bold absolute font-sans
                        ${errorMsg ? 'text-red-500' : isSuccess ? 'text-green-500' : 'text-carbon'}
                      `}
                    >
                      {digit}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {/* The Actual Input */}
              <input
                ref={(el) => { otpInputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => onChange(index, e.target.value)}
                onKeyDown={(e) => onKeyDown(index, e)}
                onPaste={index === 0 ? onPaste : undefined}
                disabled={isLoading || isSuccess}
                className={`
                  absolute inset-0 w-full h-full text-center
                  text-transparent caret-carbon
                  bg-transparent outline-none
                  disabled:cursor-not-allowed
                `}
                style={{
                  caretColor: errorMsg ? '#ef4444' : isSuccess ? '#22c55e' : '#111'
                }}
              />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
