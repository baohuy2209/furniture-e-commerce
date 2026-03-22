const ProductVariant = require('../models/productVariant.model');
const ProductVariantImage = require('../models/productVariantImage.model');
const ProductTags = require('../models/productTags.model');
const { generateSlug } = require('../../utils/utils');
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

  // ======== ADMIN CRUD (inlined from service) ========
async getAdminProducts({ condition, limit, offset, sortKey, sortDir, stock, minPrice, maxPrice, room }) {
    const pipeline = [];

    // 1. Initial Match (text search, basic condition)
    if (Object.keys(condition).length > 0) {
      pipeline.push({ $match: condition });
    }

    // 2. Lookup Variants
    pipeline.push({
      $lookup: {
        from: "productvariants",
        localField: "_id",
        foreignField: "product",
        as: "raw_variants"
      }
    });

    // 3. Add Calculated Fields for Filtering and Sorting
    pipeline.push({
      $addFields: {
        inventoryTotal: { $sum: "$raw_variants.num_inventory" },
        priceMin: { $min: "$raw_variants.price" },
        ratingAvg: { $avg: "$raw_variants.rating.average" }
      }
    });

    // 4. Secondary Match (Stock, Price, Room)
    const secondaryMatch = {};
    if (stock === "in") secondaryMatch.inventoryTotal = { $gt: 5 };
    else if (stock === "low") secondaryMatch.inventoryTotal = { $gt: 0, $lte: 5 };
    else if (stock === "out") secondaryMatch.inventoryTotal = { $lte: 0 };

    if (minPrice || maxPrice) {
      secondaryMatch.priceMin = {};
      if (minPrice) secondaryMatch.priceMin.$gte = Number(minPrice);
      if (maxPrice) secondaryMatch.priceMin.$lte = Number(maxPrice);
    }
    
    if (room) {
      // Assuming 'tags' might contain room string or we strictly search text
      // For now, if room is provided, match within "tags" or "brand" loosely if needed.
    }

    if (Object.keys(secondaryMatch).length > 0) {
      pipeline.push({ $match: secondaryMatch });
    }

    // 5. Sorting
    let sortConfig = {};
    const dir = sortDir === "desc" ? -1 : 1;
    switch (sortKey) {
      case "priceMin": sortConfig = { priceMin: dir }; break;
      case "inventoryTotal": sortConfig = { inventoryTotal: dir }; break;
      case "ratingAvg": sortConfig = { ratingAvg: dir }; break;
      case "name": sortConfig = { product_name: dir }; break;
      case "brand": sortConfig = { brand: dir }; break;
      default: sortConfig = { createdAt: -1 }; break;
    }
    pipeline.push({ $sort: sortConfig });

    // 6. Facet for Pagination
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: offset }, { $limit: limit }]
      }
    });

    const result = await Product.aggregate(pipeline);
    const data = result[0].data;
    const total = result[0].metadata[0]?.total || 0;

    // 7. Attach Images and Format exactly as frontend expects 
    // (Frontend needs raw variants and images nested to calculate rows)
    const productIds = data.map(p => p._id);
    const allVariants = await ProductVariant.find({ product: { $in: productIds } }).lean();
    const allImages = await ProductVariantImage.find({ product_variant: { $in: allVariants.map(v => v._id) } }).lean();

    let formattedProducts = data.map(p => {
      const pVariants = allVariants.filter(v => v.product.toString() === p._id.toString());
      const pImages = pVariants.flatMap(v => allImages.filter(img => img.product_variant.toString() === v._id.toString()));

      return {
        product_id: p._id,
        product_name: p.product_name || p.title, 
        brand_name: p.brand || "", 
        description: p.description || "",
        discount_percent: p.discount_percent || 0,
        is_assembly: p.is_assembly || false,
        warranty: p.warranty || 12,
        tags: ["furniture", "decor"], // Mock tags for layout
        product_component: p.product_component || {},
        image_url: p.image_url || [],
        variants: pVariants.map(v => ({
          product_varant_id: v._id,
          product_id: p._id,
          sku: v.sku,
          price: v.price || 0,
          weight: v.weight || 0,
          num_inventory: v.num_inventory || 0,
          num_selled: v.num_selled || 0,
          designed_by: v.designed_by || "",
          rating: v.rating?.average || 0,
          expected_delivery: v.expected_delivery || "3-5 days",
          component_variants: v.component_variants || v.measurement || {},
          measurement: v.measurement || {},
          is_default: v.is_default || false,
        })),
        images: pImages.map(img => ({
          product_varant_id: img.product_variant,
          url: img.url,
          is_main: img.is_main || false,
          position: img.position || 0,
        }))
      }
    });

    return { products: formattedProducts, total };
  }

  async getProductDetail(id) {
    const product = await Product.findById(id).lean();
    if (!product) return null;

    const variants = await ProductVariant.find({ product: id }).lean();
    const images = await ProductVariantImage.find({ product_variant: { $in: variants.map(v => v._id) } }).lean();

    // Map to FE format
    const pVariants = variants.map(v => ({ ...v, product_varant_id: v._id, product_id: product._id }));
    const pImages = images.map(img => ({ ...img, product_varant_id: img.product_variant }));

    return {
      product: { ...product, product_id: product._id, brand_name: product.brand },
      variants: pVariants,
      images: pImages
    };
  }

  async createFullProduct(payload) {
    try {
      const { editForm, editVariants } = payload;
      
      const tagIds = [];
      if (editForm.tagsText && typeof editForm.tagsText === 'string') {
        const tagNames = editForm.tagsText.split(',').map(t => t.trim()).filter(Boolean);
        for (const tagName of tagNames) {
          const slug = generateSlug(tagName);
          let tag = await ProductTags.findOne({ slug });
          if (!tag) {
            tag = new ProductTags({ name: tagName, slug });
            await tag.save();
          }
          tagIds.push(tag._id);
        }
      }

      const newProduct = new Product({
        product_name: editForm.product_name,
        brand: editForm.brand_name,
        discount_percent: Number(editForm.discount_percent) || 0,
        warranty: parseInt(String(editForm.warranty || 0).replace(/\D/g, '')) || 0,
        is_assembly: !!editForm.is_assembly,
        description: editForm.description,
        tags: tagIds,
        image_url: editForm.product_main_image ? [editForm.product_main_image] : editForm.image_url || [],
      });
      await newProduct.save();

      for (const ev of (editVariants || [])) {
        const skuPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const kvObject = {};
        (ev.componentEntries || []).forEach(e => { if (e.key) kvObject[e.key] = e.value; });

        const mObject = {};
        (ev.measurementEntries || []).forEach(e => { if (e.key) mObject[e.key] = e.value; });

        const variant = new ProductVariant({
          product: newProduct._id,
          sku: String(ev.sku || `SKU-${Date.now()}-${skuPart}`),
          price: Number(ev.price) || 0,
          num_inventory: Number(ev.num_inventory) || 0,
          num_selled: Number(ev.num_selled) || 0,
          weight: Number(ev.weight) || 0,
          rating: { average: Number(ev.rating) || 0, count: 0 },
          expected_delivery: ev.expected_delivery,
          designed_by: ev.designed_by,
          is_default: !!ev.is_default,
          component_variants: kvObject,
          measurement: mObject,
        });
        await variant.save();

        const vImages = ev.images || [];
        for (let i = 0; i < vImages.length; i++) {
          const imgUrl = typeof vImages[i] === 'object' ? vImages[i].url : vImages[i];
          if (!imgUrl) continue;
          const vImg = new ProductVariantImage({
            product_variant: variant._id,
            url: imgUrl,
            position: i,
            is_main: (i === 0)
          });
          await vImg.save();
        }
      }
      return newProduct;
    } catch (e) {
      console.error("ADMIN SERVICE CREATE ERROR:", e);
      throw e;
    }
  }

  async updateFullProduct(productId, payload) {
    try {
      const { editForm, editVariants } = payload;
      
      const product = await Product.findById(productId);
      if (!product) throw new Error("Product not found");

      const tagIds = [];
      if (editForm.tagsText && typeof editForm.tagsText === 'string') {
        const tagNames = editForm.tagsText.split(',').map(t => t.trim()).filter(Boolean);
        for (const tagName of tagNames) {
          const slug = generateSlug(tagName);
          let tag = await ProductTags.findOne({ slug });
          if (!tag) {
            tag = new ProductTags({ name: tagName, slug });
            await tag.save();
          }
          tagIds.push(tag._id);
        }
      }

      product.product_name = editForm.product_name;
      product.brand = editForm.brand_name;
      product.discount_percent = Number(editForm.discount_percent) || 0;
      product.warranty = parseInt(String(editForm.warranty || 0).replace(/\D/g, '')) || 0;
      product.is_assembly = !!editForm.is_assembly;
      product.description = editForm.description;
      product.tags = tagIds;
      if (editForm.product_main_image) {
        product.image_url = [editForm.product_main_image];
      }
      await product.save();

      // Clean sync for variants
      const oldVariants = await ProductVariant.find({ product: productId });
      const oldVariantIds = oldVariants.map(v => v._id);
      await ProductVariantImage.deleteMany({ product_variant: { $in: oldVariantIds } });
      await ProductVariant.deleteMany({ product: productId });

      for (const ev of (editVariants || [])) {
        const skuPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const kvObject = {};
        (ev.componentEntries || []).forEach(e => { if (e.key) kvObject[e.key] = e.value; });

        const mObject = {};
        (ev.measurementEntries || []).forEach(e => { if (e.key) mObject[e.key] = e.value; });

        const variant = new ProductVariant({
          product: productId,
          sku: String(ev.sku || `SKU-${Date.now()}-${skuPart}`),
          price: Number(ev.price) || 0,
          num_inventory: Number(ev.num_inventory) || 0,
          num_selled: Number(ev.num_selled) || 0,
          weight: Number(ev.weight) || 0,
          rating: { average: Number(ev.rating) || 0, count: 0 },
          expected_delivery: ev.expected_delivery,
          designed_by: ev.designed_by,
          is_default: !!ev.is_default,
          component_variants: kvObject,
          measurement: mObject,
        });
        await variant.save();

        const vImages = ev.images || [];
        for (let i = 0; i < vImages.length; i++) {
          const imgUrl = typeof vImages[i] === 'object' ? vImages[i].url : vImages[i];
          if (!imgUrl) continue;
          const vImg = new ProductVariantImage({
            product_variant: variant._id,
            url: imgUrl,
            position: i,
            is_main: (i === 0)
          });
          await vImg.save();
        }
      }
      
      return product;
    } catch (e) {
      console.error("ADMIN SERVICE UPDATE ERROR:", e);
      throw e;
    }
  }

  async deleteProduct(id) {
        try {
      const variants = await ProductVariant.find({ product: id });
      for (let v of variants) {
        await ProductVariantImage.deleteMany({ product_variant: v._id }, {});
      }
      await ProductVariant.deleteMany({ product: id }, {});
      await Product.findByIdAndDelete(id, {});
      
    } catch (e) {
      
      throw e;
    } finally {
      
    }
  }



  // Wrapper for routing:
  async apiGetAdminProducts(req, res) {
      try {
        const { page, size, q, stock, minPrice, maxPrice, sortKey, sortDir, room, brand } = req.query;
        const condition = {};
        if (q) condition.product_name = { $regex: new RegExp(q, "i") };
        if (brand) condition.brandName = { $regex: new RegExp(brand, "i") };

        const { limit, offset } = require("../../utils/utils").getPagination(page, size);
        const data = await this.getAdminProducts({ condition, limit, offset, sortKey, sortDir, stock, minPrice, maxPrice, room });

        return res.status(200).json({
          message: "Lấy danh sách sản phẩm thành công",
          data: data.products,
          total: data.total,
          totalPages: Math.ceil(data.total / limit),
        });
      } catch (err) {
        return res.status(500).json({ message: "Lỗi server: " + err.message, data: null });
      }
  }

  async apiGetProductDetail(req, res) {
      try {
        const data = await this.getProductDetail(req.params.id);
        if (!data) return res.status(404).json({ message: "Không tìm thấy sản phẩm", data: null });
        return res.status(200).json({ message: "Lấy thông tin thành công", data });
      } catch (err) {
        return res.status(500).json({ message: "Lỗi server: " + err.message, data: null });
      }
  }

  async apiCreateProduct(req, res) {
      try {
        const newProductInfo = await this.createFullProduct(req.body);
        return res.status(201).json({ message: "Tạo sản phẩm thành công", data: newProductInfo });
      } catch (err) {
        return res.status(500).json({ message: "Lỗi tạo sản phẩm: " + err.message, data: null });
      }
  }

  async apiUpdateProduct(req, res) {
      try {
        const updatedProduct = await this.updateFullProduct(req.params.id, req.body);
        return res.status(200).json({ message: "Cập nhật sản phẩm thành công", data: updatedProduct });
      } catch (err) {
        return res.status(500).json({ message: "Lỗi cập nhật sản phẩm: " + err.message, data: null });
      }
  }

  async apiDeleteProduct(req, res) {
      try {
        await this.deleteProduct(req.params.id);
        return res.status(200).json({ message: "Xoá sản phẩm thành công", data: true });
      } catch (err) {
        return res.status(500).json({ message: "Lỗi xoá sản phẩm: " + err.message, data: null });
      }
  }

}
module.exports = new ProductController();
