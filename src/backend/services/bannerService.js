import Banner from "../models/bannerModel.js";

const createBanner = async (bannerData) => {
  const newBanner = new Banner(bannerData);
  const savedBanner = await newBanner.save();
  if (!savedBanner) {
    throw new Error("Banner was not created");
  }
  return savedBanner;
};

const updateBanner = async (id, bannerData) => {
  const banner = await Banner.findById(id);
  if (!banner) {
    throw new Error("Banner not found");
  }
  if (bannerData.isActive !== undefined) banner.isActive = bannerData.isActive;
  if (bannerData.title !== undefined) banner.title = bannerData.title;
  if (bannerData.subtitle !== undefined) banner.subtitle = bannerData.subtitle;
  if (bannerData.img !== undefined) banner.img = bannerData.img;
  if (bannerData.type !== undefined) banner.type = bannerData.type;
  
  return await banner.save();
};

const deleteBanner = async (id) => {
  const banner = await Banner.findByIdAndDelete(id);
  if (!banner) {
    throw new Error("Banner was not deleted");
  }
  return banner;
};

const getAllBanners = async () => {
  const banners = await Banner.find().lean();
  if (!banners) {
    throw new Error("Banners were not fetched or something went wrong");
  }
  return banners;
};

const getRandomBanner = async () => {
  const banners = await Banner.find().lean();
  if (!banners || banners.length === 0) {
    throw new Error("Banners were not fetched or something went wrong");
  }
  const randomIndex = Math.floor(Math.random() * banners.length);
  return banners[randomIndex];
};

export { createBanner, updateBanner, deleteBanner, getAllBanners, getRandomBanner };
