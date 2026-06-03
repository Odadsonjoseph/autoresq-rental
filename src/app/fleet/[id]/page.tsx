'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User } from '@/lib/supabase';

interface VehicleListing {
  id: string;
  company_id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  images: string[];
  retail_price: number;
  broker_price: number | null;
  status: string;
  company?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string;
    phone: string;
    email: string;
  };
}

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [listing, setListing] = useState<VehicleListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({ startDate: '', endDate: '' });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'passed' | 'failed'>('pending');

  useEffect(() => {
    loadListing();
    checkUser();
  }, [vehicleId]);

  const checkUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();
      if (data) {
        setUser(data);
        setVerificationStatus(data.id_verification || 'pending');
      }
    }
  };

  const loadListing = async () => {
    try {
      const { data: vehicle } = await supabase
        .from('vehicle_listings')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (vehicle) {
        const { data: company } = await supabase
          .from('companies')
          .select('*')
          .eq('id', vehicle.company_id)
          .single();

        setListing({ ...vehicle, company });
      }
    } catch (error) {
      console.error('Error loading listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = () => {
    return listing?.broker_price || listing?.retail_price || 0;
  };

  const calculateTotal = () => {
    if (!booking.startDate || !booking.endDate) return 0;
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days * getPrice() : 0;
  };

  const handleBooking = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (verificationStatus !== 'passed') {
      setMessage('Please complete verification before booking');
      router.push('/dashboard/verification');
      return;
    }

    if (!booking.startDate || !booking.endDate) {
      setMessage('Please select rental dates');
      return;
    }

    setBookingLoading(true);
    setMessage('');

    try {
      const total = calculateTotal();
      const { data, error } = await supabase
        .from('rentals')
        .insert({
          listing_id: listing!.id,
          customer_id: user.id,
          company_id: listing!.company_id,
          start_date: booking.startDate,
          end_date: booking.endDate,
          total_amount: total,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      router.push('/dashboard/rentals?booking=success');
    } catch (error: any) {
      console.error('Booking error:', error);
      setMessage(error.message || 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="vehicle-detail-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="vehicle-detail-page">
        <div className="not-found">
          <h2>Vehicle not found</h2>
          <Link href="/fleet">Back to Fleet</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="vehicle-detail-page">
      <nav className="detail-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">AutoresQ <span>Rental</span></Link>
          <div className="nav-links">
            <Link href="/fleet">Fleet</Link>
            {user && <Link href="/dashboard">Dashboard</Link>}
          </div>
        </div>
      </nav>

      <div className="vehicle-detail-content">
        <div className="vehicle-main">
          <div className="vehicle-gallery">
            {listing.images?.length ? (
              listing.images.map((img, i) => (
                <img key={i} src={img} alt={`${listing.make} ${listing.model}`} />
              ))
            ) : (
              <div className="no-image-large">🚗</div>
            )}
          </div>

          <div className="vehicle-details">
            <div className="company-badge">
              {listing.company?.logo_url && (
                <img src={listing.company.logo_url} alt={listing.company.name} />
              )}
              <span>{listing.company?.name}</span>
            </div>

            <h1>{listing.year} {listing.make} {listing.model}</h1>
            <p className="vehicle Color">{listing.color}</p>

            <div className="specs">
              <div className="spec-item">
                <span className="label">Daily Rate</span>
                <span className="value">${getPrice()}</span>
              </div>
              <div className="spec-item">
                <span className="label">Status</span>
                <span className="value status-active">{listing.status}</span>
              </div>
            </div>

            <div className="company-contact">
              <h3>Contact Provider</h3>
              {listing.company && (
                <div className="contact-info">
                  <p>📞 {listing.company.phone || 'Call for availability'}</p>
                  <p>✉️ {listing.company.email || 'Email for inquiry'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="booking-panel">
          <h2>Book This Vehicle</h2>
          <div className="price-display">
            <span className="amount">${getPrice()}</span>
            <span className="period">/day</span>
          </div>

          <div className="booking-form">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={booking.startDate}
                onChange={(e) => setBooking({ ...booking, startDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={booking.endDate}
                onChange={(e) => setBooking({ ...booking, endDate: e.target.value })}
                min={booking.startDate || new Date().toISOString().split('T')[0]}
              />
            </div>

            {booking.startDate && booking.endDate && (
              <div className="booking-summary">
                <div className="summary-row">
                  <span>${getPrice()} x {Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days</span>
                  <span>${calculateTotal()}</span>
                </div>
                <div className="summary-total">
                  <span>Total</span>
                  <span>${calculateTotal()}</span>
                </div>
              </div>
            )}

            {message && <div className="message">{message}</div>}

            <button
              className="btn-book"
              onClick={handleBooking}
              disabled={bookingLoading}
            >
              {bookingLoading ? 'Processing...' : user ? 'Book Now' : 'Login to Book'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
