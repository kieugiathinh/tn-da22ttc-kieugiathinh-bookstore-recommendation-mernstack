import express from "express";
import {
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  createUser,
  updatePassword,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, admin, getAllUsers);
router.delete("/:id", protect, admin, deleteUser);
router.put("/update-password", protect, updatePassword);
router.put("/:id", protect, updateUser);
router.get("/find/:id", getUser);
router.post("/", protect, admin, createUser);

export default router;
