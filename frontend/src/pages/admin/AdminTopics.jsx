import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getTopics, createTopic, updateTopic, deleteTopic } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
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

const AdminTopics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [hasRooms, setHasRooms] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [pagination, setPagination] = useState(null);

  const [newTopicName, setNewTopicName] = useState('');
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [confirmTopic, setConfirmTopic] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const { showToast } = useToast();

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTopics({
        search: search || undefined,
        has_rooms: hasRooms || undefined,
        page,
        page_size: pageSize,
      });
      setTopics(data.results || []);
      setPagination({ count: data.count, next: data.next, previous: data.previous });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, hasRooms, page, pageSize]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newTopicName.trim();
    if (!name) {
      setError('Topic name is required.');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await createTopic({ name });
      setNewTopicName('');
      setPage(1);
      const data = await getTopics({ search: search || undefined, page: 1, page_size: pageSize });
      setTopics(data.results || []);
      setPagination({ count: data.count, next: data.next, previous: data.previous });
      showToast('Topic created', 'success');
    } catch (err) {
      const msg = err.message || 'Failed to create topic';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (topic) => {
    setEditingId(topic.id);
    setEditingName(topic.name);
  };

  const handleRename = async (topic) => {
    if (!editingName.trim() || editingName.trim() === topic.name) {
      setEditingId(null);
      return;
    }

    setBusyId(topic.id);
    setError(null);
    try {
      const updated = await updateTopic(topic.id, { name: editingName.trim() });
      setTopics((prev) => prev.map((t) => (t.id === topic.id ? updated : t)));
      setEditingId(null);
      showToast('Topic renamed', 'success');
    } catch (err) {
      const msg = err.message || 'Failed to rename topic';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const requestDelete = (topic) => setConfirmTopic(topic);

  const runDelete = async () => {
    if (!confirmTopic) return;
    setConfirmLoading(true);
    setBusyId(confirmTopic.id);
    setError(null);
    try {
      const result = await deleteTopic(confirmTopic.id);
      setTopics((prev) => prev.filter((t) => t.id !== confirmTopic.id));
      showToast(result?.detail || 'Topic deleted', 'success');
      setConfirmTopic(null);
    } catch (err) {
      const msg = err.message || 'Failed to delete topic';
      setError(msg);
      showToast(msg, 'error');
      setConfirmTopic(null);
    } finally {
      setConfirmLoading(false);
      setBusyId(null);
    }
  };

  return (
    <div>
      <div style={s.pageHeader}>
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
          <span>Topics</span>
        </h1>
        <div style={s.filterBar}>
          <select
            value={hasRooms}
            onChange={(e) => {
              setHasRooms(e.target.value);
              setPage(1);
            }}
            style={s.selectInput}
          >
            <option value="">All topics</option>
            <option value="yes">With rooms</option>
            <option value="no">Empty (no rooms)</option>
          </select>
          <input
            type="text"
            placeholder="Search topics"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={s.searchInput}
          />
          {(hasRooms || searchInput) && (
            <button
              type="button"
              style={s.btn('default')}
              onClick={() => {
                setHasRooms('');
                setSearchInput('');
                setSearch('');
                setPage(1);
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        style={{
          ...s.card,
          padding: '16px 20px',
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="New topic name"
          value={newTopicName}
          onChange={(e) => setNewTopicName(e.target.value)}
          disabled={creating}
          style={{ ...s.searchInput, flex: 1, minWidth: '180px' }}
        />
        <button
          type="submit"
          style={{
            ...s.btn('primary'),
            opacity: creating || !newTopicName.trim() ? 0.6 : 1,
            cursor: creating || !newTopicName.trim() ? 'not-allowed' : 'pointer',
          }}
          disabled={creating || !newTopicName.trim()}
        >
          {creating ? 'Adding...' : 'Add topic'}
        </button>
      </form>

      {error && <div style={s.errorBox}>{error}</div>}

      <div style={s.card}>
        {loading ? (
          <div style={s.emptyState}>Loading topics...</div>
        ) : topics.length === 0 ? (
          <div style={s.emptyState}>No topics found. Add one above.</div>
        ) : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>Rooms</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic, index) => (
                  <tr key={topic.id}>
                    <td style={{ ...s.td, color: s.colors.gray, fontWeight: 600, width: 48 }}>
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td style={s.td}>
                      {editingId === topic.id ? (
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(topic)}
                          style={s.searchInput}
                        />
                      ) : (
                        <span style={{ fontWeight: '600' }}>{topic.name}</span>
                      )}
                    </td>
                    <td style={s.td}>
                      {topic.rooms && topic.rooms.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {topic.rooms.map((room) => (
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
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {editingId === topic.id ? (
                          <>
                            <button
                              style={s.btn('primary')}
                              disabled={busyId === topic.id}
                              onClick={() => handleRename(topic)}
                            >
                              Save
                            </button>
                            <button style={s.btn('default')} onClick={() => setEditingId(null)}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button style={s.btn('default')} onClick={() => startEdit(topic)}>
                              Rename
                            </button>
                            <button
                              style={s.btn('danger')}
                              disabled={busyId === topic.id}
                              onClick={() => requestDelete(topic)}
                            >
                              {busyId === topic.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        )}
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

      <ConfirmModal
        open={!!confirmTopic}
        title="Delete topic"
        message={
          confirmTopic
            ? `Delete topic "${confirmTopic.name}"? Rooms using it will be kept but lose their topic.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={confirmLoading}
        onConfirm={runDelete}
        onCancel={() => !confirmLoading && setConfirmTopic(null)}
      />
    </div>
  );
};

export default AdminTopics;