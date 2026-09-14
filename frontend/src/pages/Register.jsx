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

/** Parse API error into a single string (DRF field errors, non_field, detail, etc.) */
const formatApiError = (err) => {
  if (!err) return 'Registration failed';

  // AuthContext may already set message to a string
  if (typeof err === 'string') return err;
  if (err.message && typeof err.message === 'string' && !err.message.startsWith('[object')) {
    // Prefer structured body if present
    const body = err.data || err.response?.data || err.body;
    if (body && typeof body === 'object') {
      return formatErrorBody(body) || err.message;
    }
    return err.message;
  }

  if (err.data || err.response?.data) {
    return formatErrorBody(err.data || err.response.data);
  }

  return 'Registration failed. Please try again.';
};

const formatErrorBody = (body) => {
  if (!body || typeof body !== 'object') return null;
  if (typeof body.detail === 'string') return body.detail;
  if (Array.isArray(body.non_field_errors)) return body.non_field_errors.join(' ');

  const parts = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === 'detail' || key === 'non_field_errors') continue;
    const text = Array.isArray(val) ? val.join(' ') : String(val);
    const label = key.replace(/_/g, ' ');
    parts.push(`${label}: ${text}`);
  }
  return parts.length ? parts.join(' · ') : null;
};

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error as user types
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
    const username = formData.username.trim();
    const email = formData.email.trim();
    const { password, password2 } = formData;

    if (!username) {
      errs.username = 'Username is required.';
    } else if (username.length < 3) {
      errs.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errs.username = 'Only letters, numbers, and underscores.';
    }

    if (!email) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }

    if (!password2) {
      errs.password2 = 'Please confirm your password.';
    } else if (password !== password2) {
      errs.password2 = "Passwords don't match.";
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
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password2: formData.password2,
      });
      navigate('/');
    } catch (err) {
      // Map common DRF field errors onto inputs when possible
      const body = err?.data || err?.response?.data;
      if (body && typeof body === 'object' && !body.detail) {
        const mapped = {};
        ['username', 'email', 'password', 'password2'].forEach((key) => {
          if (body[key]) {
            mapped[key] = Array.isArray(body[key]) ? body[key].join(' ') : String(body[key]);
          }
        });
        if (Object.keys(mapped).length) {
          setFieldErrors(mapped);
        }
      }
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
          Register
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
            Join the community
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
                placeholder="Choose a username"
                autoComplete="username"
                style={inputStyle(focused === 'username', !!fieldErrors.username)}
              />
              {fieldErrors.username && (
                <div style={fieldErrorStyle}>{fieldErrors.username}</div>
              )}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                placeholder="you@example.com"
                autoComplete="email"
                style={inputStyle(focused === 'email', !!fieldErrors.email)}
              />
              {fieldErrors.email && (
                <div style={fieldErrorStyle}>{fieldErrors.email}</div>
              )}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                style={inputStyle(focused === 'password', !!fieldErrors.password)}
              />
              {fieldErrors.password && (
                <div style={fieldErrorStyle}>{fieldErrors.password}</div>
              )}
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={labelStyle}>Confirm password</label>
              <input
                type="password"
                name="password2"
                value={formData.password2}
                onChange={handleChange}
                onFocus={() => setFocused('password2')}
                onBlur={() => setFocused(null)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                style={inputStyle(focused === 'password2', !!fieldErrors.password2)}
              />
              {fieldErrors.password2 && (
                <div style={fieldErrorStyle}>{fieldErrors.password2}</div>
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
            >
              {loading ? 'Creating account...' : 'Register'}
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
            Already have an account?
            <br />
            <Link
              to="/login"
              style={{ color: '#5ec8e0', fontWeight: '600', textDecoration: 'none' }}
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
