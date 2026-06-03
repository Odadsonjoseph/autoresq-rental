'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User } from '@/lib/supabase';

interface Contract {
  id: string;
  title: string;
  rental_id: string;
  status: 'draft' | 'pending签名' | 'signed' | 'expired';
  content: string;
  signer_name: string;
  signer_email: string;
  created_at: string;
  signed_at: string | null;
}

export default function ContractsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [signing, setSigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
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
        // Load contracts for this user
        const { data: contractsData } = await supabase
          .from('contracts')
          .select('*')
          .or(`signer_email.eq.${userData.email},renter_id.eq.${userData.id}`)
          .order('created_at', { ascending: false });
        setContracts(contractsData || []);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContract = async () => {
    // Create a sample contract
    const newContract = {
      title: `Rental Agreement - ${new Date().toLocaleDateString()}`,
      content: `RENTAL AGREEMENT

This Rental Agreement ("Agreement") is entered into between the Rental Company ("Owner") and the Customer ("Renter").

1. VEHICLE: The Owner agrees to rent the vehicle to the Renter subject to the terms and conditions herein.

2. TERM: This rental begins on the start date and ends on the end date as specified in the rental booking.

3. PAYMENT: The Renter agrees to pay the total amount specified in the booking.

4. INSURANCE: The Renter maintains insurance coverage as verified in their profile.

5. RESPONSIBILITIES: The Renter agrees to maintain the vehicle in good condition and return it on time.

6. SIGNATURES: By signing below, both parties agree to the terms of this Agreement.

Signatures:

Renter: _________________________  Date: ___________

Owner: __________________________  Date: ___________`,
      status: 'pending' as const,
      signer_name: user?.first_name + ' ' + user?.last_name,
      signer_email: user?.email || '',
    };

    const { data, error } = await supabase
      .from('contracts')
      .insert(newContract)
      .select()
      .single();

    if (data) {
      setContracts([data, ...contracts]);
      setSelectedContract(data);
    }
  };

  const initSignaturePad = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = canvas.offsetWidth;
    canvas.height = 150;
    
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as MouseEvent).clientX - rect.left;
      const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as MouseEvent).clientY - rect.top;
      lastX = x;
      lastY = y;
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as MouseEvent).clientX - rect.left;
      const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as MouseEvent).clientY - rect.top;
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastX = x;
      lastY = y;
    };

    const stopDrawing = () => {
      isDrawing = false;
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);
  };

  const signContract = async () => {
    if (!selectedContract || !canvasRef.current) return;
    
    setSigning(true);
    
    try {
      // Get signature as base64
      const signatureData = canvasRef.current.toDataURL('image/png');
      
      // Update contract status
      await supabase
        .from('contracts')
        .update({ 
          status: 'signed',
          signed_at: new Date().toISOString(),
          signature_data: signatureData
        })
        .eq('id', selectedContract.id);

      // Refresh contracts
      loadContracts();
      setSelectedContract(null);
      alert('Contract signed successfully!');
    } catch (error) {
      console.error('Error signing contract:', error);
      alert('Failed to sign contract');
    } finally {
      setSigning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'signed': return 'status-signed';
      case 'pending': return 'status-pending';
      case 'expired': return 'status-expired';
      default: return 'status-draft';
    }
  };

  if (loading) {
    return (
      <main className="contracts-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">AutoresQ</Link>
          <div className="nav-links">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/verification">Verification</Link>
            <Link href="/dashboard/rentals">Rentals</Link>
          </div>
          <div className="nav-user">
            <span>{user?.first_name} {user?.last_name}</span>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="contracts-content">
        <div className="page-header">
          <div>
            <h1>Digital Contracts</h1>
            <p>View and sign rental agreements</p>
          </div>
          <button onClick={generateContract} className="btn btn-primary">
            Generate New Contract
          </button>
        </div>

        <div className="contracts-list">
          {contracts.length === 0 ? (
            <div className="empty-state">
              <p>No contracts yet</p>
              <p className="sub">Generate a contract to get started</p>
            </div>
          ) : (
            contracts.map(contract => (
              <div key={contract.id} className="contract-card">
                <div className="contract-header">
                  <h3>{contract.title}</h3>
                  <span className={`status-badge ${getStatusBadge(contract.status)}`}>
                    {contract.status}
                  </span>
                </div>
                <div className="contract-meta">
                  <p>Created: {new Date(contract.created_at).toLocaleDateString()}</p>
                  {contract.signed_at && (
                    <p>Signed: {new Date(contract.signed_at).toLocaleDateString()}</p>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedContract(contract)}
                  className="btn btn-secondary"
                >
                  View & Sign
                </button>
              </div>
            ))
          )}
        </div>

        {selectedContract && (
          <div className="contract-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{selectedContract.title}</h2>
                <button onClick={() => setSelectedContract(null)} className="close-btn">×</button>
              </div>
              <div className="contract-body">
                <pre>{selectedContract.content}</pre>
              </div>
              {selectedContract.status !== 'signed' && (
                <div className="signature-section">
                  <h3>Sign Here</h3>
                  <canvas 
                    ref={canvasRef} 
                    className="signature-pad"
                    onClick={initSignaturePad}
                  ></canvas>
                  <button 
                    onClick={signContract}
                    disabled={signing}
                    className="btn btn-primary"
                  >
                    {signing ? 'Signing...' : 'Sign Contract'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
