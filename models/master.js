import mongoose from "mongoose";

const masterSchema = new mongoose.Schema(
  {
    projectID: {
      type: String,
      required: true,
    },

    companyID: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },

    filter: {
      type: Object,
      required: true,
    },

    appConfig: {
      configID: {
        type: String,
      },

      name: {
        type: String,
        required: true,
      },

      desc: {
        type: String,
      },

      params: {
        type: Object,
      },
    },
    
    playerConfig: {
      configID: {
        type: String,
      },
  
      name: {
        type: String,
        required: true,
      },
  
      desc: {
        type: String
      },
  
      params: {
        type: Object,
      },
    },

    customConfig: {
      type: Object,
    }
  },
  { timestamps: true }
);

export default mongoose.model.mappings || mongoose.model("mapping", masterSchema);
