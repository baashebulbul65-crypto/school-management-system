import './Footer.css';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-logo">
            <svg viewBox="0 0 40 40" fill="none">
              <path d="M8 30 C8 18, 16 8, 28 8" stroke="#16C784" strokeWidth="4" strokeLinecap="round" fill="none"/>
              <circle cx="30" cy="8" r="3" fill="#16C784"/>
              <path d="M8 30 H24" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round"/>
            </svg>
            <span>Kayd<span className="dot">.</span></span>
          </div>
          <p>Nidaam maamul dugsi oo cloud-based ah, loogu talagalay dugsiyada Soomaaliyeed si ay xogtooda ugu maamulaan hal meel oo fudud.</p>

          <div className="footer-social">
            <a href="#" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.87-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.8-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0022 12z"/></svg>
            </a>
            <a href="#" aria-label="WhatsApp">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38c1.45.79 3.08 1.21 4.75 1.21 5.46 0 9.91-4.45 9.91-9.91C21.94 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.93-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.18-.27.36-.22.6-.13.24.09 1.55.73 1.82.86.27.13.44.19.51.3.07.11.07.62-.17 1.3z"/></svg>
            </a>
            <a href="#" aria-label="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.6-.46-5.32a2.9 2.9 0 00-2.04-2.05C18.79 4.17 12 4.17 12 4.17s-6.79 0-8.5.46A2.9 2.9 0 001.46 6.68C1 8.4 1 12 1 12s0 3.6.46 5.32a2.9 2.9 0 002.04 2.05c1.71.46 8.5.46 8.5.46s6.79 0 8.5-.46a2.9 2.9 0 002.04-2.05C23 15.6 23 12 23 12zM9.75 15.5v-7l6 3.5-6 3.5z"/></svg>
            </a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Nidaamka</h4>
          <ul>
            <li><a href="#">Waxa Uu Ku Sarreeyo</a></li>
            <li><a href="#">Sida Uu U Shaqeeyo</a></li>
            <li><a href="#">Qiimaha</a></li>
            <li><a href="#">Su&apos;aalaha Guud</a></li>
          </ul>
        </div>

        <div className="footer-links">
          <h4>Shirkadda</h4>
          <ul>
            <li><a href="#">Nagu Saabsan</a></li>
            <li><a href="#">Xiriirka</a></li>
            <li><a href="#">Blog-ga</a></li>
            <li><a href="#">Shaqooyinka</a></li>
          </ul>
        </div>

        <div className="footer-contact">
          <h4>Nala Soo Xiriir</h4>
          <ul>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.68 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.32 1.85.55 2.81.68A2 2 0 0122 16.92z"/></svg>
              +252 61 234 5678
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4V4z"/><path d="M22 6l-10 7L2 6"/></svg>
              hello@kayd.com
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Hargeysa, Somaliland
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {year} Kayd. Dhammaan xuquuqda way dhowran tahay.</p>
        <div className="footer-legal">
          <a href="#">Sharciga Asturnaanta</a>
          <a href="#">Shuruudaha Adeegga</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;