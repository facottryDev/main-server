import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Provide Email"],
      unique: [true, "Email already exists"],
    },

    password: {
      type: String,
      required: [true, "Provide password"],
    },

    name: {
      type: String,
    },

    companyID: {
      type: String,
    },

    mobile: {
      type: Number,
    },

    profilePic: {
      type: String,
    },

    address: {
      type: String,
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