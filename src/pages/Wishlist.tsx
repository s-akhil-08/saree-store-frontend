import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import PageTransition from '../components/PageTransition';

export default function Wishlist() {
  const { items } = useWishlist();

  return (
    <PageTransition>
      <main className="w-full flex-1 min-h-[60vh]">
        <div className="container-custom py-[40px] lg:py-[64px]">
          
          <div className="mb-[24px]">
            <Link to="/" className="text-[12px] text-graphite hover:text-carbon transition-colors inline-flex items-center gap-[8px]">
              ← Back to Home
            </Link>
          </div>

          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-display !mt-0 !mb-[48px]"
          >
            YOUR WISHLIST
          </motion.h1>

          {items.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center text-center py-[64px] border-y border-smoke"
            >
              <p className="text-[14px] text-graphite mb-[24px]">Your wishlist is currently empty.</p>
              <Link to="/products" className="btn-primary">
                Discover pieces
              </Link>
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] gap-y-[32px]">
              <AnimatePresence mode="popLayout">
                {items.map((product) => (
                  <motion.div
                    layout
                    key={product.id}
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
                    transition={{ duration: 0.3 }}
                    className="flex"
                  >
                    <ProductCard product={product} showDescription={true} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          
        </div>
      </main>
    </PageTransition>
  );
}
