import React, { useState } from 'react';
import { userService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './UserSettings.css';

const UserSettings = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    position: user?.position || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [infoUpdateError, setInfoUpdateError] = useState('');
  const [passwordUpdateError, setPasswordUpdateError] = useState('');
  const [infoUpdateSuccess, setInfoUpdateSuccess] = useState(false);
  const [passwordUpdateSuccess, setPasswordUpdateSuccess] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear success messages on new input
    setInfoUpdateSuccess(false);
    setPasswordUpdateSuccess(false);
  };

  // Validate info update form
  const validateInfoForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.position.trim()) errors.position = 'Position is required';
    return errors;
  };

  // Validate password update form
  const validatePasswordForm = () => {
    const errors = {};
    if (!formData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!formData.newPassword) errors.newPassword = 'New password is required';
    else if (formData.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    if (formData.newPassword !== formData.confirmNewPassword) errors.confirmNewPassword = 'Passwords do not match';
    return errors;
  };

  // Handle user info update
  const handleInfoUpdate = async (e) => {
    e.preventDefault();
    const errors = validateInfoForm();
    setFormErrors(errors);
    setInfoUpdateError('');
    setInfoUpdateSuccess(false);

    if (Object.keys(errors).length === 0) {
      setIsUpdatingInfo(true);
      try {
        const updateData = {
          name: formData.name,
          position: formData.position
        };
        
        console.log('Sending profile update:', updateData);
        
        // Call the profile update endpoint
        const response = await userService.updateProfile(updateData);
        
        console.log('Profile update response:', response);
        
        // Update user in the context
        const updatedUser = response.data.user;
        updateUser(updatedUser);
        
        setIsUpdatingInfo(false);
        setInfoUpdateSuccess(true);
      } catch (error) {
        console.error('Profile update error:', error);
        setIsUpdatingInfo(false);
        setInfoUpdateError(error.message || 'Failed to update profile information.');
      }
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    const errors = validatePasswordForm();
    setFormErrors(errors);
    setPasswordUpdateError('');
    setPasswordUpdateSuccess(false);

    if (Object.keys(errors).length === 0) {
      setIsUpdatingPassword(true);
      try {
        const updateData = {
          current_password: formData.currentPassword,
          new_password: formData.newPassword
        };
        
        // Call the password update endpoint
        await userService.updatePassword(updateData);
        
        setIsUpdatingPassword(false);
        setPasswordUpdateSuccess(true);
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        }));
      } catch (error) {
        setIsUpdatingPassword(false);
        setPasswordUpdateError(error.message || 'Failed to update password.');
        console.error('Password update error:', error);
      }
    }
  };

  if (!user) {
    return <div>Loading user settings...</div>; // Or a proper loading indicator
  }

  return (
    <div className="user-settings-tab">
      <h2>User Profile & Settings</h2>
      
      <div className="settings-section">
        <h3>Update Profile Information</h3>
        <form onSubmit={handleInfoUpdate} className="settings-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input 
                type="text" 
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={formErrors.name ? 'error' : ''}
              />
              {formErrors.name && <span className="error-message">{formErrors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
                className="disabled"
              />
              <small>Email cannot be changed.</small>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="position">Position/Title</label>
            <input 
              type="text" 
              id="position"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className={formErrors.position ? 'error' : ''}
            />
            {formErrors.position && <span className="error-message">{formErrors.position}</span>}
          </div>
          
          {infoUpdateError && <div className="submit-error">{infoUpdateError}</div>}
          {infoUpdateSuccess && <div className="submit-success">Profile information updated successfully!</div>}
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isUpdatingInfo}
            >
              {isUpdatingInfo ? 'Updating...' : 'Update Information'}
            </button>
          </div>
        </form>
      </div>

      <div className="settings-section">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordUpdate} className="settings-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input 
              type="password" 
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={formErrors.currentPassword ? 'error' : ''}
            />
            {formErrors.currentPassword && <span className="error-message">{formErrors.currentPassword}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input 
                type="password" 
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={formErrors.newPassword ? 'error' : ''}
              />
              {formErrors.newPassword && <span className="error-message">{formErrors.newPassword}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <input 
                type="password" 
                id="confirmNewPassword"
                name="confirmNewPassword"
                value={formData.confirmNewPassword}
                onChange={handleChange}
                className={formErrors.confirmNewPassword ? 'error' : ''}
              />
              {formErrors.confirmNewPassword && <span className="error-message">{formErrors.confirmNewPassword}</span>}
            </div>
          </div>
          
          {passwordUpdateError && <div className="submit-error">{passwordUpdateError}</div>}
          {passwordUpdateSuccess && <div className="submit-success">Password updated successfully!</div>}
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserSettings; 