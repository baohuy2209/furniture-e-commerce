const Order = require("../app/models/order.model");
const OrderItem = require("../app/models/orderItem.model");
const OrderItemShipping = require("../app/models/orderItemShipping.model");
const Payment = require("../app/models/payment.model");
const User = require("../app/models/user.model");
const Address = require("../app/models/userAddress.model");
const ProductVariantImage = require("../app/models/productVariantImage.model");

class OrderAdminService {
  async getStatistics() {
    const totalRevenue = await Order.aggregate([
      { $match: { payment_status: "paid" } },
      { $group: { _id: null, total: { $sum: "$total_amount" } } },
    ]);

    const pendingCount = await Order.countDocuments({
      status: { $in: ["pending", "confirmed", "packed"] },
    });

    const shippingCount = await Order.countDocuments({
      status: "shipping",
    });

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingCount,
      shippingCount,
    };
  }

  async getAllOrders(query = {}) {
    const {
      page = 1,
      limit = 10,
      q = "",
      status = "",
      payment_status = "",
      region = "",
    } = query;

    const skip = (page - 1) * limit;
    const filter = {};

    if (status) filter.status = status;
    if (payment_status) filter.payment_status = payment_status;

    // Search by order_number
    if (q) {
      filter.$or = [
        { order_number: { $regex: q, $options: "i" } },
      ];
    }

    // This is a simplified search. Real search might need populated fields or aggregation.
    // For now, let's get orders first.
    
    const orders = await Order.find(filter)
      .populate("user_id", "name email phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    // Populate Region (Province) for each order
    // Need to find address related to order items
    const ordersWithRegion = await Promise.all(
      orders.map(async (order) => {
        const orderItem = await OrderItem.findOne({ order_id: order._id });
        let regionText = "—";
        if (orderItem) {
          const shipping = await OrderItemShipping.findOne({ order_item_id: orderItem._id }).populate("address_id");
          if (shipping && shipping.address_id) {
            regionText = shipping.address_id.province;
          }
        }
        
        return {
          ...order.toObject(),
          order_id: order._id,
          customer: order.user_id?.name || "Khách vãng lai",
          phone: order.user_id?.phone || "—",
          email: order.user_id?.email || "—",
          region: regionText,
        };
      })
    );

    // Apply region filter manually if provided (since it's not a direct field)
    let finalOrders = ordersWithRegion;
    if (region) {
      finalOrders = ordersWithRegion.filter(o => o.region === region);
    }

    return {
      orders: finalOrders,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderDetail(id) {
    const order = await Order.findById(id).populate("user_id", "name email phone");
    if (!order) throw new Error("Không tìm thấy đơn hàng");

    const orderItems = await OrderItem.find({ order_id: id });
    const detailedItems = await Promise.all(
      orderItems.map(async (item) => {
        const shipping = await OrderItemShipping.findOne({ order_item_id: item._id }).populate("address_id");
        let payment = null;
        if (shipping) {
          payment = await Payment.findOne({ order_item_shipping_id: shipping._id });
        }
        
        // Fetch product image
        const img = await ProductVariantImage.findOne({ 
          product_variant: item.product_variant_id,
          is_main: true 
        });
        
        return {
          ...item.toObject(),
          order_item_id: item._id,
          product_image_url: img ? img.url : null,
          shipping,
          payment,
        };
      })
    );

    // Primary address (from first item shipping)
    const firstItemShipping = detailedItems[0]?.shipping;
    const address = firstItemShipping?.address_id || null;

    return {
      order: {
        ...order.toObject(),
        order_id: order._id,
      },
      items: detailedItems,
      address,
      user: order.user_id,
    };
  }

  async updateOrderNote(id, admin_note) {
    return await Order.findByIdAndUpdate(
      id,
      { admin_note },
      { new: true }
    );
  }

  async updateOrderStatus(id, status) {
    return await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }
}

module.exports = new OrderAdminService();
