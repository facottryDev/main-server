import mongoose from "mongoose";

const userArchiveSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
    },
    
    email: {
      type: String,
      required: [true, "Provide Email"],
      unique: [true, "Email already exists"],
      validate: {
        validator: function (value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value);
        },
        message: "Invalid email format",
      },
    },

    password: {
      type: String
    },

    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },

    name: {
      type: String,
      trim: true,
    },

    mobile: {
      type: Number,
      validate: {
        validator: function (value) {
          const mobileRegex = /^\d{10}$/;
          return mobileRegex.test(value);
        },
        message: "Invalid mobile number",
      },
      trim: true,
    },

    profilePic: {
      type: String,
    },

    address: {
      type: String,
      trim: true,
    }
  },
  { timestamps: true }
);

export default mongoose.model.userarchives || mongoose.model("userarchive", userArchiveSchema);