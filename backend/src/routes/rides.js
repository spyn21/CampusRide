import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import Ride from '../models/Ride.js';
import User from '../models/User.js';
import { calculateFare, findLocation } from '../utils/locations.js';

const router = express.Router();

const populateRide = (query) =>
  query.populate('passenger', 'name phone').populate('driver', 'name phone vehicleInfo averageRating');

router.post('/', protect, restrictTo('passenger'), async (req, res) => {
  try {
    const { pickup, destination, scheduledAt } = req.body;

    if (!pickup?.location || !destination?.location) {
      return res.status(400).json({ message: 'Pickup and destination are required' });
    }

    const activeRide = await Ride.findOne({
      passenger: req.user._id,
      status: { $in: ['requested', 'accepted', 'in_progress'] },
    });

    if (activeRide) {
      return res.status(400).json({ message: 'You already have an active ride' });
    }

    const pickupLoc = findLocation(pickup.location) || pickup;
    const destLoc = findLocation(destination.location) || destination;
    const fare = calculateFare(pickupLoc, destLoc);

    const ride = await Ride.create({
      passenger: req.user._id,
      pickup: { location: pickup.location, lat: pickupLoc.lat, lng: pickupLoc.lng },
      destination: { location: destination.location, lat: destLoc.lat, lng: destLoc.lng },
      fare,
      scheduledAt: scheduledAt || null,
      status: scheduledAt ? 'requested' : 'requested',
    });

    const populated = await populateRide(Ride.findById(ride._id));

    const io = req.app.get('io');
    io.to('drivers').emit('ride:new', populated);
    io.emit('ride:update', populated);

    res.status(201).json({ ride: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const filter =
      req.user.role === 'driver'
        ? { driver: req.user._id }
        : { passenger: req.user._id };

    const rides = await populateRide(Ride.find(filter).sort({ createdAt: -1 }).limit(50));
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/active', protect, async (req, res) => {
  try {
    const filter =
      req.user.role === 'driver'
        ? { driver: req.user._id, status: { $in: ['accepted', 'in_progress'] } }
        : { passenger: req.user._id, status: { $in: ['requested', 'accepted', 'in_progress'] } };

    const ride = await populateRide(Ride.findOne(filter));
    res.json({ ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/pending', protect, restrictTo('driver'), async (req, res) => {
  try {
    if (!req.user.isOnline) {
      return res.json({ rides: [] });
    }

    const rides = await populateRide(
      Ride.find({ status: 'requested', driver: null }).sort({ createdAt: -1 })
    );
    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/accept', protect, restrictTo('driver'), async (req, res) => {
  try {
    if (!req.user.isOnline) {
      return res.status(400).json({ message: 'Go online to accept rides' });
    }

    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, status: 'requested', driver: null },
      { driver: req.user._id, status: 'accepted', acceptedAt: new Date() },
      { new: true }
    );

    if (!ride) {
      return res.status(400).json({ message: 'Ride no longer available' });
    }

    const populated = await populateRide(Ride.findById(ride._id));
    const io = req.app.get('io');

    io.emit('ride:assigned', populated);
    io.to(`user:${ride.passenger}`).emit('ride:update', populated);
    io.to('drivers').emit('ride:taken', { rideId: ride._id });

    res.json({ ride: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/reject', protect, restrictTo('driver'), async (req, res) => {
  res.json({ message: 'Ride rejected' });
});

router.patch('/:id/start', protect, restrictTo('driver'), async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, driver: req.user._id, status: 'accepted' },
      { status: 'in_progress', startedAt: new Date() },
      { new: true }
    );

    if (!ride) {
      return res.status(400).json({ message: 'Cannot start this ride' });
    }

    const populated = await populateRide(Ride.findById(ride._id));
    const io = req.app.get('io');
    io.to(`user:${ride.passenger}`).emit('ride:update', populated);
    io.emit('ride:update', populated);

    res.json({ ride: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/complete', protect, restrictTo('driver'), async (req, res) => {
  try {
    const ride = await Ride.findOneAndUpdate(
      { _id: req.params.id, driver: req.user._id, status: 'in_progress' },
      { status: 'completed', completedAt: new Date() },
      { new: true }
    );

    if (!ride) {
      return res.status(400).json({ message: 'Cannot complete this ride' });
    }

    const populated = await populateRide(Ride.findById(ride._id));
    const io = req.app.get('io');
    io.to(`user:${ride.passenger}`).emit('ride:update', populated);
    io.emit('ride:update', populated);

    res.json({ ride: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    const isPassenger = ride.passenger.toString() === req.user._id.toString();
    const isDriver = ride.driver?.toString() === req.user._id.toString();

    if (!isPassenger && !isDriver) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!['requested', 'accepted'].includes(ride.status)) {
      return res.status(400).json({ message: 'Cannot cancel ride in current state' });
    }

    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    ride.cancelledBy = isPassenger ? 'passenger' : 'driver';
    await ride.save();

    const populated = await populateRide(Ride.findById(ride._id));
    const io = req.app.get('io');
    io.emit('ride:update', populated);

    res.json({ ride: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/rate', protect, restrictTo('passenger'), async (req, res) => {
  try {
    const { score, feedback } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const ride = await Ride.findOne({
      _id: req.params.id,
      passenger: req.user._id,
      status: 'completed',
      'rating.score': null,
    });

    if (!ride) {
      return res.status(400).json({ message: 'Cannot rate this ride' });
    }

    ride.rating = { score, feedback: feedback || '', ratedAt: new Date() };
    await ride.save();

    const driverRides = await Ride.find({
      driver: ride.driver,
      'rating.score': { $ne: null },
    });

    const avgRating =
      driverRides.reduce((sum, r) => sum + r.rating.score, 0) / driverRides.length;

    await User.findByIdAndUpdate(ride.driver, {
      averageRating: Math.round(avgRating * 10) / 10,
      totalRatings: driverRides.length,
    });

    const populated = await populateRide(Ride.findById(ride._id));
    res.json({ ride: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const ride = await populateRide(Ride.findById(req.params.id));
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json({ ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
