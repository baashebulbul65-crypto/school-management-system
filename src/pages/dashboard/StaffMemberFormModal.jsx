import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './SubjectFormModal.css';

const EMPTY_FORM = { name: '', sub: '' };

function StaffMemberFormModal({ isOpen, onClose, onSave, member }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const isEditing = !!member;

  useEffect(() => {
    setForm(member ? { name: member.name || '', sub: member.sub || '' } : EMPTY_FORM);
    setError('');
  }, [member, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(t('attendance.staff.form.errors.nameRequired'));
      return;
    }
    onSave({ name: form.name.trim(), sub: form.sub.trim() }, member?.id);
    onClose();
  };

  return (
    <div className="sjfm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sjfm-modal">
        <div className="sjfm-header">
          <div>
            <h2>{isEditing ? t('attendance.staff.form.editTitle') : t('attendance.staff.form.addTitle')}</h2>
            <p>{t('attendance.staff.form.subtitle')}</p>
          </div>
          <button className="sjfm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sjfm-body">
            {error && <div className="sjfm-error">{error}</div>}

            <div className="sjfm-grid">
              <div className="sjfm-field full">
                <label>{t('attendance.staff.form.fields.name')}</label>
                <input type="text" value={form.name} onChange={update('name')} placeholder={t('attendance.staff.form.placeholders.name')} required />
              </div>
              <div className="sjfm-field full">
                <label>{t('attendance.staff.form.fields.role')}</label>
                <input type="text" value={form.sub} onChange={update('sub')} placeholder={t('attendance.staff.form.placeholders.role')} />
              </div>
            </div>
          </div>

          <div className="sjfm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('attendance.staff.form.cancel')}</button>
            <button type="submit" className="btn-primary">{isEditing ? t('attendance.staff.form.submitEdit') : t('attendance.staff.form.submitAdd')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StaffMemberFormModal;
