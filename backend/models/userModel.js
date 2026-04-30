import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: 6,
    },

    password: {
      type: String,
      required: true,
      minLength: 6,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    role: {
      type: Number,
      default: 0,
    },

    status: {
      type: Number,
      default: 1,
    },

    avatar: {
      type: String,
      default: "",
    },

    wallet: [
      {
        coupon: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Coupon",
        },
        isUsed: {
          type: Boolean,
          default: false,
        },
        savedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
