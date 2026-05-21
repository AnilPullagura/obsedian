import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Oval } from 'react-loader-spinner';
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

  // API Call Callback function
  const getProducts = async () => {
    setApiStatus(apiStatusConstants.loading);
    setErrMsg('');

    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Assuming products endpoint returns an array in data.products
        setApiResult(data.products || data);
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
  };

  useEffect(() => {
    getProducts();
  }, []);

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
