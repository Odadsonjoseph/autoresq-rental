-- AutoresQ Rental Database Schema
-- Premium Car Rental Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('company', 'broker', 'customer', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
    CREATE TYPE listing_status AS ENUM ('active', 'inactive', 'reserved', 'maintenance');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rental_status') THEN
    CREATE TYPE rental_status AS ENUM ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_status') THEN
    CREATE TYPE claim_status AS ENUM ('filed', 'under_review', 'approved', 'denied', 'resolved');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM ('pending', 'passed', 'failed', 'escalated');
  END IF;
END
$$;

-- COMPANIES
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#c9a227',
  phone TEXT,
  email TEXT,
  address TEXT,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  is_broker BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  company_id UUID REFERENCES companies(id),
  id_verification verification_status DEFAULT 'pending',
  license_verification verification_status DEFAULT 'pending',
  insurance_verification verification_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VEHICLE LISTINGS
CREATE TABLE IF NOT EXISTS vehicle_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  images TEXT[],
  retail_price DECIMAL(10,2) NOT NULL,
  broker_price DECIMAL(10,2),
  status listing_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RENTALS
CREATE TABLE IF NOT EXISTS rentals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES vehicle_listings(id),
  customer_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status rental_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CLAIMS
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID REFERENCES rentals(id),
  company_id UUID REFERENCES companies(id),
  description TEXT,
  status claim_status DEFAULT 'filed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMMUNITY POSTS
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id),
  content TEXT NOT NULL,
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_listings_company ON vehicle_listings(company_id);
CREATE INDEX IF NOT EXISTS idx_rentals_customer ON rentals(customer_id);
CREATE INDEX IF NOT EXISTS idx_rentals_company ON rentals(company_id);
