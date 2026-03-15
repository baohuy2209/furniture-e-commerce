const Product = require("../models/product.model");
const productService = require("../../services/product.service");
class ProductController {
  // [GET] /api/products/
  async getAllProduct(req, res) {
    try {
      const products = await Product.find({});
      const { data, message } =
        await productService.getListProductInfo(products);
      if (!data) {
        return res.status(404).json({ data: null, message });
      }
      return res.status(200).json({ data, message });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server" + error, data: null });
    }
  }
  // [GET] /api/products/news-product
  async getNewProduct(req, res) {
    try {
      const products = await Product.find({});
      const { data, message } = await productService.getNewProducts(products);
      if (!data) {
        return res.status(404).json({ data: null, message });
      }
      return res.status(200).json({ message: "Lấy sản phẩm thành công", data });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server" + error, data: null });
    }
  }
  // [GET] /api/products/best-seller-product
  async getBestSellerProduct(req, res) {
    try {
      const products = await Product.find({});
      const { data, message } =
        await productService.getListProductInfo(products);
      if (!data) {
        return res.status(404).json({ data: null, message });
      }
      const bestSellerProducts = productService.getTopSellingProducts(data, 8);
      return res.status(200).json({ data: bestSellerProducts, message });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server" + error, data: null });
    }
  }
  // [GET] /api/products/:id
  async getProductById(req, res) {
    try {
      const productId = req.params.id;
      const productInfo = await Product.findById(productId);
      const defaultProductVariant =
        await productService.getMainProductVariantInfo(productId);
      const listMainImageDefaultProduct =
        await productService.getAllDefaultProductVariantImage(
          defaultProductVariant._id,
        );
      return res.status(200).json({
        message: `Get product with id ${req.params.id}`,
        data: {
          productInfo,
          defaultProductVariant,
          listMainImageDefaultProduct,
        },
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi server" + e, data: null });
    }
  }
  // [POST] /api/products
  // [POST] /api/products/related-product
  async getRelatedProduct(req, res) {
    try {
      const { listProductCategoryIds } = req.body;
      const relatedProducts = await Product.find({
        categories: { $in: listProductCategoryIds },
      });
      const listRelatedProducts =
        await productService.getListProductInfo(relatedProducts);
      return res.status(200).json({
        message: `Lấy thành công các dữ liệu liên quan`,
        data: listRelatedProducts,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi server" + e, data: null });
    }
  }
}

module.exports = new ProductController();
