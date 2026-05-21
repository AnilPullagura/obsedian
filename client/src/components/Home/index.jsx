import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Oval } from 'react-loader-spinner';
import { API_BASE_URL } from '../../apiConfig';
import './index.css';

// API Status Constants
export const apiStatusConstants = {
  initial: 'INITIAL',
  loading: 'LOADING',
  success: 'SUCCESS',
  failure: 'FAILURE',
};

const Home = () => {
  const [apiStatus, setApiStatus] = useState(apiStatusConstants.initial);
  const [apiResult, setApiResult] = useState([]);
  const [errMsg, setErrMsg] = useState('');

  const navigate = useNavigate();

  // Redirect check: If user is not authenticated (no token), redirect to /login
  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // API Call Callback wrapped in useCallback to prevent hook dependency warnings
  const getProducts = useCallback(async () => {
    setApiStatus(apiStatusConstants.loading);
    setErrMsg('');

    try {
      const token = Cookies.get('token');
      // Using API_BASE_URL variable prefix for hosting adaptability
      const endpoint = `${API_BASE_URL}/api/products`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Exact destructuring of response sent by server: { products }
        const { products } = data;
        
        // Storing products array in state
        setApiResult(products);
        setApiStatus(apiStatusConstants.success);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrMsg(errorData.message || `Error: ${response.status} ${response.statusText}`);
        setApiStatus(apiStatusConstants.failure);
      }
    } catch (error) {
      setErrMsg(error.message || 'Network connection failed');
      setApiStatus(apiStatusConstants.failure);
    }
  }, []);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      getProducts();
    }
  }, [getProducts]);

  // UI Placeholder render handlers for the user to integrate high-fidelity JSX
  const renderLoadingView = () => {
    return (
      <div className="status-container loading-container">
        <Oval
          height={50}
          width={50}
          color="#E91E63"
          secondaryColor="#333"
          strokeWidth={4}
        />
        <p className="status-text">Loading premium catalog...</p>
      </div>
    );
  };

  const renderSuccessView = () => {
    return (
      <div className="status-container success-container">
        <p className="status-text">Successfully retrieved {apiResult.length} products!</p>
        {/*
          USER NOTEs: Write your stunning e-commerce product cards here!
          apiResult is populated with all database products.
          Each product contains: id, name, description, img, price, stock, ratings, availability.
          Example:
          <ul className="products-list">
            {apiResult.map(product => (
              <li key={product.id}>{product.name}</li>
            ))}
          </ul>
        */}
      </div>
    );
  };

  const renderFailureView = () => {
    return (
      <div className="status-container failure-container">
        <p className="status-text failure-text">Oops! Failed to load catalog.</p>
        <p className="error-message-text">{errMsg}</p>
        <button type="button" className="retry-button" onClick={getProducts}>
          Retry Listing
        </button>
      </div>
    );
  };

  const renderContent = () => {
    switch (apiStatus) {
      case apiStatusConstants.loading:
        return renderLoadingView();
      case apiStatusConstants.success:
        return renderSuccessView();
      case apiStatusConstants.failure:
        return renderFailureView();
      default:
        return null;
    }
  };

  return (
    <div className="home-container">
      {renderContent()}
    </div>
  );
};

export default Home;
