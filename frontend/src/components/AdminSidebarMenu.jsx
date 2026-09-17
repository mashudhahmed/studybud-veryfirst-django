import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const links = [
  { to: '/admin/rooms', label: 'Rooms' },
  { to: '/admin/topics', label: 'Topics' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/reports', label: 'Reports' },
];

const AdminSidebarMenu = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(location.pathname.startsWith('/admin'));

  if (!user || !user.is_superuser) return null;

  return (
    <div style={{ marginBottom: '22px' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: '#34354a',
          border: '1px solid #40425a',
          borderRadius: open ? '12px 12px 0 0' : '12px',
          padding: '12px 14px',
          cursor: 'pointer',
          transition: 'background 150ms ease',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="#5ec8e0">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
          <span style={{ color: '#f0f0f5', fontSize: '13px', fontWeight: '600' }}>
            Admin Dashboard
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="#7a7c90"
          style={{
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 180ms ease',
          }}
        >
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            background: '#2a2b3d',
            border: '1px solid #40425a',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            padding: '6px',
          }}
        >
          {links.map((link) => {
            const active = location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  display: 'block',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: active ? '600' : '500',
                  color: active ? '#1e1f2b' : '#a8aabc',
                  background: active ? '#5ec8e0' : 'transparent',
                  marginBottom: '2px',
                  textDecoration: 'none',
                  transition: 'background 150ms ease, color 150ms ease',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminSidebarMenu;
