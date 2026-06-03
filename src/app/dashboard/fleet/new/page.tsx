'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User } from '@/lib/supabase';

export default function NewFleetPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    retail_price: '',
    status: 'active'
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
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

      setUser(userData);
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('company_id')
        .eq('email', authUser.email)
        .single();

      if (!userData?.company_id) {
        throw new Error('No company associated with this account');
      }

      const { error: insertError } = await supabase
        .from('vehicle_listings')
        .insert({
          company_id: userData.company_id,
          make: formData.make,
          model: formData.model,
          year: parseInt(formData.year.toString()),
          color: formData.color || null,
          retail_price: parseFloat(formData.retail_price),
          status: formData.status
        });

      if (insertError) throw insertError;
      router.push('/dashboard/fleet');
    } catch (err: any) {
      setError(err.message || 'Failed to add vehicle');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
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
            <Link href="/dashboard/fleet" className="back-link">← Back to Fleet</Link>
            <h1>Add New Vehicle</h1>
            <p>List a new vehicle in your fleet</p>
          </div>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="fleet-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-section">
              <h3>Vehicle Details</h3>

              <div className="form-row">
                <div className="input-group">
                  <label>Make *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                    placeholder="e.g. BMW, Mercedes, Audi"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    placeholder="e.g. X5, S-Class, A4"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    min={2000}
                    max={2030}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    placeholder="e.g. Black, White, Silver"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Pricing & Availability</h3>

              <div className="form-row">
                <div className="input-group">
                  <label>Daily Rate ($) *</label>
                  <input
                    type="number"
                    value={formData.retail_price}
                    onChange={(e) => setFormData({...formData, retail_price: e.target.value})}
                    placeholder="e.g. 150"
                    min={0}
                    step={0.01}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <Link href="/dashboard/fleet" className="btn-cancel">Cancel</Link>
              <button type="submit" className="btn-submit" disabled={saving}>
                {saving ? 'Adding Vehicle...' : 'Add Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
