import mongoose from "mongoose";

const filterSchema = new mongoose.Schema(
  {
    filterID: {
      type: String,
      required: true,
      unique: true,
    },

    country: {
      type: String,
      default: "default",
      enum: ["default", "IN", "US", "UK", "NZ"],
    },

    subscription: {
      type: String,
      default: "default",
      enum: ["default", "FREE", "PAID"]
    },

    OS: {
      type: String,
      default: "default",
      enum: ["default", "SONY", "LG"],
    },
    
    OSver: {
      type: String,
      default: "default",
      enum: ["default", "1", "2"]
    },
  },
  { timestamps: true }
);

export default mongoose.model.filter || mongoose.model("filter", filterSchema);
