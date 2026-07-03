import { Link, useNavigate } from 'react-router-dom';
import { Bus, LogOut, User, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to={user ? (user.role === 'driver' ? '/driver' : '/passenger') : '/'} className="flex items-center gap-2">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">CampusRide</span>
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="flex items-center gap-1.5 text-sm">
                  {connected ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={connected ? 'text-green-600' : 'text-gray-400'}>
                    {connected ? 'Live' : 'Offline'}
                  </span>
                </div>

                <Link to="/profile" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user.name}</span>
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full capitalize">
                    {user.role}
                  </span>
                </Link>

                <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
