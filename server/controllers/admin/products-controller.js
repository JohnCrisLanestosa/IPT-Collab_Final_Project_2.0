const { imageUploadUtil } = require("../../helpers/cloudinary");
const Product = require("../../models/Product");
const ActivityLog = require("../../models/ActivityLog");
const User = require("../../models/User");

// Helper function to log activity
const logActivity = async (productId, productTitle, adminId, action, changes = {}) => {
  try {
    // Get admin details
    const admin = await User.findById(adminId);
    if (!admin) {
      console.log("Admin not found for logging activity");
      return;
    }

    const activityLog = new ActivityLog({
      productId,
      productTitle,
      adminId,
      adminName: admin.userName,
      adminEmail: admin.email,
      action,
      changes,
    });

    await activityLog.save();
    console.log(`[Activity Log] ${action} by ${admin.userName} on product: ${productTitle}`);
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw error - logging should not break the main operation
  }
};

const handleImageUpload = async (req, res) => {
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    const url = "data:" + req.file.mimetype + ";base64," + b64;
    const result = await imageUploadUtil(url);

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error occured",
    });
  }
};

//add a new product
const addProduct = async (req, res) => {
  try {
    const {
      image,
      title,
      description,
      category,
      price,
      totalStock,
      averageReview,
      adminId, // Add adminId to track who added the product
    } = req.body;

    console.log(averageReview, "averageReview");

    const newlyCreatedProduct = new Product({
      image,
      title,
      description,
      category,
      price,
      totalStock,
      averageReview,
    });

    await newlyCreatedProduct.save();

    // Log activity
    if (adminId) {
      await logActivity(
        newlyCreatedProduct._id,
        newlyCreatedProduct.title,
        adminId,
        "add",
        {
          title,
          description,
          category,
          price,
          totalStock,
          image,
          averageReview,
        }
      );
    }

    // Emit real-time update to all admins
    const io = req.app.get("io");
    if (io) {
      const roomSize = io.sockets.adapter.rooms.get("admin-room")?.size || 0;
      console.log(`[Socket] Emitting product-updated (add) to ${roomSize} clients in admin-room`);
      io.to("admin-room").emit("product-updated", {
        action: "add",
        product: newlyCreatedProduct.toObject(),
      });
    }

    res.status(201).json({
      success: true,
      data: newlyCreatedProduct,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

//fetch all products

const fetchAllProducts = async (req, res) => {
  try {
    const { archived } = req.query;
    
    const query = {};
    
    // Filter by archived status if provided, otherwise show all products
    if (archived !== undefined) {
      query.isArchived = archived === "true";
    }
    // If no filter provided, show all products (both archived and non-archived)
    
    const listOfProducts = await Product.find(query);
    res.status(200).json({
      success: true,
      data: listOfProducts,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

//edit a product
const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      image,
      title,
      description,
      category,
      price,
      totalStock,
      averageReview,
      userId,
    } = req.body;

    let findProduct = await Product.findById(id);
    if (!findProduct)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    // Check if product is locked by another user (2PL - Phase 1 Check)
    if (findProduct.isLocked) {
      // Check if lock has expired
      if (new Date() > findProduct.lockExpiry) {
        // Lock expired, release it
        findProduct.isLocked = false;
        findProduct.lockedBy = null;
        findProduct.lockedByName = null;
        findProduct.lockedAt = null;
        findProduct.lockExpiry = null;
      } else if (findProduct.lockedBy !== userId) {
        // Product is locked by another user
        return res.status(423).json({
          success: false,
          message: `Product is currently being edited by ${findProduct.lockedByName || "another user"}. Lock expires at ${findProduct.lockExpiry.toLocaleTimeString()}`,
          lockedBy: findProduct.lockedBy,
          lockedByName: findProduct.lockedByName,
          lockExpiry: findProduct.lockExpiry,
        });
      }
    }

    // Store old values for logging
    const oldProduct = {
      title: findProduct.title,
      description: findProduct.description,
      category: findProduct.category,
      price: findProduct.price,
      totalStock: findProduct.totalStock,
      image: findProduct.image,
      averageReview: findProduct.averageReview,
    };

    findProduct.title = title || findProduct.title;
    findProduct.description = description || findProduct.description;
    findProduct.category = category || findProduct.category;
    findProduct.price = price === "" ? 0 : price || findProduct.price;
    findProduct.totalStock = totalStock || findProduct.totalStock;
    findProduct.image = image || findProduct.image;
    findProduct.averageReview = averageReview || findProduct.averageReview;

    // Release lock after successful edit (2PL - Phase 2)
    findProduct.isLocked = false;
    findProduct.lockedBy = null;
    findProduct.lockedByName = null;
    findProduct.lockedAt = null;
    findProduct.lockExpiry = null;

    await findProduct.save();

    // Log activity - track what changed
    if (userId) {
      const changes = { old: {}, new: {} };
      if (oldProduct.title !== findProduct.title) {
        changes.old.title = oldProduct.title;
        changes.new.title = findProduct.title;
      }
      if (oldProduct.description !== findProduct.description) {
        changes.old.description = oldProduct.description;
        changes.new.description = findProduct.description;
      }
      if (oldProduct.category !== findProduct.category) {
        changes.old.category = oldProduct.category;
        changes.new.category = findProduct.category;
      }
      if (oldProduct.price !== findProduct.price) {
        changes.old.price = oldProduct.price;
        changes.new.price = findProduct.price;
      }
      if (oldProduct.totalStock !== findProduct.totalStock) {
        changes.old.totalStock = oldProduct.totalStock;
        changes.new.totalStock = findProduct.totalStock;
      }
      if (oldProduct.image !== findProduct.image) {
        changes.old.image = oldProduct.image;
        changes.new.image = findProduct.image;
      }
      if (oldProduct.averageReview !== findProduct.averageReview) {
        changes.old.averageReview = oldProduct.averageReview;
        changes.new.averageReview = findProduct.averageReview;
      }

      await logActivity(
        findProduct._id,
        findProduct.title,
        userId,
        "edit",
        changes
      );
    }

    // Emit real-time update to all admins
    const io = req.app.get("io");
    if (io) {
      const roomSize = io.sockets.adapter.rooms.get("admin-room")?.size || 0;
      console.log(`[Socket] Emitting product-updated (edit) to ${roomSize} clients in admin-room`);
      console.log(`[Socket] Product: ${findProduct.title}, Price: ${findProduct.price}, Stock: ${findProduct.totalStock}`);
      io.to("admin-room").emit("product-updated", {
        action: "edit",
        product: findProduct.toObject(),
      });
    } else {
      console.log("[Socket] WARNING: Socket.io not available!");
    }

    res.status(200).json({
      success: true,
      data: findProduct,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

//archive a product
const archiveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body; // Get adminId from request body
    const product = await Product.findById(id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    // Check if product is already archived
    if (product.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Product is already archived!",
      });
    }

    // Archive the product
    product.isArchived = true;
    await product.save();

    // Log activity
    if (adminId) {
      await logActivity(
        product._id,
        product.title,
        adminId,
        "archive",
        { status: "archived" }
      );
    }

    // Emit real-time update to all admins
    const io = req.app.get("io");
    if (io) {
      io.to("admin-room").emit("product-updated", {
        action: "archive",
        product: product,
      });
    }

    res.status(200).json({
      success: true,
      message: "Product archived successfully",
      data: product,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

//unarchive a product
const unarchiveProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body; // Get adminId from request body
    const product = await Product.findById(id);

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    // Check if product is not archived
    if (!product.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Product is not archived!",
      });
    }

    // Unarchive the product
    product.isArchived = false;
    await product.save();

    // Log activity
    if (adminId) {
      await logActivity(
        product._id,
        product.title,
        adminId,
        "unarchive",
        { status: "active" }
      );
    }

    // Emit real-time update to all admins
    const io = req.app.get("io");
    if (io) {
      io.to("admin-room").emit("product-updated", {
        action: "unarchive",
        product: product,
      });
    }

    res.status(200).json({
      success: true,
      message: "Product unarchived successfully",
      data: product,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occured",
    });
  }
};

// Lock a product for editing (2PL - Phase 1: Growing Phase)
// Uses atomic findOneAndUpdate to prevent race conditions
const lockProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body;
    const LOCK_DURATION_MS = (parseInt(process.env.PRODUCT_LOCK_DURATION_MINUTES) || 5) * 60 * 1000; // Configurable lock duration

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const now = new Date();
    const lockExpiry = new Date(now.getTime() + LOCK_DURATION_MS);

    // Atomically acquire lock only if product is not locked or lock has expired
    const product = await Product.findOneAndUpdate(
      {
        _id: id,
        $or: [
          { isLocked: false },
          { lockExpiry: { $lt: now } }, // Lock expired
          { lockedBy: userId } // Same user refreshing lock
        ]
      },
      {
        isLocked: true,
        lockedBy: userId,
        lockedByName: userName || "Unknown User",
        lockedAt: now,
        lockExpiry: lockExpiry,
      },
      { new: true }
    );

    if (!product) {
      // Product not found or already locked by another user
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      // Check if locked by another user
      if (existingProduct.isLocked && existingProduct.lockedBy !== userId && existingProduct.lockExpiry > now) {
        return res.status(423).json({
          success: false,
          message: `Product is currently locked by ${existingProduct.lockedByName || "another user"}. Lock expires at ${existingProduct.lockExpiry.toLocaleTimeString()}`,
          lockedBy: existingProduct.lockedBy,
          lockedByName: existingProduct.lockedByName,
          lockExpiry: existingProduct.lockExpiry,
        });
      }
    }

    // Emit real-time update to all admins
    const io = req.app.get("io");
    if (io) {
      io.to("admin-room").emit("product-updated", {
        action: "lock",
        product: product,
      });
    }

    res.status(200).json({
      success: true,
      message: "Lock acquired successfully",
      data: product,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occurred while locking product",
    });
  }
};

// Unlock a product (2PL - Phase 2: Shrinking Phase)
const unlockProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if product is locked
    if (!product.isLocked) {
      return res.status(400).json({
        success: false,
        message: "Product is not locked",
      });
    }

    // Check if the user owns the lock
    if (product.lockedBy !== userId) {
      return res.status(403).json({
        success: false,
        message: "You do not own the lock on this product",
      });
    }

    // Release lock (Shrinking Phase)
    product.isLocked = false;
    product.lockedBy = null;
    product.lockedByName = null;
    product.lockedAt = null;
    product.lockExpiry = null;
    await product.save();

    // Emit real-time update to all admins
    const io = req.app.get("io");
    if (io) {
      io.to("admin-room").emit("product-updated", {
        action: "unlock",
        product: product,
      });
    }

    res.status(200).json({
      success: true,
      message: "Lock released successfully",
      data: product,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error occurred while unlocking product",
    });
  }
};

module.exports = {
  handleImageUpload,
  addProduct,
  fetchAllProducts,
  editProduct,
  archiveProduct,
  unarchiveProduct,
  lockProduct,
  unlockProduct,
};
