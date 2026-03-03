const User = require("../app/models/user.model");
const Role = require("../app/models/role.model");
const Session = require("../app/models/session.model");
const bcrypt = require("bcrypt");
const { generateUsernameFromEmail } = require("../utils/generateUsername");
const saltRounds = 10;
const jwt = require("jsonwebtoken");

class AuthService {
  async createSession(refreshToken, userId) {
    try {
      const session = await Session({
        userId: userId,
        refreshToken,
        expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      });
      return {
        message: "Tạo session thành công",
        session,
      };
    } catch (e) {
      console.log(e);
      return { message: "Có lỗi phía server" + e, session: null };
    }
  }
  async getUserRolesById(userRoles) {
    let listRoles = [];
    for (let i = 0; i < userRoles.length; i++) {
      const role = await Role.findById(userRoles[i]);
      listRoles.push(role.name);
    }
    return listRoles;
  }
  async handleLogin(rawData) {
    try {
      const { email, password } = rawData;
      const userLogin = await User.findOne({ email: email });
      if (!userLogin) {
        return {
          data: null,
          message: "Email người dùng không tồn tại",
        };
      }
      const isValidPassword = await bcrypt.compare(
        password,
        userLogin.password_hash,
      );
      if (!isValidPassword) {
        return {
          data: null,
          message: "Sai mật khẩu người dùng",
        };
      }
      await User.findByIdAndUpdate(userLogin._id, { last_login: new Date() });
      const token = jwt.sign({ id: userLogin._id }, process.env.AUTH_SECRET, {
        algorithm: "HS256",
        allowInsecureKeySizes: true,
        expiresIn: 86400,
      });
      var authorities = [];
      const listRoles = await this.getUserRolesById(userLogin.roles);
      for (let i = 0; i < userLogin.roles.length; i++) {
        authorities.push("ROLE_" + listRoles[i].toUpperCase());
      }
      return {
        data: { userLogin, token, authorities },
        message: "Người dùng đăng nhập thành công",
      };
    } catch (e) {
      console.log(e);
      return { message: e, data: null };
    }
  }
  async handleRegister(rawData) {
    try {
      const { fullname, email, phone, password, roles } = rawData;
      const username = generateUsernameFromEmail(email);
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      const user = new User({
        username: username,
        email,
        password_hash: hashedPassword,
        phone,
        name: fullname,
      });
      await user.save();
      if (roles) {
        const rolesRegister = await Role.find({ name: { $in: roles } });
        user.roles = rolesRegister.map((role) => role._id);
        await user.save();
      } else {
        const userRoles = await Role.findOne({ name: "user" });
        user.roles = [userRoles._id];
        await user.save();
      }
      return {
        message: "Đăng kí người dùng thành công",
        data: user,
      };
    } catch (e) {
      console.log(e);
      return { message: "Có lỗi phía server" + e, data: null };
    }
  }
}
module.exports = new AuthService();
