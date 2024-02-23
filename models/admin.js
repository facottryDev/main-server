import mongoose from "mongoose";

const adminUserSchema = new mongoose.Schema(
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

    companyID: {
      type: String,
      required: true,
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

export default mongoose.model.admins || mongoose.model("admin", adminUserSchema);