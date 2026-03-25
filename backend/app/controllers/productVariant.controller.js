const ProductVariant = require("../models/productVariant.model");
class ProductVariantController {
  // [GET] /api/product-variant
  async getAllVariants(req, res) {
    try {
      const variants = await ProductVariant.find().populate(
        "product",
        "product_name brand image_url",
      );
      return res
        .status(200)
        .json({ message: "Lấy dữ liệu thành công", data: variants });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
  // [GET] /api/product-variant/products/:id
  async getAllVariantByProductId(req, res) {
    try {
      const product_id = req.params.id;
      const listProductVariants = await ProductVariant.find({
        product: product_id,
      });
      return res
        .status(200)
        .json({ message: "Lấy dữ liệu thành công", data: listProductVariants });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
  // [GET] /api/product-variant/:id
  async getDetailProductVariant(req, res) {
    try {
      const product_variant_id = req.params.id;
      const detailProductVariant =
        await ProductVariant.findById(product_variant_id);
      if (!detailProductVariant) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy biến thể sản phẩm", data: null });
      }
      return res.status(200).json({
        message: "Load dữ liệu thành công",
        data: detailProductVariant,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
  // [GET] /api/product-variant/:id/default
  async getDefaultVariantProduct(req, res) {
    try {
      const product_id = req.params.id;
      const defaultVariantProduct = await ProductVariant.findOne({
        product: product_id,
        is_default: true,
      });
      if (!defaultVariantProduct) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy sản phẩm mặc định", data: null });
      }
      return res.status(200).json({
        message: "Load dữ liệu thành công",
        data: defaultVariantProduct,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
  // [GET] /api/product-variant/products/:productId/select
  async getVariantByMeasurementFields(req, res) {
    try {
      const { productId } = req.params;
      const filters = req.query; // { upholstery: "Belge...", sofa_direction: "left" }

      if (!filters || Object.keys(filters).length === 0) {
        return res
          .status(400)
          .json({ message: "Thiếu điều kiện tìm kiếm", data: null });
      }

      const query = { product: productId };
      for (const [field, value] of Object.entries(filters)) {
        query[`measurement.${field}`] = value;
      }

      const variant = await ProductVariant.findOne(query);

      if (!variant) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy biến thể phù hợp", data: null });
      }

      return res
        .status(200)
        .json({ message: "Lấy dữ liệu thành công", data: variant });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
}
module.exports = new ProductVariantController();
