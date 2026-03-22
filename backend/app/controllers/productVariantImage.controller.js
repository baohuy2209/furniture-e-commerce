const ProductVariantImage = require("../models/productVariantImage.model");
class ProductVariantImageController {
  // [GET] /api/product-variant-image/product-variants/:id
  async getAllImageByProductVariantId(req, res) {
    try {
      const product_variant_id = req.params.id;
      const listProductVariantImages = await ProductVariantImage.find({
        product_variant: product_variant_id,
      });
      return res.status(200).json({
        message: "Load dữ liệu thành công",
        data: listProductVariantImages,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
  async getDefaultImageByProductVariantId(req, res) {
    try {
      const product_variant_id = req.params.id;
      const listProductVariantImages = await ProductVariantImage.findOne({
        product_variant: product_variant_id,
        is_main: true,
      });
      return res.status(200).json({
        message: "Load dữ liệu thành công",
        data: listProductVariantImages,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
}
module.exports = new ProductVariantImageController();
