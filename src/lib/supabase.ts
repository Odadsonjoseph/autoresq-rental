import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://epjfkpzjekhzlqazfasu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Company {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  phone?: string;
  email?: string;
  address?: string;
  verified: boolean;
  verified_at?: string;
  is_broker: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'company' | 'broker' | 'customer' | 'admin';
  company_id?: string;
  id_verification: 'pending' | 'passed' | 'failed' | 'escalated';
  license_verification: 'pending' | 'passed' | 'failed' | 'escalated';
  insurance_verification: 'pending' | 'passed' | 'failed' | 'escalated';
  created_at: string;
  companies?: Company;
}

export interface VehicleListing {
  id: string;
  company_id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  images?: string[];
  retail_price: number;
  broker_price?: number;
  status: 'active' | 'inactive' | 'reserved' | 'maintenance';
  created_at: string;
  company?: Company;
}

export interface Rental {
  id: string;
  listing_id: string;
  customer_id: string;
  company_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'disputed';
  created_at: string;
  listing?: VehicleListing | { make: string; model: string; year: number; images?: string[] };
}

export interface Claim {
  id: string;
  rental_id?: string;
  company_id?: string;
  description?: string;
  status: 'filed' | 'under_review' | 'approved' | 'denied' | 'resolved';
  created_at: string;
  rental?: Rental;
}

export interface CommunityPost {
  id: string;
  company_id: string;
  content: string;
  images?: string[];
  created_at: string;
  company?: Company;
}
