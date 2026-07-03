import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Star, X } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import Layout from '../components/Layout';
import CampusMap from '../components/CampusMap';
import RideStatusBadge from '../components/RideStatusBadge';
import RatingModal from '../components/RatingModal';

export default function PassengerDashboard() {
  const { socket } = useSocket();
  const [locations, setLocations] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRating, setShowRating] = useState(null);

  const fetchData = async () => {
    const [locRes, driverRes, activeRes, historyRes] = await Promise.all([
      api.get('/locations'),
      api.get('/drivers/available'),
      api.get('/rides/active'),
      api.get('/rides/my'),
    ]);
    setLocations(locRes.data.locations);
    setDrivers(driverRes.data.drivers);
    setActiveRide(activeRes.data.ride);
    setRideHistory(historyRes.data.rides);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleRideUpdate = (ride) => {
      const userId = JSON.parse(localStorage.getItem('user'))?._id;
      const passengerId = (ride.passenger?._id || ride.passenger)?.toString();
      if (passengerId === userId) {
        setActiveRide(['requested', 'accepted', 'in_progress'].includes(ride.status) ? ride : null);
        if (ride.status === 'completed' && !ride.rating?.score) {
          setShowRating(ride);
        }
        fetchData();
      }
    };

    socket.on('ride:update', handleRideUpdate);
    socket.on('ride:assigned', handleRideUpdate);
    socket.on('driver:availability', () => {
      api.get('/drivers/available').then((res) => setDrivers(res.data.drivers));
    });

    return () => {
      socket.off('ride:update', handleRideUpdate);
      socket.off('ride:assigned', handleRideUpdate);
      socket.off('driver:availability');
    };
  }, [socket]);

  const handleRequestRide = async (e) => {
    e.preventDefault();
    if (!pickup || !destination) return;
    setLoading(true);
    try {
      const { data } = await api.post('/rides', {
        pickup: { location: pickup },
        destination: { location: destination },
      });
      setActiveRide(data.ride);
      setPickup('');
      setDestination('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeRide) return;
    try {
      await api.patch(`/rides/${activeRide._id}/cancel`);
      setActiveRide(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const pickupLoc = locations.find((l) => l.name === pickup);
  const destLoc = locations.find((l) => l.name === destination);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Request a Ride</h1>
        <p className="text-gray-500">Book an e-rickshaw across IIT Roorkee campus</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {!activeRide ? (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Where to?</h2>
              <form onSubmit={handleRequestRide} className="space-y-4">
                <div>
                  <label className="label flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500" /> Pickup Location
                  </label>
                  <select className="input-field" value={pickup} onChange={(e) => setPickup(e.target.value)} required>
                    <option value="">Select pickup point</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-red-500" /> Destination
                  </label>
                  <select className="input-field" value={destination} onChange={(e) => setDestination(e.target.value)} required>
                    <option value="">Select destination</option>
                    {locations.filter((l) => l.name !== pickup).map((loc) => (
                      <option key={loc.id} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={loading || drivers.length === 0} className="btn-primary w-full py-3">
                  {loading ? 'Requesting...' : drivers.length === 0 ? 'No Drivers Available' : 'Request Ride'}
                </button>
              </form>
            </div>
          ) : (
            <div className="card border-2 border-primary-200">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-semibold">Active Ride</h2>
                <RideStatusBadge status={activeRide.status} />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>{activeRide.pickup?.location}</span>
                </div>
                <div className="border-l-2 border-dashed border-gray-300 h-4 ml-1.5" />
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>{activeRide.destination?.location}</span>
                </div>
              </div>

              {activeRide.driver && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="font-medium">{activeRide.driver.name}</p>
                  <p className="text-sm text-gray-500">
                    {activeRide.driver.vehicleInfo?.type} • {activeRide.driver.vehicleInfo?.number}
                  </p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {activeRide.driver.averageRating || 'New'}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary-600">₹{activeRide.fare}</span>
                {['requested', 'accepted'].includes(activeRide.status) && (
                  <button onClick={handleCancel} className="btn-danger flex items-center gap-1">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold mb-3">Available Drivers ({drivers.length})</h3>
            {drivers.length === 0 ? (
              <p className="text-gray-500 text-sm">No drivers online right now</p>
            ) : (
              <div className="space-y-2">
                {drivers.map((d) => (
                  <div key={d._id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.vehicleInfo?.number}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {d.averageRating || 'New'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <CampusMap
            drivers={drivers}
            pickup={pickupLoc ? { ...pickupLoc, location: pickup } : activeRide?.pickup}
            destination={destLoc ? { ...destLoc, location: destination } : activeRide?.destination}
            height="350px"
          />

          <div className="card">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Ride History
            </h3>
            {rideHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No rides yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {rideHistory.slice(0, 10).map((ride) => (
                  <div key={ride._id} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                    <div>
                      <p>{ride.pickup?.location} → {ride.destination?.location}</p>
                      <p className="text-xs text-gray-500">₹{ride.fare}</p>
                    </div>
                    <RideStatusBadge status={ride.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showRating && (
        <RatingModal
          ride={showRating}
          onClose={() => setShowRating(null)}
          onRated={() => fetchData()}
        />
      )}
    </Layout>
  );
}
