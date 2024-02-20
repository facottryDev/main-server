import mongoose from "mongoose";

const masterSchema = new mongoose.Schema(
  {
    projectID: {
      type: String,
      required: true,
    },

    filter: {
      filterID: {
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
    },

    appConfig: {
      configID: {
        type: String,
        required: true,
      },
  
      theme: {
        type: String,
        required: true,
        enum: ["red", "blue", "green", "dark", "light", "default"],
        trim: true,
      },
  
      language: {
        type: String,
        required: true,
        enum: ["en", "hindi", "tamil", "default"],
        trim: true,
      },
      
      customObject: {
        type: Object,
      }
    },

    playerConfig: {
      configID: {
        type: String,
        required: true,
      },
  
      autoplay: {
        type: String,
        required: true,
        enum: ["default", "true", "false"],
      },
  
      controls: {
        type: String,
        required: true,
        enum: ["default", "true", "false"],
      },
      
      customObject: {
        type: Object,
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model.master ||
mongoose.model("master", masterSchema);
