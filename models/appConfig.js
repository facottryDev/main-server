import mongoose from "mongoose";

const appConfigSchema = new mongoose.Schema(
  {
    configID: {
      type: String,
      required: true,
    },

    params: {
      theme: {
        type: String,
        required: true,
      },
      language: {
        type: String,
        required: true,
      },
      customObject: {
        type: Object,
        required: false,
      }
    },
  },
  { timestamps: true }
);

export default mongoose.model.appconfig ||
mongoose.model("appconfig", appConfigSchema);
