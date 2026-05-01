import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ""
    },
    location: {
      type: String,
      trim: true,
      default: ""
    },
    currentTitle: {
      type: String,
      trim: true,
      default: ""
    },
    yearsExperience: {
      type: Number,
      min: 0,
      default: 0
    },
    source: {
      type: String,
      trim: true,
      default: "manual"
    },
    summary: {
      type: String,
      trim: true,
      default: ""
    },
    skills: {
      type: [String],
      default: []
    },
    tags: {
      type: [String],
      default: []
    },
    resumeUrl: {
      type: String,
      trim: true,
      default: ""
    },
    parsedResumeText: {
      type: String,
      trim: true,
      default: ""
    },
    semanticEmbedding: {
      type: [Number],
      default: []
    },
    embeddingUpdatedAt: {
      type: Date,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // Optional link to a User account (set when a candidate self-registers)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

candidateSchema.index({ email: 1 }, { unique: true });
candidateSchema.index({ userId: 1 }, { sparse: true });
candidateSchema.index({ createdAt: -1 });
candidateSchema.index({ embeddingUpdatedAt: -1 });
candidateSchema.index({
  firstName: "text",
  lastName: "text",
  currentTitle: "text",
  summary: "text",
  skills: "text"
});

const Candidate =
  mongoose.models.Candidate || mongoose.model("Candidate", candidateSchema);

export default Candidate;
