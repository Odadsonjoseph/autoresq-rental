'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalRentals: 0,
    activeRentals: 0,
    completedRentals: 0,
    totalSpent: 0
  });
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

      const { data: userData } = await supabase
        .from('users')
        .select('*, companies(*)')
        .eq('email', authUser.email)
        .single();

      if (userData) {
        setUser(userData);

        const isCompanyUser = userData.role === 'company' || userData.role === 'broker';

        // Load rental stats
        let rentalsQuery = supabase.from('rentals').select('*');
        if (isCompanyUser && userData.company_id) {
          rentalsQuery = rentalsQuery.eq('company_id', userData.company_id);
        } else {
          rentalsQuery = rentalsQuery.eq('customer_id', userData.id);
        }

        const { data: rentals } = await rentalsQuery;

        if (rentals) {
          const active = rentals.filter(r => r.status === 'active' || r.status === 'confirmed').length;
          const completed = rentals.filter(r => r.status === 'completed' || r.status === 'cancelled').length;
          const totalSpent = rentals.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);

          setStats({
            totalRentals: rentals.length,
            activeRentals: active,
            completedRentals: completed,
            totalSpent
          });
        }
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
          <p>Loading dashboard...</p>
        </div>
      </main>
    );
  }

  const isCompany = user?.role === 'company' || user?.role === 'broker';

  return (
    <main className="dashboard-page">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">AutoresQ <span>Rental</span></Link>
          <div className="nav-links">
            <Link href="/dashboard" className="active">Dashboard</Link>
            <Link href="/fleet">Browse Fleet</Link>
            <Link href="/dashboard/rentals">Rentals</Link>
            <Link href="/dashboard/verification">Verification</Link>
            <Link href="/dashboard/contracts">Contracts</Link>
            <Link href="/dashboard/roadside">Roadside</Link>
            <Link href="/dashboard/claims">Claims</Link>
            {isCompany && <Link href="/dashboard/fleet">Manage Fleet</Link>}
          </div>
          <div className="nav-user">
            <span>{user?.first_name} {user?.last_name}</span>
            <span className="user-role">{user?.role}</span>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <div>
            <h1>Welcome back, {user?.first_name}!</h1>
            <p>Here's what's happening with your rentals</p>
          </div>
          <Link href="/fleet" className="btn btn-primary">
            Browse Fleet
          </Link>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalRentals}</span>
              <span className="stat-label">Total Rentals</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚗</div>
            <div className="stat-info">
              <span className="stat-value">{stats.activeRentals}</span>
              <span className="stat-label">Active Rentals</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-value">{stats.completedRentals}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <span className="stat-value">${stats.totalSpent.toFixed(2)}</span>
              <span className="stat-label">Total {isCompany ? 'Revenue' : 'Spent'}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="section quick-actions">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              <Link href="/fleet" className="action-card">
                <span className="action-icon">🚗</span>
                <span className="action-text">Browse Vehicles</span>
              </Link>
              <Link href="/dashboard/verification" className="action-card">
                <span className="action-icon">🆔</span>
                <span className="action-text">Complete Verification</span>
              </Link>
              <Link href="/dashboard/contracts" className="action-card">
                <span className="action-icon">📝</span>
                <span className="action-text">View Contracts</span>
              </Link>
              <Link href="/dashboard/roadside" className="action-card">
                <span className="action-icon">🆘</span>
                <span className="action-text">Roadside Assistance</span>
              </Link>
              <Link href="/dashboard/claims" className="action-card">
                <span className="action-icon">🏷️</span>
                <span className="action-text">File a Claim</span>
              </Link>
              <Link href="/dashboard/rentals" className="action-card">
                <span className="action-icon">📊</span>
                <span className="action-text">Rental History</span>
              </Link>
              {isCompany && (
                <Link href="/dashboard/fleet/new" className="action-card">
                  <span className="action-icon">➕</span>
                  <span className="action-text">Add Vehicle</span>
                </Link>
              )}
            </div>
          </div>

          <div className="section verification-status">
            <h2>Verification Status</h2>
            <div className="verification-items">
              <div className={`verification-item ${user?.id_verification || 'pending'}`}>
                <span className="check-icon">{user?.id_verification === 'passed' ? '✓' : '○'}</span>
                <span>Government ID</span>
                <span className="status">{user?.id_verification || 'pending'}</span>
              </div>
              <div className={`verification-item ${user?.license_verification || 'pending'}`}>
                <span className="check-icon">{user?.license_verification === 'passed' ? '✓' : '○'}</span>
                <span>Driver's License</span>
                <span className="status">{user?.license_verification || 'pending'}</span>
              </div>
              <div className={`verification-item ${user?.insurance_verification || 'pending'}`}>
                <span className="check-icon">{user?.insurance_verification === 'passed' ? '✓' : '○'}</span>
                <span>Insurance</span>
                <span className="status">{user?.insurance_verification || 'pending'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-footer">
          <div className="footer-card company-info">
            {user?.companies && (
              <>
                <h3>{user.companies.name}</h3>
                <p>{user.companies.slug}.autoresq.com</p>
                <span className={`verified-badge ${user.companies.verified ? 'verified' : ''}`}>
                  {user.companies.verified ? '✓ Verified' : 'Pending Verification'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
