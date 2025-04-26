import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserSettings from '../components/dashboard/UserSettings';
import UserManagement from '../components/dashboard/UserManagement';
import WorkflowViewer from '../components/dashboard/WorkflowViewer';
import WorkflowCreator from '../components/dashboard/WorkflowCreator';
import IncidentViewer from '../components/dashboard/IncidentViewer';
import LogViewer from '../components/dashboard/LogViewer';
import LogUploader from '../components/dashboard/LogUploader';
import './Dashboard.css';

const Dashboard = () => {
  const { isLoggedIn, user, loading } = useAuth();
  const initialTab = user?.permissions === 'Admin' ? 'overview' : 'workflows';
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'workflows', label: 'Workflows' },
    { id: 'logs', label: 'Logs' },
    { id: 'uploadLog', label: 'Upload Log' },
    { id: 'incidents', label: 'Incidents' },
    { id: 'users', label: 'User Management', adminOnly: true },
    { id: 'createWorkflow', label: 'Create Workflow', adminOnly: true },
    { id: 'settings', label: 'Settings' }
  ];

  React.useEffect(() => {
    if (!loading && user) {
      setActiveTab(user.permissions === 'Admin' ? 'overview' : 'logs');
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return <Navigate to="/login" />;
  }

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
                <button className="action-button" onClick={() => setActiveTab('uploadLog')}>
                  <i className="fas fa-upload"></i>
                  <span>Upload Log</span>
                </button>
                
                <button className="action-button" onClick={() => setActiveTab('createWorkflow')}>
                  <i className="fas fa-plus-circle"></i>
                  <span>Create Workflow</span>
                </button>
                
                <button className="action-button" onClick={() => setActiveTab('users')}>
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
      case 'workflows':
        return <WorkflowViewer />;
      case 'logs':
        return <LogViewer />;
      case 'uploadLog':
        return <LogUploader />;
      case 'incidents':
        return <IncidentViewer />;
      case 'users':
        return user.permissions === 'Admin' ? <UserManagement /> : <div>Access Denied</div>;
      case 'createWorkflow':
        return user.permissions === 'Admin' ? <WorkflowCreator /> : <div>Access Denied</div>;
      case 'settings':
        return <UserSettings />;
      default:
        return user.permissions === 'Admin' ? (
          <div className="dashboard-content">Overview Content</div>
        ) : (
          <WorkflowViewer />
        );
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
              
              <li>
                <button 
                  className={`nav-button ${activeTab === 'workflows' ? 'active' : ''}`}
                  onClick={() => setActiveTab('workflows')}
                >
                  <i className="fas fa-sitemap"></i> Workflows
                </button>
              </li>
              
              <li>
                <button 
                  className={`nav-button ${activeTab === 'logs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('logs')}
                >
                  <i className="fas fa-file-alt"></i> Logs
                </button>
              </li>
              
              <li>
                <button 
                  className={`nav-button ${activeTab === 'uploadLog' ? 'active' : ''}`}
                  onClick={() => setActiveTab('uploadLog')}
                >
                  <i className="fas fa-upload"></i> Upload Log
                </button>
              </li>
              
              <li>
                <button 
                  className={`nav-button ${activeTab === 'incidents' ? 'active' : ''}`}
                  onClick={() => setActiveTab('incidents')}
                >
                  <i className="fas fa-exclamation-circle"></i> Incidents
                </button>
              </li>
              
              {user.permissions === 'Admin' && (
                <>
                  <li>
                    <button 
                      className={`nav-button ${activeTab === 'users' ? 'active' : ''}`}
                      onClick={() => setActiveTab('users')}
                    >
                      <i className="fas fa-users"></i> Users
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`nav-button ${activeTab === 'createWorkflow' ? 'active' : ''}`}
                      onClick={() => setActiveTab('createWorkflow')}
                    >
                      <i className="fas fa-plus-circle"></i> Create Workflow
                    </button>
                  </li>
                </>
              )}
              
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