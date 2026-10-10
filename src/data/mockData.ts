export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface ProductVariant {
  color: string;
  id: string;
  is_main?: boolean;
  image?: string;
  images?: string[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  image: string;
  images: string[];
  category: string;
  description: string;
  variants?: ProductVariant[];
  createdAt?: string;
  isNewArrival?: boolean;
}

export interface Consultation {
  id: string;
  service: string;
  status: 'Confirmed' | 'Completed' | 'Pending' | 'Rescheduled' | 'Cancelled';
  date: string;
  time_slot: string;
  topic: string;
  full_name: string;
  mobile: string;
  email: string;
  notes?: string;
  createdAt?: string;
}
