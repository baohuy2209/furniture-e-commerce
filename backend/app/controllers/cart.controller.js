const cartService = require("../../services/cart.service");

class CartController {
  // [GET] /api/cart
  async getCart(req, res) {
    try {
      const data = await cartService.getCart(req.userId);
      return res.status(200).json({ message: "Lấy giỏ hàng thành công", data });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }

  // [POST] /api/cart/add
  async addToCart(req, res) {
    try {
      const { product_variant_id, quantity } = req.body;
      if (!product_variant_id || !quantity || quantity <= 0) {
        return res
          .status(400)
          .json({ message: "Dữ liệu không hợp lệ", data: null });
      }
      const data = await cartService.addToCart(
        req.userId,
        product_variant_id,
        quantity,
      );
      return res
        .status(200)
        .json({ message: "Thêm sản phẩm vào giỏ hàng thành công", data });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }

  // [PUT] /api/cart/update
  async updateQuantity(req, res) {
    try {
      const { item_id, quantity } = req.body;
      if (!item_id || quantity === undefined || quantity < 0) {
        return res
          .status(400)
          .json({ message: "Dữ liệu không hợp lệ", data: null });
      }
      console.log(req.body);
      await cartService.updateQuantity(req.userId, item_id, quantity);
      return res
        .status(200)
        .json({ message: "Cập nhật giỏ hàng thành công", data: null });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }

  // [DELETE] /api/cart/remove/:itemId
  async removeItem(req, res) {
    try {
      const { itemId } = req.params;
      await cartService.removeItem(req.userId, itemId);
      return res
        .status(200)
        .json({ message: "Xóa sản phẩm khỏi giỏ hàng thành công", data: null });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }

  // [DELETE] /api/cart/clear
  async clearCart(req, res) {
    try {
      await cartService.clearCart(req.userId);
      return res
        .status(200)
        .json({ message: "Xóa toàn bộ giỏ hàng thành công", data: null });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Lỗi server: " + error.message, data: null });
    }
  }
}

module.exports = new CartController();
