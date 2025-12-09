const express = require("express");

const {
  handleImageUpload,
  addProduct,
  editProduct,
  fetchAllProducts,
  archiveProduct,
  unarchiveProduct,
  lockProduct,
  unlockProduct,
} = require("../../controllers/admin/products-controller");

const { upload } = require("../../helpers/cloudinary");

const router = express.Router();

router.post("/upload-image", upload.single("my_file"), handleImageUpload);
router.post("/add", addProduct);
router.put("/edit/:id", editProduct);
router.post("/archive/:id", archiveProduct);
router.post("/unarchive/:id", unarchiveProduct);
router.post("/lock/:id", lockProduct);
router.post("/unlock/:id", unlockProduct);
router.get("/get", fetchAllProducts);

module.exports = router;
