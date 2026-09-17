import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { getRooms, deleteRoom, getTopics, getUsers } from '../../api/admin';
import { getMessages } from '../../api/messages';
import { useToast } from '../../context/ToastContext';
import Avatar from '../../components/Avatar';
import ConfirmModal from '../../components/ConfirmModal';
import AdminBulkUploadRoomsModal from './AdminBulkUploadRoomsModal';
import SearchableSelect from '../../components/SearchableSelect';
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

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [topicOptions, setTopicOptions] = useState([]);
  const [hostFilter, setHostFilter] = useState('');
  const [hostOptions, setHostOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const [confirmRoom, setConfirmRoom] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { showToast } = useToast();

  // Messages modal (same pattern as Admin Users)
  const [msgRoom, setMsgRoom] = useState(null);
  const [msgList, setMsgList] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState(null);

  const openMessages = async (room) => {
    setMsgRoom(room);
    setMsgList([]);
    setMsgError(null);
    setMsgLoading(true);
    try {
      const data = await getMessages({ roomId: room.id, page_size: 50 });
      setMsgList(data.results || []);
    } catch (err) {
      setMsgError(err.message || 'Failed to load messages');
    } finally {
      setMsgLoading(false);
    }
  };

  const closeMessages = () => {
    setMsgRoom(null);
    setMsgList([]);
    setMsgError(null);
  };

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const data = await getTopics({ page: 1, page_size: 100 });
        let list = data.results || [];
        if (data.next) {
          try {
            const page2 = await getTopics({ page: 2, page_size: 100 });
            list = [...list, ...(page2.results || [])];
          } catch (_) { /* ignore */ }
        }
        setTopicOptions(list);
      } catch (_) {
        /* ignore – dropdown just stays empty */
      }
    };
    const loadHosts = async () => {
      try {
        // Load users for host filter (up to 200; enough for admin host dropdown)
        const data = await getUsers({ page: 1, page_size: 200 });
        setHostOptions(data.results || []);
      } catch (_) {
        /* ignore */
      }
    };
    loadTopics();
    loadHosts();
  }, []);

  const topicSelectOptions = useMemo(
    () => topicOptions.map((t) => ({ value: t.name, label: t.name })),
    [topicOptions]
  );

  const hostSelectOptions = useMemo(
    () => hostOptions.map((u) => ({ value: String(u.id), label: u.username })),
    [hostOptions]
  );

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRooms({
        search: search || undefined,
        topic: topicFilter || undefined,
        host: hostFilter || undefined,
        page,
        page_size: pageSize,
      });
      setRooms(data.results || []);
      setPagination({ count: data.count, next: data.next, previous: data.previous });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, topicFilter, hostFilter, page, pageSize]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleUploadSuccess = useCallback((summary) => {
    if (!summary) {
      fetchRooms();
      return;
    }
    const { isClean, created_count, duplicates_count, errors_count } = summary;
    if (isClean) {
      showToast(`Successfully created ${created_count} room${created_count > 1 ? 's' : ''} from spreadsheet!`, 'success');
    } else if (created_count > 0) {
      const notes = [];
      if (duplicates_count > 0) notes.push(`${duplicates_count} duplicate(s) skipped`);
      if (errors_count > 0) notes.push(`${errors_count} error(s)`);
      const extra = notes.length > 0 ? ` (${notes.join(', ')})` : '';
      showToast(`Import completed: ${created_count} room${created_count > 1 ? 's' : ''} created${extra}.`, 'success');
    }
    setPage(1);
    fetchRooms();
  }, [showToast, fetchRooms]);

  const requestDelete = (room) => setConfirmRoom(room);

  const runDelete = async () => {
    if (!confirmRoom) return;
    setConfirmLoading(true);
    setBusyId(confirmRoom.id);
    setError(null);
    try {
      const result = await deleteRoom(confirmRoom.id);
      setRooms((prev) => prev.filter((r) => r.id !== confirmRoom.id));
      showToast(result?.detail || 'Room deleted', 'success');
      setConfirmRoom(null);
    } catch (err) {
      setError(err.message);
      showToast(err.message || 'Failed to delete room', 'error');
      setConfirmRoom(null);
    } finally {
      setConfirmLoading(false);
      setBusyId(null);
    }
  };

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
            <span>Rooms</span>
          </h1>
        </div>
        <div style={s.filterBar}>
          <SearchableSelect
            options={topicSelectOptions}
            value={topicFilter || null}
            onChange={(val) => {
              setTopicFilter(val || '');
              setPage(1);
            }}
            placeholder="All topics"
            emptyLabel="All topics"
            allowClear
            style={{ minWidth: 160 }}
          />
          <SearchableSelect
            options={hostSelectOptions}
            value={hostFilter || null}
            onChange={(val) => {
              setHostFilter(val || '');
              setPage(1);
            }}
            placeholder="All hosts"
            emptyLabel="All hosts"
            allowClear
            style={{ minWidth: 160 }}
          />
          <input
            type="text"
            placeholder="Search rooms..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={s.searchInput}
          />
          {(topicFilter || hostFilter || searchInput) && (
            <button
              type="button"
              style={s.btn('default')}
              onClick={() => {
                setTopicFilter('');
                setHostFilter('');
                setSearchInput('');
                setSearch('');
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setUploadModalOpen(true)}
            style={{
              ...s.btn('default'),
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload XLSX
          </button>
          <Link
            to="/admin/rooms/create"
            style={{
              ...s.btn('primary'),
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              fontSize: 13,
              boxShadow: '0 2px 8px rgba(94, 200, 224, 0.25)',
            }}
          >
            <span style={{ fontSize: 16, lineHeight: 1, fontWeight: 700 }}>+</span> Add Room
          </Link>
        </div>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      <div style={s.card}>
        {loading ? (
          <div style={s.emptyState}>Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div style={{ ...s.emptyState, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span>No rooms found.</span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setUploadModalOpen(true)}
                style={{
                  ...s.btn('default'),
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload XLSX
              </button>
              <Link
                to="/admin/rooms/create"
                style={{
                  ...s.btn('primary'),
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1, fontWeight: 700 }}>+</span> Add Room
              </Link>
            </div>
          </div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Room</th>
                  <th style={s.th}>Topic</th>
                  <th style={s.th}>Host</th>
                  <th style={s.th}>Participants</th>
                  <th style={s.th}>Messages</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, index) => (
                  <tr key={room.id}>
                    <td style={{ ...s.td, color: s.colors.gray, fontWeight: 600, width: 48 }}>
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td style={s.td}>
                      <Link to={`/room/${room.id}`} style={{ color: '#fff', fontWeight: '600' }}>
                        {room.name}
                      </Link>
                    </td>
                    <td style={s.td}>
                      <span style={s.badge('default')}>{room.topic?.name || '-'}</span>
                    </td>
                    <td style={s.td}>
                      {room.host ? (
                        <Link to={`/profile/${room.host.id}`} style={{ color: s.colors.main }}>
                          @{room.host.username}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={s.td}>
                      {Array.isArray(room.participants) && room.participants.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                          {room.participants.slice(0, 4).map((u) => (
                            <Link
                              key={u.id}
                              to={`/profile/${u.id}`}
                              style={{
                                color: s.colors.main,
                                fontSize: 12,
                                textDecoration: 'none',
                                background: 'rgba(94,200,224,0.12)',
                                padding: '2px 7px',
                                borderRadius: 6,
                                fontWeight: 500,
                              }}
                            >
                              @{u.username}
                            </Link>
                          ))}
                          {room.participants.length > 4 && (
                            <span style={{ color: s.colors.gray, fontSize: 12 }}>
                              +{room.participants.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: s.colors.gray }}>—</span>
                      )}
                    </td>
                    <td style={s.td}>
                      <button
                        type="button"
                        onClick={() => openMessages(room)}
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
                        {room.messages_count ?? 0}
                      </button>
                    </td>
                    <td style={s.td}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <Link
                          to={`/admin/rooms/${room.id}/edit`}
                          style={{
                            ...s.btn('default'),
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          Edit
                        </Link>
                        <button
                          style={s.btn('danger')}
                          disabled={busyId === room.id}
                          onClick={() => requestDelete(room)}
                        >
                          {busyId === room.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      <AdminBulkUploadRoomsModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <ConfirmModal
        open={!!confirmRoom}
        title="Delete room"
        message={
          confirmRoom
            ? `Delete room "${confirmRoom.name}"? This also deletes its messages.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={confirmLoading}
        onConfirm={runDelete}
        onCancel={() => !confirmLoading && setConfirmRoom(null)}
      />

      {msgRoom &&
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
                <div>
                  <div style={{ color: s.colors.light, fontWeight: 700, fontSize: 15 }}>
                    {msgRoom.name}
                  </div>
                  <div style={{ color: s.colors.gray, fontSize: 12 }}>
                    {msgRoom.messages_count ?? msgList.length} messages
                    {msgRoom.topic?.name ? ` · ${msgRoom.topic.name}` : ''}
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
                  msgList.map((m) => {
                    const roomId = m.room?.id || msgRoom?.id;
                    return (
                      <Link
                        key={m.id}
                        to={roomId ? `/room/${roomId}` : '#'}
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
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar src={m.user?.avatar} alt={m.user?.username} size={24} />
                            <span
                              style={{
                                color: s.colors.main,
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              @{m.user?.username || 'user'}
                            </span>
                          </div>
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
                    );
                  })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default AdminRooms;
