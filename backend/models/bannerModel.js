import mongoose from "mongoose";
const BannerSchema = mongoose.Schema(
  {
    title: {
      type: String,
      require: true,
    },

    subtitle: {
      type: String,
      require: true,
    },

    img: {
      type: String,
      require: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    type: {
      type: String,
      enum: ["main", "sub"],
      default: "main",
    },
  },
  {
    timestamps: true,
  }
);

const Banner = mongoose.model("Banner", BannerSchema);
export default Banner;
