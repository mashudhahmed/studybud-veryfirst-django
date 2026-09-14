import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getUsers, updateUser, deleteUser, getUserMessages } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import ConfirmModal from '../../components/ConfirmModal';
import * as s from './adminStyles';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 500];

const crumbLink = {
  color: s.colors.main,
  textDecoration: 'none',
  transition: 'color 150ms ease, opacity 150ms ease',
};
const crumbLinkHover = (e, enter) => {
  e.currentTarget.style.textDecoration = enter ? 'underline' : 'none';
  e.currentTarget.style.opacity = enter ? '0.85' : '1';
};

const ActionsMenu = ({ u, isSelf, busy, onAction }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const menuWidth = 180;
    // Align right edge of menu with right edge of trigger
    let left = rect.right - menuWidth;
    if (left < 8) left = 8;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const placeAbove = spaceBelow < 160 && rect.top > spaceBelow;
    setPos({
      top: placeAbove ? undefined : rect.bottom + 6,
      bottom: placeAbove ? window.innerHeight - rect.top + 6 : undefined,
      left,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onDoc = (e) => {
      const inTrigger = triggerRef.current?.contains(e.target);
      const inMenu = menuRef.current?.contains(e.target);
      if (!inTrigger && !inMenu) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [open, updatePos]);

  const item = (label, actionKey, danger = false) => (
    <button
      type="button"
      disabled={isSelf || busy}
      onClick={() => {
        setOpen(false);
        onAction(actionKey, u);
      }}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        color: danger ? '#ff8a70' : '#e8e8ed',
        background: 'transparent',
        border: 'none',
        cursor: isSelf || busy ? 'not-allowed' : 'pointer',
        opacity: isSelf || busy ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isSelf && !busy) {
          e.currentTarget.style.background = danger
            ? 'rgba(255, 92, 58, 0.12)'
            : '#34354a';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {label}
    </button>
  );

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: pos.top,
            bottom: pos.bottom,
            left: pos.left,
            minWidth: 180,
            background: s.colors.dark,
            border: `1px solid ${s.colors.darkLight}`,
            borderRadius: 10,
            boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
            padding: 6,
            zIndex: 9999,
          }}
        >
          {item(u.is_staff ? 'Remove admin' : 'Make admin', 'staff')}
          {item(u.is_superuser ? 'Remove superuser' : 'Make superuser', 'superuser')}
          {item(u.is_active ? 'Deactivate' : 'Activate', 'active')}
          <div style={{ height: 1, background: s.colors.darkLight, margin: '4px 6px' }} />
          {item('Delete', 'delete', true)}
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={triggerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-label="User actions"
        style={{
          width: 34,
          height: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: open ? s.colors.dark : 'transparent',
          border: `1px solid ${open ? s.colors.darkLight : 'transparent'}`,
          borderRadius: 8,
          cursor: busy ? 'not-allowed' : 'pointer',
          color: s.colors.lightGray,
          padding: 0,
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {menu}
    </div>
  );
};

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [joinedAfter, setJoinedAfter] = useState('');
  const [joinedBefore, setJoinedBefore] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Modal state: { type, user } | null
  const [confirm, setConfirm] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Messages modal
  const [msgUser, setMsgUser] = useState(null);
  const [msgList, setMsgList] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState(null);

  const openMessages = async (user) => {
    setMsgUser(user);
    setMsgList([]);
    setMsgError(null);
    setMsgLoading(true);
    try {
      const data = await getUserMessages(user.id, { page_size: 50 });
      setMsgList(data.results || []);
    } catch (err) {
      setMsgError(err.message || 'Failed to load messages');
    } finally {
      setMsgLoading(false);
    }
  };

  const closeMessages = () => {
    setMsgUser(null);
    setMsgList([]);
    setMsgError(null);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers({
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
        joined_after: joinedAfter || undefined,
        joined_before: joinedBefore || undefined,
        page,
        page_size: pageSize,
      });
      setUsers(data.results || []);
      setPagination({ count: data.count, next: data.next, previous: data.previous });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, role, status, joinedAfter, joinedBefore, page, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce search so typing doesn't spam the API
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const openAction = (type, target) => {
    setConfirm({ type, user: target });
  };

  const closeConfirm = () => {
    if (confirmLoading) return;
    setConfirm(null);
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const { type, user: target } = confirm;

    setConfirmLoading(true);
    setBusyId(target.id);
    setError(null);

    try {
      if (type === 'staff') {
        const updated = await updateUser(target.id, { is_staff: !target.is_staff });
        setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
        showToast(updated.is_staff ? 'Admin rights granted' : 'Admin rights removed', 'success');
      } else if (type === 'superuser') {
        const updated = await updateUser(target.id, { is_superuser: !target.is_superuser });
        setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
        showToast(updated.is_superuser ? 'Superuser access granted' : 'Superuser access removed', 'success');
      } else if (type === 'active') {
        const updated = await updateUser(target.id, { is_active: !target.is_active });
        setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));
        showToast(updated.is_active ? 'User activated' : 'User deactivated', 'success');
      } else if (type === 'delete') {
        const result = await deleteUser(target.id);
        setUsers((prev) => prev.filter((u) => u.id !== target.id));
        showToast(result?.detail || 'User deleted', 'success');
      }
      setConfirm(null);
    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Action failed', 'error');
      setConfirm(null);
    } finally {
      setConfirmLoading(false);
      setBusyId(null);
    }
  };

  const modalCopy = () => {
    if (!confirm) return {};
    const name = `@${confirm.user.username}`;
    switch (confirm.type) {
      case 'staff':
        return confirm.user.is_staff
          ? {
              title: 'Remove admin',
              message: `Remove admin rights from ${name}?`,
              confirmLabel: 'Remove admin',
            }
          : {
              title: 'Make admin',
              message: `Make ${name} an admin?`,
              confirmLabel: 'Make admin',
            };
      case 'superuser':
        return confirm.user.is_superuser
          ? {
              title: 'Remove superuser',
              message: `Remove superuser access from ${name}?`,
              confirmLabel: 'Remove',
            }
          : {
              title: 'Grant superuser',
              message: `Grant ${name} full superuser access? They will be able to manage every user, room and topic.`,
              confirmLabel: 'Grant access',
            };
      case 'active':
        return confirm.user.is_active
          ? {
              title: 'Deactivate user',
              message: `Deactivate ${name}? They won't be able to log in.`,
              confirmLabel: 'Deactivate',
              danger: true,
            }
          : {
              title: 'Activate user',
              message: `Activate ${name}? They will be able to log in again.`,
              confirmLabel: 'Activate',
            };
      case 'delete':
        return {
          title: 'Delete user',
          message: `Permanently delete ${name}? This cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        };
      default:
        return {};
    }
  };

  const copy = modalCopy();

  return (
    <div>
      <div style={s.pageHeader}>
        <div style={s.pageHeaderTop}>
          <h1 style={{ ...s.title, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Link to="/" style={crumbLink}
              onMouseEnter={(e) => crumbLinkHover(e, true)}
              onMouseLeave={(e) => crumbLinkHover(e, false)}>
              Home
            </Link>
            <span style={{ color: s.colors.gray, fontWeight: 400 }}>/</span>
            <Link to="/admin/rooms" style={crumbLink}
              onMouseEnter={(e) => crumbLinkHover(e, true)}
              onMouseLeave={(e) => crumbLinkHover(e, false)}>
              Admin
            </Link>
            <span style={{ color: s.colors.gray, fontWeight: 400 }}>/</span>
            <span>Users</span>
          </h1>
        </div>

        <div style={s.filterBar}>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            style={s.selectInput}
          >
            <option value="">All roles</option>
            <option value="superuser">Superusers</option>
            <option value="staff">Admins</option>
            <option value="user">Regular users</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            style={s.selectInput}
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.colors.lightGray, fontSize: 12 }}>
            Joined from
            <input
              type="date"
              value={joinedAfter}
              onChange={(e) => {
                setJoinedAfter(e.target.value);
                setPage(1);
              }}
              style={{ ...s.searchInput, minWidth: 140 }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.colors.lightGray, fontSize: 12 }}>
            to
            <input
              type="date"
              value={joinedBefore}
              onChange={(e) => {
                setJoinedBefore(e.target.value);
                setPage(1);
              }}
              style={{ ...s.searchInput, minWidth: 140 }}
            />
          </label>
          <input
            type="text"
            placeholder="Search username or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={s.searchInput}
          />
          {(role || status || searchInput || joinedAfter || joinedBefore) && (
            <button
              type="button"
              style={s.btn('default')}
              onClick={() => {
                setRole('');
                setStatus('');
                setSearchInput('');
                setSearch('');
                setJoinedAfter('');
                setJoinedBefore('');
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      <div style={s.card}>
        {loading ? (
          <div style={s.emptyState}>Loading users...</div>
        ) : users.length === 0 ? (
          <div style={s.emptyState}>No users found.</div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={s.th}>User</th>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Status</th>
                  <th style={s.th}>Rooms</th>
                  <th style={s.th}>Messages</th>
                  <th style={s.th}>Joined</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => {
                  const isSelf = currentUser && currentUser.id === u.id;
                  const busy = busyId === u.id;

                  return (
                    <tr key={u.id}>
                      <td style={{ ...s.td, color: s.colors.gray, fontWeight: 600, width: 48 }}>
                        {(page - 1) * pageSize + index + 1}
                      </td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar src={u.avatar} alt={u.username} size={30} />
                          <span style={{ fontWeight: '600' }}>
                            @{u.username}
                            {isSelf && (
                              <span style={{ color: s.colors.gray }}> (you)</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td style={s.td}>{u.email}</td>
                      <td style={s.td}>
                        {u.is_superuser ? (
                          <span style={s.badge('superuser')}>Superuser</span>
                        ) : u.is_staff ? (
                          <span style={s.badge('staff')}>Admin</span>
                        ) : (
                          <span style={s.badge('default')}>User</span>
                        )}
                      </td>
                      <td style={s.td}>
                        {u.is_active ? (
                          <span style={s.badge('default')}>Active</span>
                        ) : (
                          <span style={s.badge('inactive')}>Inactive</span>
                        )}
                      </td>
                      <td style={s.td}>
                        {u.rooms && u.rooms.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {u.rooms.map((room) => (
                              <Link
                                key={room.id}
                                to={`/room/${room.id}`}
                                style={{
                                  background: 'rgba(94, 200, 224, 0.12)',
                                  color: '#5ec8e0',
                                  padding: '3px 10px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  textDecoration: 'none',
                                }}
                              >
                                {room.name}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: s.colors.gray, fontSize: '13px' }}>No rooms</span>
                        )}
                      </td>
                      <td style={s.td}>
                        <button
                          type="button"
                          onClick={() => openMessages(u)}
                          title="View messages"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'rgba(94, 200, 224, 0.12)',
                            border: '1px solid rgba(94, 200, 224, 0.25)',
                            borderRadius: 20,
                            padding: '4px 12px',
                            color: '#5ec8e0',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
                          </svg>
                          {u.messages_count ?? 0}
                        </button>
                      </td>
                      <td style={s.td}>
                        {u.date_joined
                          ? new Date(u.date_joined).toLocaleDateString()
                          : '-'}
                      </td>
                      <td style={s.td}>
                        <ActionsMenu
                          u={u}
                          isSelf={isSelf}
                          busy={busy}
                          onAction={openAction}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination && (
        <div style={s.pagination}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: s.colors.lightGray, fontSize: 13 }}>
            Rows
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              style={{ ...s.selectInput, minWidth: 80, padding: '6px 28px 6px 10px' }}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <button
            style={s.btn('default')}
            disabled={!pagination.previous}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>
            Page {page}
            {pagination.count != null ? ` · ${pagination.count} total` : ''}
          </span>
          <button
            style={s.btn('default')}
            disabled={!pagination.next}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}

      <ConfirmModal
        open={!!confirm}
        title={copy.title}
        message={copy.message}
        confirmLabel={copy.confirmLabel}
        danger={!!copy.danger}
        loading={confirmLoading}
        onConfirm={runConfirm}
        onCancel={closeConfirm}
      />

      {msgUser &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={closeMessages}
          >
            <div
              style={{
                background: s.colors.darkMedium,
                border: `1px solid ${s.colors.darkLight}`,
                borderRadius: 14,
                width: '100%',
                maxWidth: 560,
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: `1px solid ${s.colors.darkLight}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar src={msgUser.avatar} alt={msgUser.username} size={32} />
                  <div>
                    <div style={{ color: s.colors.light, fontWeight: 700, fontSize: 15 }}>
                      @{msgUser.username}
                    </div>
                    <div style={{ color: s.colors.gray, fontSize: 12 }}>
                      {msgUser.messages_count ?? msgList.length} messages
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeMessages}
                  style={{
                    background: s.colors.dark,
                    border: 'none',
                    color: s.colors.lightGray,
                    borderRadius: 8,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Close
                </button>
              </div>
              <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
                {msgLoading && (
                  <div style={{ color: s.colors.gray, textAlign: 'center', padding: 24 }}>
                    Loading messages...
                  </div>
                )}
                {msgError && (
                  <div style={{ ...s.errorBox, marginBottom: 0 }}>{msgError}</div>
                )}
                {!msgLoading && !msgError && msgList.length === 0 && (
                  <div style={{ color: s.colors.gray, textAlign: 'center', padding: 24 }}>
                    No messages yet
                  </div>
                )}
                {!msgLoading &&
                  msgList.map((m) => (
                    <Link
                      key={m.id}
                      to={m.room?.id ? `/room/${m.room.id}` : '#'}
                      onClick={closeMessages}
                      style={{
                        display: 'block',
                        background: s.colors.dark,
                        border: `1px solid ${s.colors.darkLight}`,
                        borderRadius: 10,
                        padding: '12px 14px',
                        marginBottom: 10,
                        textDecoration: 'none',
                        transition: 'border-color 150ms ease, background 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = s.colors.main;
                        e.currentTarget.style.background = '#2f3044';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = s.colors.darkLight;
                        e.currentTarget.style.background = s.colors.dark;
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            color: s.colors.main,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          {m.room?.name || 'Room'}
                        </span>
                        <span style={{ color: s.colors.gray, fontSize: 11 }}>
                          {m.created ? new Date(m.created).toLocaleString() : ''}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          color: s.colors.light,
                          fontSize: 14,
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                        }}
                      >
                        {m.body}
                      </p>
                    </Link>
                  ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AdminUsers;
