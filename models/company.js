import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyID: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      default: "NA",
    },

    owner: [
      {
        type: String,
        required: true,
      },
    ],

    projects: [String],
    employees: [String],
  },
  { timestamps: true }
);

export default mongoose.model.company ||
mongoose.model("company", companySchema);
