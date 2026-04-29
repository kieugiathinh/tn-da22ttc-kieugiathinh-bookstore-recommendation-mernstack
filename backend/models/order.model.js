import mongoose from "mongoose";

const OrderSchema = mongoose.Schema(
  {
    // Thông tin người nhận
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    // ID của người mua (Liên kết với bảng User)
    userId: {
      type: String, // Có thể giữ String nếu bạn lưu id dạng chuỗi, hoặc dùng ObjectId
      required: true,
    },

    // Danh sách sản phẩm (QUAN TRỌNG: Định nghĩa rõ cấu trúc)
    products: [
      {
        productId: {
          type: String,
        },
        title: {
          type: String, // Lưu tên sách tại thời điểm mua
        },
        img: {
          type: String, // Lưu ảnh sách
        },
        quantity: {
          type: Number,
          default: 1,
        },
        price: {
          type: Number, // Giá tại thời điểm mua
        },
      },
    ],

    total: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      required: true,
      default: "COD",
    },

    // Trạng thái đơn hàng (0: Chờ, 1: Đã thanh toán/Đang xử lý, 2: Đã giao)
    status: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", OrderSchema);
export default Order;
