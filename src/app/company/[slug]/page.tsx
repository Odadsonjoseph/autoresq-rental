import Link from 'next/link';

export default function CompanyPage() {
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
            <Link href="#contact">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="hero-compact">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-label">Premium Vehicle Rental</span>
            <h1>Your Trusted<br/><span>Car Provider</span></h1>
            <p>Premium vehicles, transparent pricing, exceptional service. Book your next ride today.</p>
            <Link href="#fleet" className="btn">View Fleet</Link>
          </div>
        </div>
      </section>

      <section className="section" id="fleet">
        <div className="section-header">
          <span className="section-label">Our Fleet</span>
          <h2 className="section-title">Available Vehicles</h2>
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
              <p className="fleet-price">$289/day</p>
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
              <p className="fleet-price">$259/day</p>
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
              <p className="fleet-price">$279/day</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-cta">
        <div className="cta-content">
          <h2>Ready to Drive?</h2>
          <p>Contact us to reserve your vehicle today.</p>
          <Link href="#contact" className="btn">Get In Touch</Link>
        </div>
      </section>

      <footer id="contact">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">AutoresQ <span>Rental</span></div>
            <p>Premium Car Rental Services</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>2026 AutoresQ Rental. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
