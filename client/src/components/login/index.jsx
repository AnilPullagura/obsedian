import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Oval } from 'react-loader-spinner';
import { API_BASE_URL } from '../../apiConfig';
import './index.css';

// API Status Constants
export const authApiStatusConstants = {
  initial: 'INITIAL',
  loading: 'LOADING',
  success: 'SUCCESS',
  failure: 'FAILURE',
};

const Login = () => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [apiStatus, setApiStatus] = useState(authApiStatusConstants.initial);
  const [errMsg, setErrMsg] = useState('');

  const navigate = useNavigate();

  // Redirect if token already exists (prevent logged in users from visiting auth)
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiStatus(authApiStatusConstants.loading);
    setErrMsg('');

    // Field validations
    if (!email || !password) {
      setErrMsg('Email and password are required');
      setApiStatus(authApiStatusConstants.failure);
      return;
    }
    if (!isLoginTab && !name) {
      setErrMsg('Name is required for registration');
      setApiStatus(authApiStatusConstants.failure);
      return;
    }

    const endpoint = isLoginTab 
      ? `${API_BASE_URL}/api/auth/login` 
      : `${API_BASE_URL}/api/auth/signup`;

    const requestBody = isLoginTab 
      ? { email, password } 
      : { name, email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setApiStatus(authApiStatusConstants.success);
        
        // Destructure exact server response properties: token and user payload
        const { token, user } = data;
        
        // Store JWT token in cookies
        Cookies.set('token', token, { expires: 1 }); // expires in 1 day
        
        // Store user info in localStorage for client-side UI usage if needed
        localStorage.setItem('user', JSON.stringify(user));

        // Use useNavigate with replace to transition routes cleanly (replacing history)
        navigate('/', { replace: true });
      } else {
        setErrMsg(data.message || 'Authentication failed');
        setApiStatus(authApiStatusConstants.failure);
      }
    } catch (error) {
      setErrMsg(error.message || 'Connection to authentication server failed');
      setApiStatus(authApiStatusConstants.failure);
    }
  };

  const toggleTab = () => {
    setIsLoginTab((prev) => !prev);
    setErrMsg('');
    setName('');
    setEmail('');
    setPassword('');
    setApiStatus(authApiStatusConstants.initial);
  };

  // Input change handler callbacks
  const handleNameChange = (e) => setName(e.target.value);
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Tab Headers */}
        <div className="auth-tabs">
          <button 
            type="button" 
            className={`tab-btn ${isLoginTab ? 'active' : ''}`}
            onClick={() => !isLoginTab && toggleTab()}
          >
            Access Login
          </button>
          <button 
            type="button" 
            className={`tab-btn ${!isLoginTab ? 'active' : ''}`}
            onClick={() => isLoginTab && toggleTab()}
          >
            Create Account
          </button>
        </div>

        {/* Auth form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-title">
            {isLoginTab ? 'Obsidian Luxe Vault' : 'Obsidian Luxe Signup'}
          </h2>

          {!isLoginTab && (
            <div className="form-group">
              <label htmlFor="name-input" className="form-label">Full Name</label>
              <input 
                id="name-input"
                type="text" 
                className="form-input" 
                placeholder="Enter your name"
                value={name} 
                onChange={handleNameChange}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email-input" className="form-label">Email Address</label>
            <input 
              id="email-input"
              type="email" 
              className="form-input" 
              placeholder="name@example.com"
              value={email} 
              onChange={handleEmailChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password-input" className="form-label">Password</label>
            <input 
              id="password-input"
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password} 
              onChange={handlePasswordChange}
            />
          </div>

          {errMsg && <p className="auth-error-msg">{errMsg}</p>}

          <button 
            type="submit" 
            className="auth-submit-btn" 
            disabled={apiStatus === authApiStatusConstants.loading}
          >
            {apiStatus === authApiStatusConstants.loading ? (
              <Oval height={18} width={18} color="#FFFFFF" strokeWidth={4} />
            ) : (
              isLoginTab ? 'Unlock Secure Access' : 'Register Account'
            )}
          </button>
        </form>

        <div className="auth-footer-links">
          <Link to="/" className="back-link">← Return to Storefront</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
