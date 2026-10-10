import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { fetchApi } from '../api';
import { useToast } from '../context/ToastContext';
import MobileInputField, { formatFullMobile, validateIndianMobile } from '../components/MobileInputField';

export default function Signup() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Mobile Validation (Indian 10-digit number)
    const mobileErr = validateIndianMobile(mobile);
    if (mobileErr) {
      newErrors.mobile = mobileErr;
    }

    // Email Validation (any valid email)
    if (!email || !email.includes('@')) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Password Match Validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    if (validateForm()) {
      setIsLoading(true);
      
      try {
        await fetchApi('/api/auth/register/', {
          method: 'POST',
          body: JSON.stringify({ 
            first_name: firstName, 
            last_name: lastName, 
            mobile: formatFullMobile(mobile), 
            email: email, 
            password: password,
            confirm_password: confirmPassword
          })
        });
        
        setIsLoading(false);
        addToast('Verification OTP sent to your email', 'success');
        navigate('/verify-otp', {
          state: { email, firstName, lastName, mobile }
        });
      } catch (error: any) {
        setIsLoading(false);
        const msg = error.message || 'Registration failed. Please check your information and try again.';
        setGlobalError(msg);
        addToast(msg, 'error');
      }
    }
  };

  return (
    <PageTransition>
      <main className="w-full flex-grow flex items-center justify-center py-[72px] bg-stone/30">
        <div className="w-full max-w-[540px] px-[16px]">
          <div className="bg-paper p-[40px] md:p-[64px] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-smoke">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-[40px] gap-[16px]">
              <h1 className="font-serif text-[32px] tracking-tight">Create Account</h1>
              <button 
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center justify-start gap-[6px] text-[12px] font-bold text-graphite hover:text-carbon transition-colors"
              >
                <ArrowLeft className="w-[14px] h-[14px]" />
                BACK TO HOME
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-[20px]">
              
              <div className="grid grid-cols-2 gap-[16px]">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">First Name</label>
                  <input 
                    type="text" 
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="input-field !bg-transparent text-[14px] py-[12px] focus:ring-1 focus:ring-carbon outline-none transition-shadow" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">Last Name</label>
                  <input 
                    type="text" 
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="input-field !bg-transparent text-[14px] py-[12px] focus:ring-1 focus:ring-carbon outline-none transition-shadow" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">Mobile Number</label>
                <MobileInputField
                  value={mobile}
                  onChange={(digits) => {
                    setMobile(digits);
                    if (errors.mobile) setErrors(prev => ({ ...prev, mobile: '' }));
                  }}
                  error={errors.mobile}
                />
                {errors.mobile && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-red-500 mt-[6px]">
                    {errors.mobile}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">Email Address</label>
                <input 
                  type="email" 
                  placeholder="Enter your Gmail address" 
                  required
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`input-field !bg-transparent text-[14px] py-[12px] outline-none transition-shadow ${errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-1 focus:ring-carbon'}`}
                />
                {errors.email && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-red-500 mt-[6px]">
                    {errors.email}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••" 
                    required
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                    }}
                    className={`input-field !bg-transparent text-[14px] py-[12px] outline-none transition-shadow pr-[40px] ${errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-1 focus:ring-carbon'}`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="absolute right-[12px] top-1/2 -translate-y-1/2 text-graphite hover:text-carbon transition-colors">
                    {showPassword ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-red-500 mt-[6px]">
                    {errors.password}
                  </motion.p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">Confirm Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••" 
                    required
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                    }}
                    className={`input-field !bg-transparent text-[14px] py-[12px] outline-none transition-shadow pr-[40px] ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'focus:ring-1 focus:ring-carbon'}`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-[12px] top-1/2 -translate-y-1/2 text-graphite hover:text-carbon transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-red-500 mt-[6px]">
                    {errors.confirmPassword}
                  </motion.p>
                )}
              </div>

              {globalError && (
                <div className="text-red-500 text-[13px] font-medium text-center">
                  {globalError}
                </div>
              )}
              <button 
                type="submit"
                disabled={isLoading}
                className="btn-primary mt-[16px] py-[14px]"
              >
                {isLoading ? 'PLEASE WAIT...' : 'VERIFY DETAILS'}
              </button>
            </form>
            
            <div className="mt-[32px] text-center text-[13px] text-graphite">
              Already have an account? <Link to="/login" className="text-carbon font-semibold hover:underline decoration-1 underline-offset-4 ml-[4px]">Sign In</Link>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}
