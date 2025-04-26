import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import './LogUploader.css';
import { marked } from 'marked';

const LogUploader = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [logDate, setLogDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processingForms, setProcessingForms] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [activities, setActivities] = useState([]);
  const [classifiedActivities, setClassifiedActivities] = useState([]);
  const [createdLog, setCreatedLog] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [processingIncidents, setProcessingIncidents] = useState({});
  const [filledForms, setFilledForms] = useState({});
  const [selectedForm, setSelectedForm] = useState(null);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await apiService.workflows.getAll();
        setWorkflows(response.data.workflows || []);
      } catch (err) {
        console.error('Error fetching workflows:', err);
        setError('Failed to load workflows. Please try again later.');
      }
    };

    fetchWorkflows();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file.');
        setFile(null);
        e.target.value = null;
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleDateChange = (e) => {
    setLogDate(e.target.value);
  };

  const validateForm = () => {
    if (!file) {
      setError('Please select a file to upload.');
      return false;
    }

    if (!logDate) {
      setError('Please select a log date.');
      return false;
    }

    setError(null);
    return true;
  };

  const resetForm = () => {
    setFile(null);
    setLogDate('');
    setActivities([]);
    setClassifiedActivities([]);
    setExtractedText('');
    setSelectedActivity(null);
    setFilledForms({});
    setSelectedForm(null);
    setSuccess(false);
    setError(null);
    setUploading(false);
    setProcessingForms(false);
    setProcessingIncidents({});
    setCreatedLog(null);
  };

  const generateIncidentForm = async (incidentId, activityKey) => {
    if (!incidentId) {
      console.error('Cannot generate form: Missing incident ID for activity:', activityKey);
      setClassifiedActivities(prev =>
        prev.map(a =>
          a.activity.activity === activityKey
            ? { ...a, formError: 'Missing Incident ID' }
            : a
        )
      );
      return;
    }

    setProcessingIncidents(prev => ({
      ...prev,
      [activityKey]: true
    }));

    try {
      const processResponse = await apiService.incidents.processSync(incidentId);

      if (processResponse.data && processResponse.data.filled_markdown) {
        setFilledForms(prev => ({
          ...prev,
          [activityKey]: {
            incidentId: incidentId,
            markdown: processResponse.data.filled_markdown,
            html: marked(processResponse.data.filled_markdown)
          }
        }));
        setClassifiedActivities(prev =>
          prev.map(a =>
            a.activity.activity === activityKey
              ? { ...a, processed: true, formError: null }
              : a
          )
        );
      } else {
        const message = processResponse.data?.message || "Form generation completed, but no form content returned.";
        console.warn(message, `Incident ID: ${incidentId}`);
        setClassifiedActivities(prev =>
          prev.map(a =>
            a.activity.activity === activityKey
              ? { ...a, processed: true, formError: message }
              : a
          )
        );
      }
    } catch (err) {
      console.error(`Error generating form for incident ${incidentId} (Activity: "${activityKey}"):`, err);
      setClassifiedActivities(prev =>
        prev.map(a =>
          a.activity.activity === activityKey
            ? { ...a, processed: false, formError: err.message || 'Form generation failed' }
            : a
        )
      );
      setError(`Failed to generate form for activity: ${activityKey}. ${err.message}`);
    } finally {
      setProcessingIncidents(prev => ({
        ...prev,
        [activityKey]: false
      }));
    }
  };

  const handleUploadClassifyAndCreate = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setUploading(true);
    setProcessingForms(false);
    setError(null);
    setSuccess(false);
    setClassifiedActivities([]);
    setFilledForms({});
    setCreatedLog(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('log_date', logDate);

      const response = await apiService.logs.classify(formData);

      console.log("Backend response from upload/classify/create:", response);

      if (response.data && response.data.log && response.data.classified_activities) {
        setCreatedLog(response.data.log);

        const initialClassified = (response.data.classified_activities || []).map(act => ({
          ...act,
          processed: false,
          formError: null
        }));
        console.log("Setting classifiedActivities state:", initialClassified);
        setClassifiedActivities(initialClassified);
        setExtractedText(response.data.extracted_text || '');
        setSuccess(true);
      } else {
        throw new Error("Processing API did not return expected data (log and classified_activities).");
      }
    } catch (err) {
      console.error('Error during initial processing:', err);
      setError(err.message || 'Failed to process log. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateForms = async () => {
    const incidentsToProcess = classifiedActivities.filter(a => a.classified && a.incident_id && !a.processed && !a.formError);

    if (incidentsToProcess.length === 0) {
      setError("No classified incidents remaining to generate forms for.");
      return;
    }

    setProcessingForms(true);
    setError(null);

    console.log(`Starting form generation for ${incidentsToProcess.length} incidents.`);

    for (const activity of incidentsToProcess) {
      const activityKey = activity.activity.activity;
      console.log(`Generating form for incident: ${activity.incident_id} (Activity: ${activityKey})`);
      await generateIncidentForm(activity.incident_id, activityKey);
    }

    console.log("Finished generating forms.");
    setProcessingForms(false);
  };

  const handleViewActivity = (activity) => {
    setSelectedActivity(activity);
  };

  const handleCloseActivity = () => {
    setSelectedActivity(null);
  };

  const handleViewForm = (activityTitle) => {
    setSelectedForm(filledForms[activityTitle]);
  };

  const handleCloseForm = () => {
    setSelectedForm(null);
  };

  const printForm = () => {
    if (!selectedForm) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Form</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 30px;
            }
            h1, h2, h3, h4 {
              color: #333;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
            }
            th {
              background-color: #f2f2f2;
            }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Print</button>
          <button onclick="window.close()">Close</button>
          <hr />
          ${selectedForm.html}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const hasIncidentsToProcess = classifiedActivities.some(a => a.classified && a.incident_id && !a.processed);

  return (
    <div className="log-uploader-container">
      <div className="log-uploader-header">
        <h2>Upload Log</h2>
        <p>Upload log, classify activities, create incidents, then generate forms.</p>
      </div>

      <div className="log-uploader-content">
        <div className="upload-section">
          <form onSubmit={handleUploadClassifyAndCreate}>
            <div className="form-group">
              <label htmlFor="logFile">Select Log File (PDF only)</label>
              <input
                type="file"
                id="logFile"
                onChange={handleFileChange}
                accept=".pdf"
                className="file-input"
                disabled={uploading || processingForms}
              />
              {file && (
                <div className="file-info">
                  <p>Selected File: {file.name}</p>
                  <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="logDate">Log Date</label>
              <input
                type="date"
                id="logDate"
                value={logDate}
                onChange={handleDateChange}
                className="date-input"
                disabled={uploading || processingForms}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="button-group">
              <button
                type="submit"
                className="upload-button"
                disabled={uploading || processingForms || !file || !logDate}
              >
                {uploading ? (
                  <>
                    <span className="spinner-small"></span>
                    Processing Log...
                  </>
                ) : (
                  <>Upload & Process Log</>
                )}
              </button>
              <button
                type="button"
                className="reset-button"
                onClick={resetForm}
                disabled={uploading || processingForms}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {success && (
          <div className="results-section">
            <div className="section-header">
              <h3>Log Processed - Review Activities</h3>
              {createdLog && <p>Log created with ID: {createdLog._id}</p>}
              <p>Review classifications. Click "Generate Forms" to create documents for classified incidents.</p>
              
              {hasIncidentsToProcess && (
                  <button
                    onClick={handleGenerateForms}
                    className="process-all-button"
                    disabled={processingForms || uploading}
                  >
                    {processingForms ? (
                      <>
                        <span className="spinner-small"></span>
                        Generating Forms...
                      </>
                    ) : (
                      <>Generate Forms for Incidents</>
                    )}
                  </button>
              )}
              {!processingForms && !hasIncidentsToProcess && classifiedActivities.length > 0 && (
                  <p className="info-message">All classified incidents have been processed or had errors.</p>
              )}
               {processingForms && (
                 <div className="processing-indicator">
                    <span className="spinner-small"></span> Generating forms...
                 </div>
               )}
            </div>

            {classifiedActivities.length === 0 ? (
              <div className="no-activities">
                <p>No activities were extracted from this log.</p>
              </div>
            ) : (
              <div className="activities-list">
                {classifiedActivities.map((activity, index) => {
                   const activityKey = activity.activity.activity;
                   const isFormProcessing = processingIncidents[activityKey];
                   const activityFormError = activity.formError;

                  return (
                    <div
                      key={`${createdLog?._id || 'log'}-${index}`}
                      className={`activity-card ${activity.classified ? 'classified' : 'unclassified'} ${activity.processed ? 'processed' : ''} ${activityFormError ? 'error' : ''}`}
                    >
                      <div className="activity-header">
                        <h4>{activityKey}</h4>
                        {activity.classified && (
                          <span className="workflow-badge">
                            {activity.workflow_title}
                          </span>
                        )}
                      </div>

                      <div className="activity-details">
                        {activity.activity.time && (<p><strong>Time:</strong> {activity.activity.time}</p>)}
                        {activity.activity.location && (<p><strong>Location:</strong> {activity.activity.location}</p>)}
                      </div>

                       {isFormProcessing && (
                         <div className="activity-processing-indicator">
                           <span className="spinner-tiny"></span> Generating Form...
                         </div>
                       )}
                       {activityFormError && (
                          <div className="activity-error-message">
                             Form Error: {activityFormError}
                          </div>
                       )}

                      <div className="activity-actions">
                        <button
                          className="view-button"
                          onClick={() => handleViewActivity(activity)}
                        >
                          View Details
                        </button>

                        {activity.classified && activity.processed && filledForms[activityKey] && !activityFormError && (
                          <button
                            className="view-form-button"
                            onClick={() => handleViewForm(activityKey)}
                          >
                            View Form
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedActivity && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Activity Details</h3>
              <button className="close-button" onClick={handleCloseActivity}>×</button>
            </div>
            <div className="modal-body">
              <h4>{selectedActivity.activity.activity}</h4>
              {selectedActivity.classified && (
                <p className="workflow-info">
                  <strong>Workflow:</strong> {selectedActivity.workflow_title} <br/>
                  {/* Removed Incident ID display: (Incident ID: {selectedActivity.incident_id || 'N/A'}) */}
                </p>
              )}
              <div className="activity-metadata">
                 {selectedActivity.activity.time && (<p><strong>Time:</strong> {selectedActivity.activity.time}</p>)}
                 {selectedActivity.activity.location && (<p><strong>Location:</strong> {selectedActivity.activity.location}</p>)}
              </div>
              <div className="activity-full-text">
                 <h5>Full Text:</h5>
                 <p>{selectedActivity.activity.text}</p>
              </div>
              {selectedActivity.formError && (
                <div className="activity-error-message modal-error">
                  Form Generation Error: {selectedActivity.formError}
                </div>
              )}
            </div>
            <div className="modal-footer">
               <button className="close-button" onClick={handleCloseActivity}>Close</button>
             </div>
          </div>
        </div>
      )}

      {selectedForm && (
         <div className="modal-backdrop">
           <div className="modal-content form-modal">
             <div className="modal-header">
               <h3>Filled Form</h3>
               <button className="close-button" onClick={handleCloseForm}>×</button>
             </div>
             <div className="modal-body">
               <div
                 className="form-preview"
                 dangerouslySetInnerHTML={{ __html: selectedForm.html }}
               ></div>
             </div>
             <div className="modal-footer">
               <button className="print-button" onClick={printForm}>
                 <i className="fas fa-print"></i> Print Form
               </button>
               <button className="close-button" onClick={handleCloseForm}>Close</button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default LogUploader; 