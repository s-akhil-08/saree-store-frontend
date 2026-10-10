import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  WifiOff,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import AmbientBackground from '../components/AmbientBackground';

export interface NotFoundPageProps {
  forcedType?: '404' | 'offline' | 'server_error' | 'forbidden' | 'unauthorized' | 'generic';
  statusCode?: number | string;
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
}

interface ErrorConfig {
  code: string | number;
  badge: string;
  title: string;
  description: string;
  type: '404' | 'offline' | 'server_error' | 'forbidden' | 'unauthorized' | 'generic';
}

const HTTP_ERROR_MAP: Record<string | number, ErrorConfig> = {
  404: {
    code: '404',
    badge: '404 • Resource Not Found',
    title: 'Page Not Found',
    description: "The page or resource you are looking for doesn't exist, has been removed, or the link may be broken.",
    type: '404',
  },
  500: {
    code: '500',
    badge: '500 • Internal Server Error',
    title: 'Server Error Encountered',
    description: 'Our servers encountered an internal error while processing your request. Please try again in a few moments.',
    type: 'server_error',
  },
  502: {
    code: '502',
    badge: '502 • Bad Gateway',
    title: 'Gateway Communication Error',
    description: 'The server received an invalid response while fulfilling your request. Please refresh or try again later.',
    type: 'server_error',
  },
  503: {
    code: '503',
    badge: '503 • Service Unavailable',
    title: 'Service Temporarily Unavailable',
    description: 'Our servers are currently undergoing maintenance or experiencing high load. Please check back shortly.',
    type: 'server_error',
  },
  504: {
    code: '504',
    badge: '504 • Gateway Timeout',
    title: 'Server Request Timeout',
    description: 'The backend server took too long to respond. Please check your connection and try again.',
    type: 'server_error',
  },
  403: {
    code: '403',
    badge: '403 • Access Forbidden',
    title: 'Permission Denied',
    description: 'You do not have permission to access this resource or page.',
    type: 'forbidden',
  },
  401: {
    code: '401',
    badge: '401 • Unauthorized',
    title: 'Authentication Required',
    description: 'Please log in with a valid account to view this content.',
    type: 'unauthorized',
  },
  400: {
    code: '400',
    badge: '400 • Bad Request',
    title: 'Invalid Request',
    description: 'The request could not be processed due to invalid parameters.',
    type: 'generic',
  },
};

