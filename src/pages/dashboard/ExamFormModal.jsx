import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './ExamFormModal.css';

const EMPTY_FORM = { type: 'Midterm', subject: '', className: '', date: '', maxMarks: '' };

function ExamFormModal({ isOpen, onClose, onSave, exam, examTypes }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const isEditing = !!exam;

  useEffect(() => {
    if (exam) {
      setForm({
        type: exam.type,
        subject: exam.subject,
        className: exam.className,
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
    onSave({ ...form, maxMarks: Number(form.maxMarks) || 100 }, exam?.id);
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
                <input type="text" value={form.subject} onChange={update('subject')} placeholder={t('exams.form.placeholders.subject')} required />
              </div>
              <div className="exfm-field">
                <label>{t('exams.form.fields.className')}</label>
                <input type="text" value={form.className} onChange={update('className')} placeholder={t('exams.form.placeholders.className')} required />
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
