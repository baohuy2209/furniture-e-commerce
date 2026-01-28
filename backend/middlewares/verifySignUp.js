const User = reuqire("../app/models/user.model.js");
const Role = require("../app/models/role.");
const { roles } = require("../constants/constants");

const checkDuplicatedEmail = async (req, res, next) => {
  try {
    const user = User.findOne({
      email: req.body.email,
    });
    if (user) {
      return res.status(400).json({ message: "Email đăng kí đã tồn tại" });
    }
    next();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Lỗi từ server, không thể load dữ liệu từ server" });
  }
};
const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (roles.includes(req.body.roles[i])) {
        return res.status(400).json({
          message: "Role của người dùng không tồn tại",
        });
      }
    }
    next();
  }
};
const verifySignUp = {
  checkDuplicatedEmail,
  checkRolesExisted,
};
module.exports = verifySignUp;
