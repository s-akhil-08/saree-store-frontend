import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Plus, ArrowLeft, Video, Calendar, Clock, Loader2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { ProfileSkeleton, ConsultationListSkeleton } from '../components/Skeletons';
import { fetchApi } from '../api';
import { OrbitOtp } from '../components/OrbitOtp';
import MobileInputField, { formatFullMobile, formatDisplayMobile, sanitizeIndianMobile, validateIndianMobile } from '../components/MobileInputField';

type Tab = 'profile' | 'consultations';

export default function Profile() {
  const { user, isLoading, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>(location.state?.activeTab || 'profile');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  // Profile Edit State
  const [editingField, setEditingField] = useState<'name' | 'mobile' | 'email' | null>(null);
  const [editName, setEditName] = useState(user?.name || '');
  const [editMobile, setEditMobile] = useState(sanitizeIndianMobile(user?.mobile || ''));
  const [editEmail, setEditEmail] = useState(user?.email || '');

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditMobile(sanitizeIndianMobile(user.mobile || ''));
      setEditEmail(user.email || '');
    }
  }, [user]);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [isOtpSuccess, setIsOtpSuccess] = useState(false);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '']);
  const [resendTimer, setResendTimer] = useState(120);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (showEmailOtp && resendTimer > 0 && !isOtpSuccess) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showEmailOtp, resendTimer, isOtpSuccess]);

  useEffect(() => {
    if (showEmailOtp) {
      setResendTimer(120);
    }
  }, [showEmailOtp]);

  const handleResendProfileOtp = async () => {
    if (resendTimer > 0 || isEditLoading) return;
    setIsEditLoading(true);
    setEditError(null);

    try {
      if (editingField === 'mobile') {
        const fullMobile = formatFullMobile(editMobile);
        await fetchApi('/api/auth/change-mobile/', {
          method: 'POST',
          body: JSON.stringify({ mobile: fullMobile })
        });
      } else {
        await fetchApi('/api/auth/change-email/', {
          method: 'POST',
          body: JSON.stringify({ new_email: editEmail })
        });
      }

      setResendTimer(120);
      addToast('OTP resent successfully', 'success');
    } catch (error: any) {
      const msg = error.message || 'Error resending OTP';
      setEditError(msg);
      addToast(msg, 'error');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleEditSubmit = async (field: 'name' | 'mobile' | 'email') => {
    setEditError(null);
    setIsEditLoading(true);

    if (field === 'name') {
      if (editName.trim() === user?.name?.trim()) {
        setEditError('Name is identical to current data.');
        setIsEditLoading(false);
        return;
      }
      try {
        const [firstName, ...rest] = editName.split(' ');
        const lastName = rest.join(' ') || '';
        await fetchApi('/api/auth/change-name/', {
          method: 'POST',
          body: JSON.stringify({ first_name: firstName, last_name: lastName })
        });
        
        await new Promise(r => setTimeout(r, 600));
        addToast('Name updated successfully', 'success');
        updateUser({ name: editName });
        setEditingField(null);
        setIsEditLoading(false);
      } catch (err: any) {
        setEditError(err.message || 'Failed to update name');
        setIsEditLoading(false);
      }
    } 
    else if (field === 'mobile') {
      const mobileErr = validateIndianMobile(editMobile);
      if (mobileErr) {
        setEditError(mobileErr);
        setIsEditLoading(false);
        return;
      }
      const fullMobile = formatFullMobile(editMobile);
      if (fullMobile === user?.mobile?.trim()) {
        setEditError('Mobile number is identical to current data.');
        setIsEditLoading(false);
        return;
      }
      try {
        await fetchApi('/api/auth/change-mobile/', {
          method: 'POST',
          body: JSON.stringify({ mobile: fullMobile })
        });
        
        await new Promise(r => setTimeout(r, 600));
        addToast(`OTP sent to your current email to verify mobile change`, 'success');
        setShowEmailOtp(true); // We can reuse the OTP UI state
        setIsEditLoading(false);
      } catch (err: any) {
        const errMsg = err.message || 'Failed to initiate mobile change';
        setEditError(errMsg);
        addToast(errMsg, 'error');
        setIsEditLoading(false);
      }
    } 
    else if (field === 'email') {
      if (editEmail.trim().toLowerCase() === user?.email?.trim().toLowerCase()) {
        setEditError('Email is identical to current data.');
        setIsEditLoading(false);
        return;
      }
      if (!editEmail.toLowerCase().endsWith('@gmail.com')) {
        setEditError('Only @gmail.com emails are accepted');
        setIsEditLoading(false);
        return;
      }
      try {
        await fetchApi('/api/auth/change-email/', {
          method: 'POST',
          body: JSON.stringify({ new_email: editEmail })
        });
        
        await new Promise(r => setTimeout(r, 600));
        setShowEmailOtp(true);
        addToast(`OTP sent to ${editEmail}`, 'success');
        setIsEditLoading(false);
      } catch (err: any) {
        setEditError(err.message || 'Failed to initiate email change');
        setIsEditLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setEditError(null);
    setIsEditLoading(true);
    
    try {
      let purpose = editingField === 'mobile' ? 'change_mobile' : 'change_email';
      let emailForVerify = editingField === 'mobile' ? user?.email : editEmail;
      
      await fetchApi('/api/auth/confirm-change/', {
        method: 'POST',
        body: JSON.stringify({ email: emailForVerify, purpose, otp: code })
      });

      await new Promise(r => setTimeout(r, 800));
      setIsEditLoading(false);
      setIsOtpSuccess(true);
      addToast(`${editingField === 'mobile' ? 'Mobile Number' : 'Email'} updated successfully!`, 'success');
      
      if (editingField === 'mobile') {
        updateUser({ mobile: formatFullMobile(editMobile) });
      } else {
        updateUser({ email: editEmail });
      }

      setTimeout(() => {
        setShowEmailOtp(false);
        setEditingField(null);
        setEmailOtp(['', '', '', '']);
        setIsOtpSuccess(false);
      }, 2000);
    } catch (err: any) {
      setEditError(err.message || 'Invalid OTP. Please try again.');
      setEmailOtp(['', '', '', '']);
      otpInputRefs.current[0]?.focus();
      setIsEditLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isEditLoading) return;
    if (value && !/^\d+$/.test(value)) return;
    if (editError) setEditError(null);
    
    const newOtp = [...emailOtp];
    newOtp[index] = value;
    setEmailOtp(newOtp);
    if (value && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
      if (index === 3 && value && newOtp.every(d => d !== '')) {
      handleVerifyOtp(newOtp.join(''));
    }
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !emailOtp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pasted) {
      const newOtp = [...emailOtp];
      pasted.split('').forEach((char, i) => { if(i<4) newOtp[i] = char; });
      setEmailOtp(newOtp);
      if (pasted.length >= 4) {
        handleVerifyOtp(pasted.slice(0,4));
      } else {
        otpInputRefs.current[pasted.length]?.focus();
      }
    }
  };

  const [consultations, setConsultations] = useState<any[]>([]);
  const [isConsultationsLoading, setIsConsultationsLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [isLoading, user, navigate]);

  useEffect(() => {
    if (!isLoading && user && activeTab === 'consultations') {
      setIsConsultationsLoading(true);
      fetchApi('/api/consultations/list/')
        .then(data => {
          if (Array.isArray(data)) {
            setConsultations(data);
          } else if (data && Array.isArray(data.results)) {
            setConsultations(data.results);
          } else {
            setConsultations([]);
          }
        })
        .catch(() => {
          setConsultations([]);
        })
        .finally(() => setIsConsultationsLoading(false));
    }
  }, [user, activeTab, isLoading]);

  if (isLoading) {
    return (
      <PageTransition>
        <ProfileSkeleton />
      </PageTransition>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      addToast('Signed out successfully', 'success');
      navigate('/');
    } catch (e) {
      console.error('Logout error:', e);
      addToast('Signed out successfully', 'success');
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <PageTransition>
      <main className="w-full bg-stone/30 min-h-[calc(100vh-100px)] py-[48px] md:py-[64px]">
        <div className="container-custom">
          
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-[32px] md:mb-[48px] gap-[16px]">
            <h1 className="font-serif text-[36px] tracking-tight">My Account</h1>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-[6px] text-[12px] font-bold text-graphite hover:text-carbon transition-colors"
            >
              <ArrowLeft className="w-[14px] h-[14px]" />
              BACK TO HOME
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-[32px] items-start">
            
            {/* Sidebar Navigation */}
            <div className="w-full md:w-[280px] shrink-0">
              <div className="bg-paper p-[24px] md:p-[32px] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-smoke flex flex-col gap-[8px]">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center gap-[12px] px-[16px] py-[12px] rounded-lg text-[13px] font-semibold transition-colors ${activeTab === 'profile' ? 'bg-stone/50 text-carbon' : 'text-graphite hover:text-carbon hover:bg-stone/30'}`}
                >
                  <User className="w-[16px] h-[16px]" />
                  Profile Details
                </button>
                <button 
                  onClick={() => setActiveTab('consultations')}
                  className={`flex items-center gap-[12px] px-[16px] py-[12px] rounded-lg text-[13px] font-semibold transition-colors ${activeTab === 'consultations' ? 'bg-stone/50 text-carbon' : 'text-graphite hover:text-carbon hover:bg-stone/30'}`}
                >
                  <Video className="w-[16px] h-[16px]" />
                  Consultations
                </button>
                
                <div className="h-[1px] bg-smoke my-[8px]" />
                
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={handleLogout} 
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-[12px] px-[16px] py-[12px] rounded-lg text-[13px] font-semibold text-graphite hover:text-red-500 hover:bg-red-50 transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed text-left group"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="w-[16px] h-[16px] animate-spin text-red-500" />
                      <span className="text-red-500 font-bold animate-pulse">Signing Out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-[16px] h-[16px] transition-transform duration-300 group-hover:-translate-x-1" />
                      <span>Sign Out</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow w-full min-w-0">
              <div className="bg-paper p-[32px] md:p-[48px] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-smoke min-h-[400px]">
                <AnimatePresence mode="wait">
                  
                                      {activeTab === 'profile' && (
                      <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h2 className="font-serif text-[24px] mb-[32px] tracking-tight border-b border-smoke pb-[16px]">Personal Details</h2>
                        
                        <div className="grid grid-cols-1 gap-[24px] max-w-[600px]">
                           {/* NAME FIELD */}
                           <div className="border border-smoke rounded-xl p-[16px] sm:p-[24px] bg-stone/20 relative">
                             <span className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">Full Name</span>
                             {editingField === 'name' ? (
                               <div className="flex flex-col gap-[12px] mt-[12px]">
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                                   <div>
                                     <label className="text-[11px] font-semibold text-graphite">Old Name</label>
                                     <input type="text" disabled value={user?.name || ''} className="input-field !bg-stone/50 text-[14px] py-[10px] outline-none mt-[4px] opacity-70" />
                                   </div>
                                   <div>
                                     <label className="text-[11px] font-semibold text-graphite">New Name</label>
                                     <input type="text" value={editName} onChange={e => {setEditName(e.target.value); setEditError(null);}} className="input-field !bg-transparent text-[14px] py-[10px] focus:ring-1 focus:ring-carbon outline-none mt-[4px]" />
                                   </div>
                                 </div>
                                 {editError && editingField === 'name' && <p className="text-[12px] text-red-500 font-medium">{editError}</p>}
                                 <div className="flex gap-[12px] mt-[8px]">
                                   <button onClick={() => handleEditSubmit('name')} disabled={isEditLoading} className="btn-primary py-[8px] px-[16px] text-[12px] w-auto">{isEditLoading ? 'SAVING...' : 'SAVE NAME'}</button>
                                   <button onClick={() => {setEditingField(null); setEditError(null);}} className="text-[12px] font-bold text-graphite hover:text-carbon px-[12px]">CANCEL</button>
                                 </div>
                               </div>
                             ) : (
                               <div className="flex justify-between items-center gap-[12px] mt-[4px] w-full min-w-0">
                                  <span className="block text-[14px] sm:text-[15px] text-carbon font-medium truncate min-w-0 flex-1" title={user?.name}>{user?.name}</span>
                                  <button onClick={() => {setEditingField('name'); setEditName(user?.name || ''); setEditError(null); setShowEmailOtp(false);}} className="text-[12px] font-bold text-carbon hover:underline underline-offset-4 shrink-0">EDIT</button>
                                </div>
                             )}
                           </div>

                           {/* MOBILE FIELD */}
                           <div className="border border-smoke rounded-xl p-[16px] sm:p-[24px] bg-stone/20 relative">
                             <span className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">Mobile Number</span>
                             {editingField === 'mobile' ? (
                               <div className="flex flex-col gap-[12px] mt-[12px]">
                                 {showEmailOtp ? (
                                   <div className="bg-stone/30 backdrop-blur-sm p-[14px] sm:p-[24px] rounded-xl border border-smoke shadow-sm flex flex-col items-center mt-[8px] w-full max-w-full overflow-hidden">
                                     <h3 className="text-[16px] sm:text-[18px] font-serif font-semibold mb-[8px]">Verify Mobile Change</h3>
                                     <p className="text-[12px] sm:text-[13px] text-graphite mb-[16px] sm:mb-[24px] text-center max-w-full break-words px-[4px]">We sent a verification code to your email to authorize changing your mobile to<br/><strong className="text-carbon break-all">{formatDisplayMobile(editMobile)}</strong></p>
                                     
                                     <OrbitOtp otp={emailOtp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} onPaste={handleOtpPaste} isLoading={isEditLoading} isSuccess={isOtpSuccess} errorMsg={editError} otpInputRefs={otpInputRefs} />
                                     
                                     {editError && <p className="text-[12px] text-red-500 font-medium mt-[12px] text-center">{editError}</p>}
                                     
                                     <div className="mt-[16px] sm:mt-[20px] text-[12px] sm:text-[13px] text-graphite text-center">
                                       Didn't receive the code?{' '}
                                       {resendTimer > 0 ? (
                                         <span className="text-carbon font-semibold">Resend in {resendTimer}s</span>
                                       ) : (
                                         <button 
                                           type="button" 
                                           onClick={handleResendProfileOtp}
                                           disabled={isEditLoading}
                                           className="text-carbon font-semibold hover:underline decoration-1 underline-offset-4"
                                         >
                                           Resend OTP
                                         </button>
                                       )}
                                     </div>
                                     
                                     <button onClick={() => {setShowEmailOtp(false); setEditError(null); setEmailOtp(['','','','']);}} className="text-[11px] sm:text-[12px] font-bold text-graphite hover:text-carbon mt-[20px] sm:mt-[24px]">CHANGE MOBILE AGAIN</button>
                                   </div>
                                 ) : (
                                   <>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                                       <div>
                                         <label className="text-[11px] font-semibold text-graphite mb-[4px] block">Old Mobile</label>
                                         <input type="text" disabled value={formatDisplayMobile(user?.mobile) || 'N/A'} className="input-field !bg-stone/50 text-[14px] py-[10px] outline-none opacity-70" />
                                       </div>
                                       <div>
                                         <label className="text-[11px] font-semibold text-graphite mb-[4px] block">New Mobile</label>
                                         <MobileInputField
                                           value={editMobile}
                                           onChange={(digits) => {
                                             setEditMobile(digits);
                                             setEditError(null);
                                           }}
                                           error={editError && editingField === 'mobile' ? editError : undefined}
                                         />
                                       </div>
                                     </div>
                                     {editError && editingField === 'mobile' && <p className="text-[12px] text-red-500 font-medium">{editError}</p>}
                                     <div className="flex gap-[12px] mt-[8px]">
                                       <button onClick={() => handleEditSubmit('mobile')} disabled={isEditLoading} className="btn-primary py-[8px] px-[16px] text-[12px] w-auto">{isEditLoading ? 'SAVING...' : 'SAVE MOBILE'}</button>
                                       <button onClick={() => {setEditingField(null); setEditError(null);}} className="text-[12px] font-bold text-graphite hover:text-carbon px-[12px]">CANCEL</button>
                                     </div>
                                   </>
                                 )}
                               </div>
                             ) : (
                               <div className="flex justify-between items-center gap-[12px] mt-[4px] w-full min-w-0">
                                  <span className="block text-[14px] sm:text-[15px] text-carbon font-medium truncate min-w-0 flex-1" title={formatDisplayMobile(user?.mobile) || 'Not set'}>{formatDisplayMobile(user?.mobile) || 'Not set'}</span>
                                  <button onClick={() => {setEditingField('mobile'); setEditMobile(sanitizeIndianMobile(user?.mobile || '')); setEditError(null); setShowEmailOtp(false);}} className="text-[12px] font-bold text-carbon hover:underline underline-offset-4 shrink-0">EDIT</button>
                                </div>
                             )}
                           </div>

                           {/* EMAIL FIELD */}
                           <div className="border border-smoke rounded-xl p-[16px] sm:p-[24px] bg-stone/20 relative">
                             <span className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[8px]">Email Address</span>
                             {editingField === 'email' ? (
                               <div className="flex flex-col gap-[12px] mt-[12px]">
                                 {showEmailOtp ? (
                                   <div className="bg-stone/30 backdrop-blur-sm p-[14px] sm:p-[24px] rounded-xl border border-smoke shadow-sm flex flex-col items-center mt-[8px] w-full max-w-full overflow-hidden">
                                     <h3 className="text-[16px] sm:text-[18px] font-serif font-semibold mb-[8px]">Verify New Email</h3>
                                     <p className="text-[12px] sm:text-[13px] text-graphite mb-[16px] sm:mb-[24px] text-center max-w-full break-words px-[4px]">We sent a verification code to<br/><strong className="text-carbon break-all">{editEmail}</strong></p>
                                     
                                     <OrbitOtp otp={emailOtp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} onPaste={handleOtpPaste} isLoading={isEditLoading} isSuccess={isOtpSuccess} errorMsg={editError} otpInputRefs={otpInputRefs} />
                                     
                                     {editError && <p className="text-[12px] text-red-500 font-medium mt-[12px] text-center">{editError}</p>}
                                     
                                     <div className="mt-[16px] sm:mt-[20px] text-[12px] sm:text-[13px] text-graphite text-center">
                                       Didn't receive the code?{' '}
                                       {resendTimer > 0 ? (
                                         <span className="text-carbon font-semibold">Resend in {resendTimer}s</span>
                                       ) : (
                                         <button 
                                           type="button" 
                                           onClick={handleResendProfileOtp}
                                           disabled={isEditLoading}
                                           className="text-carbon font-semibold hover:underline decoration-1 underline-offset-4"
                                         >
                                           Resend OTP
                                         </button>
                                       )}
                                     </div>
                                     
                                     <button onClick={() => {setShowEmailOtp(false); setEditError(null); setEmailOtp(['','','','']);}} className="text-[11px] sm:text-[12px] font-bold text-graphite hover:text-carbon mt-[20px] sm:mt-[24px]">CHANGE EMAIL</button>
                                   </div>
                                 ) : (
                                   <>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                                       <div>
                                         <label className="text-[11px] font-semibold text-graphite">Old Email</label>
                                         <input type="text" disabled value={user?.email || ''} title={user?.email || ''} className="input-field !bg-stone/50 text-[14px] py-[10px] outline-none mt-[4px] opacity-70 truncate" />
                                       </div>
                                       <div>
                                         <label className="text-[11px] font-semibold text-graphite">New Email</label>
                                         <input type="email" placeholder="Enter your Gmail address" value={editEmail} onChange={e => {setEditEmail(e.target.value); setEditError(null);}} className="input-field !bg-transparent text-[14px] py-[10px] focus:ring-1 focus:ring-carbon outline-none mt-[4px]" />
                                       </div>
                                     </div>
                                     {editError && editingField === 'email' && <p className="text-[12px] text-red-500 font-medium">{editError}</p>}
                                     <div className="flex gap-[12px] mt-[8px]">
                                       <button onClick={() => handleEditSubmit('email')} disabled={isEditLoading || !editEmail} className="btn-primary py-[8px] px-[16px] text-[12px] w-auto">{isEditLoading ? 'SENDING OTP...' : 'UPDATE & VERIFY'}</button>
                                       <button onClick={() => {setEditingField(null); setEditError(null);}} className="text-[12px] font-bold text-graphite hover:text-carbon px-[12px]">CANCEL</button>
                                     </div>
                                   </>
                                 )}
                               </div>
                             ) : (
                               <div className="flex justify-between items-center gap-[12px] mt-[4px] w-full min-w-0">
                                  <span className="block text-[14px] sm:text-[15px] text-carbon font-medium truncate min-w-0 flex-1" title={user?.email}>{user?.email}</span>
                                  <button onClick={() => {setEditingField('email'); setEditEmail(user?.email || ''); setEditError(null); setShowEmailOtp(false);}} className="text-[12px] font-bold text-carbon hover:underline underline-offset-4 shrink-0">EDIT</button>
                                </div>
                             )}
                           </div>
                        </div>
                      </motion.div>
                    )}

                  {activeTab === 'consultations' && (
                    <motion.div
                      key="consultations"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-center mb-[32px] border-b border-smoke pb-[16px]">
                        <h2 className="font-serif text-[24px] tracking-tight">Video Consultations</h2>
                        <button 
                          onClick={() => window.dispatchEvent(new CustomEvent('open-consultation'))}
                          className="flex items-center gap-[6px] text-[12px] font-bold text-carbon hover:underline underline-offset-4"
                        >
                          <Plus className="w-[14px] h-[14px]" />
                          BOOK NEW
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-[24px]">
                        {isConsultationsLoading ? (
                          <ConsultationListSkeleton />
                        ) : consultations.length === 0 ? (
                          <div className="text-center py-[48px] text-graphite text-[14px]">
                            You have no video consultations booked.
                          </div>
                        ) : (
                          consultations.map((consult) => (
                            <div key={consult.id} className="border border-smoke rounded-xl p-[24px] bg-stone/20 hover:border-carbon/30 transition-colors relative">
                              <div className="absolute top-[24px] right-[24px]">
                                <span className={`px-[12px] py-[5px] rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  consult.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800' :
                                  consult.status === 'Completed' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800' :
                                  consult.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' :
                                  consult.status === 'Rescheduled' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800' :
                                  consult.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800' :
                                  'bg-stone/50 text-carbon border-smoke'
                                }`}>
                                  {consult.status}
                                </span>
                              </div>
                              
                              <h3 className="text-[16px] font-bold text-carbon mb-[16px] pr-[100px]">{consult.service || 'Video Consultation'}</h3>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-[16px] gap-x-[24px]">
                                <div>
                                  <span className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[4px]">Appointment Date</span>
                                  <div className="flex items-center gap-[6px] text-[13px] text-carbon font-medium">
                                    <Calendar className="w-[14px] h-[14px] text-graphite" />
                                    {consult.date}
                                  </div>
                                </div>
                                <div>
                                  <span className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[4px]">Time Slot</span>
                                  <div className="flex items-center gap-[6px] text-[13px] text-carbon font-medium">
                                    <Clock className="w-[14px] h-[14px] text-graphite" />
                                    {consult.time_slot || consult.time}
                                  </div>
                                </div>
                                <div>
                                  <span className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[4px]">Topic</span>
                                  <span className="block text-[13px] text-carbon font-medium">{consult.topic || 'Not specified'}</span>
                                </div>
                                <div>
                                  <span className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[4px]">Name</span>
                                  <span className="block text-[13px] text-carbon font-medium">{consult.full_name || consult.name}</span>
                                </div>
                                <div>
                                  <span className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[4px]">Mobile</span>
                                  <a href={`tel:+91${consult.mobile}`} className="block text-[13px] text-carbon font-medium hover:underline break-all">+91 {consult.mobile}</a>
                                </div>
                                <div className="sm:col-span-2 lg:col-span-1">
                                  <span className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[4px]">Email</span>
                                  <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(consult.email)}`} target="_blank" rel="noopener noreferrer" className="block text-[13px] text-carbon font-medium hover:underline break-all" title={consult.email}>{consult.email}</a>
                                </div>
                              </div>
                              
                              {consult.notes && (
                                <div className="mt-[16px] pt-[16px] border-t border-smoke">
                                  <span className="block text-[11px] font-bold uppercase tracking-widest text-graphite mb-[4px]">Notes</span>
                                  <span className="block text-[13px] text-graphite leading-relaxed">{consult.notes}</span>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}



