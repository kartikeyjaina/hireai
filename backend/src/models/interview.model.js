import mongoose from "mongoose";
import {
  INTERVIEW_STATUSES,
  INTERVIEW_TYPES
} from "../utils/constants.js";

const interviewSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: INTERVIEW_TYPES,
      required: true
    },
    status: {
      type: String,
      enum: INTERVIEW_STATUSES,
      default: "scheduled",
      required: true
    },
    scheduledAt: {
      type: Date,
      required: true
    },
    durationMinutes: {
      type: Number,
      min: 15,
      default: 60
    },
    timezone: {
      type: String,
      required: true,
      trim: true
    },
    meetingUrl: {
      type: String,
      trim: true,
      default: ""
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    interviewers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        }
      ],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

interviewSchema.index({ scheduledAt: 1, status: 1 });
interviewSchema.index({ application: 1, scheduledAt: -1 });
interviewSchema.index({ interviewers: 1, scheduledAt: 1 });

const Interview =
  mongoose.models.Interview || mongoose.model("Interview", interviewSchema);

export default Interview;
