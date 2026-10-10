import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import AmbientBackground from './components/AmbientBackground';
import Header from './components/Header';
import GoogleDirectionCard from './components/GoogleDirectionCard';
import SocialCard from './components/SocialCard';
import MobileShareModal from './components/MobileShareModal';
import QRCodeModal from './components/QRCodeModal';
import { GoogleDirectionSkeleton, SkeletonGrid } from './components/SkeletonLoader';
import { mockProfile, mockSocialHandles, mockStoreInfo } from './data/mockSocialData';
import type { SocialHandle, StoreInfo, DynamicQRData } from './types';
import { fetchHubData, trackButtonClick } from './services/api';
import { PullCord } from 'pullcord';
import 'pullcord/pullcord.css';
import ErrorOfflinePage from './components/ErrorOfflinePage';

// PullCord library renders its fixed container positioned via:
//   --pullcord-top, --pullcord-right, --pullcord-z
//
// Scroll synchronization:
//   - When user scrolls DOWN -> cord moves UP (toward the ceiling) proportionally
//   - When user scrolls UP   -> cord moves DOWN (returns toward resting position)
//   - At top of page (scroll=0) -> cord is at 0px (original resting position)
//
// Direct RAF synchronization provides pixel-by-pixel tracking with zero delay or lag.

const CORD_TRAVEL = 130;     // Total distance (px) the cord ascends on scroll
const SCROLL_RANGE = 500;    // Scroll distance (px) mapped to full travel
const CORD_ANCHOR_TOP = 0;   // Resting top offset (px) at top of page
const CORD_RIGHT = '2px';    // Flush right next to scrollbar (outside content area)
const CORD_Z = 35;           // Sits behind the navbar (z-40) so the string never overlaps the navbar surface

// Plays a crisp, satisfying mechanical pull-cord switch sound
function playSwitchSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // 1. Crisp initial metallic click transient
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1600, now);
    osc1.frequency.exponentialRampToValueAtTime(100, now + 0.035);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.04);

    // 2. Resonant mechanical latch "thunk"
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(380, now + 0.01);
    osc2.frequency.exponentialRampToValueAtTime(60, now + 0.06);
    gain2.gain.setValueAtTime(0.25, now + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.01);
    osc2.stop(now + 0.065);
  } catch {
    // Autoplay restrictions or browser unsupported fallback
  }
}

