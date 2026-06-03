'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User } from '@/lib/supabase';

interface RoadsideRequest {
  id: string;
  user_id: string;
  rental_id: string;
  location: string;
  description: string;
  status: 'pending' | 'dispatched' | 'completed' | 'cancelled';
  created_at: string;
  vehicle_info?: string;
}

export default function RoadsidePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<RoadsideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rental_id: '',
    location: '',
    description: '',
    vehicle_info: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserAndRequests();
  }, []);

  const loadUserAndRequests = async () => {
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
        loadRequests(userData.id);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async (userId: string) => {
    const { data } = await supabase
      .from('roadside_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setRequests(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: authUser } = await supabase.auth.getUser();
      const userEmail = authUser?.user?.email;
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();

      const { error } = await supabase
        .from('roadside_requests')
        .insert({
          user_id: userData.id,
          rental_id: formData.rental_id || null,
          location: formData.location,
          description: formData.description,
          vehicle_info: formData.vehicle_info,
          status: 'pending'
        });

      if (error) throw error;

      setShowForm(false);
      setFormData({ rental_id: '', location: '', description: '', vehicle_info: '' });
      loadRequests(userData.id);
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'dispatched': return '#17a2b8';
      case 'completed': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <main className="roadside-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="roadside-page">
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

      <div className="roadside-content">
        <div className="page-header">
          <div>
            <h1>Roadside Assistance</h1>
            <p>Get help when you need it - 24/7 dispatch to Auto Rescue</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            {showForm ? 'Cancel' : 'Request Assistance'}
          </button>
        </div>

        {showForm && (
          <div className="assistance-form">
            <h2>Request Roadside Assistance</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Location / Address</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Where are you located?"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rental ID (optional)</label>
                  <input
                    type="text"
                    value={formData.rental_id}
                    onChange={(e) => setFormData({ ...formData, rental_id: e.target.value })}
                    placeholder="Rental reference"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Vehicle Information</label>
                <input
                  type="text"
                  value={formData.vehicle_info}
                  onChange={(e) => setFormData({ ...formData, vehicle_info: e.target.value })}
                  placeholder="Make, model, color, license plate"
                />
              </div>

              <div className="form-group">
                <label>Issue Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue - flat tire, lockout, jump start, etc."
                  rows={4}
                  required
                />
              </div>

              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        <div className="requests-list">
          <h2>Your Requests</h2>
          {requests.length === 0 ? (
            <div className="empty-state">
              <p>No roadside assistance requests</p>
              <p className="sub">Click "Request Assistance" if you need help</p>
            </div>
          ) : (
            <div className="requests-grid">
              {requests.map(request => (
                <div key={request.id} className="request-card">
                  <div className="request-header">
                    <span className="request-id">#{request.id.slice(0, 8)}</span>
                    <span
                      className="request-status"
                      style={{ background: `${getStatusColor(request.status)}20`, color: getStatusColor(request.status) }}
                    >
                      {request.status}
                    </span>
                  </div>
                  <div className="request-details">
                    <p><strong>Location:</strong> {request.location}</p>
                    {request.vehicle_info && <p><strong>Vehicle:</strong> {request.vehicle_info}</p>}
                    <p><strong>Issue:</strong> {request.description}</p>
                    <p className="request-date">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="emergency-info">
          <h3>Emergency Contacts</h3>
          <div className="emergency-grid">
            <div className="emergency-card">
              <h4>🚗 Roadside Assistance</h4>
              <p className="phone">1-800-AUTO-RESQ</p>
              <p>24/7 Dispatch Available</p>
            </div>
            <div className="emergency-card">
              <h4>🆘 Emergency Services</h4>
              <p className="phone">911</p>
              <p>For life-threatening emergencies</p>
            </div>
            <div className="emergency-card">
              <h4>📞 Customer Support</h4>
              <p className="phone">1-800-AUTORESQ</p>
              <p>Non-emergency support</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
