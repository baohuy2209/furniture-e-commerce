const Order = require("../app/models/order.model");
const OrderItem = require("../app/models/orderItem.model");
const OrderItemShipping = require("../app/models/orderItemShipping.model");
const Payment = require("../app/models/payment.model");
const Cart = require("../app/models/cart.model");
const CartItem = require("../app/models/cartItem.model");
const ProductVariant = require("../app/models/productVariant.model");
const Product = require("../app/models/product.model");
const User = require("../app/models/user.model");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { formatVND } = require("../utils/utils");
const UserAddress = require("../app/models/userAddress.model");
class OrderService {
  async checkout(userId, checkoutData) {
    const { address_id, shipping_method, shipping_fee, payment_method, note } =
      checkoutData;

    const cart = await Cart.findOne({ user_id: userId, cart_status: "active" });
    if (!cart || cart.total_item === 0) throw new Error("Giỏ hàng trống");

    const cartItems = await CartItem.find({ cart_id: cart._id }).populate({
      path: "product_variant_id",
      populate: { path: "product" },
    });

    // Tính toán lại tổng cộng
    let before_total = 0;
    let discount_total = 0;

    for (let item of cartItems) {
      before_total += item.price * item.quantity;
      const itemDiscount =
        item.price * (item.discount_percent / 100) * item.quantity;
      discount_total += itemDiscount;
    }
    const total_amount = before_total - discount_total + shipping_fee;

    const orderNumber =
      "ORD-" + Date.now().toString() + "-" + Math.floor(Math.random() * 1000);

    const order = await Order.create({
      user_id: userId,
      order_number: orderNumber,
      status: "uncompleted",
      total_items: cart.total_item,
      before_total,
      discount_total,
      total_shipping_fee: shipping_fee,
      total_amount,
      payment_status: "unpaid",
      note,
    });

    let isFirst = true;
    for (let item of cartItems) {
      const variant = item.product_variant_id;
      const orderItem = await OrderItem.create({
        order_id: order._id,
        product_variant_id: variant._id,
        product_name: variant.product?.product_name || "Sản phẩm",
        unit_price: item.price,
        quantity: item.quantity,
        discount_percent: item.discount_percent,
        item_subtotal: item.subtotal,
        status: "pending",
      });

      const itemShippingFee = isFirst ? shipping_fee : 0; // Gom hết shipping fee vào item đầu tiên

      const orderItemShipping = await OrderItemShipping.create({
        order_item_id: orderItem._id,
        address_id,
        shipping_method: shipping_method || "STANDARD_DELIVERY",
        shipping_fee: itemShippingFee,
        estimate_delivery: "3-5 ngày",
      });

      await Payment.create({
        order_item_shipping_id: orderItemShipping._id,
        payment_method: payment_method || "cod",
        status: "pending",
      });

      isFirst = false;
    }

    // Xóa giỏ hàng
    await CartItem.deleteMany({ cart_id: cart._id });
    await Cart.findByIdAndUpdate(cart._id, { total_item: 0, total_amount: 0 });

    return order;
  }
  async checkoutWithoutLogin(
    userId,
    product_variant_id,
    quantity,
    address_id,
    shipping_fee,
    note,
  ) {
    const userInfo = await User.findById({ _id: userId });
    const addressInfo = await UserAddress.findOne({
      _id: address_id,
      user: userId,
    });
    const productVariant = await ProductVariant.findById({
      _id: product_variant_id,
    });
    if (!productVariant) {
      return { errorMessage: "Không tìm thấy sản phẩm cần đặt hàng" };
    }
    const productInfo = await Product.findById({ _id: productVariant.product });
    const before_total = quantity * productVariant.price;
    const discount_total =
      (quantity * productVariant.price * productInfo.discount_percent) / 100;
    const total_amount =
      before_total - discount_total + shipping_fee * quantity;
    const orderNumber =
      "ORD-" + Date.now().toString() + "-" + Math.floor(Math.random() * 1000);

    const order = await Order.create({
      user_id: userId,
      order_number: orderNumber,
      status: "uncompleted",
      total_items: quantity,
      before_total,
      discount_total,
      total_shipping_fee: shipping_fee * quantity,
      total_amount,
      payment_status: "unpaid",
      note,
    });
    const orderItem = await OrderItem.create({
      order_id: order._id,
      product_variant_id: product_variant_id,
      product_name: productInfo.product_name || "Sản phẩm",
      unit_price: productVariant.price,
      quantity: quantity,
      discount_percent: productInfo.discount_percent,
      item_subtotal: total_amount,
      status: "pending",
    });

    const orderItemShipping = await OrderItemShipping.create({
      order_item_id: orderItem._id,
      address_id,
      shipping_method: "STANDARD_DELIVERY",
      shipping_fee: shipping_fee * quantity,
      estimate_delivery: "7-16 ngày",
    });

    const payment = await Payment.create({
      order_item_shipping_id: orderItemShipping._id,
      payment_method: "cod",
      status: "pending",
    });
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    let html = fs.readFileSync(
      path.join(__dirname, "../templates/order-email-template.html"),
      "utf8",
    );

    // Thay placeholder
    html = html
      .replace("{{order_number}}", order.order_number)
      .replace(
        "{{order_date}}",
        new Date(order.createdAt).toLocaleDateString("vi-VN"),
      )
      .replace("{{product_name}}", orderItem.product_name)
      .replace("{{quantity}}", orderItem.quantity)
      .replace("{{unit_price}}", formatVND(orderItem.unit_price))
      .replace("{{item_subtotal}}", formatVND(orderItem.item_subtotal))
      .replace("{{discount_percent}}", orderItem.discount_percent + "%")
      .replace("{{before_total}}", formatVND(order.before_total))
      .replace("{{discount_total}}", formatVND(order.discount_total))
      .replace("{{total_shipping_fee}}", formatVND(order.total_shipping_fee))
      .replace("{{total_amount}}", formatVND(order.total_amount))
      .replace("{{shipping_method}}", orderItemShipping.shipping_method)
      .replace("{{estimate_delivery}}", orderItemShipping.estimate_delivery)
      .replace("{{payment_method}}", payment.payment_method.toUpperCase())
      .replace("{{note}}", order.note || "")
      .replace("{{order_detail_url}}", `https://homebase.vn/settings/my-orders`)
      .replace("{{customer_name}}", userInfo.name)
      .replace("{{customer_phone}}", userInfo.phone)
      .replace("{{address_detail}}", addressInfo.address_detail)
      .replace("{{ward}}", addressInfo.ward)
      .replace("{{province}}", addressInfo.province);

    const mailOptions = {
      from: process.env.EMAIL_SERVICE,
      to: userInfo.email,
      subject: `Thông tin đơn hàng của khách hàng ${userInfo.name}`,
      html,
    };
    await transporter.sendMail(mailOptions);
    return {
      dataOrder: {
        order,
        orderItem,
        payment,
        orderItemShipping,
      },
      errorMessage: "Tạo thành công đơn hàng",
    };
  }
  async getUserOrders(userId) {
    return await Order.find({ user_id: userId }).sort({ createdAt: -1 });
  }

