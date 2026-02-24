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
  async getMainImageForDefaultVariant(product_variant_id) {
    const mainImageDefaultProduct = await ProductVariantImage.findOne({
      product_variant: product_variant_id,
      is_main: true,
    });
    return mainImageDefaultProduct;
  }
  async getAllDefaultProductVariantImage(product_variant_id) {
    const listDefaultProductVariantImage = await ProductVariantImage.find({
      product_variant: product_variant_id,
    });
    return listDefaultProductVariantImage;
  }
}

module.exports = new ProductService();
