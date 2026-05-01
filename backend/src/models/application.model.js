import mongoose from "mongoose";
import {
  APPLICATION_STAGES,
  APPLICATION_STATUSES
} from "../utils/constants.js";

const stageHistorySchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: APPLICATION_STAGES,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    stage: {
      type: String,
      enum: APPLICATION_STAGES,
      default: "applied",
      required: true
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "active",
      required: true
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    source: {
      type: String,
      trim: true,
      default: "direct"
    },
    notes: {
      type: String,
      trim: true,
      default: ""
    },
    stageHistory: {
      type: [stageHistorySchema],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

applicationSchema.index({ job: 1, stage: 1, status: 1 });
applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });
applicationSchema.index({ owner: 1, updatedAt: -1 });

const Application =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);

export default Application;
