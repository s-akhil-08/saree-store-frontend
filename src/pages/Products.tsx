import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeletons';
import PageTransition from '../components/PageTransition';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, ArrowUpDown } from 'lucide-react';
import { fetchApi } from '../api';
import { useToast } from '../context/ToastContext';
import type { Product, Category } from '../data/mockData';
import NotFoundPage from './NotFoundPage';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryId = searchParams.get('category') || '';
  const sortParam = searchParams.get('sort') || '-createdAt';
  const pageParam = searchParams.get('page');
  const pageSizeParam = searchParams.get('page_size');

  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
  const pageSize = pageSizeParam ? Math.max(4, parseInt(pageSizeParam, 10)) : 12;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [showErrorPage, setShowErrorPage] = useState(false);
  const [errorStatusCode, setErrorStatusCode] = useState<number | string>(500);
  const { addToast } = useToast();

  const firstErrorTimeRef = useRef<number | null>(null);
  const retryTimerRef = useRef<any>(null);
  const hasToastedRef = useRef<boolean>(false);
  const hasLoadedDataRef = useRef<boolean>(false);

  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground && !hasLoadedDataRef.current) {
      setLoading(true);
    }
    try {
      const queryParams = new URLSearchParams();
      if (categoryId) queryParams.set('category', categoryId);
      if (sortParam) queryParams.set('sort', sortParam);
      queryParams.set('page', currentPage.toString());
      queryParams.set('page_size', pageSize.toString());

      const [productsData, categoriesData] = await Promise.all([
        fetchApi(`/api/products/?${queryParams.toString()}`),
        fetchApi('/api/categories/')
      ]);

      if (productsData && typeof productsData === 'object' && 'results' in productsData) {
        setProducts(productsData.results || []);
        setTotalCount(productsData.count || 0);
        setTotalPages(productsData.total_pages || Math.ceil((productsData.count || 0) / pageSize) || 1);
      } else if (Array.isArray(productsData)) {
        setProducts(productsData);
        setTotalCount(productsData.length);
        setTotalPages(Math.ceil(productsData.length / pageSize) || 1);
      } else {
        setProducts([]);
        setTotalCount(0);
        setTotalPages(1);
      }

      let catList = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results || []);
      if (Array.isArray(catList) && catList.some((c: any) => typeof c.order === 'number')) {
        catList = [...catList].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      }
      setCategories(catList);
      hasLoadedDataRef.current = true;
      
      // Clear error states on success
      setShowErrorPage(false);
      firstErrorTimeRef.current = null;
      hasToastedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    } catch (error: any) {
      // If products are already loaded or this was a background refresh, keep UI intact
      if (hasLoadedDataRef.current || isBackground) {
        return;
      }

      const message = error?.message || 'Error fetching products. Please try again.';

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
      if (elapsed >= 45000) {
        setShowErrorPage(true);
        if (retryTimerRef.current) {
          clearTimeout(retryTimerRef.current);
          retryTimerRef.current = null;
        }
      } else {
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        retryTimerRef.current = setTimeout(() => {
          fetchData(true);
        }, 3000);
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, [categoryId, sortParam, currentPage, pageSize, addToast]);

  useEffect(() => {
    let isMounted = true;
    fetchData(false);

    // Visibility-aware background polling
    const pollInterval = setInterval(() => {
      if (isMounted && !firstErrorTimeRef.current && typeof document !== 'undefined' && document.visibilityState !== 'hidden') {
        fetchData(true);
      }
    }, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        fetchData(true);
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
  }, [fetchData]);

  if (showErrorPage) {
    return (
      <NotFoundPage
        statusCode={errorStatusCode}
        onRetry={() => {
          firstErrorTimeRef.current = null;
          hasToastedRef.current = false;
          setShowErrorPage(false);
          fetchData(false);
        }}
        title="Products Loading Error"
        description="Unable to load catalog data from the server after 45 seconds of silent retries."
      />
    );
  }

  const category = categories.find(c => c.id === categoryId);

  const handleParamChange = (key: string, value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      // Reset page to 1 whenever filters or sort change
      if (key !== 'page') {
        newParams.set('page', '1');
      }
      return newParams;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      handleParamChange('page', newPage.toString());
    }
  };

  // Smart scalable page number generator
  const paginationRange = useMemo(() => {
    const delta = 1; // Number of pages surrounding current page
    const range: (number | string)[] = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  }, [currentPage, totalPages]);

  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalCount, currentPage * pageSize);

  return (
    <PageTransition>
      <main className="w-full">
        <div className="container-custom py-10 lg:py-16">
          <div className="mb-[24px]">
            <Link to="/" className="text-caption text-graphite hover:text-carbon transition-colors inline-flex items-center gap-[8px]">
              ← Back to Home
            </Link>
          </div>

          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-display !mt-0 !mb-[32px]"
          >
            {category ? `${category.name}'S FASHION` : 'ALL PIECES'}
          </motion.h1>

          {/* Scalable Filters & Sorting Control Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-[16px] border-y border-smoke mb-[32px]">
            <span className="text-[13px] font-medium text-graphite">
              {loading ? 'Loading...' : `Showing ${startItem}–${endItem} of ${totalCount} Products`}
            </span>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Category Filter Dropdown */}
              <div className="flex items-center gap-2 border border-smoke hover:border-graphite rounded-md px-3 py-1.5 bg-paper text-carbon transition-colors shadow-xs">
                <Filter className="w-3.5 h-3.5 text-graphite shrink-0" />
                <select
                  value={categoryId}
                  onChange={(e) => handleParamChange('category', e.target.value)}
                  className="bg-transparent text-[12px] font-medium text-carbon outline-none cursor-pointer pr-1"
                >
                  <option value="" className="bg-[var(--color-paper)] text-[var(--color-carbon)]">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[var(--color-paper)] text-[var(--color-carbon)]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order Dropdown */}
              <div className="flex items-center gap-2 border border-smoke hover:border-graphite rounded-md px-3 py-1.5 bg-paper text-carbon transition-colors shadow-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-graphite shrink-0" />
                <select
                  value={sortParam}
                  onChange={(e) => handleParamChange('sort', e.target.value)}
                  className="bg-transparent text-[12px] font-medium text-carbon outline-none cursor-pointer pr-1"
                >
                  <option value="-createdAt" className="bg-[var(--color-paper)] text-[var(--color-carbon)]">Newest First</option>
                  <option value="createdAt" className="bg-[var(--color-paper)] text-[var(--color-carbon)]">Oldest First</option>
                  <option value="name_asc" className="bg-[var(--color-paper)] text-[var(--color-carbon)]">Name: A to Z</option>
                  <option value="name_desc" className="bg-[var(--color-paper)] text-[var(--color-carbon)]">Name: Z to A</option>
                </select>
              </div>

              {/* Items Per Page Dropdown */}
              <div className="flex items-center gap-2 border border-smoke hover:border-graphite rounded-md px-3 py-1.5 bg-paper text-carbon transition-colors shadow-xs">
                <span className="text-[12px] text-graphite font-medium shrink-0">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handleParamChange('page_size', e.target.value)}
                  className="bg-transparent text-[12px] font-medium text-carbon outline-none cursor-pointer pr-1"
                >
                  <option value="12" className="bg-[var(--color-paper)] text-[var(--color-carbon)]">12 per page</option>
                  <option value="24" className="bg-[var(--color-paper)] text-[var(--color-carbon)]">24 per page</option>
                  <option value="48" className="bg-[var(--color-paper)] text-[var(--color-carbon)]">48 per page</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] gap-y-[32px]">
              {Array.from({ length: pageSize > 12 ? 12 : pageSize }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-graphite text-[14px]">
              {categoryId ? "No products available in this category." : "No products found matching your filter."}
            </div>
          ) : (
            <>
              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] gap-y-[32px]">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.03 }}
                    className="flex"
                  >
                    <ProductCard product={product} showDescription={true} />
                  </motion.div>
                ))}
              </div>

              {/* Scalable Dynamic Pagination Bar */}
              {totalPages > 1 && (
                <div className="mt-[64px] flex flex-wrap justify-center items-center gap-[8px]">
                  {/* First Page */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="w-[34px] h-[34px] flex items-center justify-center border border-smoke rounded hover:border-carbon hover:bg-stone disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="First Page"
                    aria-label="First Page"
                  >
                    <ChevronsLeft className="w-[16px] h-[16px]" />
                  </button>

                  {/* Previous Page */}
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-[34px] h-[34px] flex items-center justify-center border border-smoke rounded hover:border-carbon hover:bg-stone disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-[16px] h-[16px]" />
                  </button>

                  {/* Smart Page Numbers */}
                  <div className="flex items-center gap-[6px]">
                    {paginationRange.map((page, idx) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-1 text-graphite text-[13px] font-medium">
                            ...
                          </span>
                        );
                      }
                      const pageNum = page as number;
                      const isActive = currentPage === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-[34px] h-[34px] flex items-center justify-center rounded text-[12px] font-medium transition-colors ${
                            isActive
                              ? 'bg-carbon text-paper border border-carbon font-semibold'
                              : 'border border-smoke text-carbon hover:border-carbon hover:bg-stone'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Page */}
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-[34px] h-[34px] flex items-center justify-center border border-smoke rounded hover:border-carbon hover:bg-stone disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-[16px] h-[16px]" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="w-[34px] h-[34px] flex items-center justify-center border border-smoke rounded hover:border-carbon hover:bg-stone disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Last Page"
                    aria-label="Last Page"
                  >
                    <ChevronsRight className="w-[16px] h-[16px]" />
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </PageTransition>
  );
}
