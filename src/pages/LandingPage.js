import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import logo from '../logo.png';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1>Streamline Your Law Enforcement Workflows</h1>
              <p>
                Enflow automates routine paperwork from officer daily logs, 
                identifies key activities, and generates required forms - 
                saving time and reducing errors.
              </p>
              <div className="hero-cta">
                <Link to="/login" className="btn btn-primary">Get Started</Link>
                <Link to="/features" className="btn btn-secondary">Learn More</Link>
              </div>
            </div>
            <div className="hero-image">
              <img src={logo} alt="Enflow Logo" />
              <div className="hero-image-bg"></div>
              <div className="hero-image-accent"></div>
            </div>
          </div>
        </div>
        <div className="hero-shape-1"></div>
        <div className="hero-shape-2"></div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Why Choose Us</span>
            <h2>Why Choose Enflow?</h2>
            <p>Our platform helps law enforcement agencies save time, reduce errors, and streamline workflows.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-tachometer-alt"></i>
              </div>
              <h3>Automation</h3>
              <p>Automatically extract relevant information from daily logs and generate required forms.</p>
              <div className="card-accent"></div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Security</h3>
              <p>Bank-level encryption and secure access controls to protect sensitive information.</p>
              <div className="card-accent"></div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-sync-alt"></i>
              </div>
              <h3>Efficiency</h3>
              <p>Reduce paperwork time by up to 80% and minimize errors in documentation.</p>
              <div className="card-accent"></div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Analytics</h3>
              <p>Gain insights into departmental activities and optimize resource allocation.</p>
              <div className="card-accent"></div>
            </div>
          </div>
        </div>
        <div className="section-bg-accent"></div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">The Process</span>
            <h2>How Enflow Works</h2>
            <p>A simple three-step process to transform your department's workflow</p>
          </div>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create Workflows</h3>
              <p>Define department-specific workflows for different incident types and required documentation.</p>
              <div className="step-icon-bg">
                <i className="fas fa-sitemap"></i>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Upload Daily Logs</h3>
              <p>Officers upload their daily activity logs as PDF documents to the secure platform.</p>
              <div className="step-icon-bg">
                <i className="fas fa-file-upload"></i>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Automatic Processing</h3>
              <p>Enflow identifies activities, classifies incidents, and prepares all necessary forms.</p>
              <div className="step-icon-bg">
                <i className="fas fa-cogs"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Department's Workflow?</h2>
          <p>Join the growing number of law enforcement agencies using Enflow to streamline operations.</p>
          <Link to="/login" className="btn btn-accent">Get Started Today</Link>
          <div className="cta-shape"></div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; 