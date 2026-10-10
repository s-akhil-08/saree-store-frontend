import React, { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { OrbitOtp } from '../components/OrbitOtp';
import { fetchApi } from '../api';

export default function Login() {
  // Navigation / Contexts
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // View state
  const [view, setView] = useState<'login' | 'forgot-email' | 'forgot-otp' | 'forgot-reset'>('login');

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
    
  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(120);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (view === 'forgot-otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, resendTimer]);

  // Show toast if redirected from somewhere else with a message (optional)
  useEffect(() => {
    if (location.state?.message) {
      addToast(location.state.message, 'success');
      navigate('.', { replace: true, state: {} });
    }
  }, [location, addToast, navigate]);

  // OrbitOtp Handlers
  const handleOtpChange = (index: number, value: string) => {
    if (forgotStatus === 'loading' || forgotStatus === 'success') return;
    if (value && !/^\d+$/.test(value)) return;
    if (forgotError) setForgotError(null);

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (index === 3 && value && newOtp.every(digit => digit !== '')) {
      verifyForgotOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').slice(0, 4).replace(/\D/g, '');
    if (pasted) {
      const newOtp = [...otp];
      pasted.split('').forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      
      if (pasted.length === 4) {
        verifyForgotOtp(pasted);
      } else {
        otpInputRefs.current[pasted.length]?.focus();
      }
    }
  };

  // ----- Form Submissions -----

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!email || !email.includes('@')) {
      setLoginError('Please enter a valid email address');
      return;
    }
    setStatus('loading');
    try {
      const data = await fetchApi('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data && data.tokens) {
        localStorage.setItem('access', data.tokens.access);
        localStorage.setItem('refresh', data.tokens.refresh);
        login(data.user.email, data.user.name || data.user.first_name || data.user.email, data.user.mobile);
      } else if (data && data.user) {
        login(data.user.email, data.user.name || data.user.first_name || data.user.email, data.user.mobile);
      }
      setStatus('success');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error: any) {
      setLoginError(error.message || 'Invalid email or password. Please check your credentials.');
      setStatus('idle');
    }
  };

  const handleForgotEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    if (!forgotEmail || !forgotEmail.includes('@')) {
      setForgotError('Please enter a valid email address');
      return;
    }
    setForgotStatus('loading');
    try {
      await fetchApi('/api/auth/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail })
      });
      setForgotStatus('idle');
      addToast('Verification OTP sent to your email', 'success');
      setView('forgot-otp');
      setResendTimer(120);
    } catch (error: any) {
      setForgotError(error.message || 'Failed to send OTP. Please check your email.');
      setForgotStatus('idle');
    }
  };

  const verifyForgotOtp = async (_code: string) => {
    setForgotStatus('loading');
    setForgotError(null);
    
    try {
      await fetchApi('/api/auth/verify-forgot-otp/', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail, otp: _code })
      });
      setForgotStatus('success');
      addToast('Code verified! Please set your new password.', 'success');
      setTimeout(() => {
        setView('forgot-reset');
        setForgotStatus('idle');
      }, 500);
    } catch (error: any) {
      setForgotError(error.message || 'Invalid or expired OTP code.');
      setForgotStatus('idle');
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setForgotStatus('loading');
    setForgotError(null);
    try {
      await fetchApi('/api/auth/resend-otp/', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail, purpose: 'forgot_password' })
      });
      setResendTimer(120);
      addToast('OTP resent successfully to your email', 'success');
    } catch (error: any) {
      setForgotError(error.message || 'Failed to resend OTP.');
    } finally {
      setForgotStatus('idle');
    }
  };

  const handleResetPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }
    setForgotStatus('loading');
    setForgotError(null);
    try {
      await fetchApi('/api/auth/reset-password/', {
        method: 'POST',
        body: JSON.stringify({
          email: forgotEmail,
          otp: otp.join(''),
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      setForgotStatus('success');
      addToast('Password has been reset successfully. Please sign in.', 'success');
      setTimeout(() => {
        setView('login');
        setForgotStatus('idle');
        setPassword('');
      }, 1200);
    } catch (error: any) {
      setForgotError(error.message || 'Failed to reset password. Please try again.');
      setForgotStatus('idle');
    }
  };

  return (
    <PageTransition>
      <main className="w-full flex-grow flex items-center justify-center py-[72px] bg-stone/30 min-h-[calc(100vh-72px)]">
        <div className="w-full max-w-[540px] px-[16px]">
          <div className="bg-paper p-[40px] md:p-[64px] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-smoke min-h-[440px] flex flex-col justify-center relative overflow-hidden">
            
            <AnimatePresence mode="wait">
              
              {/* --- 1. DEFAULT LOGIN VIEW --- */}
              {view === 'login' && status !== 'success' && (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-[28px] gap-[16px]">
                    <div>
                      <h1 className="font-serif text-[32px] tracking-tight">Sign In</h1>
                      <p className="text-[12px] text-graphite mt-[2px]">Enter your email and password to access your account</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => navigate('/')}
                      className="flex items-center justify-start gap-[6px] text-[12px] font-bold text-graphite hover:text-carbon transition-colors"
                    >
                      <ArrowLeft className="w-[14px] h-[14px]" />
                      BACK TO HOME
                    </button>
                  </div>
                  
                  <form onSubmit={handleLoginSubmit} className="flex flex-col gap-[20px]">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">Email Address</label>
                      <input 
                        type="email" 
                        placeholder="name@example.com" 
                        required
                        disabled={status === 'loading'}
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className={`input-field !bg-transparent text-[14px] py-[12px] outline-none transition-shadow ${loginError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-1 focus:ring-carbon'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">Password</label>
                      <div className="relative">
                        <input 
                          type={showLoginPassword ? 'text' : 'password'}
                          placeholder="Enter your password" 
                          required
                          disabled={status === 'loading'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          className="input-field !bg-transparent text-[14px] py-[12px] focus:ring-1 focus:ring-carbon outline-none transition-shadow pr-[40px]" 
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-[12px] top-1/2 -translate-y-1/2 text-graphite hover:text-carbon transition-colors"
                        >
                          {showLoginPassword ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
                        </button>
                      </div>
                      <div className="flex justify-end mt-[8px]">
                        <button 
                          type="button"
                          onClick={() => { setView('forgot-email'); setForgotError(null); }}
                          className="text-[12px] font-semibold text-carbon hover:underline decoration-1 underline-offset-4"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                    
                    {loginError && <p className="text-[12px] text-red-500 font-medium mt-[-8px]">{loginError}</p>}
                    
                    <button type="submit" disabled={status === 'loading'} className="btn-primary mt-[8px] py-[14px] flex justify-center items-center gap-[8px]">
                      {status === 'loading' ? <><Loader2 className="w-[16px] h-[16px] animate-spin" /><span>Signing in...</span></> : 'SIGN IN'}
                    </button>
                  </form>
                  
                  <div className="mt-[28px] text-center text-[13px] text-graphite">
                    Don't have an account? <Link to="/signup" className="text-carbon font-semibold hover:underline decoration-1 underline-offset-4 ml-[4px]">Register</Link>
                  </div>
                </motion.div>
              )}

                            {view === 'login' && status === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center text-center absolute inset-0"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                    className="w-[64px] h-[64px] bg-green-50 rounded-full flex items-center justify-center mb-[24px]"
                  >
                    <CheckCircle2 className="w-[32px] h-[32px] text-green-500" />
                  </motion.div>
                  <h2 className="text-[24px] font-bold mb-[8px]">Welcome Back</h2>
                  <p className="text-[14px] text-graphite">Successfully signed in.</p>
                </motion.div>
              )}

              {view === 'forgot-email' && (
                <motion.div
                  key="forgot-email"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-[40px] gap-[16px]">
                    <h1 className="font-serif text-[32px] tracking-tight">Reset Password</h1>
                    <button type="button" onClick={() => { setView('login'); setForgotError(null); }} className="flex items-center justify-start gap-[6px] text-[12px] font-bold text-graphite hover:text-carbon transition-colors">
                      <ArrowLeft className="w-[14px] h-[14px]" /> BACK TO LOGIN
                    </button>
                  </div>
                  <form onSubmit={handleForgotEmailSubmit} className="flex flex-col gap-[20px]">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">Registered Email</label>
                      <input 
                        type="email" required disabled={forgotStatus === 'loading'}
                        placeholder="Enter your registered Gmail address"
                        value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); if(forgotError) setForgotError(null); }}
                        className={`input-field !bg-transparent text-[14px] py-[12px] outline-none transition-shadow ${forgotError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-1 focus:ring-carbon'}`}
                      />
                    </div>
                    {forgotError && <p className="text-[12px] text-red-500 font-medium mt-[-8px]">{forgotError}</p>}
                    <button type="submit" disabled={forgotStatus === 'loading'} className="btn-primary mt-[16px] py-[14px] flex justify-center items-center gap-[8px]">
                      {forgotStatus === 'loading' ? <><Loader2 className="w-[16px] h-[16px] animate-spin" /><span>Sending OTP...</span></> : 'SEND OTP'}
                    </button>
                  </form>
                </motion.div>
              )}

              {view === 'forgot-otp' && (
                <motion.div
                  key="forgot-otp"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="flex flex-col items-center text-center"
                >
                  <h1 className="font-serif text-[32px] mb-[12px] tracking-tight">Verify OTP</h1>
                  <p className="text-[13px] text-graphite mb-[32px]">We've sent a 4-digit code to <br/><strong className="text-carbon font-semibold">{forgotEmail}</strong></p>
                  
                  <OrbitOtp 
                    otp={otp}
                    onChange={handleOtpChange}
                    onKeyDown={handleOtpKeyDown}
                    onPaste={handleOtpPaste}
                    isLoading={forgotStatus === 'loading'}
                    isSuccess={forgotStatus === 'success'}
                    errorMsg={forgotError}
                    otpInputRefs={otpInputRefs}
                  />

                  {forgotError && <p className="text-[12px] text-red-500 font-medium mt-[16px]">{forgotError}</p>}
                  
                  <div className="mt-[24px] text-[13px] text-graphite">
                    Didn't receive the code?{' '}
                    {resendTimer > 0 ? (
                      <span className="text-carbon font-semibold">Resend in {resendTimer}s</span>
                    ) : (
                      <button type="button" onClick={handleResendOtp} disabled={forgotStatus === 'loading'} className="text-carbon font-semibold hover:underline decoration-1 underline-offset-4">Resend OTP</button>
                    )}
                  </div>
                </motion.div>
              )}

              {view === 'forgot-reset' && (
                <motion.div
                  key="forgot-reset"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                >
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-[40px] gap-[16px]">
                    <div>
                      <h1 className="font-serif text-[32px] tracking-tight">New Password</h1>
                      <p className="text-[13px] text-graphite mt-[8px]">Please enter your new password below.</p>
                    </div>
                  </div>
                  <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-[20px]">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">New Password</label>
                      <div className="relative">
                        <input 
                          type={showLoginPassword ? 'text' : 'password'} required disabled={forgotStatus === 'loading'}
                          value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          className={`input-field !bg-transparent text-[14px] py-[12px] outline-none transition-shadow ${forgotError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-1 focus:ring-carbon'}`}
                        />
                        <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-[12px] top-1/2 -translate-y-1/2 text-graphite hover:text-carbon transition-colors">
                          {showLoginPassword ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">Confirm Password</label>
                      <input 
                        type={showLoginPassword ? 'text' : 'password'} required disabled={forgotStatus === 'loading'}
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        className={`input-field !bg-transparent text-[14px] py-[12px] outline-none transition-shadow ${forgotError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-1 focus:ring-carbon'}`}
                      />
                    </div>
                    {forgotError && <p className="text-[12px] text-red-500 font-medium mt-[-8px]">{forgotError}</p>}
                    <button type="submit" disabled={forgotStatus === 'loading' || !newPassword || !confirmPassword} className="btn-primary mt-[16px] py-[14px] flex justify-center items-center gap-[8px]">
                      {forgotStatus === 'loading' ? <><Loader2 className="w-[16px] h-[16px] animate-spin" /><span>Resetting...</span></> : 'RESET PASSWORD'}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
