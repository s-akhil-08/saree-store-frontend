export type CategoryId = 'all' | 'social' | 'direct' | 'business' | 'portfolio' | 'media';

export interface SocialHandle {
  id: string;
  name: string;
  handle: string;
  url: string;
  category: CategoryId;
  followers?: string;
  statsLabel?: string;
  badge?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  isDirectChat?: boolean;
  color: string;
  accentColor: string;
  gradient: string;
  iconName: string;
  buttonLabel?: string;
  qrValue?: string;
  tags?: string[];
  recentHighlight?: string;
}

export interface ProfileInfo {
  name: string;
  tagline: string;
  brandTitle: string;
  bio: string;
  avatarUrl: string;
  coverImage?: string;
  location: string;
  established: string;
  isAvailable: boolean;
  availabilityText: string;
  verificationBadge: string;
  totalReach: string;
  engagementRate: string;
  responseTime: string;
  activeChannelsCount: number;
}

export interface CategoryTab {
  id: CategoryId;
  label: string;
  icon: string;
  count?: number;
}

export interface QRSettings {
  fgColor: string;
  bgColor: string;
  includeLogo: boolean;
  level: 'L' | 'M' | 'Q' | 'H';
  size: number;
}

export interface StoreInfo {
  id?: number;
  name: string;
  badge_text: string;
  hours_text: string;
  open_time?: string;
  close_time?: string;
  timezone?: string;
  address: string;
  phone_number: string;
  google_maps_url: string;
  directions_button_text: string;
  is_active?: boolean;
  is_open?: boolean;
  weekly_off_day?: string;
  weekly_off_open_time?: string;
  weekly_off_close_time?: string;
  weekly_off_hours_text?: string;
}

export interface DynamicQRData {
  id: number;
  slug: string;
  title: string;
  target_type: string;
  destination_url: string;
  dynamic_redirect_url: string;
  fg_color: string;
  bg_color: string;
  include_logo: boolean;
  scan_count: number;
}

export interface HubLandingResponse {
  success: boolean;
  store: StoreInfo | null;
  channels: SocialHandle[];
  active_qr: DynamicQRData | null;
  profile: {
    name: string;
    tagline: string;
    monogram: string;
    verified: boolean;
    logo_url: string;
  };
}

