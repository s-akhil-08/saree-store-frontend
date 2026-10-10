import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  Share2,
  Mail,
  QrCode,
} from 'lucide-react';
import {
  InstagramIcon,
  WhatsAppIcon,
  FacebookIcon,
  TwitterXIcon,
  LinkedInIcon,
} from './SocialIcons';
import type { SocialHandle } from '../types';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { getThemeAwareUrl } from './SocialCard';
import confetti from 'canvas-confetti';

interface MobileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetHandle: SocialHandle | null;
  onShowQR?: (handle: SocialHandle) => void;
}

function getDeviceShareLabel(): string {
  if (typeof window === 'undefined') return 'Open Share Sheet';

  const ua = (typeof navigator !== 'undefined' ? navigator.userAgent : '') || '';
  const isTablet =
    /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua) ||
    ((typeof navigator !== 'undefined' && navigator.maxTouchPoints && navigator.maxTouchPoints > 1) &&
      window.innerWidth >= 600 &&
      window.innerWidth <= 1024);

  const isMobile =
    !isTablet &&
    (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua) || window.innerWidth < 640);

  if (isMobile) {
    return 'Open Mobile Share Sheet';
  } else if (isTablet) {
    return 'Open Tablet Share Sheet';
  } else {
    return 'Open Desktop Share Sheet';
  }
}

export default function MobileShareModal({
  isOpen,
  onClose,
  targetHandle,
  onShowQR,
}: MobileShareModalProps) {
  const { addToast } = useToast();
  const { isDark } = useTheme();
  const [copiedLink, setCopiedLink] = useState(false);

  if (!targetHandle) return null;

  const rawUrl = targetHandle.url || (typeof window !== 'undefined' ? window.location.href : 'https://surya-teja-gadwal-sarees.vercel.app');
  const shareUrl = getThemeAwareUrl(rawUrl, isDark);
  const shareTitle = `${targetHandle.name} - Surya Teja Handlooms`;
  const shareText = `Check out Surya Teja on ${targetHandle.name} (${targetHandle.handle}): ${shareUrl}`;
  const deviceShareLabel = getDeviceShareLabel();

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    addToast(`Link for ${targetHandle.name} copied!`, 'success');

    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.7 },
      colors: [targetHandle.color, '#B89768', '#D41858'],
    });

    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        addToast('Shared successfully!', 'success');
        onClose();
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  const mobileShareApps = [
    {
      name: 'WhatsApp',
      renderIcon: () => <WhatsAppIcon size={26} />,
      bgColor: 'bg-[#25D366]',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}`)}`,
    },
    {
      name: 'Instagram',
      renderIcon: () => <InstagramIcon size={26} />,
      bgColor: 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]',
      url: `https://instagram.com`,
    },
    {
      name: 'X / Twitter',
      renderIcon: () => <TwitterXIcon size={22} />,
      bgColor: 'bg-[#0F1419]',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Facebook',
      renderIcon: () => <FacebookIcon size={24} />,
      bgColor: 'bg-[#1877F2]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'LinkedIn',
      renderIcon: () => <LinkedInIcon size={24} />,
      bgColor: 'bg-[#0A66C2]',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Email',
      renderIcon: () => <Mail className="w-6 h-6" />,
      bgColor: 'bg-[#D41858]',
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}`)}`,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet on Mobile / Modal on Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900/95 dark:bg-slate-900/95 sm:bg-paper/95 sm:dark:bg-slate-900/95 backdrop-blur-xl p-5 sm:p-7 border border-slate-700/60 sm:border-slate-300/80 dark:border-white/15 shadow-2xl z-10 text-white sm:text-slate-900 sm:dark:text-white overflow-hidden"
          >
            {/* Mobile Grabber Bar */}
            <div className="sm:hidden w-12 h-1.5 bg-slate-500/50 rounded-full mx-auto mb-4" />

            {/* Elegant Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-slate-800/80 sm:bg-slate-200/80 dark:bg-white/15 hover:bg-slate-700 dark:hover:bg-white/25 text-slate-200 sm:text-slate-800 dark:text-white border border-slate-700/60 sm:border-slate-300/60 dark:border-white/20 shadow-xs flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Close modal"
              title="Close"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Target Handle Preview Header */}
            <div className="flex items-center gap-3.5 mb-5 pr-8">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${targetHandle.color}, ${targetHandle.accentColor})`,
                }}
              >
                <Share2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 sm:text-amber-800 dark:text-[var(--color-gold)]">
                  Share Handle
                </span>
                <h3 className="font-semibold text-lg text-white sm:text-slate-900 sm:dark:text-white truncate">
                  {targetHandle.name}
                </h3>
                <p className="text-xs text-slate-300 sm:text-slate-600 sm:dark:text-slate-300 font-mono truncate">{targetHandle.handle}</p>
              </div>
            </div>

            {/* Native Mobile/Tablet/Desktop Share Sheet Trigger (if supported) */}
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                onClick={handleNativeShare}
                className="w-full mb-5 py-3 px-4 text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 dark:from-[var(--color-gold)] dark:to-[#8C6D37] hover:brightness-110 text-white rounded-xl shadow-md flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>{deviceShareLabel}</span>
              </button>
            )}

            {/* Mobile Share Apps Grid */}
            <div className="mb-5">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 sm:text-slate-700 sm:dark:text-slate-300 mb-3 text-center sm:text-left">
                Direct Apps & Channels
              </span>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3">
                {mobileShareApps.map((app) => (
                  <a
                    key={app.name}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(shareUrl);
                        addToast(`Direct link copied for ${app.name}!`, 'success');
                      } catch {}
                      onClose();
                    }}
                    className="flex flex-col items-center gap-2 p-2.5 rounded-2xl bg-white/10 sm:bg-slate-100/90 hover:bg-white/20 sm:hover:bg-slate-200/90 dark:bg-white/10 dark:hover:bg-white/20 border border-white/10 sm:border-slate-200/80 dark:border-white/10 transition-all hover:-translate-y-1 text-center group cursor-pointer shadow-xs"
                  >
                    <div
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform ${app.bgColor}`}
                    >
                      {app.renderIcon()}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-200 sm:text-slate-800 sm:dark:text-slate-200 group-hover:text-white sm:group-hover:text-black sm:dark:group-hover:text-white truncate max-w-full">
                      {app.name}
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Copy Link & QR Action */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-slate-700/60 sm:border-smoke/50 dark:border-white/15">
              <button
                onClick={handleCopy}
                className="w-full py-2.5 px-4 text-xs font-semibold rounded-xl bg-white/12 sm:bg-slate-100 hover:bg-white/22 sm:hover:bg-slate-200/90 dark:bg-white/12 dark:hover:bg-white/22 text-white sm:text-slate-900 sm:dark:text-white border border-white/15 sm:border-slate-200 dark:border-white/20 flex items-center justify-center gap-2 flex-1 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 sm:text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-emerald-400 sm:text-emerald-600 dark:text-emerald-400">Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 shrink-0" />
                    <span>Copy Direct Link</span>
                  </>
                )}
              </button>

              {onShowQR && (
                <button
                  onClick={() => {
                    onClose();
                    onShowQR(targetHandle);
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 text-xs font-semibold rounded-xl bg-amber-500/20 sm:bg-amber-50 hover:bg-amber-500/30 sm:hover:bg-amber-100/90 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-400 sm:text-amber-800 dark:text-[var(--color-gold)] border border-amber-500/30 sm:border-amber-200 dark:border-amber-500/30 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer shadow-xs"
                >
                  <QrCode className="w-4 h-4 shrink-0" />
                  <span>Show QR</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
