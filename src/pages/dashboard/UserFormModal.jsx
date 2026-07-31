import { useState, useEffect } from 'react';
import './UserFormModal.css';

const EMPTY_FORM = { fullName: '', email: '', role: 'Teacher', password: '' };

function UserFormModal({ isOpen, onClose, onSave, user, roleOptions }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setForm({ fullName: user.fullName, email: user.email, role: user.title, password: '' });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [user, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditing && form.password.length < 6) {
      setError('Furaha Sirta waa in uu ka koobnaadaa ugu yaraan 6 xaraf.');
      return;
    }

    const payload = { fullName: form.fullName, email: form.email, title: form.role, password: form.password };
    setSubmitting(true);
    setError('');
    try {
      await onSave(payload, user?.id);
      onClose();
    } catch (err) {
      setError(
        err.code === 'auth/email-already-in-use'
          ? 'Email-kan horeba waa la isticmaalayaa.'
          : err.code === 'auth/invalid-email'
          ? 'Email-ku ma saxna.'
          : 'Khalad ayaa dhacay. Fadlan isku day mar kale.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ufm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ufm-modal">
        <div className="ufm-header">
          <div>
            <h2>{isEditing ? 'Wax Ka Beddel Shaqaalaha' : 'Ku Dar Shaqaale Cusub'}</h2>
            <p>{isEditing ? user.email : 'Buuxi macluumaadka hoose'}</p>
          </div>
          <button className="ufm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ufm-body">

            {error && <div className="ufm-error">{error}</div>}

            <div className="ufm-grid">
              <div className="ufm-field full">
                <label>Magaca Buuxa *</label>
                <input type="text" value={form.fullName} onChange={update('fullName')} placeholder="Tusaale: Sahra Maxamed Cige" required />
              </div>
              <div className="ufm-field full">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={update('email')} placeholder="tusaale@kayd.com" required disabled={isEditing} />
                {isEditing && <span className="ufm-hint">Email-ka ma bedeli karto akoon hore.</span>}
              </div>
              <div className="ufm-field full">
                <label>Doorka (Role) *</label>
                <select value={form.role} onChange={update('role')}>
                  {roleOptions.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>

              {!isEditing && (
                <div className="ufm-field full">
                  <label>Furaha Sirta Bilowga ah *</label>
                  <input type="password" value={form.password} onChange={update('password')} placeholder="Ugu yaraan 6 xaraf" required />
                  <span className="ufm-hint">Shaqaaluhu wuu bedeli kari doonaa marka uu markiiba galo.</span>
                </div>
              )}
            </div>
          </div>

          <div className="ufm-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Jooji</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '...' : isEditing ? 'Kaydi Isbeddelka' : 'Ku Dar Shaqaalaha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;