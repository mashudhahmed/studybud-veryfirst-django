import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMessages } from '../api/messages';
import Avatar from '../components/Avatar';

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

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getMessages({ page });
      const results = response.results || [];
      const sorted = [...results].sort(
        (a, b) => new Date(b.created) - new Date(a.created)
      );
      setActivities(sorted);
      setPagination({
        count: response.count,
        next: response.next,
        previous: response.previous,
      });
    } catch (err) {
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '32px auto 48px',
        padding: '0 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: 24,
          borderBottom: '1px solid #36384f',
          paddingBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: '#f0f0f5',
            }}
          >
            Recent Activity
          </h1>
          <p style={{ margin: '6px 0 0', color: '#7a7c90', fontSize: 14 }}>
            {pagination?.count != null
              ? `${pagination.count} messages`
              : 'All recent replies across rooms'}
          </p>
        </div>
        <Link
          to="/"
          style={{
            color: '#5ec8e0',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          ← Back to rooms
        </Link>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(255, 92, 58, 0.12)',
            border: '1px solid #ff5c3a',
            color: '#ff8a70',
            borderRadius: 9,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#7a7c90' }}>
          Loading activities...
        </div>
      ) : activities.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 48,
            color: '#7a7c90',
            background: '#2a2b3d',
            borderRadius: 14,
            border: '1px dashed #40425a',
          }}
        >
          No activity yet
        </div>
      ) : (
        <div
          style={{
            background: '#34354a',
            borderRadius: 14,
            border: '1px solid #40425a',
            overflow: 'hidden',
          }}
        >
          {activities.map((message, index) => (
            <div
              key={message.id}
              style={{
                padding: '18px 20px',
                borderBottom:
                  index === activities.length - 1 ? 'none' : '1px solid #2a2b3d',
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <Avatar
                  src={message.user?.avatar}
                  alt={message.user?.username}
                  size={44}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                      marginBottom: 4,
                    }}
                  >
                    <Link
                      to={`/profile/${message.user?.id}`}
                      style={{
                        color: '#5ec8e0',
                        fontWeight: 600,
                        fontSize: 15,
                        textDecoration: 'none',
                      }}
                    >
                      @{message.user?.username}
                    </Link>
                    <span style={{ color: '#7a7c90', fontSize: 12 }}>
                      {timeAgo(message.created)}
                    </span>
                  </div>
                  <div style={{ color: '#a8aabc', fontSize: 13, marginBottom: 10 }}>
                    replied in{' '}
                    <Link
                      to={`/room/${message.room?.id}`}
                      style={{ color: '#5ec8e0', fontWeight: 500, textDecoration: 'none' }}
                    >
                      {message.room?.name || 'Room'}
                    </Link>
                  </div>
                  <div
                    style={{
                      background: '#2a2b3d',
                      padding: '12px 14px',
                      borderRadius: 9,
                      fontSize: 14,
                      color: '#e8e8ed',
                      lineHeight: 1.5,
                      border: '1px solid #3a3b52',
                      wordBreak: 'break-word',
                    }}
                  >
                    {message.body}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && (pagination.next || pagination.previous) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 12,
            marginTop: 24,
            color: '#a8aabc',
            fontSize: 14,
          }}
        >
          <button
            type="button"
            disabled={!pagination.previous || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              background: '#2a2b3d',
              color: '#a8aabc',
              border: '1px solid #40425a',
              borderRadius: 8,
              padding: '8px 16px',
              fontWeight: 600,
              cursor: pagination.previous ? 'pointer' : 'not-allowed',
              opacity: pagination.previous ? 1 : 0.5,
            }}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            type="button"
            disabled={!pagination.next || loading}
            onClick={() => setPage((p) => p + 1)}
            style={{
              background: '#2a2b3d',
              color: '#a8aabc',
              border: '1px solid #40425a',
              borderRadius: 8,
              padding: '8px 16px',
              fontWeight: 600,
              cursor: pagination.next ? 'pointer' : 'not-allowed',
              opacity: pagination.next ? 1 : 0.5,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Activities;
