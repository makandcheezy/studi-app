// user schema — profile info, points, streaks, and auth fields
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 30,
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: 200,
    },
    role: {
      type: String,
      required: true,
      enum: ['student', 'admin'],
      default: 'student',
    },
    totalPoints: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currentStreak: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastStudyDate: {
      type: Date,
      default: null,
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ totalPoints: -1 });
userSchema.index({ currentStreak: -1 });

module.exports = mongoose.model('User', userSchema);
