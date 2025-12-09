const axios = require("axios");

/**
 * Verify reCAPTCHA token with Google's API
 * @param {string} token - The reCAPTCHA token from the client
 * @returns {Promise<boolean>} - True if verification successful, false otherwise
 */
async function verifyRecaptcha(token) {
  if (!token) {
    return false;
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY is not set in environment variables");
      return false;
    }

    const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const response = await axios.post(verificationURL);
    
    const { success, score, "error-codes": errorCodes } = response.data;

    if (!success) {
      console.error("reCAPTCHA verification failed:", errorCodes);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error.message);
    return false;
  }
}

module.exports = { verifyRecaptcha };

