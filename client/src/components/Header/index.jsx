import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Oval } from 'react-loader-spinner';
import { API_ENDPOINTS } from '../../apiConfig';
import './index.css';

// API Status State Machine Constants for Header Count Fetch
export const headerApiStatusConstants = {
  initial: 'INITIAL',
  loading: 'LOADING',
  success: 'SUCCESS',
  failure: 'FAILURE',
};

const Header = () => {
  const [apiStatus, setApiStatus] = useState(headerApiStatusConstants.initial);
  const [cartCount, setCartCount] = useState(0);
  const [userProfile, setUserProfile] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const token = Cookies.get('token');

  // Callback to fetch Cart Details from backend
  const getCartDetails = useCallback(async () => {
    const activeToken = Cookies.get('token');
    if (!activeToken) {
      setCartCount(0);
      setApiStatus(headerApiStatusConstants.success);
      return;
    }

    setApiStatus(headerApiStatusConstants.loading);

    try {
      const response = await fetch(API_ENDPOINTS.cart, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Exact destructuring of response sent by server: { cart }
        const { cart } = data;
        
        // Storing necessary aggregate count in state
        setCartCount(cart.totalItemsCount);
        setApiStatus(headerApiStatusConstants.success);
      } else {
        // Handle expired session token during load
        if (response.status === 401) {
          Cookies.remove('token');
          localStorage.removeItem('user');
          navigate('/login', { replace: true });
          return;
        }
        setApiStatus(headerApiStatusConstants.failure);
      }
    } catch (error) {
      setApiStatus(headerApiStatusConstants.failure);
    }
  }, [navigate]);

  // Read User Profile info from local storage
  const syncUserProfile = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUserProfile(JSON.parse(storedUser));
      } catch (e) {
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }
  }, []);

  // Sync token state and pull cart info on mount/session changes
  useEffect(() => {
    if (token) {
      getCartDetails();
      syncUserProfile();
    } else {
      setCartCount(0);
      setUserProfile(null);
    }
  }, [token, getCartDetails, syncUserProfile]);

  // Setup Event Listeners for cart modification broadcasts & session synchronizations
  useEffect(() => {
    const handleCartSync = () => {
      getCartDetails();
    };

    window.addEventListener('cartUpdated', handleCartSync);
    return () => {
      window.removeEventListener('cartUpdated', handleCartSync);
    };
  }, [getCartDetails]);

  // Sign out handler: clears JWT token and user info
  const handleLogout = () => {
    Cookies.remove('token');
    localStorage.removeItem('user');
    setCartCount(0);
    setUserProfile(null);
    navigate('/login', { replace: true });
  };

  const renderCartCountBadge = () => {
    switch (apiStatus) {
      case headerApiStatusConstants.loading:
        return (
          <span className="header-loader">
            <Oval height={12} width={12} color="#E91E63" strokeWidth={5} />
          </span>
        );
      case headerApiStatusConstants.success:
        return <span className="cart-badge">{cartCount}</span>;
      case headerApiStatusConstants.failure:
        return <span className="cart-badge failure" title="Fetch offline">!</span>;
      default:
        return null;
    }
  };

  const isCurrentPath = (path) => location.pathname === path;

  return (
    <header className="main-header-bar glass-surface">
      <div className="header-content-wrapper">
        {/* Brand logo linked to storefront root */}
        <Link to="/" className="header-brand-link">
          <span className="header-brand-title">Obsidian Luxe</span>
        </Link>

        {/* Action Panel */}
        <div className="header-actions-panel">
          {token ? (
            <>
              {/* Navigation targets using Link */}
              <nav className="header-nav-links">
                <Link 
                  to="/" 
                  className={`header-nav-link ${isCurrentPath('/') ? 'active-link' : ''}`}
                >
                  Home
                </Link>

                {userProfile && userProfile.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className={`header-nav-link ${isCurrentPath('/admin') ? 'active-link' : ''}`}
                  >
                    Admin Panel
                  </Link>
                )}

                <Link 
                  to="/cart" 
                  className={`header-cart-indicator ${isCurrentPath('/cart') ? 'active-link' : ''}`}
                >
                  <span className="header-cart-label">Cart</span>
                  {renderCartCountBadge()}
                </Link>
              </nav>

              <div className="header-user-badge">
                <div className="header-user-avatar" title={userProfile ? userProfile.email : 'Authorized Agent'}>
                  <img 
                    alt="User Profile" 
                    className="avatar-img"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjXoMvKpS51SGW-zvecaMfkDTpmuO_XEyDm-cDNdu2i_shRw0IhGskZNZJBi3fl_BZOsoNnJRVM3AzcK9We5U4plGS9-GBDW72TDvSiYPA0NavqIlRm_vAtn5nUIn_lfMQRaCiFyzzjpdrWVHQShJOytdZi0zpyrniR_zTj4xL9YfPe1OoksahqCU_9geE5e9B5vBCDto7Qdi8VjQD_t0pvHC9im85N4B6Nz8EiAKQ1UjQrX8Lkz9zHRZPmVEMsd0QSppoKLtTZmM" 
                  />
                </div>
                <button 
                  type="button" 
                  className="lock-vault-btn" 
                  onClick={handleLogout}
                  title="Lock Vault & Log Out"
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  Lock Vault
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" className="access-vault-link">
              <span className="material-symbols-outlined text-[18px]">lock_open</span>
              Access Vault
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
