import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    products: [],
    quantity: 0,
    total: 0,
  },
  reducers: {
    addProduct: (state, action) => {
      const newItem = action.payload;
      const existingItem = state.products.find(
        (item) => item._id === newItem._id
      );

      if (existingItem) {
        // LOGIC MỚI: Kiểm tra cộng dồn
        const totalQty = existingItem.quantity + newItem.quantity;

        // Nếu tổng vượt quá tồn kho -> Chỉ lấy tối đa bằng tồn kho
        if (totalQty > newItem.countInStock) {
          // Tính lượng thực tế được thêm vào (để cộng vào tổng tiền/số lượng chung)
          const actualAdded = newItem.countInStock - existingItem.quantity;

          existingItem.quantity = newItem.countInStock;
          state.quantity += actualAdded;
          state.total += newItem.price * actualAdded;
        } else {
          // Nếu đủ hàng -> Cộng bình thường
          existingItem.quantity += newItem.quantity;
          state.quantity += newItem.quantity;
          state.total += newItem.price * newItem.quantity;
        }
      } else {
        // Sản phẩm mới -> Thêm bình thường
        state.products.push(newItem);
        state.quantity += newItem.quantity;
        state.total += newItem.price * newItem.quantity;
      }
    },

    removeProduct: (state, action) => {
      const idToRemove = action.payload;
      const index = state.products.findIndex((item) => item._id === idToRemove);

      if (index !== -1) {
        const itemToRemove = state.products[index];
        state.quantity -= itemToRemove.quantity;
        state.total -= itemToRemove.price * itemToRemove.quantity;
        state.products.splice(index, 1);
      }
    },

    updateQuantity: (state, action) => {
      const { _id, quantity } = action.payload;
      const item = state.products.find((item) => item._id === _id);

      if (item) {
        // LOGIC MỚI: Chặn không cho update vượt quá tồn kho
        if (quantity > item.countInStock) {
          return; // Không làm gì cả nếu vượt quá
        }

        const quantityDifference = quantity - item.quantity;
        item.quantity = quantity;
        state.quantity += quantityDifference;
        state.total += item.price * quantityDifference;
      }
    },

    clearCart: (state) => {
      state.products = [];
      state.quantity = 0;
      state.total = 0;
    },
  },
});

export const { addProduct, removeProduct, updateQuantity, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
