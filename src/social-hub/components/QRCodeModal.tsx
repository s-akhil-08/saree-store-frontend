import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Copy,
  Check,
  Sliders,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import type { SocialHandle, QRSettings, DynamicQRData } from '../types';
import { useToast } from '../context/ToastContext';
import CustomQRCodeSVG, { generateClientQRPNG } from './CustomQRCodeSVG';
import confetti from 'canvas-confetti';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetHandle?: SocialHandle | null;
  activeQR?: DynamicQRData | null;
  profileName: string;
}

const colorPresets = [
  { name: 'Carbon Luxury', fg: '#18181A', bg: '#FFFFFF' },
  { name: 'Heritage Gold', fg: '#8C6D37', bg: '#FDFBF7' },
  { name: 'Champagne Gold', fg: '#B89768', bg: '#FCFBF8' },
  { name: 'Emerald Weave', fg: '#047857', bg: '#F0FDF4' },
  { name: 'Royal Indigo', fg: '#1E40AF', bg: '#EFF6FF' },
];

export default function QRCodeModal({
  isOpen,
  onClose,
  targetHandle,
  activeQR,
  profileName,
}: QRCodeModalProps) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [activePresetIndex, setActivePresetIndex] = useState(0);

  const [settings, setSettings] = useState<QRSettings>({
    fgColor: colorPresets[0].fg,
    bgColor: colorPresets[0].bg,
    includeLogo: true,
    level: 'H',
    size: 240,
  });

  const svgElementRef = useRef<SVGSVGElement | null>(null);

  // Determine effective destination URL
  const destinationUrl = targetHandle
    ? targetHandle.url
    : (activeQR?.destination_url || activeQR?.dynamic_redirect_url || (typeof window !== 'undefined' ? window.location.href : 'https://suryatejahandlooms.com'));

  // Header logo source
  const headerLogoSrc = '/st_logo.png';

  const title = targetHandle ? `${targetHandle.name} QR Code` : `${profileName} QR Code`;
  const subtitle = targetHandle
    ? `Scan to visit ${targetHandle.handle || targetHandle.name}`
    : 'Scan with camera to open official channels';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(destinationUrl);
    setCopied(true);
    addToast('Destination link copied to clipboard!', 'success');

    confetti({
      particleCount: 30,
      spread: 55,
      origin: { y: 0.6 },
      colors: ['#B89768', '#C5A880', '#18181A'],
    });

    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = async () => {
    try {
      const dataUrl = await generateClientQRPNG(
        destinationUrl,
        settings.fgColor,
        settings.bgColor,
        settings.includeLogo,
        headerLogoSrc,
        1200
      );

      if (!dataUrl) return;
      const link = document.createElement('a');
      link.download = targetHandle ? `${targetHandle.id}_qr_code.png` : `surya_teja_qr_code.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast('High-resolution PNG QR Code downloaded!', 'success');
    } catch {
      addToast('Failed to download PNG', 'error');
    }
  };

  const handleDownloadSVG = () => {
    if (!svgElementRef.current) return;
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElementRef.current);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.download = targetHandle ? `${targetHandle.id}_qr_code.svg` : `surya_teja_qr_code.svg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('Vector SVG QR Code downloaded!', 'success');
    } catch {
      addToast('Failed to download SVG', 'error');
    }
  };

  const handleSelectPreset = (preset: typeof colorPresets[0], idx: number) => {
    setActivePresetIndex(idx);
    setSettings((prev) => ({
      ...prev,
      fgColor: preset.fg,
      bgColor: preset.bg,
    }));
  };

  const toggleIncludeLogo = () => {
    setSettings((prev) => ({
      ...prev,
      includeLogo: !prev.includeLogo,
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Soft Luminous Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-md"
          />

          {/* Glossy Translucent Glassmorphic Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-white/75 dark:bg-stone/75 backdrop-blur-2xl backdrop-saturate-150 p-5 sm:p-6 border border-white/80 dark:border-white/20 border-t-white/95 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_24px_48px_-12px_rgba(0,0,0,0.2)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_24px_48px_-12px_rgba(0,0,0,0.6)] z-10 my-auto text-slate-900 dark:text-white overflow-hidden"
          >
            {/* Elegant Translucent Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-white/60 hover:bg-slate-900 text-slate-700 hover:text-white dark:bg-white/15 dark:hover:bg-white dark:text-stone-300 dark:hover:text-black border border-white/80 dark:border-white/20 shadow-xs backdrop-blur-md flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Close modal"
              title="Close"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Header */}
            <div className="text-center mb-4 pr-6 pl-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/60 dark:bg-white/10 text-slate-800 dark:text-stone-200 text-[11px] font-bold mb-1.5 border border-white/80 dark:border-white/15 backdrop-blur-md shadow-xs">
                {/* <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" /> */}
                <span>Instant QR Connect</span>
              </div>
              <h2 className="text-display text-lg sm:text-xl text-slate-900 dark:text-white font-serif font-bold leading-tight">
                {title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">{subtitle}</p>
            </div>

            {/* QR Code Presentation Box */}
            <div className="relative flex flex-col items-center justify-center p-5 sm:p-6 rounded-2xl bg-white/60 dark:bg-black/30 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-inner mb-4 w-full">
              {/* Corner gold brackets with equal 10px spacing */}
              <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[var(--color-gold)] pointer-events-none" />
              <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[var(--color-gold)] pointer-events-none" />
              <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[var(--color-gold)] pointer-events-none" />
              <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[var(--color-gold)] pointer-events-none" />

              {/* QR Code Render Container with laser scanner */}
              <div
                className="relative z-10 w-[220px] h-[220px] sm:w-[245px] sm:h-[245px] p-2.5 rounded-2xl bg-white shadow-sm overflow-hidden flex items-center justify-center border border-slate-100 dark:border-transparent my-auto"
                style={{ backgroundColor: settings.bgColor }}
              >
                {/* Laser Scanning Animation Line */}
                <motion.div
                  animate={{ top: ['2%', '96%', '2%'] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-gold)] to-transparent pointer-events-none opacity-85 z-20 shadow-[0_0_8px_rgba(184,151,104,0.8)]"
                />

                {/* Instantaneous Client-side Custom Circular & Squircle QR SVG */}
                <CustomQRCodeSVG
                  svgRef={svgElementRef}
                  value={destinationUrl}
                  fgColor={settings.fgColor}
                  bgColor={settings.bgColor}
                  size={600}
                  includeLogo={settings.includeLogo}
                  logoSrc={headerLogoSrc}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Scan Helper Footer */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 mt-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Camera Optimized • Instant Redirection</span>
              </div>
            </div>

            {/* Customization Toggle & Controls */}
            <div className="mb-4">
              <button
                onClick={() => setShowCustomizer(!showCustomizer)}
                className="w-full py-2 px-3 rounded-xl bg-white/60 hover:bg-white/90 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md text-xs font-semibold text-slate-800 dark:text-white flex items-center justify-between transition-colors border border-white/70 dark:border-white/15 cursor-pointer shadow-xs"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-[var(--color-gold)]" />
                  <span>Customize QR Colors & Logo</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-graphite uppercase font-bold">
                  {showCustomizer ? 'Hide' : 'Options'}
                </span>
              </button>

              {/* Customizer Drawer */}
              {showCustomizer && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 p-3 rounded-xl bg-white/60 dark:bg-black/30 backdrop-blur-md border border-white/70 dark:border-white/15 space-y-3 text-xs shadow-xs"
                >
                  {/* Palette Presets */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Palette Presets
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {colorPresets.map((preset, idx) => (
                        <button
                          key={preset.name}
                          onClick={() => handleSelectPreset(preset, idx)}
                          className={`p-1.5 rounded-lg border text-center font-medium transition-all cursor-pointer ${
                            activePresetIndex === idx
                              ? 'border-slate-900 dark:border-white bg-white/90 dark:bg-stone/80 font-bold shadow-xs text-slate-900 dark:text-white'
                              : 'border-transparent bg-white/40 hover:bg-white/70 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div
                            className="w-full h-2.5 rounded mb-1 border border-black/10 dark:border-transparent"
                            style={{ backgroundColor: preset.fg }}
                          />
                          <span className="text-[8px] block truncate">{preset.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Display Option */}
                  <div className="pt-2 border-t border-white/60 dark:border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-white dark:bg-stone/60 p-0.5 flex items-center justify-center border border-slate-200 dark:border-white/15 shrink-0 shadow-xs">
                        <img src={headerLogoSrc} alt="Header Logo" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-900 dark:text-white">Brand Logo in Center</div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400">Fetched from Header section</div>
                      </div>
                    </div>

                    <button
                      onClick={toggleIncludeLogo}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        settings.includeLogo ? 'bg-[var(--color-gold)]' : 'bg-slate-300 dark:bg-stone/40'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          settings.includeLogo ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Action Buttons with Glossy Glass Styles */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleCopyLink}
                className="py-2.5 px-2 text-xs font-semibold rounded-xl bg-white/70 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white border border-white/80 dark:border-white/15 shadow-xs backdrop-blur-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadPNG}
                className="py-2.5 px-2 text-xs font-semibold rounded-xl bg-white/70 hover:bg-white dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white border border-white/80 dark:border-white/15 shadow-xs backdrop-blur-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                <span>PNG</span>
              </button>

              <button
                onClick={handleDownloadSVG}
                className="py-2.5 px-2 text-xs font-semibold rounded-xl bg-slate-900/90 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 shadow-md backdrop-blur-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-amber-400 dark:text-[var(--color-gold)]" />
                <span>Vector</span>
              </button>
            </div>

            {/* Direct Open Link with Clear Contrast */}
            <div className="mt-3.5 text-center">
              <a
                href={destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white transition-colors underline underline-offset-4"
              >
                <span>Directly Open Destination Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
