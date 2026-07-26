import NotificationBell from './NotificationBell';
import './Topbar.css';

function Topbar({ title, onMenuClick }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-btn" onClick={onMenuClick}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
        <h1>{title}</h1>
      </div>

      <div className="topbar-right">
        <div className="topbar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" placeholder="Raadi..." />
        </div>

        <NotificationBell />
      </div>
    </header>
  );
}

export default Topbar;