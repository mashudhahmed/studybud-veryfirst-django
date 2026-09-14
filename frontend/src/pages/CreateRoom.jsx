import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../api/rooms';
import { getTopics } from '../api/topics';
import { useToast } from '../context/ToastContext';

const inputStyle = (focused) => ({
  width: '100%',
  background: '#2a2b3d',
  border: `1px solid ${focused ? '#5ec8e0' : '#40425a'}`,
  borderRadius: '9px',
  padding: '13px 14px',
  color: '#f0f0f5',
  outline: 'none',
  fontSize: '15px',
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
  boxShadow: focused ? '0 0 0 3px rgba(94, 200, 224, 0.18)' : 'none',
});

const labelStyle = {
  color: '#a8aabc',
  display: 'block',
  marginBottom: '7px',
  fontSize: '13px',
  fontWeight: '500',
};

const CreateRoom = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    topic: '',
  });
  const [topics, setTopics] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await getTopics();
        setTopics(data.results || []);
      } catch (err) {
        console.error('Failed to fetch topics:', err);
      }
    };
    fetchTopics();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const room = await createRoom(formData);
      showToast('Room created', 'success');
      navigate(`/room/${room.id}`);
    } catch (err) {
      const msg = err.message || 'Failed to create room';
      setError(msg);
      showToast(msg, 'error');
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
        <h2
          style={{
            color: '#f0f0f5',
            marginBottom: '8px',
            fontSize: '22px',
            fontWeight: '700',
          }}
        >
          Create Room
        </h2>
        <p style={{ color: '#7a7c90', fontSize: '14px', marginBottom: '28px' }}>
          Start a new study space and invite others to join
        </p>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Room name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              placeholder="e.g. Calculus study group"
              required
              style={inputStyle(focused === 'name')}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Topic</label>
            <input
              type="text"
              name="topic"
              list="existing-topics"
              value={formData.topic}
              onChange={handleChange}
              onFocus={() => setFocused('topic')}
              onBlur={() => setFocused(null)}
              placeholder="Pick an existing topic or type a new one"
              required
              style={inputStyle(focused === 'topic')}
            />
            <datalist id="existing-topics">
              {topics.map((topic) => (
                <option key={topic.id} value={topic.name} />
              ))}
            </datalist>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              onFocus={() => setFocused('description')}
              onBlur={() => setFocused(null)}
              rows={4}
              placeholder="What will you study together?"
              style={{
                ...inputStyle(focused === 'description'),
                resize: 'vertical',
                minHeight: '100px',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#4a9fb3' : '#5ec8e0',
              color: '#1e1f2b',
              border: 'none',
              padding: '13px 24px',
              borderRadius: '9px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              transition: 'background 150ms ease, transform 150ms ease',
              boxShadow: '0 4px 14px rgba(94, 200, 224, 0.28)',
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
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRoom;