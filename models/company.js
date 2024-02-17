import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyID: {
      type: String,
      unique: true,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "NA",
      trim: true,
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
