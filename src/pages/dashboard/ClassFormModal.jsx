import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ClassFormModal.css';

const EMPTY_FORM = {
  grade: '',
  section: 'A',
  room: '',
  capacity: '',
  classTeacherId: '',
  subjects: '',
};

function ClassFormModal({ isOpen, onClose, onSave, cls, teachers = [] }) {
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
        subjects: (cls.subjects || []).join(', '),
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [cls, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.classTeacherId) {
      setError(t('classes.form.errorNoTeacher'));
      return;
    }

    const subjectsArray = form.subjects.split(',').map((s) => s.trim()).filter(Boolean);

    const payload = {
      grade: form.grade,
      section: form.section,
      room: form.room,
      capacity: Number(form.capacity) || 0,
      classTeacherId: form.classTeacherId,
      subjects: subjectsArray,
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
                <input type="text" value={form.subjects} onChange={update('subjects')} placeholder={t('classes.form.placeholders.subjects')} />
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
