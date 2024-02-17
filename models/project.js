import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    projectID: {
      type: String,
      required: true,
    },

    projectName: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      default: "PROD"
    },

    companyID: {
      type: String,
      required: true,
    },

    owner: {
      type: String,
      required: true,
    },

    editors: [
      {
        type: String,
      }
    ],

    viewers: [
      {
        type: String,
      }
    ],

    configs: [
      {
        filterID: {
          type: String,
          required: true,
        },
        appConfigID: {
          type: String,
          required: true,
        },
        playerConfigID: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model.project ||
mongoose.model("project", projectSchema);
