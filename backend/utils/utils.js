const cloudinary = require("../app/config/cloudinary");
const { OAuth2Client } = require("google-auth-library");
// Chuẩn hóa tên
function normalize(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}
// Dùng để generate slug từ chuỗi
function generateSlug(text) {
  return text
    .toString()
    .normalize("NFD") // tách dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, "") // xoá dấu
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // xoá ký tự đặc biệt
    .replace(/\s+/g, "-") // space -> -
    .replace(/-+/g, "-"); // bỏ -- dư
}
// upload image lên cloudinary và lấy url để hiển thị ảnh
/**
 * Cách dùng cơ bản
 * const express = require("express");
const { upload } = require("../middlewares/multer");
const { uploadImage } = require("../utils/uploadImage");

const router = express.Router();

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const result = await uploadImage(req.file.path, "products");

    res.json({
      success: true,
      imageUrl: result.url,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
 */
async function uploadImage(file, folder = "furniture-e-commer") {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: "image",
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    throw new Error("Upload image failed", {
      cause: error,
    });
  }
}
const getPagination = (page, size) => {
  const limit = size ? +size : 20;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const formatVND = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
  // → 59.224.000 ₫
};
async function verify(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return payload;
}

module.exports = {
  normalize,
  generateSlug,
  uploadImage,
  getPagination,
  formatVND,
  verify,
};
