import express from "express";
import {
  loginUser,
  LogOut,
  registerUser,
  loginWithGoogle,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";
const router = express.Router();

// Register User Router
router.post("/register", registerUser);

// Login User Router
router.post("/login", loginUser);

// Login with Google
router.post("/google", loginWithGoogle);

// Forgot Password
router.post("/forgot-password", forgotPassword);

// Reset Password
router.post("/reset-password/:token", resetPassword);

// Logout User
//router.post("/logout", LogOut);
router.get("/logout", LogOut);

export default router;

