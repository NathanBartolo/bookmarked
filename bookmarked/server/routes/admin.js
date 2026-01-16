const express = require('express');
const router = express.Router();
const User = require('../models/Users.js');
const Bookshelf = require('../models/Bookshelf.js');

// Middleware Imports
const isAdmin = require('../middleware/isAdmin'); 

// Access Control
// restricts access to these routes to Admin users only
router.use(isAdmin); 

// Get Statistics
// gets the total number of users and books for the Admin UI
router.get('/stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const bookCount = await Bookshelf.countDocuments();
    res.json({ totalUsers: userCount, totalBooks: bookCount });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Get User List
// fetches all users from the Database and sorts them by date
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Delete User
// removes a user and all of their saved books from MongoDB
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Bookshelf.deleteMany({ user: req.params.id });
    res.json({ msg: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;