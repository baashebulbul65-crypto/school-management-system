import { useState, useEffect } from 'react';
import './SubjectFormModal.css';

const EMPTY_FORM = {
  name: '',
  code: '',
  teacher: '',
  credit: '',
  weeklyHours: '',
};

function SubjectFormModal({ isOpen, onClose, onSave, subject }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const isEditing = !!subject;

  useEffect(() => {
    if (subject) {
      setForm({
        name: subject.name || '',
        code: subject.code || '',
        teacher: subject.teacher || '',
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

    if (!form.teacher.trim()) {
      setError('Maadadu waa in ay leedahay Macallin (Teacher) loo xilsaaray.');
      return;
    }

    const payload = {
      name: form.name,
      code: form.code,
      teacher: form.teacher,
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
            <h2>{isEditing ? 'Wax Ka Beddel Maadada' : 'Ku Dar Maadada Cusub'}</h2>
            <p>{isEditing ? subject.code : 'Buuxi macluumaadka maadada cusub'}</p>
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
                <label>Magaca Maadada (Subject Name) *</label>
                <input type="text" value={form.name} onChange={update('name')} placeholder="Tusaale: Xisaabta" required />
              </div>
              <div className="sjfm-field">
                <label>Code *</label>
                <input type="text" value={form.code} onChange={update('code')} placeholder="Tusaale: MATH-101" required />
              </div>
              <div className="sjfm-field">
                <label>Macallinka (Teacher) *</label>
                <input type="text" value={form.teacher} onChange={update('teacher')} placeholder="Tusaale: Cali Xasan Warsame" required />
              </div>
              <div className="sjfm-field">
                <label>Credit</label>
                <input type="number" value={form.credit} onChange={update('credit')} placeholder="Tusaale: 4" />
              </div>
              <div className="sjfm-field">
                <label>Saacadaha Toddobaadka (Weekly Hours)</label>
                <input type="number" value={form.weeklyHours} onChange={update('weeklyHours')} placeholder="Tusaale: 5" />
              </div>
            </div>

          </div>

          <div className="sjfm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Jooji</button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Kaydi Isbeddelka' : 'Ku Dar Maadada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SubjectFormModal;