'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push('/dashboard');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <Link href="/" className="auth-logo">
            AutoresQ <span>Rental</span>
          </Link>
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">
            Sign in to access your rental dashboard and manage your bookings
          </p>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <div className="auth-divider">or</div>
          <p className="auth-switch">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup">
              Create one
            </Link>
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">🔒</div>
              <div className="auth-feature-text">Secure Login</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🚗</div>
              <div className="auth-feature-text">Manage Fleet</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">📊</div>
              <div className="auth-feature-text">Real-time Analytics</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
