import mongoose from "mongoose";

const appConfigArchivesSchema = new mongoose.Schema(
  {
    configID: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      default: "app",
    },

    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },

    desc: {
      type: String
    },

    projectID: {
      type: String,
      required: true,
    },

    companyID: {
      type: String,
      required: true,
    },

    params: {
      type: Object,
    },
  },
  { timestamps: true }
);

export default mongoose.model.archiveappconfigs ||
  mongoose.model("archiveappconfig", appConfigArchivesSchema);
