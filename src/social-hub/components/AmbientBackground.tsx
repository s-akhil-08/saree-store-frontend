import { useTheme } from '../context/ThemeContext';
import GradientWaves from './GradientWaves';

export default function AmbientBackground() {
  const { isDark } = useTheme();

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden"
      aria-hidden="true"
    >
      {/* Soft Ambient Radial Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full bg-[var(--color-gold)]/10 dark:bg-[#5227FF]/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-[var(--color-gold)]/12 dark:bg-[#FF9FFC]/15 blur-[130px] pointer-events-none" />

      {/* Dynamic Theme-Harmonized GradientWaves Component */}
      <div className="absolute inset-0 w-full h-full">
        <GradientWaves
          horizonColor={isDark ? '#5227FF' : '#EADEC9'}
          waveColor={isDark ? '#FF9FFC' : '#C5A880'}
          crestColor={isDark ? '#FFFFFF' : '#5E431B'}
          speed={0.35}
          amplitude={2.4}
          waveScale={0.58}
          waveRatio={0.9}
          swell={32}
          turbulence={18}
          tilt={1.11}
          zoom={1.0}
          height={5.4}
          fogDepth={isDark ? 25 : 22}
          detail="medium"
          brightness={isDark ? 1.0 : 1.0}
          opacity={isDark ? 1.0 : 0.9}
          mouseInteraction={true}
          parallaxStrength={0.5}
          grain={true}
          grainIntensity={isDark ? 0.05 : 0.03}
        />
      </div>
    </div>
  );
}
