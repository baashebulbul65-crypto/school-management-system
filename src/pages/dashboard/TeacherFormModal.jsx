import { useState, useEffect } from 'react';
import './TeacherFormModal.css';

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  email: '',
  qualification: '',
  subject: '',
  assignedClasses: '',
  status: 'active',
};

function initials(name) {
  if (!name) return 'MC';
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function TeacherFormModal({ isOpen, onClose, onSave, teacher }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const isEditing = !!teacher;

  useEffect(() => {
    if (teacher) {
      setForm({
        fullName: teacher.fullName || '',
        phone: teacher.phone || '',
        email: teacher.email || '',
        qualification: teacher.qualification || '',
        subject: teacher.subject || '',
        assignedClasses: (teacher.assignedClasses || []).join(', '),
        status: teacher.status || 'active',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [teacher, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    const classesArray = form.assignedClasses
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    // ===== VALIDATION: macallin kastaa waa in uu leeyahay ugu yaraan hal fasal =====
    if (classesArray.length === 0) {
      setError('Macallinku waa in uu leeyahay ugu yaraan hal fasal oo loo xilsaaray.');
      return;
    }

    const payload = { ...form, assignedClasses: classesArray };
    onSave(payload, teacher?.id);
    onClose();
  };

  return (
    <div className="tfm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tfm-modal">
        <div className="tfm-header">
          <div className="tfm-header-left">
            <div className="tfm-avatar">{initials(form.fullName)}</div>
            <div>
              <h2>{isEditing ? 'Wax Ka Beddel Macallinka' : 'Ku Dar Macallin Cusub'}</h2>
              <p>{isEditing ? teacher.teacherId : 'Buuxi macluumaadka hoose'}</p>
            </div>
          </div>
          <button className="tfm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="tfm-body">

            {error && <div className="tfm-error">{error}</div>}

            <div className="tfm-section-label">Macluumaadka Shakhsiga</div>
            <div className="tfm-grid">
              <div className="tfm-field full">
                <label>Magaca Buuxa *</label>
                <input type="text" value={form.fullName} onChange={update('fullName')} placeholder="Tusaale: Cali Xasan Warsame" required />
              </div>
              <div className="tfm-field">
                <label>Telefoonka</label>
                <input type="text" value={form.phone} onChange={update('phone')} placeholder="+252 61 ..." />
              </div>
              <div className="tfm-field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={update('email')} placeholder="tusaale@xarun.com" />
              </div>
              <div className="tfm-field full">
                <label>Shahaadada (Qualification)</label>
                <input type="text" value={form.qualification} onChange={update('qualification')} placeholder="Tusaale: BSc Xisaabta - Jaamacadda..." />
              </div>
            </div>

            <div className="tfm-section-label">Waxbarasho</div>
            <div className="tfm-grid">
              <div className="tfm-field">
                <label>Maadada *</label>
                <input type="text" value={form.subject} onChange={update('subject')} placeholder="Tusaale: Xisaabta" required />
              </div>
              <div className="tfm-field">
                <label>Xaaladda</label>
                <select value={form.status} onChange={update('status')}>
                  <option value="active">Firfircoon</option>
                  <option value="leave">Fasax</option>
                </select>
              </div>
              <div className="tfm-field full">
                <label>Fasallada Loo Xilsaaray * (kala sooc comma ,)</label>
                <input
                  type="text"
                  value={form.assignedClasses}
                  onChange={update('assignedClasses')}
                  placeholder="Tusaale: Form 1A, Form 2A"
                  required
                />
                <span className="tfm-hint">Macallin kastaa waa in uu leeyahay ugu yaraan hal fasal.</span>
              </div>
            </div>

          </div>

          <div className="tfm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Jooji</button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Kaydi Isbeddelka' : 'Ku Dar Macallinka'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TeacherFormModal;