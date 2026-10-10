import { QrCode, Navigation } from 'lucide-react';

interface HeaderProps {
  onOpenQR: () => void;
}

export default function Header({ onOpenQR }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full header-glass transition-all duration-300">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3 pr-8 sm:pr-10">
          {/* Brand Logo & Monogram */}
          <a
            href="#"
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none"
            aria-label="Surya Teja Official Hub"
          >
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-white p-1 flex items-center justify-center shadow-sm overflow-hidden group-hover:scale-105 group-hover:shadow-md transition-all duration-300 shrink-0">
              <img
                src="/st_logo.png"
                alt="Surya Teja Logo"
                className="w-full h-full object-contain scale-130"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-wordmark font-bold tracking-wider text-sm sm:text-base text-carbon group-hover:opacity-75 transition-opacity duration-200">
                SURYA TEJA
              </span>
              <span className="text-[10px] tracking-[0.18em] uppercase text-graphite font-semibold">
                Official Social Handles
              </span>
            </div>
          </a>

          {/* Right Action Icons & Buttons with Minimalist Premium Hover Effects */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Google Directions Quick Action */}
            <a
              href="https://www.google.com/maps/search/?api=1&query=Surya+Teja+Gadwal+Sarees"
              target="_blank"
              rel="noopener noreferrer"
              className="group/dir p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 dark:bg-stone/50 dark:hover:bg-stone/80 text-[#2563EB] dark:text-[#60A5FA] hover:text-[#1D4ED8] dark:hover:text-[#93C5FD] font-semibold text-xs flex items-center gap-1.5 transition-all duration-200 border border-slate-200/80 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/25 shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
              title="Open Google Directions"
            >
              <Navigation className="w-3.5 h-3.5 group-hover/dir:translate-x-0.5 group-hover/dir:-translate-y-0.5 transition-transform duration-200" />
              <span className="hidden sm:inline">Directions</span>
            </a>

            {/* Quick QR Code Button */}
            <button
              onClick={onOpenQR}
              className="group/qr p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 dark:bg-stone/50 dark:hover:bg-stone/80 text-carbon hover:text-black dark:text-white dark:hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all duration-200 border border-slate-200/80 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/25 shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer"
              title="Show QR Code"
              aria-label="Open QR Code Modal"
            >
              <QrCode className="w-3.5 h-3.5 text-carbon dark:text-white group-hover/qr:scale-110 transition-transform duration-200" />
              <span className="hidden sm:inline">QR Code</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
