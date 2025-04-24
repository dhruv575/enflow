import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [rememberMe, setRememberMe] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value
    });
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!loginData.email.trim()) 
      errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(loginData.email))
      errors.email = 'Please enter a valid email address';
    
    if (!loginData.password) 
      errors.password = 'Password is required';
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      setLoginError('');
      
      try {
        // Call auth API to login
        const response = await authService.login({
          email: loginData.email,
          password: loginData.password
        });
        
        // Use the context's login function which handles persistence
        login(response.data.token, response.data.user);
        
        // If "Remember Me" is checked, save email to localStorage
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', loginData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        setIsSubmitting(false);
        
        // Redirect to dashboard
        navigate('/dashboard');
        
      } catch (error) {
        setIsSubmitting(false);
        setLoginError(error.message || 'Invalid email or password. Please try again.');
        console.error('Login error:', error);
      }
    }
  };

  // Check for remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setLoginData(prevState => ({
        ...prevState,
        email: rememberedEmail
      }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="login-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-box">
            <div className="auth-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account</p>
            </div>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email"
                  name="email"
                  value={loginData.email}
                  onChange={handleChange}
                  className={formErrors.email ? 'error' : ''}
                />
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleChange}
                  className={formErrors.password ? 'error' : ''}
                />
                {formErrors.password && <span className="error-message">{formErrors.password}</span>}
              </div>
              
              <div className="form-actions-row">
                <div className="remember-me">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    checked={rememberMe}
                    onChange={handleRememberMeChange}
                  />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <a href="/forgot-password" className="forgot-password">Forgot password?</a>
              </div>
              
              {loginError && <div className="submit-error">{loginError}</div>}
              
              <button 
                type="submit" 
                className="btn btn-primary btn-block"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
              
              <div className="department-creation-link">
                <p>Need to create a new department? <Link to="/department-creation">Click here</Link></p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 