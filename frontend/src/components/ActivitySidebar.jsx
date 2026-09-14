import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMessages } from '../api/messages';
import Avatar from './Avatar';

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  return `${Math.floor(months / 12)}y ago`;
};

const ActivitySidebar = ({ limit = 5 }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getMessages({ page: 1 });
      const allMessages = response.results || [];
      const sorted = [...allMessages].sort(
        (a, b) => new Date(b.created) - new Date(a.created)
      );
      setActivities(sorted.slice(0, limit));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const headerBlock = (
    <div
      style={{
        background: 'linear-gradient(135deg, #3a3b52 0%, #2a2b3d 100%)',
        padding: '14px 18px',
        borderRadius: '12px 12px 0 0',
        borderBottom: '1px solid #40425a',
      }}
    >
      <h3
        style={{
          color: '#f0f0f5',
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: 0,
        }}
      >
        Recent Activity
      </h3>
    </div>
  );

  const bodyBase = {
    background: '#34354a',
    border: '1px solid #40425a',
    borderTop: 'none',
  };

  if (loading) {
    return (
      <div>
        {headerBlock}
        <div
          style={{
            ...bodyBase,
            padding: '28px 18px',
            textAlign: 'center',
            color: '#7a7c90',
            borderRadius: '0 0 12px 12px',
            fontSize: 13,
          }}
        >
          Loading activities...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        {headerBlock}
        <div
          style={{
            ...bodyBase,
            padding: '28px 18px',
            textAlign: 'center',
            color: '#ff8a70',
            borderRadius: '0 0 12px 12px',
            fontSize: 13,
          }}
        >
          Error loading activities
        </div>
      </div>
    );
  }

  return (
    <div>
      {headerBlock}

      {activities.length > 0 ? (
        activities.map((message, index) => (
          <div
            key={message.id}
            style={{
              ...bodyBase,
              padding: '16px 18px',
              borderRadius: index === activities.length - 1 ? '0 0 12px 12px' : 0,
            }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Avatar src={message.user?.avatar} alt={message.user?.username} size={40} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: 2 }}>
                  <Link
                    to={`/profile/${message.user?.id}`}
                    style={{ color: '#5ec8e0', textDecoration: 'none' }}
                  >
                    @{message.user?.username}
                  </Link>
                </div>

                <div style={{ fontSize: '11px', color: '#7a7c90', marginBottom: 6 }}>
                  {timeAgo(message.created)}
                </div>

                <div style={{ fontSize: '13px', color: '#a8aabc', lineHeight: 1.4 }}>
                  replied in{' '}
                  <Link
                    to={`/room/${message.room?.id}`}
                    style={{ color: '#5ec8e0', textDecoration: 'none', fontWeight: '500' }}
                  >
                    {message.room?.name || 'Room'}
                  </Link>
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#2a2b3d',
                padding: '11px 14px',
                borderRadius: 9,
                fontSize: 13,
                color: '#c8c9d4',
                marginTop: 12,
                lineHeight: 1.5,
                border: '1px solid #3a3b52',
              }}
            >
              {message.body}
            </div>
          </div>
        ))
      ) : (
        <div
          style={{
            ...bodyBase,
            padding: '28px 18px',
            textAlign: 'center',
            color: '#7a7c90',
            borderRadius: '0 0 12px 12px',
            fontSize: 13,
          }}
        >
          No recent activity
        </div>
      )}

      {activities.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 14 }}>
          <Link
            to="/activities"
            style={{
              color: '#5ec8e0',
              fontSize: 13,
              fontWeight: '600',
              textDecoration: 'none',
            }}
          >
            View more →
          </Link>
        </div>
      )}
    </div>
  );
};

export default ActivitySidebar;
