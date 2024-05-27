import mongoose from "mongoose";

const appConfigSchema = new mongoose.Schema(
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

    demo_url: {
      type: String,
      default:
        "https://res.cloudinary.com/dqjkucbjn/image/upload/v1715428241/facottry_player_demo.jpg",
    },
  },
  { timestamps: true }
);

export default mongoose.model.appconfig ||
  mongoose.model("appconfig", appConfigSchema);
