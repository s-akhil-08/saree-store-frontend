import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, ChevronDown, ArrowRight } from 'lucide-react';
import { fetchApi } from '../api';

export default function Footer() {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoadingCats(true);
    fetchApi('/api/categories/')
      .then((data) => {
        if (!isMounted) return;
        let catList = Array.isArray(data) ? data : (data?.results || []);
        if (Array.isArray(catList) && catList.some((c: any) => typeof c.order === 'number')) {
          catList = [...catList].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        }
        setCategories(catList);
      })
      .catch(() => {
        // Fallback gracefully on error
      })
      .finally(() => {
        if (isMounted) setLoadingCats(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Display top 6 categories in footer for clean vertical balance
  const displayedCategories = categories.slice(0, 6);
  const hasMoreCategories = categories.length > 6;

  return (
    <footer className="bg-stone/50 backdrop-blur-md text-carbon pt-[72px] pb-[48px] w-full mt-[72px] border-t border-smoke">
      {/* <div className="container-custom max-w-[960px] grid grid-cols-1 md:grid-cols-3 gap-[32px] md:gap-[80px] lg:gap-[100px]"> */}
      <div className="container-custom max-w-[1100px] grid grid-cols-1 md:grid-cols-3 gap-[32px] md:gap-[70px] lg:gap-[100px]">

        
        <div>
          <h3 className="font-sans text-[13px] font-bold mb-[24px] uppercase tracking-wider">SILK & LOOM</h3>
          <p className="font-sans text-[13px] text-graphite mb-[16px] leading-relaxed pr-[16px]">
            Handlooms in your pocket. Shop easily and quickly on our website.
          </p>
        </div>

        <div>
          <h3 className="font-sans text-[13px] font-bold mb-[24px] uppercase tracking-wider">CATEGORIES</h3>
          <div className="flex flex-col gap-[16px] font-sans text-[13px] text-graphite">
            {loadingCats && categories.length === 0 ? (
              <span className="text-graphite/70 animate-pulse">Loading categories...</span>
            ) : categories.length === 0 ? (
              <span>No categories available</span>
            ) : (
              <>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-[12px] md:gap-[16px]">
                  {displayedCategories.map((cat) => (
                    <li key={cat.id}>
                      <Link 
                        to={`/products?category=${cat.id}`} 
                        className="hover:text-carbon hover:translate-x-1 transition-all duration-300 inline-block font-medium truncate max-w-full"
                        title={cat.name}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  to="/products" 
                  className="mt-[4px] inline-flex items-center gap-[6px] text-[11px] font-bold uppercase tracking-wider text-carbon hover:text-carbon/70 transition-colors group"
                >
                  <span>{hasMoreCategories ? `View All Categories (${categories.length})` : 'Browse All Products'}</span>
                  <ArrowRight className="w-[12px] h-[12px] group-hover:translate-x-1 transition-transform" />
                </Link>
              </>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-sans text-[13px] font-bold mb-[24px] uppercase tracking-wider">CUSTOMER SERVICE</h3>
          <ul className="flex flex-col gap-[16px] font-sans text-[13px] text-graphite">
            <li className="flex flex-col">
              <button 
                onClick={() => setIsContactOpen(!isContactOpen)}
                className="flex items-center gap-[4px] hover:text-carbon transition-colors text-left"
              >
                Contact Us
                <ChevronDown className={`w-[14px] h-[14px] transition-transform duration-300 ${isContactOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isContactOpen && (
                <div className="pt-[16px] pb-[4px] flex flex-col gap-[16px] overflow-hidden transition-all duration-300">
                  <div className="flex flex-col gap-[8px]">
                    <span className="text-[16px] font-bold text-carbon">Customer Support & Styling Desk</span>
                    <a href="tel:+919999888877" className="flex items-center gap-[8px] hover:text-carbon transition-colors text-graphite">
                      <Phone className="w-[14px] h-[14px]" />
                      +91 99998 88877
                    </a>
                    <a href="tel:+917777666655" className="flex items-center gap-[8px] hover:text-carbon transition-colors text-graphite">
                      <Phone className="w-[14px] h-[14px]" />
                      +91 77776 66655
                    </a>
                  </div>
                  <a href="mailto:support@silkandloom.com"
                    className="flex w-full min-w-0 items-start gap-2 text-graphite transition-colors hover:text-carbon">
                    <Mail className="mt-[2px] h-[14px] w-[14px] shrink-0" />
                    <span className="min-w-0 break-all">
                      support@silkandloom.com
                    </span>
                  </a>
                </div>
              )}
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom Row: Community & Social Hub */}
      <div className="container-custom mt-[48px] md:mt-[72px] pt-[32px] border-t border-smoke flex flex-col items-start gap-[16px]">
        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] font-bold uppercase tracking-widest text-carbon dark:text-white">
            Join Our Community
          </span>
          <p className="text-[13px] text-graphite leading-relaxed">
            Connect with us on WhatsApp, Instagram, YouTube & more
          </p>
        </div>

        <a
          href="https://silk-loom-connect.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[8px] px-[18px] py-[9px] rounded-full border border-carbon/20 dark:border-white/20 text-[11px] font-bold uppercase tracking-widest text-carbon dark:text-white bg-black/5 dark:bg-white/10 hover:bg-carbon hover:text-paper dark:hover:bg-white dark:hover:text-black transition-all duration-300 group shadow-xs hover:shadow-md"
        >
          <span>Visit Social Hub</span>
          <ArrowRight className="w-[12px] h-[12px] group-hover:translate-x-1 transition-transform" />
        </a>
      </div>
    </footer>
  );
}
