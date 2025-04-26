// API Service for Enflow
const API_BASE_URL = 'https://droov-enflow-api.hf.space';

// Helper function for making API requests
async function fetchAPI(endpoint, options = {}) {
  // Clean up endpoint slashes, but preserve trailing slash if present
  let cleanedEndpoint = endpoint;
  if (cleanedEndpoint.startsWith('/')) {
    cleanedEndpoint = cleanedEndpoint.substring(1);
  }
  // Do NOT remove trailing slash if endpoint originally had one
  // const cleanedEndpoint = endpoint.replace(/^\/+/, '').replace(/\/+$/, '');
  const url = `${API_BASE_URL}/api/${cleanedEndpoint}`;
  
  // Log the url to debug
  console.log('Full API URL constructed:', url);
  console.log('Making API request to:', url);
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // If FormData is being sent, remove the Content-Type header
  // to let the browser set it with the boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  // Include auth token if available
  let token = null;
  const tokenData = localStorage.getItem('tokenData');
  if (tokenData) {
    try {
      const parsed = JSON.parse(tokenData);
      token = parsed.token;
    } catch (e) {
      console.error('Error parsing token data:', e);
    }
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    console.log(`API Request: ${config.method || 'GET'} ${url}`, options.body instanceof FormData ? 'FormData' : (options.body ? JSON.parse(options.body) : ''));
    
    // For PUT requests with JSON body, log the stringified content
    if (config.method === 'PUT' && typeof options.body === 'string') {
      console.log('PUT request body string length:', options.body.length);
      try {
        const bodyObj = JSON.parse(options.body);
        if (bodyObj.markdown_template) {
          console.log('markdown_template length in request:', bodyObj.markdown_template.length);
          console.log('First 100 chars of markdown_template:', bodyObj.markdown_template.substring(0, 100));
        }
      } catch (e) {
        console.error('Error parsing request body for logging:', e);
      }
    }
    
    const response = await fetch(url, config);
    
    // Try to parse JSON, but handle cases where there might be no body (e.g., 204 No Content)
    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else if (response.ok && response.status !== 204) {
       // If it's not JSON but response is ok and not empty, read as text 
       // (or handle other types if needed). For now, just log warning.
       console.warn('Received non-JSON response for OK status:', response.status, response.headers.get('content-type'));
       data = { message: `Request successful with status ${response.status}` }; // Provide a default success object
    }

    if (!response.ok) {
      // Use message from JSON data if available, otherwise use status text
      const errorMessage = data?.message || data?.error || response.statusText || 'An error occurred with the API';
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
        url: url,
        method: config.method || 'GET'
      });
      
      // Provide more detailed error for debugging common issues
      if (response.status === 401) {
        throw new Error(`Authentication error: ${errorMessage}. Please log in again.`);
      } else if (response.status === 403) {
        throw new Error(`Permission denied: ${errorMessage}. You don't have the required permissions.`);
      } else if (response.status === 500) {
        // Log internal server errors with more detail for debugging
        console.error('Server Error Details:', data);
        throw new Error(`Server error: ${errorMessage}. Check backend logs for details.`);
      } else {
        throw new Error(errorMessage);
      }
    }

    console.log(`API Response: ${config.method || 'GET'} ${url}`, data);
    return { data, status: response.status };
  } catch (error) {
    console.error(`API Error (${config.method || 'GET'} ${url}):`, error);
    throw error; // Re-throw the error after logging
  }
}

// Auth services
export const authService = {
  login: async (credentials) => {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },
  
  logout: async () => {
    // Logout might not need credentials/body depending on backend implementation
    // Assuming it just needs the token in the header
    return fetchAPI('/auth/logout', {
      method: 'POST' 
    });
  },
  
  verifyToken: async () => {
    // Use the /auth/me endpoint to check if token is valid
    return fetchAPI('/auth/me'); 
  }
};

