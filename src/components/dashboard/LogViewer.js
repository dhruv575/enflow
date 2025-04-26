import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import './LogViewer.css';

const LogViewer = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [incidents, setIncidents] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: ''
  });
  const [users, setUsers] = useState([]);

  // Fetch logs based on filters
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        
        // For now, let's just use a single endpoint to retrieve logs
        // and perform filtering on the client-side until we confirm
        // all backend routes are available
        const response = await apiService.logs.getUserLogs();
        
        let filteredLogs = response.data.logs || [];
        
        // Client-side filtering
        if (filters.startDate) {
          filteredLogs = filteredLogs.filter(log => 
            new Date(log.log_date) >= new Date(filters.startDate)
          );
        }
        
        if (filters.endDate) {
          filteredLogs = filteredLogs.filter(log => 
            new Date(log.log_date) <= new Date(filters.endDate)
          );
        }
        
        if (filters.userId) {
          filteredLogs = filteredLogs.filter(log => 
            log.user_id === filters.userId
          );
        }
        
        setLogs(filteredLogs);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching logs:', err);
        setError('Failed to load logs. Please try again later.');
        setLoading(false);
      }
    };

    fetchLogs();
  }, [filters]);

  // Fetch users for the filter dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiService.users.getAll();
        setUsers(response.data.users || []);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchUsers();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userId: ''
    });
  };

  const handleViewLog = async (logId) => {
    try {
      const response = await apiService.logs.getById(logId);
      setSelectedLog(response.data.log);
      
      // Fetch related incidents if any
      if (response.data.log.incidents && response.data.log.incidents.length > 0) {
        const incidentsResponse = await Promise.all(
          response.data.log.incidents.map(incidentId => 
            apiService.incidents.getById(incidentId)
          )
        );
        
        setIncidents(incidentsResponse.map(res => res.data.incident).filter(Boolean));
      } else {
        setIncidents([]);
      }
    } catch (err) {
      console.error('Error fetching log details:', err);
      setError('Failed to load log details.');
    }
  };

  const closeLogDetails = () => {
    setSelectedLog(null);
    setIncidents([]);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="logs-loading">
        <div className="spinner"></div>
        <p>Loading logs...</p>
      </div>
    );
  }

  if (error && !selectedLog) {
    return (
      <div className="logs-error">
        <i className="fas fa-exclamation-circle"></i>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="logs-viewer-container">
      <div className="logs-header">
        <h2>Department Logs</h2>
        <p>View and filter logs from your department</p>
      </div>

      <div className="logs-filters">
        <div className="filter-section">
          <h3>Filters</h3>
          <div className="filter-controls">
            <div className="date-filters">
              <div className="filter-group">
                <label htmlFor="startDate">Start Date:</label>
                <input 
                  type="date" 
                  id="startDate" 
                  name="startDate" 
                  value={filters.startDate}
                  onChange={handleFilterChange}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="endDate">End Date:</label>
                <input 
                  type="date" 
                  id="endDate" 
                  name="endDate" 
                  value={filters.endDate}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            <div className="filter-group">
              <label htmlFor="userId">Officer:</label>
              <select 
                id="userId" 
                name="userId"
                value={filters.userId} 
                onChange={handleFilterChange}
              >
                <option value="">All Officers</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} - {user.position}
                  </option>
                ))}
              </select>
            </div>
            <button 
              className="reset-filters-btn" 
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
      
      {logs.length === 0 ? (
        <div className="no-logs-message">
          <i className="fas fa-file-alt"></i>
          <h3>No Logs Found</h3>
          <p>No logs match your current filter criteria.</p>
          <button 
            className="reset-filters-btn" 
            onClick={handleResetFilters}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="logs-content">
          {!selectedLog ? (
            <div className="logs-list">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Officer</th>
                    <th>Incidents</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const officer = users.find(user => user._id === log.user_id);
                    return (
                      <tr key={log._id}>
                        <td>{formatDate(log.log_date)}</td>
                        <td>{officer ? officer.name : 'Unknown'}</td>
                        <td>{log.incidents?.length || 0}</td>
                        <td>
                          <button 
                            className="view-log-btn"
                            onClick={() => handleViewLog(log._id)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="log-details">
              <div className="log-details-header">
                <h3>Log Details</h3>
                <button className="close-details" onClick={closeLogDetails}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="log-details-content">
                <div className="log-section">
                  <h4>General Information</h4>
                  <p><strong>Date:</strong> {formatDate(selectedLog.log_date)}</p>
                  <p><strong>Officer:</strong> {users.find(user => user._id === selectedLog.user_id)?.name || 'Unknown'}</p>
                  <p><strong>Incidents Generated:</strong> {selectedLog.incidents?.length || 0}</p>
                </div>
                
                {selectedLog.content && (
                  <div className="log-section">
                    <h4>Log Content</h4>
                    <div className="log-content-preview">
                      <pre>{selectedLog.content}</pre>
                    </div>
                  </div>
                )}
                
                {incidents.length > 0 && (
                  <div className="log-section">
                    <h4>Generated Incidents</h4>
                    <div className="incidents-list">
                      {incidents.map(incident => (
                        <div key={incident._id} className="incident-item">
                          <div className="incident-header">
                            <h5>{incident.description}</h5>
                            <span className={`incident-status status-${incident.status}`}>
                              {incident.status}
                            </span>
                          </div>
                          <p><strong>Date:</strong> {formatDate(incident.date)}</p>
                          <p><strong>Workflow:</strong> {incident.workflow_name || 'Unknown'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedLog.file_url && (
                  <div className="log-section">
                    <h4>Original Document</h4>
                    <a 
                      href={selectedLog.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-original-btn"
                    >
                      <i className="fas fa-file-pdf"></i> View Original Log
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LogViewer; 