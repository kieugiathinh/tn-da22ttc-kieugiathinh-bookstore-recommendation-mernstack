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
      
      // Hàm helper để thêm 1 item cụ thể vào state
      const addItemToState = (itemToAdd) => {
        const existingItem = state.products.find(
          (item) => item.cartItemId === itemToAdd.cartItemId
        );

        if (existingItem) {
          const totalQty = existingItem.quantity + itemToAdd.quantity;
          let actualAdded = itemToAdd.quantity;
          
          // Giới hạn theo tồn kho (cho cả hàng thường lẫn hàng FS)
          if (totalQty > itemToAdd.countInStock) {
            actualAdded = itemToAdd.countInStock - existingItem.quantity;
            existingItem.quantity = itemToAdd.countInStock;
          } else {
            existingItem.quantity += actualAdded;
          }
          
          state.quantity += actualAdded;
          state.total += itemToAdd.price * actualAdded;
        } else {
          let actualAdded = itemToAdd.quantity;
          if (actualAdded > itemToAdd.countInStock) {
            actualAdded = itemToAdd.countInStock;
            itemToAdd.quantity = actualAdded;
          }
          state.products.push(itemToAdd);
          state.quantity += actualAdded;
          state.total += itemToAdd.price * actualAdded;
        }
      };

      if (newItem.isFlashSale) {
        // Xử lý tách đơn nếu vượt giới hạn Flash Sale
        const fsAvailable = Math.max(0, newItem.flashSaleQuantityLimit - newItem.flashSaleSoldCount);
        const existingFsItem = state.products.find(
          (item) => item.cartItemId === `${newItem._id}_fs`
        );
        const existingFsQty = existingFsItem ? existingFsItem.quantity : 0;
        const fsCapacityLeft = Math.max(0, fsAvailable - existingFsQty);

        if (newItem.quantity <= fsCapacityLeft) {
          // Thêm toàn bộ vào FS
          addItemToState({ ...newItem, cartItemId: `${newItem._id}_fs` });
        } else {
          // Tách: Một phần vào FS, phần thừa vào hàng Normal
          if (fsCapacityLeft > 0) {
            addItemToState({ ...newItem, quantity: fsCapacityLeft, cartItemId: `${newItem._id}_fs` });
          }
          const normalQty = newItem.quantity - fsCapacityLeft;
          if (normalQty > 0) {
            addItemToState({
              ...newItem,
              quantity: normalQty,
              isFlashSale: false,
              price: newItem.regularPrice || newItem.price, // Giá gốc
              cartItemId: `${newItem._id}_nm`
            });
          }
        }
      } else {
        // Hàng Normal
        addItemToState({ ...newItem, cartItemId: `${newItem._id}_nm` });
      }
    },

    removeProduct: (state, action) => {
      const cartItemIdToRemove = action.payload; // Payload nay phải truyền cartItemId
      const index = state.products.findIndex((item) => item.cartItemId === cartItemIdToRemove);

      if (index !== -1) {
        const itemToRemove = state.products[index];
        state.quantity -= itemToRemove.quantity;
        state.total -= itemToRemove.price * itemToRemove.quantity;
        state.products.splice(index, 1);
      }
    },

    updateQuantity: (state, action) => {
      const { cartItemId, quantity } = action.payload;
      const item = state.products.find((item) => item.cartItemId === cartItemId);

      if (item) {
        let newQty = quantity;
        
        // Chặn không vượt quá tồn kho
        if (newQty > item.countInStock) {
          newQty = item.countInStock;
        }

        // Chặn không vượt quá giới hạn Flash Sale (nếu là hàng FS)
        if (item.isFlashSale) {
          const fsAvailable = item.flashSaleQuantityLimit - item.flashSaleSoldCount;
          if (newQty > fsAvailable) {
            newQty = fsAvailable; // Khóa ở mức tối đa cho phép
          }
        }

        const quantityDifference = newQty - item.quantity;
        item.quantity = newQty;
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
