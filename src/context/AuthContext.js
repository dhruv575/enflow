import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

// Create the auth context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Check for token and its expiration
      const tokenData = localStorage.getItem('tokenData');
      
      if (tokenData) {
        try {
          const { token, expiry } = JSON.parse(tokenData);
          
          // Check if token has expired
          if (new Date().getTime() > expiry) {
            // Token expired, clear storage
            console.info('Token expired, logging out');
            localStorage.removeItem('tokenData');
            localStorage.removeItem('user');
            setIsLoggedIn(false);
            setUser(null);
          } else {
            // Token still valid, try to verify with server if online
            try {
              await authService.verifyToken();
            } catch (verifyError) {
              console.warn('Token verification failed, but using cached credentials:', verifyError);
              // We'll still use the token as it hasn't expired locally
              // This allows the app to work offline or if server is temporarily unavailable
            }
            
            // Get user info from localStorage
            const userInfo = localStorage.getItem('user');
            if (userInfo) {
              setUser(JSON.parse(userInfo));
            }
            
            setIsLoggedIn(true);
          }
        } catch (error) {
          console.error('Error parsing token data from storage:', error);
          // Clear potentially corrupted data
          localStorage.removeItem('tokenData');
          localStorage.removeItem('user');
          setIsLoggedIn(false);
          setUser(null);
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  // Login function - set token to expire in 30 days
  const login = (token, userData) => {
    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    // Store token with expiry date
    const tokenData = {
      token: token,
      expiry: expiryDate.getTime()
    };
    
    // Store in localStorage
    localStorage.setItem('tokenData', JSON.stringify(tokenData));
    
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    
    setIsLoggedIn(true);
  };

  // Update user function - update the user info in state and localStorage
  const updateUser = (updatedUserData) => {
    if (!updatedUserData) {
      console.error('updateUser called with invalid data');
      return user; // Return current user if no update data
    }
    
    // Get current user data
    const currentUserData = user || {};
    
    // Ensure we preserve the user ID if it's not in the updated data
    if (currentUserData._id && !updatedUserData._id) {
      updatedUserData._id = currentUserData._id;
    }
    
    // Merge the updated data with current data
    const newUserData = { 
      ...currentUserData, 
      ...updatedUserData 
    };
    
    console.log('Updating user data:', newUserData);
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(newUserData));
    
    // Update state
    setUser(newUserData);
    
    return newUserData;
  };

  // Logout function
  const logout = async () => {
    try {
      // Call the logout API
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage and state, even if API call fails
      localStorage.removeItem('tokenData');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 