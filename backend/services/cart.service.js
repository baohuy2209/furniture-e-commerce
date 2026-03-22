const Cart = require("../app/models/cart.model");
const CartItem = require("../app/models/cartItem.model");
const ProductVariant = require("../app/models/productVariant.model");

class CartService {
  async getCart(userId) {
    let cart = await Cart.findOne({ user_id: userId, cart_status: "active" });
    if (!cart) {
      cart = await Cart.create({
        user_id: userId,
        cart_status: "active",
        total_item: 0,
        total_amount: 0,
      });
    }
    const cartItems = await CartItem.find({ cart_id: cart._id })
      .populate({
        path: "product_variant_id",
        populate: { path: "product" },
      })
      .sort({ createdAt: -1 });

    return { cart, cartItems };
  }

  async calculateCart(cartId) {
    const items = await CartItem.find({ cart_id: cartId });
    let total_item = 0;
    let total_amount = 0;
    for (let item of items) {
      total_item += item.quantity;
      total_amount += item.subtotal;
    }
    await Cart.findByIdAndUpdate(cartId, { total_item, total_amount });
  }

  async addToCart(userId, variantId, quantity) {
    let cart = await Cart.findOne({ user_id: userId, cart_status: "active" });
    if (!cart) {
      cart = await Cart.create({
        user_id: userId,
        cart_status: "active",
        total_item: 0,
        total_amount: 0,
      });
    }

    const variant =
      await ProductVariant.findById(variantId).populate("product");
    if (!variant) throw new Error("Không tìm thấy mẫu sản phẩm");

    const price = variant.price || 0;
    const discount_percent = variant.product?.discount_percent || 0;
    const discounted_price = Math.round(price * (1 - discount_percent / 100));

    let cartItem = await CartItem.findOne({
      cart_id: cart._id,
      product_variant_id: variantId,
    });

    if (cartItem) {
      cartItem.quantity += quantity;
      cartItem.subtotal = cartItem.quantity * discounted_price;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cart_id: cart._id,
        product_variant_id: variantId,
        quantity,
        price,
        discount_percent,
        subtotal: quantity * discounted_price,
      });
    }

    await this.calculateCart(cart._id);
    return cartItem;
  }

  async updateQuantity(userId, itemId, quantity) {
    const cart = await Cart.findOne({ user_id: userId, cart_status: "active" });
    if (!cart) throw new Error("Không tìm thấy giỏ hàng");

    const cartItem = await CartItem.findOne({
      _id: itemId,
      cart_id: cart._id,
    });
    if (!cartItem) throw new Error("Không tìm thấy sản phẩm trong giỏ");

    if (quantity <= 0) {
      await CartItem.findByIdAndDelete(itemId);
    } else {
      const discounted_price =
        cartItem.price * (1 - cartItem.discount_percent / 100);
      cartItem.quantity = quantity;
      cartItem.subtotal = quantity * discounted_price;
      await cartItem.save();
    }

    await this.calculateCart(cart._id);
    return true;
  }

  async removeItem(userId, itemId) {
    const cart = await Cart.findOne({ user_id: userId, cart_status: "active" });
    if (!cart) throw new Error("Không tìm thấy giỏ hàng");

    await CartItem.findOneAndDelete({ _id: itemId, cart_id: cart._id });
    await this.calculateCart(cart._id);
    return true;
  }

  async clearCart(userId) {
    const cart = await Cart.findOne({ user_id: userId, cart_status: "active" });
    if (!cart) throw new Error("Không tìm thấy giỏ hàng");

    await CartItem.deleteMany({ cart_id: cart._id });
    await this.calculateCart(cart._id);
    return true;
  }
}

module.exports = new CartService();
