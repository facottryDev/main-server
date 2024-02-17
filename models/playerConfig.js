import mongoose from "mongoose";

const playerConfigSchema = new mongoose.Schema(
  {
    configID: {
      type: String,
      required: true,
      unique: true,
    },

    params: {
      autoplay: {
        type: Boolean,
        default: true,
      },
      controls: {
        type: Boolean,
        default: true,
      },
      customObject: {
        type: Object,
      }
    },
  },
  { timestamps: true }
);

export default mongoose.model.playerconfig ||
mongoose.model("playerconfig", playerConfigSchema);
