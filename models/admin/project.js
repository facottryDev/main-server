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

    filters: {
      type: Object,
      default: {},
    },

    configTypes: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },
          desc: {
            type: String,
            trim: true,
          },
          status: {
            type: String,
            default: "active",
            enum: ["active", "inactive"],
          },
          createdAt: {
            type: Date,
            default: Date.now(),
          },
          updatedAt: {
            type: Date,
            default: Date.now(),
          },
        },
      ],
      default: [
        {
          name: "app",
          desc: "Main Application Configuration",
          status: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          name: "player",
          desc: "Main Player Configuration",
          status: "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
    },

    joinRequests: [
      {
        type: String,
        expiresAt: {
          type: Date,
          default: Date.now() + 30 * 24 * 60 * 60 * 1000, // 1 month expiration
        },
      },
    ],

    activeInvites: [
      {
        type: String,
        expiresAt: {
          type: Date,
          default: Date.now() + 30 * 24 * 60 * 60 * 1000, // 1 month expiration
        },
      },
    ],

    owners: [
      {
        type: String,
        required: true,
      },
    ],

    editors: [
      {
        type: String,
        trim: true,
      },
    ],

    viewers: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model.projects ||
  mongoose.model("project", projectSchema);
