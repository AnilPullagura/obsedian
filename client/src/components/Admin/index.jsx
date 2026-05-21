import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { Oval } from 'react-loader-spinner';
import { API_ENDPOINTS } from '../../apiConfig';
import './index.css';

export const adminApiStatusConstants = {
  initial: 'INITIAL',
  loading: 'LOADING',
  success: 'SUCCESS',
  failure: 'FAILURE',
};

const Admin = () => {
  const [apiStatus, setApiStatus] = useState(adminApiStatusConstants.initial);
  const [usersList, setUsersList] = useState([]);
  const [errMsg, setErrMsg] = useState('');
  const [actionLoadingUserId, setActionLoadingUserId] = useState(null);

  const navigate = useNavigate();

  const fetchAllUsers = useCallback(async () => {
    const token = Cookies.get('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setApiStatus(adminApiStatusConstants.loading);
    setErrMsg('');

    try {
      const response = await fetch(API_ENDPOINTS.users || `${window.location.origin}/api/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const { users } = data;
        setUsersList(users);
        setApiStatus(adminApiStatusConstants.success);
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401 || response.status === 403) {
          Cookies.remove('token');
          localStorage.removeItem('user');
          navigate('/login', { replace: true });
          return;
        }

        setErrMsg(errorData.message || `Status Code: ${response.status}`);
        setApiStatus(adminApiStatusConstants.failure);
      }
    } catch (error) {
      setErrMsg(error.message || 'Connecting to secure administrative node failed');
      setApiStatus(adminApiStatusConstants.failure);
    }
  }, [navigate]);

  useEffect(() => {
    const token = Cookies.get('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role !== 'admin') {
        navigate('/', { replace: true });
        return;
      }
    } catch (e) {
      navigate('/login', { replace: true });
      return;
    }

    fetchAllUsers();
  }, [navigate, fetchAllUsers]);

  const handleTogglePermission = async (userId, currentVal) => {
    const token = Cookies.get('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setActionLoadingUserId(userId);
    const targetPermission = !currentVal;

    try {
      const response = await fetch(`${API_ENDPOINTS.users || `${window.location.origin}/api/users`}/${userId}/permission`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ permission_to_crud: targetPermission }),
      });

      if (response.ok) {
        await fetchAllUsers();
      } else {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          Cookies.remove('token');
          navigate('/login', { replace: true });
          return;
        }
        alert(errData.message || 'Failed to modify database CRUD variables');
      }
    } catch (error) {
      alert('Communication error updating database credentials');
    } finally {
      setActionLoadingUserId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    const isConfirmed = window.confirm('CRITICAL ACTION: Are you absolute in terminating this user credential token? This cannot be undone.');
    if (!isConfirmed) return;

    const token = Cookies.get('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setActionLoadingUserId(userId);
    try {
      const response = await fetch(`${API_ENDPOINTS.users || `${window.location.origin}/api/users`}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchAllUsers();
      } else {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 401 || response.status === 403) {
          Cookies.remove('token');
          navigate('/login', { replace: true });
          return;
        }
        alert(errData.message || 'Failed to remove user credential ledger');
      }
    } catch (error) {
      alert('Communication failure executing deletion');
    } finally {
      setActionLoadingUserId(null);
    }
  };

  const renderLoadingView = () => (
    <div className="admin-status-wrapper">
      <Oval height={50} width={50} color="#E91E63" secondaryColor="#333" strokeWidth={4} />
      <p className="admin-status-title">Establishing encrypted ledger connection...</p>
    </div>
  );

  const renderFailureView = () => (
    <div className="admin-status-wrapper error-border">
      <span className="material-symbols-outlined error-icon">warning</span>
      <h3 className="admin-status-title error-text">Ledger Interrogation Failed</h3>
      <p className="admin-status-sub">{errMsg}</p>
      <button type="button" className="admin-action-btn" onClick={fetchAllUsers}>
        Re-verify System Access Node
      </button>
    </div>
  );

  const renderSuccessView = () => {
    const totalUsers = usersList.length;
    const adminsCount = usersList.filter(u => u.role === 'admin').length;
    const operatorsCount = usersList.filter(u => u.permission_to_crud).length;

    return (
      <div className="admin-dashboard-layout animate-fade-in">
        <section className="admin-metrics-row">
          <div className="metric-glass-card glass-surface">
            <div className="metric-icon-box">
              <span className="material-symbols-outlined metric-icon">groups</span>
            </div>
            <div className="metric-details">
              <span className="metric-lbl">Total Operators</span>
              <h2 className="metric-num">{totalUsers}</h2>
            </div>
          </div>

          <div className="metric-glass-card glass-surface">
            <div className="metric-icon-box gold">
              <span className="material-symbols-outlined metric-icon">admin_panel_settings</span>
            </div>
            <div className="metric-details">
              <span className="metric-lbl">System Administrators</span>
              <h2 className="metric-num">{adminsCount}</h2>
            </div>
          </div>

          <div className="metric-glass-card glass-surface">
            <div className="metric-icon-box rose">
              <span className="material-symbols-outlined metric-icon">vpn_key</span>
            </div>
            <div className="metric-details">
              <span className="metric-lbl">CRUD Credentials Granted</span>
              <h2 className="metric-num">{operatorsCount}</h2>
            </div>
          </div>

          <div className="metric-glass-card glass-surface">
            <div className="metric-icon-box green">
              <span className="material-symbols-outlined metric-icon">dns</span>
            </div>
            <div className="metric-details">
              <span className="metric-lbl">Database Ledger Connection</span>
              <h2 className="metric-num active">ONLINE</h2>
            </div>
          </div>
        </section>

        <section className="admin-table-container glass-card glow-border-rose">
          <div className="table-header-block">
            <h2 className="table-block-title">Encrypted Credentials Registry</h2>
            <p className="table-block-sub">
              Manage system permissions, grant product catalog CRUD access overrides, or revoke credential tokens.
            </p>
          </div>

          <div className="table-responsive-wrapper">
            <table className="admin-cyber-table">
              <thead>
                <tr>
                  <th>Identity ID</th>
                  <th>Operator Name</th>
                  <th>Secure Email</th>
                  <th>System Role</th>
                  <th>Catalog CRUD Authority</th>
                  <th className="text-center">Action Handshake</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((user) => {
                  const isActionLoading = actionLoadingUserId === user.id;
                  
                  return (
                    <tr key={user.id}>
                      <td className="code">#{user.id}</td>
                      <td>
                        <span className="name-bold">{user.name}</span>
                      </td>
                      <td className="code">{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="toggle-slider-box">
                          <label className={`switch-container ${user.role === 'admin' ? 'disabled' : ''}`}>
                            <input 
                              type="checkbox" 
                              checked={user.permission_to_crud || user.role === 'admin'}
                              onChange={() => handleTogglePermission(user.id, user.permission_to_crud)}
                              disabled={isActionLoading || user.role === 'admin'}
                            />
                            <span className="slider-switch round"></span>
                          </label>
                          <span className={`permission-lbl ${user.permission_to_crud || user.role === 'admin' ? 'active' : 'inactive'}`}>
                            {user.role === 'admin' || user.permission_to_crud ? 'AUTHORIZED' : 'LOCKED'}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="revoke-btn"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={isActionLoading || user.role === 'admin'}
                          title={user.role === 'admin' ? 'Administrator token cannot be deleted' : 'Revoke Credential Token'}
                        >
                          {isActionLoading ? (
                            <Oval height={12} width={12} color="#fff" strokeWidth={5} />
                          ) : (
                            <>
                              <span className="material-symbols-outlined inline-icon">no_accounts</span>
                              Revoke
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="table-footer-actions">
            <span className="aes-text">🔐 Security Handshake Protocol: AES-256 Enabled</span>
            <button type="button" className="refresh-table-btn" onClick={fetchAllUsers} disabled={apiStatus === adminApiStatusConstants.loading}>
              <span className="material-symbols-outlined">sync</span> Synchronize Ledger
            </button>
          </div>
        </section>
      </div>
    );
  };

  const renderContent = () => {
    switch (apiStatus) {
      case adminApiStatusConstants.loading:
        return renderLoadingView();
      case adminApiStatusConstants.success:
        return renderSuccessView();
      case adminApiStatusConstants.failure:
        return renderFailureView();
      default:
        return null;
    }
  };

  return (
    <main className="admin-page-view animate-fade-in">
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1 className="admin-title">Obsidian Luxe Control Station</h1>
          <p className="admin-subtitle">Operational Core Management Center</p>
        </div>
        {renderContent()}
      </div>
    </main>
  );
};

export default Admin;
