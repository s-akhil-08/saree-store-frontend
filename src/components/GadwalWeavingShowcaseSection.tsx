import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchApi } from '../api';
import SmoothImage from './SmoothImage';
import { ShowcaseSectionSkeleton } from './Skeletons';

interface ShowcaseImageItem {
  id: number;
  image: string;
  caption?: string;
  order: number;
}

interface ShowcaseData {
  id: number;
  heading: string;
  description: string;
  button_text: string;
  button_link: string;
  is_active: boolean;
  images: ShowcaseImageItem[];
}

const DEFAULT_IMAGE = "https://gsmbkisyyeavmdwkuwoy.supabase.co/storage/v1/object/public/product-images/home-Image.webp";

export default function GadwalWeavingShowcaseSection() {
  const [data, setData] = useState<ShowcaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadShowcase = async () => {
      try {
        const res = await fetchApi('/api/showcase/');
        if (isMounted && res) {
          setData(res);
        }
      } catch {
        // Fallback to default rendering on API error
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadShowcase();

    return () => {
      isMounted = false;
    };
  }, []);

  const imageList = data?.images && data.images.length > 0
    ? data.images.map(img => img.image).filter(Boolean)
    : [DEFAULT_IMAGE];

  // Preload all showcase images into browser cache so slide transitions never stutter on network fetch
  useEffect(() => {
    if (!imageList || imageList.length === 0) return;
    imageList.forEach(src => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [imageList]);

  // Autoplay timer: Resets on activeIndex change so manual navigation (Prev/Next/Swipe/Dot click) restarts full 3.5s loading cycle
  useEffect(() => {
    if (imageList.length <= 1) return;
    const timer = setTimeout(() => {
      setActiveIndex(prev => (prev + 1) % imageList.length);
    }, 3500);
    return () => clearTimeout(timer);
  }, [activeIndex, imageList.length]);

  if (loading) {
    return <ShowcaseSectionSkeleton />;
  }

  if (data && data.is_active === false) {
    return null;
  }

  const heading = data?.heading || "The Art of Handloom Weaving";
  const description = data?.description || "Discover our exquisite collection of handloom sarees, where traditional craftsmanship meets timeless elegance. Woven with rich heritage and intricate detailing, each saree reflects the beauty of simplicity, tradition, and enduring style.";
  const buttonText = data?.button_text || "VIEW THE COLLECTION";
  const buttonLink = data?.button_link || "/products";

  const handleNext = () => {
    setActiveIndex(prev => (prev + 1) % imageList.length);
  };

  const handlePrev = () => {
    setActiveIndex(prev => (prev - 1 + imageList.length) % imageList.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <section className="container-custom py-[48px] border-t border-[var(--color-smoke)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[32px] md:gap-[48px] items-center">
        {/* Left Side Container: Single-Card Horizontal Snap Carousel */}
        <div className="flex flex-col items-center w-full">
          {/* Main Card Viewport - overflow: hidden clips cards cleanly at left/right edges */}
          <div 
            className="relative w-full aspect-[4/3] bg-stone rounded-[16px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-smoke/40 select-none group"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Sliding Container: Moves x from right to left with smooth 0.85s gel ease-out transition */}
            <motion.div
              className="flex w-full h-full"
              animate={{ x: `-${activeIndex * 100}%` }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            >
              {imageList.map((imgSrc, idx) => (
                <div key={idx} className="w-full h-full shrink-0 relative">
                  <SmoothImage 
                    src={imgSrc} 
                    alt={`${heading} ${idx + 1}`} 
                    loading="eager"
                    decoding="async" 
                    className="w-full h-full object-cover pointer-events-none" 
                  />
                </div>
              ))}
            </motion.div>

            {/* Navigation Overlay Arrows */}
            {imageList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous Showcase Image"
                  className="absolute left-[12px] top-1/2 -translate-y-1/2 w-[36px] h-[36px] rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all shadow-md z-10 cursor-pointer"
                >
                  <ChevronLeft className="w-[18px] h-[18px]" />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next Showcase Image"
                  className="absolute right-[12px] top-1/2 -translate-y-1/2 w-[36px] h-[36px] rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all shadow-md z-10 cursor-pointer"
                >
                  <ChevronRight className="w-[18px] h-[18px]" />
                </button>
              </>
            )}
          </div>

          {/* Pagination Indicator Row with High Contrast Progress Fill Matching Auto Scroll */}
          {imageList.length > 1 && (
            <div className="flex items-center justify-center gap-[8px] mt-[16px]">
              {imageList.map((_, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Go to slide ${idx + 1}`}
                    className={`relative h-[8px] rounded-full overflow-hidden transition-all duration-300 ${
                      isActive 
                        ? 'w-[24px] bg-carbon/20 dark:bg-white/20' 
                        : 'w-[8px] bg-carbon/35 dark:bg-white/30 hover:bg-carbon/60 dark:hover:bg-white/60'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        key={activeIndex}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 3.5, ease: 'linear' }}
                        className="w-full h-full bg-carbon dark:bg-white rounded-full origin-left"
                        style={{ transformOrigin: 'left center' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Content */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center lg:items-start text-center lg:text-left p-[24px] sm:p-[32px] lg:p-[40px] rounded-[20px] bg-paper/40 dark:bg-black/45 backdrop-blur-[16px] border border-smoke/40 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
        >
          <h2 className="font-serif text-[26px] sm:text-[32px] md:text-[36px] font-bold text-carbon dark:text-white leading-tight tracking-tight mb-[16px] dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {heading}
          </h2>
          <p className="text-[13px] sm:text-[14px] md:text-[15px] text-graphite dark:text-stone-200 leading-relaxed mb-[28px] max-w-md md:max-w-lg dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
            {description}
          </p>
          <Link 
            to={buttonLink} 
            className="inline-flex items-center gap-[8px] text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.15em] text-carbon dark:text-white border-b-2 border-carbon dark:border-white pb-[4px] hover:opacity-70 transition-all group dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
          >
            <span>{buttonText}</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
