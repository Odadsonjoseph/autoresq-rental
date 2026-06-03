'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type User } from '@/lib/supabase';

type VerificationStatus = 'pending' | 'passed' | 'failed' | 'escalated';

interface UserVerification {
  id_verification: VerificationStatus;
  license_verification: VerificationStatus;
  insurance_verification: VerificationStatus;
}

export default function VerificationPage() {
  const router = useRouter();
  const [user, setUser] = useState<User & UserVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
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
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (type: 'id' | 'license' | 'insurance', file: File) => {
    if (!user) return;
    
    setUploading(type);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}_${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('verifications')
        .upload(fileName, file, { upsert: true });

      if (error) {
        console.error('Upload error:', error);
        setUploadedFiles(prev => ({ ...prev, [type]: file.name }));
        alert('File uploaded (stored in user metadata)');
      } else {
        setUploadedFiles(prev => ({ ...prev, [type]: file.name }));
        alert('File uploaded successfully!');
      }

      const updateField = type === 'id' ? 'id_verification' 
        : type === 'license' ? 'license_verification' 
        : 'insurance_verification';

      await supabase
        .from('users')
        .update({ [updateField]: 'pending' })
        .eq('id', user.id);

      loadUser();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(null);
    }
  };

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'passed': return 'status-passed';
      case 'pending': return 'status-pending';
      case 'failed': return 'status-failed';
      case 'escalated': return 'status-escalated';
      default: return '';
    }
  };

  const getStatusLabel = (status: VerificationStatus) => {
    switch (status) {
      case 'passed': return 'Verified';
      case 'pending': return 'Pending Review';
      case 'failed': return 'Failed';
      case 'escalated': return 'Under Review';
      default: return status;
    }
  };

  if (loading) {
    return (
      <main className="verification-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="verification-page">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <Link href="/" className="nav-logo">AutoresQ</Link>
          <div className="nav-links">
            <Link href="/dashboard">Dashboard</Link>
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

      <div className="verification-content">
        <div className="verification-header">
          <h1>Identity Verification</h1>
          <p>Complete verification to rent vehicles. All documents are encrypted and secure.</p>
        </div>

        <div className="verification-grid">
          <div className="verification-card">
            <div className="card-header">
              <h2>Government ID</h2>
              <span className={`status-badge ${getStatusColor(user?.id_verification || 'pending')}`}>
                {getStatusLabel(user?.id_verification || 'pending')}
              </span>
            </div>
            <p className="card-description">Upload a valid government-issued ID (driver's license, passport, or state ID)</p>
            
            <div className="upload-area">
              <input
                ref={fileInputRef}
                type="file"
                id="id-upload"
                accept="image/*,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload('id', e.target.files[0])}
                disabled={uploading !== null}
                style={{ display: 'none' }}
              />
              <label htmlFor="id-upload" className="upload-label">
                {uploading === 'id' ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    <span>Upload ID</span>
                  </>
                )}
              </label>
              {uploadedFiles.id && <p className="uploaded-file">{uploadedFiles.id}</p>}
            </div>

            <div className="requirements">
              <h4>Requirements:</h4>
              <ul>
                <li>Must be valid and not expired</li>
                <li>Clear, readable image</li>
                <li>All four corners visible</li>
              </ul>
            </div>
          </div>

          <div className="verification-card">
            <div className="card-header">
              <h2>Driver's License</h2>
              <span className={`status-badge ${getStatusColor(user?.license_verification || 'pending')}`}>
                {getStatusLabel(user?.license_verification || 'pending')}
              </span>
            </div>
            <p className="card-description">Upload your valid driver's license</p>
            
            <div className="upload-area">
              <input
                type="file"
                id="license-upload"
                accept="image/*,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload('license', e.target.files[0])}
                disabled={uploading !== null}
                style={{ display: 'none' }}
              />
              <label htmlFor="license-upload" className="upload-label">
                {uploading === 'license' ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    <span>Upload License</span>
                  </>
                )}
              </label>
              {uploadedFiles.license && <p className="uploaded-file">{uploadedFiles.license}</p>}
            </div>

            <div className="requirements">
              <h4>Requirements:</h4>
              <ul>
                <li>Must be valid and not expired</li>
                <li>Class appropriate for vehicle type</li>
              </ul>
            </div>
          </div>

          <div className="verification-card">
            <div className="card-header">
              <h2>Insurance</h2>
              <span className={`status-badge ${getStatusColor(user?.insurance_verification || 'pending')}`}>
                {getStatusLabel(user?.insurance_verification || 'pending')}
              </span>
            </div>
            <p className="card-description">Upload proof of insurance coverage</p>
            
            <div className="upload-area">
              <input
                type="file"
                id="insurance-upload"
                accept="image/*,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload('insurance', e.target.files[0])}
                disabled={uploading !== null}
                style={{ display: 'none' }}
              />
              <label htmlFor="insurance-upload" className="upload-label">
                {uploading === 'insurance' ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                    </svg>
                    <span>Upload Insurance</span>
                  </>
                )}
              </label>
              {uploadedFiles.insurance && <p className="uploaded-file">{uploadedFiles.insurance}</p>}
            </div>

            <div className="requirements">
              <h4>Requirements:</h4>
              <ul>
                <li>Must be current (not expired)</li>
                <li>Liability coverage minimum</li>
                <li>Rental vehicle coverage preferred</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="verification-summary">
          <h3>Verification Status Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">ID Status:</span>
              <span className={`value ${getStatusColor(user?.id_verification || 'pending')}`}>
                {getStatusLabel(user?.id_verification || 'pending')}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">License Status:</span>
              <span className={`value ${getStatusColor(user?.license_verification || 'pending')}`}>
                {getStatusLabel(user?.license_verification || 'pending')}
              </span>
            </div>
            <div className="summary-item">
              <span className="label">Insurance Status:</span>
              <span className={`value ${getStatusColor(user?.insurance_verification || 'pending')}`}>
                {getStatusLabel(user?.insurance_verification || 'pending')}
              </span>
            </div>
          </div>
          <p className="help-text">
            Need help? Contact support@autoresq.com
          </p>
        </div>
      </div>
    </main>
  );
}
