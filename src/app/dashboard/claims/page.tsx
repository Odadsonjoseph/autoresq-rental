'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User } from '@/lib/supabase';

interface Claim {
  id: string;
  rental_id: string;
  company_id: string;
  description: string;
  status: 'filed' | 'under_review' | 'approved' | 'denied' | 'resolved';
  created_at: string;
  rental?: {
    listing: { make: string; model: string; year: number };
  };
}

interface Rental {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  listing?: { make: string; model: string; year: number };
}

export default function ClaimsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rental_id: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserAndData();
  }, []);

  const loadUserAndData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth/login');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser?.email)
        .single();

      if (userData) {
        setUser(userData);
        const isCompany = userData.role === 'company' || userData.role === 'broker';

        // Load claims
        let claimsQuery = supabase.from('claims').select('*');
        if (isCompany && userData.company_id) {
          claimsQuery = claimsQuery.eq('company_id', userData.company_id);
        } else {
          // For customers, would need rental join
        }
        const { data: claimsData } = await claimsQuery.order('created_at', { ascending: false });

        if (claimsData && claimsData.length > 0) {
          const rentalIds = [...new Set(claimsData.map(c => c.rental_id).filter(Boolean))];
          const { data: rentalsData } = await supabase
            .from('rentals')
            .select('id, listing_id, start_date, end_date, listing(make, model, year)')
            .in('id', rentalIds);

          const claimsWithRentals = claimsData.map(c => ({
            ...c,
            rental: rentalsData?.find(r => r.id === c.rental_id)
          }));
          setClaims(claimsWithRentals as any);
        } else {
          setClaims(claimsData || []);
        }

        // Load available rentals for form
        if (!isCompany) {
          const { data: rentalsData } = await supabase
            .from('rentals')
            .select('id, listing_id, start_date, end_date, listing(make, model, year)')
            .eq('customer_id', userData.id);
          setRentals(rentalsData as any);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: authUser } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('id, company_id')
        .eq('email', authUser?.email)
        .single();

      const rentalData = rentals.find(r => r.id === formData.rental_id);

      const { error } = await supabase
        .from('claims')
        .insert({
          rental_id: formData.rental_id || null,
          company_id: rentalData?.company_id || userData?.company_id,
          description: formData.description,
          status: 'filed'
        });

      if (error) throw error;

      setShowForm(false);
      setFormData({ rental_id: '', description: '' });
      loadUserAndData();
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Failed to file claim');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filed': return '#ffc107';
      case 'under_review': return '#17a2b8';
      case 'approved': return '#28a745';
      case 'denied': return '#dc3545';
      case 'resolved': return '#6c757d';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <main className="claims-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="claims-page">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">AutoresQ <span>Rental</span></Link>
          <div className="nav-links">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/rentals">Rentals</Link>
            <Link href="/dashboard/verification">Verification</Link>
          </div>
          <div className="nav-user">
            <span>{user?.first_name} {user?.last_name}</span>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="claims-content">
        <div className="page-header">
          <div>
            <h1>Claims Management</h1>
            <p>File and track damage claims with Auto Rescue CRM integration</p>
          </div>
          {user?.role === 'customer' && (
            <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
              {showForm ? 'Cancel' : 'File New Claim'}
            </button>
          )}
        </div>

        {showForm && (
          <div className="claim-form">
            <h2>File a Claim</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Rental</label>
                <select
                  value={formData.rental_id}
                  onChange={(e) => setFormData({ ...formData, rental_id: e.target.value })}
                  required
                >
                  <option value="">Select a rental...</option>
                  {rentals.map(rental => (
                    <option key={rental.id} value={rental.id}>
                      {rental.listing?.year} {rental.listing?.make} {rental.listing?.model} - {rental.start_date} to {rental.end_date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Describe the Incident</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the damage or incident in detail..."
                  rows={5}
                  required
                />
              </div>

              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </form>
          </div>
        )}

        <div className="claims-list">
          <h2>Your Claims</h2>
          {claims.length === 0 ? (
            <div className="empty-state">
              <p>No claims filed</p>
              <p className="sub">Claims will appear here once submitted</p>
            </div>
          ) : (
            <div className="claims-table">
              <div className="table-header">
                <div className="col-id">Claim ID</div>
                <div className="col-vehicle">Vehicle</div>
                <div className="col-description">Description</div>
                <div className="col-status">Status</div>
                <div className="col-date">Filed</div>
              </div>
              {claims.map(claim => (
                <div key={claim.id} className="table-row">
                  <div className="col-id">
                    <span className="claim-id">#{claim.id.slice(0, 8)}</span>
                  </div>
                  <div className="col-vehicle">
                    {claim.rental?.listing ? (
                      <span>{claim.rental.listing.year} {claim.rental.listing.make} {claim.rental.listing.model}</span>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                  <div className="col-description">
                    <p>{claim.description}</p>
                  </div>
                  <div className="col-status">
                    <span
                      className="status-badge"
                      style={{ background: `${getStatusColor(claim.status)}20`, color: getStatusColor(claim.status) }}
                    >
                      {claim.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="col-date">
                    {new Date(claim.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="crm-integration">
          <h3>Auto Rescue CRM Integration</h3>
          <p>Claims are automatically pushed to Auto Rescue for streamlined processing</p>
          <div className="integration-features">
            <div className="feature">
              <span className="icon">📸</span>
              <h4>Photo Documentation</h4>
              <p>Upload photos of damage directly</p>
            </div>
            <div className="feature">
              <span className="icon">🔄</span>
              <h4>Status Sync</h4>
              <p>Real-time status updates from CRM</p>
            </div>
            <div className="feature">
              <span className="icon">⚡</span>
              <h4>Fast Processing</h4>
              <p>Automated workflow speeds approval</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
