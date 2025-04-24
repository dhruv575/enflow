import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import './DepartmentCreation.css';

const DepartmentCreation = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('password'); // 'password', 'form'
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Department form state
  const [departmentData, setDepartmentData] = useState({
    departmentName: '',
    departmentAddress: '',
    departmentWebsite: '',
    adminEmail: '',
    adminName: '',
    adminPassword: '',
    adminConfirmPassword: '',
    adminPosition: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Password validation
  const checkPassword = (e) => {
    e.preventDefault();
    if (password === 'Nsdg@2314') {
      setPasswordError('');
      setStep('form');
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDepartmentData({
      ...departmentData,
      [name]: value
    });
  };

  // Validate the form
  const validateForm = () => {
    const errors = {};
    
    if (!departmentData.departmentName.trim()) 
      errors.departmentName = 'Department name is required';
    
    if (!departmentData.departmentAddress.trim()) 
      errors.departmentAddress = 'Department address is required';
    
    if (!departmentData.adminEmail.trim()) 
      errors.adminEmail = 'Admin email is required';
    else if (!/\S+@\S+\.\S+/.test(departmentData.adminEmail))
      errors.adminEmail = 'Please enter a valid email address';
    
    if (!departmentData.adminName.trim()) 
      errors.adminName = 'Admin name is required';
    
    if (!departmentData.adminPosition.trim()) 
      errors.adminPosition = 'Admin position is required';
    
    if (!departmentData.adminPassword) 
      errors.adminPassword = 'Password is required';
    else if (departmentData.adminPassword.length < 8)
      errors.adminPassword = 'Password must be at least 8 characters';
    
    if (departmentData.adminPassword !== departmentData.adminConfirmPassword)
      errors.adminConfirmPassword = 'Passwords do not match';
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      setSubmitError('');
      
      // Format the data for API (flat structure)
      const flatData = {
        name: departmentData.departmentName,
        address: departmentData.departmentAddress,
        website: departmentData.departmentWebsite || '',
        admin_email: departmentData.adminEmail, // Use snake_case to match backend controller
        admin_name: departmentData.adminName,   // Use snake_case
        admin_password: departmentData.adminPassword, // Use snake_case
        admin_position: departmentData.adminPosition // Use snake_case
      };
      
      try {
        // Call the API to create department with admin using the flat structure
        const response = await userService.createWithDepartment(flatData);
        
        setIsSubmitting(false);
        setSubmitSuccess(true);
        
        // Redirect after success message
        setTimeout(() => {
          navigate('/login');
        }, 3000);
        
      } catch (error) {
        setIsSubmitting(false);
        setSubmitError(error.message || 'There was an error creating the department. Please try again.');
        console.error('Department creation error:', error);
      }
    }
  };

  return (
    <div className="department-creation-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-box">
            {step === 'password' ? (
              <>
                <div className="auth-header">
                  <h2>Department Creation</h2>
                  <p>Enter the secret password to continue</p>
                </div>
                
                <form onSubmit={checkPassword} className="auth-form">
                  <div className="form-group">
                    <label htmlFor="password">Secret Password</label>
                    <input 
                      type="password" 
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={passwordError ? 'error' : ''}
                    />
                    {passwordError && <span className="error-message">{passwordError}</span>}
                  </div>
                  
                  <button type="submit" className="btn btn-primary">Continue</button>
                </form>
              </>
            ) : (
              <>
                <div className="auth-header">
                  <h2>Create New Department</h2>
                  <p>Set up your department and admin account</p>
                </div>
                
                {submitSuccess ? (
                  <div className="success-message">
                    <div className="success-icon">✓</div>
                    <h3>Department Created Successfully!</h3>
                    <p>Your department has been created along with your admin account. You will be redirected to the login page.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="dept-creation-form">
                    <h3>Department Information</h3>
                    
                    <div className="form-group">
                      <label htmlFor="departmentName">Department Name*</label>
                      <input 
                        type="text" 
                        id="departmentName"
                        name="departmentName"
                        value={departmentData.departmentName}
                        onChange={handleChange}
                        className={formErrors.departmentName ? 'error' : ''}
                      />
                      {formErrors.departmentName && <span className="error-message">{formErrors.departmentName}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="departmentAddress">Department Address*</label>
                      <input 
                        type="text" 
                        id="departmentAddress"
                        name="departmentAddress"
                        value={departmentData.departmentAddress}
                        onChange={handleChange}
                        className={formErrors.departmentAddress ? 'error' : ''}
                      />
                      {formErrors.departmentAddress && <span className="error-message">{formErrors.departmentAddress}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="departmentWebsite">Department Website (Optional)</label>
                      <input 
                        type="text" 
                        id="departmentWebsite"
                        name="departmentWebsite"
                        value={departmentData.departmentWebsite}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <h3>Admin Account</h3>
                    <p className="form-info">This will be the first admin user for your department.</p>
                    
                    <div className="form-group">
                      <label htmlFor="adminEmail">Email Address*</label>
                      <input 
                        type="email" 
                        id="adminEmail"
                        name="adminEmail"
                        value={departmentData.adminEmail}
                        onChange={handleChange}
                        className={formErrors.adminEmail ? 'error' : ''}
                      />
                      {formErrors.adminEmail && <span className="error-message">{formErrors.adminEmail}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="adminName">Full Name*</label>
                      <input 
                        type="text" 
                        id="adminName"
                        name="adminName"
                        value={departmentData.adminName}
                        onChange={handleChange}
                        className={formErrors.adminName ? 'error' : ''}
                      />
                      {formErrors.adminName && <span className="error-message">{formErrors.adminName}</span>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="adminPosition">Position/Title*</label>
                      <input 
                        type="text" 
                        id="adminPosition"
                        name="adminPosition"
                        value={departmentData.adminPosition}
                        onChange={handleChange}
                        className={formErrors.adminPosition ? 'error' : ''}
                      />
                      {formErrors.adminPosition && <span className="error-message">{formErrors.adminPosition}</span>}
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="adminPassword">Password*</label>
                        <input 
                          type="password" 
                          id="adminPassword"
                          name="adminPassword"
                          value={departmentData.adminPassword}
                          onChange={handleChange}
                          className={formErrors.adminPassword ? 'error' : ''}
                        />
                        {formErrors.adminPassword && <span className="error-message">{formErrors.adminPassword}</span>}
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="adminConfirmPassword">Confirm Password*</label>
                        <input 
                          type="password" 
                          id="adminConfirmPassword"
                          name="adminConfirmPassword"
                          value={departmentData.adminConfirmPassword}
                          onChange={handleChange}
                          className={formErrors.adminConfirmPassword ? 'error' : ''}
                        />
                        {formErrors.adminConfirmPassword && <span className="error-message">{formErrors.adminConfirmPassword}</span>}
                      </div>
                    </div>
                    
                    {submitError && <div className="submit-error">{submitError}</div>}
                    
                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setStep('password')}
                      >
                        Back
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Creating...' : 'Create Department'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentCreation; 