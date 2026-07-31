import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotifications } from '../../context/NotificationsContext';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import '../../styles/dashboard-shared.css';
import './Notifications.css';

const FILTER_IDS = ['all', 'unread', 'fee', 'absent', 'exam', 'message', 'system'];

const TYPE_META = {
  fee: { color: 'orange', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>) },
  absent: { color: 'red', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>) },
  exam: { color: 'purple', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>) },
  message: { color: 'blue', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>) },
  system: { color: 'navy', icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>) },
};

function Notifications() {
  const { t } = useTranslation();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();
  const FILTERS = FILTER_IDS.map((id) => ({ id, label: t(`notifications.filters.${id}`) }));

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleItemClick = (notif) => {
    markAsRead(notif.id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('notifications.title')}</h2>
          <p>{t('notifications.subtitle')}</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={markAllAsRead}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            {t('notifications.markAllRead')} ({unreadCount})
          </button>
        )}
      </div>

      <div className="notif-filter-tabs">
        {FILTERS.map((f) => (
          <button key={f.id} className={`notif-filter-tab ${filter === f.id ? 'active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="dash-card">
        <div className="notif-full-list">
          {filtered.length === 0 && (
            <div className="notif-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>
              <p>{t('notifications.emptyFiltered')}</p>
            </div>
          )}

          {filtered.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.system;
            return (
              <div key={n.id} className={`notif-full-item ${!n.read ? 'unread' : ''}`}>
                <button className="notif-full-main" onClick={() => handleItemClick(n)}>
                  <div className={`notif-full-icon ${meta.color}`}>{meta.icon}</div>
                  <div className="notif-full-body">
                    <div className="notif-full-top">
                      <span className="notif-full-title">{n.title}</span>
                      <span className={`badge-tag ${meta.color}`}>{t(`notifications.types.${n.type}.label`, n.type)}</span>
                    </div>
                    <p className="notif-full-desc">{n.description}</p>
                    <span className="notif-full-time">{formatRelativeTime(n.time)}</span>
                  </div>
                  {!n.read && <span className="notif-full-unread-dot"></span>}
                </button>
                <button className="notif-delete-btn" title={t('notifications.delete')} onClick={() => deleteNotification(n.id)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Notifications;