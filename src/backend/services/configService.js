import SystemConfig from "../models/systemConfigModel.js";

const DEFAULT_CONFIGS = {
  INTERACTION_WEIGHTS: {
    view: 1,
    search_click: 2,
    add_to_cart: 3,
    favorite: 3.5,
    review: 4,
    purchase: 5,
    remove_cart: -3,
    remove_favorite: -3.5,
    low_rating: -4,
  },
  HYBRID_WEIGHTS: {
    cf: 40,
    cbf: 30,
    pop: 30,
  },
};

export const getConfigByKey = async (key) => {
  let config = await SystemConfig.findOne({ key });

  if (!config) {
    if (DEFAULT_CONFIGS[key] !== undefined) {
      config = await SystemConfig.create({
        key,
        value: DEFAULT_CONFIGS[key],
        description: `Cấu hình tự động tạo cho ${key}`,
      });
    } else {
      throw new Error("Cấu hình không tồn tại");
    }
  }
  return config;
};

export const updateConfigByKey = async (key, value) => {
  if (value === undefined) {
    throw new Error("Value không được để trống");
  }

  // Validate specific config keys
  if (key === "HYBRID_WEIGHTS") {
    const { cf, cbf, pop } = value;
    if (typeof cf !== 'number' || typeof cbf !== 'number' || typeof pop !== 'number') {
      throw new Error("Các trọng số phải là kiểu số");
    }
    if (cf < 0 || cbf < 0 || pop < 0 || cf > 100 || cbf > 100 || pop > 100) {
      throw new Error("Trọng số phải nằm trong khoảng 0 đến 100");
    }
    if (cf + cbf + pop !== 100) {
      throw new Error("Tổng các trọng số CF, CBF, Popularity phải bằng chính xác 100%");
    }
  }

  if (key === "INTERACTION_WEIGHTS") {
    const validKeys = [
      "view", "search_click", "add_to_cart", "favorite", "review", 
      "purchase", "remove_cart", "remove_favorite", "low_rating"
    ];
    for (const k of Object.keys(value)) {
      if (!validKeys.includes(k)) {
        throw new Error(`Thuộc tính hành vi '${k}' không hợp lệ`);
      }
      if (typeof value[k] !== 'number') {
        throw new Error(`Trọng số cho '${k}' phải là một con số`);
      }
    }
  }

  let config = await SystemConfig.findOne({ key });

  if (config) {
    config.value = value;
    await config.save();
  } else {
    config = await SystemConfig.create({
      key,
      value,
      description: `Cấu hình được tạo từ Admin cho ${key}`,
    });
  }

  // Set flag NEEDS_RETRAIN
  if (key === "HYBRID_WEIGHTS" || key === "INTERACTION_WEIGHTS") {
    let retrainFlag = await SystemConfig.findOne({ key: "NEEDS_RETRAIN" });
    if (retrainFlag) {
      retrainFlag.value = true;
      await retrainFlag.save();
    } else {
      await SystemConfig.create({
        key: "NEEDS_RETRAIN",
        value: true,
        description: "Cờ báo hiệu cấu hình đã thay đổi, cần huấn luyện lại AI",
      });
    }
  }

  return config;
};
