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

    filterDetails: {
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

      demo_url: {
        type: String,
        default:
          "https://res.cloudinary.com/dqjkucbjn/image/upload/v1715428241/facottry_player_demo.jpg",
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
  
      demo_url: {
        type: String,
        default: "https://res.cloudinary.com/dqjkucbjn/image/upload/v1715428241/facottry_player_demo.jpg",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model.master || mongoose.model("master", masterSchema);
