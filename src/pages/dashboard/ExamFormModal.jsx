import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useClassOptions, classroomName } from '../../hooks/useClassOptions';
import './ExamFormModal.css';

const EMPTY_FORM = { type: 'Midterm', subjectId: '', classId: '', date: '', maxMarks: '' };

function ExamFormModal({ isOpen, onClose, onSave, exam, examTypes, subjects = [], classes = [] }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const isEditing = !!exam;
  const classOptions = useClassOptions(form.classId, { byId: true });

  useEffect(() => {
    if (exam) {
      setForm({
        type: exam.type,
        subjectId: exam.subjectId || '',
        classId: exam.classId || '',
        date: exam.date,
        maxMarks: exam.maxMarks,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [exam, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // "subject"/"className" waxaa laga soo saaraa subjectId/classId la doortay —
    // waxaa loo baahan yahay in ay sii jiraan (denormalized) meelaha kale ee
    // isticmaala (Reports.jsx, iwm). Fiiri SchoolDataContext.jsx: updateClass/
    // updateSubject waxay si otomaatig ah u cusboonaysiiyaan marka la beddelo.
    const selectedSubject = subjects.find((s) => s.id === form.subjectId);
    const selectedClass = classes.find((c) => c.id === form.classId);
    onSave({
      ...form,
      subject: selectedSubject?.name || '',
      className: selectedClass ? classroomName(selectedClass) : '',
      maxMarks: Number(form.maxMarks) || 100,
    }, exam?.id);
    onClose();
  };

  return (
    <div className="exfm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="exfm-modal">
        <div className="exfm-header">
          <div>
            <h2>{isEditing ? t('exams.form.editTitle') : t('exams.form.addTitle')}</h2>
            <p>{t('exams.form.fillInfo')}</p>
          </div>
          <button className="exfm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="exfm-body">
            <div className="exfm-grid">
              <div className="exfm-field">
                <label>{t('exams.form.fields.type')}</label>
                <select value={form.type} onChange={update('type')}>
                  {examTypes.map((tp) => <option key={tp} value={tp}>{t(`exams.types.${tp}`, tp)}</option>)}
                </select>
              </div>
              <div className="exfm-field">
                <label>{t('exams.form.fields.subject')}</label>
                <select value={form.subjectId} onChange={update('subjectId')} required disabled={subjects.length === 0}>
                  <option value="" disabled>
                    {subjects.length === 0 ? t('exams.form.placeholders.noSubjects') : t('exams.form.placeholders.subject')}
                  </option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="exfm-field">
                <label>{t('exams.form.fields.className')}</label>
                <select value={form.classId} onChange={update('classId')} required disabled={classOptions.length === 0}>
                  <option value="" disabled>
                    {classOptions.length === 0 ? t('exams.form.placeholders.noClasses') : t('exams.form.placeholders.className')}
                  </option>
                  {classOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="exfm-field">
                <label>{t('exams.form.fields.date')}</label>
                <input type="date" value={form.date} onChange={update('date')} />
              </div>
              <div className="exfm-field full">
                <label>{t('exams.form.fields.maxMarks')}</label>
                <input type="number" value={form.maxMarks} onChange={update('maxMarks')} placeholder={t('exams.form.placeholders.maxMarks')} required />
              </div>
            </div>
          </div>

          <div className="exfm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">
              {isEditing ? t('common.save') : t('exams.form.submitAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExamFormModal;
