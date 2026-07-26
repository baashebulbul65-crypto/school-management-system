import { useState, useEffect } from 'react';
import './StudentFormModal.css';

const EMPTY_FORM = {
  fullName: '',
  gender: 'Wiil',
  dob: '',
  phone: '',
  parentName: '',
  parentRelation: 'Aabo',
  parentPhone: '',
  address: '',
  className: '',
  section: 'A',
  rollNumber: '',
  subjects: '',
  fee: 'pending',
  status: 'active',
};

function initials(name) {
  if (!name) return 'AR';
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function StudentFormModal({ isOpen, onClose, onSave, student }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const isEditing = !!student;

  useEffect(() => {
    if (student) {
      setForm({
        fullName: student.fullName || '',
        gender: student.gender || 'Wiil',
        dob: student.dob || '',
        phone: student.phone || '',
        parentName: student.parentName || '',
        parentRelation: student.parentRelation || 'Aabo',
        parentPhone: student.parentPhone || '',
        address: student.address || '',
        className: student.className || '',
        section: student.section || 'A',
        rollNumber: student.rollNumber || '',
        subjects: (student.subjects || []).join(', '),
        fee: student.fee || 'pending',
        status: student.status || 'active',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [student, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();

    const subjectsArray = form.subjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      ...form,
      subjects: subjectsArray,
      rollNumber: Number(form.rollNumber) || 0,
    };

    onSave(payload, student?.id);
    onClose();
  };

  return (
    <div className="sfm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sfm-modal">
        <div className="sfm-header">
          <div className="sfm-header-left">
            <div className="sfm-avatar">{initials(form.fullName)}</div>
            <div>
              <h2>{isEditing ? 'Wax Ka Beddel Ardayga' : 'Ku Dar Arday Cusub'}</h2>
              <p>{isEditing ? student.studentId : 'Buuxi macluumaadka hoose'}</p>
            </div>
          </div>
          <button className="sfm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="sfm-body">

            <div className="sfm-section-label">Macluumaadka Shakhsiga</div>
            <div className="sfm-grid">
              <div className="sfm-field full">
                <label>Magaca Buuxa *</label>
                <input type="text" value={form.fullName} onChange={update('fullName')} placeholder="Tusaale: Ismaaciil Cabdi Xasan" required />
              </div>
              <div className="sfm-field">
                <label>Jinsiga</label>
                <select value={form.gender} onChange={update('gender')}>
                  <option>Wiil</option>
                  <option>Gabar</option>
                </select>
              </div>
              <div className="sfm-field">
                <label>Taariikhda Dhalashada</label>
                <input type="date" value={form.dob} onChange={update('dob')} />
              </div>
              <div className="sfm-field">
                <label>Telefoonka</label>
                <input type="text" value={form.phone} onChange={update('phone')} placeholder="+252 61 ..." />
              </div>
              <div className="sfm-field">
                <label>Cinwaanka</label>
                <input type="text" value={form.address} onChange={update('address')} placeholder="Xaafadda, Magaalada" />
              </div>
            </div>

            <div className="sfm-section-label">Macluumaadka Waalidka</div>
            <div className="sfm-grid">
              <div className="sfm-field">
                <label>Magaca Waalidka</label>
                <input type="text" value={form.parentName} onChange={update('parentName')} />
              </div>
              <div className="sfm-field">
                <label>Xiriirka</label>
                <select value={form.parentRelation} onChange={update('parentRelation')}>
                  <option>Aabo</option>
                  <option>Hooyo</option>
                  <option>Mas'uul Kale</option>
                </select>
              </div>
              <div className="sfm-field full">
                <label>Telefoonka Waalidka</label>
                <input type="text" value={form.parentPhone} onChange={update('parentPhone')} placeholder="+252 61 ..." />
              </div>
            </div>

            <div className="sfm-section-label">Waxbarasho</div>
            <div className="sfm-grid">
              <div className="sfm-field">
                <label>Fasalka *</label>
                <input type="text" value={form.className} onChange={update('className')} placeholder="Tusaale: Form 1A" required />
              </div>
              <div className="sfm-field">
                <label>Section</label>
                <select value={form.section} onChange={update('section')}>
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                </select>
              </div>
              <div className="sfm-field">
                <label>Roll Number</label>
                <input type="number" value={form.rollNumber} onChange={update('rollNumber')} />
              </div>
              <div className="sfm-field full">
                <label>Maadooyinka (kala sooc comma ,)</label>
                <input type="text" value={form.subjects} onChange={update('subjects')} placeholder="Xisaab, Ingiriisi, Sayniska" />
              </div>
            </div>

            <div className="sfm-section-label">Xaaladda</div>
            <div className="sfm-grid">
              <div className="sfm-field">
                <label>Xaalada Diiwaanka</label>
                <select value={form.status} onChange={update('status')}>
                  <option value="active">Firfircoon</option>
                  <option value="inactive">Aan Firfircoonayn</option>
                </select>
              </div>
              <div className="sfm-field">
                <label>Xaalada Lacagta</label>
                <select value={form.fee} onChange={update('fee')}>
                  <option value="paid">La Bixiyay</option>
                  <option value="pending">Sugaya</option>
                  <option value="overdue">Dib U Dhacay</option>
                </select>
              </div>
            </div>

          </div>

          <div className="sfm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Jooji</button>
            <button type="submit" className="btn-primary">
              {isEditing ? 'Kaydi Isbeddelka' : 'Ku Dar Ardayga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentFormModal;