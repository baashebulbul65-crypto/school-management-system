import { useState } from 'react';
import { loginStaff, loginStudentOrParent } from '../firebase/auth';
import './LoginModal.css';

const ERROR_MESSAGES = {
  'auth/invalid-credential': 'Iimaylka ama Furaha Sirta waa khalad.',
  'auth/user-not-found': 'Akoon lama helin xogtan.',
  'auth/wrong-password': 'Furaha Sirta waa khalad.',
  'auth/too-many-requests': 'Isku day badan oo khalad ah ayaa la sameeyay. Fadlan wax yar sug.',
  NOOCA_AKOONKA_KHALDAN: 'Akoontaan uma dhigna doorka aad doorateen (Arday/Waalid).',
};

function friendlyError(err) {
  return ERROR_MESSAGES[err?.code] || ERROR_MESSAGES[err?.message] || 'Wax baa qaldamay. Fadlan mar kale isku day.';
}

function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [mode, setMode] = useState('staff'); // 'staff' | 'student'
  const [role, setRole] = useState('arday'); // 'arday' | 'waalid'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Staff fields
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Student/Parent fields
  const [schoolCode, setSchoolCode] = useState('');
  const [diiwaanId, setDiiwaanId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  if (!isOpen) return null;

  const resetError = () => error && setError('');

  const switchMode = (nextMode) => {
    setError('');
    setMode(nextMode);
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, profile } = await loginStaff(staffEmail, staffPassword);
      onLoginSuccess?.({ user, profile });
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user, profile } = await loginStudentOrParent({
        schoolCode,
        diiwaanId,
        password: studentPassword,
        role,
      });
      onLoginSuccess?.({ user, profile });
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`overlay${isOpen ? ' show' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            <div className="icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <h2>Gal Akoonkaaga</h2>
          </div>
          <button className="close-btn" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="modal-body">

          {error && <div className="form-error">{error}</div>}

          {/* PANEL 1: STAFF LOGIN */}
          {mode === 'staff' && (
            <form className="panel active" onSubmit={handleStaffSubmit}>
              <div className="field">
                <label>Iimaylka (G-Mail)</label>
                <input
                  type="email"
                  placeholder="tusaale@gmail.com"
                  value={staffEmail}
                  onChange={(e) => { setStaffEmail(e.target.value); resetError(); }}
                  required
                />
              </div>
              <div className="field" style={{ marginBottom: '8px' }}>
                <label>Furaha Sirta</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={staffPassword}
                  onChange={(e) => { setStaffPassword(e.target.value); resetError(); }}
                  required
                />
              </div>
              <a href="#forgot" className="forgot-link">Ma illowday Password-ka?</a>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? 'SUGAYA...' : 'GAL'}
                {!loading && (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                )}
              </button>

              <div className="divider">AMA</div>

              <button className="switch-mode-btn" type="button" onClick={() => switchMode('student')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>
                Waxaan Ahay Arday / Waalid
              </button>
            </form>
          )}

          {/* PANEL 2: STUDENT / PARENT LOGIN */}
          {mode === 'student' && (
            <form className="panel active" onSubmit={handleStudentSubmit}>
              <div className="segmented">
                <div className={`seg-thumb${role === 'waalid' ? ' right' : ''}`}></div>
                <button type="button" className={`seg-btn${role === 'arday' ? ' active' : ''}`} onClick={() => setRole('arday')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>
                  ARDAY
                </button>
                <button type="button" className={`seg-btn${role === 'waalid' ? ' active' : ''}`} onClick={() => setRole('waalid')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                  WAALID
                </button>
              </div>

              <div className="field">
                <label>School Code</label>
                <input
                  type="text"
                  placeholder="Tusaale: XRN-2026"
                  value={schoolCode}
                  onChange={(e) => { setSchoolCode(e.target.value); resetError(); }}
                  required
                />
              </div>
              <div className="field">
                <label>Diiwaan ID ({role === 'arday' ? 'Arday' : 'Waalid'})</label>
                <input
                  type="text"
                  placeholder="123456"
                  value={diiwaanId}
                  onChange={(e) => { setDiiwaanId(e.target.value); resetError(); }}
                  required
                />
              </div>
              <div className="field" style={{ marginBottom: '24px' }}>
                <label>Furaha Sirta</label>
                <input
                  type="password"
                  placeholder="••••"
                  value={studentPassword}
                  onChange={(e) => { setStudentPassword(e.target.value); resetError(); }}
                  required
                />
              </div>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? 'SUGAYA...' : 'GAL'}
                {!loading && (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                )}
              </button>

              <div className="divider">AMA</div>

              <button className="switch-mode-btn" type="button" onClick={() => switchMode('staff')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9M14 17H5M17 3l4 4-4 4M7 21l-4-4 4-4"/></svg>
                Waxaan Ahay Shaqaale
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default LoginModal;