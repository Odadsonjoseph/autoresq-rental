'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
    name: string;
    slug: string;
    logo_url: string;
  };
}

export default function FleetPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<VehicleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  useEffect(() => {
    loadListings();
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();
      if (data) setUser(data);
    }
  };

  const loadListings = async () => {
    try {
      let query = supabase
        .from('vehicle_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const { data: vehicles } = await query;

      if (vehicles && vehicles.length > 0) {
        const companyIds = [...new Set(vehicles.map(v => v.company_id))];
        const { data: companies } = await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds);

        const companyMap = new Map(companies?.map(c => [c.id, c]) || []);
        const enriched = vehicles.map(v => ({
          ...v,
          company: companyMap.get(v.company_id)
        }));
        setListings(enriched);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter(l => {
    const matchesSearch = !filter ||
      `${l.make} ${l.model}`.toLowerCase().includes(filter.toLowerCase());
    const matchesCompany = selectedCompany === 'all' || l.company_id === selectedCompany;
    return matchesSearch && matchesCompany;
  });

  const companies = [...new Map(listings.map(l => [l.company_id, l.company])).values()];

  const getPrice = (listing: VehicleListing) => {
    return listing.broker_price || listing.retail_price;
  };

  if (loading) {
    return (
      <main className="fleet-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading fleet...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="fleet-page">
      <nav className="fleet-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">AutoresQ <span>Rental</span></Link>
          <div className="nav-links">
            <Link href="/fleet" className="active">Fleet</Link>
            <Link href="/#services">Services</Link>
            <Link href="/#contact">Contact</Link>
            {user ? (
              <>
                <Link href="/dashboard">Dashboard</Link>
                <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/auth/login">Login</Link>
            )}
          </div>
        </div>
      </nav>

      <div className="fleet-content">
        <div className="fleet-header">
          <h1>Premium Fleet</h1>
          <p>Select from our curated collection of premium vehicles</p>
        </div>

        <div className="fleet-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search make, model..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="company-filter">
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
            >
              <option value="all">All Companies</option>
              {companies.filter(Boolean).map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <div className="empty-state">
            <h3>No vehicles found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="fleet-grid">
            {filteredListings.map(listing => (
              <Link
                key={listing.id}
                href={`/fleet/${listing.id}`}
                className="vehicle-card"
              >
                <div className="vehicle-image">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt={`${listing.year} ${listing.make} ${listing.model}`} />
                  ) : (
                    <div className="no-image">🚗</div>
                  )}
                  <span className="vehicle-status">{listing.status}</span>
                </div>
                <div className="vehicle-info">
                  <div className="vehicle-company">
                    {listing.company?.logo_url && (
                      <img src={listing.company.logo_url} alt={listing.company.name} />
                    )}
                    <span>{listing.company?.name || 'AutoresQ'}</span>
                  </div>
                  <h3>{listing.year} {listing.make} {listing.model}</h3>
                  <p className="vehicle-color">{listing.color}</p>
                  <div className="vehicle-price">
                    <span className="price">${getPrice(listing)}</span>
                    <span className="per-day">/day</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
