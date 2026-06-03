'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User, type Claim } from '@/lib/supabase';

interface ClaimWithDetails extends Claim {
  rental?: {
    start_date: string;
    end_date: string;
    total_amount: number;
    listing?: {
      make: string;
      model: string;
      year: number;
    };
  };
}

export default function ClaimsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<ClaimWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [formData, setFormData] = useState({
    rental_id: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
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
          .from('claims')
          .select('*')
          .order('created_at', { ascending: false });

        if (isCompanyUser && userData.company_id) {
          query = query.eq('company_id', userData.company_id);
        }

        const { data: claimsData } = await query;

        if (claimsData && claimsData.length > 0) {
          const rentalIds = [...new Set(claimsData.map(c => c.rental_id))];
          const { data: rentalsData } = await supabase
            .from('rentals')
            .select('id, start_date, end_date, total_amount, listing_id')
            .in('id', rentalIds);

          const rentalMap = new Map(rentalsData?.map(r => [r.id, r]));
          const listingIds = [...new Set(rentalsData?.map(r => r.listing_id).filter(Boolean) || [])];

          let listingsMap = new Map();
          if (listingIds.length > 0) {
            const { data: listingsData } = await supabase
              .from('vehicle_listings')
              .select('id, make, model, year')
              .in('id', listingIds);
            listingsMap = new Map(listingsData?.map(l => [l.id, l]));
          }

          const enrichedClaims = claimsData.map(c => ({
            ...c,
            rental: rentalMap.get(c.rental_id) ? {
              ...rentalMap.get(c.rental_id)!,
              listing: listingsMap.get(rentalMap.get(c.rental_id)?.listing_id)
            } : undefined
          }));
          setClaims(enrichedClaims);
        }
      }
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('company_id, id')
        .eq('email', authUser.email)
        .single();

      const companyId = userData?.role === 'company' || userData?.role === 'broker'
        ? userData.company_id
        : null;

      const { error: insertError } = await supabase
        .from('claims')
        .insert({
          rental_id: formData.rental_id,
          company_id: companyId,
          description: formData.description,
          status: 'filed'
        });

      if (insertError) throw insertError;
      setShowNewClaim(false);
      setFormData({ rental_id: '', description: '' });
      loadClaims();
    } catch (error: any) {
      console.error('Error submitting claim:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      filed: '#6c757d',
      under_review: '#ffc107',
      approved: '#28a745',
      denied: '#dc3545',
      resolved: '#17a2b8'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading claims...</p>
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
            <Link href="/dashboard/rentals">Rentals</Link>
            {isCompany && <Link href="/dashboard/claims" className="active">Claims</Link>}
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
        <div className="page-header">
          <div className="header-left">
            <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>
            <h1>Claims</h1>
            <p>{isCompany ? 'Manage insurance claims' : 'File and track claims'}</p>
          </div>
          {!isCompany && (
            <button className="btn" onClick={() => setShowNewClaim(!showNewClaim)}>
              {showNewClaim ? 'Cancel' : '+ File Claim'}
            </button>
          )}
        </div>

        {showNewClaim && (
          <div className="form-container" style={{ marginBottom: '2rem' }}>
            <form onSubmit={handleSubmitClaim} className="fleet-form">
              <div className="form-section">
                <h3>File New Claim</h3>
                <div className="form-row">
                  <div className="input-group">
                    <label>Rental ID *</label>
                    <input
                      type="text"
                      value={formData.rental_id}
                      onChange={(e) => setFormData({...formData, rental_id: e.target.value})}
                      placeholder="Enter rental ID"
                      required
                    />
                  </div>
                </div>
                <div className="input-group" style={{ marginTop: '1rem' }}>
                  <label>Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe the incident..."
                    rows={4}
                    required
                    style={{
                      background: 'var(--cream)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: '4px',
                      padding: '0.875rem 1rem',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowNewClaim(false)}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        )}

        {claims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No claims</h3>
            <p>{isCompany ? 'No claims filed yet' : 'No claims on your rentals'}</p>
          </div>
        ) : (
          <div className="claims-list">
            {claims.map((claim) => (
              <div key={claim.id} className="claim-card">
                <div className="claim-header">
                  <div className="claim-id">Claim #{claim.id.slice(0, 8)}</div>
                  <span
                    className="status-badge"
                    style={{ background: `${getStatusColor(claim.status)}15`, color: getStatusColor(claim.status) }}
                  >
                    {claim.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="claim-body">
                  <div className="claim-detail">
                    <span className="label">Rental</span>
                    <span className="value">
                      {claim.rental?.listing?.year} {claim.rental?.listing?.make} {claim.rental?.listing?.model}
                    </span>
                  </div>
                  <div className="claim-detail">
                    <span className="label">Dates</span>
                    <span className="value">{claim.rental?.start_date} - {claim.rental?.end_date}</span>
                  </div>
                  <div className="claim-detail">
                    <span className="label">Amount</span>
                    <span className="value">${claim.rental?.total_amount}</span>
                  </div>
                  {claim.description && (
                    <div className="claim-description">
                      <span className="label">Description</span>
                      <p>{claim.description}</p>
                    </div>
                  )}
                </div>
                <div className="claim-footer">
                  <span className="claim-date">Filed on {new Date(claim.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
