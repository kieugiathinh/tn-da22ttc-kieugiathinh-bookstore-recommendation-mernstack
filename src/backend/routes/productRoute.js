import express from "express";
import {
  getAllProducts,
  getProduct,
  trackProductView,
  createProduct,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getRelatedProducts,
  autoFillBook,
  getTrendingProducts,
  syncCart,
} from "../controllers/productController.js";

import { protect, admin, optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/new", getNewProducts);
router.get("/related", getRelatedProducts);
router.get("/trends", getTrendingProducts);
router.get("/autofill", protect, admin, autoFillBook);

router.post("/", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

router.get("/find/:id", optionalProtect, getProduct);
router.post("/view/:id", trackProductView);
router.post("/cart-sync", syncCart);

router.get("/", getAllProducts);

export default router;
