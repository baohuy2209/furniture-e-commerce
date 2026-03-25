const StockItem = require("../app/models/stockItem.model");
class StockItemService {
  async createStockItem(
    product_variant_id,
    warehouse_id,
    quantity_on_hand,
    quantity_reserved,
  ) {
    let stockItem = await StockItem.findOne({
      product_variant_id,
      warehouse_id,
    });
    if (stockItem) {
      return {
        message: "Sản phẩn đã tồn kho ở kho này",
        data: null,
      };
    }
    stockItem = new StockItem({
      product_variant_id,
      warehouse_id,
      quantity_on_hand: quantity_on_hand || 0,
      quantity_reserved: quantity_reserved || 0,
    });
    await stockItem.save();
    return {
      message: "Tạo vật phẩm tồn kho thành công",
      data: stockItem,
    };
  }
  async getStockByVariant(product_variant_id) {
    return await StockItem.findOne({ product_variant_id });
  }
  // Nhập hàng - tăng quantity_on_hand
  async increaseStock(product_variant_id, quantity) {
    return await StockItem.findOneAndUpdate(
      { product_variant_id },
      { $inc: { quantity_on_hand: quantity } },
      { new: true, upsert: true }, // upsert: tạo mới nếu chưa có
    );
  }

  // Xuất hàng - giảm quantity_on_hand
  async decreaseStock(product_variant_id, quantity) {
    const stock = await StockItem.findOne({
      product_variant_id: product_variant_id,
      quantity_on_hand: { $gt: quantity },
    });
    console.log()

    if (!stock) throw new Error("Không tìm thấy tồn kho");

    return await StockItem.findOneAndUpdate(
      { product_variant_id },
      { $inc: { quantity_on_hand: -quantity } },
      { new: true },
    );
  }
  // Giữ hàng khi tạo đơn
  async reserveStock(product_variant_id, quantity) {
    const stock = await StockItem.findOne({ product_variant_id });

    if (!stock) throw new Error("Không tìm thấy tồn kho");

    const available = stock.quantity_on_hand - stock.quantity_reserved;
    if (available < quantity) throw new Error("Hàng không đủ để đặt");

    return await StockItem.findOneAndUpdate(
      { product_variant_id },
      { $inc: { quantity_reserved: quantity } },
      { new: true },
    );
  }

  // Xác nhận xuất hàng - trừ cả on_hand lẫn reserved
  async confirmStock(product_variant_id, quantity) {
    return await StockItem.findOneAndUpdate(
      { product_variant_id },
      {
        $inc: {
          quantity_on_hand: -quantity,
          quantity_reserved: -quantity,
        },
      },
      { new: true },
    );
  }

  // Hủy đơn - giải phóng reserved
  async releaseReservedStock(product_variant_id, quantity) {
    return await StockItem.findOneAndUpdate(
      { product_variant_id },
      { $inc: { quantity_reserved: -quantity } },
      { new: true },
    );
  }
}
module.exports = new StockItemService();
