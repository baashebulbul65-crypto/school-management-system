import { useState, useEffect } from 'react';
import './ClassFormModal.css';

const EMPTY_FORM = {
  grade: '',
  section: 'A',
  room: '',
  capacity: '',
  classTeacher: '',
  subjects: '',
};

function ClassFormModal({ isOpen, onClose, onSave, cls }) {
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
        classTeacher: cls.classTeacher || '',
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

    if (!form.classTeacher.trim()) {
      setError('Fasalku waa in uu leeyahay Macallin Fasal (Class Teacher).');
      return;
    }

    const subjectsArray = form.subjects.split(',').map((s) => s.trim()).filter(Boolean);

    const payload = {
      grade: form.grade,
      section: form.section,
      room: form.room,
      capacity: Number(form.capacity) || 0,
      classTeacher: form.classTeacher,
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
            <h2>{isEditing ? 'Wax Ka Beddel Fasalka' : 'Abuur Fasal Cusub'}</h2>
            <p>{isEditing ? `${cls.grade} - ${cls.section}` : 'Buuxi macluumaadka fasalka cusub'}</p>
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
                <label>Fasalka (Grade) *</label>
                <input type="text" value={form.grade} onChange={update('grade')} placeholder="Tusaale: Form 1" required />
              </div>
              <div className="cfm-field">
                <label>Qaybta (Section)</label>
                <select value={form.section} onChange={update('section')}>
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                  <option>D</option>
                </select>
              </div>
              <div className="cfm-field">
                <label>Qolka (Room)</label>
                <input type="text" value={form.room} onChange={update('room')} placeholder="Tusaale: Qolka 101" />
              </div>
              <div className="cfm-field">
                <label>Awoodda (Capacity) *</label>
                <input type="number" value={form.capacity} onChange={update('capacity')} placeholder="Tusaale: 45" required />
              </div>
              <div className="cfm-field full">
                <label>Macallin Fasal (Class Teacher) *</label>
                <input type="text" value={form.classTeacher} onChange={update('classTeacher')} placeholder="Tusaale: Cali Xasan Warsame" required />
              </div>
              <div className="cfm-field full">
                <label>Maadooyinka (kala sooc comma ,)</label>
                <input type="text" value={form.subjects} onChange={update('subjects')} placeholder="Xisaab, Ingiriisi, Sayniska" />
              </div>
            </div>

          </div>

          <div className="cfm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Jooji</button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Kaydi Isbeddelka' : 'Abuur Fasalka'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClassFormModal;