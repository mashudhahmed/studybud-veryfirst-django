import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createRoom, getUsers, getTopics } from '../../api/admin';
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

const AdminCreateRoom = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
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
      const [usersData, topicsData] = await Promise.all([
        getUsers({ page: 1, page_size: 100 }),
        getTopics({ page: 1, page_size: 100 }),
      ]);

      let users = usersData.results || [];
      if (usersData.next) {
        try {
          const page2 = await getUsers({ page: 2, page_size: 100 });
          users = [...users, ...(page2.results || [])];
        } catch (_) {
          /* ignore */
        }
      }

      setAllUsers(users);
      setTopics(topicsData.results || []);

      // Default host to current admin user if available
      if (currentUser?.id) {
        setHostId(currentUser.id);
        setParticipantIds([currentUser.id]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load form options');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

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

  // Host options can come from all users or chosen participants
  const hostOptions = useMemo(() => {
    if (participantIds.length === 0) {
      return userOptions;
    }
    const set = new Set(participantIds.map(String));
    return userOptions.filter((o) => set.has(String(o.value)));
  }, [userOptions, participantIds]);

  // When host changes to a user, make sure they are in participantIds
  const handleHostChange = (newHostId) => {
    setHostId(newHostId);
    if (newHostId != null) {
      setParticipantIds((prev) =>
        prev.map(String).includes(String(newHostId)) ? prev : [...prev, newHostId]
      );
    }
  };

  // When participants change, if host is no longer in participants, clear or adjust
  const handleParticipantsChange = (newParticipantIds) => {
    setParticipantIds(newParticipantIds);
    if (hostId != null && !newParticipantIds.map(String).includes(String(hostId))) {
      setHostId(null);
    }
  };

  const topicOptions = useMemo(
    () =>
      topics.map((t) => ({
        value: t.name,
        label: t.name,
      })),
    [topics]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Room name is required.');
      return;
    }
    if (name.trim().length < 3) {
      setError('Room name must be at least 3 characters long.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Ensure host is in participants if specified
      const finalParticipants = [...participantIds];
      if (hostId != null && !finalParticipants.map(String).includes(String(hostId))) {
        finalParticipants.push(hostId);
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        topic: topicName.trim() || undefined,
        host: hostId || undefined,
        participants: finalParticipants.length > 0 ? finalParticipants : undefined,
      };

      await createRoom(payload);
      showToast('Room created successfully', 'success');
      navigate('/admin/rooms');
    } catch (err) {
      const msg = err.message || 'Failed to create room';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={s.emptyState}>Loading form...</div>;
  }

  return (
    <div>
      <div style={s.pageHeader}>
        <div style={s.pageHeaderTop}>
          <h1 style={{ ...s.title, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Link
              to="/"
              style={crumbLink}
              onMouseEnter={(e) => crumbLinkHover(e, true)}
              onMouseLeave={(e) => crumbLinkHover(e, false)}
            >
              Home
            </Link>
            <span style={{ color: s.colors.gray, fontWeight: 400 }}>/</span>
            <Link
              to="/admin/rooms"
              style={crumbLink}
              onMouseEnter={(e) => crumbLinkHover(e, true)}
              onMouseLeave={(e) => crumbLinkHover(e, false)}
            >
              Admin
            </Link>
            <span style={{ color: s.colors.gray, fontWeight: 400 }}>/</span>
            <Link
              to="/admin/rooms"
              style={crumbLink}
              onMouseEnter={(e) => crumbLinkHover(e, true)}
              onMouseLeave={(e) => crumbLinkHover(e, false)}
            >
              Rooms
            </Link>
            <span style={{ color: s.colors.gray, fontWeight: 400 }}>/</span>
            <span>Add Room</span>
          </h1>
        </div>
      </div>

      {error && <div style={s.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ ...s.card, padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Room name */}
          <div>
            <label style={labelStyle}>
              Room Name <span style={{ color: s.colors.error }}>*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fullstack React & Django Study Group"
              required
              minLength={3}
              style={{ ...s.searchInput, width: '100%' }}
            />
          </div>

          {/* Topic */}
          <div>
            <label style={labelStyle}>Topic</label>
            <SearchableSelect
              options={topicOptions}
              value={topicName || null}
              onChange={(v) => setTopicName(v || '')}
              placeholder="Select existing topic or enter new one below"
              emptyLabel="No topic"
              allowClear
            />
            <div style={{ marginTop: 6, fontSize: 12, color: s.colors.gray }}>
              Or type a new topic name:
            </div>
            <input
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="Topic name (will be created if it doesn't exist)"
              style={{ ...s.searchInput, width: '100%', marginTop: 6 }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this study room about?"
              style={{
                ...s.searchInput,
                width: '100%',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Participants */}
          <div>
            <label style={labelStyle}>Participants</label>
            <SearchableMultiSelect
              options={userOptions}
              value={participantIds}
              onChange={handleParticipantsChange}
              placeholder="Type to search and add participants..."
            />
            <div style={{ marginTop: 6, fontSize: 12, color: s.colors.gray }}>
              Any user can be added. The room host is automatically included as a participant.
            </div>
          </div>

          {/* Host */}
          <div>
            <label style={labelStyle}>Host</label>
            <SearchableSelect
              options={hostOptions}
              value={hostId}
              onChange={handleHostChange}
              placeholder="Select room host"
              emptyLabel="No host (defaults to admin)"
              allowClear
            />
            <div style={{ marginTop: 6, fontSize: 12, color: s.colors.gray }}>
              Host is selected from users or participants. Defaults to you (@{currentUser?.username || 'admin'}).
            </div>
          </div>

          {/* Submit / Cancel buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button
              type="submit"
              style={{
                ...s.btn('primary'),
                padding: '9px 20px',
                fontSize: 14,
              }}
              disabled={saving}
            >
              {saving ? 'Creating room...' : 'Create Room'}
            </button>
            <button
              type="button"
              style={{
                ...s.btn('default'),
                padding: '9px 18px',
                fontSize: 14,
              }}
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

export default AdminCreateRoom;
