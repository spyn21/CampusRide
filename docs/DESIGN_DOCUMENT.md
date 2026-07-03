# CampusRide - Design Document

## 1. Problem Understanding

IIT Roorkee campus spans a large geographical area and relies on e-rickshaws for last-mile transportation. Current coordination is fragmented and informal, leading to inefficient resource utilization, delays, and poor user experiences.

**CampusRide** solves this by providing a centralized digital platform that connects passengers with verified drivers through real-time ride management.

### Key Challenges
- Real-time synchronization between passengers and drivers
- Ensuring single-driver ride assignment (no double-booking)
- Maintaining consistent ride state across the workflow
- Scalable architecture for campus-wide deployment

---

## 2. System Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   React Client  │◄──────────────────►│  Express Server  │
│   (Vite + TW)   │     REST API       │  + Socket.IO     │
└─────────────────┘◄──────────────────►└────────┬────────┘
                                                │
                                       ┌────────▼────────┐
                                       │    MongoDB      │
                                       │  (Users, Rides) │
                                       └─────────────────┘
```

### Technology Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Leaflet |
| Backend | Node.js, Express.js |
| Real-time | Socket.IO (WebSocket) |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (JSON Web Tokens) |
| Charts | Recharts |

### Real-Time Events
| Event | Direction | Purpose |
|-------|-----------|---------|
| `ride:new` | Server → Drivers | New ride request notification |
| `ride:assigned` | Server → All | Ride accepted by driver |
| `ride:update` | Server → User | Status change notification |
| `ride:taken` | Server → Drivers | Remove taken ride from queue |
| `driver:availability` | Server → All | Driver online/offline status |

---

## 3. Database Schema

### User Collection
```
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: "passenger" | "driver",
  vehicleInfo: { type, number, color },
  verificationInfo: { licenseNumber, isVerified },
  isOnline: Boolean,
  currentLocation: { lat, lng, label },
  averageRating: Number,
  totalRatings: Number
}
```

### Ride Collection
```
{
  passenger: ObjectId → User,
  driver: ObjectId → User,
  pickup: { location, lat, lng },
  destination: { location, lat, lng },
  status: "requested" | "accepted" | "in_progress" | "completed" | "cancelled",
  fare: Number,
  rating: { score, feedback, ratedAt },
  timestamps: acceptedAt, startedAt, completedAt, cancelledAt
}
```

---

## 4. Entity Relationship Diagram

```
┌──────────────┐         requests          ┌──────────────┐
│   PASSENGER  │─────────────────────────►│     RIDE     │
│              │                          │              │
│  - name      │                          │  - pickup    │
│  - email     │                          │  - dest      │
│  - phone     │                          │  - status    │
└──────────────┘                          │  - fare      │
                                          │  - rating    │
┌──────────────┐         accepts          │              │
│    DRIVER    │─────────────────────────►│              │
│              │                          └──────────────┘
│  - vehicle   │
│  - license   │
│  - isOnline  │
│  - rating    │
└──────────────┘
```

**Relationships:**
- One Passenger → Many Rides (1:N)
- One Driver → Many Rides (1:N)
- One Ride → One Passenger (N:1)
- One Ride → Zero or One Driver (N:0..1)

---

## 5. API Overview

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register passenger/driver |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |

### Rides
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rides` | Request a ride |
| GET | `/api/rides/active` | Get active ride |
| GET | `/api/rides/pending` | Get pending requests (driver) |
| PATCH | `/api/rides/:id/accept` | Accept ride |
| PATCH | `/api/rides/:id/start` | Start ride |
| PATCH | `/api/rides/:id/complete` | Complete ride |
| PATCH | `/api/rides/:id/cancel` | Cancel ride |
| POST | `/api/rides/:id/rate` | Rate completed ride |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers/available` | List online drivers |
| PATCH | `/api/drivers/availability` | Toggle online/offline |
| GET | `/api/drivers/dashboard` | Driver analytics |

---

## 6. Design Decisions

### JWT over Session-Based Auth
JWT tokens enable stateless authentication, simplifying horizontal scaling and WebSocket authentication via handshake tokens.

### Atomic Ride Assignment
Ride acceptance uses MongoDB `findOneAndUpdate` with conditions (`status: 'requested', driver: null`) to prevent race conditions where multiple drivers accept the same ride.

### Socket.IO Room Strategy
- `user:{userId}` rooms for targeted notifications
- `drivers` room for broadcasting new ride requests
- Prevents unnecessary broadcast to all connected clients

### Campus Location Presets
Predefined IIT Roorkee locations simplify UX and enable consistent fare calculation based on geospatial distance.

### Ride State Machine
```
requested → accepted → in_progress → completed
    ↓           ↓
 cancelled   cancelled
```
Strict state transitions prevent invalid operations (e.g., completing a ride that hasn't started).

---

*CampusRide - Real-Time Campus Mobility Platform*
