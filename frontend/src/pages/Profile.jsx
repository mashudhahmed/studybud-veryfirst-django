import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import RoomCard from '../components/RoomCard';
import Avatar from '../components/Avatar';
import { getUserProfile } from '../api/profiles';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    fetchProfile();
    
  }, [id]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getUserProfile(id);
      setProfile(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center' }}>Loading...</div>;
  }

  if (error || !profile) {
    return (
      <div style={{ padding: '30px', textAlign: 'center', color: '#fc4b0b' }}>
        {error || 'Profile not found'}
      </div>
    );
  }

  const isCurrentUser = user && user.id === profile.user.id;

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 15 }}>
        <Avatar src={profile.profile?.avatar} alt={profile.user.username} size={120} />
      </div>

      <h1 style={{ fontSize: '28px', color: '#fff', marginBottom: '5px', fontWeight: '600' }}>
        {profile.user.username}
      </h1>
      <p style={{ fontSize: '16px', color: '#71c6dd', marginBottom: '20px' }}>
        @{profile.user.username}
      </p>

      {isCurrentUser && (
        <Link
          to="/profile/edit"
          style={{
            display: 'inline-block',
            padding: '8px 24px',
            border: '2px solid #71c6dd',
            color: '#71c6dd',
            borderRadius: '30px',
            fontWeight: '600',
            fontSize: '14px',
            marginBottom: '30px',
          }}
        >
          Edit Profile
        </Link>
      )}

      <div
        style={{
          textAlign: 'left',
          color: '#8b8b8b',
          fontSize: '13px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '15px',
          borderBottom: '1px solid #3f4156',
          paddingBottom: '10px',
        }}
      >
        About
      </div>
      <div
        style={{
          textAlign: 'left',
          color: '#b2bdbd',
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '40px',
          background: '#3f4156',
          padding: '20px',
          borderRadius: '8px',
        }}
      >
        {profile.profile?.bio || "This user hasn't written a bio yet."}
      </div>

      <div
        style={{
          textAlign: 'left',
          color: '#8b8b8b',
          fontSize: '13px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '15px',
          borderBottom: '1px solid #3f4156',
          paddingBottom: '10px',
        }}
      >
        Study Rooms Hosted by {profile.user.username}
      </div>

      {profile.rooms?.length > 0 ? (
        profile.rooms.map((room) => <RoomCard key={room.id} room={room} />)
      ) : (
        <p style={{ color: '#8b8b8b', textAlign: 'center', padding: '20px' }}>
          No rooms created yet.
        </p>
      )}
    </div>
  );
};

export default Profile;
