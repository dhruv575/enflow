import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import apiService from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSitemap, 
  faTimes, 
  faListUl,
  faExclamationCircle,
  faCheckCircle,
  faTrash,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import './WorkflowViewer.css';

const WorkflowViewer = () => {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [executionStatus, setExecutionStatus] = useState(null);
  
  const isAdmin = user && user.permissions === 'Admin';

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setLoading(true);
        const response = await apiService.workflows.getAll();
        setWorkflows(response.data.workflows || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching workflows:', err);
        setError('Failed to load workflows. Please try again later.');
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  const handleWorkflowSelect = async (workflowId) => {
    if (selectedWorkflow && selectedWorkflow._id === workflowId) {
      setSelectedWorkflow(null);
      return;
    }

    try {
      const response = await apiService.workflows.getById(workflowId);
      setSelectedWorkflow(response.data.workflow);
      
      // Initialize form data based on data requirements
      if (response.data.workflow && response.data.workflow.data_requirements) {
        const initialFormData = {};
        response.data.workflow.data_requirements.forEach(req => {
          initialFormData[req.field] = '';
        });
        setFormData(initialFormData);
      }
      
      // Reset execution status
      setExecutionStatus(null);
    } catch (err) {
      console.error('Error fetching workflow details:', err);
      setError('Failed to load workflow details. Please try again later.');
    }
  };

  const handleInputChange = (fieldName, value) => {
    setFormData({
      ...formData,
      [fieldName]: value
    });
  };

  const handleExecuteWorkflow = () => {
    setShowExecuteModal(true);
  };

  const handleCloseExecuteModal = () => {
    setShowExecuteModal(false);
  };

  const handleRemoveTemplate = async (workflowId) => {
    if (!isAdmin) return;
    
    if (window.confirm("Are you sure you want to remove this template? This action cannot be undone.")) {
      try {
        const response = await apiService.workflows.removeForm(workflowId);
        if (!response?.data?.workflow) {
          throw new Error('Failed to remove template.');
        }
        
        // Refresh the workflow data
        const updatedWorkflow = await apiService.workflows.getById(workflowId);
        setSelectedWorkflow(updatedWorkflow.data.workflow);
        
        // Update the workflow in the list
        setWorkflows(prevWorkflows => 
          prevWorkflows.map(wf => 
            wf._id === workflowId ? updatedWorkflow.data.workflow : wf
          )
        );
        
        alert('Template removed successfully.');
      } catch (err) {
        console.error('Error removing template:', err);
        setError(err.message || 'An error occurred while removing the template.');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Here you would normally submit the form data for execution
    // For now, we'll just simulate a successful execution
    setExecutionStatus('processing');
    
    setTimeout(() => {
      setExecutionStatus('completed');
    }, 1500);
    
    // In a real implementation, you would call an API endpoint to process the workflow
    // For example:
    // try {
    //   const response = await apiService.incidents.create({
    //     workflow_id: selectedWorkflow._id,
    //     extracted_data: formData
    //   });
    //   setExecutionStatus('completed');
    // } catch (err) {
    //   setExecutionStatus('failed');
    // }
  };

  const renderTemplatePreview = () => {
    if (!selectedWorkflow || !selectedWorkflow.markdown_template) {
      return <p>No template available for this workflow.</p>;
    }
    
    return <ReactMarkdown>{selectedWorkflow.markdown_template}</ReactMarkdown>;
  };

  if (loading) {
    return (
      <div className="workflows-loading">
        <div className="spinner">
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
        <p>Loading workflows...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workflows-error">
        <FontAwesomeIcon icon={faExclamationCircle} />
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="workflow-viewer-container">
      <div className="workflow-header">
        <h2>Department Workflows</h2>
        <p>View all available workflows for your department</p>
      </div>

      {workflows.length === 0 ? (
        <div className="no-workflows-message">
          <FontAwesomeIcon icon={faSitemap} />
          <h3>No Workflows Found</h3>
          <p>There are currently no workflows defined for your department.</p>
          <p>Workflows will be created by department administrators.</p>
        </div>
      ) : (
        <div className="workflows-content">
          <div className="workflows-list">
            {workflows.map((workflow) => (
              <div 
                key={workflow._id} 
                className={`workflow-item ${selectedWorkflow && selectedWorkflow._id === workflow._id ? 'selected' : ''}`}
                onClick={() => handleWorkflowSelect(workflow._id)}
              >
                <div className="workflow-item-header">
                  <FontAwesomeIcon icon={faSitemap} />
                  <h3>{workflow.title}</h3>
                </div>
                <p className="workflow-description">{workflow.description.substring(0, 100)}...</p>
                <div className="workflow-meta">
                  <span className="workflow-requirements">
                    <FontAwesomeIcon icon={faListUl} /> 
                    {workflow.data_requirements?.length || 0} data requirements
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedWorkflow && (
            <div className="workflow-details">
              <div className="workflow-details-header">
                <h2>{selectedWorkflow.title}</h2>
                <div className="workflow-actions">
                  <button 
                    className="btn-primary execute-workflow-btn" 
                    onClick={handleExecuteWorkflow}
                  >
                    Execute Workflow
                  </button>
                  <button className="close-details" onClick={() => setSelectedWorkflow(null)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>

              <div className="workflow-details-content">
                <div className="workflow-section">
                  <h3>Description</h3>
                  <p>{selectedWorkflow.description}</p>
                </div>

                <div className="workflow-section">
                  <h3>Data Requirements</h3>
                  {selectedWorkflow.data_requirements && selectedWorkflow.data_requirements.length > 0 ? (
                    <ul className="data-requirements-list">
                      {selectedWorkflow.data_requirements.map((req, index) => (
                        <li key={index}>
                          <strong>{req.field}:</strong> {req.description}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No data requirements defined.</p>
                  )}
                </div>

                <div className="workflow-section">
                  <h3>Template</h3>
                  <div className="template-preview">
                    <div className="template-preview-header">
                      <h4>Template Preview</h4>
                      {isAdmin && selectedWorkflow.markdown_template && (
                        <button 
                          className="btn-danger template-remove-btn"
                          onClick={() => handleRemoveTemplate(selectedWorkflow._id)}
                          title="Remove Template"
                        >
                          <FontAwesomeIcon icon={faTrash} /> Remove Template
                        </button>
                      )}
                    </div>
                    <div className="template-preview-content">
                      {renderTemplatePreview()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Execute Workflow Modal */}
      {showExecuteModal && selectedWorkflow && (
        <div className="modal-overlay">
          <div className="execute-workflow-modal">
            <div className="modal-header">
              <h3>Execute Workflow: {selectedWorkflow.title}</h3>
              <button className="close-modal" onClick={handleCloseExecuteModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="modal-content">
              <div className="workflow-form-container">
                <h4>Enter Required Data</h4>
                <form onSubmit={handleFormSubmit}>
                  {selectedWorkflow.data_requirements && selectedWorkflow.data_requirements.map((req, index) => (
                    <div key={index} className="form-group">
                      <label htmlFor={`field-${req.field}`}>{req.field}</label>
                      <input
                        type="text"
                        id={`field-${req.field}`}
                        placeholder={req.description}
                        value={formData[req.field] || ''}
                        onChange={(e) => handleInputChange(req.field, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                  
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={handleCloseExecuteModal}
                      disabled={executionStatus === 'processing'}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={executionStatus === 'processing' || executionStatus === 'completed'}
                    >
                      {executionStatus === 'processing' ? 'Processing...' : 
                       executionStatus === 'completed' ? 'Completed' : 'Execute Workflow'}
                    </button>
                  </div>
                </form>
              </div>
              
              {executionStatus === 'completed' && (
                <div className="execution-success">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <p>Workflow executed successfully!</p>
                  <p>Check the Incidents tab to view the generated document.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowViewer; 