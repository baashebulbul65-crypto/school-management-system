import { useState, useEffect } from 'react';
import './ExamFormModal.css';

const EMPTY_FORM = { type: 'Midterm', subject: '', className: '', date: '', maxMarks: '' };

function ExamFormModal({ isOpen, onClose, onSave, exam, examTypes }) {
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
            <h2>{isEditing ? 'Wax Ka Beddel Imtixaanka' : 'Abuur Imtixaan Cusub'}</h2>
            <p>Buuxi macluumaadka hoose</p>
          </div>
          <button className="exfm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="exfm-body">
            <div className="exfm-grid">
              <div className="exfm-field">
                <label>Nooca Imtixaanka *</label>
                <select value={form.type} onChange={update('type')}>
                  {examTypes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="exfm-field">
                <label>Maadada *</label>
                <input type="text" value={form.subject} onChange={update('subject')} placeholder="Tusaale: Xisaabta" required />
              </div>
              <div className="exfm-field">
                <label>Fasalka *</label>
                <input type="text" value={form.className} onChange={update('className')} placeholder="Tusaale: Form 1A" required />
              </div>
              <div className="exfm-field">
                <label>Taariikhda</label>
                <input type="date" value={form.date} onChange={update('date')} />
              </div>
              <div className="exfm-field full">
                <label>Buundooyinka Guud (Max Marks) *</label>
                <input type="number" value={form.maxMarks} onChange={update('maxMarks')} placeholder="Tusaale: 100" required />
              </div>
            </div>
          </div>

          <div className="exfm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Jooji</button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Kaydi Isbeddelka' : 'Abuur Imtixaanka'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExamFormModal;