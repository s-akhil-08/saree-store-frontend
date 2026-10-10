import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../api';
import type { Product } from '../data/mockData';
import SmoothImage from './SmoothImage';

interface ProductCardProps {
  product: Product;
  showDescription?: boolean;
  priority?: boolean;
}

interface ColorVariantItem {
  id?: string;
  color: string;
  image: string;
}

export default function ProductCard({ product, showDescription = true, priority = false }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToast } = useToast();
  
  const isWishlisted = isInWishlist(product.id);
  const [selectedVarIndex, setSelectedVarIndex] = useState(0);

  // Extract unique colors/variants with is_main prioritized first for default display
  const colorVariants = useMemo<ColorVariantItem[]>(() => {
    const list: ColorVariantItem[] = [];
    const seenColors = new Set<string>();

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      // Sort variants so is_main: true is at index 0
      const sorted = [...product.variants].sort((a, b) => {
        const aMain = Boolean(a.is_main || (a as any).isMain || (a as any).is_primary || (a as any).is_default);
        const bMain = Boolean(b.is_main || (b as any).isMain || (b as any).is_primary || (b as any).is_default);
        if (aMain && !bMain) return -1;
        if (!aMain && bMain) return 1;
        return 0;
      });

      sorted.forEach(v => {
        const colorName = (v.color || '').trim();
        const colorKey = colorName.toLowerCase();
        if (colorName && !seenColors.has(colorKey)) {
          const firstImg = v.image || (Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : product.image);
          if (firstImg) {
            seenColors.add(colorKey);
            list.push({
              id: v.id ? String(v.id) : undefined,
              color: colorName,
              image: firstImg
            });
          }
        }
      });
    }

    if (list.length === 0) {
      list.push({
        color: 'Original',
        image: product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '')
      });
    }

    return list;
  }, [product]);

  // Reset selected variant index to 0 (the main variant) when product changes
  useEffect(() => {
    setSelectedVarIndex(0);
  }, [product.id, colorVariants]);

  const isVideo = (url: string) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

  // Preload all color variant images immediately for 0ms instant switching
  useEffect(() => {
    if (!colorVariants || colorVariants.length <= 1) return;
    colorVariants.forEach((v) => {
      if (v.image && !isVideo(v.image)) {
        const img = new Image();
        img.src = v.image;
      }
    });
  }, [colorVariants]);

  const activeVariant = colorVariants[selectedVarIndex] || colorVariants[0];

  const targetUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (activeVariant?.id) params.set('variant', activeVariant.id);
    if (activeVariant?.color && activeVariant.color !== 'Original') params.set('color', activeVariant.color);
    const queryString = params.toString();
    return `/product/${product.id}${queryString ? `?${queryString}` : ''}`;
  }, [product.id, activeVariant]);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = toggleWishlist(product);
    if (success && !isWishlisted) {
      addToast("Added to wishlist", "success");
    }
  };

  const [isContacting, setIsContacting] = useState(false);

  const handleContactNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isContacting) return;
    
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
    } catch (error) {
      console.error("Contact error:", error);
      addToast("Failed to connect to WhatsApp. Please try again.", "error");
    } finally {
      setIsContacting(false);
    }
  };

  return (
    <div className="group flex flex-col w-full card-hover bg-paper p-[16px] relative h-full rounded-md shadow-sm transition-all duration-300">
      <Link 
        to={targetUrl} 
        aria-label={`${product.name} - ${activeVariant?.color || ''}`} 
        className="flex flex-col flex-1 mb-[14px] text-left"
      >
        {/* Main Image Display Container */}
        <div className="relative w-full aspect-[3/4] bg-stone rounded-md overflow-hidden shadow-sm group/cardimg mb-[10px]">
          {colorVariants.map((variant, idx) => {
            const isCurrent = idx === selectedVarIndex;
            return (
              <div 
                key={variant.id || idx}
                className={`absolute inset-0 w-full h-full transition-opacity duration-200 ease-out ${
                  isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {isVideo(variant.image) ? (
                  <video 
                    src={variant.image} 
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : priority && idx === 0 ? (
                  <img 
                    src={variant.image} 
                    alt={`${product.name} ${variant.color}`} 
                    width={300}
                    height={400}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    sizes="(max-width: 640px) 260px, (max-width: 768px) 280px, 300px"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                  />
                ) : (
                  <SmoothImage 
                    src={variant.image} 
                    alt={`${product.name} ${variant.color}`} 
                    width={300}
                    height={400}
                    sizes="(max-width: 640px) 260px, (max-width: 768px) 280px, 300px"
                    decoding="async"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 pointer-events-none"
                  />
                )}
              </div>
            );
          })}

          {/* New Arrival Tag Badge */}
          {product.isNewArrival && (
            <div className="absolute top-[8px] left-[8px] bg-carbon/90 text-paper text-[9px] font-bold uppercase tracking-wider px-[8px] py-[3px] rounded z-20 backdrop-blur-sm">
              New
            </div>
          )}

          {/* In-Card Slide Navigation Arrows */}
          {colorVariants.length > 1 && (
            <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-between px-[6px] opacity-100 md:opacity-0 md:group-hover/cardimg:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedVarIndex(prev => (prev - 1 + colorVariants.length) % colorVariants.length);
                }}
                className="pointer-events-auto w-[28px] h-[28px] rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
                aria-label="Previous color variant"
              >
                <ChevronLeft className="w-[16px] h-[16px]" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedVarIndex(prev => (prev + 1) % colorVariants.length);
                }}
                className="pointer-events-auto w-[28px] h-[28px] rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
                aria-label="Next color variant"
              >
                <ChevronRight className="w-[16px] h-[16px]" />
              </button>
            </div>
          )}
        </div>

        {/* Minimalist Color Swatch Selector Row */}
        {colorVariants.length > 1 && (
          <div 
            className="flex items-center justify-between gap-[8px] mb-[8px] py-[6px] px-[2px] min-h-[34px] select-none"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="flex items-center gap-[8px] py-[2px] px-[2px]">
              {colorVariants.map((variant, idx) => {
                const isSelected = idx === selectedVarIndex;
                return (
                  <button
                    key={variant.id || idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedVarIndex(idx);
                    }}
                    onMouseEnter={() => setSelectedVarIndex(idx)}
                    aria-label={`Select ${variant.color} color variant`}
                    title={variant.color}
                    className={`relative w-[22px] h-[22px] rounded-full overflow-hidden border transition-all duration-200 cursor-pointer shrink-0 ${
                      isSelected 
                        ? 'border-2 border-carbon scale-110 shadow-md z-10' 
                        : 'border-smoke hover:border-carbon opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={variant.image} 
                      alt={variant.color} 
                      className="w-full h-full object-cover pointer-events-none rounded-full"
                    />
                  </button>
                );
              })}
            </div>

            <span className="text-[10px] uppercase font-bold text-graphite/80 tracking-wider truncate max-w-[120px] text-right">
              {activeVariant.color}
            </span>
          </div>
        )}
        
        {/* Title & Description */}
        <div className="flex flex-col flex-1">
          <h3 className="font-serif text-[17px] md:text-[19px] text-carbon leading-tight truncate mb-[4px]">{product.name}</h3>
          <span className="font-sans font-bold text-[10px] text-graphite uppercase tracking-widest mb-[6px]">{product.brand}</span>
          {showDescription && (
            <span className="font-sans text-[12px] text-graphite line-clamp-2 leading-relaxed min-h-[36px]">{product.description}</span>
          )}
        </div>
      </Link>
      
      {/* Bottom Action Bar */}
      <div className="mt-auto flex gap-[8px] relative z-10">
        <button 
          type="button"
          onClick={handleContactNow}
          disabled={isContacting}
          className="flex-1 py-[8px] text-[10px] font-bold uppercase rounded border border-carbon bg-carbon text-paper hover:bg-carbon/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-75"
        >
          {isContacting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            'Contact Now'
          )}
        </button>
        
        <button 
          type="button"
          onClick={handleWishlistToggle}
          className={`w-[36px] flex items-center justify-center rounded border transition-all duration-300 ${
            isWishlisted 
              ? 'border-red-500 bg-red-50 text-red-500' 
              : 'border-smoke text-carbon hover:border-carbon hover:bg-stone'
          }`}
          aria-label={`Add ${product.name} to wishlist`}
        >
          <Heart className={`w-[14px] h-[14px] transition-transform duration-300 ${isWishlisted ? 'fill-current scale-110' : 'scale-100 active:scale-90'}`} />
        </button>
      </div>
    </div>
  );
}
