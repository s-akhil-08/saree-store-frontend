import { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollCordProps {
  onToggle: () => void;
  isDark: boolean;
}

const PULL_MAX = 72;        // max px the cord bob travels downward
const SCROLL_MAP = 220;     // px of scroll that equals full pull
const TRIGGER_RATIO = 0.62; // trigger toggle when pull >= 62% of max
const RESET_RATIO  = 0.20; // reset trigger flag when pull falls below 20%

export default function ScrollCord({ onToggle, isDark }: ScrollCordProps) {
  const [pull, setPull] = useState(0);          // 0..PULL_MAX
  const [hint, setHint] = useState(true);
  const [flash, setFlash] = useState(false);     // glow flash on toggle
  const triggered = useRef(false);
  const rafId = useRef<number | null>(null);
  const targetPull = useRef(0);
  const currentPull = useRef(0);

  // Smooth lerp toward target
  const animate = useCallback(() => {
    const diff = targetPull.current - currentPull.current;
    if (Math.abs(diff) > 0.3) {
      currentPull.current += diff * 0.14;
      setPull(currentPull.current);
      rafId.current = requestAnimationFrame(animate);
    } else {
      currentPull.current = targetPull.current;
      setPull(currentPull.current);
      rafId.current = null;
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const ratio = Math.min(window.scrollY / SCROLL_MAP, 1);
      targetPull.current = ratio * PULL_MAX;

      // Hide hint after first scroll
      if (window.scrollY > 8 && hint) setHint(false);

      // Trigger toggle once per full pull
      if (!triggered.current && ratio >= TRIGGER_RATIO) {
        triggered.current = true;
        onToggle();
        setFlash(true);
        setTimeout(() => setFlash(false), 400);
      }
      // Reset trigger when scrolled back up
      if (triggered.current && ratio <= RESET_RATIO) {
        triggered.current = false;
      }

      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [onToggle, hint, animate]);

  // Fade out hint after 4s
  useEffect(() => {
    const t = setTimeout(() => setHint(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // Derived geometry
  const cordTop = 0;
  const cordLength = 52 + pull;       // rope from ceiling to bob
  const bobY = cordLength + 4;        // circle center y
  const svgH = bobY + 14;

  // Color tokens matched to theme
  const ropeColor   = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(30,20,10,0.45)';
  const bobFill     = isDark ? '#e8d5b7' : '#1e1408';
  const bobStroke   = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)';
  const glowColor   = flash
    ? (isDark ? '#f0c060' : '#6d28d9')
    : 'transparent';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: '18px',
        zIndex: 35,           // below header z-40, above page
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
      aria-label="Scroll to toggle theme"
    >
      {/* SVG cord */}
      <svg
        width="20"
        height={svgH}
        viewBox={`0 0 20 ${svgH}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* Ceiling anchor bracket */}
        <rect x="7" y={cordTop} width="6" height="4" rx="1.5" fill={ropeColor} />

        {/* Rope — two lines for slight twist effect */}
        <line
          x1="9.5" y1={cordTop + 4}
          x2="9.5" y2={bobY - 8}
          stroke={ropeColor}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <line
          x1="10.5" y1={cordTop + 4}
          x2="10.5" y2={bobY - 8}
          stroke={ropeColor}
          strokeWidth="1"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />

        {/* Glow ring on toggle flash */}
        {flash && (
          <circle
            cx="10" cy={bobY}
            r="10"
            fill="none"
            stroke={glowColor}
            strokeWidth="3"
            opacity="0.7"
          />
        )}

        {/* Bob (pull handle) */}
        <circle
          cx="10"
          cy={bobY}
          r="7"
          fill={bobFill}
          stroke={bobStroke}
          strokeWidth="1.5"
        />

        {/* Icon inside bob: sun/moon */}
        {isDark ? (
          /* Moon */
          <path
            d="M10,5.5 A4.5,4.5 0 1,0 14.5,10 A3,3 0 1,1 10,5.5 Z"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1"
            transform={`translate(0, ${bobY - 10})`}
            style={{ transform: `translate(0px, ${bobY - 10}px)` }}
          />
        ) : (
          /* Sun rays */
          <g transform={`translate(10, ${bobY})`}>
            <circle r="2.8" fill="rgba(255,255,255,0.8)" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
              <line
                key={angle}
                x1={Math.cos((angle * Math.PI) / 180) * 3.6}
                y1={Math.sin((angle * Math.PI) / 180) * 3.6}
                x2={Math.cos((angle * Math.PI) / 180) * 5.2}
                y2={Math.sin((angle * Math.PI) / 180) * 5.2}
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="1"
                strokeLinecap="round"
              />
            ))}
          </g>
        )}
      </svg>

      {/* Hint label */}
      <div
        style={{
          marginTop: '4px',
          fontSize: '9px',
          letterSpacing: '0.06em',
          fontWeight: 600,
          textTransform: 'uppercase',
          color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)',
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          opacity: hint ? 1 : 0,
          transition: 'opacity 0.6s ease',
          pointerEvents: 'none',
          maxHeight: '60px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        scroll
      </div>
    </div>
  );
}
