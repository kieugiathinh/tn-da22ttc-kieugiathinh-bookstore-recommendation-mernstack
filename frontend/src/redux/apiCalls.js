import { userRequest } from "../requestMethods";
import { loginFailure, loginStart, loginSuccess } from "./userRedux";

export const login = async (dispatch, user) => {
  dispatch(loginStart());

  try {
    // Sửa 1: Bỏ dấu gạch chéo cuối cùng "/auth/login/" -> "/auth/login" cho chuẩn REST
    const res = await userRequest.post("/auth/login", user);

    // Nếu thành công, lưu data vào Redux
    dispatch(loginSuccess(res.data));

    // Trả về data để component có thể dùng nếu cần (optional)
    return res.data;
  } catch (error) {
    // Nếu thất bại, báo cho Redux biết
    dispatch(loginFailure());

    // Sửa 2 (QUAN TRỌNG): Ném lỗi ra ngoài để Login.jsx bắt được và hiện Toast
    throw error;
  }
};
