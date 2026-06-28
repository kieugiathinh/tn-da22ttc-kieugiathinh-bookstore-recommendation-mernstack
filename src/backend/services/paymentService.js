import crypto from "crypto";
import qs from "qs";
import moment from "moment";
export const paymentService = {
    // Hàm sắp xếp tham số VNPay
    sortObject: (obj) => {
        let sorted = {};
        let str = [];
        let key;
        for (key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                str.push(encodeURIComponent(key));
            }
        }
        str.sort();
        for (key = 0; key < str.length; key++) {
            sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
        }
        return sorted;
    },
    // Hàm tạo URL thanh toán
    createVNPayUrl: ({ orderId, amount, ipAddr }) => {
        let tmnCode = process.env.VNP_TMN_CODE;
        let secretKey = process.env.VNP_HASH_SECRET;
        let vnpUrl = process.env.VNP_URL;
        let returnUrl = process.env.VNP_RETURN_URL;
        if (tmnCode) tmnCode = tmnCode.trim();
        if (secretKey) secretKey = secretKey.trim();
        if (vnpUrl) vnpUrl = vnpUrl.trim();
        if (returnUrl) returnUrl = returnUrl.trim();
        let date = new Date();
        let createDate = moment(date).utcOffset("+07:00").format("YYYYMMDDHHmmss");
        let expireDate = moment(date).utcOffset("+07:00").add(15, "minutes").format("YYYYMMDDHHmmss");
        let vnp_Params = {};
        vnp_Params["vnp_Version"] = "2.1.0";
        vnp_Params["vnp_Command"] = "pay";
        vnp_Params["vnp_TmnCode"] = tmnCode;
        vnp_Params["vnp_Locale"] = "vn";
        vnp_Params["vnp_CurrCode"] = "VND";
        vnp_Params["vnp_TxnRef"] = orderId;
        vnp_Params["vnp_OrderInfo"] = `Thanh toan don hang ${orderId}`;
        vnp_Params["vnp_OrderType"] = "other";
        vnp_Params["vnp_Amount"] = Math.round(amount * 100);
        vnp_Params["vnp_ReturnUrl"] = returnUrl;
        let finalIp = typeof ipAddr === "string" ? ipAddr.replace(/^.*:/, "") : "127.0.0.1";
        if (finalIp === "1" || finalIp === "") finalIp = "127.0.0.1";
        vnp_Params["vnp_IpAddr"] = finalIp;
        vnp_Params["vnp_CreateDate"] = createDate;
        vnp_Params["vnp_ExpireDate"] = expireDate;
        vnp_Params = paymentService.sortObject(vnp_Params);
        let signData = qs.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
        vnp_Params["vnp_SecureHash"] = signed;
        vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });
        return vnpUrl;
    },
    // Hàm verify kết quả trả về
    verifyVNPayReturn: (queryData) => {
        let vnp_Params = { ...queryData };
        let secureHash = vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHashType"];
        vnp_Params = paymentService.sortObject(vnp_Params);
        let secretKey = process.env.VNP_HASH_SECRET;
        if (secretKey) secretKey = secretKey.trim();
        let signData = qs.stringify(vnp_Params, { encode: false });
        let hmac = crypto.createHmac("sha512", secretKey);
        let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
        return {
            isValid: secureHash === signed,
            orderId: vnp_Params["vnp_TxnRef"],
            responseCode: vnp_Params["vnp_ResponseCode"],
        };
    },
};
