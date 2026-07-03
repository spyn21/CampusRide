import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Ride from './models/Ride.js';
import { connectDB } from './config/db.js';

const seed = async () => {
  await connectDB();

  await Ride.deleteMany({});
  await User.deleteMany({});

  const hashedPassword = await bcrypt.hash('password123', 12);

  const passengers = await User.insertMany([
    { name: 'Rahul Sharma', email: 'rahul@iitr.ac.in', password: hashedPassword, phone: '9876543210', role: 'passenger' },
    { name: 'Priya Patel', email: 'priya@iitr.ac.in', password: hashedPassword, phone: '9876543211', role: 'passenger' },
  ]);

  const drivers = await User.insertMany([
    {
      name: 'Amit Kumar',
      email: 'amit@driver.com',
      password: hashedPassword,
      phone: '9876543220',
      role: 'driver',
      isOnline: true,
      vehicleInfo: { type: 'E-Rickshaw', number: 'UK-07-AB-1234', color: 'Green' },
      verificationInfo: { licenseNumber: 'DL-1234567890', isVerified: true },
      averageRating: 4.5,
      totalRatings: 12,
    },
    {
      name: 'Suresh Singh',
      email: 'suresh@driver.com',
      password: hashedPassword,
      phone: '9876543221',
      role: 'driver',
      isOnline: true,
      vehicleInfo: { type: 'E-Rickshaw', number: 'UK-07-CD-5678', color: 'Yellow' },
      verificationInfo: { licenseNumber: 'DL-0987654321', isVerified: true },
      averageRating: 4.2,
      totalRatings: 8,
    },
    {
      name: 'Rajesh Yadav',
      email: 'rajesh@driver.com',
      password: hashedPassword,
      phone: '9876543222',
      role: 'driver',
      isOnline: false,
      vehicleInfo: { type: 'E-Rickshaw', number: 'UK-07-EF-9012', color: 'Blue' },
      verificationInfo: { licenseNumber: 'DL-1122334455', isVerified: true },
      averageRating: 4.8,
      totalRatings: 20,
    },
  ]);

  const completedRides = [];
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 7);
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    completedRides.push({
      passenger: passengers[i % 2]._id,
      driver: drivers[i % 3]._id,
      pickup: { location: 'Main Gate', lat: 29.8647, lng: 77.8997 },
      destination: { location: 'Central Library', lat: 29.8665, lng: 77.9012 },
      status: 'completed',
      fare: 30 + Math.floor(Math.random() * 40),
      rating: { score: 4 + Math.floor(Math.random() * 2), feedback: 'Great ride!', ratedAt: date },
      acceptedAt: date,
      startedAt: date,
      completedAt: date,
      createdAt: date,
    });
  }

  await Ride.insertMany(completedRides);

  console.log('Database seeded successfully!');
  console.log('\nDemo Accounts:');
  console.log('Passenger: rahul@iitr.ac.in / password123');
  console.log('Passenger: priya@iitr.ac.in / password123');
  console.log('Driver: amit@driver.com / password123');
  console.log('Driver: suresh@driver.com / password123');

  await mongoose.disconnect();
};

seed().catch(console.error);
