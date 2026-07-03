import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const campusIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background:#2563eb;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const driverIcon = new L.DivIcon({
  className: 'custom-marker',
  html: '<div style="background:#16a34a;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const CAMPUS_CENTER = [29.8665, 77.9012];

export default function CampusMap({ drivers = [], pickup, destination, height = '300px' }) {
  const route =
    pickup && destination
      ? [
          [pickup.lat, pickup.lng],
          [destination.lat, destination.lng],
        ]
      : null;

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-gray-200">
      <MapContainer center={CAMPUS_CENTER} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {drivers.map((driver) => (
          <Marker
            key={driver._id}
            position={[driver.currentLocation?.lat || 29.8665, driver.currentLocation?.lng || 77.9012]}
            icon={driverIcon}
          >
            <Popup>
              <strong>{driver.name}</strong>
              <br />
              {driver.vehicleInfo?.type} - {driver.vehicleInfo?.number}
              <br />
              Rating: {driver.averageRating || 'N/A'} ⭐
            </Popup>
          </Marker>
        ))}

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={campusIcon}>
            <Popup>Pickup: {pickup.location}</Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={campusIcon}>
            <Popup>Destination: {destination.location}</Popup>
          </Marker>
        )}

        {route && <Polyline positions={route} color="#2563eb" weight={3} dashArray="8 8" />}
      </MapContainer>
    </div>
  );
}
