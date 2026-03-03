const Product = require("../models/product.model");
const ProductTags = require("../models/productTags.model");
const productService = require("../../services/product.service");
class ProductController {
  // [GET] /api/products/
  async getAllProduct(req, res) {
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
              data: null,
            });
          }
          const mainImageDefaultProduct =
            await productService.getMainImageForDefaultVariant(
              mainProductVariant._id,
            );
          if (!mainImageDefaultProduct) {
            return res.status(500).json({
              message: `Lỗi server: Không tìm thấy ảnh mặc định cho variant ${mainProductVariant._id}`,
              data: null,
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

      return res
        .status(200)
        .json({ data: listProductInfo, message: "Lấy dữ liệu thành công" });
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
  //
}

module.exports = new ProductController();
