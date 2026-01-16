import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

// Asset Imports
import RotatingImage from "../assets/images/rotating-image.png"; 

// Component Imports
import Header from "../components/Header.jsx";
import HorizontalLine from "../components/HorizontalLine.jsx";

// Style Imports
import "../style/BookDetails.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function BookDetails({ triggerAlert }) {
  const { olid } = useParams();
  const navigate = useNavigate();

  // state for book metadata and loading status
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // tracks if the book is already in the user's database
  const [savedBookId, setSavedBookId] = useState(null);

  // manages the reading diary form inputs
  const [diaryForm, setDiaryForm] = useState({
    notes: "", 
    quotes: "",
    dateRead: "",
    rating: ""
  });

  const CHAR_LIMIT = 1000;

  // fetch detailed book info from Open Library and check if it's already saved
  useEffect(() => {
    const fetchBookData = async () => {
      try {
        setLoading(true);
        // Step 1: Get general book details
        const res = await axios.get(`https://openlibrary.org/works/${olid}.json`);
        const bookData = res.data;

        // Step 2: Fetch the author's name using the key provided in the book data
        let authorNames = ["Unknown Author"];
        if (bookData.authors?.length > 0) {
          const authorRes = await axios.get(`https://openlibrary.org${bookData.authors[0].author.key}.json`);
          authorNames = [authorRes.data.name];
        }

        setBook({ ...bookData, authorNames });

        // Step 3: Check if this user already has this book saved to their account
        try {
          const myBooksRes = await axios.get(`${API_BASE_URL}/api/bookshelf`, { withCredentials: true });
          const existingBook = myBooksRes.data.find(b => b.bookId === olid);

          if (existingBook) {
            setSavedBookId(existingBook._id);
            setDiaryForm({
              notes: existingBook.notes || existingBook.memorableScene || "",
              quotes: existingBook.quotes || "",
              dateRead: existingBook.dateRead ? existingBook.dateRead.split('T')[0] : "",
              rating: existingBook.rating || ""
            });
          }
        } catch (authErr) {
          // guest user - no saved data to retrieve
        }

      } catch (err) {
        setError("We couldn't find this volume in our archives.");
      } finally {
        setLoading(false);
      }
    };
    fetchBookData();
  }, [olid]);

  // logic to save a book to the database before adding diary notes
  const addToBookshelf = async () => {
    try {
      const coverUrl = book.covers
        ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`
        : "https://via.placeholder.com/150";

      const payload = {
        bookId: olid,
        title: book.title,
        authors: book.authorNames,
        coverImage: coverUrl
      };

      // UPDATED: Used ${API_BASE_URL}
      const res = await axios.post(`${API_BASE_URL}/api/bookshelf/add`, payload, { withCredentials: true });
      return res.data._id; 
    } catch (err) {
      if (err.response?.status === 401) {
        triggerAlert("You'll need to log in to save books to your personal shelf.");
        throw new Error("Unauthorized");
      }
      if (err.response?.status === 400) {
        return savedBookId; 
      }
      throw err;
    }
  };

  // validates and saves diary entries to the bookshelf collection
  const handleSaveDiary = async () => {
    const isFormEmpty = !diaryForm.notes.trim() && 
                        !diaryForm.quotes.trim() && 
                        !diaryForm.dateRead && 
                        !diaryForm.rating;

    if (isFormEmpty) {
      triggerAlert("Your diary entry is empty! Please write something before saving.");
      return;
    }

    if (diaryForm.notes.length > CHAR_LIMIT || diaryForm.quotes.length > CHAR_LIMIT) {
      triggerAlert(`You seem to have a lot of thoughts! Entries must be under ${CHAR_LIMIT} characters.`);
      return;
    }

    try {
      let currentId = savedBookId;

      // if the book isn't saved yet, save it first, then attach the diary entry
      if (!currentId) {
        currentId = await addToBookshelf();
        setSavedBookId(currentId);
      }

      await axios.put(`${API_BASE_URL}/api/bookshelf/${currentId}`, diaryForm, {
        withCredentials: true
      });

      triggerAlert("Your thoughts have been safely recorded into your digital diary.");
      navigate('/dashboard');

    } catch (err) {
      if (err.message === "Unauthorized") {
        triggerAlert("This diary is private. Please log in so we can save these notes to your account.");
      } else {
        triggerAlert("The archives are being stubborn. Your notes could not be saved, please try again.");
      }
    }
  };

  // loading state while fetching external API data
  if (loading) return (
    <div className="loading-screen">
      <img className="static-rotating-image" src={RotatingImage} alt="Loading" />
      <p>Dusting off the archives...</p>
    </div>
  );

  if (error) return <div className="error-screen">{error}</div>;
  if (!book) return <div className="error-screen">Book not found in archives.</div>;

  const coverId = book.covers ? book.covers[0] : null;
  const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "https://via.placeholder.com/150";

  return (
    <div className="container">
      <div className="book-details-container">

        <Header />
        <HorizontalLine />

        {/* Back Navigation */}
        <div className="back-button-wrapper">
            <button className="back-button button" onClick={() => navigate(-1)}>Back</button>
        </div>

        {/* Book Details Section */}
        <div className="details-section">
          <div className="book-cover">
            <img src={coverUrl} alt={book.title} />
          </div>

          <div className="book-details-info">
            <div>
              <h1 className="book-title">{book.title}</h1>
              <h3 className="book-author">{book.authorNames.join(", ")}</h3>
            </div>
            <p className="book-description">
              {typeof book.description === 'string' 
              ? book.description 
              : book.description?.value || "No description available."}
            </p>       
          </div>
        </div>

        {/* Add to Shelf */}
        {!savedBookId && (
        <button className="details-buttons button" onClick={async () => {
          try {
              const id = await addToBookshelf();
              setSavedBookId(id);
              triggerAlert("This book has been added to your personal library!");
          } catch(e) { 
              if (e.message !== "Unauthorized") {
                triggerAlert("The shelf is a bit dusty. We couldn't add this book right now."); 
              }
          }
        }}>
          + Add to Shelves
        </button>
        )}

        {/* Reading Diary Section */}
        <div className="diary-section">
          <h2>Loved this read? <br />Record it in your digital diary.</h2>
          
          {/* Note */}
          <div className="note-form">
            <label>What made this book unputdownable? ({diaryForm.notes.length}/{CHAR_LIMIT})</label>
            <textarea 
              rows="4"
              maxLength={CHAR_LIMIT}
              value={diaryForm.notes}
              onChange={(e) => setDiaryForm({...diaryForm, notes: e.target.value})}
              placeholder="Start writing your thoughts..."
            />
          </div>

          {/* Quote */}
          <div className="quote-form">
            <label>Which quotes stuck with you? ({diaryForm.quotes.length}/{CHAR_LIMIT})</label>
            <textarea 
              rows="4"
              maxLength={CHAR_LIMIT}
              value={diaryForm.quotes}
              onChange={(e) => setDiaryForm({...diaryForm, quotes: e.target.value})}
              placeholder="'The best of a book is not the thought which it contains...'"
            />
          </div>

          <div className="date-rating-form">

            {/* Date */}
            <div className="date-form">
              <label>When did you read this book?</label>
              <input 
                type="date"
                value={diaryForm.dateRead}
                onChange={(e) => setDiaryForm({...diaryForm, dateRead: e.target.value})}
                />
            </div>

            {/* Rating */}
            <div className="rating-form">
              <label>How would you rate this book? (0-10)</label>
              <input 
                type="number" min="0" max="10"
                value={diaryForm.rating}
                onChange={(e) => setDiaryForm({...diaryForm, rating: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Save to Diary */}
        <button className="details-buttons button" onClick={handleSaveDiary}>
          + Save to Diary
        </button>
      </div>
      <HorizontalLine />
    </div>
  );
}

export default BookDetails;