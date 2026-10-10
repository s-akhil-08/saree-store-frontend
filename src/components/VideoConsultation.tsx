import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchApi } from '../api';
import { Video, X, ChevronLeft, ChevronRight, CheckCircle2, Phone, Mail, MessageCircle, ChevronDown, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import MobileInputField, { formatFullMobile, validateIndianMobile } from './MobileInputField';

export default function VideoConsultation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-consultation', handleOpen);
    return () => window.removeEventListener('open-consultation', handleOpen);
  }, []);

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    time: '',
    topic: '',
    notes: ''
  });

  const timeSlots = [
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM',
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isCurrentMonth = 
    currentMonth.getFullYear() === today.getFullYear() && 
    currentMonth.getMonth() === today.getMonth();

  const handlePrevMonth = () => {
    if (isCurrentMonth) return;
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const renderCalendarDays = () => {
    const days = [];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    // Weekday headers
    weekDays.forEach(day => {
      days.push(
        <div key={`header-${day}`} className="text-center text-[10px] font-bold text-graphite uppercase py-[4px]">
          {day}
        </div>
      );
    });

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Previous month leading days (fill offset cells before startDay)
    for (let i = 0; i < startDay; i++) {
      const prevDate = new Date(year, month, i - startDay + 1);
      prevDate.setHours(0, 0, 0, 0);

      const isPast = prevDate < today;

      if (isPast) {
        days.push(
          <div key={`prev-past-${i}`} className="flex items-center justify-center">
            <button 
              type="button"
              disabled
              className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] mx-auto rounded-[6px] text-[13px] flex items-center justify-center text-ash-gray/20 dark:text-graphite/30 cursor-not-allowed select-none"
            >
              {prevDate.getDate()}
            </button>
          </div>
        );
      } else {
        const isSelected = selectedDate !== null && 
          selectedDate.getFullYear() === prevDate.getFullYear() && 
          selectedDate.getMonth() === prevDate.getMonth() && 
          selectedDate.getDate() === prevDate.getDate();

        days.push(
          <div key={`prev-day-${i}`} className="flex items-center justify-center">
            <button 
              type="button"
              onClick={() => {
                const targetMonth = new Date(prevDate.getFullYear(), prevDate.getMonth(), 1);
                setCurrentMonth(targetMonth);
                setSelectedDate(prevDate);
                if (!selectedDate || selectedDate.getTime() !== prevDate.getTime()) {
                  setFormData(prev => ({ ...prev, time: '' }));
                }
              }}
              className={`
                w-[28px] h-[28px] md:w-[32px] md:h-[32px] mx-auto rounded-[6px] text-[13px] flex items-center justify-center transition-colors
                text-ash-gray/40 hover:bg-stone/50 hover:text-carbon cursor-pointer
                ${isSelected ? 'border border-[var(--color-magenta)] !bg-paper text-carbon font-bold' : 'border border-transparent'}
              `}
            >
              {prevDate.getDate()}
            </button>
          </div>
        );
      }
    }

    // 2. Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      cellDate.setHours(0, 0, 0, 0);

      const isPast = cellDate < today;

      if (isPast) {
        // Render past dates in visible dimmed disabled style
        days.push(
          <div key={`past-${d}`} className="flex items-center justify-center">
            <button 
              type="button"
              disabled
              className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] mx-auto rounded-[6px] text-[13px] flex items-center justify-center text-ash-gray/30 dark:text-graphite/40 cursor-not-allowed select-none"
            >
              {d}
            </button>
          </div>
        );
      } else {
        const isSelected = selectedDate !== null && 
          selectedDate.getFullYear() === year && 
          selectedDate.getMonth() === month && 
          selectedDate.getDate() === d;

        days.push(
          <div key={`day-${d}`} className="flex items-center justify-center">
            <button 
              onClick={() => {
                const newSel = new Date(year, month, d);
                setSelectedDate(newSel);
                if (!selectedDate || selectedDate.getTime() !== newSel.getTime()) {
                  setFormData(prev => ({ ...prev, time: '' }));
                }
              }}
              type="button"
              className={`
                w-[28px] h-[28px] md:w-[32px] md:h-[32px] mx-auto rounded-[6px] text-[13px] flex items-center justify-center transition-colors
                hover:bg-stone/50 text-carbon cursor-pointer
                ${isSelected ? 'border border-[var(--color-magenta)] !bg-paper text-carbon font-bold' : 'border border-transparent'}
              `}
            >
              {d}
            </button>
          </div>
        );
      }
    }

    // 3. Next month trailing days (fill remaining cells in final row)
    const totalCells = startDay + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;

    for (let nextD = 1; nextD <= remainingCells; nextD++) {
      const nextDate = new Date(year, month + 1, nextD);
      nextDate.setHours(0, 0, 0, 0);

      const isPast = nextDate < today;

      if (isPast) {
        days.push(
          <div key={`next-past-${nextD}`} className="flex items-center justify-center">
            <button 
              type="button"
              disabled
              className="w-[28px] h-[28px] md:w-[32px] md:h-[32px] mx-auto rounded-[6px] text-[13px] flex items-center justify-center text-ash-gray/20 dark:text-graphite/30 cursor-not-allowed select-none"
            >
              {nextD}
            </button>
          </div>
        );
      } else {
        const isSelected = selectedDate !== null && 
          selectedDate.getFullYear() === nextDate.getFullYear() && 
          selectedDate.getMonth() === nextDate.getMonth() && 
          selectedDate.getDate() === nextDate.getDate();

        days.push(
          <div key={`next-day-${nextD}`} className="flex items-center justify-center">
            <button 
              type="button"
              onClick={() => {
                const targetMonth = new Date(nextDate.getFullYear(), nextDate.getMonth(), 1);
                setCurrentMonth(targetMonth);
                setSelectedDate(nextDate);
                if (!selectedDate || selectedDate.getTime() !== nextDate.getTime()) {
                  setFormData(prev => ({ ...prev, time: '' }));
                }
              }}
              className={`
                w-[28px] h-[28px] md:w-[32px] md:h-[32px] mx-auto rounded-[6px] text-[13px] flex items-center justify-center transition-colors
                text-ash-gray/40 hover:bg-stone/50 hover:text-carbon cursor-pointer
                ${isSelected ? 'border border-[var(--color-magenta)] !bg-paper text-carbon font-bold' : 'border border-transparent'}
              `}
            >
              {nextD}
            </button>
          </div>
        );
      }
    }
    
    return days;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!formData.fullName.trim()) {
      addToast('Please enter your full name.', 'error');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      addToast('Please enter a valid email address.', 'error');
      return false;
    }
    const mobileErr = validateIndianMobile(formData.mobile);
    if (mobileErr) {
      addToast(mobileErr, 'error');
      return false;
    }
    if (!selectedDate) {
      addToast('Please select a date.', 'error');
      return false;
    }
    if (!formData.time) {
      addToast('Please select a time.', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setStatus('submitting');
    try {
      const apiDate = selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : '';

      await fetchApi('/api/consultations/', {
        method: 'POST',
        body: JSON.stringify({
          full_name: formData.fullName,
          email: formData.email,
          mobile: formatFullMobile(formData.mobile),
          date: apiDate,
          time_slot: formData.time,
          topic: formData.topic,
          notes: formData.notes
        })
      });
      setStatus('success');
    } catch (error: any) {
      setStatus('idle');
      addToast(error.message || 'Failed to schedule consultation. Please try again.', 'error');
    }
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStatus('idle');
      setSelectedDate(null);
      setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
      setFormData({
        fullName: '',
        email: '',
        mobile: '',
        time: '',
        topic: '',
        notes: ''
      });
    }, 300);
  };

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-[20px] right-[20px] md:bottom-[32px] md:right-[32px] z-[10000] flex items-center justify-end gap-[16px] pointer-events-none">
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="bg-carbon text-paper text-[12px] font-bold px-[16px] py-[10px] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] whitespace-nowrap tracking-wide"
            >
              Video Consulting
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setIsOpen(true)}
          aria-label="Open Video Consultation"
          className="w-[56px] h-[56px] bg-carbon text-paper rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.2)] transition-shadow pointer-events-auto shrink-0"
        >
          <Video className="w-[24px] h-[24px] stroke-[1.5px]" />
        </motion.button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-carbon/20 backdrop-blur-sm z-[10001]"
              onClick={resetAndClose}
            />
            <div className="fixed inset-0 z-[10002] flex items-center justify-center pointer-events-none p-[20px]">
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[455px] max-h-[90vh] overflow-y-auto bg-[var(--color-paper)] rounded-[16px] border border-[var(--color-smoke)] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.15)] p-[20px] md:p-[28px] pointer-events-auto relative scrollbar-hide"
              >
                <button 
                  onClick={resetAndClose}
                  aria-label="Close consultation modal"
                  className="absolute top-[24px] right-[24px] text-graphite hover:text-carbon transition-colors"
                >
                  <X className="w-[20px] h-[20px] stroke-[1.5px]" />
                </button>

                <AnimatePresence mode="wait">
                  {status === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center pt-[20px]"
                    >
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1, bounce: 0.5 }}
                        className="w-[64px] h-[64px] bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-[24px]"
                      >
                        <CheckCircle2 className="w-[32px] h-[32px] stroke-[2px]" />
                      </motion.div>
                      
                      <h2 className="text-[20px] font-bold text-[var(--color-carbon)] text-center mb-[8px] leading-[1.2]">
                        Video Consultation Requested Successfully
                      </h2>
                      <p className="text-[13px] text-graphite text-center mb-[32px]">
                        We have received your request and will see you online soon.
                      </p>

                      <div className="w-full border border-smoke rounded-[12px] p-[16px] sm:p-[20px] mb-[24px] sm:mb-[32px] bg-stone/30">
                        <h3 className="text-[11px] font-bold tracking-widest text-carbon uppercase mb-[16px]">Appointment Summary</h3>
                        <div className="flex flex-col gap-[12px] text-[13px]">
                          <div className="flex justify-between">
                            <span className="text-graphite">Name</span>
                            <span className="font-medium text-carbon">{formData.fullName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-graphite">Date</span>
                            <span className="font-medium text-carbon">
                              {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-graphite">Time</span>
                            <span className="font-medium text-carbon">{formData.time}</span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full border border-smoke rounded-[12px] p-[16px] sm:p-[20px] mb-[24px] sm:mb-[32px]">
                        <h3 className="text-[11px] font-bold tracking-widest text-carbon uppercase mb-[16px]">Your Consultation Team</h3>
                        <div className="flex flex-col gap-[16px]">
                          <div className="flex items-center gap-[12px] min-w-0 w-full">
                            <div className="w-[36px] h-[36px] rounded-full bg-stone flex items-center justify-center text-graphite shrink-0">
                              <Phone className="w-[15px] h-[15px]" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[10px] text-graphite uppercase font-bold tracking-wide">Mobile</span>
                              <a 
                                href="tel:+919999888877"
                                className="text-[12px] sm:text-[13px] font-medium text-carbon hover:underline break-all min-w-0"
                              >
                                +91 99998 88877
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-[12px] min-w-0 w-full">
                            <div className="w-[36px] h-[36px] rounded-full bg-stone flex items-center justify-center text-graphite shrink-0">
                              <Mail className="w-[15px] h-[15px]" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[10px] text-graphite uppercase font-bold tracking-wide">Email</span>
                              <a 
                                href="mailto:support@silkandloom.com"
                                className="text-[12px] sm:text-[13px] font-medium text-carbon hover:underline break-all min-w-0"
                                title="support@silkandloom.com"
                              >
                                support@silkandloom.com
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-[12px] min-w-0 w-full">
                            <div className="w-[36px] h-[36px] rounded-full bg-stone flex items-center justify-center text-graphite shrink-0">
                              <MessageCircle className="w-[15px] h-[15px]" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-[10px] text-graphite uppercase font-bold tracking-wide">WhatsApp</span>
                              <a 
                                href="https://wa.me/919999888877"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[12px] sm:text-[13px] font-medium text-carbon hover:underline break-all min-w-0"
                              >
                                +91 99998 88877
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={resetAndClose}
                        className="w-full h-[40px] bg-carbon hover:bg-carbon/90 text-paper rounded-full font-bold text-[14px] transition-colors"
                      >
                        Done
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-[24px]"
                    >
                      {/* Header */}
                      <div>
                        <span className="text-[10px] font-bold tracking-[0.15em] text-[var(--color-magenta)] block mb-[8px]">
                          VIDEO CONSULTATION
                        </span>
                        <h2 className="text-[24px] font-bold text-[var(--color-carbon)] mb-[12px] leading-[1.2]">
                          Book A Video Appointment
                        </h2>
                        <p className="text-[13px] text-[var(--color-graphite)] leading-relaxed">
                          Pick a date on the calendar and a 1-hour time. Monday to Sunday, 10:00 AM – 6:00 PM IST. Only 1 hour per day per customer.
                        </p>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-[8px]">
                        <span className="px-[12px] py-[4px] bg-[var(--color-stone)] rounded-full text-[11px] font-bold text-[var(--color-graphite)]">Mon–Sun</span>
                        <span className="px-[12px] py-[4px] bg-[var(--color-stone)] rounded-full text-[11px] font-bold text-[var(--color-graphite)]">10 AM – 6 PM</span>
                        <span className="px-[12px] py-[4px] bg-[var(--color-stone)] rounded-full text-[11px] font-bold text-[var(--color-graphite)]">1 hour / day</span>
                      </div>

                      {/* Form Fields */}
                      <div className="flex flex-col gap-[16px]">
                        <div className="flex flex-col gap-[6px]">
                          <label className="text-[12px] font-bold text-[var(--color-carbon)]">Full Name</label>
                          <input 
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            type="text" 
                            placeholder="Your name" 
                            className="w-full h-[44px] px-[16px] bg-paper border border-[var(--color-smoke)] rounded-[10px] text-[14px] text-[var(--color-carbon)] placeholder:text-[var(--color-ash-gray)] outline-none focus:border-[var(--color-gold)] transition-colors"
                          />
                        </div>
                        
                        <div className="flex flex-col gap-[6px]">
                          <label className="text-[12px] font-bold text-[var(--color-carbon)]">Email</label>
                          <input 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            type="email" 
                            placeholder="Enter your Gmail address" 
                            className="w-full h-[44px] px-[16px] bg-paper border border-[var(--color-smoke)] rounded-[10px] text-[14px] text-[var(--color-carbon)] placeholder:text-[var(--color-ash-gray)] outline-none focus:border-[var(--color-gold)] transition-colors"
                          />
                        </div>

                        <div className="flex flex-col gap-[6px]">
                          <label className="text-[12px] font-bold text-[var(--color-carbon)]">Mobile</label>
                          <MobileInputField
                            value={formData.mobile}
                            onChange={(digits) => setFormData(prev => ({ ...prev, mobile: digits }))}
                          />
                        </div>

                        <div className="flex flex-col gap-[6px]">
                          <label className="text-[12px] font-bold text-[var(--color-carbon)]">Calendar – choose a date</label>
                          <div className="w-full h-[44px] px-[16px] bg-paper border border-[var(--color-smoke)] rounded-[10px] text-[14px] text-[var(--color-carbon)] flex items-center mb-[8px] font-medium">
                            {selectedDate 
                              ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
                              : 'No date selected'}
                          </div>

                          <div className="border border-[var(--color-smoke)] rounded-[12px] bg-paper p-[16px]">
                            <div className="flex justify-between items-center mb-[12px]">
                              <button 
                                type="button" 
                                disabled={isCurrentMonth}
                                onClick={handlePrevMonth}
                                aria-label="Previous month"
                                className={`p-1 rounded-md transition-colors ${isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--color-stone)] text-[var(--color-graphite)]'}`}
                              >
                                <ChevronLeft className="w-[16px] h-[16px]" />
                              </button>
                              <span className="text-[13px] font-bold text-[var(--color-carbon)]">
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </span>
                              <button 
                                type="button" 
                                onClick={handleNextMonth}
                                aria-label="Next month"
                                className="p-1 hover:bg-[var(--color-stone)] rounded-md transition-colors text-[var(--color-graphite)]"
                              >
                                <ChevronRight className="w-[16px] h-[16px]" />
                              </button>
                            </div>
                            <div className="grid grid-cols-7 gap-y-[4px]">
                              {renderCalendarDays()}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-[6px] mt-[8px] relative z-30">
                          <label className="text-[12px] font-bold text-[var(--color-carbon)]">Time picker – choose 1 hour</label>
                          
                          <button
                            type="button"
                            disabled={!selectedDate}
                            onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                            className={`w-full h-[44px] px-[16px] bg-paper border border-[var(--color-smoke)] rounded-[10px] text-[14px] flex items-center justify-between outline-none transition-colors ${
                              !selectedDate 
                                ? 'text-[var(--color-ash-gray)] cursor-not-allowed bg-stone/50' 
                                : 'text-[var(--color-carbon)] cursor-pointer hover:border-carbon/40'
                            }`}
                          >
                            <span className={formData.time ? 'font-medium text-carbon' : 'text-graphite'}>
                              {formData.time || (!selectedDate ? 'Select a date first' : 'Select a time')}
                            </span>
                            <ChevronDown className={`w-[16px] h-[16px] text-graphite transition-transform duration-200 ${isTimeDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {isTimeDropdownOpen && selectedDate && (
                              <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-[100%] left-0 right-0 mt-[6px] bg-[#F3F4F6] dark:bg-[#222225] border border-[var(--color-smoke)] rounded-[12px] shadow-2xl z-[100] overflow-hidden py-[6px] max-h-[220px] overflow-y-auto scrollbar-hide opacity-100"
                              >
                                {timeSlots.map((slot) => {
                                  const isSelected = formData.time === slot;
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, time: slot }));
                                        setIsTimeDropdownOpen(false);
                                      }}
                                      className={`w-full text-left px-[16px] py-[10px] text-[13px] transition-colors flex items-center justify-between ${
                                        isSelected 
                                          ? 'bg-stone/80 dark:bg-stone/50 text-carbon font-bold' 
                                          : 'text-carbon hover:bg-stone/50 dark:hover:bg-stone/30'
                                      }`}
                                    >
                                      <span>{slot}</span>
                                      {isSelected && <Check className="w-[14px] h-[14px] text-carbon" />}
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <span className="text-[11px] text-[var(--color-graphite)] mt-[4px]">Tap a date on the calendar to load times.</span>
                        </div>

                        <div className="flex flex-col gap-[6px] mt-[8px]">
                          <label className="text-[12px] font-bold text-[var(--color-carbon)]">What would you like to discuss?</label>
                          <input 
                            name="topic"
                            value={formData.topic}
                            onChange={handleChange}
                            type="text" 
                            placeholder="Saree styling" 
                            className="w-full h-[44px] px-[16px] bg-paper border border-[var(--color-smoke)] rounded-[10px] text-[14px] text-[var(--color-carbon)] placeholder:text-[var(--color-ash-gray)] outline-none focus:border-[var(--color-gold)] transition-colors"
                          />
                        </div>

                        <div className="flex flex-col gap-[6px]">
                          <label className="text-[12px] font-bold text-[var(--color-carbon)]">Notes (optional)</label>
                          <textarea 
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Occasion, colours, or any preference" 
                            className="w-full h-[130px] p-[16px] bg-paper border border-[var(--color-smoke)] rounded-[10px] text-[14px] text-[var(--color-carbon)] placeholder:text-[var(--color-ash-gray)] outline-none focus:border-[var(--color-gold)] transition-colors resize-none"
                          />
                        </div>
                      </div>

                      <div className="mt-[16px] flex flex-col gap-[12px]">
                        <button 
                          type="submit"
                          disabled={status === 'submitting'}
                          className="relative w-full h-[40px] bg-[#18181A] hover:bg-[#18181A]/85 disabled:opacity-70 text-white rounded-full font-bold text-[14px] transition-colors flex items-center justify-center overflow-hidden"
                        >
                          <span className={`transition-opacity duration-300 ${status === 'submitting' ? 'opacity-0' : 'opacity-100'}`}>
                            Request video call
                          </span>
                          {status === 'submitting' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-[18px] h-[18px] border-[2px] border-white/30 border-t-white rounded-full animate-spin" />
                            </div>
                          )}
                        </button>
                        <p className="text-[11px] text-[var(--color-graphite)] text-center">
                          You will receive a confirmation after we review the request.
                        </p>
                      </div>

                    </motion.form>
                  )}
                </AnimatePresence>

              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

