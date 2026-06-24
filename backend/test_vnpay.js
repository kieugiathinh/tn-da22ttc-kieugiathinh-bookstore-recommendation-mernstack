import crypto from 'crypto';
import qs from 'qs';
import moment from 'moment';
import axios from 'axios';

const sortObject = (obj) => {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
};

async function testVNPay() {
  let date = new Date();
  let createDate = moment(date).utcOffset("+07:00").format("YYYYMMDDHHmmss");
  let expireDate = moment(date).utcOffset("+07:00").add(15, 'minutes').format("YYYYMMDDHHmmss");

  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = "C1R3S4BM";
  vnp_Params["vnp_Locale"] = "vn";
  vnp_Params["vnp_CurrCode"] = "VND";
  vnp_Params["vnp_TxnRef"] = 'Test' + Date.now().toString().slice(-6);
  vnp_Params["vnp_OrderInfo"] = "Thanh toan don hang test";
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = 10000000;
  vnp_Params["vnp_ReturnUrl"] = "http://localhost:5173/vnpay-return";
  vnp_Params["vnp_IpAddr"] = "127.0.0.1";
  vnp_Params["vnp_CreateDate"] = createDate;
  vnp_Params["vnp_ExpireDate"] = expireDate;

  vnp_Params = sortObject(vnp_Params);

  let signData = qs.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac("sha512", "NW3IHEZFOYARLFF7T39HWNQMXT7WZPZE");
  let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  vnpUrl += "?" + qs.stringify(vnp_Params, { encode: false });

  console.log("URL:", vnpUrl);
  
  try {
    const res = await axios.get(vnpUrl, { maxRedirects: 0, validateStatus: () => true });
    console.log("Status:", res.status);
    console.log("Location:", res.headers.location);
  } catch(e) {
    console.error(e.message);
  }
}

testVNPay();
