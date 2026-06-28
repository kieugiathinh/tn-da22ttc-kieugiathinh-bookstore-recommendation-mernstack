import asyncHandler from "express-async-handler";
import * as bannerService from "../services/bannerService.js";

//Create Banner
const createBanner = asyncHandler(async (req, res) => {
  const savedBanner = await bannerService.createBanner(req.body);
  res.status(200).json(savedBanner);
});

// Update Banner
const updateBanner = asyncHandler(async (req, res) => {
  const updatedBanner = await bannerService.updateBanner(
    req.params.id,
    req.body,
  );
  res.status(200).json(updatedBanner);
});

// Delete Banner
const deleteBanner = asyncHandler(async (req, res) => {
  await bannerService.deleteBanner(req.params.id);
  res.status(201).json("Banner was deleted successfully");
});

//Get All Banners
const getAllBanners = asyncHandler(async (req, res) => {
  const banners = await bannerService.getAllBanners();
  res.status(201).json(banners);
});

//Get Random Banner
const getRandomBanner = asyncHandler(async (req, res) => {
  const randomBanner = await bannerService.getRandomBanner();
  res.status(200).json(randomBanner);
});

export {
  getAllBanners,
  createBanner,
  deleteBanner,
  getRandomBanner,
  updateBanner,
};
