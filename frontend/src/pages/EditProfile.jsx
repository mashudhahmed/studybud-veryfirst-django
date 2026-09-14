import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getCurrentProfile, updateProfile } from '../api/auth';
import { useToast } from '../context/ToastContext';

const inputStyle = (focused, disabled) => ({
  width: '100%',
  background: '#2a2b3d',
  border: `1px solid ${focused ? '#5ec8e0' : '#40425a'}`,
  borderRadius: '9px',
  padding: '13px 14px',
  color: disabled ? '#7a7c90' : '#f0f0f5',
  outline: 'none',
  fontSize: '15px',
  cursor: disabled ? 'not-allowed' : 'text',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
  boxShadow: focused ? '0 0 0 3px rgba(94, 200, 224, 0.18)' : 'none',
});

const labelStyle = {
  display: 'block',
  color: '#a8aabc',
  fontSize: '13px',
  fontWeight: '500',
  marginBottom: '7px',
};

const EditProfile = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: null,
  });
  const [currentAvatar, setCurrentAvatar] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const profile = await getCurrentProfile();

      setFormData({
        username: user?.username || '',
        email: user?.email || '',
        bio: profile.bio || '',
        avatar: null,
      });

      setCurrentAvatar(profile.avatar);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      avatar: e.target.files[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('bio', formData.bio);

      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }

      await updateProfile(formDataToSend);
      showToast('Profile updated', 'success');
      navigate(`/profile/${user.id}`);
    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '48px 20px',
        minHeight: 'calc(100vh - 70px)',
        background: 'radial-gradient(ellipse at top, rgba(94,200,224,0.05) 0%, transparent 50%)',
      }}
    >
      <div
        style={{
          background: '#34354a',
          padding: '40px',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
          border: '1px solid #40425a',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2
            style={{
              color: '#f0f0f5',
              fontSize: '22px',
              marginBottom: '6px',
              fontWeight: '700',
            }}
          >
            Edit Profile
          </h2>
          <p style={{ color: '#7a7c90', fontSize: '14px' }}>
            Update your account information
          </p>
        </div>

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

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div
            style={{
              marginBottom: '28px',
              paddingBottom: '24px',
              borderBottom: '1px solid #40425a',
            }}
          >
            <h3
              style={{
                color: '#5ec8e0',
                fontSize: '14px',
                marginBottom: '16px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Account Information
            </h3>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled
                style={inputStyle(false, true)}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled
                style={inputStyle(false, true)}
              />
            </div>
          </div>

          <div
            style={{
              marginBottom: '28px',
              paddingBottom: '24px',
              borderBottom: '1px solid #40425a',
            }}
          >
            <h3
              style={{
                color: '#5ec8e0',
                fontSize: '14px',
                marginBottom: '16px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Profile Information
            </h3>

            <div style={{ marginBottom: '18px' }}>
              <label style={labelStyle}>Profile picture</label>

              {currentAvatar && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    marginBottom: '14px',
                    padding: '12px',
                    background: '#2a2b3d',
                    borderRadius: '10px',
                    border: '1px solid #40425a',
                  }}
                >
                  <img
                    src={currentAvatar}
                    alt="Current Avatar"
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #5ec8e0',
                    }}
                  />
                  <p style={{ color: '#7a7c90', fontSize: '13px', margin: 0 }}>
                    Current avatar
                  </p>
                </div>
              )}

              <input
                type="file"
                name="avatar"
                onChange={handleFileChange}
                accept="image/*"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#2a2b3d',
                  border: '1px dashed #40425a',
                  borderRadius: '9px',
                  color: '#a8aabc',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              />
              <small
                style={{
                  display: 'block',
                  color: '#7a7c90',
                  fontSize: '12px',
                  marginTop: '6px',
                }}
              >
                Upload a new profile picture
              </small>
            </div>

            <div>
              <label style={labelStyle}>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                onFocus={() => setFocused('bio')}
                onBlur={() => setFocused(null)}
                rows={4}
                placeholder="Tell us about yourself..."
                style={{
                  ...inputStyle(focused === 'bio', false),
                  resize: 'vertical',
                  minHeight: '90px',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: '#2a2b3d',
                color: '#a8aabc',
                padding: '12px 22px',
                borderRadius: '9px',
                fontWeight: '500',
                border: '1px solid #40425a',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#4a9fb3' : '#5ec8e0',
                color: '#1e1f2b',
                border: 'none',
                padding: '12px 22px',
                borderRadius: '9px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                boxShadow: '0 4px 14px rgba(94, 200, 224, 0.28)',
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;