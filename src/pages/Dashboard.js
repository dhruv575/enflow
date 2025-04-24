import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserSettings from '../components/dashboard/UserSettings';
import './Dashboard.css';

const Dashboard = () => {
  const { isLoggedIn, user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('settings');

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" />;
  }

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="dashboard-content">
            <div className="dashboard-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="stat-info">
                  <h3>Total Logs</h3>
                  <p className="stat-value">0</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-exclamation-circle"></i>
                </div>
                <div className="stat-info">
                  <h3>Incidents</h3>
                  <p className="stat-value">0</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-sitemap"></i>
                </div>
                <div className="stat-info">
                  <h3>Workflows</h3>
                  <p className="stat-value">0</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-info">
                  <h3>Department Users</h3>
                  <p className="stat-value">1</p>
                </div>
              </div>
            </div>
            
            <div className="dashboard-actions">
              <h2>Quick Actions</h2>
              <div className="action-buttons">
                <button className="action-button">
                  <i className="fas fa-upload"></i>
                  <span>Upload Log</span>
                </button>
                
                <button className="action-button">
                  <i className="fas fa-plus-circle"></i>
                  <span>Create Workflow</span>
                </button>
                
                <button className="action-button">
                  <i className="fas fa-user-plus"></i>
                  <span>Add User</span>
                </button>
                
                <button className="action-button">
                  <i className="fas fa-chart-line"></i>
                  <span>Analytics</span>
                </button>
              </div>
            </div>
            
            <div className="dashboard-recent">
              <h2>Recent Activity</h2>
              <div className="no-data-message">
                <p>No recent activity to display.</p>
                <p>Start by uploading a log or creating a workflow.</p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return <UserSettings />;
      // Add cases for other tabs later (e.g., 'users', 'workflows')
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>Welcome, {user?.name || 'User'}</h1>
          <p>Manage your department workflows and activities</p>
        </div>
        
        <div className="dashboard-layout">
          <nav className="dashboard-nav">
            <ul>
              <li>
                <button 
                  className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <i className="fas fa-tachometer-alt"></i> Overview
                </button>
              </li>
              {/* Add more tabs based on user permissions later */} 
              <li>
                <button 
                  className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <i className="fas fa-cog"></i> Settings
                </button>
              </li>
            </ul>
          </nav>
          
          <div className="dashboard-main-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 