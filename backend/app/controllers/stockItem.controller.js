const StockItem = require("../models/stockItem.model");

class StockItemController {
  // [GET] /api/stock-items
  async getAllStockItems(req, res) {
    try {
      const stockItems = await StockItem.find({})
        .populate("product_variant_id")
        .populate("warehouse_id");
      return res.status(200).json({
        message: "Lấy dữ liệu tồn kho thành công",
        data: stockItems,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  }

  // [GET] /api/stock-items/:id
  async getStockItemById(req, res) {
    try {
      const stockItem = await StockItem.findById(req.params.id)
        .populate("product_variant_id")
        .populate("warehouse_id");
      if (!stockItem) {
        return res
          .status(404)
          .json({ message: "Không tìm thấy vật phẩm tồn kho" });
      }
      return res.status(200).json({
        message: "Lấy dữ liệu thành công",
        data: stockItem,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  }

  // [POST] /api/stock-items
  async createStockItem(req, res) {
    try {
      const {
        product_variant_id,
        warehouse_id,
        quantity_on_hand,
        quantity_reserved,
      } = req.body;

      // Check if already exists
      let stockItem = await StockItem.findOne({
        product_variant_id,
        warehouse_id,
      });
      if (stockItem) {
        return res
          .status(400)
          .json({ message: "Vật phẩm tồn kho đã tồn tại ở kho này" });
      }

      stockItem = new StockItem({
        product_variant_id,
        warehouse_id,
        quantity_on_hand: quantity_on_hand || 0,
        quantity_reserved: quantity_reserved || 0,
      });

      await stockItem.save();
      return res.status(201).json({
        message: "Tạo vật phẩm tồn kho thành công",
        data: stockItem,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  }
}

module.exports = new StockItemController();
