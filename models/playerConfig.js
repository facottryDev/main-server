import mongoose from "mongoose";

const playerConfigSchema = new mongoose.Schema(
  {
    configID: {
      type: String,
      required: true,
      unique: true,
    },

    projectID: {
      type: String,
      required: true,
    },

    autoplay: {
      type: String,
      default: "default",
      enum: ["default", "true", "false"],
    },

    controls: {
      type: String,
      default: "default",
      enum: ["default", "true", "false"],
    },
    
    customObject: {
      type: Object,
    }
  },
  { timestamps: true }
);

export default mongoose.model.playerconfig ||
mongoose.model("playerconfig", playerConfigSchema);
