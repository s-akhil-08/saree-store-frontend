import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Heart, LogOut, Sun, Moon, Menu, X, Video, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { fetchApi } from '../api';
import SmoothImage from './SmoothImage';

export default function Header() {
  const { user, logout, isLoading } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const { addToast } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [isMoreCatsOpen, setIsMoreCatsOpen] = useState(false);
  const [mobileCategoryFilter, setMobileCategoryFilter] = useState('');
  const [searchPanelBottomConstraint, setSearchPanelBottomConstraint] = useState(120);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = (isBackground = false) => {
      if (!isBackground && isMounted) {
        setLoadingCats(true);
      }
      fetchApi('/api/categories/')
        .then((data) => {
          if (!isMounted) return;
          let catList = Array.isArray(data) ? data : (data?.results || []);
          if (Array.isArray(catList) && catList.some((c: any) => typeof c.order === 'number')) {
            catList = [...catList].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
          }
          setCategories(catList);
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted && !isBackground) setLoadingCats(false);
        });
    };

    fetchCategories(false);

    // Silent background refresh every 45 seconds without full page reload or spinners
    const pollInterval = setInterval(() => {
      fetchCategories(true);
    }, 45000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    if (isSearchOpen && allProducts.length === 0) {
      setIsFetchingProducts(true);
      fetchApi('/api/products/')
        .then(data => {
          const productList = Array.isArray(data) ? data : (data?.results || []);
          setAllProducts(productList);
        })
        .catch((err: any) => addToast(err.message || "Failed to fetch products for search", "error"))
        .finally(() => setIsFetchingProducts(false));
    }
  }, [isSearchOpen, allProducts.length, addToast]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = allProducts.filter(p => {
      return (
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.category && p.category.name && p.category.name.toLowerCase().includes(query)) ||
        (p.description && p.description.toLowerCase().includes(query))
      );
    });
    setSuggestions(filtered.slice(0, 5)); // Limit to 5 suggestions
  }, [searchQuery, allProducts]);

  // Re-measure panel bottom vs screen bottom after suggestions render
  useEffect(() => {
    if (!suggestions.length) return;
    requestAnimationFrame(() => {
      if (searchPanelRef.current) {
        const rect = searchPanelRef.current.getBoundingClientRect();
        const avail = Math.max(0, window.innerHeight - rect.bottom);
        setSearchPanelBottomConstraint(avail);
      }
    });
  }, [suggestions]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    setIsSigningOut(true);
    
    await logout();
    
    // Slight delay for sign-out animation completion
    setTimeout(() => {
      setIsSigningOut(false);
      navigate('/');
      addToast('Signed out successfully', 'success');
    }, 500);
  };

  return (
    <>
      <AnimatePresence>
        {isSigningOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-paper/80 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-paper p-[40px] rounded-2xl shadow-xl border border-smoke flex flex-col items-center gap-[16px]"
            >
              <div className="w-[48px] h-[48px] rounded-full border-2 border-carbon border-t-transparent animate-spin" />
              <p className="text-[14px] font-bold tracking-widest uppercase text-carbon">Signing Out...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header 
        className={`w-full sticky top-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-paper/90 dark:bg-[#18181A]/95 backdrop-blur-xl border-b border-smoke dark:border-stone/40 shadow-md' 
            : 'bg-paper/80 dark:bg-[#18181A]/85 backdrop-blur-lg border-b border-smoke/70 dark:border-stone/30 shadow-sm'
        }`}
      >
        <div className="container-custom h-[72px] flex items-center justify-between relative">
          
          {/* Left: Hamburger & Category Nav */}
          <div className="flex flex-1 items-center gap-[16px]">
            {/* Hamburger (Mobile) */}
            <button 
              className="lg:hidden p-1 -ml-1 text-carbon hover:opacity-70 transition-opacity" 
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Menu"
            >
              <Menu className="w-[20px] h-[20px]" />
            </button>
            
            {/* Desktop Nav */}
            <nav className="hidden lg:flex gap-[16px] xl:gap-[24px] items-center relative min-w-0 flex-1 overflow-hidden">
              {loadingCats && categories.length === 0 ? (
                <span className="text-[13px] text-graphite tracking-wide whitespace-nowrap">Loading...</span>
              ) : categories.length === 0 ? (
                <span className="text-[13px] text-graphite tracking-wide whitespace-nowrap">No categories available</span>
              ) : (
                <>
                  {categories.slice(0, 3).map((cat) => (
                    <Link 
                      key={cat.id}
                      to={`/products?category=${cat.id}`} 
                      className="text-[13px] hover:text-graphite transition-colors tracking-wide whitespace-nowrap"
                    >
                      {cat.name}
                    </Link>
                  ))}
                  
                  {categories.length > 3 && (
                    <div 
                      className="relative group"
                      onMouseEnter={() => setIsMoreCatsOpen(true)}
                      onMouseLeave={() => setIsMoreCatsOpen(false)}
                    >
                      <button 
                        onClick={() => setIsMoreCatsOpen(!isMoreCatsOpen)}
                        className="flex items-center gap-[4px] text-[13px] font-medium hover:text-graphite transition-colors tracking-wide whitespace-nowrap py-2"
                      >
                        <span>More</span>
                        <ChevronDown className={`w-[14px] h-[14px] transition-transform duration-200 ${isMoreCatsOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isMoreCatsOpen && (
                          <motion.div 
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 top-full mt-1 w-[220px] bg-paper shadow-lg rounded-lg border border-smoke py-[8px] z-[100] max-h-[300px] overflow-y-auto"
                          >
                            {categories.slice(3).map((cat) => (
                              <Link
                                key={cat.id}
                                to={`/products?category=${cat.id}`}
                                onClick={() => setIsMoreCatsOpen(false)}
                                className="block px-[16px] py-[8px] text-[13px] text-carbon hover:bg-stone/50 hover:text-carbon transition-colors truncate"
                              >
                                {cat.name}
                              </Link>
                            ))}
                            <div className="h-[1px] bg-smoke my-[4px]" />
                            <Link
                              to="/products"
                              onClick={() => setIsMoreCatsOpen(false)}
                              className="block px-[16px] py-[8px] text-[12px] font-bold text-graphite hover:text-carbon transition-colors uppercase tracking-wider"
                            >
                              All Collections →
                            </Link>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </nav>
          </div>

          {/* Logo - Center */}
        <div className="shrink-0 px-[12px] md:px-[20px] flex items-center justify-center h-full select-none">
          <Link to="/" className="flex flex-col items-center justify-center">
            <span className="text-wordmark uppercase tracking-widest text-[18px] md:text-[20px] leading-tight">SILK & LOOM</span>
            <span className="font-serif italic text-[16px] md:text-[18px] text-graphite leading-tight">Handlooms</span>
          </Link>
        </div>

          {/* Right: Utilities */}
          <div className="flex items-center justify-end gap-[16px] md:gap-[24px] flex-1">
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center hover:bg-stone/50 transition-colors cursor-pointer text-carbon relative overflow-hidden"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="dark-sun"
                    initial={{ rotate: -180, scale: 0.4, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 180, scale: 0.4, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center"
                  >
                    <Sun className="w-[18px] h-[18px] stroke-[1.5px]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="light-moon"
                    initial={{ y: -12, scale: 0.4, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    exit={{ y: 12, scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                    className="flex items-center justify-center"
                  >
                    <Moon className="w-[18px] h-[18px] stroke-[1.5px]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            
            {/* Search */}
            <div 
              ref={searchRef}
              className="flex items-center h-full py-2 relative"
              onMouseEnter={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  setIsSearchOpen(true);
                }
              }}
              onMouseLeave={() => {
                if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                  if (!isSearchFocused && !searchQuery.trim()) {
                    setIsSearchOpen(false);
                  }
                }
              }}
            >
              <button 
                type="button" 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-1 hover:opacity-70 transition-opacity cursor-pointer flex items-center justify-center" 
                aria-label="Search"
              >
                <Search className="w-[18px] h-[18px] text-carbon stroke-[1.5px]" />
              </button>

              {/* Desktop Inline Search Drawer */}
              <div className="hidden lg:flex items-center">
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      key="search-container-desktop"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <motion.form
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 180, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        onSubmit={handleSearchSubmit}
                        className="overflow-hidden mr-[8px]"
                      >
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchQuery}
                          onFocus={() => setIsSearchFocused(true)}
                          onBlur={() => {
                            setTimeout(() => setIsSearchFocused(false), 200);
                          }}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-transparent border-b border-carbon outline-none text-[12px] pb-[2px]"
                          autoFocus
                        />
                      </motion.form>

                      {searchQuery.trim() && (
                        <div className="absolute top-[100%] right-0 mt-[12px] w-[320px] bg-white/85 dark:bg-[#18181A]/90 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-2xl rounded-xl overflow-hidden z-50 flex flex-col max-h-[400px]">
                          <div className="p-3 border-b border-smoke/50 bg-stone/20 dark:bg-stone/10 backdrop-blur-md">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-graphite">Search Results</span>
                          </div>
                          <div className="overflow-y-auto">
                            {isFetchingProducts ? (
                              <div className="p-4 text-center text-[12px] text-graphite">Loading...</div>
                            ) : suggestions.length > 0 ? (
                              suggestions.map(p => (
                                <Link 
                                  key={p.id} 
                                  to={`/product/${p.id}`} 
                                  onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery('');
                                  }} 
                                  className="flex items-center gap-3 p-3 hover:bg-stone/50 transition-colors border-b border-smoke/40 last:border-0"
                                >
                                {(() => {
                                  const imgSrc = p.image || (Array.isArray(p.images) && p.images.length > 0 ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.image) : '');
                                  return imgSrc ? (
                                    <SmoothImage src={imgSrc} alt={p.name} className="w-[40px] h-[40px] object-cover rounded-md shrink-0" />
                                  ) : (
                                    <div className="w-[40px] h-[40px] bg-stone rounded-md shrink-0" />
                                  );
                                })()}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-[13px] font-bold font-serif text-carbon truncate">{p.name}</h4>
                                      <p className="text-[10px] uppercase font-bold tracking-widest text-graphite mt-[2px]">{p.brand}</p>
                                  </div>
                                </Link>
                              ))
                            ) : (
                              <div className="p-4 text-center text-[12px] text-graphite">No products found.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Account / Login */}
            {isLoading ? (
              <div className="hidden lg:flex w-[110px]" />
            ) : user ? (
              <div 
                className="hidden lg:flex relative h-full items-center"
                onMouseEnter={() => setIsProfileOpen(true)}
                onMouseLeave={() => setIsProfileOpen(false)}
              >
                <button type="button" className="p-1 hover:opacity-70 transition-opacity cursor-pointer text-left" aria-label="Account">
                  <User className="w-[18px] h-[18px] text-carbon stroke-[1.5px]" />
                </button>
                
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-[56px] right-0 w-[200px] bg-white/70 dark:bg-black/70 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.15)] border border-white/50 dark:border-white/10 rounded-xl overflow-hidden py-[8px] z-50"
                    >
                      <div className="px-[16px] py-[12px] border-b border-smoke mb-[4px]">
                        <p className="text-[12px] text-graphite">Signed in as</p>
                        <p className="text-[13px] font-bold text-carbon truncate">{user.name}</p>
                      </div>
                      
                      <Link to="/profile" state={{ activeTab: 'profile' }} onClick={() => setIsProfileOpen(false)} className="flex items-center gap-[12px] px-[16px] py-[10px] text-[13px] hover:bg-stone/30 transition-colors">
                        <User className="w-[14px] h-[14px]" /> Profile Details
                      </Link>
                      {/* <Link to="/profile" state={{ activeTab: 'addresses' }} onClick={() => setIsProfileOpen(false)} className="flex items-center gap-[12px] px-[16px] py-[10px] text-[13px] hover:bg-stone/30 transition-colors">
                        <MapPin className="w-[14px] h-[14px]" /> Addresses
                      </Link> */}
                      <Link to="/profile" state={{ activeTab: 'consultations' }} onClick={() => setIsProfileOpen(false)} className="flex items-center gap-[12px] px-[16px] py-[10px] text-[13px] hover:bg-stone/30 transition-colors">
                        <Video className="w-[14px] h-[14px]" /> Consultations
                      </Link>
                      
                      <div className="h-[1px] bg-smoke my-[4px]" />
                      
                      <button 
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-[12px] px-[16px] py-[10px] text-[13px] text-red-500 hover:bg-red-50 transition-colors text-left"
                      >
                        <LogOut className="w-[14px] h-[14px]" /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="hidden lg:flex text-[11px] xl:text-[12px] font-bold uppercase tracking-wider hover:text-graphite transition-colors whitespace-nowrap shrink-0">
                Login / Register
              </Link>
            )}

            {/* Wishlist */}
            <Link to="/wishlist" className="p-1 hover:opacity-70 transition-opacity relative" aria-label="Wishlist">
              <Heart className="w-[18px] h-[18px] text-carbon stroke-[1.5px]" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-[2px] -right-[2px] bg-red-500 text-paper rounded-full w-[14px] h-[14px] flex items-center justify-center text-[9px] font-bold border border-paper">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            {/* Mobile Full-Width Search Overlay Bar */}
            <AnimatePresence>
              {isSearchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="lg:hidden absolute top-full left-0 right-0 w-full bg-white/85 dark:bg-[#18181A]/90 backdrop-blur-2xl px-[16px] py-[10px] sm:py-[12px] z-50 flex items-center gap-[12px] border-b border-smoke/40 shadow-xl"
                >
                  <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-[10px]">
                    <Search className="w-[18px] h-[18px] text-graphite shrink-0" />
                    <input
                      type="text"
                      placeholder="Search sarees, collections..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-b border-carbon outline-none text-[13px] py-[4px] text-carbon"
                      autoFocus
                    />
                  </form>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="p-[4px] text-carbon hover:opacity-70 shrink-0"
                    aria-label="Close search"
                  >
                    <X className="w-[20px] h-[20px]" />
                  </button>

                  {/* Mobile Search Suggestions Dropdown - Translucent & Dynamically Drag-Movable */}
                  {searchQuery.trim() && (
                    <motion.div 
                      ref={searchPanelRef}
                      drag="y"
                      dragConstraints={{ top: 0, bottom: searchPanelBottomConstraint }}
                      dragElastic={0.1}
                      dragTransition={{
                        bounceStiffness: 300,
                        bounceDamping: 24,
                        power: 0.3,
                        timeConstant: 450,
                      }}
                      className="absolute top-[100%] left-0 right-0 bg-white/85 dark:bg-[#18181A]/90 backdrop-blur-2xl border-b border-smoke/40 shadow-2xl overflow-hidden z-50 flex flex-col max-h-[70vh] rounded-b-2xl cursor-grab active:cursor-grabbing"
                    >
                      <div className="w-[36px] h-[4px] bg-carbon/20 dark:bg-white/20 rounded-full mx-auto my-[6px] shrink-0" />
                      <div className="px-3 py-2 border-b border-smoke/50 bg-stone/20 dark:bg-stone/10 backdrop-blur-md flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-graphite">Search Results</span>
                        <span className="text-[9px] text-graphite/60 uppercase font-bold tracking-wider">Drag to move</span>
                      </div>
                      <div className="overflow-y-auto">
                        {isFetchingProducts ? (
                          <div className="p-4 text-center text-[12px] text-graphite">Loading...</div>
                        ) : suggestions.length > 0 ? (
                          suggestions.map(p => (
                            <Link 
                              key={p.id} 
                              to={`/product/${p.id}`} 
                              onClick={() => {
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }} 
                              className="flex items-center gap-3 p-3 hover:bg-stone/50 transition-colors border-b border-smoke/40 last:border-0"
                            >
                              {(() => {
                                const imgSrc = p.image || (Array.isArray(p.images) && p.images.length > 0 ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.image) : '');
                                return imgSrc ? (
                                  <SmoothImage src={imgSrc} alt={p.name} className="w-[40px] h-[40px] object-cover rounded-md shrink-0" />
                                ) : (
                                  <div className="w-[40px] h-[40px] bg-stone rounded-md shrink-0" />
                                );
                              })()}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-bold font-serif text-carbon truncate">{p.name}</h4>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-graphite mt-[2px]">{p.brand}</p>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="p-4 text-center text-[12px] text-graphite">No products found.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-paper/95 backdrop-blur-md lg:hidden flex flex-col"
          >
            <div className="container-custom h-[72px] flex items-center justify-between border-b border-smoke relative">
              <button 
                className="p-1 -ml-1 text-carbon hover:opacity-70 transition-opacity" 
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close Menu"
              >
                <X className="w-[20px] h-[20px]" />
              </button>
              
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center">
                <span className="text-wordmark uppercase tracking-widest text-[18px] leading-tight">SILK & LOOM</span>
                <span className="font-serif italic text-[16px] text-graphite leading-tight">Handlooms</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto py-[24px] px-[24px] flex flex-col gap-[32px]">
              <nav className="flex flex-col gap-[16px]">
                <div className="flex items-center justify-between pb-[4px]">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-graphite">Categories</span>
                  <Link 
                    to="/products" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="text-[11px] font-bold uppercase tracking-widest text-carbon hover:underline"
                  >
                    View All ({categories.length})
                  </Link>
                </div>

                {categories.length > 5 && (
                  <div className="relative mb-[4px]">
                    <Search className="w-[14px] h-[14px] absolute left-[12px] top-1/2 -translate-y-1/2 text-graphite" />
                    <input 
                      type="text"
                      placeholder="Filter categories..."
                      value={mobileCategoryFilter}
                      onChange={(e) => setMobileCategoryFilter(e.target.value)}
                      className="w-full bg-stone/40 border border-smoke rounded-md pl-[32px] pr-[12px] py-[6px] text-[12px] focus:outline-none focus:border-carbon"
                    />
                  </div>
                )}

                <div className="max-h-[220px] overflow-y-auto pr-[4px] flex flex-col gap-[14px] scrollbar-thin">
                  {loadingCats && categories.length === 0 ? (
                    <span className="text-[15px] text-graphite tracking-wide">Loading categories...</span>
                  ) : categories.length === 0 ? (
                    <span className="text-[15px] text-graphite tracking-wide">No categories available</span>
                  ) : (
                    categories
                      .filter((cat) => cat.name.toLowerCase().includes(mobileCategoryFilter.toLowerCase()))
                      .map((cat) => (
                        <Link 
                          key={cat.id}
                          to={`/products?category=${cat.id}`} 
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setMobileCategoryFilter('');
                          }} 
                          className="text-[15px] font-bold tracking-wide hover:text-graphite transition-colors flex items-center justify-between"
                        >
                          <span>{cat.name}</span>
                        </Link>
                      ))
                  )}
                </div>
              </nav>
              
              <div className="h-[1px] bg-smoke" />
              
              <div className="flex flex-col gap-[24px]">
                {isLoading ? null : user ? (
                  <>
                    <div className="flex items-center gap-[12px]">
                      <User className="w-[18px] h-[18px]" />
                      <span className="text-[14px] font-bold">{user.name}</span>
                    </div>
                    <Link to="/profile" state={{ activeTab: 'profile' }} onClick={() => setIsMobileMenuOpen(false)} className="text-[14px] text-graphite hover:text-carbon">Profile Details</Link>
                    <Link to="/profile" state={{ activeTab: 'consultations' }} onClick={() => setIsMobileMenuOpen(false)} className="text-[14px] text-graphite hover:text-carbon">Consultations</Link>
                    <button 
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleSignOut();
                      }}
                      className="text-[14px] text-red-500 text-left mt-2"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-[16px] font-bold uppercase tracking-widest text-carbon flex items-center gap-2">
                    <User className="w-[18px] h-[18px]" /> Login / Register
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
