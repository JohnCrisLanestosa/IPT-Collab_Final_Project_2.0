const bcrypt = require("bcryptjs");
const User = require("../../models/User");

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select("-password");
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
    });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userName, email, profilePicture } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
      user.email = email;
    }

    // Update username if provided
    if (userName) {
      user.userName = userName;
    }

    // Update profile picture if provided
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};