  async getOrderDetails(orderId, userId = null) {
    const query = { _id: orderId };
    if (userId) query.user_id = userId;

    const order = await Order.findOne(query);
    if (!order) throw new Error("Không tìm thấy đơn hàng");

    const items = await OrderItem.find({ order_id: orderId });
    const detailedItems = [];

    for (let item of items) {
      const shipping = await OrderItemShipping.findOne({
        order_item_id: item._id,
      });
      let payment = null;
      if (shipping) {
        payment = await Payment.findOne({
          order_item_shipping_id: shipping._id,
        });
      }
      detailedItems.push({
        item,
        shipping,
        payment,
      });
    }

    return { order, items: detailedItems };
  }

  async cancelOrder(userId, orderId, cancel_reason) {
    const order = await Order.findOne({ _id: orderId, user_id: userId });
    if (!order) throw new Error("Không tìm thấy đơn hàng của bạn");

    if (order.status === "completed") {
      throw new Error("Không thể hủy đơn hàng đã hoàn thành");
    }

    order.status = "completed";
    order.completed_at = new Date();
    order.cancel_reason = cancel_reason || "Người dùng hủy";
    await order.save();

    await OrderItem.updateMany(
      { order_id: order._id },
      { status: "cancelled" },
    );

    return order;
  }

  // API dành cho Admin
  async getAllOrders() {
    return await Order.find()
      .populate("user_id", "name email")
      .sort({ createdAt: -1 });
  }

  async updateOrderItemStatus(orderItemId, status) {
    const item = await OrderItem.findById(orderItemId);
    if (!item) throw new Error("Không tìm thấy sản phẩm trong đơn");

    item.status = status;
    await item.save();

    // Check if we should mark Order as completed
    const order = await Order.findById(item.order_id);
    if (order) {
      const allItems = await OrderItem.find({ order_id: order._id });
      const isAllDone = allItems.every((i) =>
        ["delivered", "cancelled", "returned"].includes(i.status),
      );
      if (isAllDone && order.status !== "completed") {
        order.status = "completed";
        order.completed_at = new Date();
        await order.save();
      }
    }
    return item;
  }

  async updatePaymentStatus(paymentId, status) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error("Không tìm thấy giao dịch thanh toán");

    payment.status = status;
    if (status === "completed") {
      payment.paid_at = new Date();
    }
    await payment.save();

    // Check if we should mark Order as paid
    const orderItemShipping = await OrderItemShipping.findById(
      payment.order_item_shipping_id,
    );
    if (orderItemShipping) {
      const orderItem = await OrderItem.findById(
        orderItemShipping.order_item_id,
      );
      if (orderItem) {
        const relatedItems = await OrderItem.find({
          order_id: orderItem.order_id,
        });
        const relatedShippings = await OrderItemShipping.find({
          order_item_id: { $in: relatedItems.map((i) => i._id) },
        });
        const allPayments = await Payment.find({
          order_item_shipping_id: { $in: relatedShippings.map((s) => s._id) },
        });

        const isAllPaid = allPayments.every((p) => p.status === "completed");
        if (isAllPaid) {
          await Order.findByIdAndUpdate(orderItem.order_id, {
            payment_status: "paid",
          });
        }
      }
    }
    return payment;
  }
}

module.exports = new OrderService();
