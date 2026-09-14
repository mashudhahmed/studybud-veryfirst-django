import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RoomDetail from './pages/RoomDetail';
import CreateRoom from './pages/CreateRoom';
import EditRoom from './pages/EditRoom';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Activities from './pages/Activities';
import AdminRoute from './components/AdminRoute';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? <Navigate to="/" replace /> : children;
};

const App = () => {
  return (
    <ToastProvider>
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/activities" element={<Activities />} />
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <Login />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <Register />
                </GuestRoute>
              }
            />
            <Route path="/room/:id" element={<RoomDetail />} />
            <Route path="/profile/:id" element={<Profile />} />

            <Route
              path="/create-room"
              element={
                <ProtectedRoute>
                  <CreateRoom />
                </ProtectedRoute>
              }
            />

            <Route
              path="/room/:id/edit"
              element={
                <ProtectedRoute>
                  <EditRoom />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Navigate to="/admin/rooms" replace />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/rooms"
              element={
                <AdminRoute>
                  <Home />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/topics"
              element={
                <AdminRoute>
                  <Home />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <Home />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/rooms/:id/edit"
              element={
                <AdminRoute>
                  <Home />
                </AdminRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
    </ToastProvider>
  );
};

export default App;