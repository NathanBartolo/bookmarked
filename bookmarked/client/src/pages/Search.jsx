import { useState, useEffect, useCallback } from "react"; 
import { Link } from "react-router-dom";
import axios from "axios";

// Asset Imports
import RotatingImage from "../assets/images/rotating-image.png"; 
import BackgroundImage from "../assets/images/background-image.png";
import SearchImage from "../assets/images/search-icon.png";

// Component Imports
import Header from "../components/Header.jsx";
import HorizontalLine from "../components/HorizontalLine.jsx";  
import Pagination from "../components/Pagination.jsx"; 

// Style Imports
import "../style/Search.css";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const BOOKS_PER_PAGE = 20;

function Search({ triggerAlert }) {
  
  // store book data and search filters
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("fiction");
  const [page, setPage] = useState(1);
  const [numFound, setNumFound] = useState(0);

  // logic to wait for the user to stop typing before searching
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // reset page to 1 whenever search text or category changes
  useEffect(() => setPage(1), [debouncedQuery, category]);

  // handle search button click or enter key
  const handleSearchSubmit = () => {
    setDebouncedQuery(query);
    setPage(1);
  };

  // create the link for the api call based on search or category
  const buildApiUrl = useCallback(() => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", BOOKS_PER_PAGE);
    
    if (debouncedQuery.trim()) {
      params.set("q", debouncedQuery.trim());
    } else {
      params.set("subject", category);
    }
    
    return `${BACKEND_URL}/api/search-books?${params.toString()}`;
  }, [page, debouncedQuery, category]);

  // fetch book data from the backend
  const fetchBooks = useCallback(async () => {
    try {
      const url = buildApiUrl();
      const res = await axios.get(url, { withCredentials: true });
      
      const docs = res.data.docs || [];
      const totalHits = res.data.numFound ? Number(res.data.numFound) : docs.length;
      
      // sort books by the newest release year
      const sorted = docs.sort((a, b) => (b.first_publish_year || 0) - (a.first_publish_year || 0));
      
      setBooks(sorted); 
      setNumFound(Math.min(totalHits, 1000));
    } catch (err) {
      triggerAlert("Our catalog is a bit messy right now. Please try again later.");
      setBooks([]);
    }
  }, [buildApiUrl, triggerAlert]);

  // trigger fetchBooks whenever the built url changes
  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  // calculate the last page number for pagination
  const lastPage = Math.min(Math.ceil(numFound / BOOKS_PER_PAGE), 50);

  return (
    <div className="container">
      {/* Search Page Header */}
      <Header />
      <HorizontalLine />
      
      <div className="page-container">
        <h1 className="section-title">Discover</h1>
        <hr />
        
        {/* Search Controls - genre filters and search bar */}
        <div className="search-controls"> 
          <div className="genre-filters">
            <select value={category} onChange={(e) => setCategory(e.target.value)}> 
              <option value="fiction">All</option> 
              <option value="romance">Romance</option> 
              <option value="mystery">Mystery</option> 
              <option value="fantasy">Fantasy</option> 
              <option value="nonfiction">Non-Fiction</option> 
            </select> 
          </div>

          <div className="search-input-wrapper">
            <input 
              className="search-input"
              type="text" 
              placeholder="Search books by title or author..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit(); 
              }}
            />
            <img className="icon-image" onClick={handleSearchSubmit}
              src={SearchImage}  
              alt="Search"
            />
          </div>
        </div> 

        {/* Books Grid */}
        <div className="books-container" key={`${category}-${page}`}> 
          {books.length > 0 ? ( 
            books.map((book, index) => ( 
              <Link 
                to={`/book/${book.key.replace("/works/", "")}`} 
                key={book.key || index} 
                className="book-card"
                style={{ animationDelay: `${index * 0.05}s` }} 
              > 
                <div 
                  className="book-cover-wrapper"
                  style={{ backgroundImage: `url(${BackgroundImage})` }}>
                
                  {book.cover_i ? (
                    <img src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`} alt={book.title} /> 
                  ) : (
                    <div className="no-cover">No Image</div>
                  )} 
                </div> 
                <div className="book-details"> 
                    <h3>{book.title}</h3> 
                    <p>{(book.author_name || []).join(", ")}</p> 
                </div>
              </Link>
            )) 
          ) : ( 
            /* Loading/No Results Message */
            <div className="no-results">
              <img className="static-rotating-image" src={RotatingImage} alt="Empty Library" />
              <p>Even our librarians are stumped. Please wait a moment.</p>
            </div>
          )} 
        </div> 

        {/* Pagination Controls */}
        <Pagination page={page} lastPage={lastPage} setPage={setPage} />
      </div>
      <HorizontalLine />
    </div> 
  ); 
} 

export default Search;