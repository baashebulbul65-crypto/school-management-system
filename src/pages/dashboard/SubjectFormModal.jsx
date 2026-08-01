import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './SubjectFormModal.css';

const EMPTY_FORM = {
  name: '',
  code: '',
  teacherId: '',
  credit: '',
  weeklyHours: '',
};

function SubjectFormModal({ isOpen, onClose, onSave, subject, teachers = [] }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const isEditing = !!subject;

  useEffect(() => {
    if (subject) {
      setForm({
        name: subject.name || '',
        code: subject.code || '',
        teacherId: subject.teacherId || '',
        credit: subject.credit || '',
        weeklyHours: subject.weeklyHours || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [subject, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.teacherId) {
      setError(t('subjects.form.errorNoTeacher'));
      return;
    }

    const payload = {
      name: form.name,
      code: form.code,
      teacherId: form.teacherId,
      credit: Number(form.credit) || 0,
      weeklyHours: Number(form.weeklyHours) || 0,
    };

    onSave(payload, subject?.id);
    onClose();
  };

  return (
    <div className="sjfm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sjfm-modal">
        <div className="sjfm-header">
          <div>
            <h2>{isEditing ? t('subjects.form.editTitle') : t('subjects.form.addTitle')}</h2>
            <p>{isEditing ? subject.code : t('subjects.form.fillInfo')}</p>
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
                <label>{t('subjects.form.fields.name')}</label>
                <input type="text" value={form.name} onChange={update('name')} placeholder={t('subjects.form.placeholders.name')} required />
              </div>
              <div className="sjfm-field">
                <label>{t('subjects.form.fields.code')}</label>
                <input type="text" value={form.code} onChange={update('code')} placeholder={t('subjects.form.placeholders.code')} required />
              </div>
              <div className="sjfm-field">
                <label>{t('subjects.form.fields.teacher')}</label>
                <select value={form.teacherId} onChange={update('teacherId')} required disabled={teachers.length === 0}>
                  <option value="" disabled>
                    {teachers.length === 0 ? t('subjects.form.placeholders.noTeachers') : t('subjects.form.placeholders.selectTeacher')}
                  </option>
                  {teachers.map((tc) => (
                    <option key={tc.id} value={tc.id}>{tc.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="sjfm-field">
                <label>{t('subjects.form.fields.credit')}</label>
                <input type="number" value={form.credit} onChange={update('credit')} placeholder={t('subjects.form.placeholders.credit')} />
              </div>
              <div className="sjfm-field">
                <label>{t('subjects.form.fields.weeklyHours')}</label>
                <input type="number" value={form.weeklyHours} onChange={update('weeklyHours')} placeholder={t('subjects.form.placeholders.weeklyHours')} />
              </div>
            </div>

          </div>

          <div className="sjfm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">
              {isEditing ? t('common.save') : t('subjects.form.submitAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubjectFormModal;
