import mongoose from "mongoose";

const filterSchema = new mongoose.Schema(
  {
    filterID: {
      type: String,
      required: true,
    },

    params: {
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
    },
  },
  { timestamps: true }
);

export default mongoose.model.filter || mongoose.model("filter", filterSchema);
