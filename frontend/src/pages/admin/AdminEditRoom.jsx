import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getRoom } from '../../api/rooms';
import { updateRoom, getUsers, getTopics } from '../../api/admin';
import { useToast } from '../../context/ToastContext';
import SearchableSelect, { SearchableMultiSelect } from '../../components/SearchableSelect';
import * as s from './adminStyles';

const crumbLink = {
  color: s.colors.main,
  textDecoration: 'none',
  transition: 'color 150ms ease, opacity 150ms ease',
};
const crumbLinkHover = (e, enter) => {
  e.currentTarget.style.textDecoration = enter ? 'underline' : 'none';
  e.currentTarget.style.opacity = enter ? '0.85' : '1';
};

const AdminEditRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topicName, setTopicName] = useState('');
  const [hostId, setHostId] = useState(null);
  const [participantIds, setParticipantIds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [topics, setTopics] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [room, usersData, topicsData] = await Promise.all([
        getRoom(id),
        getUsers({ page: 1, page_size: 100 }), // large page for searchable dropdown
        getTopics({ page: 1 }),
      ]);

      // If users are heavily paginated, try to load more pages (best-effort)
      let users = usersData.results || [];
      if (usersData.next) {
        try {
          const page2 = await getUsers({ page: 2 });
          users = [...users, ...(page2.results || [])];
        } catch (_) {
          /* ignore */
        }
      }

      setAllUsers(users);
      setTopics(topicsData.results || []);

      setName(room.name || '');
      setDescription(room.description || '');
      setTopicName(room.topic?.name || '');

      const parts = room.participants || [];
      const pIds = parts.map((p) => p.id);
      setParticipantIds(pIds);

      // Host must be one of the participants (or null)
      const host = room.host;
      if (host && pIds.includes(host.id)) {
        setHostId(host.id);
      } else if (host) {
        // host not in participants list returned — still preselect and add to participants
        setParticipantIds((prev) => (prev.includes(host.id) ? prev : [...prev, host.id]));
        setHostId(host.id);
        if (!users.find((u) => u.id === host.id)) {
          setAllUsers((prev) => [...prev, host]);
        }
      } else {
        setHostId(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load room');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const userOptions = useMemo(
    () =>
      allUsers.map((u) => ({
        value: u.id,
        label: `@${u.username}${u.name ? ` (${u.name})` : ''}`,
      })),
    [allUsers]
  );

  // Host options = only currently selected participants
  const hostOptions = useMemo(() => {
    const set = new Set(participantIds.map(String));
    return userOptions.filter((o) => set.has(String(o.value)));
  }, [userOptions, participantIds]);

  // When participants change, if current host is no longer a participant, clear host
  useEffect(() => {
    if (hostId != null && !participantIds.map(String).includes(String(hostId))) {
      setHostId(null);
    }
  }, [participantIds, hostId]);

  const topicOptions = useMemo(
    () =>
      topics.map((t) => ({
        value: t.name,
        label: t.name,
      })),
    [topics]
  );

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Room name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        topic: topicName || '',
        host: hostId, // null or user id — backend should accept
        participants: participantIds, // array of user ids
      };
      await updateRoom(id, payload);
      showToast('Room updated successfully', 'success');
      navigate('/admin/rooms');
    } catch (err) {
      const msg = err.message || 'Failed to update room';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={s.emptyState}>Loading room...</div>
    );
  }

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
          <Link to="/admin/rooms" style={crumbLink}
            onMouseEnter={(e) => crumbLinkHover(e, true)}
            onMouseLeave={(e) => crumbLinkHover(e, false)}>
            Rooms
          </Link>
          <span style={{ color: s.colors.gray, fontWeight: 400 }}>/</span>
          <span>Edit</span>
        </h1>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      <form onSubmit={handleSave} style={{ ...s.card, padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Room name */}
          <div>
            <label style={labelStyle}>Room</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Room name"
              required
              style={s.searchInput}
            />
          </div>

          {/* Topic */}
          <div>
            <label style={labelStyle}>Topic</label>
            <SearchableSelect
              options={topicOptions}
              value={topicName || null}
              onChange={(v) => setTopicName(v || '')}
              placeholder="Select or leave empty"
              emptyLabel="No topic"
              allowClear
            />
            <div style={{ marginTop: 6, fontSize: 12, color: s.colors.gray }}>
              Or type a new topic name in the search and pick “No topic” then save with free text:
            </div>
            <input
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="Topic name (free text also accepted)"
              style={{ ...s.searchInput, marginTop: 6 }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Description"
              style={{
                ...s.searchInput,
                width: '100%',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Participants (all users, searchable multi) */}
          <div>
            <label style={labelStyle}>Participants</label>
            <SearchableMultiSelect
              options={userOptions}
              value={participantIds}
              onChange={setParticipantIds}
              placeholder="Type to search users..."
            />
            <div style={{ marginTop: 6, fontSize: 12, color: s.colors.gray }}>
              Any user can be added. Host must be one of the participants.
            </div>
          </div>

          {/* Host (from current participants only) */}
          <div>
            <label style={labelStyle}>Host</label>
            <SearchableSelect
              options={hostOptions}
              value={hostId}
              onChange={setHostId}
              placeholder={
                participantIds.length === 0
                  ? 'Add participants first'
                  : 'Select host from participants'
              }
              emptyLabel="No host"
              allowClear
              disabled={participantIds.length === 0}
            />
            <div style={{ marginTop: 6, fontSize: 12, color: s.colors.gray }}>
              Host is chosen only from the current participants. Clearing all participants clears the host.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" style={s.btn('primary')} disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              type="button"
              style={s.btn('default')}
              disabled={saving}
              onClick={() => navigate('/admin/rooms')}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  marginBottom: 7,
  fontSize: 13,
  fontWeight: 500,
  color: s.colors.lightGray,
};

export default AdminEditRoom;
