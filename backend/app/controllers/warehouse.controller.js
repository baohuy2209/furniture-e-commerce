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
}

module.exports = new WarehouseController();
