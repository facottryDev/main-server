import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
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
      type: String,
      required: [true, "Provide password"],
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

export default mongoose.model.users || mongoose.model("user", userSchema);