import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import logoImg from '../../assets/images/logo.png';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo-section">
            <img src={logoImg} alt="Enflow Logo" className="footer-logo" />
            <h2 className="footer-brand">Enflow</h2>
            <p className="footer-slogan">Streamlining law enforcement workflows</p>
            <div className="social-icons">
              <a href="https://twitter.com/enflow" aria-label="Twitter">
                <i className="ri-twitter-x-fill"></i>
              </a>
              <a href="https://facebook.com/enflow" aria-label="Facebook">
                <i className="ri-facebook-fill"></i>
              </a>
              <a href="https://linkedin.com/company/enflow" aria-label="LinkedIn">
                <i className="ri-linkedin-fill"></i>
              </a>
              <a href="https://instagram.com/enflow.app" aria-label="Instagram">
                <i className="ri-instagram-fill"></i>
              </a>
            </div>
          </div>
          
          <div className="footer-links-section">
            <div className="footer-links-column">
              <h4>Platform</h4>
              <ul>
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/pricing">Pricing</Link></li>
                <li><Link to="/security">Security</Link></li>
                <li><Link to="/integrations">Integrations</Link></li>
                <li><Link to="/updates">What's New</Link></li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h4>Resources</h4>
              <ul>
                <li><Link to="/documentation">Documentation</Link></li>
                <li><Link to="/api">API Reference</Link></li>
                <li><Link to="/guides">Guides & Tutorials</Link></li>
                <li><Link to="/community">Community</Link></li>
                <li><Link to="/support">Support Center</Link></li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h4>Contact</h4>
              <address>
                <p><i className="ri-map-pin-line"></i> 1234 Tech Avenue, Suite 500<br />Seattle, WA 98101</p>
                <p><i className="ri-mail-line"></i> contact@enflow.io</p>
                <p><i className="ri-phone-line"></i> (555) 123-4567</p>
              </address>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {currentYear} Enflow. All rights reserved.</p>
          <p>
            <Link to="/privacy">Privacy Policy</Link> • 
            <Link to="/terms"> Terms of Service</Link> • 
            <Link to="/legal"> Legal</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 