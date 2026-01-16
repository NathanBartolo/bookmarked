import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; 

// Asset Imports
import RotatingImage from "../assets/images/rotating-image.png"; 
import BackgroundImage from "../assets/images/background-image.png"; 
import EditImage from "../assets/images/edit-icon.png"; 
import HeartFilled from "../assets/images/full-heart.png"; 
import HeartEmpty from "../assets/images/empty-heart.png";   
import TrashIcon from "../assets/images/trash-icon.png";     

// Component Imports
import Header from "../components/Header.jsx";
import HorizontalLine from "../components/HorizontalLine.jsx";

// Style Imports
import '../style/Shelves.css'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Shelves = ({ triggerAlert }) => { 
  // --- State ---
  // tracks user session, the array of book objects, and initial data fetch status
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Modal: Individual Book ---
  // manages the "edit book" popup logic for moving items between shelves or deleting them
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [selectedShelf, setSelectedShelf] = useState(""); 
  const [customShelfName, setCustomShelfName] = useState(""); 

  // --- Modal: Shelf Management ---
  // handles the high-level management of custom shelf names and deletions
  const [isShelfModalOpen, setIsShelfModalOpen] = useState(false);
  const [targetShelf, setTargetShelf] = useState(""); 
  const [newShelfName, setNewShelfName] = useState(""); 

  const defaultShelves = ["Currently Reading", "Want to Read", "Read"];

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  // verifies user session and retrieves all saved books from the database
  const checkAuthAndFetch = async () => {
    try {
      const userRes = await fetch(`${API_BASE_URL}/auth/user`, { credentials: 'include' });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData && userData.email) {
          setUser(userData);
          const bookRes = await fetch(`${API_BASE_URL}/api/bookshelf`, { credentials: 'include' });
          const bookData = await bookRes.json();
          setBooks(Array.isArray(bookData) ? bookData : []);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) { 
      setUser(null);
    } finally { 
      setLoading(false); 
    }
  };

  // removes a specific book record from the database
  const handleDeleteBook = async () => {
    if (!editingBook) return;

    triggerAlert(`Remove "${editingBook.title}" from your library?`, async () => {
        try {
          await fetch(`${API_BASE_URL}/api/bookshelf/${editingBook._id}`, { method: 'DELETE', credentials: 'include' });
          setBooks(books.filter(b => b._id !== editingBook._id));
          setIsModalOpen(false); 
        } catch (err) { }
    });
  };

  // toggles the 'Top Pick' status for the dashboard highlight section
  const handleToggleHeart = async () => {
    if (!editingBook) return;
    if (!editingBook.isTopPick) {
        const currentHearts = books.filter(b => b.isTopPick).length;
        if (currentHearts >= 4) {
            triggerAlert("You can only select 4 top picks! Please remove one before adding another.");
            return;
        }
    }
    const newStatus = !editingBook.isTopPick;
    const updatedBooks = books.map(b => 
      b._id === editingBook._id ? { ...b, isTopPick: newStatus } : b
    );
    setBooks(updatedBooks);
    setEditingBook({ ...editingBook, isTopPick: newStatus });
    try {
      await fetch(`${API_BASE_URL}/api/bookshelf/${editingBook._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTopPick: newStatus }),
        credentials: 'include'
      });
    } catch (err) { checkAuthAndFetch(); }
  };

  // updates the shelf category for a book or creates a new one
  const handleSaveShelf = async () => {
    if (!editingBook) return;
    let finalShelfName = selectedShelf;
    if (selectedShelf === "custom") {
      if (!customShelfName.trim()) {
          triggerAlert("Please enter a shelf name.");
          return;
      }
      finalShelfName = customShelfName.trim();
    }
    try {
      const updatedBooks = books.map(b => 
        b._id === editingBook._id ? { ...b, shelf: finalShelfName } : b
      );
      setBooks(updatedBooks);
      setIsModalOpen(false); 
      await fetch(`${API_BASE_URL}/api/bookshelf/${editingBook._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shelf: finalShelfName }),
        credentials: 'include'
      });
    } catch (err) { checkAuthAndFetch(); }
  };

  // deletes a custom shelf and moves all its books to the 'Want to Read' category
  const handleDeleteShelf = async () => {
    const confirmMessage = `Are you sure you want to delete the shelf "${targetShelf}"? All books will move to 'Want to Read'.`;
    
    triggerAlert(confirmMessage, async () => {
        try {
          const booksInShelf = books.filter(b => b.shelf === targetShelf);
          const updatedBooks = books.map(b => 
            b.shelf === targetShelf ? { ...b, shelf: "Want to Read" } : b
          );
          setBooks(updatedBooks);
          setIsShelfModalOpen(false); 
          await Promise.all(booksInShelf.map(book => 
            fetch(`${API_BASE_URL}/api/bookshelf/${book._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ shelf: "Want to Read" }),
              credentials: 'include'
            })
          ));
        } catch (err) {
          checkAuthAndFetch(); 
        }
    });
  };

  // renames an existing custom shelf for all books currently assigned to it
  const handleRenameShelf = async () => {
    if (!newShelfName.trim()) {
        triggerAlert("Shelf name cannot be empty!");
        return;
    }
    if (newShelfName === targetShelf) return setIsShelfModalOpen(false); 
    try {
      const booksInShelf = books.filter(b => b.shelf === targetShelf);
      const updatedBooks = books.map(b => 
        b.shelf === targetShelf ? { ...b, shelf: newShelfName.trim() } : b
      );
      setBooks(updatedBooks);
      setIsShelfModalOpen(false);
      await Promise.all(booksInShelf.map(book => 
        fetch(`${API_BASE_URL}/api/bookshelf/${book._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shelf: newShelfName.trim() }),
          credentials: 'include'
        })
      ));
    } catch (err) {
      checkAuthAndFetch();
    }
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setSelectedShelf(book.shelf); 
    setCustomShelfName(""); 
    setIsModalOpen(true);
  };

  const openShelfModal = (shelfName) => {
    setTargetShelf(shelfName);
    setNewShelfName(shelfName);
    setIsShelfModalOpen(true);
  };

  // dynamically determines all shelves (default + custom) to display
  const usedShelves = [...new Set(books.map(b => b.shelf))];
  const allShelves = [...new Set([...defaultShelves, ...usedShelves])];

  {/* Loading */}
  if (loading) return <div className="no-results">
    <img className="static-rotating-image" src={RotatingImage} alt="Loading Library" />
    <p>Even our librarians are stumped. Please wait a moment.</p>
  </div>;

  if (!user) {
    return (
      <div className="container">

        <Header />

        <HorizontalLine />

        {/* Login Required */}
        <div className="bounce-message">

            <img className="scroll-rotating-image" src={RotatingImage} alt="Login Required" />

            <h2>Please Log In</h2>

            <p>You need to be logged in to view your library.</p>

            <button className="button bounce-button" onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}>
                Login with Google
            </button>

        </div>
      </div>
    );
  }

  if (books.length === 0) {
      return (
        <div className="container">
            <Header />
            <HorizontalLine />
            <div className="page-container">

                <h1 className="section-title">MY LIBRARY</h1>
                
                <hr />

                {/* Empty Library */}
                <div className="bounce-message">

                    <img className="scroll-rotating-image" src={RotatingImage} alt="Empty Library" />

                    <h2>Your library is looking a little light!</h2>

                    <p>Start adding books to populate your shelves.</p>

                    <Link to="/search" className="button bounce-button">
                        Start Exploring
                    </Link>

                </div>
            </div>
        </div>
      )
  }

  return (
    <div className="shelves-container">
      <Header />
      <HorizontalLine />

      <div className="page-container">

        {/* map through all unique shelves to display book grids */}
        {allShelves.map(shelfName => {
          const shelfBooks = books.filter(b => b.shelf === shelfName);
          if (shelfBooks.length === 0 && !defaultShelves.includes(shelfName)) return null; 
          const isCustomShelf = !defaultShelves.includes(shelfName);

          return (
            <div className="shelf-container" key={shelfName}>
              <div>
                <div className="shelf-information">
                  <h1 className="shelf-name">{shelfName}</h1>
                  {isCustomShelf && (
                      <img 
                        className="icon-image" 
                        onClick={() => openShelfModal(shelfName)} 
                        title="Edit Shelf" 
                        src={EditImage} 
                        alt="Edit Shelf" 
                      />
                  )}
                </div>
                <hr />
              </div>

              {/* flex container for the book cards within this category */}
              {shelfBooks.length > 0 ? (
                <div className="books-container shelves-books-container">
                  {shelfBooks.map((book) => {
                    const linkId = book.bookId || (book.key ? book.key.replace("/works/", "") : null);
                    return (
                      <div key={book._id} className="book-card">
                        <Link to={linkId ? `/book/${linkId}` : "#"}>
                            <div className="book-cover-wrapper" style={{ backgroundImage: `url(${BackgroundImage})` }}>
                              <img src={book.coverImage || "https://placehold.co/128x190"} alt={book.title} />
                            </div>
                            <div className="book-details">
                              <h3>{book.title}</h3>
                              <p>{book.authors?.[0] || "Unknown"}</p>
                            </div>
                        </Link>
                        {/* overlay icon to trigger the individual book edit modal */}
                        <img 
                          className="edit-book-button icon-image" 
                          onClick={() => openEditModal(book)} 
                          src={EditImage} 
                          alt="Edit Book" 
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="empty-shelf">A lonely shelf is a sad shelf.</p>
              )}
            </div>
          );
        })}

        <HorizontalLine />

      </div>

      {/* Modal: Edit Book */}
      {isModalOpen && editingBook && (
        <div className="modal-overlay">
          <div className="modal-content">

            <h3>Editing "{editingBook.title}"</h3>

            {/* Create New or Move to New Shelf */}
            <div className="input-group">
                <label>Move this book to:</label>
                <select value={selectedShelf} onChange={(e) => setSelectedShelf(e.target.value)}>
                  {allShelves.map(s => <option key={s} value={s}>{s}</option>)}
                  <option value="custom">+ Create a New Shelf</option>
                </select>
                {/* conditional input for typing a brand new shelf name */}
                {selectedShelf === "custom" && (
                    <input className="modal-input" type="text" placeholder="Enter new shelf name..." autoFocus value={customShelfName} onChange={(e) => setCustomShelfName(e.target.value)} />
                )}
            </div>

            {/* Delete & Heart */}
            <div className="modal-actions-list">
              <img src={editingBook.isTopPick ? HeartFilled : HeartEmpty} onClick={handleToggleHeart} alt="Heart" className="icon-image" />
              <img src={TrashIcon} onClick={handleDeleteBook} className="icon-image" alt="Delete"/>
            </div>

            <hr />
            
            {/* Action Buttons */}
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="button" onClick={handleSaveShelf}>Save Changes</button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Shelf Settings */}
      {isShelfModalOpen && (
        <div className="modal-overlay">

          <div className="modal-content">

            <h3>Editing Shelf: "{targetShelf}"</h3>

            {/* Rename */}
            <div className="input-group">
              <label>Rename this shelf to:</label>
              <input className="modal-input" type="text" value={newShelfName} onChange={(e) => setNewShelfName(e.target.value)}/>
            </div>

            {/* Delete */}
            <div className="modal-actions-list shelf-modal">
              <img src={TrashIcon} onClick={handleDeleteShelf} className="icon-image" alt="Delete"/>
              <p>(Books will be moved to 'Want to Read')</p>
            </div>

            <hr />

            {/* Action Buttons */}
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setIsShelfModalOpen(false)}>Cancel</button>
              <button className="button" onClick={handleRenameShelf}>Save Name</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Shelves;