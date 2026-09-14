import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const inputStyle = (focused, hasError) => ({
  width: '100%',
  background: focused ? '#2a2b3d' : 'transparent',
  border: `1px solid ${hasError ? '#ff5c3a' : focused ? '#5ec8e0' : '#40425a'}`,
  borderRadius: '9px',
  padding: '13px 14px',
  color: '#f0f0f5',
  outline: 'none',
  fontSize: '15px',
  transition: 'border-color 180ms ease, box-shadow 180ms ease, background 180ms ease',
  boxShadow: focused && !hasError ? '0 0 0 3px rgba(94, 200, 224, 0.18)' : 'none',
});

const labelStyle = {
  display: 'block',
  color: '#a8aabc',
  fontSize: '13px',
  marginBottom: '7px',
  fontWeight: '500',
};

const fieldErrorStyle = {
  color: '#ff8a70',
  fontSize: '12px',
  marginTop: '6px',
};

const formatApiError = (err) => {
  if (!err) return 'Login failed';

  if (typeof err === 'string') return err;

  if (err.message && typeof err.message === 'string' && !err.message.startsWith('[object')) {
    const body = err.data || err.response?.data || err.body;
    if (body && typeof body === 'object') {
      return formatErrorBody(body) || err.message;
    }
    return err.message;
  }

  if (err.data || err.response?.data) {
    return formatErrorBody(err.data || err.response.data);
  }

  return 'Login failed. Please try again.';
};

const formatErrorBody = (body) => {
  if (!body || typeof body !== 'object') return null;
  if (typeof body.detail === 'string') return body.detail;
  if (Array.isArray(body.non_field_errors)) return body.non_field_errors.join(' ');

  // Common JWT / token responses
  if (typeof body.error === 'string') return body.error;

  const parts = [];
  for (const [key, val] of Object.entries(body)) {
    if (['detail', 'non_field_errors', 'error'].includes(key)) continue;
    const text = Array.isArray(val) ? val.join(' ') : String(val);
    const label = key.replace(/_/g, ' ');
    parts.push(`${label}: ${text}`);
  }
  return parts.length ? parts.join(' · ') : null;
};

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (error) setError(null);
  };

  const validate = () => {
    const errs = {};
    if (!formData.username.trim()) {
      errs.username = 'Username is required.';
    }
    if (!formData.password) {
      errs.password = 'Password is required.';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await login(formData.username.trim(), formData.password);
      navigate('/');
    } catch (err) {
      const body = err?.data || err?.response?.data;
      if (body && typeof body === 'object' && !body.detail && !body.non_field_errors) {
        const mapped = {};
        ['username', 'password'].forEach((key) => {
          if (body[key]) {
            mapped[key] = Array.isArray(body[key]) ? body[key].join(' ') : String(body[key]);
          }
        });
        if (Object.keys(mapped).length) {
          setFieldErrors(mapped);
        }
      }
      // Wrong credentials usually come as detail / non_field_errors — show in banner
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 70px)',
        padding: '32px 20px',
        background: 'radial-gradient(ellipse at top, rgba(94,200,224,0.06) 0%, transparent 55%)',
      }}
    >
      <div
        style={{
          background: '#34354a',
          width: '100%',
          maxWidth: '420px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
          border: '1px solid #40425a',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #3a3b52 0%, #2a2b3d 100%)',
            color: '#f0f0f5',
            textAlign: 'center',
            padding: '18px',
            fontSize: '13px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            borderBottom: '1px solid #40425a',
          }}
        >
          Login
        </div>
        <div style={{ padding: '32px 36px 36px' }}>
          <h2
            style={{
              color: '#5ec8e0',
              textAlign: 'center',
              fontSize: '18px',
              marginBottom: '28px',
              fontWeight: '600',
            }}
          >
            Find your study partner
          </h2>

          {error && (
            <div
              style={{
                background: 'rgba(255, 92, 58, 0.12)',
                border: '1px solid #ff5c3a',
                color: '#ff8a70',
                padding: '12px 14px',
                borderRadius: '9px',
                marginBottom: '18px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused(null)}
                placeholder="Enter username"
                autoComplete="username"
                style={inputStyle(focused === 'username', !!fieldErrors.username)}
              />
              {fieldErrors.username && (
                <div style={fieldErrorStyle}>{fieldErrors.username}</div>
              )}
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                placeholder="Enter password"
                autoComplete="current-password"
                style={inputStyle(focused === 'password', !!fieldErrors.password)}
              />
              {fieldErrors.password && (
                <div style={fieldErrorStyle}>{fieldErrors.password}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#4a9fb3' : '#5ec8e0',
                color: '#1e1f2b',
                border: 'none',
                padding: '14px',
                borderRadius: '9px',
                fontWeight: '700',
                fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 150ms ease, transform 150ms ease',
                boxShadow: '0 4px 14px rgba(94, 200, 224, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = '#7ad4e8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = loading ? '#4a9fb3' : '#5ec8e0';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p
            style={{
              textAlign: 'center',
              color: '#7a7c90',
              fontSize: '14px',
              marginTop: '26px',
              lineHeight: 1.6,
            }}
          >
            Haven&apos;t signed up yet?
            <br />
            <Link
              to="/register"
              style={{ color: '#5ec8e0', fontWeight: '600', textDecoration: 'none' }}
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
