const mongoose = require('mongoose');

// User Schema Definition
// defines the structure for member profiles stored in MongoDB
const userSchema = new mongoose.Schema({
  // Authentication Data
  // stores unique identifiers from the Google OAuth flow
  googleId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },

  // Profile Information
  // handles the user visual identity and basic account details
  nickname: {
    type: String,
    required: true, 
    default: "Reader"
  },
  avatar: {
    type: String
  },
  displayName: {
    type: String
  },

  // Permissions and Access
  // determines if the account has standard user or admin privileges
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Personalization and Goals
  // tracks reader preferences and yearly reading targets
  bio: { 
    type: String, 
    default: "Ready to start reading?" 
  },
  favoriteGenre: { 
    type: String, 
    default: "Exploring." 
  },
  goal: { 
    type: Number, 
    default: 10 
  },

  // Timestamps
  // records the exact date and time the account was created
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);