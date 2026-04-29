import express from "express";
import {
  getAllBanners,
  createBanner,
  deleteBanner,
  getRandomBanner,
  updateBanner,
} from "../controllers/banner.controller.js";
const router = express.Router();

//Create Banner
router.post("/", createBanner);
//Update Banner
router.put("/:id", updateBanner);
// Get All Banners
router.get("/", getAllBanners);
// Delete Banner
router.delete("/:id", deleteBanner);
// Get Random Banner
router.get("/random", getRandomBanner);

export default router;
