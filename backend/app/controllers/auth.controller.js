const authService = require("../../services/auth.service");
const crypto = require("crypto");
const Session = require("../models/session.model");
const jwt = require("jsonwebtoken");
const { verify } = require("../../utils/utils");
const User = require("../models/user.model");

exports.signup = async (req, res) => {
  try {
    const { fullname, email, phone, password } = req.body;
    if (!fullname || !email || !phone || !password) {
      return res.status(400).json({
        message: "Người dùng nhập thiếu trường dữ liệu",
        data: null,
      });
    }
    const { data, message } = await authService.handleRegister(req.body);
    if (!data) {
      return res.status(404).json({ message: "Error:" + message, data: null });
    }
    return res.status(200).json({
      message: message,
      data: data,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Error" + e, data: null });
  }
};
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Nhập thiếu dữ liệu",
        data: null,
      });
    }
    const { data, message } = await authService.handleLogin(req.body);
    if (!data) {
      console.log(message, data);
      return res.status(404).json({ message: message, data: null });
    }
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const { session } = await authService.createSession(
      refreshToken,
      data.userLogin._id,
    );
    if (!session) {
      return res
        .status(403)
        .json({ message: "Không tạo được phiên đăng nhập", data: null });
    }
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });
    const responseData = {
      id: data.userLogin._id,
      username: data.userLogin.username,
      email: data.userLogin.email,
      roles: data.authorities,
      accessToken: data.token,
    };
    return res.status(200).json({
      data: responseData,
      message: message,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Error" + e, data: null });
  }
};
exports.refreshUserToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Token không tồn tại", data: null });
    }
    const session = await Session.findOne({ refreshToken: token });
    if (!session) {
      return res
        .status(403)
        .json({ message: "Token không hợp lệ hoặc đã hết hết hạn" });
    }
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token đã hết hạn", data: null });
    }
    const accessToken = jwt.sign(
      { id: session.userId },
      process.env.AUTH_SECRET,
      {
        expiresIn: 86400,
      },
    );
    return res
      .status(200)
      .json({ message: "Đã tạo thành công token mới", data: accessToken });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Error" + e, data: null });
  }
};
exports.logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await Session.deleteOne({ refreshToken: token });
      res.clearCookie("refreshToken");
    }

    return res.status(200).json({ message: "Bạn đã đăng xuất", data: null });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Lỗi hệ thống: " + e, data: null });
  }
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập email", data: null });
    }

    const { data, message } = await authService.forgotPassword(email);
    if (!data) {
      return res.status(400).json({ message, data: null });
    }

    return res.status(200).json({ message, data });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Lỗi hệ thống: " + e, data: null });
  }
};
exports.checkOtpResetPassword = async (req, res) => {
  try {
    const { otpCode } = req.body;

    if (!otpCode) {
      return res.status(400).json({
        message: "Hãy nhập mã OTP",
        data: null,
      });
    }

    const { data, message } = await authService.checkOtp(otpCode);
    if (!data) {
      return res.status(400).json({ message, data: null });
    }

    return res.status(200).json({ message, data });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Lỗi hệ thống: " + e, data: null });
  }
};
exports.verifyEmail = async (req, res) => {
  try {
    const { otpCode } = req.body;
    if (!otpCode) {
      return res.status(400).json({
        message: "Hãy nhập mã OTP",
        data: null,
      });
    }
    const { data, message } = await authService.checkVerifyOtp(otpCode);
    if (!data) {
      return res.status(400).json({ message, data: null });
    }

    return res.status(200).json({ message, data });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Lỗi hệ thống: " + e, data: null });
  }
};
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword, userId } = req.body;
    const { data, message } = await authService.resetPassword(
      newPassword,
      userId,
    );
    if (!data) {
      return res.status(404).json({ message, data });
    }
    return res.status(200).json({ message, data });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Lỗi hệ thống: " + e, data: null });
  }
};
exports.googleAuthentication = async (req, res) => {
  try {
    const { token } = req.body;
    const payload = await verify(token);
    const checkExistEmail = await User.findOne({ email: payload.email });
    if (checkExistEmail) {
      return res.status(400).json({
        message: "Email đã được sử dụng cho tài khoản khác",
        data: null,
      });
    }
    const { data, message } = await authService.oauth2Google(payload);
    if (!data) {
      return res.status(404).json({ message: message, data: null });
    }
    const refreshToken = crypto.randomBytes(64).toString("hex");
    const { session } = await authService.createSession(
      refreshToken,
      data.userLogin._id,
    );
    if (!session) {
      return res
        .status(403)
        .json({ message: "Không tạo được phiên đăng nhập", data: null });
    }
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });
    const responseData = {
      id: data.user._id,
      username: data.user.username,
      email: data.user.email,
      roles: data.authorities,
      accessToken: data.token,
    };
    return res.status(200).json({
      data: responseData,
      message: message,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Lỗi hệ thống: " + e, data: null });
  }
};
