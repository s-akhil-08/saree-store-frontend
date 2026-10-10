import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';

export interface UseSilentFetchOptions {
  retryIntervalMs?: number; // Frequency of silent background retry attempts (default: 5000ms)
  timeoutMs?: number;       // Accumulated error timeout before showing full error page (default: 45000ms = 45s)
  toastOnFirstError?: boolean;
}

export function useSilentFetchWithTimeout<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = [],
  options: UseSilentFetchOptions = {}
) {
  const {
    retryIntervalMs = 3000,
    timeoutMs = 45000,
    toastOnFirstError = true,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showErrorPage, setShowErrorPage] = useState<boolean>(false);
  const [errorStatusCode, setErrorStatusCode] = useState<number | string>(500);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const { addToast } = useToast();

  const isMountedRef = useRef<boolean>(true);
  const firstErrorTimeRef = useRef<number | null>(null);
  const retryTimerRef = useRef<any>(null);
  const hasToastedRef = useRef<boolean>(false);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const executeFetch = useCallback(
    async (isSilent = false) => {
      if (!isSilent && isMountedRef.current) {
        setLoading(true);
      }

      try {
        const result = await fetchFn();
        if (!isMountedRef.current) return;

        // Successful fetch: reset error tracking & timers
        setData(result);
        setShowErrorPage(false);
        setErrorStatusCode(500);
        setErrorMsg('');
        firstErrorTimeRef.current = null;
        hasToastedRef.current = false;
        clearRetryTimer();
      } catch (err: any) {
        if (!isMountedRef.current) return;

        const message = err?.message || 'Failed to fetch data';
        
        // Extract HTTP status code if present (e.g., "API error: 500" or "API error: 503")
        let statusCode: number | string = 500;
        const statusMatch = String(message).match(/API error:\s*(\d+)/i);
        if (statusMatch) {
          statusCode = parseInt(statusMatch[1], 10);
        } else if (
          String(message).toLowerCase().includes('failed to fetch') ||
          String(message).toLowerCase().includes('networkerror')
        ) {
          statusCode = 503;
        }

        setErrorStatusCode(statusCode);
        setErrorMsg(message);

        // Record first error timestamp
        if (!firstErrorTimeRef.current) {
          firstErrorTimeRef.current = Date.now();
        }

        // Show toast notification on initial error
        if (toastOnFirstError && !hasToastedRef.current) {
          addToast(`${message}. Retrying silently in background...`, 'error');
          hasToastedRef.current = true;
        }

        if (data !== null || isSilent) {
          // Keep existing data intact on background errors
          return;
        }

        const elapsed = Date.now() - firstErrorTimeRef.current;

        if (elapsed >= timeoutMs) {
          // If accumulated error time has reached timeout without recovery, display error page
          setShowErrorPage(true);
          clearRetryTimer();
        } else {
          // Schedule next silent retry
          clearRetryTimer();
          retryTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              executeFetch(true);
            }
          }, retryIntervalMs);
        }
      } finally {
        if (!isSilent && isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchFn, retryIntervalMs, timeoutMs, toastOnFirstError, addToast]
  );

  const retryManually = useCallback(() => {
    firstErrorTimeRef.current = null;
    hasToastedRef.current = false;
    setShowErrorPage(false);
    clearRetryTimer();
    executeFetch(false);
  }, [executeFetch]);

  useEffect(() => {
    isMountedRef.current = true;
    executeFetch(false);

    return () => {
      isMountedRef.current = false;
      clearRetryTimer();
    };
  }, deps);

  return {
    data,
    loading,
    showErrorPage,
    errorStatusCode,
    errorMsg,
    retry: retryManually,
    refetchSilent: () => executeFetch(true),
  };
}
