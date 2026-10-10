import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Product, ProductVariant } from '../data/mockData';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useGuestLimit } from '../context/GuestLimitContext';
import PageTransition from '../components/PageTransition';
import ProductCard from '../components/ProductCard';
import { ProductDetailsSkeleton, ProductCardSkeleton } from '../components/Skeletons';
import { fetchApi } from '../api';
import SmoothImage from '../components/SmoothImage';
import GooeyPagination from '../components/GooeyPagination';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToast } = useToast();
  const { incrementViewCount } = useGuestLimit();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [galleryProgressFloat, setGalleryProgressFloat] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      setLoadingRecs(true);
      setSelectedVariant(null);
      setProduct(null);
      setRecommendations([]);

      const predictedCatId = id.includes('-') ? id.split('-')[0] : null;

      // Launch main product, category products, and catalog fallback in PARALLEL
      const productPromise = fetchApi(`/api/products/${id}/`);
      const catPromise = predictedCatId ? fetchApi(`/api/products/?category=${predictedCatId}&page_size=12`) : null;
      const allPromise = fetchApi('/api/products/?page_size=12');

      try {
        const prodData = await productPromise;
        if (!isMounted) return;

        setProduct(prodData);
        setActiveImageIndex(0);
        incrementViewCount();
        setLoading(false);

        const actualCatId = typeof prodData.category === 'object' ? (prodData.category as any)?.id : prodData.category;
        const categoryToUse = actualCatId || predictedCatId;

        const [catData, allData] = await Promise.all([
          catPromise && String(categoryToUse) === String(predictedCatId)
            ? catPromise
            : (categoryToUse ? fetchApi(`/api/products/?category=${categoryToUse}&page_size=12`) : Promise.resolve([])),
          allPromise
        ]);

        if (!isMounted) return;

        let catList = Array.isArray(catData) ? catData : (catData?.results || []);
        let allList = Array.isArray(allData) ? allData : (allData?.results || []);

        catList = catList.filter((p: Product) => p.id !== prodData.id);
        allList = allList.filter((p: Product) => p.id !== prodData.id);

        // Combine category items first, followed by general catalog items for a full 12-item list
        const combinedMap = new Map<string, Product>();
        catList.forEach((p: Product) => combinedMap.set(p.id, p));
        allList.forEach((p: Product) => {
          if (!combinedMap.has(p.id)) {
            combinedMap.set(p.id, p);
          }
        });

        const finalRecommendations = Array.from(combinedMap.values()).slice(0, 12);

        if (isMounted) {
          setRecommendations(finalRecommendations);
        }
      } catch (error: any) {
        if (isMounted) {
          addToast(error.message || 'Error fetching product data. Please try again.', 'error');
          setLoading(false);
        }
      } finally {
        if (isMounted) {
          setLoadingRecs(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);


  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenIndex, setFullScreenIndex] = useState(0);
  const [isContacting, setIsContacting] = useState(false);
  const recommendationsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const recScrollRef = useRef<HTMLDivElement>(null);

  const [recFilter, setRecFilter] = useState<'all' | 'category' | 'new'>('all');

  const filteredRecommendations = useMemo(() => {
    if (!product || recommendations.length === 0) return recommendations;
    
    if (recFilter === 'category') {
      const currentCatId = typeof product.category === 'object' ? (product.category as any)?.id : product.category;
      const currentCatName = typeof product.category === 'object' ? (product.category as any)?.name : null;
      
      const filtered = recommendations.filter((p) => {
        const pCatId = typeof p.category === 'object' ? (p.category as any)?.id : p.category;
        const pCatName = typeof p.category === 'object' ? (p.category as any)?.name : null;
        if (currentCatId && pCatId && String(pCatId) === String(currentCatId)) return true;
        if (currentCatName && pCatName && pCatName === currentCatName) return true;
        return false;
      });
      return filtered.length > 0 ? filtered : recommendations;
    }

    if (recFilter === 'new') {
      const filtered = recommendations.filter((p) => p.isNewArrival);
      return filtered.length > 0 ? filtered : recommendations;
    }

    return recommendations;
  }, [recommendations, recFilter, product]);

  const scrollRecs = (direction: 'left' | 'right') => {
    if (recScrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      recScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleRecFilterChange = (e: React.MouseEvent, filter: 'all' | 'category' | 'new') => {
    e.preventDefault();
    setRecFilter(filter);
    if (recScrollRef.current) {
      recScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const activeGallery = useMemo(() => {
    if (selectedVariant) {
      if (Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0) {
        return selectedVariant.images;
      }
      if (selectedVariant.image) {
        return [selectedVariant.image];
      }
    }
    const list: string[] = [];
    if (product?.image) {
      list.push(product.image);
    }
    if (Array.isArray(product?.images)) {
      product.images.forEach((img: string) => {
        if (img && !list.includes(img)) {
          list.push(img);
        }
      });
    }
    return list.length > 0 ? list : [''];
  }, [product, selectedVariant]);

  const orderedVariants: ProductVariant[] = useMemo(() => {
    if (!Array.isArray(product?.variants)) return [];
    return [...product.variants].sort((a, b) => {
      const aMain = Boolean(a.is_main || (a as any).isMain || (a as any).is_primary || (a as any).is_default);
      const bMain = Boolean(b.is_main || (b as any).isMain || (b as any).is_primary || (b as any).is_default);
      if (aMain && !bMain) return -1;
      if (!aMain && bMain) return 1;
      return 0;
    });
  }, [product]);

  useEffect(() => {
    if (orderedVariants.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const targetVariantId = searchParams.get('variant');
      const targetColor = searchParams.get('color');

      let match: ProductVariant | undefined;
      if (targetVariantId) {
        match = orderedVariants.find((v) => String(v.id) === String(targetVariantId));
      }
      if (!match && targetColor) {
        match = orderedVariants.find(
          (v) => (v.color || '').trim().toLowerCase() === targetColor.trim().toLowerCase()
        );
      }
      if (!match) {
        match = orderedVariants.find(v => Boolean(v.is_main || (v as any).isMain || (v as any).is_default)) || orderedVariants[0];
      }

      setSelectedVariant(match);
    } else {
      setSelectedVariant(null);
    }
  }, [orderedVariants]);

  const allImagesLength = activeGallery.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullScreen) return;
      if (e.key === 'Escape') {
        setIsFullScreen(false);
        document.body.style.overflow = 'unset';
      }
      if (e.key === 'ArrowRight') setFullScreenIndex(prev => prev === allImagesLength - 1 ? 0 : prev + 1);
      if (e.key === 'ArrowLeft') setFullScreenIndex(prev => prev === 0 ? allImagesLength - 1 : prev - 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, allImagesLength]);

  const isWishlisted = product ? isInWishlist(product.id) : false;

  if (loading) {
    return (
      <PageTransition>
        <ProductDetailsSkeleton />
      </PageTransition>
    );
  }

  if (!product) {
    return (
      <PageTransition>
        <div className="container-custom py-[48px] text-center text-[16px]">Product not found</div>
      </PageTransition>
    );
  }

  const handleVariantSelect = (v: ProductVariant) => {
    if ((v.images && v.images.length > 0) || v.image) {
      setSelectedVariant(v);
      setActiveImageIndex(0);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
    } else if (v.id && v.id !== product?.id) {
      navigate(`/product/${v.id}`);
    }
  };

  const handleContactNow = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isContacting || !product) return;
    
    setIsContacting(true);
    try {
      const response = await fetchApi('/api/products/contact/', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id })
      });
      if (response.success && response.whatsapp_url) {
        window.open(response.whatsapp_url, '_blank');
      } else {
        addToast(response.error || "Failed to initiate contact", "error");
      }
    } catch (error: any) {
      addToast(error.message || "Failed to connect to WhatsApp. Please try again.", "error");
    } finally {
      setIsContacting(false);
    }
  };

  const scrollToImage = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const clientWidth = container.clientWidth;
      container.scrollTo({
        left: clientWidth * index,
        behavior: 'smooth'
      });
      setActiveImageIndex(index);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollPosition = container.scrollLeft;
      const clientWidth = container.clientWidth || 1;
      
      const rawProgress = scrollPosition / clientWidth;
      setGalleryProgressFloat(rawProgress);

      const newIndex = Math.round(rawProgress);
      if (newIndex !== activeImageIndex) {
        setActiveImageIndex(newIndex);
      }
    }
  };

  const allImages = activeGallery;

  const openFullScreen = (index: number) => {
    setFullScreenIndex(index);
    setIsFullScreen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
    document.body.style.overflow = 'unset';
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullScreenIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullScreenIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const isVideo = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

  return (
    <PageTransition>
      <main className="w-full">
        <div className="container-custom py-[48px]">
          {/* Breadcrumb */}
          <div className="mb-[32px]">
            <button onClick={() => navigate(-1)} className="text-[12px] font-medium text-carbon/80 dark:text-stone-300 hover:text-carbon dark:hover:text-white transition-colors cursor-pointer flex items-center gap-[4px]">
              ← Back
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[48px] lg:gap-[64px]">
            {/* Gallery Section */}
            <div className="w-full flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`gallery-${product.id}-${selectedVariant?.color || 'main'}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="w-full flex flex-col md:flex-row gap-[16px] items-center md:items-start justify-center"
                >
                  {/* Desktop Vertical Gallery Thumbnails */}
                  {activeGallery.length > 1 && (
                    <div className="hidden md:flex flex-col gap-[10px] overflow-y-auto max-h-[480px] scrollbar-hide p-[2px]">
                      {activeGallery.map((mediaUrl, index) => (
                        <button
                          key={index}
                          onClick={() => scrollToImage(index)}
                          className={`w-[60px] h-[75px] sm:w-[68px] sm:h-[86px] rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-200 ${
                            activeImageIndex === index 
                              ? 'border-carbon shadow-md scale-105' 
                              : 'border-transparent opacity-70 hover:opacity-100 hover:border-smoke'
                          }`}
                          aria-label={`Select image ${index + 1}`}
                        >
                          {isVideo(mediaUrl) ? (
                            <video src={mediaUrl} className="w-full h-full object-cover pointer-events-none" />
                          ) : (
                            <SmoothImage src={mediaUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Main Image Viewport & Mobile Controls */}
                  <div className="w-full flex flex-col items-center flex-1 max-w-[380px]">
                    <div 
                      ref={scrollContainerRef}
                      onScroll={handleScroll}
                      className="w-full aspect-[3/4] bg-stone rounded-xl overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex scrollbar-hide shadow-sm"
                    >
                      {activeGallery.map((mediaUrl, idx) => (
                        <div key={idx} className="w-full h-full shrink-0 snap-center relative">
                          {isVideo(mediaUrl) ? (
                            <video 
                              src={mediaUrl}
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => openFullScreen(idx)}
                              autoPlay
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <SmoothImage 
                              src={mediaUrl} 
                              alt={`${product.name} - View ${idx + 1}`} 
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => openFullScreen(idx)}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Sticky Gooey Blob Pagination Dots Directly Below Main Image */}
                    {activeGallery.length > 1 && (
                      <div className="flex justify-center w-full my-[14px]">
                        <GooeyPagination
                          total={activeGallery.length}
                          activeIndex={activeImageIndex}
                          progressFloat={galleryProgressFloat}
                          onSelect={scrollToImage}
                          size="md"
                        />
                      </div>
                    )}

                    {/* Mobile Horizontal Gallery Thumbnails Row Directly Below Dots (Matching Screenshot 2) */}
                    {activeGallery.length > 1 && (
                      <div className="flex md:hidden gap-[10px] overflow-x-auto max-w-full scrollbar-hide p-[2px] justify-center">
                        {activeGallery.map((mediaUrl, index) => (
                          <button
                            key={index}
                            onClick={() => scrollToImage(index)}
                            className={`w-[56px] h-[70px] rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-200 ${
                              activeImageIndex === index 
                                ? 'border-carbon shadow-md scale-105' 
                                : 'border-transparent opacity-70 hover:opacity-100 hover:border-smoke'
                            }`}
                            aria-label={`Select image ${index + 1}`}
                          >
                            {isVideo(mediaUrl) ? (
                              <video src={mediaUrl} className="w-full h-full object-cover pointer-events-none" />
                            ) : (
                              <SmoothImage src={mediaUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Details */}
            <div className="w-full flex flex-col pt-[16px] lg:pt-[32px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`details-${product.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex flex-col"
                >
                  <div className="mb-[32px]">
                    <span className="font-sans font-bold text-[11px] text-graphite dark:text-stone-300 uppercase tracking-widest mb-[8px] block">
                      {product.brand}
                    </span>
                    <h1 className="font-serif text-[32px] md:text-[40px] text-carbon dark:text-white leading-[1.1] tracking-tight">
                      {product.name}
                    </h1>
                  </div>

                  {/* Variants Selector */}
                  {orderedVariants.length > 0 && (
                    <div className="mb-[32px]">
                      <div className="flex items-center justify-between mb-[12px]">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-carbon dark:text-white">Colors / Variants</h3>
                        {selectedVariant && (
                          <span className="text-[11px] font-semibold text-graphite dark:text-stone-300 uppercase tracking-wider">
                            {selectedVariant.color}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-[10px] sm:gap-[12px] pb-[8px] w-full relative">
                        {orderedVariants.map((v, idx) => {
                          const isSelected = selectedVariant ? selectedVariant.color === v.color : v.is_main;
                          const thumb = v.image || product?.image;
                          return (
                            <button
                              key={v.id || idx}
                              onClick={() => handleVariantSelect(v)}
                              className={`group flex items-center gap-[8px] px-[14px] py-[8px] rounded-full border transition-all duration-300 shrink-0 cursor-pointer ${
                                isSelected 
                                  ? 'border-carbon dark:border-white/90 bg-carbon dark:bg-gradient-to-b dark:from-white dark:via-zinc-100 dark:to-zinc-200 text-paper dark:text-zinc-950 shadow-md dark:shadow-[0_4px_14px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.9)] font-bold scale-[1.02]' 
                                  : 'border-carbon/15 dark:border-white/20 bg-white/70 dark:bg-white/[0.08] hover:bg-white/95 dark:hover:bg-white/[0.18] text-carbon dark:text-zinc-100 hover:border-carbon/40 dark:hover:border-white/40 backdrop-blur-md font-medium shadow-xs'
                              }`}
                            >
                              {thumb && (
                                <SmoothImage 
                                  src={thumb} 
                                  alt={v.color} 
                                  className={`w-[22px] h-[22px] rounded-full object-cover border transition-transform duration-200 group-hover:scale-105 ${
                                    isSelected ? 'border-paper/60 dark:border-black/30' : 'border-carbon/20 dark:border-white/30'
                                  }`}
                                />
                              )}
                              <span className="text-[12px] uppercase tracking-wider whitespace-nowrap font-bold">
                                {v.color}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-[12px] mb-[32px] border-t border-smoke/70 dark:border-white/15 pt-[32px]">
                    <div className="flex gap-[12px] items-stretch">
                      <button 
                        type="button"
                        onClick={handleContactNow}
                        disabled={isContacting}
                        className="flex-1 py-[14px] px-[20px] rounded-xl font-bold text-[12px] uppercase tracking-wider flex items-center justify-center gap-2 border border-carbon dark:border-white/80 bg-carbon dark:bg-gradient-to-b dark:from-white dark:via-zinc-100 dark:to-zinc-200 text-paper dark:text-zinc-950 shadow-md dark:shadow-[0_4px_18px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.95)] hover:shadow-lg hover:brightness-105 active:scale-[0.99] disabled:opacity-75 transition-all cursor-pointer"
                        style={{ minWidth: 0 }}
                      >
                        {isContacting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          'Contact Now'
                        )}
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (product) {
                            const success = toggleWishlist(product);
                            if (success && !isWishlisted) {
                              addToast("Added to wishlist", "success");
                            }
                          }
                        }}
                        className={`w-[50px] flex items-center justify-center rounded-xl border transition-all duration-300 backdrop-blur-md cursor-pointer ${
                          isWishlisted 
                            ? 'border-red-500 bg-red-500/20 text-red-500 shadow-md scale-105' 
                            : 'border-carbon/15 dark:border-white/20 bg-white/70 dark:bg-white/[0.08] text-carbon dark:text-white hover:bg-white/95 dark:hover:bg-white/[0.18] hover:border-carbon/40 dark:hover:border-white/40 shadow-xs'
                        }`}
                        aria-label="Add to wishlist"
                      >
                        <Heart className={`w-[20px] h-[20px] transition-transform duration-300 ${isWishlisted ? 'fill-current scale-110' : 'scale-100 active:scale-90'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-[8px]">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-carbon dark:text-white mb-[12px]">Product Details</h3>
                    <div className="p-[18px] rounded-xl bg-white/60 dark:bg-white/[0.08] backdrop-blur-md border border-carbon/10 dark:border-white/15 shadow-xs">
                      <p className="text-[13px] text-carbon dark:text-stone-100 leading-relaxed font-normal">
                        {product.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>

          {/* Recommendations */}
          <div className="pt-[48px] border-t border-smoke mt-[48px]" ref={recommendationsRef}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-[16px] mb-[24px]">
              <div>
                <h2 className="text-display !my-0 !text-left text-[24px] md:text-[28px]">You May Also Like</h2>
                
                {/* Minimalist Blended Filter Tabs */}
                <div className="flex items-center gap-[12px] sm:gap-[16px] mt-[12px] overflow-x-auto scrollbar-hide py-[2px]">
                  <button
                    type="button"
                    onClick={(e) => handleRecFilterChange(e, 'all')}
                    className={`text-[11px] uppercase tracking-widest font-sans transition-all duration-200 pb-[4px] border-b-2 whitespace-nowrap ${
                      recFilter === 'all'
                        ? 'border-carbon text-carbon font-bold'
                        : 'border-transparent text-graphite/60 hover:text-carbon font-medium'
                    }`}
                  >
                    All Items ({recommendations.length})
                  </button>
                  <span className="text-smoke text-[10px] select-none">•</span>
                  <button
                    type="button"
                    onClick={(e) => handleRecFilterChange(e, 'category')}
                    className={`text-[11px] uppercase tracking-widest font-sans transition-all duration-200 pb-[4px] border-b-2 whitespace-nowrap ${
                      recFilter === 'category'
                        ? 'border-carbon text-carbon font-bold'
                        : 'border-transparent text-graphite/60 hover:text-carbon font-medium'
                    }`}
                  >
                    Same Collection
                  </button>
                  <span className="text-smoke text-[10px] select-none">•</span>
                  <button
                    type="button"
                    onClick={(e) => handleRecFilterChange(e, 'new')}
                    className={`text-[11px] uppercase tracking-widest font-sans transition-all duration-200 pb-[4px] border-b-2 whitespace-nowrap ${
                      recFilter === 'new'
                        ? 'border-carbon text-carbon font-bold'
                        : 'border-transparent text-graphite/60 hover:text-carbon font-medium'
                    }`}
                  >
                    New Arrivals
                  </button>
                </div>
              </div>

              {filteredRecommendations.length > 0 && (
                <div className="flex items-center gap-[8px] self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollRecs('left')}
                    className="w-[36px] h-[36px] rounded-full border border-smoke bg-paper hover:bg-stone text-carbon flex items-center justify-center transition-colors shadow-sm"
                    aria-label="Scroll left recommendations"
                  >
                    <ChevronLeft className="w-[18px] h-[18px]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollRecs('right')}
                    className="w-[36px] h-[36px] rounded-full border border-smoke bg-paper hover:bg-stone text-carbon flex items-center justify-center transition-colors shadow-sm"
                    aria-label="Scroll right recommendations"
                  >
                    <ChevronRight className="w-[18px] h-[18px]" />
                  </button>
                </div>
              )}
            </div>
            
            {loadingRecs ? (
              <div className="flex gap-[20px] md:gap-[24px] overflow-x-auto scrollbar-hide py-[8px] px-[2px] min-h-[380px]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-[72vw] max-w-[260px] sm:max-w-none sm:w-[280px] md:w-[300px] shrink-0">
                    <ProductCardSkeleton />
                  </div>
                ))}
              </div>
            ) : filteredRecommendations.length === 0 ? (
              <div className="text-left py-8 text-graphite text-[14px]">No items found matching this filter.</div>
            ) : (
              <>
                <div 
                  ref={recScrollRef}
                  className="flex gap-[20px] md:gap-[24px] overflow-x-auto snap-x snap-mandatory scrollbar-hide py-[8px] px-[2px] min-h-[380px]"
                >
                  <AnimatePresence mode="sync">
                    {filteredRecommendations.map((recProduct, i) => (
                      <motion.div
                        key={`${recFilter}-${recProduct.id}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: (i % 4) * 0.02 }}
                        className="w-[72vw] max-w-[260px] sm:max-w-none sm:w-[280px] md:w-[300px] shrink-0 snap-start"
                      >
                        <ProductCard product={recProduct} showDescription={true} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="mt-[40px] flex justify-center items-center">
                  <button 
                    onClick={() => {
                      const catId = typeof product.category === 'object' ? (product.category as any)?.id : product.category;
                      navigate(catId ? `/products?category=${catId}` : '/products');
                    }}
                    className="px-[24px] py-[12px] bg-carbon text-paper border border-carbon rounded text-[11px] hover:bg-carbon/90 transition-colors font-semibold uppercase tracking-wider shadow-sm flex items-center gap-[8px] group"
                  >
                    <span>Explore Full Collection</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                </div>
              </>
            )}
          </div>

        </div>
      </main>

      {/* Full Screen Image Viewer Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isFullScreen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[9999] bg-carbon/95 backdrop-blur-sm flex flex-col items-center justify-center"
              onClick={closeFullScreen}
            >
              {/* Close Button */}
              <button 
                className="absolute top-[24px] right-[24px] z-[10010] p-2 bg-paper/10 hover:bg-paper/20 rounded-full transition-colors text-paper"
                onClick={closeFullScreen}
                aria-label="Close full screen"
              >
                <X className="w-[24px] h-[24px]" />
              </button>

              {/* Navigation Buttons */}
              {allImages.length > 1 && (
                <>
                  <button 
                    className="absolute left-[8px] md:left-[48px] top-1/2 -translate-y-1/2 z-[10010] p-2 md:p-3 bg-paper/20 hover:bg-paper/40 rounded-full transition-colors text-paper"
                    onClick={prevImage}
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-[24px] h-[24px] md:w-[32px] md:h-[32px]" />
                  </button>
                  <button 
                    className="absolute right-[8px] md:right-[48px] top-1/2 -translate-y-1/2 z-[10010] p-2 md:p-3 bg-paper/20 hover:bg-paper/40 rounded-full transition-colors text-paper"
                    onClick={nextImage}
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-[24px] h-[24px] md:w-[32px] md:h-[32px]" />
                  </button>
                </>
              )}

              {/* Image Container with Zoom */}
              <div 
                className="w-full h-full flex items-center justify-center p-[16px] md:p-[48px] overflow-hidden relative z-[10000]"
                onClick={(e) => e.stopPropagation()}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={fullScreenIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    {isVideo(allImages[fullScreenIndex]) ? (
                      <video
                        src={allImages[fullScreenIndex]}
                        controls
                        autoPlay
                        className="max-w-full max-h-full object-contain pointer-events-auto"
                      />
                    ) : (
                      <TransformWrapper
                        initialScale={1}
                        minScale={1}
                        maxScale={4}
                        centerOnInit
                      >
                        <TransformComponent wrapperClass="w-full h-full flex items-center justify-center">
                          <SmoothImage
                            src={allImages[fullScreenIndex]}
                            alt={`${product.name} - Full Screen View`}
                            className="max-w-full max-h-full object-contain pointer-events-auto"
                          />
                        </TransformComponent>
                      </TransformWrapper>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {/* Mobile Navigation Dots with Gooey Effect */}
              {allImages.length > 1 && (
                <div className="absolute bottom-[48px] left-1/2 -translate-x-1/2 flex justify-center z-[10010]" onClick={(e) => e.stopPropagation()}>
                  <GooeyPagination
                    total={allImages.length}
                    activeIndex={fullScreenIndex}
                    onSelect={(index) => setFullScreenIndex(index)}
                    size="md"
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </PageTransition>
  );
}
