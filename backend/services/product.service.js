const ProductVariant = require("../app/models/productVariant.model");
const ProductVariantImage = require("../app/models/productVariantImage.model");
const ProductTags = require("../app/models/productTags.model");
const ProductCategory = require("../app/models/productCategory.model");
class ProductService {
  async getListProductInfo(products) {
    const listProductInfo = await Promise.all(
      products.map(async (product) => {
        const tagPromises = product.tags.map((tagId) =>
          ProductTags.findById(tagId).then((tag) => {
            return tag?.name || null;
          }),
        );
        const categoriesPromises = product.categories.map((categoryId) =>
          ProductCategory.findById({ _id: categoryId }).then((category) => {
            return category?.name || null;
          }),
        );
        const listProductTags = (await Promise.all(tagPromises)).filter(
          (name) => name !== null,
        );
        const listProductCategories = (
          await Promise.all(categoriesPromises)
        ).filter((name) => name !== null);
        const mainProductVariant = await this.getMainProductVariantInfo(
          product._id,
        );
        if (!mainProductVariant) {
          return {
            message: `Không tìm thấy variant mặc định cho sản phẩm ${product.product_name}`,
            data: null,
          };
        }
        const mainImageDefaultProduct =
          await this.getMainImageForDefaultVariant(mainProductVariant._id);
        if (!mainImageDefaultProduct) {
          return {
            message: `Không tìm thấy ảnh mặc định cho variant ${mainProductVariant._id}`,
            data: null,
          };
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
          categories: listProductCategories,
        };
      }),
    );
    return { data: listProductInfo, message: "Lấy dữ liệu thành công" };
  }
  async getNewProducts(products) {
    const newestProducts = products
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);

    const result = await this.getListProductInfo(newestProducts);
    return {
      data: result.data,
      message: "Lấy 6 sản phẩm mới nhất thành công",
    };
  }
  getTopSellingProducts(products, limit = 8) {
    return products.sort((a, b) => b.num_selled - a.num_selled).slice(0, limit);
  }
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
  async getProductCategoriesIdBySlug(slug) {
    const productCategory = await ProductCategory.findOne({ slug: slug });
    return productCategory._id;
  }
}

module.exports = new ProductService();
