import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema(
  {
    passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    pickup: {
      location: { type: String, required: true },
      lat: { type: Number, default: 29.8647 },
      lng: { type: Number, default: 77.8997 },
    },
    destination: {
      location: { type: String, required: true },
      lat: { type: Number, default: 29.8700 },
      lng: { type: Number, default: 77.9050 },
    },
    status: {
      type: String,
      enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'requested',
    },
    fare: { type: Number, default: 0 },
    rating: {
      score: { type: Number, min: 1, max: 5, default: null },
      feedback: { type: String, default: '' },
      ratedAt: { type: Date, default: null },
    },
    scheduledAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, enum: ['passenger', 'driver', 'system', null], default: null },
  },
  { timestamps: true }
);

rideSchema.index({ status: 1, createdAt: -1 });
rideSchema.index({ passenger: 1, createdAt: -1 });
rideSchema.index({ driver: 1, createdAt: -1 });

export default mongoose.model('Ride', rideSchema);
