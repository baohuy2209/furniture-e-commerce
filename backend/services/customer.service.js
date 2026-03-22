const User = require("../app/models/user.model");
const Order = require("../app/models/order.model");
const PointHistory = require("../app/models/pointHistory.model");
const UserAddress = require("../app/models/userAddress.model");
const mongoose = require("mongoose");

class CustomerService {
  async getCustomerStats() {
    const totalCustomers = await User.countDocuments();
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });
    
    const lockedAccounts = await User.countDocuments({ status: "locked" });
    
    return {
      totalCustomers,
      newThisMonth,
      lockedAccounts
    };
  }

  async getCustomers(query) {
    const { page = 1, limit = 10, search = "", status = "", sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;

    const matchStage = {};
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } }
      ];
    }
    if (status) {
      matchStage.status = status;
    }

    const aggregation = [
      { $match: matchStage },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "user_id",
          as: "orders"
        }
      },
      {
        $addFields: {
          orderCount: { $size: "$orders" },
          totalSpent: { $sum: "$orders.total_amount" }
        }
      },
      { $project: { password_hash: 0, orders: 0, reset_password_token: 0, verification_token: 0 } },
      { $sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    const customers = await User.aggregate(aggregation);
    const total = await User.countDocuments(matchStage);

    return {
      customers,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    };
  }

  async getCustomerDetails(id) {
    const user = await User.findById(id).select("-password_hash").lean();
    if (!user) throw new Error("Không tìm thấy khách hàng");

    const defaultAddress = await UserAddress.findOne({ user: id, is_default: true });
    
    const recentOrders = await Order.find({ user_id: id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Summary stats
    const orderStats = await Order.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$total_amount" }
        }
      }
    ]);

    const stats = orderStats[0] || { orderCount: 0, totalSpent: 0 };

    return {
      ...user,
      address: defaultAddress,
      recentOrders,
      stats
    };
  }

  async getCustomerOrders(id) {
    return await Order.find({ user_id: id }).sort({ createdAt: -1 });
  }

  async getCustomerPointsHistory(id) {
    return await PointHistory.find({ user_id: id }).sort({ createdAt: -1 });
  }

  async updateCustomerStatus(id, status) {
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) throw new Error("Không tìm thấy khách hàng");
    return user;
  }
}

module.exports = new CustomerService();
