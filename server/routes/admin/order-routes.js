const express = require("express");

const {
  getAllOrdersOfAllUsers,
  getOrderDetailsForAdmin,
  updateOrderStatus,
  archiveOrder,
  unarchiveOrder,
} = require("../../controllers/admin/order-controller");

const router = express.Router();

router.get("/get", getAllOrdersOfAllUsers);
router.get("/details/:id", getOrderDetailsForAdmin);
router.put("/update/:id", updateOrderStatus);
router.put("/archive/:id", archiveOrder);
router.put("/unarchive/:id", unarchiveOrder);

module.exports = router;

