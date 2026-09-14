import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import RoomCard from '../components/RoomCard';
import ActivitySidebar from '../components/ActivitySidebar';
import AdminSidebarMenu from '../components/AdminSidebarMenu';
import AdminRooms from './admin/AdminRooms';
import AdminTopics from './admin/AdminTopics';
import AdminUsers from './admin/AdminUsers';
import AdminEditRoom from './admin/AdminEditRoom';
import AdminReports from './admin/AdminReports';
import { getRooms } from '../api/rooms';
import { getTopics } from '../api/topics';

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('q') || '';

  const adminView = location.pathname.match(/^\/admin\/rooms\/\d+\/edit\/?$/)
    ? 'room-edit'
    : location.pathname.startsWith('/admin/rooms')
      ? 'rooms'
      : location.pathname.startsWith('/admin/topics')
        ? 'topics'
        : location.pathname.startsWith('/admin/users')
          ? 'users'
          : location.pathname.startsWith('/admin/reports')
            ? 'reports'
            : null;

  useEffect(() => {
    if (!adminView) fetchRooms();
  }, [selectedTopic, searchQuery, adminView]);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchRooms = async () => {
    setRoomsLoading(true);
    setError(null);

    try {
      const data = await getRooms({
        topic: selectedTopic || undefined,
        search: searchQuery || undefined,
      });
      // API returns a plain array (no pagination on home)
      setRooms(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setRoomsLoading(false);
      setInitialLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const data = await getTopics();
      setTopics(data.results || []);
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    }
  };

  if (!adminView && initialLoading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#7a7c90', fontSize: '15px' }}>
        Loading...
      </div>
    );
  }

  if (!adminView && error) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#ff5c3a', fontSize: '15px' }}>
        {error}
      </div>
    );
  }

  const topicBtn = (active) => ({
    background: active ? '#5ec8e0' : 'transparent',
    color: active ? '#1e1f2b' : '#a8aabc',
    border: 'none',
    padding: '9px 12px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    fontWeight: active ? '600' : '500',
    fontSize: '14px',
    borderRadius: '8px',
    transition: 'background 150ms ease, color 150ms ease',
  });

  const stickySidebar = {
    position: 'sticky',
    top: 90,
    alignSelf: 'start',
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
  };

  // Activity: sticky under navbar but no internal scrollbar — page scrolls as a whole
  const stickyActivity = {
    position: 'sticky',
    top: 90,
    alignSelf: 'start',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: adminView ? '240px 1fr' : '240px 1fr 300px',
        gap: '28px',
        padding: '28px 40px 48px',
        maxWidth: '1380px',
        margin: '0 auto',
        alignItems: 'start',
      }}
    >
      {/* Left sidebar — sticky */}
      <div style={stickySidebar}>
        <AdminSidebarMenu />

        {!adminView && (
          <>
            <h3
              style={{
                fontSize: '11px',
                color: '#7a7c90',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '12px',
                fontWeight: '700',
              }}
            >
              Browse Topics
            </h3>

            <div style={{ marginBottom: '4px' }}>
              <button
                onClick={() => setSelectedTopic('')}
                style={topicBtn(selectedTopic === '')}
                onMouseEnter={(e) => {
                  if (selectedTopic !== '') e.currentTarget.style.background = '#34354a';
                }}
                onMouseLeave={(e) => {
                  if (selectedTopic !== '') e.currentTarget.style.background = 'transparent';
                }}
              >
                All
              </button>
            </div>

            {topics.map((topic) => (
              <div key={topic.id} style={{ marginBottom: '3px' }}>
                <button
                  onClick={() => setSelectedTopic(topic.name)}
                  style={topicBtn(selectedTopic === topic.name)}
                  onMouseEnter={(e) => {
                    if (selectedTopic !== topic.name) e.currentTarget.style.background = '#34354a';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTopic !== topic.name) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {topic.name}
                  <span
                    style={{
                      marginLeft: '6px',
                      opacity: 0.7,
                      fontWeight: '400',
                      fontSize: '12px',
                    }}
                  >
                    ({topic.room_count})
                  </span>
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Main content — scrolls with the page */}
      {adminView ? (
        <div style={{ minWidth: 0 }}>
          {adminView === 'rooms' && <AdminRooms />}
          {adminView === 'room-edit' && <AdminEditRoom />}
          {adminView === 'topics' && <AdminTopics />}
          {adminView === 'users' && <AdminUsers />}
          {adminView === 'reports' && <AdminReports />}
        </div>
      ) : (
        <>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '22px',
                borderBottom: '1px solid #36384f',
                paddingBottom: '16px',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '20px',
                    color: '#f0f0f5',
                    margin: 0,
                    fontWeight: '700',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Rooms
                </h2>
                <div style={{ color: '#7a7c90', fontSize: '13px', marginTop: '4px' }}>
                  {rooms.length} available
                </div>
              </div>
              <Link
                to="/create-room"
                style={{
                  background: '#5ec8e0',
                  color: '#1e1f2b',
                  padding: '10px 18px',
                  borderRadius: '9px',
                  fontWeight: '600',
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(94, 200, 224, 0.25)',
                }}
              >
                <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Create Room
              </Link>
            </div>

            <div
              style={{
                marginBottom: '18px',
                color: '#7a7c90',
                fontSize: '13px',
                fontWeight: '500',
              }}
            >
              {searchQuery
                ? `Search results for “${searchQuery}”`
                : selectedTopic
                  ? `Rooms in “${selectedTopic}”`
                  : 'All rooms'}
            </div>

            {roomsLoading ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#7a7c90' }}>
                Loading rooms...
              </div>
            ) : rooms.length > 0 ? (
              rooms.map((room) => <RoomCard key={room.id} room={room} />)
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '56px 24px',
                  color: '#7a7c90',
                  background: '#2a2b3d',
                  borderRadius: '14px',
                  border: '1px dashed #40425a',
                }}
              >
                <div style={{ fontSize: '15px', marginBottom: '6px' }}>No rooms found</div>
                <div style={{ fontSize: '13px', opacity: 0.8 }}>
                  Try another topic or create a new room
                </div>
              </div>
            )}
          </div>

          {/* Activity — also sticky on home */}
          <div style={stickyActivity}>
            <ActivitySidebar limit={5} />
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
