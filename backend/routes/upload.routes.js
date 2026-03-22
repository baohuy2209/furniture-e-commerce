const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadImage } = require("../utils/utils");
const { protectedRoute, isAdmin } = require("../middlewares/auth.jwt");

// Set up inline multer for parsing multipart/form-data
const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").pop();
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + "." + ext);
  },
});
const upload = multer({ storage });
// Only admins can upload products (temporarily no auth)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided", data: null });
    }

    const result = await uploadImage(req.file.path, "products");

    return res.status(200).json({
      message: "Upload thành công",
      data: {
        imageUrl: result.url,
      },
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return res.status(500).json({
      message: "Lỗi khi upload ảnh: " + err.message,
      data: null,
    });
  }
});

module.exports = router;
