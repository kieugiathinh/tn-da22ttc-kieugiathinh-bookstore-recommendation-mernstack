import express from "express";
import {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getNewProducts,
  getRelatedProducts,
  autoFillBook,
  getTrendingProducts,
} from "../controllers/productController.js";

import { protect, admin, optionalProtect } from "../middleware/authMiddleware.js";
import trackInteraction from "../middleware/trackInteraction.js";

const router = express.Router();

router.get("/new", getNewProducts);
router.get("/related", getRelatedProducts);
router.get("/trends", getTrendingProducts);
router.get("/autofill", protect, admin, autoFillBook);

router.post("/", protect, admin, createProduct);
router.put("/:id", protect, admin, updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

// optionalProtect: xác thực user nếu có token, không chặn nếu là guest
// trackInteraction: âm thầm ghi "view" event — fire and forget
router.get("/find/:id", optionalProtect, trackInteraction, getProduct);

router.get("/", getAllProducts);

export default router;
