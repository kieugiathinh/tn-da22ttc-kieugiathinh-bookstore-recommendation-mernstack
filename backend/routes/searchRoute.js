import express from "express";
import { recordSearch, getSearchHistory, deleteSearchHistory, clearSearchHistory, getTrendingSearches, getSearchSuggestions } from "../controllers/searchController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/record", optionalProtect, recordSearch);
router.get("/trending", getTrendingSearches);
router.get("/suggest", getSearchSuggestions);

// Private routes (Must login)
router.get("/history", protect, getSearchHistory);
router.delete("/history/:keyword", protect, deleteSearchHistory);
router.delete("/history", protect, clearSearchHistory);

export default router;
