import mongoose from "mongoose";

const masterSchema = new mongoose.Schema(
  {
    projectID: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      default: "IN",
    },

    subscription: {
      type: String,
      default: "free",
    },

    OS: {
      type: String,
      default: "LG",
    },

    OSver: {
      type: String,
      default: "1.0",
    },

    appConfigID: {
      type: String,
      required: true,
    },

    appConfigData: {
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
      },
    },

    playerConfigID: {
      type: String,
      required: true,
    },

    playerConfigData: {
      autoplay: {
        type: Boolean,
        default: false,
      },
      controls: {
        type: Boolean,
        default: true,
      },
      customObject: {
        type: Object,
        required: false,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model.appconfig ||
mongoose.model("appconfig", appConfigSchema);
