import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ArchiveStudentModal.css';

function ArchiveStudentModal({ isOpen, onClose, onConfirm, student }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState('graduated');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatus('graduated');
      setNote('');
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(status, note);
    onClose();
  };

  return (
    <div className="arcm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="arcm-modal">
        <div className="arcm-header">
          <div>
            <h2>{t('students.archive.modal.title')}</h2>
            <p>{student?.fullName}</p>
          </div>
          <button className="arcm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="arcm-body">
            <div className="arcm-field">
              <label>{t('students.archive.modal.statusLabel')}</label>
              <div className="arcm-status-options">
                <button
                  type="button"
                  className={`arcm-status-btn${status === 'graduated' ? ' active' : ''}`}
                  onClick={() => setStatus('graduated')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>
                  {t('students.archive.modal.graduated')}
                </button>
                <button
                  type="button"
                  className={`arcm-status-btn${status === 'withdrawn' ? ' active' : ''}`}
                  onClick={() => setStatus('withdrawn')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  {t('students.archive.modal.withdrawn')}
                </button>
              </div>
            </div>
            <div className="arcm-field">
              <label>{t('students.archive.modal.noteLabel')}</label>
              <textarea
                rows="3"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('students.archive.modal.notePlaceholder')}
              />
            </div>
            <p className="arcm-hint">{t('students.archive.modal.hint')}</p>
          </div>

          <div className="arcm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">{t('students.archive.modal.confirm')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ArchiveStudentModal;
