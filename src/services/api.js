// API Service for Enflow
const API_BASE_URL = 'https://droov-enflow-api.hf.space';

// Helper function for making API requests
async function fetchAPI(endpoint, options = {}) {
  // Clean up endpoint slashes
  const cleanedEndpoint = endpoint.replace(/^\/+/, '').replace(/\/+$/, '');
  const url = `${API_BASE_URL}/api/${cleanedEndpoint}`;
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

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
    console.log(`API Request: ${config.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body) : '');
    
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
      throw new Error(errorMessage);
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
  }
};

// User services
export const userService = {
  create: async (userData) => {
    // This might be for adding users *after* department exists
    return fetchAPI('/users', { 
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  
  // Endpoint used by DepartmentCreation page
  createWithDepartment: async (departmentWithAdmin) => {
    // POST /api/departments (no trailing slash needed now)
    return fetchAPI('departments', { // Remove trailing slash here
      method: 'POST',
      body: JSON.stringify(departmentWithAdmin)
    });
  },
  
  createBulk: async (users) => {
    return fetchAPI('/users/bulk', {
      method: 'POST',
      body: JSON.stringify(users)
    });
  },
  
  getAll: async () => {
    return fetchAPI('/users');
  },
  
  getById: async (id) => {
    return fetchAPI(`/users/${id}`);
  },
  
  update: async (id, userData) => {
    return fetchAPI(`/users/${id}`, {
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
    return fetchAPI(`/users/${id}`, {
      method: 'DELETE'
    });
  }
};

// Workflow services
export const workflowService = {
  create: async (workflowData) => {
    return fetchAPI('/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData)
    });
  },
  
  getAll: async () => {
    return fetchAPI('/workflows');
  },
  
  getById: async (id) => {
    return fetchAPI(`/workflows/${id}`);
  },
  
  update: async (id, workflowData) => {
    return fetchAPI(`/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflowData)
    });
  },
  
  delete: async (id) => {
    return fetchAPI(`/workflows/${id}`, {
      method: 'DELETE'
    });
  }
};

// Log services
export const logService = {
  upload: async (logData) => {
    const formData = new FormData();
    // Ensure keys match backend expectations (e.g., 'logFile')
    formData.append('logFile', logData.file); 
    formData.append('date', logData.date);
    
    return fetchAPI('/logs/upload', {
      method: 'POST',
      headers: { 
        // Remove Content-Type: application/json for FormData
        // Let the browser set the correct Content-Type with boundary
      },
      body: formData
    });
  },
  
  getAll: async () => {
    return fetchAPI('/logs');
  },
  
  getById: async (id) => {
    return fetchAPI(`/logs/${id}`);
  }
};

// Incident services
export const incidentService = {
  getAll: async () => {
    return fetchAPI('/incidents');
  },
  
  getById: async (id) => {
    return fetchAPI(`/incidents/${id}`);
  }
};

export default {
  auth: authService,
  departments: departmentService,
  users: userService,
  workflows: workflowService,
  logs: logService,
  incidents: incidentService
}; 