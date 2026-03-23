const StockMovement = require("../models/stockMovement.model");
const StockItem = require("../models/stockItem.model");
const ProductVariant = require("../models/productVariant.model");

class StockMovementController {
  // [GET] /api/stock-movements
  async getAllMovements(req, res) {
    try {
      const movements = await StockMovement.find({})
        .populate("warehouse_id")
        .populate("product_variant_id");
      return res.status(200).json({
        message: "Lấy lịch sử biến động kho thành công",
        data: movements,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  }

  // [POST] /api/stock-movements
  async createMovement(req, res) {
    try {
      const {
        warehouse_id,
        product_id,
        reference_id,
        reference_type,
        quantity_change,
        reason,
      } = req.body;

      if (
        !warehouse_id ||
        !product_variant_id ||
        quantity_change === undefined
      ) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      }

      // 1. Create the Movement record
      const movement = new StockMovement({
        warehouse_id,
        product_variant_id,
        reference_type,
        quantity_change,
        reason,
      });

      // 2. Update StockItem (Automatic deduction/addition)
      let stockItem = await StockItem.findOne({
        warehouse_id,
        product_variant_id: product_variant_id,
      });

      if (!stockItem) {
        // If it's a "xuất" (negative change) and no stock exists, maybe error out?
        if (quantity_change < 0) {
          return res.status(400).json({ message: "Không có tồn kho để xuất" });
        }
        // Otherwise create one
        stockItem = new StockItem({
          warehouse_id,
          product_variant_id: product_variant_id,
          quantity_on_hand: 0,
        });
      }

      // Check for insufficient stock if exporting
      if (stockItem.quantity_on_hand + quantity_change < 0) {
        return res.status(400).json({ message: "Số lượng tồn kho không đủ" });
      }

      stockItem.quantity_on_hand += quantity_change;

      // 3. Save both (Ideally in a transaction, but simple for now)
      await movement.save();
      await stockItem.save();

      // 4. Update ProductVariant internal counter (if exists/used)
      // This helps with quick listing of total inventory
      const variant = await ProductVariant.findById(product_variant_id);
      if (variant) {
        variant.num_inventory = (variant.num_inventory || 0) + quantity_change;
        await variant.save();
      }

      return res.status(201).json({
        message: "Cập nhật biến động kho thành công",
        data: movement,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Lỗi server", error: error.message });
    }
  }
}

module.exports = new StockMovementController();
