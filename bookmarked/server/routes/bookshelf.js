const express = require('express');
const router = express.Router();
const Bookshelf = require('../models/Bookshelf'); 

// Get All Books
// checks if the user is authenticated before fetching data
// retrieves all books belonging to the user from MongoDB and sorts them by date
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const books = await Bookshelf.find({ user: req.user._id }).sort({ addedAt: -1 });
    res.json(books);

  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});

// Add A Book
// verifies login status and creates a new document in the Bookshelf collection
// sets the default shelf to 'Want to Read' for all new entries
router.post('/add', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not logged in" });

    const newBook = new Bookshelf({
      user: req.user._id,
      bookId: req.body.bookId,
      title: req.body.title,
      authors: req.body.authors,
      coverImage: req.body.coverImage,
      shelf: 'Want to Read'
    });

    const savedBook = await newBook.save();
    res.json(savedBook);

  } catch (err) {
    // handles the unique index error if the book already exists in the user library
    if (err.code === 11000) {
      return res.status(400).json({ error: "You already have this book in your library!" });
    }
    res.status(500).json({ error: "Server Error: Could not save book." });
  }
});

// Update Book
// searches for a specific book linked to the authenticated user ID
// updates fields like shelf, notes, and rating based on the request body
router.put('/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not logged in" });

    const { shelf, notes, memorableScene, quotes, rating, dateRead, isTopPick } = req.body;

    let book = await Bookshelf.findOne({ _id: req.params.id, user: req.user._id });

    if (!book) return res.status(404).json({ msg: 'Book not found' });

    // applies updates only to the fields provided in the React frontend
    if (shelf) book.shelf = shelf;
    if (notes !== undefined) book.notes = notes;
    if (memorableScene !== undefined) book.memorableScene = memorableScene;
    if (quotes !== undefined) book.quotes = quotes;
    if (rating !== undefined) book.rating = rating;
    if (dateRead !== undefined) book.dateRead = dateRead;
    if (isTopPick !== undefined) book.isTopPick = isTopPick;

    await book.save();
    res.json(book);

  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// Delete Book
// finds and removes the selected book from the database
// ensures users can only delete books that belong to their own account
router.delete('/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not logged in" });

    const book = await Bookshelf.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    
    if (!book) return res.status(404).json({ msg: 'Book not found' });

    res.json({ msg: 'Book removed' });

  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;