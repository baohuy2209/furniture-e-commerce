const Product = require("../models/product.model");
const productService = require("../../services/product.service");
const { getPagination } = require("../../utils/utils");
class ProductController {
  // [GET] /api/products/
  async getAllProduct(req, res) {
    try {
      const { page, size, title } = req.query;
      var condition = title
        ? { title: { $regex: new RegExp(title), $option: "i" } }
        : {};
      const { limit, offset } = getPagination(page, size);
      const products = await Product.paginate(condition, { offset, limit });
      const { data, message } = await productService.getListProductInfo(
        products.docs,
      );
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
  // [GET] /api/products/living-room
  async getAllLivingRoomProduct(req, res) {
    try {
      const productCategoryId =
        await productService.getProductCategoriesIdBySlug("living-room");
      if (!productCategoryId) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      const products = await Product.find({
        categories: { $in: productCategoryId },
      });
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
  // [GET] /api/products/bedroom
  async getAllBedroomProduct(req, res) {
    try {
      const productCategoryId =
        await productService.getProductCategoriesIdBySlug("bedroom");
      if (!productCategoryId) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      const products = await Product.find({
        categories: { $in: productCategoryId },
      });
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
  // [GET] /api/products/bathroom
  async getAllBathroomProduct(req, res) {
    try {
      const productCategoryId =
        await productService.getProductCategoriesIdBySlug("bathroom");
      if (!productCategoryId) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      const products = await Product.find({
        categories: { $in: productCategoryId },
      });
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
  // [GET] /api/products/dining-room
  async getAllDiningRoomProduct(req, res) {
    try {
      const productCategoryId =
        await productService.getProductCategoriesIdBySlug("dining-room");
      if (!productCategoryId) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      const products = await Product.find({
        categories: { $in: productCategoryId },
      });
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
  // [GET] /api/products/outdoor
  async getAllOutdoorProduct(req, res) {
    try {
      const productCategoryId =
        await productService.getProductCategoriesIdBySlug("outdoor");
      if (!productCategoryId) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      const products = await Product.find({
        categories: { $in: productCategoryId },
      });
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
  // [GET] /api/products/accessories
  async getAllAccessoriesProduct(req, res) {
    try {
      const productCategoryId =
        await productService.getProductCategoriesIdBySlug("accessories");
      if (!productCategoryId) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      const products = await Product.find({
        categories: { $in: productCategoryId },
      });
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
  // [GET] /api/products/best-seller-product/living-room
  async getBestSellerProductLivingRoom(req, res) {
    try {
      const productCategoryId =
        await productService.getProductCategoriesIdBySlug("living-room");
      if (!productCategoryId) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      const products = await Product.find({
        categories: {
          $in: productCategoryId,
        },
      });
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
  // [GET] /api/products/best-seller-product/bedroom
  async getBestSellerProductBedroom(req, res) {
    try {
      const productCategoryId =
        await productService.getProductCategoriesIdBySlug("bedroom");
      if (!productCategoryId) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      const products = await Product.find({
        categories: {
          $in: productCategoryId,
        },
      });
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
  // [GET] /api/products/best-seller-product/dining-room
  async getBestSellerProductDiningRoom(req, res) {
    try {
      const productCategoryId =
        await productService.getProductCategoriesIdBySlug("dining-room");
      if (!productCategoryId) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      const products = await Product.find({
        categories: {
          $in: productCategoryId,
        },
      });
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
  // [GET] /api/products/best-seller-product/outdoor
  async getBestSellerProductOutdoor(req, res) {
    try {
      const productCategoryId =
        await productService.getProductCategoriesIdBySlug("outdoor");
      if (!productCategoryId) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      const products = await Product.find({
        categories: {
          $in: productCategoryId,
        },
      });
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
  // [GET] /api/products/best-seller-product/bathroom
  async getBestSellerProductBathroom(req, res) {
    try {
      const productCategoryId =
        await productService.getProductCategoriesIdBySlug("bathroom");
      if (!productCategoryId) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      const products = await Product.find({
        categories: {
          $in: productCategoryId,
        },
      });
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
  // [GET] /api/products/best-seller-product/accessories
  async getBestSellerProductAccessories(req, res) {
    try {
      const productCategoryId =
        await productService.getProductCategoriesIdBySlug("accessories");
      if (!productCategoryId) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy loại sản phẩm", data: null });
      }
      const products = await Product.find({
        categories: {
          $in: productCategoryId,
        },
      });
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
