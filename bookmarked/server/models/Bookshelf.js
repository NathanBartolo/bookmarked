const mongoose = require('mongoose');

// Bookshelf Schema Definition
// defines the structure for books saved in a user library within MongoDB
const BookshelfSchema = new mongoose.Schema({
  // links each book entry to a specific user in the Database
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Standard Book Data
  // stores core information retrieved from the Open Library API
  bookId: { type: String, required: true },
  title: { type: String, required: true },
  authors: [String], 
  coverImage: String,
  
  // Shelf Organization
  // categorizes the book into status groups for the library UI
  shelf: { 
    type: String, 
    default: 'Want to Read' 
  },
  
  // Diary and Journal Fields
  // holds personal user input including reviews and reading progress
  notes: { type: String, default: '' }, 
  quotes: { type: String, default: '' },
  rating: { type: Number, min: 0, max: 10, default: 0 }, 
  dateRead: { type: Date }, 
  isTopPick: { type: Boolean, default: false },
  
  // Timestamps
  // tracks when the book was first added to the shelf
  addedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Bookshelf', BookshelfSchema);