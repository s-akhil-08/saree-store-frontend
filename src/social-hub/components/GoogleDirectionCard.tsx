import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Copy,
  Check,
  Clock,
  Phone,
  BadgeCheck,
} from 'lucide-react';
import type { StoreInfo } from '../types';
import { useToast } from '../context/ToastContext';
import { trackButtonClick } from '../services/api';

interface GoogleDirectionCardProps {
  store?: StoreInfo;
}

interface TimezoneStoreStatus {
  isOpen: boolean;
  displayHoursText: string;
  isConverted: boolean;
  userTzCode: string;
}

function computeTimezoneAwareStoreStatus(store?: StoreInfo): TimezoneStoreStatus {
  const isBackendOpen = store?.is_open;
  const hoursText = store?.hours_text || '10:30 AM – 8:30 PM';
  const openTime = store?.open_time || '10:30:00';
  const closeTime = store?.close_time || '20:30:00';

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');

  // Check if today (in IST) is the weekly off day
  const WEEKDAY_MAP: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };
  const offDay = store?.weekly_off_day;
  let isTodayOffDay = false;
  if (offDay && offDay !== 'none' && WEEKDAY_MAP[offDay] !== undefined) {
    try {
      const istDateStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const istNow = new Date(istDateStr);
      if (istNow.getDay() === WEEKDAY_MAP[offDay]) {
        isTodayOffDay = true;
      }
    } catch {}
  }

  // Determine active open/close times and hours display text for today
  let activeOpenTime = openTime;
  let activeCloseTime = closeTime;
  let activeHoursText = hoursText;
  let isClosedAllDay = false;

  if (isTodayOffDay) {
    if (store?.weekly_off_open_time && store?.weekly_off_close_time) {
      activeOpenTime = store.weekly_off_open_time;
      activeCloseTime = store.weekly_off_close_time;
      activeHoursText = store.weekly_off_hours_text || hoursText;
    } else {
      isClosedAllDay = true;
    }
  }

  let [openH, openM] = [10, 30];
  let [closeH, closeM] = [20, 30];

  const matchOpen = activeOpenTime.match(/(\d{1,2}):(\d{2})/);
  if (matchOpen) {
    openH = parseInt(matchOpen[1], 10);
    openM = parseInt(matchOpen[2], 10);
    if (/PM/i.test(activeOpenTime) && openH < 12) openH += 12;
    if (/AM/i.test(activeOpenTime) && openH === 12) openH = 0;
  }

  const matchClose = activeCloseTime.match(/(\d{1,2}):(\d{2})/);
  if (matchClose) {
    closeH = parseInt(matchClose[1], 10);
    closeM = parseInt(matchClose[2], 10);
    if (/PM/i.test(activeCloseTime) && closeH < 12) closeH += 12;
    if (/AM/i.test(activeCloseTime) && closeH === 12) closeH = 0;
  }

  // Construct Date objects in IST (+05:30)
  const openIso = `${year}-${month}-${day}T${String(openH).padStart(2, '0')}:${String(openM).padStart(2, '0')}:00+05:30`;
  const closeIso = `${year}-${month}-${day}T${String(closeH).padStart(2, '0')}:${String(closeM).padStart(2, '0')}:00+05:30`;

  let openDate = new Date(openIso);
  let closeDate = new Date(closeIso);

  if (isNaN(openDate.getTime())) {
    openDate = new Date(`${year}-${month}-${day}T05:00:00Z`);
    closeDate = new Date(`${year}-${month}-${day}T15:00:00Z`);
  }

  let isOpen = false;
  if (typeof isBackendOpen === 'boolean') {
    isOpen = isBackendOpen;
  } else if (isClosedAllDay) {
    isOpen = false;
  } else {
    isOpen = now >= openDate && now < closeDate;
  }

  let userTz = 'Asia/Kolkata';
  try {
    userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {}

  let displayHoursText = activeHoursText;
  let userTzCode = 'IST';
  let isConverted = false;

  try {
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: userTz,
    });

    const tzNameFormatter = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
      timeZone: userTz,
    });

    const userOpenStr = timeFormatter.format(openDate);
    const userCloseStr = timeFormatter.format(closeDate);
    const tzParts = tzNameFormatter.formatToParts(openDate);
    userTzCode = tzParts.find((p) => p.type === 'timeZoneName')?.value || 'IST';

    const utcOffsetMinutes = -new Date().getTimezoneOffset(); // e.g. 330 for IST
    const isUserInIST =
      userTz === 'Asia/Kolkata' ||
      userTz === 'Asia/Calcutta' ||
      userTzCode === 'IST' ||
      userTzCode === 'GMT+5:30' ||
      userTzCode === '+05:30' ||
      utcOffsetMinutes === 330;

    if (isUserInIST) {
      displayHoursText = `${activeHoursText} IST`;
      isConverted = false;
    } else {
      displayHoursText = `${activeHoursText} IST (${userOpenStr} – ${userCloseStr} ${userTzCode})`;
      isConverted = true;
    }
  } catch {
    displayHoursText = `${activeHoursText} IST`;
  }

  return {
    isOpen,
    displayHoursText,
    isConverted,
    userTzCode,
  };
}

