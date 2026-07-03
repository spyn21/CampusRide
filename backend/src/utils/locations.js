// IIT Roorkee campus locations
export const CAMPUS_LOCATIONS = [
  { id: 'main-gate', name: 'Main Gate', lat: 29.8647, lng: 77.8997 },
  { id: 'library', name: 'Central Library', lat: 29.8665, lng: 77.9012 },
  { id: 'convocation', name: 'Convocation Hall', lat: 29.8678, lng: 77.9035 },
  { id: 'sports', name: 'Sports Complex', lat: 29.8620, lng: 77.8965 },
  { id: 'bhawan-a', name: 'Rajendra Bhawan', lat: 29.8690, lng: 77.9040 },
  { id: 'bhawan-b', name: 'Govind Bhawan', lat: 29.8680, lng: 77.9025 },
  { id: 'civil-dept', name: 'Civil Engineering Dept', lat: 29.8655, lng: 77.9005 },
  { id: 'canteen', name: 'Cafeteria', lat: 29.8660, lng: 77.9018 },
  { id: 'admin', name: 'Admin Block', lat: 29.8650, lng: 77.8990 },
  { id: 'hospital', name: 'Campus Hospital', lat: 29.8635, lng: 77.8980 },
];

export const calculateFare = (pickup, destination) => {
  const dx = pickup.lat - destination.lat;
  const dy = pickup.lng - destination.lng;
  const distance = Math.sqrt(dx * dx + dy * dy) * 111;
  return Math.max(20, Math.round(distance * 15));
};

export const findLocation = (locationName) => {
  return CAMPUS_LOCATIONS.find(
    (l) => l.name.toLowerCase() === locationName.toLowerCase() || l.id === locationName
  );
};
