import mongoose from "mongoose";

const masterSchema = new mongoose.Schema(
  {
    projectID: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      required: true,
      default: "ALL",
    },

    subscription: {
      type: String,
      required: true,
      default: "ALL",
    },

    OS: {
      type: String,
      required: true,
      default: "ALL",
    },

    OSver: {
      type: String,
      required: true,
      default: "ALL",
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
        default: true,
      },
      controls: {
        type: Boolean,
        default: true,
      },
      customObject: {
        type: Object,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model.appconfig ||
mongoose.model("appconfig", appConfigSchema);
