import { useTranslation } from 'react-i18next';
import './AbsentStudentsModal.css';

function initials(name) {
  return name ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '';
}

function AbsentStudentsModal({ isOpen, onClose, date, students }) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="asm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="asm-modal">
        <div className="asm-header">
          <div>
            <h2>{t('absentModal.title')}</h2>
            <p>{t('absentModal.subtitle', { count: students.length, date })}</p>
          </div>
          <button className="asm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="asm-body">
          {students.length === 0 ? (
            <p className="asm-empty">{t('absentModal.empty')}</p>
          ) : (
            <div className="asm-list">
              {students.map((s) => (
                <div className="asm-row" key={s.id}>
                  <div className="asm-avatar">{initials(s.name)}</div>
                  <div className="asm-info">
                    <div className="asm-name">{s.name}</div>
                    <div className="asm-class">{s.className}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="asm-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  );
}

export default AbsentStudentsModal;
