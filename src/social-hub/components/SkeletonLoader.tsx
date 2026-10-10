import { motion } from 'framer-motion';

export function GoogleDirectionSkeleton() {
  return (
    <section className="pt-6 pb-2">
      <div className="container-custom">
        <div className="relative rounded-2xl social-card-glass p-5 sm:p-6 border border-white/60 dark:border-white/10 shadow-sm overflow-hidden">
          {/* Top animated shimmer bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-stone/40 via-stone/80 to-stone/40 dark:from-stone/20 dark:via-stone/50 dark:to-stone/20 animate-pulse" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            {/* Left Location Info */}
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 flex-1 w-full">
              {/* Icon Placeholder */}
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-stone/70 dark:bg-stone/40 animate-pulse shrink-0" />

              <div className="min-w-0 flex-1 space-y-2">
                {/* Badges */}
                <div className="flex items-center gap-2">
                  <div className="w-28 h-4 sm:h-5 rounded-full bg-emerald-500/15 animate-pulse" />
                  <div className="w-32 h-4 rounded bg-stone/50 dark:bg-stone/30 animate-pulse" />
                </div>

                {/* Title */}
                <div className="w-48 sm:w-72 h-5 sm:h-6 rounded-lg bg-stone/70 dark:bg-stone/40 animate-pulse" />

                {/* Address */}
                <div className="w-full max-w-md h-3.5 sm:h-4 rounded bg-stone/50 dark:bg-stone/30 animate-pulse" />
              </div>
            </div>

            {/* Right Action Buttons (Directions + Copy + Phone + WhatsApp) */}
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-smoke/40 dark:border-smoke/20">
              {/* Directions Button */}
              <div className="flex-1 md:w-36 h-10 rounded-xl bg-stone/70 dark:bg-stone/40 animate-pulse" />
              {/* Copy Button */}
              <div className="w-20 sm:w-24 h-10 rounded-xl bg-stone/50 dark:bg-stone/30 animate-pulse" />
              {/* Phone Button */}
              <div className="w-10 h-10 rounded-xl bg-stone/50 dark:bg-stone/30 animate-pulse shrink-0" />
              {/* WhatsApp Button */}
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 dark:bg-emerald-500/30 animate-pulse shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SocialCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="relative flex flex-col justify-between social-card-glass rounded-2xl overflow-hidden w-full"
    >
      {/* Top accent shimmer bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-stone/40 via-stone/70 to-stone/40 dark:from-stone/20 dark:via-stone/40 dark:to-stone/20 animate-pulse" />

      {/* Card Body - Matching compact height and padding */}
      <div className="p-3.5 sm:p-4 pt-3.5 sm:pt-4 pb-2.5 sm:pb-3 flex flex-col">
        {/* Header: Icon + Name + Handle */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-stone/70 dark:bg-stone/40 animate-pulse shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="w-32 h-4 sm:h-4.5 rounded-md bg-stone/70 dark:bg-stone/40 animate-pulse" />
            <div className="w-24 h-3 rounded bg-stone/50 dark:bg-stone/30 animate-pulse" />
          </div>
        </div>
      </div>

      {/* 3-Button Action Footer Strip (Matching 6-3-3 grid proportions) */}
      <div className="border-t border-smoke/40 dark:border-white/10 grid grid-cols-12 divide-x divide-smoke/40 dark:divide-white/10 mt-auto bg-black/[0.02] dark:bg-white/[0.02]">
        {/* Visit / Join Action (50% on mobile & desktop) */}
        <div className="col-span-6 h-10 bg-stone/60 dark:bg-stone/30 animate-pulse" />
        {/* Copy Action (25% on mobile & desktop) */}
        <div className="col-span-3 h-10 bg-stone/40 dark:bg-stone/20 animate-pulse" />
        {/* Share Action (25% on mobile & desktop) */}
        <div className="col-span-3 h-10 bg-stone/40 dark:bg-stone/20 animate-pulse" />
      </div>
    </motion.div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <SocialCardSkeleton key={`skeleton-${idx}`} index={idx} />
      ))}
    </div>
  );
}
