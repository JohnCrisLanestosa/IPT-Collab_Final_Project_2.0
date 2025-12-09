const Product = require("../../models/Product");

const searchProducts = async (req, res) => {
  try {
    const { keyword } = req.params;

    if (!keyword || typeof keyword !== "string") {
      return res.status(400).json({
        success: false,
        message: "Keyword is required and must be in string format!",
      });
    }

    const regEx = new RegExp(keyword, "i");

    const createSearchQuery = {
      $and: [
        {
          $or: [
            { title: regEx },
            { description: regEx },
            { category: regEx },
          ],
        },
        {
          // Exclude archived products from search results
          $or: [
            { isArchived: false },
            { isArchived: { $exists: false } },
            { isArchived: null },
          ],
        },
      ],
    };

    const searchResults = await Product.find(createSearchQuery);

    res.status(200).json({
      success: true,
      data: searchResults,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

module.exports = { searchProducts };

