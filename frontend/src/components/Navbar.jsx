import React, { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ConfirmModal from './ConfirmModal';
import AutoLogoutTimer from './AutoLogoutTimer';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin');

  // Triggered automatically when the persistent countdown reaches zero
  const handleAutoLogout = useCallback(async () => {
    try {
      localStorage.removeItem('studybud_session_expire_at');
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Auto-logout failed:', error);
    }
  }, [logout, navigate]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    navigate(`/?${params.toString()}`);
  };

  const requestLogout = () => {
    setDropdownOpen(false);
    setLogoutOpen(true);
  };

  const confirmLogout = async () => {
    setLogoutLoading(true);
    try {
      localStorage.removeItem('studybud_session_expire_at');
      await logout();
      setLogoutOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setLogoutOpen(false);
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <>
      <nav
        style={{
          background: 'rgba(42, 43, 61, 0.95)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          padding: '0 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '70px',
          borderBottom: '1px solid #40425a',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img
            src="/images/logo.png"
            alt="StudyBud Logo"
            style={{ height: '46px', width: 'auto', display: 'block', objectFit: 'contain' }}
          />
        </Link>

        {!isAuthPage && !isAdminPage && (
          <form
            onSubmit={handleSearch}
            style={{
              flex: 1,
              maxWidth: '480px',
              margin: '0 32px',
              position: 'relative',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="#7a7c90"
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
            >
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="text"
              placeholder="Search for rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%',
                background: '#2a2b3d',
                border: `1px solid ${searchFocused ? '#5ec8e0' : '#40425a'}`,
                borderRadius: '24px',
                padding: '10px 16px 10px 42px',
                color: '#f0f0f5',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 180ms ease, box-shadow 180ms ease',
                boxShadow: searchFocused ? '0 0 0 3px rgba(94, 200, 224, 0.18)' : 'none',
              }}
            />
          </form>
        )}

        <div style={{ position: 'relative', flexShrink: 0 }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: dropdownOpen ? '#2a2b3d' : 'transparent',
                  border: `1px solid ${dropdownOpen ? '#40425a' : 'transparent'}`,
                  borderRadius: 24,
                  padding: '4px 12px 4px 4px',
                  cursor: 'pointer',
                  color: '#f0f0f5',
                }}
              >
                {/* Single enlarged avatar directly filling the countdown timer ring */}
                <AutoLogoutTimer
                  onLogout={handleAutoLogout}
                  timeoutSeconds={user?.session_timeout_seconds || 300}
                  size={44}
                >
                  <img
                    src={user?.avatar || '/images/avatar.svg'}
                    alt={user?.username}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%',
                      display: 'block',
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                  />
                </AutoLogoutTimer>

                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{user.username}</div>
                  <div style={{ fontSize: 11, color: '#7a7c90' }}>@{user.username}</div>
                </div>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="#7a7c90"
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 150ms ease',
                  }}
                >
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    minWidth: 200,
                    background: '#2a2b3d',
                    border: '1px solid #40425a',
                    borderRadius: 12,
                    boxShadow: '0 16px 32px rgba(0,0,0,0.45)',
                    padding: 8,
                    zIndex: 200,
                  }}
                >
                  <Link
                    to={`/profile/${user.id}`}
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      color: '#e8e8ed',
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    Profile
                  </Link>
                  <Link
                    to="/profile/edit"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      color: '#e8e8ed',
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" />
                    </svg>
                    Settings
                  </Link>
                  <div style={{ height: 1, background: '#40425a', margin: '6px 4px' }} />
                  <button
                    type="button"
                    onClick={requestLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      color: '#ff8a70',
                      fontSize: 14,
                      fontWeight: 500,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {location.pathname === '/login' ? (
                <Link
                  to="/register"
                  style={{
                    color: '#1e1f2b',
                    background: '#5ec8e0',
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #5ec8e0',
                    textDecoration: 'none',
                  }}
                >
                  Register
                </Link>
              ) : (
                <Link
                  to="/login"
                  style={{
                    color: location.pathname === '/register' ? '#1e1f2b' : '#a8aabc',
                    background: location.pathname === '/register' ? '#5ec8e0' : 'transparent',
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${location.pathname === '/register' ? '#5ec8e0' : '#40425a'}`,
                    textDecoration: 'none',
                  }}
                >
                  Login
                </Link>
              )}
            </div>
          )}
        </div>
      </nav>

      <ConfirmModal
        open={logoutOpen}
        title="Log out"
        message="Are you sure you want to log out of StudyBud?"
        confirmLabel="Log out"
        cancelLabel="Stay"
        danger
        loading={logoutLoading}
        onConfirm={confirmLogout}
        onCancel={() => !logoutLoading && setLogoutOpen(false)}
      />
    </>
  );
};

export default Navbar;