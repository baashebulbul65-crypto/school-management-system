import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loginStaff, loginStudentOrParent, registerStudentOrParent, getUserProfile } from '../firebase/auth';
import ForgotPasswordModal from './ForgotPasswordModal';
import './LoginModal.css';

const ERROR_KEYS = {
  'auth/invalid-credential': 'invalidCredential',
  'auth/user-not-found': 'userNotFound',
  'auth/wrong-password': 'wrongPassword',
  'auth/too-many-requests': 'tooManyRequests',
  'auth/email-already-in-use': 'emailInUse',
  'auth/weak-password': 'weakPassword',
  NOOCA_AKOONKA_KHALDAN: 'wrongRole',
};

function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState('staff'); // 'staff' | 'student' | 'register'
  const [role, setRole] = useState('arday'); // 'arday' | 'waalid'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Staff fields
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Student/Parent fields
  const [schoolCode, setSchoolCode] = useState('');
  const [diiwaanId, setDiiwaanId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Diiwaan-gelinta (Register) fields
  const [regFullName, setRegFullName] = useState('');
  const [regSchoolCode, setRegSchoolCode] = useState('');
  const [regDiiwaanId, setRegDiiwaanId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const friendlyError = (err) => {
    const key = ERROR_KEYS[err?.code] || ERROR_KEYS[err?.message];
    return key ? t(`login.errors.${key}`) : t('login.errors.generic');
  };

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
      const { user, profile } = await loginStaff(staffEmail.trim().toLowerCase(), staffPassword);
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (regPassword !== regConfirmPassword) {
      setError(t('login.errors.passwordMismatch'));
      return;
    }
    setLoading(true);
    try {
      const { user } = await registerStudentOrParent({
        schoolCode: regSchoolCode,
        diiwaanId: regDiiwaanId,
        password: regPassword,
        role,
        fullName: regFullName,
      });
      const profile = await getUserProfile(user.uid);
      onLoginSuccess?.({ user, profile });
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`overlay${isOpen ? ' show' : ''}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            <div className="icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <h2>{mode === 'register' ? t('login.registerTitle') : t('login.title')}</h2>
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
                <label>{t('login.staff.emailLabel')}</label>
                <input
                  type="email"
                  placeholder={t('login.staff.emailPlaceholder')}
                  value={staffEmail}
                  onChange={(e) => { setStaffEmail(e.target.value); resetError(); }}
                  required
                />
              </div>
              <div className="field" style={{ marginBottom: '8px' }}>
                <label>{t('login.staff.passwordLabel')}</label>
                <input
                  type="password"
                  placeholder={t('login.staff.passwordPlaceholder')}
                  value={staffPassword}
                  onChange={(e) => { setStaffPassword(e.target.value); resetError(); }}
                  required
                />
              </div>
              <button type="button" className="forgot-link" onClick={() => setShowForgotModal(true)}>{t('login.staff.forgotLink')}</button>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? t('login.staff.submitLoading') : t('login.staff.submit')}
                {!loading && (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                )}
              </button>

              <div className="divider">{t('login.staff.or')}</div>

              <button className="switch-mode-btn" type="button" onClick={() => switchMode('student')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>
                {t('login.staff.switchToStudent')}
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
                  {t('login.student.roleArday')}
                </button>
                <button type="button" className={`seg-btn${role === 'waalid' ? ' active' : ''}`} onClick={() => setRole('waalid')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                  {t('login.student.roleWaalid')}
                </button>
              </div>

              <div className="field">
                <label>{t('login.student.schoolCodeLabel')}</label>
                <input
                  type="text"
                  placeholder={t('login.student.schoolCodePlaceholder')}
                  value={schoolCode}
                  onChange={(e) => { setSchoolCode(e.target.value); resetError(); }}
                  required
                />
              </div>
              <div className="field">
                <label>{t('login.student.diiwaanIdLabel', { role: role === 'arday' ? t('login.student.roleArdayLabel') : t('login.student.roleWaalidLabel') })}</label>
                <input
                  type="text"
                  placeholder={t('login.student.diiwaanIdPlaceholder')}
                  value={diiwaanId}
                  onChange={(e) => { setDiiwaanId(e.target.value); resetError(); }}
                  required
                />
              </div>
              <div className="field" style={{ marginBottom: '24px' }}>
                <label>{t('login.student.passwordLabel')}</label>
                <input
                  type="password"
                  placeholder={t('login.student.passwordPlaceholder')}
                  value={studentPassword}
                  onChange={(e) => { setStudentPassword(e.target.value); resetError(); }}
                  required
                />
              </div>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? t('login.student.submitLoading') : t('login.student.submit')}
                {!loading && (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                )}
              </button>

              <button type="button" className="forgot-link" style={{ textAlign: 'center', marginBottom: '18px' }} onClick={() => switchMode('register')}>
                {t('login.student.noAccountLink')}
              </button>

              <div className="divider">{t('login.student.or')}</div>

              <button className="switch-mode-btn" type="button" onClick={() => switchMode('staff')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9M14 17H5M17 3l4 4-4 4M7 21l-4-4 4-4"/></svg>
                {t('login.student.switchToStaff')}
              </button>
            </form>
          )}

          {/* PANEL 3: STUDENT / PARENT REGISTER */}
          {mode === 'register' && (
            <form className="panel active" onSubmit={handleRegisterSubmit}>
              <div className="segmented">
                <div className={`seg-thumb${role === 'waalid' ? ' right' : ''}`}></div>
                <button type="button" className={`seg-btn${role === 'arday' ? ' active' : ''}`} onClick={() => setRole('arday')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>
                  {t('login.student.roleArday')}
                </button>
                <button type="button" className={`seg-btn${role === 'waalid' ? ' active' : ''}`} onClick={() => setRole('waalid')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                  {t('login.student.roleWaalid')}
                </button>
              </div>

              <div className="field">
                <label>{t('login.register.fullNameLabel')}</label>
                <input
                  type="text"
                  placeholder={t('login.register.fullNamePlaceholder')}
                  value={regFullName}
                  onChange={(e) => { setRegFullName(e.target.value); resetError(); }}
                  required
                />
              </div>
              <div className="field">
                <label>{t('login.register.schoolCodeLabel')}</label>
                <input
                  type="text"
                  placeholder={t('login.register.schoolCodePlaceholder')}
                  value={regSchoolCode}
                  onChange={(e) => { setRegSchoolCode(e.target.value); resetError(); }}
                  required
                />
              </div>
              <div className="field">
                <label>{t('login.register.diiwaanIdLabel', { role: role === 'arday' ? t('login.register.diiwaanIdRoleArday') : t('login.register.diiwaanIdRoleWaalid') })}</label>
                <input
                  type="text"
                  placeholder={t('login.register.diiwaanIdPlaceholder')}
                  value={regDiiwaanId}
                  onChange={(e) => { setRegDiiwaanId(e.target.value); resetError(); }}
                  required
                />
              </div>
              <div className="field">
                <label>{t('login.register.passwordLabel')}</label>
                <input
                  type="password"
                  placeholder={t('login.register.passwordPlaceholder')}
                  value={regPassword}
                  onChange={(e) => { setRegPassword(e.target.value); resetError(); }}
                  required
                />
              </div>
              <div className="field" style={{ marginBottom: '24px' }}>
                <label>{t('login.register.confirmPasswordLabel')}</label>
                <input
                  type="password"
                  placeholder={t('login.register.passwordPlaceholder')}
                  value={regConfirmPassword}
                  onChange={(e) => { setRegConfirmPassword(e.target.value); resetError(); }}
                  required
                />
              </div>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? t('login.register.submitLoading') : t('login.register.submit')}
                {!loading && (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                )}
              </button>

              <button type="button" className="forgot-link" style={{ textAlign: 'center' }} onClick={() => switchMode('student')}>
                {t('login.register.alreadyHaveAccount')}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>

    <ForgotPasswordModal isOpen={showForgotModal} onClose={() => setShowForgotModal(false)} />
    </>
  );
}

export default LoginModal;
