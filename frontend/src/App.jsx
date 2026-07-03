import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PassengerDashboard from './pages/PassengerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import Profile from './pages/Profile';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'driver' ? '/driver' : '/passenger'} />;
  }

  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={user.role === 'driver' ? '/driver' : '/passenger'} /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'driver' ? '/driver' : '/passenger'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'driver' ? '/driver' : '/passenger'} /> : <Register />} />
      <Route path="/passenger" element={<ProtectedRoute role="passenger"><PassengerDashboard /></ProtectedRoute>} />
      <Route path="/driver" element={<ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
