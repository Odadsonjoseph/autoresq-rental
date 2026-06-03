'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User, type Rental } from '@/lib/supabase';

interface RentalWithDetails extends Rental {
  listing?: {
    make: string;
    model: string;
    year: number;
    images?: string[];
  };
  company?: {
    name: string;
  };
}

export default function RentalsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [rentals, setRentals] = useState<RentalWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
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

        const isCompanyUser = userData.role === 'company' || userData.role === 'broker';

        let query = supabase
          .from('rentals')
          .select('*')
          .order('created_at', { ascending: false });

        if (isCompanyUser && userData.company_id) {
          query = query.eq('company_id', userData.company_id);
        } else {
          query = query.eq('customer_id', userData.id);
        }

        const { data: rentalsData } = await query;

        if (rentalsData && rentalsData.length > 0) {
          const listingIds = [...new Set(rentalsData.map(r => r.listing_id))];
          const companyIds = [...new Set(rentalsData.map(r => r.company_id))];

          const [listingsRes, companiesRes] = await Promise.all([
            supabase.from('vehicle_listings').select('id, make, model, year, images').in('id', listingIds),
            supabase.from('companies').select('id, name').in('id', companyIds)
          ]);

          const listingsMap = new Map(listingsRes.data?.map(l => [l.id, l]));
          const companiesMap = new Map(companiesRes.data?.map(c => [c.id, c]));

          const enrichedRentals = rentalsData.map(r => ({
            ...r,
            listing: listingsMap.get(r.listing_id),
            company: companiesMap.get(r.company_id)
          }));
          setRentals(enrichedRentals);
        } else {
          setRentals([]);
        }
      }
    } catch (error) {
      console.error('Error loading rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRentals = rentals.filter(r =>
    filter === 'all' ? true :
    filter === 'completed' ? r.status === 'completed' || r.status === 'cancelled' :
    r.status === filter
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: '#ffc107',
      confirmed: '#28a745',
      active: '#17a2b8',
      completed: '#6c757d',
      cancelled: '#dc3545',
      disputed: '#6f42c1'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading rentals...</p>
        </div>
      </main>
    );
  }

  const isCompany = user?.role === 'company' || user?.role === 'broker';

  return (
    <main className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">AutoresQ<span>Rental</span></Link>
          <div className="nav-links">
            <Link href="/dashboard">Dashboard</Link>
            {isCompany && <Link href="/dashboard/fleet">Fleet</Link>}
            <Link href="/dashboard/rentals" className="active">Rentals</Link>
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
            <h1>Rentals</h1>
            <p>{isCompany ? 'Manage customer bookings' : 'Your rental history'}</p>
          </div>
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({rentals.length})
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({rentals.filter(r => r.status === 'pending').length})
          </button>
          <button
            className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({rentals.filter(r => r.status === 'active' || r.status === 'confirmed').length})
          </button>
          <button
            className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({rentals.filter(r => r.status === 'completed' || r.status === 'cancelled').length})
          </button>
        </div>

        {filteredRentals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No rentals found</h3>
            <p>{isCompany ? 'No bookings yet' : 'Start by browsing our fleet'}</p>
            {!isCompany && <Link href="/" className="btn">Browse Fleet</Link>}
          </div>
        ) : (
          <div className="rentals-table">
            <div className="table-header">
              <div className="col-id">Rental ID</div>
              <div className="col-vehicle">Vehicle</div>
              <div className="col-dates">Dates</div>
              <div className="col-amount">Amount</div>
              <div className="col-status">Status</div>
              <div className="col-actions">Actions</div>
            </div>
            {filteredRentals.map((rental) => (
              <div key={rental.id} className="table-row">
                <div className="col-id">
                  <span className="rental-id">#{rental.id.slice(0, 8)}</span>
                </div>
                <div className="col-vehicle">
                  <div className="vehicle-thumb">
                    {rental.listing?.images?.[0] ? (
                      <img src={rental.listing.images[0]} alt={`${rental.listing.make} ${rental.listing.model}`} />
                    ) : (
                      <div className="no-thumb">🚗</div>
                    )}
                  </div>
                  <div className="vehicle-info">
                    <h4>{rental.listing?.year} {rental.listing?.make} {rental.listing?.model}</h4>
                    {isCompany && <span>{rental.company?.name}</span>}
                  </div>
                </div>
                <div className="col-dates">
                  <div className="date-range">
                    <span className="date-label">Start</span>
                    <span className="date-value">{rental.start_date}</span>
                  </div>
                  <div className="date-range">
                    <span className="date-label">End</span>
                    <span className="date-value">{rental.end_date}</span>
                  </div>
                </div>
                <div className="col-amount">
                  <span className="amount">${rental.total_amount}</span>
                </div>
                <div className="col-status">
                  <span
                    className="status-badge"
                    style={{ background: `${getStatusColor(rental.status)}15`, color: getStatusColor(rental.status) }}
                  >
                    {rental.status}
                  </span>
                </div>
                <div className="col-actions">
                  <Link href={`/dashboard/rentals/${rental.id}`} className="action-btn view">View</Link>
                  {isCompany && rental.status === 'pending' && (
                    <button className="action-btn confirm">Confirm</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
