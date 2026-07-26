import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationsContext';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import './NotificationBell.css';

const TYPE_META = {
  fee: { color: 'orange', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>) },
  attendance: { color: 'red', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>) },
  exam: { color: 'purple', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>) },
  message: { color: 'blue', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>) },
  system: { color: 'navy', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>) },
};

function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const recent = notifications.slice(0, 6);

  const handleItemClick = (notif) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/dashboard/notifications');
  };

  return (
    <div className="nb-wrap" ref={panelRef}>
      <button className="icon-btn" onClick={() => setIsOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>
        {unreadCount > 0 && <span className="notif-dot"></span>}
      </button>

      {isOpen && (
        <div className="nb-panel">
          <div className="nb-panel-head">
            <h3>Ogeysiisyada</h3>
            {unreadCount > 0 && (
              <button className="nb-mark-all" onClick={markAllAsRead}>Calaamadee Dhammaan</button>
            )}
          </div>

          <div className="nb-list">
            {recent.length === 0 && <div className="nb-empty">Ogeysiis lama helin.</div>}
            {recent.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.system;
              return (
                <button key={n.id} className={`nb-item ${!n.read ? 'unread' : ''}`} onClick={() => handleItemClick(n)}>
                  <div className={`nb-item-icon ${meta.color}`}>{meta.icon}</div>
                  <div className="nb-item-body">
                    <div className="nb-item-title">{n.title}</div>
                    <div className="nb-item-desc">{n.description}</div>
                    <div className="nb-item-time">{formatRelativeTime(n.time)}</div>
                  </div>
                  {!n.read && <span className="nb-item-unread-dot"></span>}
                </button>
              );
            })}
          </div>

          <button className="nb-view-all" onClick={handleViewAll}>Fiiri Dhammaan Ogeysiisyada</button>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;