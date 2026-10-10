import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  WifiOff,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import AmbientBackground from './AmbientBackground';

interface ErrorOfflinePageProps {
  type?: '404' | 'offline' | 'server_error' | 'http_error';
  statusCode?: number;
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

export default function ErrorOfflinePage({
  type = '404',
  statusCode,
  title,
  description,
  onRetry,
}: ErrorOfflinePageProps) {
  const [reconnected, setReconnected] = useState(false);
  const [stillOfflineNotice, setStillOfflineNotice] = useState(false);

  const isOffline = type === 'offline';
  const effectiveCode = statusCode || (isOffline ? 0 : type === 'server_error' ? 500 : 404);

  // Dynamic status text resolution based on HTTP status code
  const getStatusText = (code: number) => {
    switch (code) {
      case 404:
        return {
          badge: '404 • Resource Not Found',
          title: 'Page Not Found',
          description: "The page or resource you are looking for doesn't exist, has been removed, or the link may be broken.",
        };
      case 500:
        return {
          badge: '500 • Internal Server Error',
          title: 'Server Error Encountered',
          description: 'Our backend server encountered an internal error. Our team has been notified. Please try again in a few moments.',
        };
      case 502:
        return {
          badge: '502 • Bad Gateway',
          title: 'Bad Gateway Response',
          description: 'The server received an invalid or corrupt response from an upstream service provider.',
        };
      case 503:
        return {
          badge: '503 • Service Unavailable',
          title: 'Service Temporarily Unavailable',
          description: 'The server is temporarily offline for maintenance or overloaded. Please try again shortly.',
        };
      case 504:
        return {
          badge: '504 • Gateway Timeout',
          title: 'Gateway Timeout',
          description: 'The server did not receive a timely response from the backend service. Please try again.',
        };
      case 403:
        return {
          badge: '403 • Access Forbidden',
          title: 'Access Restricted',
          description: 'You do not have permission to access the requested resource.',
        };
      case 401:
        return {
          badge: '401 • Unauthorized',
          title: 'Authentication Required',
          description: 'You need valid authorization to access this page or service.',
        };
      case 400:
        return {
          badge: '400 • Bad Request',
          title: 'Invalid Request',
          description: 'The server could not understand or process your request.',
        };
      default:
        if (code >= 500) {
          return {
            badge: `${code} • Server Error`,
            title: `Server Error (${code})`,
            description: `The backend server responded with HTTP status ${code}. Please try again later.`,
          };
        } else if (code >= 400) {
          return {
            badge: `${code} • Client Error`,
            title: `Request Error (${code})`,
            description: `The request could not be completed (HTTP ${code}).`,
          };
        }
        return {
          badge: 'Error • Unknown State',
          title: 'An Unexpected Error Occurred',
          description: 'Something went wrong while fulfilling your request. Please try again.',
        };
    }
  };

  const dynamicInfo = isOffline
    ? {
        badge: 'Offline Mode • Disconnected',
        title: 'Connection Lost',
        description: 'It seems you are currently offline. Please check your internet connection or Wi-Fi network and try again.',
      }
    : getStatusText(effectiveCode);

  const displayTitle = title || dynamicInfo.title;
  const displayDescription = description || dynamicInfo.description;

  useEffect(() => {
    const handleOnline = () => {
      setReconnected(true);
      setStillOfflineNotice(false);
      setTimeout(() => {
        if (onRetry) {
          onRetry();
        } else if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 800);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [onRetry]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden z-10 selection:bg-carbon selection:text-paper">
      {/* Background Ferrofluid Surface */}
      <AmbientBackground />

      {/* Main Glassmorphic 404 / Offline Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg rounded-3xl bg-white/75 dark:bg-stone/80 backdrop-blur-2xl backdrop-saturate-150 p-6 sm:p-10 border border-white/80 dark:border-white/20 border-t-white/95 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_24px_48px_-12px_rgba(0,0,0,0.2)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_24px_48px_-12px_rgba(0,0,0,0.6)] text-center my-auto overflow-hidden"
      >
        {/* Soft Ambient Inner Glow Orbs */}
        <div className="absolute top-[-30%] left-[-20%] w-48 h-48 rounded-full bg-purple-500/15 dark:bg-purple-500/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-20%] w-48 h-48 rounded-full bg-amber-500/15 dark:bg-amber-500/25 blur-3xl pointer-events-none" />

        {/* Top Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold mb-4 border border-white/80 dark:border-white/15 backdrop-blur-md shadow-xs">
          {isOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-rose-500" />
              <span>{dynamicInfo.badge}</span>
            </>
          ) : effectiveCode >= 500 ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>{dynamicInfo.badge}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{dynamicInfo.badge}</span>
            </>
          )}
        </div>

        {/* Reconnected Banner */}
        {reconnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Connection Restored! Refreshing...</span>
          </motion.div>
        )}

        {/* Still Offline Warning Banner */}
        {stillOfflineNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Still offline. Reconnect your network or disable DevTools Offline throttling.</span>
          </motion.div>
        )}

        {/* Header Digits */}
        <h1 className="text-display text-5xl sm:text-6xl text-slate-900 dark:text-white font-bold tracking-tight mb-1">
          {isOffline ? 'Offline' : effectiveCode > 0 ? String(effectiveCode) : 'Error'}
        </h1>
        <p className="text-base sm:text-lg font-serif text-slate-800 dark:text-slate-200 font-semibold mb-3">
          {displayTitle}
        </p>

        {/* Interactive Disconnected Plug Vector Illustration matching Reference Image */}
        <div className="relative w-full h-44 sm:h-52 my-3 flex items-center justify-center overflow-visible select-none">
          {/* Background Soft Organic Blob Shapes */}
          <div className="absolute w-40 h-28 bg-purple-400/20 dark:bg-purple-600/25 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-md -left-2 top-8 animate-pulse" />
          <div className="absolute w-40 h-28 bg-indigo-400/20 dark:bg-indigo-600/25 rounded-[60%_40%_30%_70%/50%_60%_40%_60%] blur-md -right-2 bottom-4 animate-pulse" />

          {/* SVG Disconnected Floating Plug Scene */}
          <svg
            viewBox="0 0 500 240"
            className="w-full h-full max-w-[420px] drop-shadow-md overflow-visible"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left Cable & Female Socket (Floating Figure 1 Side) */}
            <motion.g
              animate={{
                x: [-4, 4, -4],
                y: [-3, 5, -3],
                rotate: [-1.5, 1.5, -1.5],
              }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Looping Cord */}
              <path
                d="M 20 180 C 60 210, 80 140, 120 150 C 160 160, 170 110, 210 115"
                stroke="#8B5CF6"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Female Socket Plug Body */}
              <rect
                x="206"
                y="98"
                width="34"
                height="34"
                rx="8"
                fill="#7C3AED"
                className="dark:fill-[#8B5CF6]"
              />
              <rect
                x="236"
                y="102"
                width="8"
                height="26"
                rx="3"
                fill="#6D28D9"
              />
              {/* Left Floating Character Silhouette */}
              <circle cx="120" cy="80" r="18" fill="#4B5563" className="dark:fill-[#9CA3AF]" />
              <path
                d="M 100 135 C 100 105, 140 105, 140 135 Z"
                fill="#6B7280"
                className="dark:fill-[#9CA3AF]"
              />
              {/* Reaching Arm */}
              <path
                d="M 135 115 Q 175 105, 206 115"
                stroke="#6B7280"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </motion.g>

            {/* Right Cable & Male Plug with Pins (Floating Figure 2 Side) */}
            <motion.g
              animate={{
                x: [4, -4, 4],
                y: [4, -4, 4],
                rotate: [1.5, -1.5, 1.5],
              }}
              transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Male Plug Body */}
              <rect
                x="264"
                y="98"
                width="34"
                height="34"
                rx="8"
                fill="#7C3AED"
                className="dark:fill-[#8B5CF6]"
              />
              {/* Metal Contact Prongs */}
              <rect x="250" y="104" width="14" height="6" rx="2" fill="#D4AF37" />
              <rect x="250" y="120" width="14" height="6" rx="2" fill="#D4AF37" />

              {/* Looping Right Cord */}
              <path
                d="M 298 115 C 340 110, 360 170, 400 150 C 440 130, 460 190, 480 180"
                stroke="#8B5CF6"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Right Floating Character Silhouette */}
              <circle cx="380" cy="90" r="18" fill="#4B5563" className="dark:fill-[#9CA3AF]" />
              <path
                d="M 360 145 C 360 115, 400 115, 400 145 Z"
                fill="#6B7280"
                className="dark:fill-[#9CA3AF]"
              />
              {/* Reaching Arm */}
              <path
                d="M 365 125 Q 325 110, 298 115"
                stroke="#6B7280"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </motion.g>

            {/* Central Electric Spark Pulses */}
            <motion.g
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.92, 1.15, 0.92],
              }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Lightning / Electric Sparks */}
              <path
                d="M 246 92 L 254 105 L 244 112 L 256 132 L 248 138"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M 252 82 L 250 90 M 240 100 L 235 98 M 262 135 L 268 138"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </motion.g>
          </svg>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
          {displayDescription}
        </p>
      </motion.div>
    </div>
  );
}
