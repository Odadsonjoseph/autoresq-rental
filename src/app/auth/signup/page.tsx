'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
          },
        },
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h1 style={{ marginBottom: '1rem' }}>Check Your Email</h1>
              <p className="auth-subtitle">
                We&apos;ve sent a confirmation link to <strong>{email}</strong>.
                Click the link to activate your account.
              </p>
              <Link href="/auth/login" className="btn-primary" style={{ display: 'inline-block', marginTop: '1.5rem' }}>
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <Link href="/" className="auth-logo">
            AutoresQ <span>Rental</span>
          </Link>
          <h1>Create Account</h1>
          <p className="auth-subtitle">
            Join the premier car rental platform and start managing your fleet today
          </p>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="form-group">
              <label>Company Name (Optional)</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company LLC"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 6 characters"
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Repeat your password"
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <div className="auth-divider">or</div>
          <p className="auth-switch">
            Already have an account?{' '}
            <Link href="/auth/login">
              Sign in
            </Link>
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">🌐</div>
              <div className="auth-feature-text">White-Label</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">📱</div>
              <div className="auth-feature-text">Mobile Ready</div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">⚡</div>
              <div className="auth-feature-text">Quick Setup</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
