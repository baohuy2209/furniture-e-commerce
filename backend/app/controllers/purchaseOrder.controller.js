const PurchaseOrder = require("../models/purchaseOrder.model");
const PurchaseOrderItem = require("../models/purchaseOrderItem.model");
const StockMovement = require("../models/stockMovement.model");
const StockItem = require("../models/stockItem.model");
const ProductVariant = require("../models/productVariant.model");
const mongoose = require("mongoose");

class PurchaseOrderController {
  // [GET] /api/admin/purchase-orders
  async getAllPurchaseOrders(req, res) {
    try {
      const pos = await PurchaseOrder.find().populate("brand_id").sort({ createdAt: -1 });
      
      // We need to count items for each PO to match frontend expectation
      const data = await Promise.all(pos.map(async (po) => {
        const itemCount = await PurchaseOrderItem.countDocuments({ po_id: po._id });
        return {
          po_id: po._id,
          po_number: `PO-${po._id.toString().slice(-6).toUpperCase()}`,
          brand_id: po.brand_id?._id,
          brand_name: po.brand_id?.brand_name || po.brand_id?.name || "N/A",
          status: po.po_status,
          item_count: itemCount,
          total_cost: po.total_amount,
          note: po.note,
          created_at: po.createdAt
        };
      }));

      return res.status(200).json({
        message: "Lấy danh sách phiếu nhập hàng thành công",
        data: data
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }

  // [GET] /api/admin/purchase-orders/:id
  async getPurchaseOrderDetail(req, res) {
    try {
      const po = await PurchaseOrder.findById(req.params.id).populate("brand_id");
      if (!po) return res.status(404).json({ message: "Không tìm thấy PO" });

      const items = await PurchaseOrderItem.find({ po_id: po._id }).populate("warehouse_id");
      
      return res.status(200).json({
        message: "Lấy chi tiết PO thành công",
        data: {
          purchaseOrder: po,
          items: items
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }

  // [POST] /api/admin/purchase-orders
  async createPurchaseOrder(req, res) {
    try {
      const { brand_id, note, items } = req.body;

      if (!items || items.length === 0) {
        throw new Error("PO phải có ít nhất một mặt hàng");
      }

      let totalAmount = 0;
      items.forEach(item => {
        totalAmount += item.quantity * item.unit_cost;
      });

      const newPO = new PurchaseOrder({
        brand_id,
        note,
        total_amount: totalAmount,
        po_status: "ordered" // Default to ordered per frontend flow
      });

      await newPO.save();

      const poItems = items.map(item => ({
        po_id: newPO._id,
        product_variant_id: item.product_variant_id || item.product_id, 
        warehouse_id: item.warehouse_id,
        product_name: item.product_name || "Sản phẩm",
        sku: item.sku,
        quantity_ordered: item.quantity,
        unit_cost: item.unit_cost,
        subtotal: item.quantity * item.unit_cost
      }));

      await PurchaseOrderItem.insertMany(poItems);

      return res.status(201).json({
        message: "Tạo PO thành công",
        data: newPO
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi tạo PO: " + error.message });
    }
  }

  // [PATCH] /api/admin/purchase-orders/:id/status
  async updatePOStatus(req, res) {
    try {
      const poId = req.params.id;
      const { status } = req.body;

      const po = await PurchaseOrder.findById(poId);
      if (!po) throw new Error("Không tìm thấy PO");

      if (po.po_status === "received") {
        throw new Error("PO đã được nhập kho, không thể thay đổi trạng thái");
      }

      const oldStatus = po.po_status;
      po.po_status = status;
      await po.save();

      // If status changes to received, update stock
      if (status === "received" && oldStatus !== "received") {
        const items = await PurchaseOrderItem.find({ po_id: poId });
        
        for (const item of items) {
          // 1. Find the variant to get its ID and current total inventory
          const variant = await ProductVariant.findOne({ sku: item.sku });
          if (!variant) {
              console.warn(`Variant with SKU ${item.sku} not found during PO receipt.`);
              continue;
          }

          // 2. Update/Create StockItem for this warehouse
          let stockItem = await StockItem.findOne({ 
            product_variant_id: variant._id, 
            warehouse_id: item.warehouse_id 
          });

          if (!stockItem) {
            stockItem = new StockItem({
              product_variant_id: variant._id,
              warehouse_id: item.warehouse_id,
              quantity_on_hand: item.quantity_ordered
            });
          } else {
            stockItem.quantity_on_hand += item.quantity_ordered;
          }
          await stockItem.save();

          // 3. Create StockMovement
          const movement = new StockMovement({
            warehouse_id: item.warehouse_id,
            product_variant_id: variant._id,
            reference_id: `PO-${po._id.toString().slice(-6).toUpperCase()}`,
            reference_type: "purchase_order",
            quantity_change: item.quantity_ordered,
            reason: `Nhập hàng từ PO #${item.po_id.toString().slice(-4)}`
          });
          await movement.save();

          // 4. Update total variant stock
          variant.num_inventory = (variant.num_inventory || 0) + item.quantity_ordered;
          await variant.save();
        }
      }

      return res.status(200).json({
        message: "Cập nhật trạng thái PO thành công",
        data: po
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi cập nhật PO: " + error.message });
    }
  }
}

module.exports = new PurchaseOrderController();
