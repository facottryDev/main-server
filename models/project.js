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

    companyID: {
      type: String,
      required: true,
    },

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
