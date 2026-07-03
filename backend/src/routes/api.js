import express from 'express';
import { CAMPUS_LOCATIONS } from '../utils/locations.js';
import Ride from '../models/Ride.js';

const router = express.Router();

router.get('/locations', (req, res) => {
  res.json({ locations: CAMPUS_LOCATIONS });
});

router.get('/analytics', async (req, res) => {
  try {
    const [peakHours, popularPickups, statusBreakdown] = await Promise.all([
      Ride.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Ride.aggregate([
        { $group: { _id: '$pickup.location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      Ride.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    res.json({ peakHours, popularPickups, statusBreakdown });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
