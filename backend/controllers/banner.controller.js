import Banner from "../models/banner.model.js";
import asyncHandler from "express-async-handler";

//Create Banner
const createBanner = asyncHandler(async (req, res) => {
  const newBanner = Banner(req.body);
  const savedBanner = newBanner.save();

  if (!savedBanner) {
    res.status(400);
    throw new Error("Banner was not created");
  } else {
    res.status(200).json(savedBanner);
  }
});

// Update Banner
const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (banner) {
    if (req.body.isActive !== undefined) {
      banner.isActive = req.body.isActive;
    }

    const updatedBanner = await banner.save();
    res.status(200).json(updatedBanner);
  } else {
    res.status(404);
    throw new Error("Banner not found");
  }
});

// Delete Banner
const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);

  if (!banner) {
    res.status(400);
    throw new Error("Banner was not deleted");
  } else {
    res.status(201).json("Banner was deleted successfully");
  }
});

//Get All Banners
const getAllBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find();

  if (!banners) {
    res.status(400);
    throw new Error("Banners were not fetched or something went wrong");
  } else {
    res.status(201).json(banners);
  }
});

//Get Random Banner
const getRandomBanner = asyncHandler(async (req, res) => {
  const banners = await Banner.find();

  if (!banners) {
    res.status(400);
    throw new Error("Banners were not fetched or something went wrong");
  } else {
    const randomIndex = Math.floor(Math.random() * banners.length);
    const randomBanner = banners[randomIndex];
    res.status(200).json(randomBanner);
  }
});

export {
  getAllBanners,
  createBanner,
  deleteBanner,
  getRandomBanner,
  updateBanner,
};