// Department services
export const departmentService = {
  // Note: Original create route was /departments, but we use /departments/with-admin
  // Let's keep createWithDepartment and potentially remove/rename this one if not needed
  /*
  create: async (departmentData) => {
    return fetchAPI('/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData)
    });
  },
  */
  
  getAll: async () => {
    return fetchAPI('/departments');
  },
  
  getById: async (id) => {
    return fetchAPI(`/departments/${id}`);
  },
  
  getMembers: async (departmentId) => {
    console.log(`Calling getMembers with departmentId: ${departmentId}`);
    
    // Ensure URL starts with a slash for consistency
    const response = await fetchAPI(`/departments/${departmentId}/members`);
    
    // Transform the response to match what the component expects
    // The component expects members directly on the response object
    if (response && response.data && response.data.members) {
      return {
        members: response.data.members,
        status: response.status
      };
    }
    
    return response; // Return original response if the format is unexpected
  },
  
  debugDepartment: async (departmentId) => {
    console.log(`Calling debugDepartment with departmentId: ${departmentId}`);
    return fetchAPI(`/departments/${departmentId}/debug`);
  },
  
  addMember: async (departmentId, userData) => {
    return fetchAPI(`/departments/${departmentId}/members`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  addMembersCSV: async (departmentId, formData) => {
    // The correct endpoint for CSV upload
    return fetch(`${API_BASE_URL}/api/departments/${departmentId}/members/csv`, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('tokenData'))?.token || ''}`
      },
      body: formData
    }).then(async response => {
      let data = null;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Error parsing response:', e);
      }
      
      if (!response.ok) {
        throw new Error(data?.message || data?.error || response.statusText || 'Failed to upload CSV');
      }
      
      return { data, status: response.status };
    });
  },
  
  removeMember: async (departmentId, userId) => {
    return fetchAPI(`/departments/${departmentId}/members/${userId}`, {
      method: 'DELETE'
    });
  },
  
  updateMemberPermissions: async (departmentId, userId, permissionsData) => {
    return fetchAPI(`/departments/${departmentId}/members/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(permissionsData)
    });
  },
  
  resetPassword: async (departmentId, userId) => {
    return fetchAPI(`/departments/${departmentId}/members/${userId}/reset-password`, {
      method: 'POST'
    });
  }
};

