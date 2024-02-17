import mongoose from "mongoose";

const filterSchema = new mongoose.Schema(
  {
    filterID: {
      type: String,
      required: true,
      unique: true,
    },

    params: {
      country: {
        type: String,
      },
      subscription: {
        type: String,
      },
      OS: {
        type: String,
      },
      OSver: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model.filter || mongoose.model("filter", filterSchema);
