import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyID: {
      type: String,
      unique: true,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },

    address: {
      type: String,
      trim: true,
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
      },
    ],

    employees: [String],
  },
  { timestamps: true }
);

export default mongoose.model.companies ||
mongoose.model("company", companySchema);
