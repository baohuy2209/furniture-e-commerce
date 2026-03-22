const adminProductService = require("../../services/admin.product.service");
const { getPagination } = require("../../utils/utils");

class AdminProductController {
  async listProducts(req, res) {
    try {
      const { page, size, q, stock, minPrice, maxPrice, sortKey, sortDir, room, brand } = req.query;
      const condition = {};

      if (q) {
        condition.product_name = { $regex: new RegExp(q, "i") };
      }
      if (brand) {
        condition.brandName = { $regex: new RegExp(brand, "i") }; // Assume string brand for now, OR fetch brand refs
      }

      const { limit, offset } = getPagination(page, size);
      const data = await adminProductService.getAdminProducts({ condition, limit, offset, sortKey, sortDir, stock, minPrice, maxPrice, room });

      return res.status(200).json({
        message: "Lấy danh sách sản phẩm thành công",
        data: data.products,
        total: data.total,
        totalPages: Math.ceil(data.total / limit),
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi server: " + err.message, data: null });
    }
  }

  async getProductDetail(req, res) {
    try {
      const { id } = req.params;
      const data = await adminProductService.getProductDetail(id);
      if (!data) return res.status(404).json({ message: "Không tìm thấy sản phẩm", data: null });
      return res.status(200).json({ message: "Lấy thông tin thành công", data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi server: " + err.message, data: null });
    }
  }

  async createProduct(req, res) {
    try {
      const payload = req.body;
      const newProductInfo = await adminProductService.createFullProduct(payload);
      return res.status(201).json({ message: "Tạo sản phẩm thành công", data: newProductInfo });
    } catch (err) {
      console.error("DEBUG CREATE PRODUCT ERROR:", err);
      return res.status(500).json({ message: "Lỗi tạo sản phẩm: " + err.message, data: null });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const updatedProduct = await adminProductService.updateFullProduct(id, payload);
      return res.status(200).json({ message: "Cập nhật sản phẩm thành công", data: updatedProduct });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi cập nhật sản phẩm: " + err.message, data: null });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      await adminProductService.deleteProduct(id);
      return res.status(200).json({ message: "Xoá sản phẩm thành công", data: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi xoá sản phẩm: " + err.message, data: null });
    }
  }
}

module.exports = new AdminProductController();
