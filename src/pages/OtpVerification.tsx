import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { OrbitOtp } from '../components/OrbitOtp';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchApi } from '../api';

export default function OtpVerification() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();
  
  const email = location.state?.email || 'user@gmail.com';
  
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(120);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0 && !isSuccess) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, isSuccess]);

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      await fetchApi('/api/auth/resend-otp/', {
        method: 'POST',
        body: JSON.stringify({ email, purpose: 'register' })
      });
      setResendTimer(120);
      addToast('OTP resent successfully', 'success');
    } catch (error: any) {
      const msg = error.message || 'Error resending OTP';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, []);

  const verifyOtp = async (code: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await fetchApi('/api/auth/verify-otp/', {
        method: 'POST',
        body: JSON.stringify({ email, otp: code })
      });
      if (data && data.tokens) {
        localStorage.setItem('access', data.tokens.access);
        localStorage.setItem('refresh', data.tokens.refresh);
        setIsSuccess(true);
        addToast("Verification successful! Logging in...", "success");
        setTimeout(() => {
          login(data.user.email, data.user.name || data.user.first_name || data.user.email, data.user.mobile);
          navigate('/');
        }, 1200);
      } else if (data && data.user) {
        setIsSuccess(true);
        addToast("Verification successful! Logging in...", "success");
        setTimeout(() => {
          login(data.user.email, data.user.name || data.user.first_name || data.user.email, data.user.mobile);
          navigate('/');
        }, 1200);
      } else {
        setIsSuccess(true);
        addToast("Verification successful!", "success");
        setTimeout(() => {
          const fullName = location.state?.firstName 
            ? `${location.state.firstName} ${location.state.lastName || ''}`.trim()
            : email;
          login(email, fullName, location.state?.mobile);
          navigate('/');
        }, 1200);
      }
    } catch (error: any) {
      const msg = error.message || 'Invalid or expired OTP. Please try again.';
      setErrorMsg(msg);
      addToast(msg, 'error');
      setOtp(['', '', '', '']);
      otpInputRefs.current[0]?.focus();
      setIsLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    if (isLoading || isSuccess) return;
    if (value && !/^\d+$/.test(value)) return;
    if (errorMsg) setErrorMsg(null);

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (index === 3 && value && newOtp.every(digit => digit !== '')) {
      verifyOtp(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').slice(0, 4).replace(/\D/g, '');
    if (pasted) {
      const newOtp = [...otp];
      pasted.split('').forEach((char, i) => {
        newOtp[i] = char;
      });
      setOtp(newOtp);
      
      if (pasted.length === 4) {
        verifyOtp(pasted);
      } else {
        otpInputRefs.current[pasted.length]?.focus();
      }
    }
  };

  return (
    <PageTransition>
      <main className="w-full flex-grow flex items-center justify-center py-[72px] bg-stone/30 min-h-[calc(100vh-72px)]">
        <div className="w-full max-w-[540px] px-[16px]">
          <div className="bg-paper p-[32px] sm:p-[40px] md:p-[64px] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-smoke min-h-[440px] flex flex-col justify-center relative overflow-visible">
            
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="verify-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center text-center"
                >
                  <h1 className="font-serif text-[32px] mb-[12px] tracking-tight">Verify Email</h1>
                  <p className="text-[13px] text-graphite mb-[32px]">
                    We've sent a 4-digit code to <br/>
                    <strong className="text-carbon font-semibold">{email}</strong>
                  </p>

                  <OrbitOtp 
                    otp={otp}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    isLoading={isLoading}
                    isSuccess={isSuccess}
                    errorMsg={errorMsg}
                    otpInputRefs={otpInputRefs}
                  />

                  {errorMsg && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="text-[12px] text-red-500 mt-[16px] font-medium"
                    >
                      {errorMsg}
                    </motion.p>
                  )}
                  
                  <div className="mt-[24px] text-[13px] text-graphite">
                    Didn't receive the code?{' '}
                    {resendTimer > 0 ? (
                      <span className="text-carbon font-semibold">Resend in {resendTimer}s</span>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-carbon font-semibold hover:underline decoration-1 underline-offset-4"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                </motion.div>
              ) : (
                <motion.div
                  key="verify-success"
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
                  <h2 className="text-[24px] font-bold mb-[8px]">Verification Successful</h2>
                  <p className="text-[14px] text-graphite">Redirecting you to the home screen.</p>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </main>
    </PageTransition>
  );
}
