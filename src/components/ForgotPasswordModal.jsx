import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { resetStaffPassword } from '../firebase/auth';
import './LoginModal.css';

const ERROR_KEYS = {
  'auth/invalid-email': 'invalidEmail',
  'auth/user-not-found': 'userNotFound',
  'auth/too-many-requests': 'tooManyRequests',
};

function ForgotPasswordModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const friendlyError = (err) => {
    const key = ERROR_KEYS[err?.code];
    return key ? t(`forgotPassword.errors.${key}`) : t('forgotPassword.errors.generic');
  };

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    // Dib u dejinta xaaladda waxaa la sugayaa animation-ka xidhitaanka
    setTimeout(() => {
      setEmail('');
      setError('');
      setSent(false);
      setLoading(false);
    }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Trim + lowercase: hal masaafo (space) oo aan la ogeyn ayaa keeni karta in
      // Firebase uu "guul" soo celiyo isaga oo aan email dirin (enumeration protection).
      await resetStaffPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`overlay${isOpen ? ' show' : ''}`} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">
            <div className="icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 17v.01M8 11V8a4 4 0 118 0v3M6 11h12a1 1 0 011 1v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a1 1 0 011-1z"/></svg>
            </div>
            <h2>{t('forgotPassword.title')}</h2>
          </div>
          <button className="close-btn" onClick={handleClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="form-error">{error}</div>}

          {sent ? (
            <div className="form-success">
              {t('forgotPassword.successPrefix')} <strong>{email}</strong> {t('forgotPassword.successSuffix')}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="forgot-note">{t('forgotPassword.note')}</p>
              <div className="field" style={{ marginBottom: '22px' }}>
                <label>{t('forgotPassword.emailLabel')}</label>
                <input
                  type="email"
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                  required
                />
              </div>
              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? t('forgotPassword.submitLoading') : t('forgotPassword.submit')}
                {!loading && (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
