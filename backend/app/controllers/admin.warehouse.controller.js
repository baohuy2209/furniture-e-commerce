const adminWarehouseService = require("../../services/admin.warehouse.service");

class AdminWarehouseController {
  async listWarehouses(req, res) {
    try {
      const data = await adminWarehouseService.getWarehouses();
      return res.status(200).json({ message: "Lấy danh sách kho thành công", data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi server: " + err.message });
    }
  }

  async listStockItems(req, res) {
    try {
      const data = await adminWarehouseService.getStockItems(req.query);
      const warehouses = await adminWarehouseService.getWarehouses();
      const movements = await adminWarehouseService.getMovements();
      const pos = await adminWarehouseService.getPurchaseOrders();

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
      console.error(err);
      return res.status(500).json({ message: "Lỗi server: " + err.message });
    }
  }

  async adjustStock(req, res) {
    try {
      const payload = req.body;
      const data = await adminWarehouseService.adjustStock(payload);
      return res.status(200).json({ message: "Điều chỉnh kho thành công", data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi điều chỉnh kho: " + err.message });
    }
  }

  async createPurchaseOrder(req, res) {
    try {
      const payload = req.body;
      const data = await adminWarehouseService.createPurchaseOrder(payload);
      return res.status(201).json({ message: "Nhập hàng thành công", data });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Lỗi tạo đơn nhập: " + err.message });
    }
  }
}

module.exports = new AdminWarehouseController();
