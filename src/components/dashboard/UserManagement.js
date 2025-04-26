import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { departmentService, userService } from '../../services/api';
import '../../styles/global.css';
import './UserManagement.css';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Debug: Log current user on component mount
  useEffect(() => {
    if (user) {
      console.log('Current authenticated user:', user);
      console.log('User ID:', user._id);
      console.log('Department ID:', user.department_id);
    }
  }, [user]);
  
  // State for adding a new user
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    position: '',
    permissions: 'User'
  });
  const [userError, setUserError] = useState({});
  
  // Success modal for showing new user password
  const [successModal, setSuccessModal] = useState({
    show: false,
    user: null
  });
  
  // State for CSV upload
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvFile, setCSVFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadResults, setUploadResults] = useState(null);
  
  // Confirmation modals
  const [deleteConfirmation, setDeleteConfirmation] = useState({ show: false, userId: null });
  const [promoteConfirmation, setPromoteConfirmation] = useState({ show: false, userId: null, currentPermissions: null });
  // State for password viewing modal
  const [passwordModal, setPasswordModal] = useState({ show: false, user: null });
  // Add state for copy notification
  const [copySuccess, setCopySuccess] = useState(false);
  
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Using departmentService.getMembers to get department users
      if (user && user.department_id) {
        const response = await departmentService.getMembers(user.department_id);
        
        // Debug: Log the complete received data
        console.log('Complete members response:', response);
        
        // Handle different response formats
        let membersArray = null;
        if (response && response.data && Array.isArray(response.data.members)) {
          // Format: { data: { members: [...] } }
          membersArray = response.data.members;
          console.log('Found members in response.data.members:', membersArray.length);
        } else if (response && Array.isArray(response.data)) {
          // Format: { data: [...] }
          membersArray = response.data;
          console.log('Found members in response.data array:', membersArray.length);
        } else if (response && Array.isArray(response.members)) {
          // Format: { members: [...] }
          membersArray = response.members;
          console.log('Found members in response.members:', membersArray.length);
        } else if (response && Array.isArray(response)) {
          // Format: [...]
          membersArray = response;
          console.log('Response itself is an array:', membersArray.length);
        }
        
        if (membersArray) {
          // Filter out any undefined or null values before setting users
          const validMembers = membersArray.filter(member => member && typeof member === 'object');
          console.log('Valid members after filtering:', validMembers.length);
          setUsers(validMembers);
        } else {
          console.error('Could not find members array in response:', response);
          setError('Received invalid data format from server');
          setUsers([]);
        }
      } else {
        setError('No department associated with current user');
      }
    } catch (err) {
      console.error('Error fetching department users:', err);
      setError('Failed to load users. Please try again later.');
      setUsers([]); // Ensure users is set to an empty array on error
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, [user]);

  // CSV file handling
  const handleCSVChange = (e) => {
    setCSVFile(e.target.files[0]);
    setUploadStatus('');
    setUploadResults(null);
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      setUploadStatus('Please select a CSV file');
      return;
    }

    setUploadStatus('Uploading...');
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      
      const response = await departmentService.addMembersCSV(user.department_id, formData);
      
      setUploadResults(response);
      setUploadStatus('Upload complete');
      
      // Refresh the user list
      fetchUsers();
    } catch (err) {
      console.error('Error uploading CSV:', err);
      setUploadStatus('Upload failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Add user form handling
  const handleInputChange = (e) => {
    setNewUser({
      ...newUser,
      [e.target.name]: e.target.value
    });
    
    // Clear validation error when user corrects field
    if (userError[e.target.name]) {
      setUserError({
        ...userError,
        [e.target.name]: null
      });
    }
  };

  const validateUser = () => {
    const errors = {};
    
    if (!newUser.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!newUser.name) {
      errors.name = 'Name is required';
    }
    
    if (!newUser.position) {
      errors.position = 'Position is required';
    }
    
    setUserError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (!validateUser()) {
      return;
    }
    
    // Verify that user and department_id exist before making the API call
    if (!user || !user.department_id) {
      setError('Cannot determine your department. Please log out and log back in.');
      return;
    }
    
    try {
      // Using departmentService.addMember to add a user to the department
      const response = await departmentService.addMember(user.department_id, newUser);
      console.log('Add user API response:', response);
      
      // Handle different response formats
      let newUserData = null;
      
      if (response && response.data && response.data.user) {
        newUserData = response.data.user;
      } else if (response && response.user) {
        newUserData = response.user;
      }
      
      // Safely check if we got a valid user object
      if (newUserData && typeof newUserData === 'object' && newUserData._id) {
        // Add the new user to the list with the returned data
        console.log('Adding new user to list:', newUserData);
        setUsers(prevUsers => [...(prevUsers || []), newUserData]);
        
        // Reset form and close modal
        setNewUser({
          email: '',
          name: '',
          position: '',
          permissions: 'User'
        });
        setShowAddUserModal(false);
        
        // Show success modal with password
        setSuccessModal({ show: true, user: newUserData });
      } else {
        console.error('Invalid user data in response:', response);
        setUserError({
          ...userError,
          submit: 'Server returned an invalid user object. Please try again.'
        });
      }
    } catch (err) {
      console.error('Error adding user:', err);
      const errorMsg = err.message || 'Failed to add user. Please try again.';
      setUserError({
        ...userError,
        submit: errorMsg
      });
      
      // Add detailed logging for troubleshooting
      if (errorMsg.includes('current_user')) {
        console.error('Backend error: Missing current_user parameter in add_member function');
      }
    }
  };

  // Delete user handling
  const openDeleteConfirmation = (userId) => {
    setDeleteConfirmation({ show: true, userId });
  };

  const handleDeleteUser = async () => {
    // Verify we have a valid user ID to delete
    if (!deleteConfirmation.userId || !user || !user.department_id) {
      setError('Missing user information. Cannot delete user.');
      setDeleteConfirmation({ show: false, userId: null });
      return;
    }
    
    try {
      // Using departmentService.removeMember to remove a user from the department
      const response = await departmentService.removeMember(user.department_id, deleteConfirmation.userId);
      console.log('Delete user response:', response);
      
      // Remove user from list
      setUsers(prevUsers => (prevUsers || []).filter(user => user && user._id !== deleteConfirmation.userId));
      
      // Close confirmation modal
      setDeleteConfirmation({ show: false, userId: null });
      
      // Show temporary success message
      setError(null);
      
    } catch (err) {
      console.error('Error deleting user:', err);
      
      // Provide more detailed error information
      const errorMsg = err.message || 'Failed to delete user. Please try again.';
      
      // Check for specific error types
      if (errorMsg.includes('current_user')) {
        console.error('Backend error: Missing current_user parameter in remove_member function');
        setError('Backend configuration error. Please contact the administrator.');
      } else {
        setError(`Failed to delete user: ${errorMsg}`);
      }
      
      // Close the confirmation dialog anyway
      setDeleteConfirmation({ show: false, userId: null });
    }
  };

  // Promote/Demote user handling
  const openPromoteConfirmation = (userId, currentPermissions) => {
    setPromoteConfirmation({ show: true, userId, currentPermissions });
  };

  const handleUpdatePermissions = async () => {
    // Verify we have valid data
    if (!promoteConfirmation.userId || !promoteConfirmation.currentPermissions || !user || !user.department_id) {
      setError('Missing user information. Cannot update permissions.');
      setPromoteConfirmation({ show: false, userId: null, currentPermissions: null });
      return;
    }
    
    try {
      const newPermissions = promoteConfirmation.currentPermissions === 'Admin' ? 'User' : 'Admin';
      const action = promoteConfirmation.currentPermissions === 'Admin' ? 'demoting' : 'promoting';
      
      console.log(`${action} user ${promoteConfirmation.userId} to ${newPermissions}`);
      
      // Using departmentService.updateMemberPermissions to update user permissions
      const response = await departmentService.updateMemberPermissions(
        user.department_id, 
        promoteConfirmation.userId, 
        { permissions: newPermissions }
      );
      
      console.log('Update permissions response:', response);
      
      // Verify response contains valid user data
      if (response && response.user && typeof response.user === 'object') {
        // Update user in list
        setUsers(prevUsers => {
          if (!prevUsers) return prevUsers;
          return prevUsers.map(u => {
            if (u && u._id === promoteConfirmation.userId) {
              return response.user;
            }
            return u;
          });
        });
        
        // Show success message (temporarily)
        setError(null);
      } else if (response && response.data && response.data.user) {
        // Handle alternative response format
        setUsers(prevUsers => {
          if (!prevUsers) return prevUsers;
          return prevUsers.map(u => {
            if (u && u._id === promoteConfirmation.userId) {
              return response.data.user;
            }
            return u;
          });
        });
        
        // Show success message (temporarily)
        setError(null);
      } else {
        console.error('Invalid response from updateMemberPermissions:', response);
        setError('Received invalid data from server. User may have been updated, please refresh.');
      }
      
      // Close confirmation modal
      setPromoteConfirmation({ show: false, userId: null, currentPermissions: null });
    } catch (err) {
      console.error('Error updating permissions:', err);
      
      // Provide more detailed error information
      const errorMsg = err.message || 'Failed to update permissions. Please try again.';
      
      // Check for specific error types
      if (errorMsg.includes('current_user')) {
        console.error('Backend error: Missing current_user parameter in update_member_permissions function');
        setError('Backend configuration error. Please contact the administrator.');
      } else {
        setError(`Failed to update permissions: ${errorMsg}`);
      }
      
      // Close confirmation modal anyway
      setPromoteConfirmation({ show: false, userId: null, currentPermissions: null });
    }
  };

  // Check if user is admin
  if (user?.permissions !== 'Admin') {
    return (
      <div className="user-management-tab">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You need administrator permissions to access this page.</p>
        </div>
      </div>
    );
  }

  // Generate a random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Download CSV template
  const downloadCSVTemplate = () => {
    const template = 'email,name,position,permissions\njohndoe@example.com,John Doe,Officer,User\njanedoe@example.com,Jane Doe,Detective,Admin';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'user_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // New function to handle opening the password viewing modal
  const openPasswordModal = (deptUser) => {
    // Reset the copy success state
    setCopySuccess(false);
    setPasswordModal({ show: true, user: deptUser });
  };

  // New function to handle copying the password to clipboard
  const copyPasswordToClipboard = (password) => {
    if (password) {
      navigator.clipboard.writeText(password)
        .then(() => {
          setCopySuccess(true);
          // Auto-hide the success message after 3 seconds
          setTimeout(() => setCopySuccess(false), 3000);
        })
        .catch(err => {
          console.error('Failed to copy password:', err);
          setError('Failed to copy to clipboard. Please try manually selecting the password.');
        });
    }
  };

  // New function to reset a user's password
  const handleResetPassword = async () => {
    if (!passwordModal.user || !user || !user.department_id) {
      setError('Cannot reset password. Missing user information.');
      return;
    }

    try {
      // Call API to reset password
      const response = await departmentService.resetPassword(user.department_id, passwordModal.user._id);
      console.log('Reset password response:', response);
      
      // Extract user data and the new password from the response
      let updatedUser = null;
      let newPassword = null;
      
      if (response.data && response.data.user) {
        updatedUser = response.data.user;
        // The API might return the password separately
        newPassword = response.data.new_password || response.data.rawPassword || response.data.password;
      } else if (response.user) {
        updatedUser = response.user;
        newPassword = response.new_password || response.rawPassword || response.password;
      }
      
      if (updatedUser) {
        // Make sure the password is accessible in the user object
        if (newPassword && !updatedUser.raw_password) {
          updatedUser.raw_password = newPassword;
        }
        
        // Update the user in our list
        setUsers(prevUsers => 
          prevUsers.map(u => u._id === passwordModal.user._id ? updatedUser : u)
        );
        
        // Update the password modal with the new user data
        setPasswordModal(prev => ({ ...prev, user: updatedUser }));
        
        // Show success message
        setError(null);
      } else {
        console.error('Invalid response format from resetPassword:', response);
        setError('Unable to process password reset response. Please try again.');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Failed to reset password. Please try again.');
    }
  };

  return (
    <div className="user-management-tab">
      <div className="user-management-header">
        <h2>Department User Management</h2>
        <div className="user-management-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddUserModal(true)}
          >
            <i className="fas fa-user-plus"></i> Add User
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowCSVModal(true)}
          >
            <i className="fas fa-file-csv"></i> Import CSV
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Position</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-users-message">
                    No users found in your department.
                    <div className="debug-info" style={{ fontSize: '0.8em', color: '#999', marginTop: '10px' }}>
                      Current user ID: {user?._id} | Department ID: {user?.department_id}
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  <tr className="debug-row" style={{ fontSize: '0.8em', color: '#999' }}>
                    <td colSpan="5">
                      Found {users.length} user(s). Current user ID: {user?._id}
                    </td>
                  </tr>
                  {users.filter(deptUser => deptUser && typeof deptUser === 'object').map(deptUser => (
                    <tr key={deptUser._id || 'unknown'} className={user && deptUser && deptUser._id === user._id ? 'current-user' : ''}>
                      <td>{deptUser.name || 'Unknown'}</td>
                      <td>{deptUser.email || 'No email'}</td>
                      <td>{deptUser.position || 'No position'}</td>
                      <td>
                        <span className={`role-badge ${(deptUser.permissions || 'user').toLowerCase()}`}>
                          {deptUser.permissions || 'User'}
                        </span>
                      </td>
                      <td className="action-buttons">
                        {user && deptUser && deptUser._id !== user._id ? (
                          <>
                            {deptUser.permissions === 'User' ? (
                              <button 
                                className="action-button promote-button"
                                onClick={() => openPromoteConfirmation(deptUser._id, deptUser.permissions)}
                                title="Promote to Admin"
                              >
                                <i className="fas fa-arrow-up"></i>
                              </button>
                            ) : (
                              <button 
                                className="action-button demote-button"
                                onClick={() => openPromoteConfirmation(deptUser._id, deptUser.permissions)}
                                title="Demote to User"
                              >
                                <i className="fas fa-arrow-down"></i>
                              </button>
                            )}
                            <button 
                              className="action-button delete-button"
                              onClick={() => openDeleteConfirmation(deptUser._id)}
                              title="Delete User"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </>
                        ) : (
                          <span className="current-user-label">You</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add New User</h3>
              <button className="close-button" onClick={() => setShowAddUserModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form className="add-user-form" onSubmit={handleAddUser}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email"
                  id="email"
                  name="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  className={userError.email ? 'error' : ''}
                />
                {userError.email && <span className="error-message">{userError.email}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input 
                  type="text"
                  id="name"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  className={userError.name ? 'error' : ''}
                />
                {userError.name && <span className="error-message">{userError.name}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="position">Position</label>
                <input 
                  type="text"
                  id="position"
                  name="position"
                  value={newUser.position}
                  onChange={handleInputChange}
                  className={userError.position ? 'error' : ''}
                />
                {userError.position && <span className="error-message">{userError.position}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="permissions">Role</label>
                <select
                  id="permissions"
                  name="permissions"
                  value={newUser.permissions}
                  onChange={handleInputChange}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              
              {/* Show submission errors */}
              {userError.submit && (
                <div className="form-error">
                  <span className="error-message">{userError.submit}</span>
                </div>
              )}
              
              <div className="form-note">
                <p>Note: A random password will be generated and shown after submission.</p>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSVModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Import Users from CSV</h3>
              <button className="close-button" onClick={() => setShowCSVModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form className="csv-upload-form" onSubmit={(e) => {
              e.preventDefault();
              handleCSVUpload();
            }}>
              <div className="csv-template-section">
                <p>Download our CSV template to ensure correct formatting:</p>
                <button 
                  type="button" 
                  className="btn btn-secondary template-button" 
                  onClick={downloadCSVTemplate}
                >
                  <i className="fas fa-download"></i> Download Template
                </button>
              </div>
              
              <div className="csv-upload-section">
                <div className="form-group">
                  <label htmlFor="csv-file">Upload CSV File</label>
                  <input 
                    type="file"
                    id="csv-file"
                    accept=".csv"
                    onChange={handleCSVChange}
                  />
                </div>
                
                {uploadStatus && (
                  <div className={`csv-status ${uploadStatus.includes('Success') ? 'success' : 'error'}`}>
                    {uploadStatus}
                  </div>
                )}
              </div>
              
              <div className="form-note">
                <p>
                  Note: Random passwords will be generated for all users.
                  The results will be displayed after upload.
                </p>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCSVModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!csvFile}>
                  Upload & Import
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <div className="modal-header">
              <h3>Confirm User Deletion</h3>
              <button className="close-button" onClick={() => setDeleteConfirmation({ show: false, userId: null })}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="confirmation-content">
              <p>
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <p>
                All logs and incidents associated with this user will remain in the system.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirmation({ show: false, userId: null })}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteUser}>
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Confirmation Modal */}
      {promoteConfirmation.show && (
        <div className="modal-overlay">
          <div className="modal-content confirmation-modal">
            <div className="modal-header">
              <h3>Confirm User Role Change</h3>
              <button className="close-button" onClick={() => setPromoteConfirmation({ show: false, userId: null, currentPermissions: null })}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="confirmation-content">
              <p>
                Are you sure you want to change this user's role to {promoteConfirmation.currentPermissions === 'Admin' ? 'User' : 'Admin'}?
              </p>
              <p>
                {promoteConfirmation.currentPermissions === 'Admin' ? 'This user will no longer have administrative permissions.' : 'This user will gain administrative permissions.'}
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setPromoteConfirmation({ show: false, userId: null, currentPermissions: null })}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdatePermissions}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Viewing Modal */}
      {passwordModal.show && passwordModal.user && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>User Password</h3>
              <button className="close-button" onClick={() => setPasswordModal({ show: false, user: null })}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="password-content">
              <p>
                <strong>User:</strong> {passwordModal.user.name}
              </p>
              <p>
                <strong>Email:</strong> {passwordModal.user.email}
              </p>
              {(passwordModal.user.raw_password || passwordModal.user.password) ? (
                <div className="password-display">
                  <p>
                    <strong>Password:</strong> 
                    <span className="password-value">{passwordModal.user.raw_password || passwordModal.user.password}</span>
                  </p>
                  <div className="password-actions">
                    <button 
                      className="copy-button"
                      onClick={() => copyPasswordToClipboard(passwordModal.user.raw_password || passwordModal.user.password)}
                    >
                      <i className={copySuccess ? "fas fa-check" : "fas fa-copy"}></i>
                      {copySuccess ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="no-password-message">
                  Password not available. Use the Reset Password button to generate a new password.
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setPasswordModal({ show: false, user: null })}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handleResetPassword}>
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successModal.show && successModal.user && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>New User Added</h3>
              <button className="close-button" onClick={() => setSuccessModal({ show: false, user: null })}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="success-content">
              <div className="success-message">
                <i className="fas fa-check-circle"></i>
                <p>User was successfully added to your department.</p>
              </div>
              
              <p>
                <strong>User:</strong> {successModal.user.name}
              </p>
              <p>
                <strong>Email:</strong> {successModal.user.email}
              </p>
              <p>
                <strong>Position:</strong> {successModal.user.position}
              </p>
              
              <div className="password-section">
                <h4>Login Credentials</h4>
                <div className="credential-row">
                  <span className="credential-label">Email:</span>
                  <span className="credential-value">{successModal.user.email}</span>
                  <button 
                    className="copy-button small" 
                    onClick={() => copyPasswordToClipboard(successModal.user.email)}
                    title="Copy email"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
                <div className="credential-row">
                  <span className="credential-label">Password:</span>
                  <span className="credential-value password">{successModal.user.raw_password || "Password not available"}</span>
                  <button 
                    className="copy-button small" 
                    onClick={() => copyPasswordToClipboard(successModal.user.raw_password)}
                    title="Copy password"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
                <p className="password-note">
                  Please save these credentials. You will need to share them with the user.
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setSuccessModal({ show: false, user: null })}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 