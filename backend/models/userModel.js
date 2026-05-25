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
      minLength: 6,
    },
    
    googleId: {
      type: String,
      default: null,
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

    // Sổ địa chỉ (Address Book) - Lưu nhiều địa chỉ giao hàng
    addresses: [
      {
        name: { type: String, required: true },       // Tên người nhận
        phone: { type: String, required: true },      // SĐT người nhận
        provinceId: { type: Number, required: true },
        provinceName: { type: String, required: true },
        districtId: { type: Number, required: true },
        districtName: { type: String, required: true },
        wardCode: { type: String, required: true },
        wardName: { type: String, required: true },
        street: { type: String, required: true },     // Số nhà, tên đường
        isDefault: { type: Boolean, default: false },
      },
    ],

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

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpire: {
      type: Date,
      default: null,
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
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
