import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRoom } from '../api/rooms';
import { getMessages, createMessage, deleteMessage } from '../api/messages';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import Avatar from '../components/Avatar';
import ConfirmModal from '../components/ConfirmModal';

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const RoomDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const listRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [msgFocused, setMsgFocused] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [roomData, messagesData] = await Promise.all([
          getRoom(id),
          getMessages({ roomId: id }),
        ]);
        setRoom(roomData);
        setMessages(messagesData.results || []);
      } catch (err) {
        setError(err.message || 'Failed to load room');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!body.trim() || !user) return;

    setSending(true);
    try {
      const msg = await createMessage({ room: id, body });
      setMessages((prev) => [msg, ...prev]);
      setBody('');
      setRoom((prev) => {
        if (!prev) return prev;
        const alreadyIn = prev.participants?.some((p) => p.id === user.id);
        if (alreadyIn) return prev;
        return {
          ...prev,
          participants: [...(prev.participants || []), user],
          participants_count: (prev.participants_count || 0) + 1,
        };
      });
      showToast('Message sent', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const requestDelete = (message) => setDeleteTarget(message);

  const runDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const result = await deleteMessage(deleteTarget.id);
      setMessages((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      showToast(result?.detail || 'Message deleted', 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err.message || 'Failed to delete message', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 64, textAlign: 'center', color: '#7a7c90' }}>
        <div
          style={{
            width: 36,
            height: 36,
            border: '3px solid #40425a',
            borderTopColor: '#5ec8e0',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        Loading room...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 64, textAlign: 'center', color: '#ff5c3a', maxWidth: 480, margin: '0 auto' }}>
        {error}
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ padding: 64, textAlign: 'center', color: '#7a7c90' }}>Room not found</div>
    );
  }

  const isHost = user && room.host && user.username === room.host.username;
  const participantCount = room.participants_count ?? room.participants?.length ?? 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 300px',
        gap: 24,
        maxWidth: 1140,
        margin: '28px auto',
        padding: '0 20px 56px',
        alignItems: 'start',
      }}
    >
      {/* Main column */}
      <div style={{ minWidth: 0 }}>
        {/* Room header card */}
        <div
          style={{
            background: 'linear-gradient(145deg, #3a3b52 0%, #2f3044 100%)',
            borderRadius: 16,
            padding: '22px 26px',
            marginBottom: 20,
            border: '1px solid #40425a',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  margin: '0 0 12px',
                  color: '#f0f0f5',
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                }}
              >
                {room.name}
              </h1>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: '#7a7c90',
                  flexWrap: 'wrap',
                }}
              >
                {room.topic?.name && (
                  <span
                    style={{
                      background: 'rgba(94, 200, 224, 0.14)',
                      color: '#5ec8e0',
                      padding: '5px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {room.topic.name}
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <Avatar src={room.host?.avatar} alt={room.host?.username} size={22} />
                  Host{' '}
                  <Link
                    to={`/profile/${room.host?.id}`}
                    style={{ color: '#5ec8e0', textDecoration: 'none', fontWeight: 600 }}
                  >
                    @{room.host?.username}
                  </Link>
                </span>
                <span style={{ fontSize: 13, opacity: 0.8 }}>
                  · {participantCount} participant{participantCount === 1 ? '' : 's'}
                </span>
                <span style={{ fontSize: 13, opacity: 0.8 }}>
                  · {messages.length} message{messages.length === 1 ? '' : 's'}
                </span>
              </div>
              {room.description && (
                <p
                  style={{
                    color: '#a8aabc',
                    margin: '14px 0 0',
                    lineHeight: 1.55,
                    fontSize: 14,
                  }}
                >
                  {room.description}
                </p>
              )}
            </div>
            {isHost && (
              <Link
                to={`/room/${id}/edit`}
                style={{
                  flexShrink: 0,
                  background: 'rgba(94, 200, 224, 0.12)',
                  color: '#5ec8e0',
                  border: '1px solid rgba(94, 200, 224, 0.3)',
                  borderRadius: 9,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Edit room
              </Link>
            )}
          </div>
        </div>

        {/* Conversation card: messages on top, composer at bottom */}
        <div
          style={{
            background: '#34354a',
            borderRadius: 14,
            border: '1px solid #40425a',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid #40425a',
              background: 'linear-gradient(135deg, #3a3b52 0%, #2f3044 100%)',
            }}
          >
            <h2 style={{ margin: 0, color: '#f0f0f5', fontSize: 15, fontWeight: 600 }}>
              Conversation
            </h2>
          </div>

          {/* Message list (above composer) */}
          <div
            ref={listRef}
            style={{
              padding: 14,
              maxHeight: '52vh',
              overflowY: 'auto',
              minHeight: 180,
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: '#2a2b3d',
                  borderRadius: 12,
                  border: '1px dashed #40425a',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>💬</div>
                <p style={{ color: '#a8aabc', margin: 0, fontSize: 15, fontWeight: 500 }}>
                  No messages yet
                </p>
                <p style={{ color: '#7a7c90', margin: '8px 0 0', fontSize: 13 }}>
                  Be the first to start the discussion
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const canDelete = user && m.user && user.username === m.user.username;
                const isOwn = canDelete;
                const isHovered = hoveredMsg === m.id;

                return (
                  <div
                    key={m.id}
                    onMouseEnter={() => setHoveredMsg(m.id)}
                    onMouseLeave={() => setHoveredMsg(null)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      background: isOwn
                        ? 'linear-gradient(135deg, rgba(94,200,224,0.06) 0%, #2f3044 100%)'
                        : '#2a2b3d',
                      padding: '12px 14px',
                      borderRadius: 12,
                      marginBottom: 8,
                      border: `1px solid ${isHovered ? '#4a4c66' : '#3a3b52'}`,
                      transition: 'border-color 150ms ease, box-shadow 150ms ease',
                      boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    <Link to={`/profile/${m.user?.id}`} style={{ flexShrink: 0 }}>
                      <Avatar src={m.user?.avatar} alt={m.user?.username} size={38} />
                    </Link>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Link
                            to={`/profile/${m.user?.id}`}
                            style={{
                              color: '#5ec8e0',
                              textDecoration: 'none',
                              fontWeight: 600,
                              fontSize: 14,
                            }}
                          >
                            @{m.user?.username}
                          </Link>
                          {isOwn && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#5ec8e0',
                                background: 'rgba(94,200,224,0.12)',
                                padding: '2px 7px',
                                borderRadius: 6,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              You
                            </span>
                          )}
                          <span style={{ color: '#7a7c90', fontSize: 12 }}>
                            {formatTime(m.created)}
                          </span>
                        </div>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => requestDelete(m)}
                            title="Delete message"
                            style={{
                              background: isHovered ? 'rgba(255, 92, 58, 0.12)' : 'transparent',
                              border: 'none',
                              color: '#ff8a70',
                              fontSize: 12,
                              cursor: 'pointer',
                              fontWeight: 600,
                              padding: '5px 10px',
                              borderRadius: 7,
                              opacity: isHovered ? 1 : 0.55,
                              transition: 'opacity 120ms ease, background 120ms ease',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                            Delete
                          </button>
                        )}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          color: '#e8e8ed',
                          lineHeight: 1.55,
                          fontSize: 14,
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {m.body}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Composer (below messages) */}
          <div
            style={{
              padding: 16,
              borderTop: '1px solid #40425a',
              background: '#2f3044',
            }}
          >
            {user ? (
              <form onSubmit={handleSend}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Avatar src={user.avatar} alt={user.username} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      onFocus={() => setMsgFocused(true)}
                      onBlur={() => setMsgFocused(false)}
                      rows={2}
                      placeholder="Share something with the room..."
                      maxLength={1000}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 10,
                        border: `1px solid ${msgFocused ? '#5ec8e0' : '#40425a'}`,
                        background: '#2a2b3d',
                        color: '#f0f0f5',
                        resize: 'vertical',
                        fontSize: 14,
                        lineHeight: 1.5,
                        outline: 'none',
                        transition: 'border-color 180ms ease, box-shadow 180ms ease',
                        boxShadow: msgFocused ? '0 0 0 3px rgba(94, 200, 224, 0.15)' : 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 10,
                        gap: 12,
                      }}
                    >
                      <span style={{ color: '#7a7c90', fontSize: 12 }}>
                        {body.length}/1000
                      </span>
                      <button
                        type="submit"
                        disabled={sending || !body.trim()}
                        style={{
                          padding: '10px 20px',
                          background: sending || !body.trim() ? '#3a6b78' : '#5ec8e0',
                          color: '#1e1f2b',
                          border: 'none',
                          borderRadius: 9,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: sending || !body.trim() ? 'not-allowed' : 'pointer',
                          transition: 'background 150ms ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {sending ? (
                          'Sending...'
                        ) : (
                          <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                            </svg>
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div
                style={{
                  color: '#7a7c90',
                  padding: '14px 16px',
                  background: '#2a2b3d',
                  borderRadius: 10,
                  border: '1px dashed #40425a',
                  fontSize: 14,
                }}
              >
                <Link to="/login" style={{ color: '#5ec8e0', fontWeight: 600 }}>
                  Login
                </Link>{' '}
                to join the conversation
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Participants sidebar */}
      <aside
        style={{
          background: '#34354a',
          border: '1px solid #40425a',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          position: 'sticky',
          top: 90,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #3a3b52 0%, #2a2b3d 100%)',
            padding: '14px 18px',
            borderBottom: '1px solid #40425a',
          }}
        >
          <h3
            style={{
              color: '#f0f0f5',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: 0,
            }}
          >
            Participants ({participantCount})
          </h3>
        </div>
        <div style={{ padding: '10px 12px', maxHeight: '60vh', overflowY: 'auto' }}>
          {room.participants && room.participants.length > 0 ? (
            room.participants.map((p) => {
              const isRoomHost = room.host && p.id === room.host.id;
              return (
                <Link
                  key={p.id}
                  to={`/profile/${p.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 8px',
                    color: '#e8e8ed',
                    textDecoration: 'none',
                    borderRadius: 8,
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#3a3b52')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar src={p.avatar} alt={p.username} size={32} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      @{p.username}
                    </div>
                    {isRoomHost && (
                      <div style={{ fontSize: 11, color: '#5ec8e0', fontWeight: 600 }}>Host</div>
                    )}
                  </div>
                </Link>
              );
            })
          ) : (
            <p style={{ color: '#7a7c90', fontSize: 13, padding: '12px 8px', margin: 0 }}>
              No participants yet
            </p>
          )}
        </div>
      </aside>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete message"
        message={
          deleteTarget
            ? `Delete this message? This cannot be undone.\n\n"${(deleteTarget.body || '').slice(0, 120)}${(deleteTarget.body || '').length > 120 ? '…' : ''}"`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onConfirm={runDelete}
        onCancel={() => !deleteLoading && setDeleteTarget(null)}
      />
    </div>
  );
};

export default RoomDetail;
