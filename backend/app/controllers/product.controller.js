const ProductVariant = require("../models/productVariant.model");
const ProductVariantImage = require("../models/productVariantImage.model");
const ProductTags = require("../models/productTags.model");
const Product = require("../models/product.model");
const productService = require("../../services/product.service");
const { getPagination, generateSlug } = require("../../utils/utils");
const stockItemService = require("../../services/stock.service");
class ProductController {
  // [GET] /api/products/
  async getAllProduct(req, res) {
    try {
      const { page, size, title } = req.query;
      var condition = title
        ? { title: { $regex: new RegExp(title), $options: "i" } }
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        .json({ message: "Lỗi server: " + error.message, data: null });
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
        message: `Lấy thông tin sản phẩm có id ${req.params.id} thành công`,
        data: {
          productInfo,
          defaultProductVariant,
          listMainImageDefaultProduct,
        },
      });
    } catch (e) {
      console.error(e);
      return res
        .status(500)
        .json({ message: "Lỗi server: " + e.message, data: null });
    }
  }

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
      return res
        .status(500)
        .json({ message: "Lỗi server: " + e.message, data: null });
    }
  }

  // ======== ADMIN CRUD (inlined logic) ========

  async getAdminProducts(options) {
    const {
      condition,
      limit,
      offset,
      sortKey,
      sortDir,
      stock,
      minPrice,
      maxPrice,
    } = options;
    const pipeline = [];

    if (Object.keys(condition).length > 0) {
      pipeline.push({ $match: condition });
    }

    pipeline.push({
      $lookup: {
        from: "productvariants",
        localField: "_id",
        foreignField: "product",
        as: "raw_variants",
      },
    });

    pipeline.push({
      $addFields: {
        inventoryTotal: { $sum: "$raw_variants.num_inventory" },
        priceMin: { $min: "$raw_variants.price" },
        ratingAvg: { $avg: "$raw_variants.rating.average" },
      },
    });

    const secondaryMatch = {};
    if (stock === "in") secondaryMatch.inventoryTotal = { $gt: 5 };
    else if (stock === "low")
      secondaryMatch.inventoryTotal = { $gt: 0, $lte: 5 };
    else if (stock === "out") secondaryMatch.inventoryTotal = { $lte: 0 };

    if (minPrice || maxPrice) {
      secondaryMatch.priceMin = {};
      if (minPrice) secondaryMatch.priceMin.$gte = Number(minPrice);
      if (maxPrice) secondaryMatch.priceMin.$lte = Number(maxPrice);
    }

    if (Object.keys(secondaryMatch).length > 0) {
      pipeline.push({ $match: secondaryMatch });
    }

    let sortConfig = {};
    const dir = sortDir === "desc" ? -1 : 1;
    switch (sortKey) {
      case "priceMin":
        sortConfig = { priceMin: dir };
        break;
      case "inventoryTotal":
        sortConfig = { inventoryTotal: dir };
        break;
      case "ratingAvg":
        sortConfig = { ratingAvg: dir };
        break;
      case "name":
        sortConfig = { product_name: dir };
        break;
      case "brand":
        sortConfig = { brand: dir };
        break;
      default:
        sortConfig = { createdAt: -1 };
        break;
    }
    pipeline.push({ $sort: sortConfig });

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: offset }, { $limit: limit }],
      },
    });

    const result = await Product.aggregate(pipeline);
    const data = result[0].data;
    const total = result[0].metadata[0]?.total || 0;

    const productIds = data.map((p) => p._id);
    const allVariants = await ProductVariant.find({
      product: { $in: productIds },
    }).lean();
    const allImages = await ProductVariantImage.find({
      product_variant: { $in: allVariants.map((v) => v._id) },
    }).lean();

    const formattedProducts = data.map((p) => {
      const pVariants = allVariants.filter(
        (v) => v.product.toString() === p._id.toString(),
      );
      const pImages = pVariants.flatMap((v) =>
        allImages.filter(
          (img) => img.product_variant.toString() === v._id.toString(),
        ),
      );

      return {
        product_id: p._id,
        product_name: p.product_name || p.title,
        brand_name: p.brand || "",
        description: p.description || "",
        discount_percent: p.discount_percent || 0,
        is_assembly: p.is_assembly || false,
        warranty: p.warranty || 12,
        tags: ["furniture", "decor"],
        image_url: p.image_url || [],
        inventoryTotal: p.inventoryTotal || 0,
        priceMin: p.priceMin || 0,
        ratingAvg: p.ratingAvg || 0,
        variants: pVariants.map((v) => ({
          product_variant_id: v._id,
          product_id: p._id,
          sku: v.sku,
          price: v.price || 0,
          weight: v.weight || 0,
          num_inventory: v.num_inventory || 0,
        })),
        images: pImages.map((img) => ({
          product_variant_id: img.product_variant,
          url: img.url,
          is_main: img.is_main || false,
          position: img.position || 0,
        })),
      };
    });

    return { products: formattedProducts, total };
  }

  async getProductDetailInternal(id) {
    const product = await Product.findById(id).lean();
    if (!product) return null;

    const variants = await ProductVariant.find({ product: id }).lean();
    const images = await ProductVariantImage.find({
      product_variant: { $in: variants.map((v) => v._id) },
    }).lean();

    return {
      product: {
        ...product,
        product_id: product._id,
        brand_name: product.brand,
      },
      variants: variants.map((v) => ({
        ...v,
        product_variant_id: v._id,
        product_id: product._id,
      })),
      images: images.map((img) => ({
        ...img,
        product_variant_id: img.product_variant,
      })),
    };
  }

  async createFullProductInternal(payload) {
    const { editForm, editVariants } = payload;
    const tagIds = [];
    if (editForm.tagsText) {
      const tagNames = editForm.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      for (const name of tagNames) {
        const slug = generateSlug(name);
        let tag = await ProductTags.findOne({ slug });
        if (!tag) {
          tag = new ProductTags({ name, slug });
          await tag.save();
        }
        tagIds.push(tag._id);
      }
    }

    const newProduct = new Product({
      product_name: editForm.product_name,
      brand: editForm.brand_name,
      discount_percent: Number(editForm.discount_percent) || 0,
      warranty:
        parseInt(String(editForm.warranty || 0).replace(/\D/g, "")) || 0,
      is_assembly: !!editForm.is_assembly,
      description: editForm.description,
      tags: tagIds,
      image_url: editForm.product_main_image
        ? [editForm.product_main_image]
        : editForm.image_url || [],
    });
    await newProduct.save();

    for (const ev of editVariants || []) {
      const variant = new ProductVariant({
        product: newProduct._id,
        sku: ev.sku,
        price: Number(ev.price) || 0,
        num_inventory: Number(ev.num_inventory) || 50,
        num_selled: Number(ev.num_selled) || 0,
        weight: Number(ev.weight) || 0,
        rating: { average: Number(ev.rating) || 5, count: 0 },
        expected_delivery: ev.expected_delivery,
        designed_by: ev.designed_by,
        is_default: !!ev.is_default,
      });
      await variant.save();

      const vImages = ev.images || [];
      for (let i = 0; i < vImages.length; i++) {
        const url =
          typeof vImages[i] === "object" ? vImages[i].url : vImages[i];
        if (!url) continue;
        await new ProductVariantImage({
          product_variant: variant._id,
          url,
          position: i,
          is_main: i === 0,
        }).save();
      }
      await stockItemService.createStockItem(
        variant._id,
        "69bc0e68fb90522f5fd9f7e6",
        50,
        50,
      );
    }

    return newProduct;
  }

  async updateFullProductInternal(productId, payload) {
    const { editForm, editVariants } = payload;
    const product = await Product.findById(productId);
    if (!product) throw new Error("Product not found");

    const tagIds = [];
    if (editForm.tagsText) {
      const tagNames = editForm.tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      for (const name of tagNames) {
        const slug = generateSlug(name);
        let tag = await ProductTags.findOne({ slug });
        if (!tag) {
          tag = new ProductTags({ name, slug });
          await tag.save();
        }
        tagIds.push(tag._id);
      }
    }

    product.product_name = editForm.product_name;
    product.brand = editForm.brand_name;
    product.discount_percent = Number(editForm.discount_percent) || 0;
    product.warranty =
      parseInt(String(editForm.warranty || 0).replace(/\D/g, "")) || 0;
    product.is_assembly = !!editForm.is_assembly;
    product.description = editForm.description;
    product.tags = tagIds;
    if (editForm.product_main_image)
      product.image_url = [editForm.product_main_image];
    await product.save();

    const oldVariants = await ProductVariant.find({ product: productId });
    await ProductVariantImage.deleteMany({
      product_variant: { $in: oldVariants.map((v) => v._id) },
    });
    await ProductVariant.deleteMany({ product: productId });

    for (const ev of editVariants || []) {
      const variant = new ProductVariant({
        product: productId,
        sku: ev.sku,
        price: Number(ev.price) || 0,
        num_inventory: Number(ev.num_inventory) || 0,
        num_selled: Number(ev.num_selled) || 0,
        weight: Number(ev.weight) || 0,
        rating: { average: Number(ev.rating) || 0, count: 0 },
        expected_delivery: ev.expected_delivery,
        designed_by: ev.designed_by,
        is_default: !!ev.is_default,
      });
      await variant.save();

      const vImages = ev.images || [];
      for (let i = 0; i < vImages.length; i++) {
        const url =
          typeof vImages[i] === "object" ? vImages[i].url : vImages[i];
        if (!url) continue;
        await new ProductVariantImage({
          product_variant: variant._id,
          url,
          position: i,
          is_main: i === 0,
        }).save();
      }
    }
    return product;
  }

  // ======== API WRAPPERS ========

  async apiGetAdminProducts(req, res) {
    try {
      const {
        page,
        size,
        q,
        stock,
        minPrice,
        maxPrice,
        sortKey,
        sortDir,
        room,
        brand,
      } = req.query;
      const condition = {};
      if (q) condition.product_name = { $regex: new RegExp(q, "i") };
      if (brand) condition.brand = { $regex: new RegExp(brand, "i") };

      const { limit, offset } = getPagination(page, size);
      const data = await this.getAdminProducts({
        condition,
        limit,
        offset,
        sortKey,
        sortDir,
        stock,
        minPrice,
        maxPrice,
        room,
      });

      return res.status(200).json({
        message: "Lấy danh sách sản phẩm thành công",
        data: {
          products: data.products,
          totalItems: data.total,
          totalPages: Math.ceil(data.total / limit),
          currentPage: parseInt(page) || 1,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi server: " + err.message });
    }
  }

  async apiGetProductDetail(req, res) {
    try {
      const data = await this.getProductDetailInternal(req.params.id);
      if (!data)
        return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      return res.status(200).json({ message: "Thành công", data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi server: " + err.message });
    }
  }

  async apiCreateProduct(req, res) {
    try {
      const data = await this.createFullProductInternal(req.body);
      return res.status(201).json({ message: "Thành công", data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi: " + err.message });
    }
  }

  async apiUpdateProduct(req, res) {
    try {
      const data = await this.updateFullProductInternal(
        req.params.id,
        req.body,
      );
      return res.status(200).json({ message: "Thành công", data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi: " + err.message });
    }
  }

  async apiDeleteProduct(req, res) {
    try {
      const id = req.params.id;
      const variants = await ProductVariant.find({ product: id });
      await ProductVariantImage.deleteMany({
        product_variant: { $in: variants.map((v) => v._id) },
      });
      await ProductVariant.deleteMany({ product: id });
      await Product.findByIdAndDelete(id);
      return res.status(200).json({ message: "Thành công" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi: " + err.message });
    }
  }
}

module.exports = new ProductController();
