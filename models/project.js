import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    projectID: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      default: "PROD",
      enum: ["PROD", "UAT", "DEV", "TEST"],
    },

    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },

    companyID: {
      type: String,
      required: true,
    },

    joinRequests: [
      {
        type: String,
        expiresAt: {
          type: Date,
          default: Date.now() + 30 * 24 * 60 * 60 * 1000, // 1 month expiration
        },
      }
    ],

    activeInvites: [
      {
        type: String,
        expiresAt: {
          type: Date,
          default: Date.now() + 30 * 24 * 60 * 60 * 1000, // 1 month expiration
        },
      }
    ],

    owners: [
      {
        type: String,
        required: true,
      }
    ],

    editors: [
      {
        type: String,
        trim: true,
      }
    ],

    viewers: [
      {
        type: String,
        trim: true,
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model.project ||
mongoose.model("project", projectSchema);
