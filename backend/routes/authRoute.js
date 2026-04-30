import express from "express";
import {
  loginUser,
  LogOut,
  registerUser,
} from "../controllers/authController.js";
const router = express.Router();

// Register User Router
router.post("/register", registerUser);

// Login User Router
router.post("/login", loginUser);

// Logout User
//router.post("/logout", LogOut);
router.get("/logout", LogOut);

export default router;
