import express from 'express';
import { protect, restrictTo } from '../middleware/auth.js';
import User from '../models/User.js';
import Ride from '../models/Ride.js';

const router = express.Router();

router.get('/available', protect, async (req, res) => {
  try {
    const drivers = await User.find({
      role: 'driver',
      isOnline: true,
      'verificationInfo.isVerified': true,
    }).select('name vehicleInfo currentLocation averageRating totalRatings');

    res.json({ drivers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/availability', protect, restrictTo('driver'), async (req, res) => {
  try {
    const { isOnline, location } = req.body;

    const updates = {};
    if (typeof isOnline === 'boolean') updates.isOnline = isOnline;
    if (location) updates.currentLocation = location;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });

    const io = req.app.get('io');
    io.emit('driver:availability', {
      driverId: user._id,
      isOnline: user.isOnline,
      location: user.currentLocation,
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/dashboard', protect, restrictTo('driver'), async (req, res) => {
  try {
    const driverId = req.user._id;

    const [completedRides, activeRides, rideHistory, ratingStats] = await Promise.all([
      Ride.countDocuments({ driver: driverId, status: 'completed' }),
      Ride.countDocuments({ driver: driverId, status: { $in: ['accepted', 'in_progress'] } }),
      Ride.find({ driver: driverId })
        .populate('passenger', 'name phone')
        .sort({ createdAt: -1 })
        .limit(20),
      Ride.aggregate([
        { $match: { driver: driverId, 'rating.score': { $ne: null } } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating.score' },
            totalRatings: { $sum: 1 },
          },
        },
      ]),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRides = await Ride.countDocuments({
      driver: driverId,
      status: 'completed',
      completedAt: { $gte: today },
    });

    const weeklyStats = await Ride.aggregate([
      {
        $match: {
          driver: driverId,
          status: 'completed',
          completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$completedAt' },
          count: { $sum: 1 },
          earnings: { $sum: '$fare' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalEarnings = await Ride.aggregate([
      { $match: { driver: driverId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$fare' } } },
    ]);

    res.json({
      stats: {
        totalRidesCompleted: completedRides,
        activeRides,
        todayRides,
        averageRating: ratingStats[0]?.avgRating || req.user.averageRating,
        totalRatings: ratingStats[0]?.totalRatings || req.user.totalRatings,
        totalEarnings: totalEarnings[0]?.total || 0,
      },
      weeklyStats,
      rideHistory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
