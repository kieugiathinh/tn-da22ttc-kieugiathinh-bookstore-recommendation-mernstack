import express from "express";
import {
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  createUser,
  updatePassword,
  addAddress,
  setDefaultAddress,
  deleteAddress,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, admin, getAllUsers);
router.put("/update-password", protect, updatePassword);

// --- ADDRESS BOOK ---
router.post("/addresses", protect, addAddress);
router.put("/addresses/:addressId/default", protect, setDefaultAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);

// --- CRUD (đặt SAU address routes để tránh conflict /:id) ---
router.delete("/:id", protect, admin, deleteUser);
router.put("/:id", protect, updateUser);
router.get("/find/:id", getUser);
router.post("/", protect, admin, createUser);

export default router;
