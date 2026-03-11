const User = require("../app/models/user.model");
const Role = require("../app/models/role.model");
const Session = require("../app/models/session.model");
const bcrypt = require("bcrypt");
const { generateUsernameFromEmail } = require("../utils/generateUsername");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
class AuthService {
  async createSession(refreshToken, userId) {
    try {
      const session = await Session.create({
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
      const isValidPassword = bcrypt.compare(password, userLogin.password_hash);
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
      const safeUser = user;
      safeUser.password_hash = null;
      return {
        message: "Đăng kí người dùng thành công",
        data: safeUser,
      };
    } catch (e) {
      console.log(e);
      return { message: "Có lỗi phía server" + e, data: null };
    }
  }
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return { message: "Người dùng không tồn tại", data: null };
      }

      // Tạo mã OTP 6 số ngẫu nhiên
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Lưu mã OTP vào database thay vì token dài
      user.reset_password_token = otpCode;
      user.reset_password_token_expire_at = Date.now() + 15 * 60 * 1000; // 15 phút
      await user.save();
      // Configure nodemailer
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_SERVICE,
        to: user.email,
        subject: "Mã xác nhận đặt lại mật khẩu",
        text: `Bạn đã yêu cầu đặt lại mật khẩu. Mã xác nhận (OTP) của bạn là: ${otpCode}\n\nMã này sẽ hết hạn sau 15 phút.`,
      };

      await transporter.sendMail(mailOptions);
      return {
        message: "Đã gửi mã xác nhận (OTP) đến email của bạn",
        data: { email: user.email },
      };
    } catch (e) {
      console.log(e);
      return { message: "Có lỗi khi gửi email: " + e.message, data: null };
    }
  }
  async checkOtp(otpCode) {
    try {
      const user = await User.findOne({
        reset_password_token: otpCode,
        reset_password_token_expire_at: { $gt: Date.now() },
      });

      if (!user) {
        return { message: "Mã OTP không hợp lệ hoặc đã hết hạn", data: null };
      }

      // const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      // user.password_hash = hashedPassword;
      // Dọn dẹp token sau khi dùng xong
      // user.reset_password_token = undefined;
      // user.reset_password_token_expire_at = undefined;
      // await user.save();

      return {
        message: "Mã OTP hợp lệ",
        data: user,
      };
    } catch (e) {
      console.log(e);
      return { message: "Có lỗi phía server: " + e.message, data: null };
    }
  }
  async resetPassword(newPassword, userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { message: "Không tìm thấy user", data: null };
      }
      const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
      user.password_hash = newHashedPassword;
      user.reset_password_token = undefined;
      user.reset_password_token_expire_at = undefined;
      await user.save();
      return {
        message: "Đổi pasword thành công",
        data: user,
      };
    } catch (e) {
      console.log(e);
      return { message: "Có lỗi phía server: " + e.message, data: null };
    }
  }
}
module.exports = new AuthService();
