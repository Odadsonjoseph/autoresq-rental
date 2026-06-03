'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User, type VehicleListing } from '@/lib/supabase';

export default function FleetPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<VehicleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'reserved'>('all');

  useEffect(() => {
    loadFleet();
  }, []);

  const loadFleet = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (userData) {
        setUser(userData);

        if (userData.company_id) {
          const { data: listingsData } = await supabase
            .from('vehicle_listings')
            .select('*')
            .eq('company_id', userData.company_id)
            .order('created_at', { ascending: false });
          setListings(listingsData || []);
        }
      }
    } catch (error) {
      console.error('Error loading fleet:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(l =>
    filter === 'all' ? true : l.status === filter
  );

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading fleet...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">AutoresQ<span>Rental</span></Link>
          <div className="nav-links">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/fleet" className="active">Fleet</Link>
            <Link href="/dashboard/rentals">Rentals</Link>
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
        <div className="page-header">
          <div className="header-left">
            <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>
            <h1>Your Fleet</h1>
            <p>Manage your vehicle listings</p>
          </div>
          <Link href="/dashboard/fleet/new" className="btn">+ Add Vehicle</Link>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({listings.length})
          </button>
          <button
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({listings.filter(l => l.status === 'active').length})
          </button>
          <button
            className={`filter-tab ${filter === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilter('inactive')}
          >
            Inactive ({listings.filter(l => l.status === 'inactive').length})
          </button>
          <button
            className={`filter-tab ${filter === 'reserved' ? 'active' : ''}`}
            onClick={() => setFilter('reserved')}
          >
            Reserved ({listings.filter(l => l.status === 'reserved').length})
          </button>
        </div>

        {filteredListings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🚗</div>
            <h3>No vehicles found</h3>
            <p>Add your first vehicle to start renting</p>
            <Link href="/dashboard/fleet/new" className="btn">Add Vehicle</Link>
          </div>
        ) : (
          <div className="fleet-table">
            <div className="table-header">
              <div className="col-vehicle">Vehicle</div>
              <div className="col-price">Daily Rate</div>
              <div className="col-status">Status</div>
              <div className="col-actions">Actions</div>
            </div>
            {filteredListings.map((listing) => (
              <div key={listing.id} className="table-row">
                <div className="col-vehicle">
                  <div className="vehicle-thumb">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={`${listing.make} ${listing.model}`} />
                    ) : (
                      <div className="no-thumb">🚗</div>
                    )}
                  </div>
                  <div className="vehicle-info">
                    <h4>{listing.year} {listing.make} {listing.model}</h4>
                    <span>{listing.color || 'N/A'}</span>
                  </div>
                </div>
                <div className="col-price">
                  <span className="price">${listing.retail_price}</span>
                  <span className="per-day">/day</span>
                </div>
                <div className="col-status">
                  <span className={`status-badge ${listing.status}`}>{listing.status}</span>
                </div>
                <div className="col-actions">
                  <Link href={`/dashboard/fleet/${listing.id}`} className="action-btn view">View</Link>
                  <Link href={`/dashboard/fleet/${listing.id}/edit`} className="action-btn edit">Edit</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
