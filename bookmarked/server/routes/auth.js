const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/Users.js'); 

// Google Authentication
// triggers the Google login flow to begin the authentication process
// asks the User to choose a specific account via the Google prompt
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' 
  })
);

// Google Auth Callback
// receives the response from Google after the user grants permission
// directs the user to onboarding if they are new or the Dashboard if they exist
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // determine the next step based on the User registration status
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const target = req.user.isNew
      ? `${frontendUrl}/create-profile`
      : `${frontendUrl}/dashboard`;

    // ensure session is persisted before redirecting (mobile can be sensitive to races)
    req.session.save(() => {
      res.redirect(target);
    });
  }
);



// Create User Profile
// verifies that a valid Google session exists before allowing profile creation
router.post('/create-profile', async (req, res) => {
  if (!req.user || !req.user.googleId) {
    return res.status(401).json({ error: "Unauthorized. Please login with Google first." });
  }

  try {
    const { nickname } = req.body;

    if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
      return res.status(400).json({ error: "Nickname is required" });
    }

    // If the user already exists (race / double submit), just return it
    const existing = await User.findOne({ googleId: req.user.googleId });
    if (existing) {
      return res.json({ success: true, user: existing, note: 'Existing user reused' });
    }

    // creates a new document in the MongoDB collection with the provided nickname
    const newUser = await User.create({
      googleId: req.user.googleId,
      email: req.user.email,
      avatar: req.user.avatar, 
      nickname: nickname.trim(),
      displayName: nickname.trim()
    });

    // establishes a persistent login session for the newly created User
    req.login(newUser, (err) => {
      if (err) return res.status(500).json({ error: "Login failed" });
      res.json({ success: true, user: newUser });
    });

  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: "Account already exists" });
    }
    res.status(500).json({ error: "Could not create account", detail: err.message });
  }
});

// Delete Account
// ensures the user is currently logged in before attempting deletion
router.delete('/delete-account', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // removes the User record from the database permanently
    await User.findByIdAndDelete(req.user._id);

    // clears the passport session and destroys the session data
    req.logout((err) => {
      if (err) return res.status(500).json({ error: "Logout failed during deletion" });
      
      req.session.destroy(() => {
        // removes the browser cookie to finish the cleanup
        res.clearCookie('connect.sid'); 
        res.json({ success: true, message: "Account deleted" });
      });
    });

  } catch (err) {
    res.status(500).json({ error: "Could not delete account" });
  }
});

// Logout Route
// terminates the active Session through passport
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    // clears the server session store and redirects to the landing page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    req.session.destroy(() => {
      res.redirect(`${frontendUrl}/`);
    });
  });
});

// Get User Profile
// sends the current user data stored in the request object back to React
router.get('/user', (req, res) => {
  res.send(req.user || null);
});

// Update Profile
// checks for an active login before processing the update
router.put('/update-profile', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not logged in" });

    // locates the specific User profile in MongoDB
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // updates specific fields if they are present in the request body
    if (req.body.nickname !== undefined) user.nickname = req.body.nickname;
    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.favoriteGenre !== undefined) user.favoriteGenre = req.body.favoriteGenre;
    if (req.body.goal !== undefined) user.goal = req.body.goal;

    // commits the changes to the database
    await user.save();
    res.json(user);

  } catch (err) {
    res.status(500).json({ error: "Could not update profile" });
  }
});

module.exports = router;