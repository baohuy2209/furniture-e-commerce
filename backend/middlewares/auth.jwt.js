const jwt = require("jsonwebtoken");
const config = require("../app/config/auth.config");
const User = require("../app/models/user.model");
const Role = require("../app/models/role.model");

verifyToken = (req, res, next) => {
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
    res.userId = decoded.id;
    next();
  });
};
isAdmin = async (req, res, next) => {
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
    return res.status(403).json({ message: "Require Admin Role!" });
  } catch (err) {
    return res.status(500).json({ message: err });
  }
};
isModerator = async (req, res, next) => {
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
};
module.exports = authJwt;
