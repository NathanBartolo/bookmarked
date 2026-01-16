import React, { useEffect } from 'react';
import { Link } from "react-router-dom";

// Asset Imports
import HeroImage from "../assets/images/home-hero.png";
import HomeBooksImage from "../assets/images/home-books-image.png";
import LaptopImage from "../assets/images/laptop-shelves-image.png";

// Component Imports
import Header from "../components/Header.jsx";
import HorizontalLine from "../components/HorizontalLine.jsx";  

// Style Imports
import "../style/Home.css";

function Home() {
    // scroll animation logic using Intersection Observer
    useEffect(() => {
        const observerOptions = {
            threshold: 0.15 
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // triggers the 'reveal' class when the section enters the viewport
                    entry.target.classList.add('reveal');
                    observer.unobserve(entry.target); 
                }
            });
        }, observerOptions);

        // target specific sections for the scroll reveal effect
        const scrollSections = document.querySelectorAll('.explore, .organize, .digitize');
        scrollSections.forEach((el) => observer.observe(el));

        // cleanup observer on component unmount
        return () => observer.disconnect();
    }, []);

    return (
        <div className="home-container">
            {/* Hero Section */}
            <img className="hero-image" src={HeroImage} alt="Design"/>

            <HorizontalLine />

            {/* Feature Section: Search and Discovery */}
            <div className="explore">
                <h2>Explore a 1,000,000+ book catalogue.</h2>
                <img className="explore-image" src={HomeBooksImage} alt="Design"/>
                <p>Through the Open Library API—bookmarked allows users to browse from <br />millions of books and see all the details at a glance.</p>
            </div>

            <hr />

            {/* Feature Section: Personal Bookshelves */}
            <div className="organize">
                <h2>Organize reads into curated shelves!</h2>
                <img className="organize-image" src={LaptopImage} alt="Design"/>
                <p>Select from the catalogue and create shelves for every <br />mood, genre, or reading phase.</p>
            </div>

            <hr />

            {/* Feature Section: Digital Reading Log */}
            <div className="digitize">
                <h2>Ditch manual diaries—go fully digital.</h2>
                <p>Set your goals, track every read, <br />and save moments you love. All in one place.</p>
                <Header />
                <Link to="/search" className="get-started-button button">
                    Get Started
                </Link>
            </div>

            <HorizontalLine />
        </div>
    );
}

export default Home;