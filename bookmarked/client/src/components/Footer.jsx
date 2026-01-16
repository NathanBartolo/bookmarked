import { Link, useLocation } from "react-router-dom"; 

// Asset Imports
import FooterImage from "../assets/images/footer-asset.png";

// Style Imports
import "../style/Footer.css";

function Footer() {
    // get the current URL path to determine where the user is
    const location = useLocation(); 

    // hide the Footer on the profile creation page to keep the focus on onboarding
    if (location.pathname === '/create-profile') {
        return null;
    }

    return (
    <footer className="footer">
        {/* Decorative Asset */}
        <img src={FooterImage} alt="Design" />
        
        {/* Quick Links */}
        <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/search">Search</Link>
            <Link to="/shelves">Shelves</Link>
            <Link to="/dashboard">Dashboard</Link>
        </div>

        {/* Decorative Asset */}
        <img src={FooterImage} alt="Design" />
        
        {/* Branding and copyright information */}
        <h3>BOOKMARKED</h3>
        <p>© 2025 Bookmarked. All rights reserved.</p>
        <p>Made by Eana Mae Tagana</p>
    </footer>
    );
}

export default Footer;