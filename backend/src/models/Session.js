// study session schema — tracks time, subject, pause state, points earned
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    durationMinutes: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    pausedDuration: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    pointsEarned: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    location: {
      type: String,
      default: '',
      trim: true,
      maxlength: 100,
    },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, startTime: -1 });
sessionSchema.index({ userId: 1, status: 1 });
sessionSchema.index({ endTime: 1 });

module.exports = mongoose.model('Session', sessionSchema);
