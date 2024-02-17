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
      minlength: [6, "Password must be at least 8 characters long"],
    },

    name: {
      type: String,
      trim: true,
    },

    companyID: {
      type: String,
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
    },

    projects: [
      {
        projectID: {
          type: String,
          required: true,
        },
        
        role: {
          type: String,
          required: true,
          enum: ['owner', 'editor', 'viewer']
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model.users || mongoose.model("user", userSchema);