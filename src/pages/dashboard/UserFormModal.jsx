import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './UserFormModal.css';

const EMPTY_FORM = { fullName: '', email: '', role: 'Teacher', password: '', teacherDocId: '', salaryAmount: '' };

function UserFormModal({ isOpen, onClose, onSave, user, roleOptions, teacherOptions = [] }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setForm({ fullName: user.fullName, email: user.email, role: user.title, password: '', teacherDocId: user.teacherDocId || '', salaryAmount: user.salaryAmount || '' });
    } else {
      setForm(EMPTY_FORM);
    }
    setError('');
  }, [user, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Marka la doorto macallin ka mid ah dropdown-ka "Xiriirinta Diiwaanka
  // Macallinka" — si otomaatig ah uga soo buuxi Magaca/Emailka diiwaanka
  // Teachers ee la doortay (haddii ay jiraan), si loo ilaaliyo in isku qof
  // uusan yeelan laba email oo kala duwan (mid Teachers, mid Users). Field
  // madhan (tusaale email aan la gelin) lama qasbo — waxaa la boodaa,
  // qiimaha jira (haddii uu jiro) ayaa la sii daayaa. Email-ka akoon hore
  // (isEditing) lama taabto — akoontu waa in ay sii haysataa email-kiisii
  // dhabta ah (fiiri "Email-ka ma bedeli karto akoon hore" hoose), sidaas
  // darteed kaliya abuurista account CUSUB ayaa email lagu buuxinayaa.
  // Haddii owner-ku dib u qoro (override) qiimo laga soo buuxiyay, taasi
  // waa la sii daayaa — halkan waxaa la taabanayaa kaliya marka dropdown-ka
  // teacherDocId la doorto, ma aha mar kasta oo modal-ku dib u render sameeyo.
  const handleTeacherSelect = (e) => {
    const teacherDocId = e.target.value;
    const selectedTeacher = teacherOptions.find((tc) => tc.id === teacherDocId);
    setForm((f) => ({
      ...f,
      teacherDocId,
      fullName: selectedTeacher?.fullName || f.fullName,
      email: !isEditing && selectedTeacher?.email ? selectedTeacher.email : f.email,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditing && form.password.length < 6) {
      setError(t('users.form.errors.passwordTooShort'));
      return;
    }

    // Xiriirinta diiwaanka Macallinka waa WAAJIB marka doorku yahay Teacher
    // (Teacher Role Scoping audit, 2026-08-02) — haddii aan la xirin, macallinku
    // 0 fasal ayuu arki doonaa (fiiri Classes.jsx: profile.teacherDocId).
    if (form.role === 'Teacher' && !form.teacherDocId) {
      setError(t('users.form.errors.teacherLinkRequired'));
      return;
    }

    const payload = {
      fullName: form.fullName,
      email: form.email,
      title: form.role,
      password: form.password,
      teacherDocId: form.role === 'Teacher' ? (form.teacherDocId || null) : null,
      // Mushaharka shaqaalaha aan macallin ahayn waxaa lagu kaydiyaa halkan
      // (users/{uid}.salaryAmount) — macallinka mushaharkiisu wuxuu ku jiraa
      // diiwaanka teachers (TeacherFormModal), si aan hal qof loo yeelan laba
      // isha xog (fiiri utils/staffSalary.js: buildPayrollList).
      salaryAmount: form.role === 'Teacher' ? 0 : (Number(form.salaryAmount) || 0),
    };
    setSubmitting(true);
    setError('');
    try {
      await onSave(payload, user?.id);
      onClose();
    } catch (err) {
      setError(
        err.code === 'auth/email-already-in-use'
          ? t('users.form.errors.emailInUse')
          : err.code === 'auth/invalid-email'
          ? t('users.form.errors.invalidEmail')
          : t('users.form.errors.generic')
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
            <h2>{isEditing ? t('users.form.editTitle') : t('users.form.addTitle')}</h2>
            <p>{isEditing ? user.email : t('users.form.fillInfo')}</p>
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
                <label>{t('users.form.fields.fullName')}</label>
                <input type="text" value={form.fullName} onChange={update('fullName')} placeholder={t('users.form.placeholders.fullName')} required />
              </div>
              <div className="ufm-field full">
                <label>{t('users.form.fields.email')}</label>
                <input type="email" value={form.email} onChange={update('email')} placeholder={t('users.form.placeholders.email')} required disabled={isEditing} />
                {isEditing && <span className="ufm-hint">{t('users.form.hints.emailLocked')}</span>}
              </div>
              <div className="ufm-field full">
                <label>{t('users.form.fields.role')}</label>
                <select value={form.role} onChange={update('role')}>
                  {roleOptions.map((r) => <option key={r} value={r}>{t(`users.roles.${r}`)}</option>)}
                </select>
              </div>

              {form.role === 'Teacher' && (
                <div className="ufm-field full">
                  <label>{t('users.form.fields.teacherLink')}</label>
                  <select value={form.teacherDocId} onChange={handleTeacherSelect} required disabled={teacherOptions.length === 0}>
                    <option value="" disabled={teacherOptions.length === 0}>
                      {teacherOptions.length === 0 ? t('users.form.placeholders.noAvailableTeachers') : t('users.form.placeholders.teacherSelect')}
                    </option>
                    {teacherOptions.map((tc) => (
                      <option key={tc.id} value={tc.id}>{tc.fullName}</option>
                    ))}
                  </select>
                  <span className="ufm-hint">{t('users.form.hints.teacherLink')}</span>
                </div>
              )}

              {form.role !== 'Teacher' && (
                <div className="ufm-field full">
                  <label>{t('users.form.fields.salaryAmount')}</label>
                  <input type="number" min="0" value={form.salaryAmount} onChange={update('salaryAmount')} placeholder={t('users.form.placeholders.salaryAmount')} />
                  <span className="ufm-hint">{t('users.form.hints.salaryAmount')}</span>
                </div>
              )}

              {!isEditing && (
                <div className="ufm-field full">
                  <label>{t('users.form.fields.password')}</label>
                  <input type="password" value={form.password} onChange={update('password')} placeholder={t('users.form.placeholders.password')} required />
                  <span className="ufm-hint">{t('users.form.hints.password')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="ufm-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? t('users.form.submitting') : isEditing ? t('users.form.submitEdit') : t('users.form.submitAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;