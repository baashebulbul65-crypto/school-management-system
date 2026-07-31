import './Navbar.css';

function Navbar({ onOpenLogin }) {
  return (
    <div className="navbar-outer">
      <nav className="navbar">
        <div className="brand">
          <svg className="brand-mark" viewBox="0 0 40 40" fill="none">
            <path d="M8 30 C8 18, 16 8, 28 8" stroke="#16C784" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <circle cx="30" cy="8" r="3" fill="#0B1F2B"/>
            <path d="M8 30 H24" stroke="#0B1F2B" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <span className="brand-name">Kayd<span className="dot">.</span></span>
        </div>

        <ul className="nav-links">
          <li><a href="#home">Guriga</a></li>
          <li><a href="#about">Ku Saabsan</a></li>
          <li><a href="#pricing">Qiimaha</a></li>
          <li><a href="#contact">Nala Soo Xiriir</a></li>
        </ul>

        <button className="cta-btn" onClick={onOpenLogin}>
          Gal Akoonkaaga
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>

        <button className="hamburger"><span></span><span></span><span></span></button>
      </nav>
    </div>
  );
}

export default Navbar;