// User services
export const userService = {
  create: async (userData) => {
    return fetchAPI('users', { 
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  // Endpoint used by DepartmentCreation page
  createWithDepartment: async (departmentWithAdmin) => {
    // The department route is registered with an empty string at the end
    // This needs to match the route in the backend
    return fetchAPI('departments', {
      method: 'POST',
      body: JSON.stringify(departmentWithAdmin)
    });
  },
  
  createBulk: async (users) => {
    return fetchAPI('users/bulk', {
      method: 'POST',
      body: JSON.stringify(users)
    });
  },
  
  getAll: async () => {
    return fetchAPI('users');
  },
  
  getById: async (id) => {
    return fetchAPI(`users/${id}`);
  },
  
  update: async (id, userData) => {
    return fetchAPI(`users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },
  
  // Update user profile (name, position)
  updateProfile: async (profileData) => {
    return fetchAPI('auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },
  
  // Function to update password
  updatePassword: async (passwordData) => {
    return fetchAPI('auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  },
  
  delete: async (id) => {
    return fetchAPI(`users/${id}`, {
      method: 'DELETE'
    });
  }
};

// Workflow services
export const workflowService = {
  create: async (workflowData) => {
    // Uses fetchAPI, endpoint needs leading slash AND trailing slash to match route definition
    return fetchAPI('/workflows/', {
      method: 'POST',
      body: JSON.stringify(workflowData)
    });
  },
  
  getAll: async () => {
    // Endpoint needs trailing slash as defined in backend route
    return fetchAPI('/workflows/'); 
  },
  
  getById: async (id) => {
    return fetchAPI(`/workflows/${id}`);
  },
  
  update: async (id, workflowData) => {
    console.log('Workflow update API call with ID:', id);
    console.log('Workflow update data:', workflowData);
    return fetchAPI(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflowData)
    });
  },
  
  delete: async (id) => {
    return fetchAPI(`/workflows/${id}`, {
      method: 'DELETE'
    });
  },

  // --- NEW FUNCTIONS --- 

  uploadForm: async (workflowId, formData) => {
    return fetchAPI(`/workflows/${workflowId}/forms`, {
      method: 'POST',
      headers: {
        // Remove Content-Type for FormData - browser will set it with proper boundary
      },
      body: formData
    });
  },

  removeForm: async (workflowId) => {
    return fetchAPI(`/workflows/${workflowId}/forms`, {
      method: 'DELETE'
    });
  },

  addFormField: async (workflowId, fieldData) => {
    return fetchAPI(`/workflows/${workflowId}/form-fields`, {
      method: 'POST',
      body: JSON.stringify(fieldData)
    });
  }

  // Potentially add removeFormField, removeDataRequirement etc. later if needed
};

// Log services
export const logService = {
  upload: async (logData) => {
    const formData = new FormData();
    formData.append('logFile', logData.file);
    formData.append('date', logData.date);
    
    return fetchAPI('/logs/upload', {
      method: 'POST',
      headers: {},
      body: formData
    });
  },
  
  classify: async (formData) => {
    console.log('Inside apiService.logs.classify');
    console.log('FormData keys:', [...formData.keys()]);
    console.log('FormData value for "file":', formData.get('file'));
    console.log('FormData value for "log_date":', formData.get('log_date'));

    if (!formData.has('file') || !formData.get('file')) {
        console.error('FormData is missing the "file" key or its value is empty before fetch!');
    }

    return fetch(`${API_BASE_URL}/api/logs/classify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('tokenData'))?.token || ''}`
      },
      body: formData
    }).then(async response => {
      let data = null;
      const contentType = response.headers.get("content-type");
      try {
          if (contentType && contentType.indexOf("application/json") !== -1) {
              data = await response.json();
          } else if (!response.ok) {
             const text = await response.text();
             console.error("Non-JSON error response text:", text);
             data = { message: `Server error ${response.status}. Check console for details.` };
          }
      } catch (e) {
        console.error('Error processing response:', e);
        data = { message: `Failed to parse server response. Status: ${response.status}` };
      }

      if (!response.ok) {
        throw new Error(data?.message || `HTTP error! status: ${response.status}`);
      }

      return { data: data || { message: "Success" }, status: response.status };
    });
  },
  
  getUserLogs: async () => {
    return fetchAPI('logs/user');
  },
  
  getById: async (id) => {
    return fetchAPI(`logs/${id}`);
  },
  
  processSync: async (id) => {
    return fetchAPI(`logs/${id}/process-sync`, {
      method: 'POST'
    });
  }
};

// Incident services
export const incidentService = {
  // Get the user's own incidents
  getUserIncidents: async () => {
    return fetchAPI('incidents/user');
  },
  
  // Get department incidents (admin only)
  getDepartmentIncidents: async () => {
    return fetchAPI('incidents/department');
  },
  
  getById: async (id) => {
    return fetchAPI(`incidents/${id}`);
  },
  
  getByDateRange: async (dateData) => {
    return fetchAPI('incidents/date-range', {
      method: 'POST',
      body: JSON.stringify(dateData)
    });
  },
  
  getByWorkflow: async (workflowId) => {
    return fetchAPI(`incidents/workflow/${workflowId}`);
  },
  
  // Process an incident synchronously (without using Celery)
  processSync: async (id) => {
    return fetchAPI(`incidents/${id}/process`, {
      method: 'POST'
    });
  },
  
  // Get all incidents with filter options
  getIncidents: async (filters = {}) => {
    return fetchAPI('incidents', {
      method: 'POST',
      body: JSON.stringify(filters)
    });
  },
  
  // Create an incident from an activity
  createFromActivity: async (activityData) => {
    // Make sure activityData includes the log_text if it's not already provided
    if (!activityData.log_text && activityData.extracted_text) {
      activityData.log_text = activityData.extracted_text;
    }
    
    return fetchAPI('incidents/create-from-activity', {
      method: 'POST',
      body: JSON.stringify(activityData)
    });
  }
};

// Helper function to format the response and extract password data if available
function processUserResponse(response) {
  // Check if we have a valid user response
  const userData = response.data && response.data.user ? response.data.user 
                 : response.user ? response.user 
                 : null;
                 
  if (userData) {
    // Check for password data and ensure it's accessible
    if (userData.raw_password) {
      // Password is already in the user data
      return userData;
    } else if (response.data && response.data.new_password) {
      // Some APIs return password in the root response
      userData.raw_password = response.data.new_password;
      return userData;
    } else if (response.new_password) {
      // Another possible response format
      userData.raw_password = response.new_password;
      return userData;
    }
  }
  return userData || null;
}

// Create the API service object
const apiService = {
  auth: authService,
  departments: departmentService,
  users: userService,
  workflows: workflowService,
  logs: logService,
  incidents: incidentService
};

export default apiService; 