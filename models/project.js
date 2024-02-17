import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    projectID: {
      type: String,
      required: true,
      unique: true,
    },

    projectName: {
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

    owner: {
      type: String,
      required: true,
      trim: true,
    },

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
