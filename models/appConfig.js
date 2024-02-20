import mongoose from "mongoose";

const appConfigSchema = new mongoose.Schema(
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

    theme: {
      type: String,
      default: "default",
      enum: ["red", "blue", "green", "dark", "light", "default"],
      trim: true,
    },

    language: {
      type: String,
      default: "default",
      enum: ["en", "hindi", "tamil", "default"],
      trim: true,
    },
    
    customObject: {
      type: Object,
    }
  },
  { timestamps: true }
);

export default mongoose.model.appconfig ||
mongoose.model("appconfig", appConfigSchema);
