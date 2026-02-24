const ProductVariant = require("../app/models/productVariant.model");
const ProductVariantImage = require("../app/models/productVariantImage.model");
class ProductService {
  async getMainProductVariantInfo(product_id) {
    const mainProductVariant = await ProductVariant.findOne({
      product: product_id,
      is_default: true,
    });
    return mainProductVariant;
  }
  async getMainImageForDefaultVariant(product_variant) {
    const mainImageDefaultProduct = await ProductVariantImage.findOne({
      product_variant: product_variant._id,
      is_main: true,
    });
    return mainImageDefaultProduct;
  }
}

module.exports = new ProductService();
