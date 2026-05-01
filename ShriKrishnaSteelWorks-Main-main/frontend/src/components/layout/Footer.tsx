import { Link } from "react-router-dom";
import logoNew from "../../assets/SK-logo-new.jpg";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="skw-footer">

      {/* Top wave divider */}
      <div className="skw-footer-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,60 C360,0 1080,0 1440,60 L1440,0 L0,0 Z" fill="#4A90D9" opacity="0.08" />
          <path d="M0,60 C480,20 960,20 1440,60 L1440,0 L0,0 Z" fill="#4A90D9" opacity="0.05" />
        </svg>
      </div>

      <div className="skw-footer-top">
        <div className="skw-footer-inner">

          {/* Brand Column */}
          <div className="skw-footer-brand">
            <Link to="/" className="skw-footer-logo">
              <img src={logoNew} alt="ShriKrishna SteelWorks" style={{ height: "60px", width: "60px", objectFit: "cover", borderRadius: "50%", background: "#fff" }} />
            </Link>
            <p className="skw-footer-tagline">
              Maharashtra's most trusted industrial steel supplier and project contractor since 2006.
              Precision, strength, and reliability — built into every project we deliver.
            </p>
            <div className="skw-footer-socials">
              {/* LinkedIn */}
              <a href="#" className="skw-social-btn" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
              {/* WhatsApp */}
              <a href="#" className="skw-social-btn" aria-label="WhatsApp">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.999 1.999C6.477 1.999 2 6.476 2 12c0 1.888.516 3.657 1.411 5.178L2 22l4.902-1.384A9.949 9.949 0 0012 22c5.522 0 10-4.477 10-10 0-5.522-4.478-10.001-10.001-10.001zM12 20c-1.658 0-3.205-.457-4.532-1.25l-.324-.195-3.365.951.951-3.299-.213-.339A7.95 7.95 0 014 12c0-4.418 3.582-8 8-8 4.419 0 8 3.582 8 8 0 4.418-3.581 8-8 8z"/></svg>
              </a>
              {/* Instagram */}
              <a href="#" className="skw-social-btn" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="skw-footer-col">
            <h4 className="skw-footer-heading">Quick Links</h4>
            <ul className="skw-footer-links">
              {[
                { to: "/", label: "Home" },
                { to: "/about", label: "About Us" },
                { to: "/products", label: "Products" },
                { to: "/projects", label: "Projects" },
                { to: "/contact", label: "Contact" },
              ].map(l => (
                <li key={l.to}><Link to={l.to} className="skw-footer-link">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div className="skw-footer-col">
            <h4 className="skw-footer-heading">Products</h4>
            <ul className="skw-footer-links">
              {[
                "TMT Steel Bars",
                "Steel Plates & Sheets",
                "Structural Sections",
                "Pipes & Hollow Sections",
                "Custom Fabrication",
                "Ready-Made Components",
              ].map(p => (
                <li key={p}><Link to="/products" className="skw-footer-link">{p}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="skw-footer-col">
            <h4 className="skw-footer-heading">Contact Us</h4>
            <ul className="skw-footer-contact">
              <li className="skw-contact-item">
                <span className="skw-contact-icon">📍</span>
                <span>ShriKrishnaSteelWorks, MIDC Industrial Area,<br />Nagpur – 440 018, Maharashtra</span>
              </li>
              <li className="skw-contact-item">
                <span className="skw-contact-icon">📞</span>
                <a href="tel:+919876543210" className="skw-footer-link">+91 98765 43210</a>
              </li>
              <li className="skw-contact-item">
                <span className="skw-contact-icon">✉️</span>
                <a href="mailto:info@shrikrishnasteelworks.com" className="skw-footer-link">info@shrikrishnasteelworks.com</a>
              </li>
              <li className="skw-contact-item">
                <span className="skw-contact-icon">🕐</span>
                <span>Mon – Sat: 9:00 AM – 6:00 PM</span>
              </li>
            </ul>
            {/* CTA */}
            <Link to="/contact" className="skw-footer-cta">Get a Free Quote →</Link>
          </div>

        </div>
      </div>

      {/* Certification row */}
      <div className="skw-footer-certs">
        <div className="skw-footer-certs-inner">
          <span className="skw-cert-pill">✓ BIS IS Mark Certified</span>
          <span className="skw-cert-divider">|</span>
          <span className="skw-cert-pill">✓ ISO 9001:2015</span>
          <span className="skw-cert-divider">|</span>
          <span className="skw-cert-pill">✓ GST Registered</span>
          <span className="skw-cert-divider">|</span>
          <span className="skw-cert-pill">✓ MSME Registered</span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="skw-footer-bottom">
        <div className="skw-footer-bottom-inner">
          <span className="skw-footer-copy">
            © {currentYear} ShriKrishnaSteelWorks. All rights reserved.
          </span>
          <div className="skw-footer-legal">
            <Link to="/privacy" className="skw-footer-legal-link">Privacy Policy</Link>
            <span className="skw-cert-divider">·</span>
            <Link to="/terms" className="skw-footer-legal-link">Terms of Use</Link>
            <span className="skw-cert-divider">·</span>
            <Link to="/sitemap" className="skw-footer-legal-link">Sitemap</Link>
          </div>
          <span className="skw-footer-made">
            Made with ❤️ in Maharashtra
          </span>
        </div>
      </div>

    </footer>
  );
}