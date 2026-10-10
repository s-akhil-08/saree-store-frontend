import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../data/mockData';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { fetchApi } from '../api';

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([]);
  const { user, showAuthPrompt } = useAuth();
  const { addToast } = useToast();

  // Load from local storage immediately for guests, but wait for user to load if logged in.
  useEffect(() => {
    const fetchWishlist = async () => {
      if (user) {
        const token = localStorage.getItem('access');
        if (token) {
          try {
            const data = await fetchApi('/api/wishlist/');
            setItems(data.map((item: any) => item.product || item)); // Adapt based on standard nested serializers
          } catch (error: any) {
            addToast(error.message || 'Error fetching wishlist', 'error');
          }
        }
      } else {
        const saved = localStorage.getItem('wishlist');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setItems(parsed);
          } catch (e) {}
        }
      }
    };
    fetchWishlist();
  }, [user, addToast]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('wishlist', JSON.stringify(items));
    }
  }, [items, user]);

  const addToWishlist = async (product: Product) => {
    if (user) {
      try {
        await fetchApi(`/api/wishlist/${product.id}/`, { method: 'POST' });
        setItems((prev) => prev.find((item) => item.id === product.id) ? prev : [...prev, product]);
      } catch (error: any) {
        addToast(error.message || 'Failed to add to wishlist', 'error');
      }
    } else {
      setItems((prev) => prev.find((item) => item.id === product.id) ? prev : [...prev, product]);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (user) {
      try {
        await fetchApi(`/api/wishlist/${productId}/`, { method: 'DELETE' });
        setItems((prev) => prev.filter((item) => item.id !== productId));
      } catch (error: any) {
        addToast(error.message || 'Failed to remove from wishlist', 'error');
      }
    } else {
      setItems((prev) => prev.filter((item) => item.id !== productId));
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.id === productId);
  };

  const toggleWishlist = (product: Product): boolean => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      return true;
    } else {
      if (!user && items.length >= 2) {
        showAuthPrompt('Please log in or register to add more items to your wishlist.');
        return false;
      }
      addToWishlist(product);
      return true;
    }
  };

  return (
    <WishlistContext.Provider value={{ items, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
