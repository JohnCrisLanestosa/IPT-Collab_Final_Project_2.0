const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
} = require("../../helpers/email");

// Request password reset
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message:
          "If an account with that email exists, we've sent a password reset link.",
      });
    }

    // Check if user registered with Google OAuth
    if (user.authProvider === "google" && !user.password) {
      return res.json({
        success: false,
        message:
          "This account uses Google Sign-In. You cannot reset the password for Google accounts.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before saving to database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token and expiry to user document
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();

    // Send email with unhashed token
    const emailResult = await sendPasswordResetEmail(
      user.email,
      resetToken,
      user.userName
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: "Error sending email. Please try again later.",
      });
    }

    res.json({
      success: true,
      message:
        "If an account with that email exists, we've sent a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later.",
    });
  }
};

// Verify reset token
const verifyResetToken = async (req, res) => {
  const { token } = req.params;

  try {
    // Hash the token to compare with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    res.json({
      success: true,
      message: "Token is valid.",
      email: user.email, // Send email for display purposes
    });
  } catch (error) {
    console.error("Verify token error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later.",
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Validate password
    if (!password || password.length < 6) {
      return res.json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    await sendPasswordResetConfirmation(user.email, user.userName);

    res.json({
      success: true,
      message: "Password has been reset successfully. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred. Please try again later.",
    });
  }
};

module.exports = {
  forgotPassword,
  verifyResetToken,
  resetPassword,
};

