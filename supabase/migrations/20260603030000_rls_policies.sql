-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Companies: Public read, owner write
CREATE POLICY "Anyone can view companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Users can insert companies" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can update companies" ON companies FOR UPDATE USING (
  id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

-- Users: Read own profile, update own, admin can view all
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Anyone can view user basic info" ON users FOR SELECT USING (true);

-- Vehicle Listings: Public read active, owners full access
CREATE POLICY "Anyone can view active listings" ON vehicle_listings FOR SELECT USING (status = 'active' OR company_id IN (SELECT company_id FROM users WHERE id = auth.uid()));
CREATE POLICY "Company owners can manage fleet" ON vehicle_listings FOR ALL USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

-- Rentals: Customers see own, companies see theirs
CREATE POLICY "View own rentals" ON rentals FOR SELECT USING (
  customer_id = auth.uid() OR company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "Create rentals" ON rentals FOR INSERT WITH CHECK (true);
CREATE POLICY "Companies can manage company rentals" ON rentals FOR UPDATE USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

-- Claims: Company-only
CREATE POLICY "Companies can view claims" ON claims FOR SELECT USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "Companies can create claims" ON claims FOR INSERT WITH CHECK (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "Companies can update claims" ON claims FOR UPDATE USING (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);

-- Community Posts: Public read, members create
CREATE POLICY "Anyone can view community posts" ON community_posts FOR SELECT USING (true);
CREATE POLICY "Companies can post" ON community_posts FOR INSERT WITH CHECK (
  company_id IN (SELECT company_id FROM users WHERE id = auth.uid())
);
