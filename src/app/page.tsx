'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// Scroll-driven image sequence component
function ScrollImageSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const totalFrames = 60;

  // Generate frame URLs - using car images from unsplash
  const getFrameUrl = (frame: number) => {
    const carImages = [
      'https://images.unsplash.com/photo-1544636331-e26879e4e7aa?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&h=1080&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1920&h=1080&fit=crop',
    ];
    // Cycle through images based on frame position
    const imageIndex = Math.floor((frame / totalFrames) * carImages.length);
    return carImages[Math.min(imageIndex, carImages.length - 1)];
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate scroll progress through the container
      const startScroll = -rect.top;
      const scrollRange = rect.height - windowHeight;
      const progress = Math.max(0, Math.min(1, startScroll / scrollRange));

      const frame = Math.floor(progress * (totalFrames - 1));
      setCurrentFrame(frame);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={containerRef} className="scroll-sequence-container">
      <div className="scroll-sequence-frame">
        <img
          src={getFrameUrl(currentFrame)}
          alt={`Frame ${currentFrame + 1}`}
          className="scroll-sequence-image"
        />
        <div className="scroll-sequence-overlay"></div>
      </div>
      <div className="scroll-progress-bar">
        <div
          className="scroll-progress-fill"
          style={{ width: `${((currentFrame + 1) / totalFrames) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <header>
        <div className="header-container">
          <Link href="/" className="logo">
            AutoresQ <span>Rental</span>
          </Link>
          <nav>
            <Link href="#fleet">Fleet</Link>
            <Link href="#services">Services</Link>
            <Link href="#locations">Locations</Link>
            <Link href="#contact">Contact</Link>
            <Link href="/auth/login">Login</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-label">Premium Vehicle Rental</span>
            <h1>Drive Your<br/><span>Dream Car</span></h1>
            <p>Access exclusive fleets through our curated network of premium rental providers. Seamless booking, transparent pricing, white-label experience.</p>
            <Link href="#fleet" className="btn">Explore Fleet</Link>
          </div>
        </div>
      </section>

      {/* Scroll-driven image sequence */}
      <ScrollImageSequence />

      <section className="section" id="fleet">
        <div className="section-header">
          <span className="section-label">Premium Fleet</span>
          <h2 className="section-title">Curated Vehicles</h2>
        </div>
        <div className="fleet-showcase">
          <div className="fleet-item">
            <div className="fleet-img">
              <img src="https://images.unsplash.com/photo-1544636331-e26879e4e7aa?w=800&h=500&fit=crop" alt="Mercedes S-Class"/>
            </div>
            <div className="fleet-details">
              <span className="fleet-category">Executive</span>
              <h3>Mercedes-Benz S-Class</h3>
              <p className="fleet-specs">2024 | Automatic | 5 Seats</p>
              <p className="fleet-price">From $289/day</p>
            </div>
          </div>
          <div className="fleet-item">
            <div className="fleet-img">
              <img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&h=500&fit=crop" alt="Audi A8"/>
            </div>
            <div className="fleet-details">
              <span className="fleet-category">Luxury</span>
              <h3>Audi A8 L</h3>
              <p className="fleet-specs">2024 | Automatic | Quattro AWD</p>
              <p className="fleet-price">From $259/day</p>
            </div>
          </div>
          <div className="fleet-item">
            <div className="fleet-img">
              <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=500&fit=crop" alt="BMW 7 Series"/>
            </div>
            <div className="fleet-details">
              <span className="fleet-category">Premium</span>
              <h3>BMW 740i</h3>
              <p className="fleet-specs">2024 | Automatic | Leather Interior</p>
              <p className="fleet-price">From $279/day</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="services" style={{background: '#fff'}}>
        <div className="section-header">
          <span className="section-label">Platform Services</span>
          <h2 className="section-title">End-to-End Solution</h2>
        </div>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-num">01</div>
            <h3>White-Label Profiles</h3>
            <p>Every rental company gets a branded landing page with custom URL. Your customers never see the platform - it appears to be your own website.</p>
          </div>
          <div className="service-card">
            <div className="service-num">02</div>
            <h3>Verification System</h3>
            <p>Automated ID, license, and insurance verification with AI-powered document scanning and insurance provider API calls.</p>
          </div>
          <div className="service-card">
            <div className="service-num">03</div>
            <h3>Digital Contracts</h3>
            <p>Electronic signing, automatic document storage, and complete rental file management with photo evidence.</p>
          </div>
          <div className="service-card">
            <div className="service-num">04</div>
            <h3>Claims Management</h3>
            <p>Streamlined damage claims with Auto Rescue CRM integration, photo documentation, and automated processing.</p>
          </div>
          <div className="service-card">
            <div className="service-num">05</div>
            <h3>Roadside Assistance</h3>
            <p>One-click dispatch to Auto Rescue with pre-loaded rental data, GPS location sharing, and real-time ETA tracking.</p>
          </div>
          <div className="service-card">
            <div className="service-num">06</div>
            <h3>B2B Marketplace</h3>
            <p>Private community for companies to share inventory, post in groups, and do cross-company business securely.</p>
          </div>
        </div>
      </section>

      <section className="section-cta">
        <div className="cta-content">
          <h2>Launch Your Rental Business</h2>
          <p>Join the network of premium rental providers. Get your white-label platform in minutes.</p>
          <Link href="#contact" className="btn">Get Started</Link>
        </div>
      </section>

      <footer id="contact">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">AutoresQ <span>Rental</span></div>
            <p>Premium Car Rental Platform</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Platform</h4>
              <a href="#">Fleet Management</a>
              <a href="#">Verification</a>
              <a href="#">Contracts</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Contact</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>2026 AutoresQ Rental. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
