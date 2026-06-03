-- Storage and Contracts Setup for Supabase v2
-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('verifications', 'verifications', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Create policies for verifications bucket
CREATE POLICY "Anyone can view verifications" ON storage.objects
FOR SELECT USING (bucket_id = 'verifications');

CREATE POLICY "Anyone can upload verifications" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'verifications');

CREATE POLICY "Anyone can update verifications" ON storage.objects
FOR UPDATE USING (bucket_id = 'verifications');

CREATE POLICY "Anyone can delete verifications" ON storage.objects
FOR DELETE USING (bucket_id = 'verifications');

-- Contract status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status') THEN
    CREATE TYPE contract_status AS ENUM ('draft', 'pending', 'signed', 'expired');
  END IF;
END
$$;

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID REFERENCES rentals(id),
  renter_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status contract_status DEFAULT 'draft',
  signer_name TEXT,
  signer_email TEXT,
  signature_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  signed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contracts_renter ON contracts(renter_id);
CREATE INDEX IF NOT EXISTS idx_contracts_rental ON contracts(rental_id);
