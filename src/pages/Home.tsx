import { useRef, useEffect, useState, useCallback } from 'react';
import PageTransition from '../components/PageTransition';
import CategoryTile from '../components/CategoryTile';
import NewArrivalCard from '../components/NewArrivalCard';
import { MoveRight } from 'lucide-react';
import { ProductCardSkeleton } from '../components/Skeletons';
import { fetchApi } from '../api';
import { useToast } from '../context/ToastContext';
import type { Product, Category } from '../data/mockData';
import { useHorizontalMouseScroll } from '../hooks/useHorizontalMouseScroll';
import NotFoundPage from './NotFoundPage';

import GadwalWeavingShowcaseSection from '../components/GadwalWeavingShowcaseSection';

export default function Home() {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showErrorPage, setShowErrorPage] = useState(false);
  const [errorStatusCode, setErrorStatusCode] = useState<number | string>(500);
  const { addToast } = useToast();
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const newArrivalsRef = useRef<HTMLDivElement>(null);
  const firstErrorTimeRef = useRef<number | null>(null);
  const retryTimerRef = useRef<any>(null);
  const hasToastedRef = useRef<boolean>(false);

  const hasLoadedDataRef = useRef<boolean>(false);

  // Enable mouse wheel (without Shift/Ctrl) and mouse drag scrolling for Categories and New Arrivals rails
  useHorizontalMouseScroll(scrollRef, [categories]);
  useHorizontalMouseScroll(newArrivalsRef, [newArrivals]);

  const handleScroll = () => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
          const maxScroll = scrollWidth - clientWidth;
          setScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
        }
      });
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      handleScroll();
    }
  }, [categories]);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent && !hasLoadedDataRef.current) {
      setLoadingNewArrivals(true);
      setLoadingCategories(true);
    }

    try {
      const [productsData, categoriesData] = await Promise.all([
        fetchApi('/api/products/?isNewArrival=true', { cache: 'no-cache' }),
        fetchApi('/api/categories/')
      ]);

      let fetchedNewArrivals = productsData?.results || productsData || [];
      if (!Array.isArray(fetchedNewArrivals)) fetchedNewArrivals = [];
      
      // If products contain an explicit order/display_order/position/priority property, sort ascending by that field
      const getOrderScore = (p: any): number | null => {
        if (typeof p.display_order === 'number') return p.display_order;
        if (typeof p.order === 'number') return p.order;
        if (typeof p.sort_order === 'number') return p.sort_order;
        if (typeof p.position === 'number') return p.position;
        if (typeof p.priority === 'number') return p.priority;
        if (typeof p.sequence === 'number') return p.sequence;
        if (typeof p.order_index === 'number') return p.order_index;
        if (typeof p.rank === 'number') return p.rank;
        return null;
      };

      const hasExplicitOrder = fetchedNewArrivals.some((p: any) => getOrderScore(p) !== null);
      if (hasExplicitOrder) {
        fetchedNewArrivals = [...fetchedNewArrivals].sort((a: any, b: any) => {
          const ordA = getOrderScore(a);
          const ordB = getOrderScore(b);
          if (ordA !== null && ordB !== null) return ordA - ordB;
          if (ordA !== null) return -1;
          if (ordB !== null) return 1;
          return 0;
        });
      }

      let list = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results || []);
      if (!Array.isArray(list)) list = [];

      const getCatOrder = (c: any): number | null => {
        if (typeof c.order === 'number') return c.order;
        if (typeof c.display_order === 'number') return c.display_order;
        return null;
      };

      if (list.some((c: any) => getCatOrder(c) !== null)) {
        list = [...list].sort((a: any, b: any) => {
          const ordA = getCatOrder(a);
          const ordB = getCatOrder(b);
          if (ordA !== null && ordB !== null) return ordA - ordB;
          if (ordA !== null) return -1;
          if (ordB !== null) return 1;
          return 0;
        });
      }

      setNewArrivals(fetchedNewArrivals);
      setCategories(list);
      hasLoadedDataRef.current = true;
      
      setShowErrorPage(false);
      firstErrorTimeRef.current = null;
      hasToastedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    } catch (error: any) {
      // If data is already loaded or this was a background idle poll, never disrupt UI with 503 screen
      if (hasLoadedDataRef.current || isSilent) {
        return;
      }

      const message = error?.message || 'Failed to fetch home page data.';
      
      let statusCode: number | string = 500;
      const statusMatch = String(message).match(/API error:\s*(\d+)/i);
      if (statusMatch) {
        statusCode = parseInt(statusMatch[1], 10);
      } else if (String(message).toLowerCase().includes('failed to fetch')) {
        statusCode = 503;
      }

      setErrorStatusCode(statusCode);

      if (!firstErrorTimeRef.current) {
        firstErrorTimeRef.current = Date.now();
      }

      if (!hasToastedRef.current) {
        addToast(`Connecting to server... Retrying in background.`, 'error');
        hasToastedRef.current = true;
      }

      const elapsed = Date.now() - firstErrorTimeRef.current;
      // Allow up to 45 seconds for Render backend cold start before presenting full error page
      if (elapsed >= 45000) {
        setShowErrorPage(true);
        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
        }
      } else {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(() => {
          loadData(true);
        }, 3000);
      }
    } finally {
      if (!isSilent) {
        setLoadingNewArrivals(false);
        setLoadingCategories(false);
      }
    }
  }, [addToast]);

  useEffect(() => {
    let isMounted = true;
    loadData(false);

    // Visibility-aware background polling (only when tab is active)
    const pollInterval = setInterval(() => {
      if (isMounted && !firstErrorTimeRef.current && typeof document !== 'undefined' && document.visibilityState !== 'hidden') {
        loadData(true);
      }
    }, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        loadData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [loadData]);

  if (showErrorPage) {
    return (
      <NotFoundPage
        statusCode={errorStatusCode}
        onRetry={() => {
          firstErrorTimeRef.current = null;
          hasToastedRef.current = false;
          setShowErrorPage(false);
          loadData(false);
        }}
        title="Server Connection Error"
        description="Unable to load home page content from the backend server. The system is silently retrying the request."
      />
    );
  }

  return (
    <PageTransition>
      <main className="w-full">
        {/* Categories Horizontal Scroll */}
        <section className="container-custom py-[32px] md:py-[40px] min-h-[420px] overflow-hidden">
          <div className="flex justify-between items-end mb-[16px] md:mb-[20px]">
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-carbon">Shop by Category</h2>
            {categories.length > 3 && (
              <div className="hidden md:flex items-center gap-[8px] text-[10px] uppercase tracking-widest text-graphite font-bold">
                <span>Scroll to explore</span>
                <MoveRight className="w-[12px] h-[12px]" />
              </div>
            )}
          </div>
          
          {loadingCategories ? (
            <div className="flex overflow-x-auto gap-[24px] scrollbar-hide pb-[16px] -mx-[16px] px-[16px] md:-mx-0 md:px-0">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[80vw] md:w-[320px] lg:w-[400px] shrink-0">
                  <div className="w-full aspect-[3/4] bg-stone/40 animate-pulse rounded-lg border border-smoke" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-graphite">
              No categories available.
            </div>
          ) : (
            <>
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto gap-[24px] scroll-smooth scrollbar-hide pb-[16px] -mx-[16px] px-[16px] md:-mx-0 md:px-0 cursor-grab active:cursor-grabbing select-none"
              >
                {categories.map((category, i) => (
                  <div key={category.id} className="w-[80vw] md:w-[320px] lg:w-[400px] shrink-0">
                    <CategoryTile 
                      id={category.id}
                      name={category.name}
                      image={category.image}
                      priority={i < 2}
                    />
                  </div>
                ))}
              </div>

              {/* Minimalist Scroll Progress Bar */}
              {categories.length > 1 && (
                <div className="w-full h-[1.1px] bg-smoke mt-[8px] relative overflow-hidden">
                  <div 
                    className="h-full bg-carbon origin-left transition-transform duration-75 ease-out"
                    style={{ transform: `scaleX(${scrollProgress})`, transformOrigin: 'left' }}
                  />
                </div>
              )}
            </>
          )}
        </section>

        {/* New Arrivals Rail */}
        <section className="container-custom py-[32px] md:py-[40px] min-h-[380px] border-t border-smoke overflow-hidden">
          <div className="flex justify-between items-end mb-[16px] md:mb-[20px]">
            <h2 className="text-display">
              New Arrivals
            </h2>
            {newArrivals.length > 4 && (
              <div className="hidden md:flex items-center gap-[8px] text-[10px] uppercase tracking-widest text-graphite font-bold">
                <span>Scroll to explore</span>
                <MoveRight className="w-[12px] h-[12px]" />
              </div>
            )}
          </div>
          {loadingNewArrivals ? (
            <div className="flex overflow-x-auto gap-[20px] md:gap-[24px] scrollbar-hide pb-[16px] -mx-[16px] px-[16px] md:-mx-0 md:px-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[260px] sm:w-[280px] md:w-[300px] shrink-0">
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          ) : (
            <div 
              ref={newArrivalsRef}
              className="flex overflow-x-auto gap-[20px] md:gap-[24px] scroll-smooth scrollbar-hide pb-[16px] -mx-[16px] px-[16px] md:-mx-0 md:px-0 cursor-grab active:cursor-grabbing select-none"
            >
              {newArrivals.map((product, i) => (
                <div key={product.id} className="w-[260px] sm:w-[280px] md:w-[300px] shrink-0">
                  <NewArrivalCard product={product} showDescription={true} priority={i === 0} />
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* Dynamic Gadwal Weaving Showcase Section */}
        <GadwalWeavingShowcaseSection />
      </main>
    </PageTransition>
  );
}
