import mongoose from "mongoose";

const playerConfigSchema = new mongoose.Schema(
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

    desc: {
      type: String
    },

    type: {
      type: String,
      default: "player",
    },

    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
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

export default mongoose.model.playerconfigs ||
mongoose.model("playerconfig", playerConfigSchema);
