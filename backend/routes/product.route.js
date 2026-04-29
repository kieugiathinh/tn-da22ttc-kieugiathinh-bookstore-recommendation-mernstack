import express from "express";
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getRelatedProducts,
} from "../controllers/product.controller.js";

import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/new", getNewProducts);
router.get("/related", getRelatedProducts);

router.post("/", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);
router.get("/find/:id", getProduct);
router.get("/", getAllProducts);

export default router;
