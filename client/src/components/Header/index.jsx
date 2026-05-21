import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Oval } from 'react-loader-spinner';
import './index.css';

// API Status Constants for Header Cart Count Fetch
export const headerApiStatusConstants = {
  initial: 'INITIAL',
  loading: 'LOADING',
  success: 'SUCCESS',
  failure: 'FAILURE',
};

const Header = () => {
  const [apiStatus, setApiStatus] = useState(headerApiStatusConstants.initial);
  const [apiResult, setApiResult] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  // API Call Callback function to retrieve shopping cart details
  const getCartDetails = async () => {
    setApiStatus(headerApiStatusConstants.loading);
    setErrMsg('');

    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/cart', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Assuming cart endpoint returns: { cart: { items: [], totalItemsCount: N, totalCost: M } }
        setApiResult(data.cart || data);
        setApiStatus(headerApiStatusConstants.success);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrMsg(errorData.message || `Error: ${response.status} ${response.statusText}`);
        setApiStatus(headerApiStatusConstants.failure);
      }
    } catch (error) {
      setErrMsg(error.message || 'Network connection failed');
      setApiStatus(headerApiStatusConstants.failure);
    }
  };

  useEffect(() => {
    getCartDetails();
  }, []);

  // UI Placeholder render handlers for Header elements
  const renderLoadingView = () => {
    return (
      <div className="header-status loading">
        <Oval
          height={16}
          width={16}
          color="#E91E63"
          secondaryColor="#333"
          strokeWidth={4}
        />
      </div>
    );
  };

  const renderSuccessView = () => {
    const totalItemsCount = apiResult ? apiResult.totalItemsCount : 0;
    return (
      <div className="header-status success">
        <span className="cart-badge">{totalItemsCount}</span>
        {/*
          USER NOTEs: Render your beautiful e-commerce shopping cart icon or link here!
          The variable `totalItemsCount` is retrieved dynamically from backend /api/cart.
        */}
      </div>
    );
  };

  const renderFailureView = () => {
    return (
      <div className="header-status failure" title={errMsg}>
        <span className="cart-badge-error">!</span>
      </div>
    );
  };

  const renderCartCount = () => {
    switch (apiStatus) {
      case headerApiStatusConstants.loading:
        return renderLoadingView();
      case headerApiStatusConstants.success:
        return renderSuccessView();
      case headerApiStatusConstants.failure:
        return renderFailureView();
      default:
        return null;
    }
  };

  return (
    <header className="main-header">
      <div className="header-brand">Obsidian Luxe</div>
      <nav className="header-nav">
        {/* Nav Links */}
        <span className="nav-item">Catalog</span>
        <div className="cart-icon-container">
          <span className="nav-item">Cart</span>
          {renderCartCount()}
        </div>
      </nav>
    </header>
  );
};

export default Header;
