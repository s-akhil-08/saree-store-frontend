/**
 * Surya Teja Hub Backend API Service
 * Handles communication with Django Backend_Teja API endpoints with seamless fallback.
 */

import type { HubLandingResponse, SocialHandle, StoreInfo, DynamicQRData } from '../types';
import { mockProfile, mockSocialHandles, mockStoreInfo } from '../data/mockSocialData';

const getApiBaseUrl = (): string => {
  // 1. Explicit Vite environment variable
  if (import.meta.env.API_URL) {
    return import.meta.env.API_URL;
  }
  // 2. Auto-detect localhost / local dev server
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
  }
  // 3. Deployed cloud backend
  return 'https://backend-application-q9i2.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();

export async function fetchHubData(): Promise<{
  data?: {
    store: StoreInfo;
    channels: SocialHandle[];
    activeQR: DynamicQRData | null;
    profile: typeof mockProfile;
  };
  error?: {
    status: number;
    message: string;
  };
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/hub/data/`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return {
        error: {
          status: res.status,
          message:
            res.status === 404
              ? 'Page or API resource not found.'
              : res.status >= 500
              ? 'Backend server encountered an internal error.'
              : `Server returned HTTP status ${res.status}.`,
        },
      };
    }

    const data: HubLandingResponse = await res.json();
    if (data && data.success) {
      return {
        data: {
          store: data.store || mockStoreInfo,
          channels: data.channels && data.channels.length > 0 ? data.channels : mockSocialHandles,
          activeQR: data.active_qr,
          profile: {
            ...mockProfile,
            name: data.profile?.name || mockProfile.name,
            tagline: data.profile?.tagline || mockProfile.tagline,
          },
        },
      };
    }
  } catch {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        error: {
          status: 0,
          message: 'Internet connection lost.',
        },
      };
    }
    return {
      error: {
        status: 503,
        message: 'Backend server is not running or unreachable.',
      },
    };
  }

  return {
    error: {
      status: 503,
      message: 'Backend server did not return valid response.',
    },
  };
}

export async function trackButtonClick(buttonType: string, channelId: string = '') {
  try {
    await fetch(`${API_BASE_URL}/api/hub/track-click/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        button_type: buttonType,
        channel_id: channelId,
      }),
    });
  } catch {
    // Non-blocking interaction tracking
  }
}

export function getDynamicQRImageUrl(
  slug: string = 'hub',
  format: 'svg' | 'png' = 'svg',
  size: number = 600,
  fgColor: string = '#18181A',
  bgColor: string = '#FFFFFF'
): string {
  const params = new URLSearchParams({
    format,
    size: size.toString(),
    fg: fgColor,
    bg: bgColor,
    t: Date.now().toString(),
  });
  return `${API_BASE_URL}/api/hub/qr/${slug}/image/?${params.toString()}`;
}
