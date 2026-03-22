const Voucher = require("../models/voucher.model");
const { getPagination } = require("../../utils/utils");

class VoucherController {
  // GET /api/admin/vouchers
  async apiGetVouchers(req, res) {
    console.log("[VOUCHER] Fetching list...", req.query);
    try {
      const { page, size, q, status, type } = req.query;
      const { limit, offset } = getPagination(page, size);

      let condition = {};
      if (q) {
        condition.$or = [
          { code: { $regex: new RegExp(q), $options: "i" } },
          { voucher_name: { $regex: new RegExp(q), $options: "i" } },
        ];
      }
      if (status) condition.status = status;
      if (type) condition.type = type;

      const data = await Voucher.paginate(condition, {
        offset,
        limit,
        sort: { createdAt: -1 },
      });

      // Calculate summary for dashboard
      const allVouchers = await Voucher.find({});
      const summary = {
        activeCount: allVouchers.filter(v => v.status === 'active').length,
        pausedCount: allVouchers.filter(v => v.status === 'paused').length,
        expiredCount: allVouchers.filter(v => v.status === 'expired').length,
        pendingCount: allVouchers.filter(v => v.status === 'pending').length,
      };

      return res.status(200).json({
        message: "Lấy danh sách Voucher thành công",
        data: {
          totalItems: data.totalDocs,
          vouchers: data.docs,
          totalPages: data.totalPages,
          currentPage: data.page,
          summary
        },
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }

  // GET /api/admin/vouchers/:id
  async apiGetVoucherDetail(req, res) {
    try {
      const voucher = await Voucher.findById(req.params.id);
      if (!voucher) {
        return res.status(404).json({ message: "Không tìm thấy Voucher" });
      }
      return res.status(200).json({
        message: "Lấy chi tiết Voucher thành công",
        data: voucher,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }

  // POST /api/admin/vouchers
  async apiCreateVoucher(req, res) {
    console.log("[VOUCHER] Creating new voucher...", req.body);
    try {
      const newVoucher = new Voucher(req.body);
      const saved = await newVoucher.save();
      console.log("[VOUCHER] Saved successfully:", saved._id);
      return res.status(201).json({
        message: "Tạo Voucher thành công",
        data: saved,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }

  // PUT /api/admin/vouchers/:id
  async apiUpdateVoucher(req, res) {
    try {
      const updated = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updated) {
        return res.status(404).json({ message: "Không tìm thấy Voucher" });
      }
      return res.status(200).json({
        message: "Cập nhật Voucher thành công",
        data: updated,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }

  // PATCH /api/admin/vouchers/:id/toggle
  async apiToggleVoucher(req, res) {
    try {
      const voucher = await Voucher.findById(req.params.id);
      if (!voucher) {
        return res.status(404).json({ message: "Không tìm thấy Voucher" });
      }
      
      voucher.status = voucher.status === 'paused' ? 'active' : 'paused';
      await voucher.save();

      return res.status(200).json({
        message: `Đã ${voucher.status === 'active' ? 'kích hoạt' : 'tạm dừng'} Voucher`,
        data: voucher,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }

  // DELETE /api/admin/vouchers/:id
  async apiDeleteVoucher(req, res) {
    try {
      const deleted = await Voucher.findByIdAndDelete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Không tìm thấy Voucher" });
      }
      return res.status(200).json({
        message: "Đã xóa Voucher thành công",
      });
    } catch (error) {
      return res.status(500).json({
        message: "Lỗi Server",
        error: error.message,
      });
    }
  }
}

module.exports = new VoucherController();
