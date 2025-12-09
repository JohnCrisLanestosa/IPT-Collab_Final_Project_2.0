const ActivityLog = require("../../models/ActivityLog");
const Product = require("../../models/Product");

// Get all activity logs for a specific product
const getProductActivityLogs = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await ActivityLog.find({ productId })
      .sort({ timestamp: -1 }) // Most recent first
      .limit(parseInt(limit))
      .skip(skip)
      .populate("productId", "title category price image");

    const totalLogs = await ActivityLog.countDocuments({ productId });

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total: totalLogs,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalLogs / parseInt(limit)),
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error fetching activity logs",
    });
  }
};

// Get all activity logs across all products
const getAllActivityLogs = async (req, res) => {
  try {
    const { limit = 100, page = 1, action, adminId } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (adminId) filter.adminId = adminId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await ActivityLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("productId", "title category price image"); // Populate product details

    const totalLogs = await ActivityLog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total: totalLogs,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalLogs / parseInt(limit)),
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error fetching activity logs",
    });
  }
};

// Get activity logs by admin
const getAdminActivityLogs = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await ActivityLog.find({ adminId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate("productId", "title category price image");

    const totalLogs = await ActivityLog.countDocuments({ adminId });

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total: totalLogs,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalLogs / parseInt(limit)),
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error fetching activity logs",
    });
  }
};

// Get activity summary (statistics)
const getActivitySummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Get total count by action type
    const actionSummary = await ActivityLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get most active admins
    const adminSummary = await ActivityLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$adminId",
          adminName: { $first: "$adminName" },
          adminEmail: { $first: "$adminEmail" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get most modified products
    const productSummary = await ActivityLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$productId",
          productTitle: { $first: "$productTitle" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      success: true,
      data: {
        actionSummary,
        adminSummary,
        productSummary,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error fetching activity summary",
    });
  }
};

module.exports = {
  getProductActivityLogs,
  getAllActivityLogs,
  getAdminActivityLogs,
  getActivitySummary,
};

