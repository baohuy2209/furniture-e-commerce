const Product = require("../models/product.model");
const User = require("../models/user.model");
const Brand = require("../models/brand.model");

class ReportController {
  async getSummary(req, res) {
    try {
      const productCount = await Product.countDocuments();
      const userCount = await User.countDocuments();
      const brandCount = await Brand.countDocuments();
      
      // We can also fetch some latest products or users to show in the table
      const latestProducts = await Product.find()
        .populate("brand", "brand_name")
        .sort({ _id: -1 })
        .limit(5);

      return res.status(200).json({
        success: true,
        data: {
          counts: {
            products: productCount,
            users: userCount,
            brands: brandCount,
          },
          latestProducts: latestProducts
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
module.exports = new ReportController();
