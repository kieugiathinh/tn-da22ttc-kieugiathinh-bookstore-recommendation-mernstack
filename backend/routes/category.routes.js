import express from "express";
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  getCategoryById,
} from "../controllers/category.controller.js";

import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/").get(getAllCategories).post(protect, admin, createCategory);

router
  .route("/:id")
  .get(getCategoryById)
  .put(protect, admin, updateCategory)
  .delete(protect, admin, deleteCategory);

export default router;
