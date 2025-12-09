const express = require("express");
const { getSalesReport } = require("../../controllers/superadmin/report-controller");
const { authMiddleware } = require("../../controllers/auth/auth-controller");
const { checkSuperAdmin } = require("../../middleware/superadmin-middleware");

const router = express.Router();

router.use(authMiddleware);
router.use(checkSuperAdmin);

router.get("/sales", getSalesReport);

module.exports = router;


