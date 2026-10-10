import { useState, useEffect, useId } from 'react';
import { animate, useMotionValue, motion } from 'framer-motion';

interface GooeyPaginationProps {
  total: number;
  activeIndex: number;
  progressFloat?: number;
  onSelect?: (index: number) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle';
  duration?: number;
  autoplayDuration?: number;
  className?: string;
}

export default function GooeyPagination({
  total,
  activeIndex,
  progressFloat,
  onSelect,
  size = 'md',
  variant = 'default',
  duration = 0.85,
  autoplayDuration,
  className = '',
}: GooeyPaginationProps) {
  const rawId = useId();
  const filterId = `gooey-meta-${rawId.replace(/:/g, '')}`;
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  if (total <= 1) return null;

  // Small, perfectly round dots size configuration
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  const dotSize = isSm ? 8 : isLg ? 12 : 10;
  const dotGap = isSm ? 18 : isLg ? 28 : 24;
  const containerHeight = isSm ? 16 : isLg ? 24 : 20;

  const targetValue = typeof progressFloat === 'number' && !isNaN(progressFloat) ? progressFloat : activeIndex;
  const animProgress = useMotionValue(targetValue);
  const [currentProgress, setCurrentProgress] = useState(targetValue);

  // Smoothly animate currentProgress frame-by-frame across index transitions
  useEffect(() => {
    const target = typeof progressFloat === 'number' && !isNaN(progressFloat) ? progressFloat : activeIndex;
    const animDuration = prefersReducedMotion ? 0.01 : duration;

    const controls = animate(animProgress, target, {
      duration: animDuration,
      ease: [0.16, 1, 0.3, 1], // Luxuriously smooth gel curve
      onUpdate: (latest) => {
        setCurrentProgress(latest);
      },
    });

    return () => controls.stop();
  }, [activeIndex, progressFloat, duration, prefersReducedMotion]);

  const clampedProgress = Math.max(0, Math.min(total - 1, currentProgress));
  const floor = Math.floor(clampedProgress);
  const t = clampedProgress - floor; // fractional progression between 0 and 1

  // Viscous Gel Fluid Physics Differential Model:
  // Front edge stretches forward rapidly (sin phase), trailing edge hangs back (cos phase)
  // causing gel extension in mid-flight and elastic snap-back upon arrival.
  const tFront = Math.sin((t * Math.PI) / 2);
  const tBack = 1 - Math.cos((t * Math.PI) / 2);

  const frontX = floor * dotGap + tFront * dotGap + dotSize;
  const backX = floor * dotGap + tBack * dotGap;

  const blobX = backX;
  const blobW = Math.max(dotSize, frontX - backX);

  // Gel surface tension vertical pinching (thins slightly in middle, expands back on landing)
  const gelPinch = Math.sin(t * Math.PI);
  const gelHeight = dotSize * (1 - 0.22 * gelPinch);

  const totalWidth = (total - 1) * dotGap + dotSize;

  // SVG filter tuning for viscous organic gel metaball surface tension
  const stdDev = variant === 'subtle' ? 1.8 : (isSm ? 2.0 : 2.6);
  const matrixValues = variant === 'subtle'
    ? "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 16 -6"
    : "1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9";

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Isolated SVG Filter for Gel Metaball Liquid Surface Tension */}
      {!prefersReducedMotion && (
        <svg 
          className="absolute w-0 h-0 pointer-events-none" 
          aria-hidden="true" 
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        >
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation={stdDev} result="blur" />
              <feColorMatrix in="blur" mode="matrix" values={matrixValues} result="goo" />
              <feBlend in="SourceGraphic" in2="goo" />
            </filter>
          </defs>
        </svg>
      )}

      {/* Filtered Container for Gel Liquid Bridge Connection */}
      <div
        className="relative"
        style={{
          filter: prefersReducedMotion ? 'none' : `url(#${filterId})`,
          WebkitFilter: prefersReducedMotion ? 'none' : `url(#${filterId})`,
          width: `${totalWidth}px`,
          height: `${containerHeight}px`,
        }}
      >
        {/* Stationary Inactive Small Round Dots */}
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.(i);
            }}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              position: 'absolute',
              left: `${i * dotGap}px`,
              top: `calc(50% - ${dotSize / 2}px)`,
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              borderRadius: '50%',
            }}
            className={`transition-colors cursor-pointer ${
              variant === 'subtle'
                ? 'bg-black/25 dark:bg-white/30 hover:bg-black/50 dark:hover:bg-white/60'
                : 'bg-black/25 dark:bg-white/30 hover:bg-black/50 dark:hover:bg-white/60'
            }`}
          />
        ))}

        {/* Dynamic Viscous Gel Active Liquid Blob with Steady Gel Wiggle */}
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${blobX}px`,
            width: `${blobW}px`,
            top: `calc(50% - ${gelHeight / 2}px)`,
            height: `${gelHeight}px`,
          }}
        >
          <motion.div
            className="w-full h-full bg-[var(--color-carbon)] dark:bg-white overflow-hidden relative"
            style={{
              borderRadius: `${gelHeight / 2}px`,
            }}
            animate={prefersReducedMotion ? {} : {
              scaleX: [1, 1.08, 0.93, 1.05, 0.97, 1],
              scaleY: [1, 0.93, 1.07, 0.96, 1.03, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.4,
              ease: "easeInOut",
            }}
          >
            {/* Auto-scroll Loading Progress Fill */}
            {autoplayDuration ? (
              <motion.div
                key={activeIndex}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: autoplayDuration, ease: 'linear' }}
                className="absolute inset-0 bg-gold dark:bg-gold rounded-full origin-left opacity-90"
                style={{ transformOrigin: 'left center' }}
              />
            ) : null}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
