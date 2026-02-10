const { constant } = require("../constants/constants");
const errorHandler = (err, req, res) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  switch (statusCode) {
    case constant.VALIDATION_ERROR:
      return res.json({
        title: "Validation Failed",
        message: err.message,
        stackTrace: err.stackTrace,
      });
    case constant.UNAUTHORIZED:
      return res.json({
        title: "Unauthorized",
        message: err.message,
        stackTrace: err.stackTrace,
      });
    case constant.FORBIDDEN:
      return res.json({
        title: "Forbidden",
        message: err.message,
        stackTrace: err.stackTrace,
      });
    case constant.NOT_FOUND:
      return res.json({
        title: "Not Found",
        message: err.message,
        stackTrace: err.stackTrace,
      });
    case constant.SERVER_ERROR:
      return res.json({
        title: "Server error",
        message: err.message,
        stackTrace: err.stackTrace,
      });
    default:
      console.log("No error, All good");
      break;
  }
};

module.exports = errorHandler;
