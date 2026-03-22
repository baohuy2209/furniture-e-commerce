const { protectedRoute, isAdmin } = require("../middlewares/auth.jwt");
const customerController = require("../app/controllers/customer.controller");
const router = require("express").Router();

// All routes here require Admin role (Temporarily disabled for verification since login is not yet integrated)
// router.use(protectedRoute);
// router.use(isAdmin);

router.get("/statistics", customerController.getStatistics);
router.get("/", customerController.getCustomers);
router.get("/:id", customerController.getCustomerDetail);
router.get("/:id/orders", customerController.getCustomerOrders);
router.get("/:id/points", customerController.getCustomerPoints);
router.patch("/:id/status", customerController.updateStatus);

module.exports = router;
