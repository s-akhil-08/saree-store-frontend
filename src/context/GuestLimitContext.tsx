import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface GuestLimitContextType {
  incrementViewCount: () => boolean; // Returns false if limit reached and they should be blocked
  isLimitReached: boolean;
  showPopup: boolean;
  closePopup: () => void;
  openPopup: () => void;
  GUEST_VIEW_LIMIT: number;
}

const GUEST_VIEW_LIMIT = 3;
const COOLDOWN_MS = 90 * 1000; // 90 seconds cooldown (1.5 minutes)

const GuestLimitContext = createContext<GuestLimitContextType | undefined>(undefined);

export const GuestLimitProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [viewCount, setViewCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  // Use refs to keep values stable inside useCallback without causing function recreations
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const viewCountRef = useRef(viewCount);
  useEffect(() => {
    viewCountRef.current = viewCount;
  }, [viewCount]);

  // Load view count from local storage
  useEffect(() => {
    const saved = localStorage.getItem('guest_view_count');
    if (saved) {
      const parsed = parseInt(saved, 10);
      setViewCount(parsed);
      viewCountRef.current = parsed;
    }
  }, []);

  const incrementViewCount = useCallback(() => {
    if (userRef.current) return true; // Authenticated users have unlimited access
    
    const currentCount = viewCountRef.current;
    
    if (currentCount >= GUEST_VIEW_LIMIT) {
      const lastDismissed = localStorage.getItem('guest_last_dismissed_at');
      if (lastDismissed) {
        const timeSinceDismiss = Date.now() - parseInt(lastDismissed, 10);
        if (timeSinceDismiss < COOLDOWN_MS) {
          // In cooldown grace period, allow them to view
          return true;
        }
      }
      
      setShowPopup(true);
      return false;
    }
    
    const newCount = currentCount + 1;
    setViewCount(newCount);
    viewCountRef.current = newCount;
    localStorage.setItem('guest_view_count', newCount.toString());
    return true;
  }, []);

  const closePopup = useCallback(() => {
    setShowPopup(false);
    localStorage.setItem('guest_last_dismissed_at', Date.now().toString());
  }, []);

  const openPopup = useCallback(() => {
    if (!userRef.current) setShowPopup(true);
  }, []);

  return (
    <GuestLimitContext.Provider value={{
      incrementViewCount,
      isLimitReached: !user && viewCount >= GUEST_VIEW_LIMIT,
      showPopup,
      closePopup,
      openPopup,
      GUEST_VIEW_LIMIT
    }}>
      {children}
    </GuestLimitContext.Provider>
  );
};

export const useGuestLimit = () => {
  const context = useContext(GuestLimitContext);
  if (context === undefined) {
    throw new Error('useGuestLimit must be used within a GuestLimitProvider');
  }
  return context;
};
