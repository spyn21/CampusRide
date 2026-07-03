import { useState, useEffect } from 'react';
import {
  Power, MapPin, Navigation, Check, X, Play, Flag,
  TrendingUp, Star, DollarSign, Car,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Layout from '../components/Layout';
import RideStatusBadge from '../components/RideStatusBadge';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function DriverDashboard() {
  const { user, updateProfile } = useAuth();
  const { socket } = useSocket();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [pendingRides, setPendingRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState({});

  const fetchData = async () => {
    const [pendingRes, activeRes, dashRes] = await Promise.all([
      api.get('/rides/pending'),
      api.get('/rides/active'),
      api.get('/drivers/dashboard'),
    ]);
    setPendingRides(pendingRes.data.rides);
    setActiveRide(activeRes.data.ride);
    setDashboard(dashRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const refresh = () => fetchData();

    socket.on('ride:new', refresh);
    socket.on('ride:taken', refresh);
    socket.on('ride:update', (ride) => {
      const driverId = (ride.driver?._id || ride.driver)?.toString();
      if (driverId === user?._id) {
        setActiveRide(['accepted', 'in_progress'].includes(ride.status) ? ride : null);
        fetchData();
      }
    });

    return () => {
      socket.off('ride:new', refresh);
      socket.off('ride:taken', refresh);
      socket.off('ride:update');
    };
  }, [socket, user]);

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    setLoading({ online: true });
    try {
      const { data } = await api.patch('/drivers/availability', { isOnline: newStatus });
      setIsOnline(newStatus);
      updateProfile(data.user);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading({ online: false });
    }
  };

  const handleAccept = async (rideId) => {
    setLoading({ [rideId]: 'accept' });
    try {
      const { data } = await api.patch(`/rides/${rideId}/accept`);
      setActiveRide(data.ride);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept');
    } finally {
      setLoading({});
    }
  };

  const handleRideAction = async (action) => {
    if (!activeRide) return;
    setLoading({ action: true });
    try {
      const { data } = await api.patch(`/rides/${activeRide._id}/${action}`);
      setActiveRide(action === 'complete' ? null : data.ride);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} ride`);
    } finally {
      setLoading({});
    }
  };

  const weeklyData = (dashboard?.weeklyStats || []).map((s) => ({
    day: DAYS[s._id - 1] || `Day ${s._id}`,
    rides: s.count,
    earnings: s.earnings,
  }));

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Driver Dashboard</h1>
          <p className="text-gray-500">Manage rides and track your performance</p>
        </div>
        <button
          onClick={toggleOnline}
          disabled={loading.online}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
            isOnline
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Power className="w-5 h-5" />
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {dashboard && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Rides', value: dashboard.stats.totalRidesCompleted, icon: Car, color: 'text-blue-600' },
            { label: 'Active Rides', value: dashboard.stats.activeRides, icon: TrendingUp, color: 'text-purple-600' },
            { label: 'Today\'s Rides', value: dashboard.stats.todayRides, icon: MapPin, color: 'text-green-600' },
            { label: 'Total Earnings', value: `₹${dashboard.stats.totalEarnings}`, icon: DollarSign, color: 'text-orange-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <Icon className={`w-8 h-8 ${color} opacity-80`} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {activeRide ? (
            <div className="card border-2 border-green-200">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold">Current Ride</h2>
                <RideStatusBadge status={activeRide.status} />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <span>{activeRide.pickup?.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Navigation className="w-4 h-4 text-red-500" />
                  <span>{activeRide.destination?.location}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="font-medium">{activeRide.passenger?.name}</p>
                <p className="text-sm text-gray-500">{activeRide.passenger?.phone}</p>
              </div>

              <div className="flex gap-3">
                {activeRide.status === 'accepted' && (
                  <button
                    onClick={() => handleRideAction('start')}
                    disabled={loading.action}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Start Ride
                  </button>
                )}
                {activeRide.status === 'in_progress' && (
                  <button
                    onClick={() => handleRideAction('complete')}
                    disabled={loading.action}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Flag className="w-4 h-4" /> Complete Ride
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">
                Incoming Requests ({pendingRides.length})
              </h2>
              {!isOnline ? (
                <p className="text-gray-500">Go online to receive ride requests</p>
              ) : pendingRides.length === 0 ? (
                <p className="text-gray-500">No pending requests</p>
              ) : (
                <div className="space-y-3">
                  {pendingRides.map((ride) => (
                    <div key={ride._id} className="border rounded-lg p-4">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{ride.passenger?.name}</span>
                        <span className="text-primary-600 font-bold">₹{ride.fare}</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        {ride.pickup?.location} → {ride.destination?.location}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(ride._id)}
                          disabled={loading[ride._id]}
                          className="btn-primary flex-1 flex items-center justify-center gap-1 text-sm"
                        >
                          <Check className="w-4 h-4" /> Accept
                        </button>
                        <button className="btn-secondary flex-1 flex items-center justify-center gap-1 text-sm">
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {dashboard && (
            <div className="card">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Rating: {dashboard.stats.averageRating?.toFixed(1) || 'N/A'}
                <span className="text-sm text-gray-500 font-normal">
                  ({dashboard.stats.totalRatings} reviews)
                </span>
              </h3>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {weeklyData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4">Weekly Performance</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rides" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold mb-3">Ride History</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(dashboard?.rideHistory || []).map((ride) => (
                <div key={ride._id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                  <div>
                    <p>{ride.pickup?.location} → {ride.destination?.location}</p>
                    <p className="text-xs text-gray-500">
                      {ride.passenger?.name} • ₹{ride.fare}
                      {ride.rating?.score && ` • ${ride.rating.score}⭐`}
                    </p>
                  </div>
                  <RideStatusBadge status={ride.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
