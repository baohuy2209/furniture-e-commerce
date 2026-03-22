const jwt = require("jsonwebtoken");
const config = require("../app/config/auth.config");
const User = require("../app/models/user.model");
const Role = require("../app/models/role.model");

const verifyToken = (req, res, next) => {
  let token = req.session.token;
  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }
  // verify token
  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        message: "Unauthorized!",
      });
    }
    req.userId = decoded.id;
    next();
  });
};
const protectedRoute = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ message: "Không tìm thấy access token", data: null });
    }
    jwt.verify(token, process.env.AUTH_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          message: "Unauthorized!",
        });
      }
      req.userId = decoded.id;
      next();
    });
  } catch (e) {
    console.error("Lỗi khi xác minh JWT trong authMiddleware", e);
    return res.status(500).json({ message: "Lỗi từ phía server", data: null });
  }
};
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const roles = await Role.find({
      _id: { $in: user.roles },
    });
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "admin") {
        next();
        return;
      }
    }
    return res.status(403).json({ message: "Require Admin Role!", data: null });
  } catch (err) {
    return res.status(500).json({ message: err, data: null });
  }
};
const isModerator = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const roles = await Role.find({
      _id: { $in: user.roles },
    });
    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "moderator") {
        next();
        return;
      }
    }
    return res.status(403).json({ message: "Require Moderator Role!" });
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};
const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
  protectedRoute,
};
module.exports = authJwt;
