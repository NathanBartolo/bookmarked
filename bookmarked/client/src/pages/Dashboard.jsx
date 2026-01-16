import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Component Imports
import Header from "../components/Header.jsx";
import HorizontalLine from "../components/HorizontalLine.jsx";

// Asset Imports
import BackgroundImage from "../assets/images/background-image.png"; 
import RotatingImage from "../assets/images/rotating-image.png"; 
import EditImage from "../assets/images/edit-icon.png"; 

// Style Imports
import '../style/Dashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Dashboard = ({ triggerAlert }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- MODAL STATE ---
  // manages visibility and form data for the account settings popup
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nickname: "", 
    bio: "",
    favoriteGenre: "",
    goal: 0 
  });

  // manages visibility and form data for the reading diary editor
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null); 
  const [diaryForm, setDiaryForm] = useState({
    notes: "",
    quotes: "",
    rating: 0,
    dateRead: ""
  });

  // fetch user data and bookshelf on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // pulls the authenticated user profile and their full library from the backend
  const fetchData = async () => {
    try {
      const userRes = await axios.get(`${API_BASE_URL}/auth/user`, { withCredentials: true });
      if (userRes.data && userRes.data.email) {
        setUser(userRes.data);
        setProfileForm({
          nickname: userRes.data.nickname || "", 
          bio: userRes.data.bio || "",
          favoriteGenre: userRes.data.favoriteGenre || "",
          goal: userRes.data.goal 
        });
      } else {
        setUser(null);
      }
      const bookRes = await axios.get(`${API_BASE_URL}/api/bookshelf`, { withCredentials: true });
      setBooks(bookRes.data);
    } catch (err) {
      setUser(null); 
    } finally {
      setLoading(false);
    }
  };

  // submits updated profile information to the database
  const handleSaveProfile = async () => {
    try {
      const res = await axios.put(`${API_BASE_URL}/auth/update-profile`, profileForm, { withCredentials: true });
      setUser(res.data); 
      setIsProfileModalOpen(false);
      triggerAlert("Profile updated!");
    } catch (err) {
      triggerAlert("Failed to update profile.");
    }
  };

  // --- DELETE ACCOUNT LOGIC ---
  // handles account deletion with a confirmation prompt
  const handleDeleteAccount = () => {
    triggerAlert("Are you sure? This will permanently delete your account and all your book data.", async () => {
      try {
        await axios.delete(`${API_BASE_URL}/auth/delete-account`, { withCredentials: true });
        // Redirect to home after deletion
        window.location.href = "/";
      } catch (err) {
        triggerAlert("Error deleting account. Please try again.");
      }
    });
  };

  // opens the diary modal and pre-fills it with existing data for the selected book
  const openEditDiary = (book) => {
    setEditingEntry(book);
    setDiaryForm({
      notes: book.notes || "",
      quotes: book.quotes || "",
      rating: book.rating || 0,
      dateRead: book.dateRead ? book.dateRead.split('T')[0] : ""
    });
    setIsDiaryModalOpen(true);
  };

  // saves diary notes, quotes, and ratings to the specific book entry
  const handleSaveDiary = async () => {
    if (!editingEntry) return;
    try {
      const updatedBooks = books.map(b => b._id === editingEntry._id ? { ...b, ...diaryForm } : b);
      setBooks(updatedBooks);
      setIsDiaryModalOpen(false);
      await axios.put(`${API_BASE_URL}/api/bookshelf/${editingEntry._id}`, diaryForm, { withCredentials: true });
      triggerAlert("Entry saved!");
    } catch (err) {
      fetchData(); 
    }
  };

  // clears a diary entry while keeping the book on the user's shelf
  const handleDeleteEntry = () => {
    if (!editingEntry) return;
    triggerAlert("Clear this diary entry? The book will remain on your shelf.", async () => {
        try {
          const emptyData = { notes: "", quotes: "", rating: 0, dateRead: null };
          const updatedBooks = books.map(b => b._id === editingEntry._id ? { ...b, ...emptyData } : b);
          setBooks(updatedBooks);
          setIsDiaryModalOpen(false);
          await axios.put(`${API_BASE_URL}/api/bookshelf/${editingEntry._id}`, emptyData, { withCredentials: true });
          triggerAlert("Entry cleared.");
        } catch (err) {
          fetchData();
        }
    });
  };

  // loading state shown during initial data fetch
  if (loading) return <div className="loading-screen">
    <img className="static-rotating-image" src={RotatingImage} alt="Loading" />
    <p>Dusting off the archives...</p>
  </div>;

  // login prompt shown if no authenticated session is found
  if (!user) {
    return (
      <div className="container">
        <Header />
        <HorizontalLine />
        <div className="bounce-message">
            <img className="scroll-rotating-image" src={RotatingImage} alt="Login Required" />
            <h2>Please Log In</h2>
            <p>You need to be logged in to view your dashboard.</p>
            <button className="button bounce-button" onClick={() => window.location.href = `${API_BASE_URL}/auth/google`}></button>
        </div>
      </div>
    );
  }

  // filter logic for top picks and reading diary feed
  const topFour = books.filter(b => b.isTopPick === true).slice(0, 4);
  const diaryEntries = books.filter(b => b.notes || b.quotes || b.rating > 0);
  const totalReadCount = books.filter(b => b.shelf === 'Read' || b.shelf === 'Completed').length;

  // split diary entries for the masonry layout
  const leftColumn = diaryEntries.filter((_, index) => index % 2 === 0);
  const rightColumn = diaryEntries.filter((_, index) => index % 2 !== 0);

  // helper function to render individual diary cards
  const renderDiaryCard = (entry) => (
    <div key={entry._id} className="diary-card">
      <div className='diary-content-top'>
        <div className="entry-cover">
          <img src={entry.coverImage} alt={entry.title} />
        </div>
        <div className="entry-details">
          <h3 className='entry-title'>{entry.title}</h3>
          <p className='entry-notes'>{entry.notes}</p>
          <p className='entry-date'>{entry.dateRead ? new Date(entry.dateRead).toLocaleDateString() : ""}</p>
        </div>
      </div>
      
      <div className="diary-content-bottom">
        {entry.quotes && <p><strong>Quotes:</strong><br />{entry.quotes}</p>}
        {entry.rating > 0 && <p><strong>Rating:</strong> {entry.rating}/10</p>}
      </div>

      <img 
        className="icon-image edit-diary-button" 
        onClick={() => openEditDiary(entry)} 
        src={EditImage} 
        alt="Edit" 
      />
    </div>
  );

  return (
    <div className="container">
      {/* User Profile */}
      <header>
        <h1 className="greeting">HEY, {user.nickname ? user.nickname : (user.displayName ? user.displayName.toUpperCase().split(' ')[0] : 'READER')}</h1>
        <div className="account-stats">
          <div className="stat-left">
            <p>{user.bio ||""}</p>
            <p><span>Favorite Genre:</span> {user.favoriteGenre || ""}</p>
          </div>
          <div className="stat-right">
            <p><span>Goal:</span> {user.goal || 0}</p>
            <p><span>Total Read:</span> {totalReadCount}</p>
          </div>
        </div>
        <div className="user-settings">  
          <button className="button" onClick={() => setIsProfileModalOpen(true)}>Account Settings</button>
          {user.role === 'admin' && <button className="button admin-button" onClick={() => navigate('/admin')}>Admin Panel</button>}
        </div>
      </header>

      {/* Top Picks */}
      <section>
        <h1 className="section-title">My Top 4</h1>
        <hr />
        <div className="books-container top-four-container">
          {topFour.map((book) => (
            <div key={book._id} className="book-card">
              <div className="book-cover-wrapper" style={{ backgroundImage: `url(${BackgroundImage})` }}>
                <img src={book.coverImage || "https://placehold.co/128x190"} alt={book.title} />
              </div>
              <div className="book-details"><h3>{book.title}</h3><p>{book.authors?.[0] || "Unknown"}</p></div>
            </div>
          ))}
        </div>
        {topFour.length === 0 && <p className="empty-message">Which stories defined you? Heart books in your shelves.</p>}
      </section>

      <HorizontalLine />

      {/* Reading Diary */}
      <section>
        <h1 className="section-title">Reading Diary</h1>
        <hr />
        {diaryEntries.length === 0 ? (
          <p className="empty-message">A clean page is a beautiful start. Why not add your first review?</p>
        ) : (
          <div className="diary-masonry-feed">
            <div className="masonry-column">{leftColumn.map(renderDiaryCard)}</div>
            <div className="masonry-column">{rightColumn.map(renderDiaryCard)}</div>
          </div>
        )}
      </section>

      <HorizontalLine />

      {/* Modal: Account Settings */}
      {isProfileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Profile</h3>
            
            <label>Nickname:</label>
            <input className="modal-input" type="text" value={profileForm.nickname} onChange={(e) => setProfileForm({...profileForm, nickname: e.target.value})} />
            
            <label>Bio:</label>
            <input className="modal-input" type="text" value={profileForm.bio} onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})} />
            
            <label>Goal:</label>
            <input className="modal-input" type="number" value={profileForm.goal} onChange={(e) => setProfileForm({...profileForm, goal: e.target.value})} />
            
            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setIsProfileModalOpen(false)}>Cancel</button>
              <button className="button" onClick={handleSaveProfile}>Save</button>
              <button className="button diary-delete-button" onClick={handleDeleteAccount}>Delete Account</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Diary Entries */}
      {isDiaryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Editing Entry: {editingEntry?.title}</h3>
            <label>Notes:</label>
            <textarea className="diary-note-input modal-input" rows="3" value={diaryForm.notes} onChange={(e) => setDiaryForm({...diaryForm, notes: e.target.value})} />
            <label>Quotes:</label>
            <textarea className="diary-quote-input modal-input" rows="3" value={diaryForm.quotes} onChange={(e) => setDiaryForm({...diaryForm, quotes: e.target.value})} />
            
            <div style={{display: 'flex', gap: '20px'}}>
              <div style={{flex: 1}}>
                <label>Date Read:</label>
                <input className="modal-input" type="date" value={diaryForm.dateRead} onChange={(e) => setDiaryForm({...diaryForm, dateRead: e.target.value})} />
              </div>
              <div style={{flex: 1}}>
                <label>Rating (0-10):</label>
                <input className="modal-input" type="number" min="0" max="10" value={diaryForm.rating} onChange={(e) => setDiaryForm({...diaryForm, rating: e.target.value})} />
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setIsDiaryModalOpen(false)}>Cancel</button>
              <button className="button" onClick={handleSaveDiary}>Save Changes</button>
              <button className="button diary-delete-button" onClick={handleDeleteEntry}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;