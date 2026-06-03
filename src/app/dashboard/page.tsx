'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User, type Company, type VehicleListing, type Rental } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [listings, setListings] = useState<VehicleListing[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      // Fetch user data
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (userData) {
        setUser(userData);

        // Fetch company if user is company/broker
        if (userData.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', userData.company_id)
            .single();
          setCompany(companyData);

          // Fetch listings
          const { data: listingsData } = await supabase
            .from('vehicle_listings')
            .select('*')
            .eq('company_id', userData.company_id);
          setListings(listingsData || []);
        }

        // Fetch rentals
        const { data: rentalsData } = await supabase
          .from('rentals')
          .select('*')
          .eq('customer_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(10);
        setRentals(rentalsData || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  const isCompany = user?.role === 'company' || user?.role === 'broker';

  return (
    <main className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">AutoresQ</Link>
          <div className="nav-links">
            <Link href="/dashboard">Dashboard</Link>
            {isCompany && <Link href="/dashboard/fleet">Fleet</Link>}
            <Link href="/dashboard/rentals">Rentals</Link>
            {isCompany && <Link href="/dashboard/claims">Claims</Link>}
            {isCompany && <Link href="/dashboard/community">Community</Link>}
          </div>
          <div className="nav-user">
            <span>{user?.first_name} {user?.last_name}</span>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.first_name}</h1>
          <p>Manage your rentals and fleet from one place</p>
        </div>

        {isCompany && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3>{company?.name || 'Your Company'}</h3>
                <p>{listings.length} vehicles listed</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3>{rentals.length}</h3>
                <p>Active Rentals</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <div className="stat-info">
                <h3>{company?.verified ? 'Verified' : 'Pending'}</h3>
                <p>Company Status</p>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-sections">
          {!isCompany && (
            <section className="dashboard-section">
              <h2>Your Rentals</h2>
              {rentals.length === 0 ? (
                <div className="empty-state">
                  <p>No rentals yet</p>
                  <Link href="/" className="btn">Browse Fleet</Link>
                </div>
              ) : (
                <div className="rentals-list">
                  {rentals.map((rental) => (
                    <div key={rental.id} className="rental-card">
                      <div className="rental-info">
                        <h3>Rental #{rental.id.slice(0, 8)}</h3>
                        <p>Status: <span className={`status ${rental.status}`}>{rental.status}</span></p>
                        <p>Dates: {rental.start_date} - {rental.end_date}</p>
                      </div>
                      <div className="rental-amount">
                        ${rental.total_amount}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {isCompany && (
            <>
              <section className="dashboard-section">
                <div className="section-header-row">
                  <h2>Your Fleet</h2>
                  <Link href="/dashboard/fleet/new" className="btn">Add Vehicle</Link>
                </div>
                {listings.length === 0 ? (
                  <div className="empty-state">
                    <p>No vehicles in your fleet yet</p>
                    <Link href="/dashboard/fleet/new" className="btn">Add First Vehicle</Link>
                  </div>
                ) : (
                  <div className="fleet-grid">
                    {listings.map((listing) => (
                      <div key={listing.id} className="fleet-card">
                        <div className="fleet-image">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt={`${listing.make} ${listing.model}`} />
                          ) : (
                            <div className="no-image">No Image</div>
                          )}
                        </div>
                        <div className="fleet-info">
                          <h3>{listing.year} {listing.make} {listing.model}</h3>
                          <p className="fleet-price">${listing.retail_price}/day</p>
                          <span className={`status-badge ${listing.status}`}>{listing.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="dashboard-section">
                <h2>Recent Activity</h2>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-dot"></div>
                    <p>System ready for bookings</p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
