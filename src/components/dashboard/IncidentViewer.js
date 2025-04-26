import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import './IncidentViewer.css';

const IncidentViewer = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    workflow_id: '',
    user_id: '',
  });
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch workflows for filtering
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await apiService.workflows.getAll();
        setWorkflows(response.data.workflows || []);
      } catch (err) {
        console.error("Error fetching workflows:", err);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await apiService.users.getAll();
        setUsers(response.data.users || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchWorkflows();
    fetchUsers();
  }, []);

  // Fetch incidents with filters
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        
        // Check if we need to filter by date range
        let response;
        if (filters.start_date && filters.end_date) {
          // Use date range endpoint
          response = await apiService.incidents.getByDateRange({
            start_date: filters.start_date,
            end_date: filters.end_date
          });
        } else if (filters.workflow_id) {
          // Use workflow filter
          response = await apiService.incidents.getByWorkflow(filters.workflow_id);
        } else {
          // Use the department incidents endpoint if admin, otherwise user incidents
          if (user?.permissions === "Admin") {
            response = await apiService.incidents.getDepartmentIncidents();
          } else {
            response = await apiService.incidents.getUserIncidents();
          }
        }
        
        setIncidents(response.data.incidents || []);
      } catch (err) {
        console.error("Error fetching incidents:", err);
        setError("Failed to load incidents. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, [filters, user?.permissions]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      workflow_id: '',
      user_id: '',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusClass = (status) => {
    if (!status) return 'status-default';
    
    switch (status.toLowerCase()) {
      case 'open':
        return 'status-open';
      case 'resolved':
        return 'status-resolved';
      case 'in progress':
      case 'in-progress':
        return 'status-in-progress';
      default:
        return 'status-default';
    }
  };

  const viewIncidentDetails = (incident) => {
    setSelectedIncident(incident);
  };

  const closeIncidentDetails = () => {
    setSelectedIncident(null);
  };

  if (loading) {
    return <div className="incident-viewer-loading">Loading incidents...</div>;
  }

  if (error) {
    return <div className="incident-viewer-error">{error}</div>;
  }

  return (
    <div className="incident-viewer-container">
      <div className="incident-viewer-header">
        <h2>Incident Viewer</h2>
        <p>View and track incidents across all workflows</p>
      </div>

      <div className="incident-filters">
        <div className="filter-group">
          <label>Date Range:</label>
          <div className="date-inputs">
            <input
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              placeholder="Start Date"
            />
            <span>to</span>
            <input
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              placeholder="End Date"
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Workflow:</label>
          <select 
            name="workflow_id" 
            value={filters.workflow_id} 
            onChange={handleFilterChange}
          >
            <option value="">All Workflows</option>
            {workflows.map(workflow => (
              <option key={workflow._id} value={workflow._id}>{workflow.title}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>User:</label>
          <select 
            name="user_id" 
            value={filters.user_id} 
            onChange={handleFilterChange}
          >
            <option value="">All Users</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>{user.name}</option>
            ))}
          </select>
        </div>

        <button className="clear-filters-btn" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {incidents.length === 0 ? (
        <div className="no-incidents-message">
          <i className="fas fa-info-circle"></i>
          <p>No incidents found. Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="incidents-list">
          <table className="incidents-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Workflow</th>
                <th>User</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(incident => {
                const workflowName = workflows.find(w => w._id === incident.workflow_id)?.title || 'Unknown';
                const userName = users.find(u => u._id === incident.user_id)?.name || 'Unknown';
                
                return (
                  <tr key={incident._id}>
                    <td>{incident._id.substring(0, 8)}...</td>
                    <td>{incident.description || 'No description'}</td>
                    <td>{workflowName}</td>
                    <td>{userName}</td>
                    <td>{formatDate(incident.date)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(incident.status)}`}>
                        {incident.status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="view-incident-btn"
                        onClick={() => viewIncidentDetails(incident)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedIncident && (
        <div className="incident-details-modal">
          <div className="incident-details-content">
            <div className="modal-header">
              <h3>Incident Details</h3>
              <button className="close-modal" onClick={closeIncidentDetails}>×</button>
            </div>
            
            <div className="incident-info">
              <div className="info-group">
                <h4>Basic Information</h4>
                <div className="info-row">
                  <span className="info-label">ID:</span>
                  <span className="info-value">{selectedIncident._id}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Description:</span>
                  <span className="info-value">{selectedIncident.description || 'No description'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status:</span>
                  <span className={`status-badge ${getStatusClass(selectedIncident.status)}`}>
                    {selectedIncident.status || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div className="info-group">
                <h4>Workflow Information</h4>
                <div className="info-row">
                  <span className="info-label">Workflow:</span>
                  <span className="info-value">
                    {workflows.find(w => w._id === selectedIncident.workflow_id)?.title || 'Unknown'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">User:</span>
                  <span className="info-value">
                    {users.find(u => u._id === selectedIncident.user_id)?.name || 'Unknown'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date:</span>
                  <span className="info-value">{formatDate(selectedIncident.date)}</span>
                </div>
              </div>
              
              {selectedIncident.data && Object.keys(selectedIncident.data).length > 0 && (
                <div className="info-group">
                  <h4>Incident Data</h4>
                  <div className="incident-data">
                    {Object.entries(selectedIncident.data).map(([key, value]) => (
                      <div className="data-item" key={key}>
                        <span className="data-key">{key}:</span>
                        <span className="data-value">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedIncident.filled_forms && selectedIncident.filled_forms.length > 0 && (
                <div className="info-group">
                  <h4>Filled Forms</h4>
                  {selectedIncident.filled_forms.map((form, index) => (
                    <div key={index} className="info-row">
                      <a 
                        href={form.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="view-form-btn"
                      >
                        View Form {index + 1}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentViewer; 