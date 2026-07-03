import express from 'express';
import { generateToken } from '../utils/token.js';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, vehicleInfo, verificationInfo } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (!['passenger', 'driver'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const userData = { name, email, password, phone, role };

    if (role === 'driver') {
      userData.vehicleInfo = vehicleInfo || {};
      userData.verificationInfo = {
        licenseNumber: verificationInfo?.licenseNumber || '',
        isVerified: true,
      };
    }

    const user = await User.create(userData);
    const token = generateToken(user._id);

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, avatar, vehicleInfo, verificationInfo } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (avatar !== undefined) updates.avatar = avatar;

    if (req.user.role === 'driver') {
      if (vehicleInfo) updates.vehicleInfo = { ...req.user.vehicleInfo, ...vehicleInfo };
      if (verificationInfo) {
        updates.verificationInfo = { ...req.user.verificationInfo, ...verificationInfo };
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
