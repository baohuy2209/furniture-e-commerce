const Voucher = require("../models/voucher.model");
const { getPagination } = require("../../utils/utils");

class VoucherController {
  // GET /api/admin/vouchers
  async apiGetVouchers(req, res) {
    console.log("[VOUCHER] Fetching list with query:", JSON.stringify(req.query));
    try {
      const { page, size, q, status, type, sortKey, sortDir } = req.query;
      const { limit, offset } = getPagination(page, size);
      
      let sort = { createdAt: -1 };
      if (sortKey) {
        sort = { [sortKey]: sortDir === 'desc' ? -1 : 1 };
      }

      console.log(`[VOUCHER] Calculated limit: ${limit}, offset: ${offset}, sort:`, sort);

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
        sort,
      });

      console.log(`[VOUCHER] Paginate result: totalDocs=${data.totalDocs}, docsCount=${data.docs.length}, page=${data.page}, totalPages=${data.totalPages}`);

      // Calculate summary for dashboard
      const allVouchers = await Voucher.find({});
      const now = new Date();
      const summary = {
        activeCount: allVouchers.filter(v => {
          const start = new Date(v.start_date);
          const end = new Date(v.end_date);
          return v.status === 'active' && now >= start && now <= end;
        }).length,
        pausedCount: allVouchers.filter(v => v.status === 'paused').length,
        expiredCount: allVouchers.filter(v => {
          const end = new Date(v.end_date);
          return now > end;
        }).length,
        pendingCount: allVouchers.filter(v => {
          const start = new Date(v.start_date);
          return v.status !== 'paused' && now < start;
        }).length,
      };

      return res.status(200).json({
        message: "Lấy danh sách thành công",
        data: {
          vouchers: data.docs,
          totalItems: data.totalDocs,
          totalPages: data.totalPages,
          currentPage: data.page,
          summary,
        },
      });
    } catch (error) {
      console.error("[VOUCHER] Fetch error:", error);
      return res.status(500).json({
        message: "Lỗi Server khi lấy danh sách Voucher",
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
    console.log("[VOUCHER] Request to create voucher:", JSON.stringify(req.body, null, 2));
    try {
      const { code, voucher_name, value, start_date, end_date } = req.body;

      // Basic validation
      if (!code || !voucher_name || value === undefined || !start_date || !end_date) {
        console.error("[VOUCHER] Missing required fields");
        return res.status(400).json({
          message: "Thiếu thông tin bắt buộc (Mã, Tên, Giá trị, Ngày bắt đầu/kết thúc)",
        });
      }

      // Check unique code manually to give better error
      const existing = await Voucher.findOne({ code: code.toUpperCase() });
      if (existing) {
        console.error("[VOUCHER] Code already exists:", code);
        return res.status(400).json({
          message: `Mã Voucher "${code}" đã tồn tại trong hệ thống.`,
        });
      }

      const voucherData = {
        ...req.body,
        code: code.toUpperCase(),
      };

      const newVoucher = new Voucher(voucherData);
      const saved = await newVoucher.save();
      console.log("[VOUCHER] Saved successfully! _id:", saved._id);

      return res.status(201).json({
        message: "Tạo Voucher thành công",
        data: saved,
      });
    } catch (error) {
      console.error("[VOUCHER] Internal Create Error:", error);
      return res.status(500).json({
        message: "Lỗi Server khi tạo Voucher",
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

      voucher.status = voucher.status === "paused" ? "active" : "paused";
      await voucher.save();

      return res.status(200).json({
        message: `Đã ${voucher.status === "active" ? "kích hoạt" : "tạm dừng"} Voucher`,
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
