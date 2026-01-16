import "./Components.css";
import HeaderImage from "../assets/images/header-image.png";

function Header() {
    return (
    <header className="header">
        <img className="header-image" src={HeaderImage} alt="Design" />
    </header>
    );
}

export default Header;
