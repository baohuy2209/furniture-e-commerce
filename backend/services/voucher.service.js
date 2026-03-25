const Voucher = require("../app/models/voucher.model");
class VoucherService {
  async assignVoucherToUserAfterReview(user_id) {
    const now = new Date();

    // Tìm voucher active, còn hạn, còn lượt dùng
    const voucher = await Voucher.findOne({
      status: "active",
      user: null, // chưa gắn cho ai (voucher chung)
      start_date: { $lte: now },
      end_date: { $gte: now },
      $or: [
        { usage_limit: 0 }, // unlimited
        { $expr: { $lt: ["$used_count", "$usage_limit"] } }, // còn lượt
      ],
    });

    if (!voucher) return null;

    // Gắn user vào voucher
    return await Voucher.findByIdAndUpdate(
      voucher._id,
      { $set: { user: user_id } },
      { new: true },
    );
  }
}
module.exports = new VoucherService();
