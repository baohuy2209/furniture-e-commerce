const StockItem = require("../models/stockItem.model");
const StockMovement = require("../models/stockMovement.model");
const PurchaseOrder = require("../models/purchaseOrder.model");
const PurchaseOrderItem = require("../models/purchaseOrderItem.model");
const ProductVariant = require("../models/productVariant.model");
const Warehouse = require("../models/warehouse.model");
class WarehouseController {
  // [GET] /api/warehouse
  async getAllWarehouse(req, res) {
    try {
      const listWarehouse = await Warehouse.find();
      return res.status(200).json({
        message: "Load dữ liệu các nhà kho thành công",
        data: listWarehouse,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống " + e, data: null });
    }
  }
  // [GET] /api/warehouse/:id
  async getDetailWarehouse(req, res) {
    try {
      const warehouseId = req.params.id;
      const warehouseDetail = await Warehouse.findById(warehouseId);
      return res.status(200).json({
        messsage: "Load dữ liệu thành công",
        data: warehouseDetail,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [POST] /api/warehouse
  async createNewWarehouse(req, res) {
    try {
      const newWarehouse = new Warehouse({ ...req.body });
      await newWarehouse.save();
      return res.status(200).json({
        message: "Tạo ra nhà máy mới thành công thành công",
        data: newWarehouse,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [UPDATE] /api/warehouse/:id
  async updateInfoWarehouse(req, res) {
    try {
      const warehouseId = req.params.id;
      const updatedWarehouse = await Warehouse.findByIdAndUpdate(
        warehouseId,
        req.body,
      );
      if (!updatedWarehouse) {
        return res.status(404).json({
          message: "Không tìm thấy thông tin nhà máy nào",
          data: null,
        });
      }
      return res.status(200).json({
        message: "Đã cập nhật thành công loại sản phẩm",
        data: updatedWarehouse,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }
  // [DELETE] /api/warehosue/:id
  async deleteWarehouse(req, res) {
    try {
      const warehouseId = req.params.id;
      const deletedWarehouse = await Warehouse.findByIdAndDelete(warehouseId);
      return res.status(200).json({
        message: "Xóa dữ liệu thành công",
        data: deletedWarehouse,
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Lỗi hệ thống" + e, data: null });
    }
  }

  // ======== ADMIN WAREHOUSE OPERATIONS (inlined) ========
async getWarehouses() {
    const list = await Warehouse.find({});
    return list.map((w) => ({
      warehouse_id: w._id,
      name: w.name,
      address_warehouse: w.address_warehouse,
      warehouse_area: Number(w.warehouse_area) || 0,
      warehouse_status: w.warehouse_status === "active" ? 1 : 0,
      created_at: w.createdAt,
      updated_at: w.updatedAt,
    }));
  }

  async getStockItems(options = {}) {
    const { condition = {} } = options;
    const items = await StockItem.find(condition).populate({
      path: "product_variant_id",
      select: "sku",
    });

    const warehouses = await Warehouse.find({});
    const whMap = new Map(warehouses.map((w) => [String(w._id), w.name]));

    return items.map((s) => ({
      stock_item_id: s._id,
      product_variant_id: s.product_variant_id?._id || s.product_variant_id,
      warehouse_id: s.warehouse_id,
      quantity_on_hand: s.quantity_on_hand,
      quantity_reserved: s.quantity_reserved,
      reorder_point: 10, // Default or add to schema if missing
      created_at: s.createdAt,
      updated_at: s.updatedAt,
      // Helper fields for FE
      sku: s.product_variant_id?.sku || "N/A",
      warehouse_name: whMap.get(String(s.warehouse_id)) || "Unknown",
    }));
  }

  async getMovements(query = {}) {
    const list = await StockMovement.find(query).sort({ createdAt: -1 });
    return list.map((m) => ({
      movement_id: m._id,
      warehouse_id: m.warehouse_id,
      product_variant_id: m.product_id, // backend uses product_id as VariantRef
      reference_id: m.reference_id,
      reference_type: m.reference_type,
      quantity_changed: m.quantity_change,
      reason: m.reason,
      created_at: m.createdAt,
      updated_at: m.updatedAt,
    }));
  }

  async getPurchaseOrders() {
    const list = await PurchaseOrder.find({}).populate("brand_id").sort({ createdAt: -1 });
    return list.map((p) => ({
      po_id: p._id,
      po_number: "PO-" + String(p._id).slice(-6).toUpperCase(),
      brand_id: p.brand_id?._id,
      brand_name: p.brand_id?.name || "N/A",
      note: p.note || "",
      status: this.mapPOStatus(p.po_status),
      item_count: 0, // In detail only or aggregate
      total_cost: p.total_amount,
      created_at: p.createdAt,
    }));
  }

  async adjustStock(payload) {
    const { stock_item_id, warehouse_id, product_variant_id, quantity_changed, reason, reference_type } = payload;

    // Use StockItem _id or (WhID + VarID)
    let stock;
    if (stock_item_id) {
      stock = await StockItem.findById(stock_item_id);
    } else {
      stock = await StockItem.findOne({ warehouse_id, product_variant_id });
    }

    if (!stock) {
      // Create if not exists
      stock = new StockItem({
        warehouse_id,
        product_variant_id,
        quantity_on_hand: 0,
        quantity_reserved: 0,
      });
    }

    stock.quantity_on_hand += quantity_changed;
    await stock.save();

    const movement = new StockMovement({
      warehouse_id: stock.warehouse_id,
      product_id: stock.product_variant_id,
      reference_id: "MANUAL-" + Date.now(),
      reference_type: reference_type || "adjustment",
      quantity_change: quantity_changed,
      reason: reason || "Manual Adjustment",
    });
    await movement.save();

    return stock;
  }

  async createPurchaseOrder(payload) {
    const { brand_id, note, items } = payload;
    
    let total_amount = 0;
    (items || []).forEach(it => {
        total_amount += (it.quantity || 0) * (it.unit_cost || 0);
    });

    const po = new PurchaseOrder({
      brand_id,
      note,
      po_status: "received", // Assume instant completion for this simplified logic or "draft"
      total_amount,
    });
    await po.save();

    // Map items + Update stock
    for (const item of items) {
      const poi = new PurchaseOrderItem({
        purchase_order: po._id,
        product_variant: item.product_variant_id,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
      });
      await poi.save();

      // update stock
      await this.adjustStock({
         warehouse_id: item.warehouse_id,
         product_variant_id: item.product_variant_id,
         quantity_changed: item.quantity,
         reason: "Purchase Order " + po._id,
         reference_type: "purchase_order"
      });
    }

    return po;
  }

  mapPOStatus(dbStatus) {
    const map = {
      draft: "pending",
      ordered: "confirmed",
      received: "completed",
      cancelled: "cancelled",
    };
    return map[dbStatus] || "pending";
  }



  // API Wrappers for routing
  async apiGetStockItems(req, res) {
    try {
      const data = await this.getStockItems(req.query);
      const warehouses = await this.getWarehouses();
      const movements = await this.getMovements();
      const pos = await this.getPurchaseOrders();

      return res.status(200).json({
        message: "Lấy dữ liệu kho thành công",
        data: {
          stockItems: data,
          warehouses: warehouses,
          movements: movements,
          purchaseOrders: pos,
        },
      });
    } catch (err) {
      return res.status(500).json({ message: "Lỗi server: " + err.message });
    }
  }

  async apiAdjustStock(req, res) {
    try {
      const data = await this.adjustStock(req.body);
      return res.status(200).json({ message: "Điều chỉnh kho thành công", data });
    } catch (err) {
      return res.status(500).json({ message: "Lỗi điều chỉnh kho: " + err.message });
    }
  }

  async apiCreatePurchaseOrder(req, res) {
    try {
      const data = await this.createPurchaseOrder(req.body);
      return res.status(201).json({ message: "Nhập hàng thành công", data });
    } catch (err) {
      return res.status(500).json({ message: "Lỗi tạo đơn nhập: " + err.message });
    }
  }

}
module.exports = new WarehouseController();
