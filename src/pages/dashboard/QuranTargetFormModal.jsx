import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { todayISODate } from '../../utils/somaliDate';
import './QuranTargetFormModal.css';

function QuranTargetFormModal({ isOpen, onClose, onSave, student }) {
  const { t } = useTranslation();
  const [currentPosition, setCurrentPosition] = useState('');
  const [targetPosition, setTargetPosition] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCurrentPosition('');
      setTargetPosition('');
      setStartDate(todayISODate());
      setDeadline('');
    }
  }, [isOpen, student]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ currentPosition, targetPosition, startDate, deadline });
    onClose();
  };

  return (
    <div className="qtm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qtm-modal">
        <div className="qtm-header">
          <div>
            <h2>{t('classWorkspace.quranTargets.modal.title')}</h2>
            <p>{student?.fullName}</p>
          </div>
          <button className="qtm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="qtm-body">
            <div className="qtm-grid">
              <div className="qtm-field full">
                <label>{t('classWorkspace.quranTargets.currentPositionLabel')}</label>
                <input
                  type="text"
                  dir="auto"
                  value={currentPosition}
                  onChange={(e) => setCurrentPosition(e.target.value)}
                  placeholder={t('classWorkspace.quranTargets.currentPositionPlaceholder')}
                  required
                />
              </div>
              <div className="qtm-field full">
                <label>{t('classWorkspace.quranTargets.modal.targetLabel')}</label>
                <input
                  type="text"
                  dir="auto"
                  value={targetPosition}
                  onChange={(e) => setTargetPosition(e.target.value)}
                  placeholder={t('classWorkspace.quranTargets.modal.targetPlaceholder')}
                  required
                />
              </div>
              <div className="qtm-field">
                <label>{t('classWorkspace.quranTargets.modal.startDateLabel')}</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="qtm-field">
                <label>{t('classWorkspace.quranTargets.modal.deadlineLabel')}</label>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="qtm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('classWorkspace.quranTargets.modal.cancel')}</button>
            <button type="submit" className="btn-primary">{t('classWorkspace.quranTargets.modal.save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuranTargetFormModal;
