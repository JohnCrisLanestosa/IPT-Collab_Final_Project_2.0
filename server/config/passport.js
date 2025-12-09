const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Existing user, mark as returning
          user.isNewUser = false;
          // Update last login time
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Check if user exists with the same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.authProvider = "google";
          user.profilePicture = profile.photos[0]?.value;
          user.isNewUser = false; // Linked, not new
          user.isLinked = true; // Account was linked
          user.lastLogin = new Date(); // Update last login
          await user.save();
          return done(null, user);
        }

        // Create new user
        const newUser = new User({
          googleId: profile.id,
          userName: profile.displayName || profile.emails[0].value.split("@")[0],
          email: profile.emails[0].value,
          profilePicture: profile.photos[0]?.value,
          authProvider: "google",
          lastLogin: new Date(), // Set first login time
        });

        await newUser.save();
        newUser.isNewUser = true; // Mark as new signup
        done(null, newUser);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

