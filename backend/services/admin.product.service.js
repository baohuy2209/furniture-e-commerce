const Product = require("../app/models/product.model");
const ProductVariant = require("../app/models/productVariant.model");
const ProductVariantImage = require("../app/models/productVariantImage.model");

class AdminProductService {
  async getAdminProducts({
    condition,
    limit,
    offset,
    sortKey,
    sortDir,
    stock,
    minPrice,
    maxPrice,
    room,
  }) {
    // Basic filtering
    let products = await Product.find(condition)
      .skip(offset)
      .limit(limit)
      .lean();
    let total = await Product.countDocuments(condition);

    // If there is complex sorting or filtering based on variant data (stock, price),
    // it ideally requires aggregation pipeline. But for simplicity and to match the mock behavior,
    // we fetch variants for all these products and format data.
    const productIds = products.map((p) => p._id);
    const variants = await ProductVariant.find({
      product: { $in: productIds },
    }).lean();
    const images = await ProductVariantImage.find({
      product_variant: { $in: variants.map((v) => v._id) },
    }).lean();

    // Attach mapped details
    let formattedProducts = products.map((p) => {
      const pVariants = variants.filter(
        (v) => v.product.toString() === p._id.toString(),
      );
      const pImages = pVariants.flatMap((v) =>
        images.filter(
          (img) => img.product_variant.toString() === v._id.toString(),
        ),
      );

      return {
        product_id: p._id,
        product_name: p.product_name || p.title,
        brand_name: p.brand || "", // Assume string brand for now mappings
        description: p.description || "",
        discount_percent: p.discount_percent || 0,
        is_assembly: p.is_assembly || false,
        warranty: p.warranty || 12,
        tags: ["furniture", "decor"], // Mock tags until parsed
        product_component: p.product_component || {},
        image_url: p.image_url || [],
        variants: pVariants.map((v) => ({
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
        images: pImages.map((img) => ({
          product_varant_id: img.product_variant,
          url: img.url,
          is_main: img.is_main || false,
          position: img.position || 0,
        })),
      };
    });

    return { products: formattedProducts, total };
  }

  async getProductDetail(id) {
    const product = await Product.findById(id).lean();
    if (!product) return null;

    const variants = await ProductVariant.find({ product: id }).lean();
    const images = await ProductVariantImage.find({
      product_variant: { $in: variants.map((v) => v._id) },
    }).lean();

    // Map to FE format
    const pVariants = variants.map((v) => ({
      ...v,
      product_varant_id: v._id,
      product_id: product._id,
    }));
    const pImages = images.map((img) => ({
      ...img,
      product_varant_id: img.product_variant,
    }));

    return {
      product: {
        ...product,
        product_id: product._id,
        brand_name: product.brand,
      },
      variants: pVariants,
      images: pImages,
    };
  }

  async createFullProduct(payload) {
    try {
      const { editForm, editVariants } = payload;

      const newProduct = new Product({
        product_name: editForm.product_name,
        brand: editForm.brand_name,
        discount_percent: Number(editForm.discount_percent) || 0,
        warranty:
          parseInt(String(editForm.warranty || 0).replace(/\D/g, "")) || 0,
        is_assembly: !!editForm.is_assembly,
        description: editForm.description,
        image_url: editForm.product_main_image
          ? [editForm.product_main_image]
          : editForm.image_url || [],
      });
      await newProduct.save();

      for (const ev of editVariants || []) {
        const skuPart = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();
        const kvObject = {};
        (ev.componentEntries || []).forEach((e) => {
          if (e.key) kvObject[e.key] = e.value;
        });

        const mObject = {};
        (ev.measurementEntries || []).forEach((e) => {
          if (e.key) mObject[e.key] = e.value;
        });

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
          const imgUrl =
            typeof vImages[i] === "object" ? vImages[i].url : vImages[i];
          if (!imgUrl) continue;
          const vImg = new ProductVariantImage({
            product_variant: variant._id,
            url: imgUrl,
            position: i,
            is_main: i === 0,
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

      product.product_name = editForm.product_name;
      product.brand = editForm.brand_name;
      product.discount_percent = Number(editForm.discount_percent) || 0;
      product.warranty =
        parseInt(String(editForm.warranty || 0).replace(/\D/g, "")) || 0;
      product.is_assembly = !!editForm.is_assembly;
      product.description = editForm.description;
      if (editForm.product_main_image) {
        product.image_url = [editForm.product_main_image];
      }
      await product.save();

      // Clean sync for variants
      const oldVariants = await ProductVariant.find({ product: productId });
      const oldVariantIds = oldVariants.map((v) => v._id);
      await ProductVariantImage.deleteMany({
        product_variant: { $in: oldVariantIds },
      });
      await ProductVariant.deleteMany({ product: productId });

      for (const ev of editVariants || []) {
        const skuPart = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();
        const kvObject = {};
        (ev.componentEntries || []).forEach((e) => {
          if (e.key) kvObject[e.key] = e.value;
        });

        const mObject = {};
        (ev.measurementEntries || []).forEach((e) => {
          if (e.key) mObject[e.key] = e.value;
        });

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
          const imgUrl =
            typeof vImages[i] === "object" ? vImages[i].url : vImages[i];
          if (!imgUrl) continue;
          const vImg = new ProductVariantImage({
            product_variant: variant._id,
            url: imgUrl,
            position: i,
            is_main: i === 0,
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
      console.error("ADMIN SERVICE DELETE ERROR:", e);
      return { message: "e" + e.message, data: null };
    } finally {
      console.log("Completed");
    }
  }
}

module.exports = new AdminProductService();
