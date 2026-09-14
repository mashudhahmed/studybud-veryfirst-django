import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { deleteRoom } from '../api/rooms';
import { useToast } from '../context/ToastContext';
import Avatar from './Avatar';
import ConfirmModal from './ConfirmModal';

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

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

const RoomCard = ({ room, onDelete }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const menuRef = useRef(null);

  const canManage = user && room.host && user.username === room.host.username;

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  const requestDelete = () => {
    setMenuOpen(false);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteRoom(room.id);
      setConfirmOpen(false);
      showToast(result?.detail || 'Room deleted', 'success');
      if (onDelete) onDelete(room.id);
    } catch (error) {
      console.error('Failed to delete room:', error);
      setConfirmOpen(false);
      showToast(error.message || 'Failed to delete room', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? '#3d3e55' : '#34354a',
          padding: '22px 24px',
          borderRadius: '14px',
          marginBottom: '14px',
          border: `1px solid ${hovered ? '#5ec8e0' : '#40425a'}`,
          position: 'relative',
          transition: 'all 180ms ease',
          transform: hovered ? 'translateY(-3px)' : 'none',
          boxShadow: hovered
            ? '0 14px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(94,200,224,0.15)'
            : '0 4px 14px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '14px',
            fontSize: '13px',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <Avatar src={room.host?.avatar} alt={room.host?.username} size={30} />
            <span style={{ color: '#5ec8e0', fontWeight: '600' }}>
              Host{' '}
              <Link
                to={`/profile/${room.host?.id}`}
                style={{ color: '#5ec8e0', textDecoration: 'none' }}
              >
                @{room.host?.username}
              </Link>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{ color: '#7a7c90', fontSize: '12px', whiteSpace: 'nowrap' }}>
              {timeAgo(room.created)}
            </span>

            {canManage && (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Room actions"
                  style={{
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: menuOpen ? '#2a2b3d' : 'transparent',
                    border: `1px solid ${menuOpen ? '#40425a' : 'transparent'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    color: '#a8aabc',
                    padding: 0,
                  }}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>

                {menuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      minWidth: 140,
                      background: '#2a2b3d',
                      border: '1px solid #40425a',
                      borderRadius: 10,
                      boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
                      padding: 6,
                      zIndex: 20,
                    }}
                  >
                    <Link
                      to={`/room/${room.id}/edit`}
                      onClick={() => setMenuOpen(false)}
                      style={{
                        display: 'block',
                        padding: '10px 12px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#e8e8ed',
                        textDecoration: 'none',
                      }}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={requestDelete}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#ff8a70',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <h5
          style={{
            fontSize: '17px',
            margin: '0 0 14px',
            fontWeight: '600',
            lineHeight: 1.35,
          }}
        >
          <Link to={`/room/${room.id}`} style={{ color: '#f0f0f5', textDecoration: 'none' }}>
            {room.name}
          </Link>
        </h5>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '4px',
            paddingTop: '14px',
            borderTop: '1px solid #2a2b3d',
          }}
        >
          <span
            style={{
              color: '#a8aabc',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
            {room.participants_count ?? 0} joined
          </span>
          <span
            style={{
              background: 'rgba(94, 200, 224, 0.15)',
              display: 'inline-block',
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#5ec8e0',
            }}
          >
            {room.topic?.name}
          </span>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete room"
        message={`Delete "${room.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => !isDeleting && setConfirmOpen(false)}
      />
    </>
  );
};

export default RoomCard;