export default function GoogleDirectionCard({ store }: GoogleDirectionCardProps) {
  const { addToast } = useToast();
  const [copiedAddress, setCopiedAddress] = useState(false);

  const storeName = store?.name || 'Surya Teja Handloom Flagship Studio';
  const badgeText = store?.badge_text || 'The Saree Store';
  const storeAddress = store?.address || 'Near Market Yard, Main Road, Gadwal - 509125, Telangana, India';
  const googleMapsUrl = store?.google_maps_url || 'https://www.google.com/maps/search/?api=1&query=Surya+Teja+Gadwal+Sarees';
  const phoneNumber = store?.phone_number || '+919885878551';
  const buttonText = store?.directions_button_text || 'Google Directions';

  const [storeStatus, setStoreStatus] = useState(() => computeTimezoneAwareStoreStatus(store));

  useEffect(() => {
    const update = () => {
      setStoreStatus(computeTimezoneAwareStoreStatus(store));
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [store]);

  const handleCopyDirection = () => {
    trackButtonClick('copy_address');
    const linkToCopy = googleMapsUrl;
    navigator.clipboard.writeText(linkToCopy);
    setCopiedAddress(true);
    addToast('Google Directions link copied to clipboard!', 'success');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <section className="pt-6 pb-2">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl social-card-glass p-5 sm:p-6 border border-white/60 dark:border-white/10 shadow-sm overflow-hidden group"
        >
          {/* Top colored accent bar matching Google Maps theme */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5 group-hover:h-2 transition-all duration-300"
            style={{
              background: 'linear-gradient(90deg, #4285F4, #34A853, #FBBC05, #EA4335)',
            }}
          />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            {/* Left Location Info - Clickable link opening Google Directions */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                  e.preventDefault();
                  addToast("You are currently offline. Reconnect to the internet to get directions.", "warning");
                  return;
                }
                trackButtonClick('directions_header');
              }}
              className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 flex-1 group/header rounded-xl -m-1.5 p-1.5 transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/8 active:scale-[0.99] select-none cursor-pointer"
              title="Open Google Directions"
            >
              {/* Clean Harmonious Platform Icon Box matching current UI */}
              <motion.div
                whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.08 }}
                transition={{ duration: 0.3 }}
                className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #4285F4 0%, #34A853 100%)',
                }}
              >
                <MapPin className="w-6 h-6 text-white drop-shadow-sm" />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/header:opacity-100 transition-opacity" />
              </motion.div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {storeStatus.isOpen ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-[11px] font-bold border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-0.5" />
                      {badgeText || 'The Saree Store'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] sm:text-[11px] font-bold border border-rose-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-0.5" />
                      Closed Now
                    </span>
                  )}
                  <span
                    className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-graphite font-medium"
                    title={storeStatus.isConverted ? `Store Hours: ${store?.hours_text || '10:30 AM – 8:30 PM'} IST` : 'Store Operating Hours'}
                  >
                    <Clock className="w-3 h-3 text-ash-gray" />
                    {storeStatus.displayHoursText}
                  </span>
                </div>

                <div className="flex items-start gap-1.5 mb-1">
                  <h2 className="font-semibold text-base sm:text-lg text-carbon tracking-tight leading-snug group-hover/header:text-amber-800 dark:group-hover/header:text-[var(--color-gold)] transition-colors duration-200 break-words">
                    {storeName}
                  </h2>
                  <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-graphite group-hover/header:text-slate-900 dark:group-hover/header:text-slate-100 transition-colors duration-200 leading-relaxed break-words max-w-xl">
                  {storeAddress}
                </p>
              </div>
            </a>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-smoke/40 dark:border-smoke/20">
              {/* Google Directions Primary Button - Glassy matching UI, no solid white clash */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    e.preventDefault();
                    addToast("You are currently offline. Reconnect to the internet to get directions.", "warning");
                    return;
                  }
                  trackButtonClick('directions');
                }}
                className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 font-semibold text-[11px] uppercase tracking-wide text-white bg-carbon hover:bg-slate-800 dark:bg-white/15 dark:hover:bg-white/25 dark:text-white border border-transparent dark:border-white/20 hover:border-slate-700 dark:hover:border-white/35 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] rounded-xl transition-all duration-200 select-none group/dir cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-[#55A8FF] group-hover/dir:rotate-12 group-hover/dir:scale-110 transition-transform duration-200" />
                <span>{buttonText}</span>
              </a>

              {/* Copy Google Directions Link */}
              <button
                onClick={handleCopyDirection}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 font-semibold text-[11px] text-slate-800 dark:text-slate-100 bg-slate-100/90 hover:bg-slate-200/90 dark:bg-white/8 dark:hover:bg-white/18 border border-slate-200/80 dark:border-white/12 hover:border-slate-300 dark:hover:border-white/25 hover:-translate-y-0.5 hover:shadow-sm rounded-xl transition-all duration-200 active:translate-y-0 active:scale-95 shadow-xs select-none cursor-pointer group/copy"
                title="Copy Google Directions Link"
              >
                {copiedAddress ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 group-hover/copy:scale-110 transition-transform duration-200" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>

              {/* Direct Call Button */}
              <a
                href={`tel:${phoneNumber.replace(/\s+/g, '')}`}
                onClick={() => trackButtonClick('call')}
                className="p-2.5 rounded-xl bg-slate-100/90 hover:bg-blue-50 dark:bg-white/8 dark:hover:bg-blue-500/20 border border-slate-200/80 dark:border-white/12 hover:border-blue-300 dark:hover:border-blue-500/40 text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 active:translate-y-0 active:scale-95 shadow-xs cursor-pointer group/phone"
                title={`Call Studio (${phoneNumber})`}
                aria-label="Call Studio"
              >
                <Phone className="w-4 h-4 text-slate-700 dark:text-slate-200 group-hover/phone:text-blue-600 dark:group-hover/phone:text-blue-400 group-hover/phone:rotate-[-14deg] group-hover/phone:scale-110 transition-all duration-300" />
              </a>

              {/* WhatsApp Message Button */}
              <a
                href={`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    e.preventDefault();
                    addToast("You are currently offline. Reconnect to WhatsApp.", "warning");
                    return;
                  }
                  trackButtonClick('social_visit', 'whatsapp-direct');
                }}
                className="p-2.5 rounded-xl bg-slate-100/90 hover:bg-emerald-50 dark:bg-white/8 dark:hover:bg-emerald-500/20 border border-slate-200/80 dark:border-white/12 hover:border-emerald-300 dark:hover:border-emerald-500/40 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 active:translate-y-0 active:scale-95 shadow-xs cursor-pointer group/wa"
                title={`WhatsApp Message (${phoneNumber})`}
                aria-label="Send WhatsApp Message"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current group-hover/wa:rotate-12 group-hover/wa:scale-110 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.529 5.845L.057 23.547a.563.563 0 0 0 .693.693l5.702-1.472A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.817 9.817 0 0 1-5.006-1.374l-.359-.213-3.723.961.984-3.622-.234-.371A9.819 9.819 0 0 1 2.182 12C2.182 6.574 6.574 2.182 12 2.182S21.818 6.574 21.818 12 17.426 21.818 12 21.818z"/>
                </svg>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