export default function NotFoundPage({
  forcedType,
  statusCode: propStatusCode,
  title: propTitle,
  description: propDescription,
  onRetry,
}: NotFoundPageProps) {
  const location = useLocation();
  const state = (location.state as any) || {};

  const [isRetrying, setIsRetrying] = useState(false);
  const [reconnected, setReconnected] = useState(false);
  const [stillOfflineNotice, setStillOfflineNotice] = useState(false);

  // Resolve status code dynamically from props, location state, or forcedType
  const rawStatusCode = propStatusCode || state.statusCode || state.code;
  const resolvedCode = rawStatusCode
    ? String(rawStatusCode)
    : forcedType === 'offline'
    ? 'offline'
    : forcedType === 'server_error'
    ? '500'
    : forcedType === 'forbidden'
    ? '403'
    : forcedType === 'unauthorized'
    ? '401'
    : '404';

  const isOffline = resolvedCode === 'offline' || forcedType === 'offline';

  // Get pre-configured HTTP error mapping if available
  const mappedConfig = HTTP_ERROR_MAP[resolvedCode];

  const displayCode = isOffline ? 'Offline' : mappedConfig?.code || resolvedCode;
  
  const displayBadge = isOffline
    ? 'Offline Mode • Disconnected'
    : mappedConfig?.badge || `${resolvedCode} • HTTP Error`;

  const displayTitle = propTitle || state.title || mappedConfig?.title || (
    isOffline
      ? 'Connection Lost'
      : Number(resolvedCode) >= 500
      ? 'Server Error Encountered'
      : 'Resource Request Error'
  );

  // Sanitize description to prevent exposing stack traces or backend internals
  const rawDescription = propDescription || state.description;
  const isSensitiveTrace = typeof rawDescription === 'string' && (
    rawDescription.includes('Traceback') ||
    rawDescription.includes('at ') ||
    rawDescription.includes('TypeError') ||
    rawDescription.includes('ReferenceError') ||
    rawDescription.includes('django.') ||
    rawDescription.includes('process.') ||
    rawDescription.includes('SyntaxError')
  );

  const displayDescription = (!isSensitiveTrace && rawDescription)
    ? rawDescription
    : isOffline
    ? 'It seems you are currently offline. Please check your internet connection or Wi-Fi network and try again.'
    : mappedConfig?.description || (
      Number(resolvedCode) >= 500
        ? 'Our servers encountered an unexpected error. Please try again shortly.'
        : 'The requested resource encountered an error while processing.'
    );

  const handleRetry = async () => {
    setIsRetrying(true);
    setStillOfflineNotice(false);

    // Prevent hard browser reload when still offline which triggers browser Dino screen
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setTimeout(() => {
        setIsRetrying(false);
        setStillOfflineNotice(true);
      }, 700);
      return;
    }

    if (onRetry) {
      await onRetry();
      setIsRetrying(false);
      setReconnected(true);
    } else {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

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

  const renderBadgeIcon = () => {
    if (isOffline) return <WifiOff className="w-3.5 h-3.5 text-rose-500 animate-pulse" />;
    if (resolvedCode === '403') return <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />;
    if (resolvedCode === '401') return <Lock className="w-3.5 h-3.5 text-indigo-500" />;
    if (Number(resolvedCode) >= 500) return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    return <Sparkles className="w-3.5 h-3.5 text-magenta" />;
  };

  return (
    <div className="fixed inset-0 min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto z-[999] bg-paper dark:bg-[#121214] selection:bg-carbon selection:text-paper">
      {/* Background Fluid Surface */}
      <AmbientBackground />

      {/* Main Glassmorphic Error / Offline Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg rounded-3xl bg-white/75 dark:bg-[#1E1E22]/80 backdrop-blur-2xl backdrop-saturate-150 p-6 sm:p-10 border border-white/80 dark:border-white/20 border-t-white/95 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_24px_48px_-12px_rgba(0,0,0,0.2)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_24px_48px_-12px_rgba(0,0,0,0.6)] text-center my-auto overflow-hidden"
      >
        {/* Soft Ambient Inner Glow Orbs */}
        <div className="absolute top-[-30%] left-[-20%] w-48 h-48 rounded-full bg-purple-500/15 dark:bg-purple-500/25 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-30%] right-[-20%] w-48 h-48 rounded-full bg-amber-500/15 dark:bg-amber-500/25 blur-3xl pointer-events-none" />

        {/* Dynamic Top Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/70 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-bold mb-4 border border-white/80 dark:border-white/15 backdrop-blur-md shadow-xs">
          {renderBadgeIcon()}
          <span>{displayBadge}</span>
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
            <span>Still offline. Reconnect your network or check your Wi-Fi connection.</span>
          </motion.div>
        )}

        {/* Dynamic Header Digits */}
        <h1 className="font-serif text-5xl sm:text-6xl text-slate-900 dark:text-white font-bold tracking-tight mb-1">
          {displayCode}
        </h1>
        <p className="text-base sm:text-lg font-serif text-slate-800 dark:text-slate-200 font-semibold mb-3">
          {displayTitle}
        </p>

        {/* Interactive Vector Illustration Scene */}
        <div className="relative w-full h-44 sm:h-52 my-3 flex items-center justify-center overflow-visible select-none">
          {/* Background Soft Organic Blob Shapes */}
          <div className="absolute w-40 h-28 bg-purple-400/20 dark:bg-purple-600/25 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-md -left-2 top-8 animate-pulse" />
          <div className="absolute w-40 h-28 bg-indigo-400/20 dark:bg-indigo-600/25 rounded-[60%_40%_30%_70%/50%_60%_40%_60%] blur-md -right-2 bottom-4 animate-pulse" />

          {/* SVG Floating Scene */}
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

        {/* Dynamic User-Friendly Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto mb-6">
          {displayDescription}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center">
          {/* Reconnect / Refresh Action */}
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto min-w-[150px] py-3 px-5 rounded-2xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg backdrop-blur-md transition-all active:scale-95 cursor-pointer disabled:opacity-60"
          >
            <RotateCcw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Checking...' : isOffline ? 'Try Reconnecting' : 'Reload Page'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
