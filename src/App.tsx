import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GuestLimitProvider } from './context/GuestLimitContext';
import { WishlistProvider } from './context/WishlistContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import AmbientBackground from './components/AmbientBackground';

import { useOnlineStatus } from './hooks/useOnlineStatus';
import NotFoundPage from './pages/NotFoundPage';

import Home from './pages/Home';
import { SpeedInsights } from '@vercel/speed-insights/react';

const GuestLimitPopup = lazy(() => import('./components/GuestLimitPopup'));
const VideoConsultation = lazy(() => import('./components/VideoConsultation'));

const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const OtpVerification = lazy(() => import('./pages/OtpVerification'));

import { ProductDetailsSkeleton, ProductsPageSkeleton, ProfileSkeleton } from './components/Skeletons';

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <div className="flex-1 relative z-10">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={
          <Suspense fallback={<ProductsPageSkeleton />}>
            <Products />
          </Suspense>
        } />
        <Route path="/product/:id" element={
          <Suspense fallback={<ProductDetailsSkeleton />}>
            <ProductDetails />
          </Suspense>
        } />
        <Route path="/wishlist" element={
          <Suspense fallback={<ProductsPageSkeleton />}>
            <Wishlist />
          </Suspense>
        } />
        <Route path="/profile" element={
          <Suspense fallback={<ProfileSkeleton />}>
            <Profile />
          </Suspense>
        } />
        <Route path="/login" element={
          <Suspense fallback={<div className="min-h-[500px]" />}>
            <Login />
          </Suspense>
        } />
        <Route path="/signup" element={
          <Suspense fallback={<div className="min-h-[500px]" />}>
            <Signup />
          </Suspense>
        } />
        <Route path="/verify-otp" element={
          <Suspense fallback={<div className="min-h-[500px]" />}>
            <OtpVerification />
          </Suspense>
        } />
        <Route path="*" element={<NotFoundPage forcedType="404" />} />
      </Routes>
    </div>
  );
}

function MainLayout() {
  const isOnline = useOnlineStatus();

  if (!isOnline) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen relative z-10">
        <NotFoundPage forcedType="offline" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <AnimatedRoutes />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <GuestLimitProvider>
            <WishlistProvider>
              <Router>
                <SpeedInsights />
                <Suspense fallback={null}>
                  <GuestLimitPopup />
                  <VideoConsultation />
                </Suspense>
                <AmbientBackground />
                <MainLayout />
              </Router>
            </WishlistProvider>
          </GuestLimitProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
