exports.signup = async (req, res) => {
  try {
    const { fullname, email, phone, password } = req.body;
  } catch (e) {
    return res.status(500).json({ message: "Error" + e.message });
  }
};
exports.signin = (req, res) => {};
exports.logout = (req, res) => {};
