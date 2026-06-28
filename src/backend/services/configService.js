import SystemConfig from "../models/systemConfigModel.js";

const DEFAULT_CONFIGS = {
  INTERACTION_WEIGHTS: {
    view: 1,
    search_click: 2,
    add_to_cart: 3,
    review: 4,
    purchase: 5,
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

  return config;
};
