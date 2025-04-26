import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import apiService from '../../services/api';
import './WorkflowCreator.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://droov-enflow-api.hf.space';

const WorkflowCreator = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dataRequirements, setDataRequirements] = useState([{ field: '', description: '' }]);
  const [selectedMarkdownFile, setSelectedMarkdownFile] = useState(null);
  const [markdownFileName, setMarkdownFileName] = useState(''); // To display the selected file name
  const [markdownContent, setMarkdownContent] = useState('');
  const [editableMarkdown, setEditableMarkdown] = useState('');
  const [stage, setStage] = useState(1); // 1: Basic Details, 2: Template Editing
  const [workflowId, setWorkflowId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldInsertMode, setFieldInsertMode] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  
  const markdownEditorRef = useRef(null);

  // --- State Handlers (Stage 1) ---
  const handleAddRequirement = () => setDataRequirements([...dataRequirements, { field: '', description: '' }]);
  
  const handleRequirementChange = (index, key, value) => {
    const updated = [...dataRequirements];
    updated[index][key] = value;
    setDataRequirements(updated);
  };
  
  const handleRemoveRequirement = (index) => {
    if (dataRequirements.length > 1) setDataRequirements(dataRequirements.filter((_, i) => i !== index));
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.md')) {
      setSelectedMarkdownFile(file); 
      setMarkdownFileName(file.name); 
      setError(null);
      
      // Read the file contents
      const reader = new FileReader();
      reader.onload = (e) => {
        setMarkdownContent(e.target.result);
      };
      reader.readAsText(file);
    } else {
      setSelectedMarkdownFile(null);
      setMarkdownFileName(''); 
      setError('Please select a valid markdown (.md) file.');
    }
  };

  // --- Validation ---
  const isStage1Valid = () => (
    title.trim() && description.trim() && selectedMarkdownFile &&
    dataRequirements.length > 0 && dataRequirements.every(req => req.field.trim() && req.description.trim())
  );

  // --- API Calls / Stage Transitions ---
  const handleNextStage = async () => {
     if (!isStage1Valid()) {
      setError('Please fill in the title, description, at least one data requirement, and upload a markdown file.');
      return;
    }
    setError(null);
    setLoading(true);
    
    try {
      const workflowData = {
        title: title, 
        description: description,
        data_requirements: dataRequirements.filter(req => req.field.trim() && req.description.trim()),
        form_fields: []
      };
      console.log('Creating workflow with data:', workflowData);
      const createResponse = await apiService.workflows.create(workflowData);
      if (!createResponse?.data?.workflow?._id) throw new Error('Failed to create workflow or received invalid response.');
      const newWorkflowId = createResponse.data.workflow._id;
      setWorkflowId(newWorkflowId);
      console.log('Workflow created successfully with ID:', newWorkflowId);

      if (selectedMarkdownFile) {
        const formData = new FormData();
        formData.append('file', selectedMarkdownFile); 
        console.log('Uploading markdown template for workflow ID:', newWorkflowId);
        const uploadResponse = await apiService.workflows.uploadForm(newWorkflowId, formData);
        if (!uploadResponse?.data?.workflow) {
          try { await apiService.workflows.delete(newWorkflowId); } catch (delErr) { console.error('Failed to clean up partially created workflow:', delErr); }
          throw new Error('Failed to upload markdown template or received invalid response.');
        }
        console.log('Markdown template uploaded successfully');
        setEditableMarkdown(markdownContent);
      } else {
        throw new Error('No markdown file selected for upload.');
      }
      setStage(2);
    } catch (err) {
      console.error('Error during Stage 1 completion:', err);
      setError(err.message || 'An unexpected error occurred during workflow creation or template upload.');
    } finally {
      setLoading(false);
    }
  };

  // --- Stage 2 Logic ---
  const handleInsertField = (fieldName) => {
    // Insert the field token at the cursor position or at the end
    const textarea = markdownEditorRef.current;
    const token = `{{${fieldName}}}`;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const newText = text.substring(0, start) + token + text.substring(end);
      setEditableMarkdown(newText);
      
      // Put cursor after the inserted token
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    } else {
      // If no textarea reference, just append to the end
      setEditableMarkdown(editableMarkdown + token);
    }
  };

  // Handle removing the template
  const handleRemoveTemplate = async () => {
    if (!workflowId) {
      setError("Workflow ID is missing.");
      return;
    }
    
    if (window.confirm("Are you sure you want to remove this template? This action cannot be undone.")) {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiService.workflows.removeForm(workflowId);
        if (!response?.data?.workflow) {
          throw new Error('Failed to remove template.');
        }
        
        // Clear the template
        setEditableMarkdown('');
        setMarkdownContent('');
        alert('Template removed successfully. You can upload a new one or leave it blank.');
      } catch (err) {
        console.error('Error removing template:', err);
        setError(err.message || 'An error occurred while removing the template.');
      } finally {
        setLoading(false);
      }
    }
  };

  // --- Save Final Workflow ---
  const handleSaveWorkflow = async () => {
    if (!workflowId) {
      setError("Workflow ID is missing.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Update the workflow with the edited markdown
      const updateData = {
        markdown_template: editableMarkdown
      };
      console.log('Saving updated template for workflow ID:', workflowId);
      console.log('Template content length:', editableMarkdown ? editableMarkdown.length : 0);
      console.log('First 100 chars of template:', editableMarkdown ? editableMarkdown.substring(0, 100) : 'Empty');
      
      const updateResponse = await apiService.workflows.update(workflowId, updateData);
      console.log('Update response:', updateResponse);
      
      if (!updateResponse?.data?.workflow) {
        throw new Error('Failed to update workflow template.');
      }
      
      console.log('Updated workflow:', updateResponse.data.workflow);
      console.log('Saved template length:', 
        updateResponse.data.workflow.markdown_template ? 
        updateResponse.data.workflow.markdown_template.length : 0);

      alert('Workflow and template saved successfully!');
      setTitle(''); 
      setDescription(''); 
      setDataRequirements([{ field: '', description: '' }]);
      setSelectedMarkdownFile(null); 
      setMarkdownFileName(''); 
      setMarkdownContent('');
      setEditableMarkdown('');
      setStage(1); 
      setWorkflowId(null);

    } catch (err) {
      console.error('Error saving template:', err);
      setError(err.message || 'An error occurred while saving the template.');
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="workflow-creator-container">
      <div className="creator-header">
        <h2>Create New Workflow</h2>
        <div className="stage-indicator">
          <span className={`stage-dot ${stage >= 1 ? 'active' : ''}`}>1</span>
          <span className={`stage-line ${stage >= 2 ? 'active' : ''}`}></span> 
          <span className={`stage-dot ${stage >= 2 ? 'active' : ''}`}>2</span>
        </div>
      </div>

      {error && <p className="error-message">Error: {error}</p>}

      {/* --- Stage 1 Form --- */}
      {stage === 1 && (
          <div className="stage-content">
             <h3>Stage 1: Workflow Details & Template Upload</h3>
             <div className="form-group"> 
               <label htmlFor="workflowTitle">Workflow Title *</label> 
               <input 
                 type="text" 
                 id="workflowTitle" 
                 value={title} 
                 onChange={(e) => setTitle(e.target.value)} 
                 placeholder="e.g., Traffic Stop Report" 
                 required 
                 disabled={loading} 
               /> 
             </div>
             
             <div className="form-group"> 
               <label htmlFor="workflowDescription">Description *</label> 
               <textarea 
                 id="workflowDescription" 
                 value={description} 
                 onChange={(e) => setDescription(e.target.value)} 
                 placeholder="Describe the purpose and steps..." 
                 rows={4} 
                 required 
                 disabled={loading} 
               /> 
             </div>
             
             <h4>Data Requirements *</h4>
             <div className="data-requirements-list">
                 {dataRequirements.map((req, index) => ( 
                    <div key={index} className="data-requirement-item"> 
                      <input 
                        type="text" 
                        value={req.field} 
                        onChange={(e) => handleRequirementChange(index, 'field', e.target.value)} 
                        placeholder="Field Name (e.g., license_plate)" 
                        required 
                        className="req-field-input" 
                        disabled={loading}
                      /> 
                      <input 
                        type="text" 
                        value={req.description} 
                        onChange={(e) => handleRequirementChange(index, 'description', e.target.value)} 
                        placeholder="Field Description" 
                        required 
                        className="req-desc-input" 
                        disabled={loading}
                      /> 
                      <button 
                        onClick={() => handleRemoveRequirement(index)} 
                        disabled={dataRequirements.length <= 1 || loading} 
                        className="remove-req-btn" 
                        title="Remove"
                      >
                        &times;
                      </button> 
                    </div> 
                 ))}
                 <button 
                   onClick={handleAddRequirement} 
                   className="add-req-btn" 
                   disabled={loading}
                 >
                   + Add Requirement
                 </button>
             </div>
             
             <div className="form-group file-upload-group">
                 <label htmlFor="workflowMarkdown">Upload Markdown Template *</label>
                 <div className="file-input-wrapper"> 
                   <input 
                     type="file" 
                     id="workflowMarkdown" 
                     accept=".md" 
                     onChange={handleFileChange} 
                     required 
                     className="file-input-hidden" 
                     disabled={loading}
                   /> 
                   <label 
                     htmlFor="workflowMarkdown" 
                     className={`file-input-label ${loading ? 'disabled' : ''}`}
                   >
                     {markdownFileName ? markdownFileName : 'Choose Markdown File...'}
                   </label> 
                 </div>
                 {markdownFileName && <span className="file-selected-text">Selected: {markdownFileName}</span>}
             </div>
             
             <div className="creator-actions"> 
               <button 
                 onClick={handleNextStage} 
                 disabled={loading || !isStage1Valid()} 
                 className="btn-primary"
               >
                 {loading ? 'Processing...' : 'Next: Edit Template'}
               </button> 
             </div>
          </div>
      )}

      {/* --- Stage 2 Template Editing --- */}
      {stage === 2 && (
        <div className="stage-content">
          <h3>Stage 2: Customize Template</h3>
          <p>
            Edit the markdown template below. To add a data field, click on a field name from the list below
            or position your cursor where you want to insert the field and then click on a field name.
          </p>

          {/* Field Selection */}
          <div className="field-selector">
            <h4>Available Fields</h4>
            <div className="available-fields">
              {dataRequirements.map((req, index) => (
                <button
                  key={index}
                  className="field-button"
                  onClick={() => handleInsertField(req.field)}
                  title={req.description}
                >
                  {req.field}
                </button>
              ))}
            </div>
          </div>

          {/* Markdown Editor */}
          <div className="markdown-editor-container">
            <div className="markdown-editor-header">
              <span className="markdown-editor-title">Edit Template</span>
            </div>
            <textarea
              ref={markdownEditorRef}
              className="markdown-editor"
              value={editableMarkdown}
              onChange={(e) => setEditableMarkdown(e.target.value)}
              placeholder="Edit your markdown template here..."
              rows={15}
              disabled={loading}
            />
          </div>
          
          {/* Preview */}
          <div className="markdown-preview-container">
            <div className="markdown-preview-header">
              <span className="markdown-preview-title">Preview</span>
            </div>
            <div className="markdown-preview">
              <ReactMarkdown>{editableMarkdown}</ReactMarkdown>
            </div>
          </div>

          {/* Action Buttons for Stage 2 */} 
          <div className="creator-actions">
            <button 
              onClick={() => { 
                setStage(1); 
                setError(null); 
              }} 
              className="btn-secondary" 
              disabled={loading}
            >
              Back to Details
            </button>
            <button
              onClick={handleSaveWorkflow}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : 'Save Workflow'}
            </button>
            <button
              onClick={handleRemoveTemplate}
              disabled={loading}
              className="btn-secondary"
            >
              Remove Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowCreator; 