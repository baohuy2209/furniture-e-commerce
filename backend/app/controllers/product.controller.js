const Product = require("../models/product.model");
const ProductTags = require("../models/productTags.model");
const productService = require("../../services/product.service");
class ProductController {
  // [GET] /api/products/
  async getAll(req, res) {
    try {
      const products = await Product.find({});

      const listProductInfo = await Promise.all(
        products.map(async (product) => {
          const tagPromises = product.tags.map((tagId) =>
            ProductTags.findById(tagId).then((tag) => {
              return tag?.name || null;
            }),
          );

          const listProductTags = (await Promise.all(tagPromises)).filter(
            (name) => name !== null,
          );
          const mainProductVariant =
            await productService.getMainProductVariantInfo(product._id);
          if (!mainProductVariant) {
            return res.status(500).json({
              message: `Lỗi server: Không tìm thấy variant mặc định cho sản phẩm ${product.product_name}`,
            });
          }
          const mainImageDefaultProduct =
            await productService.getMainImageForDefaultVariant(
              mainProductVariant._id,
            );
          if (!mainImageDefaultProduct) {
            return res.status(500).json({
              message: `Lỗi server: Không tìm thấy ảnh mặc định cho variant ${mainProductVariant._id}`,
            });
          }
          return {
            _id: product._id,
            product_name: product.product_name,
            description: product.description,
            discount_percent: product.discount_percent,
            tags: listProductTags,
            price: mainProductVariant.price,
            num_selled: mainProductVariant.num_selled,
            rating: mainProductVariant.rating.average,
            main_image: mainImageDefaultProduct.url,
          };
        }),
      );

      res.json(listProductInfo);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  }
  async getById(req, res) {
    res.json({ message: `Get product with id ${req.params.id}` });
  }
}

module.exports = new ProductController();
