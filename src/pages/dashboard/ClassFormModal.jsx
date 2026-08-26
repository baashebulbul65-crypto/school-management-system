import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ClassFormModal.css';

const EMPTY_FORM = {
  grade: '',
  section: 'A',
  room: '',
  capacity: '',
  classTeacherId: '',
  subjectIds: [],
  session: 'subax',
};

function ClassFormModal({ isOpen, onClose, onSave, cls, teachers = [], subjects = [] }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const isEditing = !!cls;

  useEffect(() => {
    if (cls) {
      setForm({
        grade: cls.grade || '',
        section: cls.section || 'A',
        room: cls.room || '',
        capacity: cls.capacity || '',
        classTeacherId: cls.classTeacherId || '',
        subjectIds: cls.subjectIds || [],
        // Fasallada hore ee la abuuray ka hor field-kan (Classes audit,
        // 2026-08-26) ma laha "session" — waxay noqonayaan "subax" default
        // ahaan ilaa Owner-ku dib u eego oo kaydiyo (fiiri Classes.jsx: isla
        // fallback-ka ayaa lagu muujiyaa kaadhka, si aan xogta jirta u jajabin).
        session: cls.session || 'subax',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [cls, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubjectsChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
    setForm((f) => ({ ...f, subjectIds: selected }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.classTeacherId) {
      setError(t('classes.form.errorNoTeacher'));
      return;
    }

    const payload = {
      grade: form.grade,
      section: form.section,
      room: form.room,
      capacity: Number(form.capacity) || 0,
      classTeacherId: form.classTeacherId,
      subjectIds: form.subjectIds,
      session: form.session,
    };

    onSave(payload, cls?.id);
    onClose();
  };

  return (
    <div className="cfm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cfm-modal">
        <div className="cfm-header">
          <div>
            <h2>{isEditing ? t('classes.form.editTitle') : t('classes.form.addTitle')}</h2>
            <p>{isEditing ? `${cls.grade} - ${cls.section}` : t('classes.form.fillInfo')}</p>
          </div>
          <button className="cfm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="cfm-body">

            {error && <div className="cfm-error">{error}</div>}

            <div className="cfm-grid">
              <div className="cfm-field">
                <label>{t('classes.form.fields.grade')}</label>
                <input type="text" value={form.grade} onChange={update('grade')} placeholder={t('classes.form.placeholders.grade')} required />
              </div>
              <div className="cfm-field">
                <label>{t('classes.form.fields.section')}</label>
                <select value={form.section} onChange={update('section')}>
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                  <option>D</option>
                </select>
              </div>
              <div className="cfm-field">
                <label>{t('classes.form.fields.session')}</label>
                <select value={form.session} onChange={update('session')} required>
                  <option value="subax">{t('classes.session.subax')}</option>
                  <option value="galab">{t('classes.session.galab')}</option>
                </select>
              </div>
              <div className="cfm-field">
                <label>{t('classes.form.fields.room')}</label>
                <input type="text" value={form.room} onChange={update('room')} placeholder={t('classes.form.placeholders.room')} />
              </div>
              <div className="cfm-field">
                <label>{t('classes.form.fields.capacity')}</label>
                <input type="number" value={form.capacity} onChange={update('capacity')} placeholder={t('classes.form.placeholders.capacity')} required />
              </div>
              <div className="cfm-field full">
                <label>{t('classes.form.fields.classTeacher')}</label>
                <select value={form.classTeacherId} onChange={update('classTeacherId')} required disabled={teachers.length === 0}>
                  <option value="" disabled>
                    {teachers.length === 0 ? t('classes.form.placeholders.noTeachers') : t('classes.form.placeholders.selectTeacher')}
                  </option>
                  {teachers.map((tc) => (
                    <option key={tc.id} value={tc.id}>{tc.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="cfm-field full">
                <label>{t('classes.form.fields.subjects')}</label>
                <select
                  multiple
                  value={form.subjectIds}
                  onChange={handleSubjectsChange}
                  size={Math.min(6, Math.max(3, subjects.length))}
                  disabled={subjects.length === 0}
                >
                  {subjects.length === 0 && (
                    <option value="" disabled>{t('classes.form.placeholders.noSubjects')}</option>
                  )}
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          <div className="cfm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">
              {isEditing ? t('common.save') : t('classes.form.submitAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClassFormModal;
