import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { changeStaffPassword } from '../../firebase/auth';
import '../../styles/dashboard-shared.css';
import './Settings.css';

const PASSWORD_ERROR_KEYS = {
  'auth/wrong-password': 'wrongPassword',
  'auth/invalid-credential': 'wrongPassword',
  'auth/weak-password': 'weakPassword',
  'auth/requires-recent-login': 'requiresRecentLogin',
  'auth/too-many-requests': 'tooManyRequests',
};

const LANGUAGES = [
  { code: 'so', label: 'Soomaali' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

const CURRENCIES = ['USD', 'SOS (Shilin Soomaali)', 'ETB (Birr)'];

function SavedToast({ show, label }) {
  if (!show) return null;
  return (
    <div className="settings-toast">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
      {label}
    </div>
  );
}

function Settings() {
  const { t } = useTranslation();
  const {
    settings, updateSchool, updateLanguage, updateCurrency, updateAcademicYear, updateFee,
    addFeeGrade, removeFeeGrade, updateNotificationPref, uploadLogo, removeLogo, logoUploading, logoError,
  } = useSettings();
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState('school');
  const [schoolForm, setSchoolForm] = useState(settings.school);
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeAmount, setNewGradeAmount] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const logoInputRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const TABS = [
    { id: 'school', label: t('settings.tabs.school') },
    { id: 'fees', label: t('settings.tabs.fees') },
    { id: 'academic', label: t('settings.tabs.academic') },
    { id: 'notifications', label: t('settings.tabs.notifications') },
    { id: 'account', label: t('settings.tabs.account') },
  ];

  const NOTIFICATION_ITEMS = [
    { key: 'feeReminders', label: t('settings.notifications.items.feeReminders.label'), desc: t('settings.notifications.items.feeReminders.desc') },
    { key: 'attendanceAlerts', label: t('settings.notifications.items.attendanceAlerts.label'), desc: t('settings.notifications.items.attendanceAlerts.desc') },
    { key: 'examResults', label: t('settings.notifications.items.examResults.label'), desc: t('settings.notifications.items.examResults.desc'), comingSoon: true },
    { key: 'emailDigest', label: t('settings.notifications.items.emailDigest.label'), desc: t('settings.notifications.items.emailDigest.desc'), comingSoon: true },
  ];

  const flashSaved = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

  const handleSchoolChange = (field) => (e) => setSchoolForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSaveSchool = (e) => {
    e.preventDefault();
    const { name, phone, address, email } = schoolForm;
    updateSchool({ name, phone, address, email });
    flashSaved();
  };

  const handleAddGrade = (e) => {
    e.preventDefault();
    if (!newGradeName.trim() || !newGradeAmount) return;
    addFeeGrade(newGradeName.trim(), Number(newGradeAmount));
    setNewGradeName('');
    setNewGradeAmount('');
    flashSaved();
  };

  const handleFeeChange = (id, value) => {
    updateFee(id, Number(value) || 0);
  };

  const handleAcademicSave = (e) => {
    e.preventDefault();
    flashSaved();
  };

  const handleLogoPick = () => logoInputRef.current?.click();

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // ogolow in isla faylka la dib-u-xulo
    if (!file) return;
    try {
      await uploadLogo(file);
      flashSaved();
    } catch {
      // fariinta khaladka waxa lagu tusayaa logoError gudaha UI-ga
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await removeLogo();
      flashSaved();
    } catch {
      // fariinta khaladka waxa lagu tusayaa logoError gudaha UI-ga
    }
  };

  const friendlyPasswordError = (err) => {
    const key = PASSWORD_ERROR_KEYS[err?.code];
    return key ? t(`settings.account.errors.${key}`) : t('settings.account.errors.generic');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t('settings.account.errors.allFieldsRequired'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.account.errors.passwordMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(t('settings.account.errors.weakPassword'));
      return;
    }
    setPasswordSaving(true);
    try {
      await changeStaffPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      flashSaved();
    } catch (err) {
      setPasswordError(friendlyPasswordError(err));
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('settings.pageTitle')}</h2>
          <p>{t('settings.pageSubtitle')}</p>
        </div>
      </div>

      <div className="fin-tabs">
        {TABS.map((tb) => (
          <button key={tb.id} className={`fin-tab ${activeTab === tb.id ? 'active' : ''}`} onClick={() => setActiveTab(tb.id)}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ===== XOGTA DUGSIGA ===== */}
      {activeTab === 'school' && (
        <div className="dash-card settings-card">
          <h3 className="settings-section-title">{t('settings.school.sectionTitle')}</h3>
          <p className="settings-section-desc">{t('settings.school.sectionDesc')}</p>

          <div className="settings-preview">
            {settings.school.logo ? (
              <img className="settings-preview-logo settings-preview-logo-img" src={settings.school.logo} alt={schoolForm.name} />
            ) : (
              <div className="settings-preview-logo">
                {schoolForm.name?.slice(0, 2).toUpperCase() || 'XX'}
              </div>
            )}
            <div>
              <div className="settings-preview-name">{schoolForm.name || t('settings.school.defaultName')}</div>
              <div className="settings-preview-code">{profile?.schoolCode}</div>
            </div>
          </div>

          <div className="settings-logo-upload">
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              hidden
              onChange={handleLogoChange}
            />
            <button type="button" className="btn-secondary" onClick={handleLogoPick} disabled={logoUploading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
              {logoUploading ? t('settings.school.uploading') : settings.school.logo ? t('settings.school.changeLogo') : t('settings.school.uploadLogo')}
            </button>
            {settings.school.logo && (
              <button type="button" className="settings-logo-remove" onClick={handleRemoveLogo} disabled={logoUploading}>
                {t('settings.school.removeLogo')}
              </button>
            )}
            {logoError && <div className="settings-logo-error">{logoError}</div>}
            <p className="settings-section-desc settings-logo-hint">{t('settings.school.logoHint')}</p>
          </div>

          <form onSubmit={handleSaveSchool}>
            <div className="settings-grid">
              <div className="settings-field full">
                <label>{t('settings.school.fields.name')}</label>
                <input type="text" value={schoolForm.name} onChange={handleSchoolChange('name')} required />
              </div>
              <div className="settings-field">
                <label>{t('settings.school.fields.code')}</label>
                <input type="text" value={profile?.schoolCode || ''} disabled />
                <p className="settings-section-desc settings-code-hint">{t('settings.school.codeReadonlyHint')}</p>
              </div>
              <div className="settings-field">
                <label>{t('settings.school.fields.phone')}</label>
                <input type="text" value={schoolForm.phone} onChange={handleSchoolChange('phone')} />
              </div>
              <div className="settings-field full">
                <label>{t('settings.school.fields.address')}</label>
                <input type="text" value={schoolForm.address} onChange={handleSchoolChange('address')} />
              </div>
              <div className="settings-field full">
                <label>{t('settings.school.fields.email')}</label>
                <input type="email" value={schoolForm.email} onChange={handleSchoolChange('email')} />
              </div>
            </div>

            <div className="settings-divider"></div>

            <h3 className="settings-section-title">{t('settings.school.langCurrencyTitle')}</h3>
            <div className="settings-grid">
              <div className="settings-field">
                <label>{t('settings.school.systemLanguage')}</label>
                <div className="settings-lang-options">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      className={`settings-lang-btn ${settings.language === l.code ? 'active' : ''}`}
                      onClick={() => { updateLanguage(l.code); flashSaved(); }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-field">
                <label>{t('settings.school.currency')}</label>
                <select value={settings.currency} onChange={(e) => { updateCurrency(e.target.value); flashSaved(); }}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary settings-save-btn">{t('settings.school.save')}</button>
          </form>
        </div>
      )}

      {/* ===== QIIMAHA (FEES) ===== */}
      {activeTab === 'fees' && (
        <div className="dash-card settings-card">
          <h3 className="settings-section-title">{t('settings.fees.sectionTitle')}</h3>
          <p className="settings-section-desc">{t('settings.fees.sectionDesc')}</p>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('settings.fees.table.class')}</th><th>{t('settings.fees.table.price')}</th><th></th></tr></thead>
              <tbody>
                {settings.feesByGrade.map((f) => (
                  <tr key={f.id}>
                    <td className="cell-name">{f.grade}</td>
                    <td>
                      <input
                        type="number"
                        className="settings-inline-input"
                        value={f.amount}
                        onChange={(e) => handleFeeChange(f.id, e.target.value)}
                        onBlur={flashSaved}
                      />
                    </td>
                    <td>
                      <button className="row-action-btn danger" title={t('common.actions.delete')} onClick={() => { removeFeeGrade(f.id); flashSaved(); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form className="settings-add-grade-row" onSubmit={handleAddGrade}>
            <input type="text" placeholder={t('settings.fees.newGradeNamePlaceholder')} value={newGradeName} onChange={(e) => setNewGradeName(e.target.value)} />
            <input type="number" placeholder={t('settings.fees.newGradeAmountPlaceholder')} value={newGradeAmount} onChange={(e) => setNewGradeAmount(e.target.value)} />
            <button type="submit" className="btn-primary">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {t('settings.fees.add')}
            </button>
          </form>
        </div>
      )}

      {/* ===== SANNADKA WAXBARASHO ===== */}
      {activeTab === 'academic' && (
        <div className="dash-card settings-card">
          <h3 className="settings-section-title">{t('settings.academic.sectionTitle')}</h3>
          <p className="settings-section-desc">{t('settings.academic.sectionDesc')}</p>

          <form onSubmit={handleAcademicSave}>
            <div className="settings-grid">
              <div className="settings-field">
                <label>{t('settings.academic.startDate')}</label>
                <input
                  type="date"
                  value={settings.academicYear.start}
                  onChange={(e) => updateAcademicYear({ start: e.target.value })}
                />
              </div>
              <div className="settings-field">
                <label>{t('settings.academic.endDate')}</label>
                <input
                  type="date"
                  value={settings.academicYear.end}
                  onChange={(e) => updateAcademicYear({ end: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary settings-save-btn">{t('settings.school.save')}</button>
          </form>
        </div>
      )}

      {/* ===== OGEYSIISYADA ===== */}
      {activeTab === 'notifications' && (
        <div className="dash-card settings-card">
          <h3 className="settings-section-title">{t('settings.notifications.sectionTitle')}</h3>
          <p className="settings-section-desc">{t('settings.notifications.sectionDesc')}</p>

          <div className="settings-toggle-list">
            {NOTIFICATION_ITEMS.map((item) => (
              <div className="settings-toggle-row" key={item.key}>
                <div>
                  <div className="settings-toggle-label">
                    {item.label}
                    {item.comingSoon && <span className="settings-coming-soon-badge">{t('settings.notifications.comingSoon')}</span>}
                  </div>
                  <div className="settings-toggle-desc">{item.desc}</div>
                </div>
                <button
                  className={`settings-switch ${settings.notificationPrefs[item.key] ? 'on' : ''}`}
                  disabled={item.comingSoon}
                  onClick={() => { updateNotificationPref(item.key, !settings.notificationPrefs[item.key]); flashSaved(); }}
                >
                  <span className="settings-switch-knob"></span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== AKOONKAYGA ===== */}
      {activeTab === 'account' && (
        <div className="dash-card settings-card">
          <h3 className="settings-section-title">{t('settings.account.sectionTitle')}</h3>
          <div className="settings-account-card">
            <div className="settings-account-avatar">{(profile?.fullName || 'U').slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="settings-account-name">{profile?.fullName || t('settings.account.defaultUser')}</div>
              <div className="settings-account-role">{profile?.role === 'teacher' ? t('settings.account.roleTeacher') : t('settings.account.roleOwner')}</div>
            </div>
          </div>

          <div className="settings-grid">
            <div className="settings-field full">
              <label>{t('settings.account.email')}</label>
              <input type="email" value={profile?.email || ''} disabled />
            </div>
          </div>

          <div className="settings-divider"></div>

          <form onSubmit={handleChangePassword}>
            {passwordError && <div className="settings-logo-error">{passwordError}</div>}
            <div className="settings-grid">
              <div className="settings-field full">
                <label>{t('settings.account.currentPassword')}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                />
              </div>
              <div className="settings-field">
                <label>{t('settings.account.newPassword')}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                />
              </div>
              <div className="settings-field">
                <label>{t('settings.account.confirmPassword')}</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary settings-save-btn" disabled={passwordSaving}>
              {passwordSaving ? t('settings.account.saving') : t('settings.school.save')}
            </button>
          </form>
        </div>
      )}

      <SavedToast show={toastVisible} label={t('settings.savedToast')} />
    </div>
  );
}

export default Settings;
