import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, required: true },
    role: { type: String, enum: ['passenger', 'driver'], required: true },
    avatar: { type: String, default: '' },
    vehicleInfo: {
      type: { type: String, default: '' },
      number: { type: String, default: '' },
      color: { type: String, default: '' },
    },
    verificationInfo: {
      licenseNumber: { type: String, default: '' },
      isVerified: { type: Boolean, default: false },
    },
    isOnline: { type: Boolean, default: false },
    currentLocation: {
      lat: { type: Number, default: 29.8647 },
      lng: { type: Number, default: 77.8997 },
      label: { type: String, default: 'IIT Roorkee Campus' },
    },
    averageRating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
