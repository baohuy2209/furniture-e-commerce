const express = require("express");
const { upload } = require("../middlewares/multer");
const { uploadImage } = require("../utils/utils");

const router = express.Router();

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Chưa có file nào được tải lên!",
      });
    }

    const result = await uploadImage(req.file.path, "products");

    res.json({
      success: true,
      data: {
        imageUrl: result.url,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;
