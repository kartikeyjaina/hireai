import mongoose from "mongoose";
import {
  EMPLOYMENT_TYPES,
  EXPERIENCE_LEVELS,
  JOB_STATUSES,
  APPLICATION_STAGES
} from "../utils/constants.js";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    employmentType: {
      type: String,
      enum: EMPLOYMENT_TYPES,
      required: true
    },
    experienceLevel: {
      type: String,
      enum: EXPERIENCE_LEVELS,
      required: true
    },
    status: {
      type: String,
      enum: JOB_STATUSES,
      default: "draft",
      required: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    requirements: {
      type: [String],
      default: []
    },
    responsibilities: {
      type: [String],
      default: []
    },
    skills: {
      type: [String],
      default: []
    },
    pipelineStages: {
      type: [String],
      default: APPLICATION_STAGES
    },
    salaryMin: {
      type: Number,
      min: 0
    },
    salaryMax: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      trim: true,
      default: "USD"
    },
    closesAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    hiringManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    semanticEmbedding: {
      type: [Number],
      default: []
    },
    embeddingUpdatedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ department: 1, status: 1 });
jobSchema.index({ embeddingUpdatedAt: -1 });
jobSchema.index({ title: "text", description: "text", skills: "text" });

const Job = mongoose.models.Job || mongoose.model("Job", jobSchema);

export default Job;
