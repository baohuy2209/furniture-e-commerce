const Role = require("../app/models/role.model");
const User = require("../app/models/user.model");
const { generateUsernameFromEmail } = require("../utils/generateUsername");

class UserService {
  async createUser(email, name, phone) {
    try {
      const username = generateUsernameFromEmail(email);
      const user = new User({
        username,
        email,
        name,
        phone,
        authProvider: "guest",
      });
      await user.save();
      const userRoles = await Role.findOne({ name: "user" });
      user.roles = [userRoles._id];
      await user.save();
      return { message: "Tạo thành công thông tin người dùng", data: user };
    } catch (e) {
      console.log(e);
      return { message: "Có lỗi phía server" + e, data: null };
    }
  }
  async increasePointOnPrice(userId, price) {
    try {
      const userInfo = await User.findById({ _id: userId });
      if (!userInfo) {
        return {
          message: "Không tìm thấy người dùng",
          data: null,
        };
      }
      const currentPoint = userInfo.points;
      const increasePoint = Math.ceil(price / 10000000);
      userInfo.points = currentPoint + increasePoint;
      await userInfo.save();
      return {
        message: "Đã cộng thêm điểm cho khách hàng",
        data: userInfo,
      };
    } catch (e) {
      console.log(e);
      return { message: "Có lỗi phía server" + e, data: null };
    }
  }
}
module.exports = new UserService();
