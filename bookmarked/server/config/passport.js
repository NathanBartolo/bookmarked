const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/Users');

// Session Serialization
// determines which data should be stored in the session cookie
passport.serializeUser((user, done) => {
  if (user.isNew) {
    // stores the whole temporary object for users not yet in the Database
    done(null, user);
  } else {
    // stores only the unique ID for existing users in the Database
    done(null, user.id);
  }
});

// Session Deserialization
// retrieves the full user information from the session data
passport.deserializeUser(async (idOrObj, done) => {
  if (idOrObj.isNew) {
    // returns the temporary object for new users immediately
    done(null, idOrObj);
  } else {
    // looks up the existing user in MongoDB using their stored ID
    try {
      const user = await User.findById(idOrObj);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
});

// Google OAuth Strategy
// configures the passport strategy with credentials and callback logic
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // checks if a profile with this Google ID already exists in MongoDB
      const existingUser = await User.findOne({ googleId: profile.id });

      if (existingUser) {
        // logs in the existing member found in the Database
        return done(null, existingUser);
      } else {
        // creates a temporary object for new or deleted users
        // this object is used to redirect them to the onboarding page
        const tempUser = {
          isNew: true,
          googleId: profile.id,
          email: profile.emails[0].value,
          avatar: profile.photos[0].value
        };
        return done(null, tempUser);
      }
    } catch (err) {
      return done(err, null);
    }
  }
));

module.exports = passport;