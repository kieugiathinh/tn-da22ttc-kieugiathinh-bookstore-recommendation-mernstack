import express from "express";
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getWishlistIds,
  getWishlistCount,
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tất cả route wishlist đều yêu cầu đăng nhập
router.use(protect);

router.get("/", getWishlist);               // GET    /api/v1/wishlist
router.get("/ids", getWishlistIds);         // GET    /api/v1/wishlist/ids
router.get("/count", getWishlistCount);     // GET    /api/v1/wishlist/count
router.post("/", addToWishlist);            // POST   /api/v1/wishlist
router.delete("/:productId", removeFromWishlist); // DELETE /api/v1/wishlist/:productId

export default router;