function SocialHubContent() {
  const { isDark, toggleTheme } = useTheme();

  const handlePullCord = () => {
    playSwitchSound();
    toggleTheme();
  };

  const [isLoading, setIsLoading] = useState(true);
  const [channels, setChannels] = useState<SocialHandle[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(mockStoreInfo);
  const [profileInfo, setProfileInfo] = useState(mockProfile);
  const [activeQR, setActiveQR] = useState<DynamicQRData | null>(null);

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedQRHandle, setSelectedQRHandle] = useState<SocialHandle | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedShareHandle, setSelectedShareHandle] = useState<SocialHandle | null>(null);

  const rafRef = useRef<number | null>(null);

  // Silent background data refresh every 45 seconds (45,000ms)
  useEffect(() => {
    let isMounted = true;

    const loadData = async (isInitial = false) => {
      try {
        const res = await fetchHubData();
        if (!isMounted) return;

        if (res.data) {
          if (res.data.channels && res.data.channels.length > 0) {
            setChannels(res.data.channels);
          } else if (isInitial) {
            setChannels(mockSocialHandles);
          }

          if (res.data.store) {
            setStoreInfo(res.data.store);
          }
          if (res.data.profile) {
            setProfileInfo(res.data.profile);
          }
          if (res.data.activeQR) {
            setActiveQR(res.data.activeQR);
          }
        } else if (isInitial) {
          setChannels(mockSocialHandles);
        }
      } catch (err) {
        if (isInitial && isMounted) {
          setChannels(mockSocialHandles);
        }
      } finally {
        if (isInitial && isMounted) {
          setIsLoading(false);
        }
      }
    };

    // 1. Initial load with skeleton
    loadData(true);

    // 2. Silent background polling every 45 seconds (zero flicker, zero reload)
    const intervalId = setInterval(() => {
      loadData(false);
    }, 45 * 1000);

    // 3. Silent sync when user switches back to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // Initialize properties on :root
    document.documentElement.style.setProperty('--pullcord-right', CORD_RIGHT);
    document.documentElement.style.setProperty('--pullcord-z', String(CORD_Z));

    const syncPosition = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const ratio = Math.min(Math.max(scrollY / SCROLL_RANGE, 0), 1);
      const top = CORD_ANCHOR_TOP - ratio * CORD_TRAVEL;
      document.documentElement.style.setProperty('--pullcord-top', `${top}px`);
    };

    // Apply immediate position on mount
    syncPosition();

    // High-performance scroll listener directly scheduled via RAF
    const onScroll = () => {
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          syncPosition();
          rafRef.current = null;
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleOpenGlobalQR = () => {
    trackButtonClick('qr_modal_open');
    setSelectedQRHandle(null);
    setIsQRModalOpen(true);
  };

  const handleOpenHandleQR = (handle: SocialHandle) => {
    setSelectedQRHandle(handle);
    setIsQRModalOpen(true);
  };

  const handleShareHandle = (handle: SocialHandle) => {
    setSelectedShareHandle(handle);
    setIsShareModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen relative z-10 pb-12 overflow-x-hidden">
      {/* Background Ferrofluid Surface */}
      <AmbientBackground />

      {/* Ceiling Pull-Cord */}
      <PullCord
        onPull={handlePullCord}
        pulled={isDark}
        noEntrance={true}
        ariaLabel="Toggle theme"
        config={{
          gravity: 1250,
          damping: 0.94,
          iterations: 20,
          stretchMax: 26,
        }}
      />

      <Header onOpenQR={handleOpenGlobalQR} />

      <main className="flex-1 w-full">
        {/* Google Directions Banner at Top (Real or Skeleton) */}
        {isLoading ? (
          <GoogleDirectionSkeleton />
        ) : (
          <GoogleDirectionCard store={storeInfo} />
        )}

        {/* Social Media Handles Section */}
        <section className="py-4 sm:py-5">
          <div className="container-custom">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-4 pb-2 border-b border-smoke/50 dark:border-smoke/20">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-800 dark:text-[var(--color-gold)] mb-1">
                  <span>Connect & Follow</span>
                </div>
                <h2 className="text-display text-2xl sm:text-3xl text-carbon">
                  Social Media Handles
                </h2>
              </div>
              <span className="text-xs font-mono font-semibold text-graphite hidden sm:inline">
                {isLoading ? 'Loading...' : `${channels.length} Official Channels`}
              </span>
            </div>

            {/* Grid of Social Handles (Skeleton while fetching, stable grid once loaded) */}
            {isLoading ? (
              <SkeletonGrid count={6} />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
              >
                {channels.map((handle, index) => (
                  <SocialCard
                    key={handle.id}
                    handle={handle}
                    onShareHandle={handleShareHandle}
                    index={index}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </section>
      </main>

      {/* Mobile Share Sheet Modal */}
      <MobileShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        targetHandle={selectedShareHandle}
        onShowQR={handleOpenHandleQR}
      />

      {/* Full QR Code Generator Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        targetHandle={selectedQRHandle}
        activeQR={activeQR}
        profileName={profileInfo.name}
      />
    </div>
  );
}

export default function App() {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isNotFound, setIsNotFound] = useState(false);
  const [backendDown, setBackendDown] = useState<{ isDown: boolean; status?: number; message?: string }>({
    isDown: false,
  });

  const errorStartTimeRef = useRef<number | null>(null);

  const verifyBackendStatus = useCallback(async (isManualRetry = false) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      return;
    }

    const res = await fetchHubData();

    if (res.error) {
      if (isManualRetry) {
        setBackendDown({
          isDown: true,
          status: res.error.status || 503,
          message: res.error.message || 'Backend server is not running or unreachable.',
        });
        return;
      }

      if (errorStartTimeRef.current === null) {
        errorStartTimeRef.current = Date.now();
      }

      const elapsed = Date.now() - errorStartTimeRef.current;
      // Silently retry every 2s up to 12s; show error page only after 12s of continuous failure
      if (elapsed >= 12000) {
        setBackendDown({
          isDown: true,
          status: res.error.status || 503,
          message: res.error.message || 'Backend server is not running or unreachable.',
        });
      }
    } else {
      errorStartTimeRef.current = null;
      setBackendDown({ isDown: false });
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      errorStartTimeRef.current = null;
      verifyBackendStatus();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkPath = () => {
      const pathname = window.location.pathname;
      if (pathname && pathname !== '/' && pathname !== '/index.html') {
        setIsNotFound(true);
      } else {
        setIsNotFound(false);
      }
    };

    checkPath();
    verifyBackendStatus();
    window.addEventListener('popstate', checkPath);

    // Silent fast background retry every 2 seconds (2000ms)
    const intervalId = setInterval(() => {
      verifyBackendStatus();
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('popstate', checkPath);
      clearInterval(intervalId);
    };
  }, [verifyBackendStatus]);

  const handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
      setIsNotFound(false);
    }
  };

  const handleRetry = async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setIsOffline(false);
    }
    errorStartTimeRef.current = Date.now();
    await verifyBackendStatus(true);
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        {isOffline ? (
          <ErrorOfflinePage type="offline" onRetry={handleRetry} onGoHome={handleGoHome} />
        ) : backendDown.isDown ? (
          <ErrorOfflinePage
            type="server_error"
            statusCode={backendDown.status || 503}
            title="Backend Server Disconnected"
            description="The application requires the backend server to run. Please start the Django backend server (python manage.py runserver)."
            onRetry={handleRetry}
            onGoHome={handleGoHome}
          />
        ) : isNotFound ? (
          <ErrorOfflinePage type="404" onGoHome={handleGoHome} />
        ) : (
          <SocialHubContent />
        )}
      </ToastProvider>
    </ThemeProvider>
  );
}
