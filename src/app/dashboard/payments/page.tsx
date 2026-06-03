'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User } from '@/lib/supabase';

interface Payment {
  id: string;
  rental_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  method: string;
  created_at: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    rental_id: '',
    amount: '',
    method: 'card'
  });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUserAndPayments();
  }, []);

  const loadUserAndPayments = async () => {
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

        // Load payments - for now from payments table
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false });

        setPayments(paymentsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // In production, integrate with Stripe/PayPal
      // For now, simulate payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      alert('Payment processed successfully! (Demo mode)');
      setShowPaymentForm(false);
      setPaymentData({ rental_id: '', amount: '', method: 'card' });
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'pending': return '#ffc107';
      case 'processing': return '#17a2b8';
      case 'failed': return '#dc3545';
      case 'refunded': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <main className="payments-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="payments-page">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">AutoresQ <span>Rental</span></Link>
          <div className="nav-links">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/rentals">Rentals</Link>
            <Link href="/dashboard/contracts">Contracts</Link>
          </div>
          <div className="nav-user">
            <span>{user?.first_name} {user?.last_name}</span>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="payments-content">
        <div className="page-header">
          <div>
            <h1>Payment Center</h1>
            <p>Manage payments and billing</p>
          </div>
          <button onClick={() => setShowPaymentForm(!showPaymentForm)} className="btn btn-primary">
            {showPaymentForm ? 'Cancel' : 'Make Payment'}
          </button>
        </div>

        {showPaymentForm && (
          <div className="payment-form-panel">
            <h2>Make a Payment</h2>
            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                >
                  <option value="card">Credit/Debit Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              <div className="payment-summary">
                <p>Payment Amount: <strong>${paymentData.amount || '0.00'}</strong></p>
                <p className="fee-note">Processing fees may apply</p>
              </div>
              <button type="submit" disabled={processing} className="btn btn-primary btn-pay">
                {processing ? 'Processing...' : 'Pay Now'}
              </button>
            </form>
          </div>
        )}

        <div className="payment-methods">
          <h2>Payment Methods</h2>
          <div className="methods-grid">
            <div className="method-card active">
              <div className="card-icon">💳</div>
              <div className="card-info">
                <h4>Visa ending in 4242</h4>
                <p>Expires 12/2027</p>
              </div>
              <span className="default-badge">Default</span>
            </div>
            <button className="method-card add-new">
              <span>+</span>
              <p>Add Payment Method</p>
            </button>
          </div>
        </div>

        <div className="payment-history">
          <h2>Payment History</h2>
          {payments.length === 0 ? (
            <div className="empty-state">
              <p>No payment history</p>
              <p className="sub">Your payments will appear here</p>
            </div>
          ) : (
            <div className="payments-table">
              <div className="table-header">
                <div className="col-date">Date</div>
                <div className="col-amount">Amount</div>
                <div className="col-method">Method</div>
                <div className="col-status">Status</div>
              </div>
              {payments.map(payment => (
                <div key={payment.id} className="table-row">
                  <div className="col-date">{new Date(payment.created_at).toLocaleDateString()}</div>
                  <div className="col-amount">${payment.amount}</div>
                  <div className="col-method">{payment.method}</div>
                  <div className="col-status">
                    <span
                      className="status-badge"
                      style={{ background: `${getStatusColor(payment.status)}20`, color: getStatusColor(payment.status) }}
                    >
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
