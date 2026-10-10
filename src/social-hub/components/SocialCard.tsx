import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  Share2,
  BadgeCheck,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import {
  InstagramIcon,
  YouTubeIcon,
  WhatsAppIcon,
  FacebookIcon,
  TwitterXIcon,
  LinkedInIcon,
  PinterestIcon,
} from './SocialIcons';
import type { SocialHandle } from '../types';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { trackButtonClick } from '../services/api';
import confetti from 'canvas-confetti';

interface SocialCardProps {
  handle: SocialHandle;
  onShareHandle: (handle: SocialHandle) => void;
  index: number;
}

export function getThemeAwareUrl(url: string, isDark: boolean): string {
  if (!url) return url;
  const isOfficialWebsite =
    url.includes('surya-teja-handlooms') ||
    url.includes('surya-teja-gadwal-sarees') ||
    url.includes('suryatejahandlooms') ||
    url.includes('suryateja.com');

  if (isOfficialWebsite) {
    try {
      const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'https://surya-teja-gadwal-sarees.vercel.app');
      parsed.searchParams.set('theme', isDark ? 'dark' : 'light');
      return parsed.toString();
    } catch {
      const base = url.split('#')[0];
      const hash = url.includes('#') ? `#${url.split('#')[1]}` : '';
      const separator = base.includes('?') ? '&' : '?';
      return `${base}${separator}theme=${isDark ? 'dark' : 'light'}${hash}`;
    }
  }
  return url;
}

export default function SocialCard({ handle, onShareHandle, index }: SocialCardProps) {
  const { addToast } = useToast();
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const effectiveUrl = getThemeAwareUrl(handle.url, isDark);

  const renderPlatformIcon = (iconName: string, size: number = 22) => {
    switch (iconName) {
      case 'Instagram':   return <InstagramIcon size={size} />;
      case 'Youtube':     return <YouTubeIcon size={size} />;
      case 'Facebook':    return <FacebookIcon size={size} />;
      case 'Pinterest':
      case 'Image':       return <PinterestIcon size={size} />;
      case 'Twitter':     return <TwitterXIcon size={size - 2} />;
      case 'Linkedin':    return <LinkedInIcon size={size} />;
      case 'Globe':       return <Globe style={{ width: size, height: size }} />;
      case 'Mail':        return <Mail style={{ width: size, height: size }} />;
      case 'MapPin':      return <MapPin style={{ width: size, height: size }} />;
      case 'Phone':       return <Phone style={{ width: size, height: size }} />;
      case 'WhatsApp':
      case 'Whatsapp':
      case 'MessageSquare':
      case 'MessageCircle':
      default:            return <WhatsAppIcon size={size} />;
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackButtonClick('social_copy', handle.id);
    const linkToCopy = effectiveUrl || handle.handle;
    navigator.clipboard.writeText(linkToCopy);
    setCopied(true);
    addToast(`Copied ${handle.name} link to clipboard!`, 'success');
    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.8 },
      colors: [handle.color, '#B89768', '#C5A880'],
    });
    setTimeout(() => setCopied(false), 2200);
  };

  const handleVisit = (e: React.MouseEvent) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      e.preventDefault();
      addToast("You are currently offline. Reconnect to the internet to visit this link.", "warning");
      return;
    }
    trackButtonClick('social_visit', handle.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="relative flex flex-col justify-between social-card-glass rounded-2xl overflow-hidden group w-full"
    >
      {/* Colored top accent bar matching platform brand */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 group-hover:h-2 transition-all duration-300"
        style={{ background: `linear-gradient(90deg, ${handle.color}, ${handle.accentColor}, #B89768)` }}
      />

      {/* Card Body - Tighter vertical spacing without dead space */}
      <div className="p-3.5 sm:p-4 pt-3.5 sm:pt-4 pb-2.5 sm:pb-3 flex flex-col">
        {/* Header: Clickable Icon + Name + Handle link with luxury hover effect */}
        <a
          href={effectiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleVisit}
          className="flex items-center gap-3.5 group/header rounded-xl -m-1.5 p-1.5 transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/8 active:scale-[0.99] select-none cursor-pointer"
          title={`Visit ${handle.name}`}
        >
          {/* Animated Platform Icon Box */}
          <motion.div
            whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.08 }}
            transition={{ duration: 0.3 }}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden relative"
            style={{ background: `linear-gradient(135deg, ${handle.color}, ${handle.accentColor})` }}
          >
            {renderPlatformIcon(handle.iconName, 22)}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/header:opacity-100 transition-opacity" />
          </motion.div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm sm:text-base text-carbon tracking-tight truncate group-hover/header:text-amber-800 dark:group-hover/header:text-[var(--color-gold)] transition-colors duration-200">
                {handle.name}
              </h3>
              {handle.isVerified && (
                <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-graphite font-mono truncate group-hover/header:text-slate-900 dark:group-hover/header:text-slate-100 transition-colors duration-200">
              {handle.handle}
            </p>
          </div>
        </a>
      </div>

      {/* 3-Button Action Footer Strip - Balanced Proportions with Visible Text on Mobile */}
      <div className="border-t border-smoke/40 dark:border-white/10 grid grid-cols-12 divide-x divide-smoke/40 dark:divide-white/10 mt-auto bg-black/[0.02] dark:bg-white/[0.02]">
        {/* 1. Primary Visit/Join Action - Opens in New Tab */}
        <a
          href={effectiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleVisit}
          className="col-span-6 flex items-center justify-between gap-1 px-2.5 sm:px-3.5 py-2.5 font-semibold text-[9.5px] sm:text-[10.5px] uppercase tracking-wider text-white bg-carbon hover:bg-slate-800 dark:bg-white/12 dark:hover:bg-white/22 dark:text-white active:scale-[0.98] transition-all duration-200 select-none group/visit min-w-0 cursor-pointer"
          title={`Open ${handle.name} in new tab`}
        >
          <span className="truncate">{handle.buttonLabel || 'Visit'}</span>
          <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 group-hover/visit:translate-x-0.5 group-hover/visit:-translate-y-0.5 transition-transform duration-200" />
        </a>

        {/* 2. Copy Action Button with Text visible on Mobile & Desktop */}
        <button
          onClick={handleCopy}
          className="col-span-3 flex items-center justify-center gap-1 py-2.5 text-[10px] sm:text-[11px] font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 active:scale-95 select-none cursor-pointer group/copy min-w-0"
          title="Copy Handle"
        >
          {copied ? (
            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-700 dark:text-slate-300 group-hover/copy:scale-110 transition-transform duration-200 shrink-0" />
          )}
          <span className="inline text-[10px] sm:text-[10.5px] font-semibold truncate">{copied ? 'Copied' : 'Copy'}</span>
        </button>

        {/* 3. Share Action Button with Text visible on Mobile & Desktop */}
        <button
          onClick={() => {
            trackButtonClick('social_share', handle.id);
            onShareHandle({
              ...handle,
              url: effectiveUrl,
            });
          }}
          className="col-span-3 flex items-center justify-center gap-1 py-2.5 text-[10px] sm:text-[11px] font-semibold text-amber-700 dark:text-[var(--color-gold)] hover:text-amber-800 dark:hover:text-amber-300 hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200 active:scale-95 select-none cursor-pointer group/share min-w-0"
          title={`Share ${handle.name}`}
        >
          <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 group-hover/share:scale-110 transition-transform duration-200" />
          <span className="inline text-[10px] sm:text-[10.5px] font-semibold truncate">Share</span>
        </button>
      </div>
    </motion.div>
  );
}
