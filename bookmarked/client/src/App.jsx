import { useEffect, useState } from 'react'; 
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Route and Page Imports
import AdminDashboard from './pages/AdminDashboard';
import Home from "./pages/Home";
import Search from "./pages/Search";
import Shelves from "./pages/Shelves";
import Dashboard from "./pages/Dashboard";
import BookDetails from "./pages/BookDetails";
import CreateProfile from "./pages/CreateProfile"; 

// Asset Imports
import EntryImage from './assets/images/entry-image.png'

// Component Imports
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// UPDATED: This variable handles the switch between local and Vercel
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  // manages the authenticated user data and global UI notifications
  const [user, setUser] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", onConfirm: null });

  // checks SessionStorage to see if the user has already passed the splash screen
  const [hasEntered, setHasEntered] = useState(sessionStorage.getItem('entered') === 'true');
  const [isExiting, setIsExiting] = useState(false);

  // handles the transition logic when entering the main App from the splash screen
  const handleEntry = () => {
    setIsExiting(true);
    sessionStorage.setItem('entered', 'true');
    setTimeout(() => {
      setHasEntered(true);
    }, 800); 
  };

  // verifies if the user has an active session on the backend
  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/user`, {
          method: "GET",
          credentials: "include", 
        });

        if (response.status === 200) {
          const data = await response.json();
          setUser(data); 
        }
      } catch (err) {
        // browsing as a guest
      }
    };
    getUser();
  }, []);

  // provides a reusable way to trigger custom modals from any child component
  const triggerAlert = (message, onConfirm = null) => {
    setAlert({ show: true, message, onConfirm });
  };

  const closeAlert = () => {
    setAlert({ show: false, message: "", onConfirm: null });
  };

  return (
    <Router>
      {/* Entry Splash Screen */}
      {!hasEntered && (
        <div 
          className={`entry-screen ${isExiting ? 'exit-fade' : ''}`} 
          onClick={handleEntry}
        >
          <div className="entry-modal">
            <img className="entry-image" src={EntryImage} alt="Entry Image" />
            <p className="entry-text">Click anywhere to enter the archives</p>
          </div>
        </div>
      )}

      <Navbar user={user} />
        
      {/* Routes */}
      <Routes>
        <Route path="/admin" element={<AdminDashboard triggerAlert={triggerAlert}/>} />
        <Route path="/" element={<Home triggerAlert={triggerAlert}/>} />
        <Route path="/search" element={<Search triggerAlert={triggerAlert}/>} />
        <Route path="/book/:olid" element={<BookDetails triggerAlert={triggerAlert} />} />
        <Route path="/shelves" element={<Shelves triggerAlert={triggerAlert} />} />
        <Route path="/dashboard" element={<Dashboard triggerAlert={triggerAlert} />} />
        <Route path="/create-profile" element={<CreateProfile triggerAlert={triggerAlert}/>} />
      </Routes>

      {/* Alert Modal */}
      {alert.show && (
        <div className="alert-overlay">
          <div className="alert-box">
            <p>{alert.message}</p>
            <div className="modal-footer">
              {/* renders different buttons based on whether a confirmation action is needed */}
              {alert.onConfirm ? (
                <>
                  <button className="cancel-button" onClick={closeAlert}>Cancel</button>
                  <button className="button" onClick={() => { alert.onConfirm(); closeAlert(); }}>Confirm</button>
                </>
              ) : (
                <button className="button" onClick={closeAlert}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer /> 
    </Router>
  );
}

export default App;