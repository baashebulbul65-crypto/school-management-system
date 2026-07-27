import { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import '../../styles/dashboard-shared.css';
import './Settings.css';

const TABS = [
  { id: 'school', label: 'Xogta Dugsiga' },
  { id: 'fees', label: 'Qiimaha (Fees)' },
  { id: 'academic', label: 'Sannadka Waxbarasho' },
  { id: 'notifications', label: 'Ogeysiisyada' },
  { id: 'account', label: 'Akoonkayga' },
];

const LANGUAGES = [
  { code: 'so', label: 'Soomaali' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

const CURRENCIES = ['USD', 'SOS (Shilin Soomaali)', 'ETB (Birr)'];

function SavedToast({ show }) {
  if (!show) return null;
  return (
    <div className="settings-toast">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
      Isbeddelka waa la kaydiyay
    </div>
  );
}

function Settings() {
  const { settings, updateSchool, updateLanguage, updateCurrency, updateAcademicYear, updateFee, addFeeGrade, removeFeeGrade, updateNotificationPref } = useSettings();
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState('school');
  const [schoolForm, setSchoolForm] = useState(settings.school);
  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeAmount, setNewGradeAmount] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const flashSaved = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

  const handleSchoolChange = (field) => (e) => setSchoolForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSaveSchool = (e) => {
    e.preventDefault();
    updateSchool(schoolForm);
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

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Dejinta</h2>
          <p>Maamul xogta dugsiga, qiimaha, sannadka waxbarasho, iyo akoonkaaga.</p>
        </div>
      </div>

      <div className="fin-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`fin-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== XOGTA DUGSIGA ===== */}
      {activeTab === 'school' && (
        <div className="dash-card settings-card">
          <h3 className="settings-section-title">Xogta Guud ee Dugsiga</h3>
          <p className="settings-section-desc">Magaca dugsigan wuxuu ka soo muuqan doonaa Sidebar-ka Dashboard-ka oo dhan.</p>

          <div className="settings-preview">
            <div className="settings-preview-logo">
              {schoolForm.name?.slice(0, 2).toUpperCase() || 'XX'}
            </div>
            <div>
              <div className="settings-preview-name">{schoolForm.name || 'Magaca Dugsiga'}</div>
              <div className="settings-preview-code">{schoolForm.code}</div>
            </div>
          </div>

          <form onSubmit={handleSaveSchool}>
            <div className="settings-grid">
              <div className="settings-field full">
                <label>Magaca Dugsiga *</label>
                <input type="text" value={schoolForm.name} onChange={handleSchoolChange('name')} required />
              </div>
              <div className="settings-field">
                <label>School Code</label>
                <input type="text" value={schoolForm.code} onChange={handleSchoolChange('code')} />
              </div>
              <div className="settings-field">
                <label>Telefoonka</label>
                <input type="text" value={schoolForm.phone} onChange={handleSchoolChange('phone')} />
              </div>
              <div className="settings-field full">
                <label>Cinwaanka</label>
                <input type="text" value={schoolForm.address} onChange={handleSchoolChange('address')} />
              </div>
              <div className="settings-field full">
                <label>Iimaylka Dugsiga</label>
                <input type="email" value={schoolForm.email} onChange={handleSchoolChange('email')} />
              </div>
            </div>

            <div className="settings-divider"></div>

            <h3 className="settings-section-title">Luqadda & Lacagta</h3>
            <div className="settings-grid">
              <div className="settings-field">
                <label>Luqadda Nidaamka</label>
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
                <label>Lacagta La Isticmaalo</label>
                <select value={settings.currency} onChange={(e) => { updateCurrency(e.target.value); flashSaved(); }}>
                  {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary settings-save-btn">Kaydi Isbeddelka</button>
          </form>
        </div>
      )}

      {/* ===== QIIMAHA (FEES) ===== */}
      {activeTab === 'fees' && (
        <div className="dash-card settings-card">
          <h3 className="settings-section-title">Qiimaha Fasal Kasta</h3>
          <p className="settings-section-desc">Beddel qiimaha caadiga ah ee fasal kasta — isbeddelkani wuxuu saameyn ku yeelan doonaa xisaabaadka lacagta ee cusub.</p>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Fasalka</th><th>Qiimaha ($)</th><th></th></tr></thead>
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
                      <button className="row-action-btn danger" title="Tirtir" onClick={() => { removeFeeGrade(f.id); flashSaved(); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form className="settings-add-grade-row" onSubmit={handleAddGrade}>
            <input type="text" placeholder="Magaca Fasalka Cusub (tusaale: Form 5)" value={newGradeName} onChange={(e) => setNewGradeName(e.target.value)} />
            <input type="number" placeholder="Qiimaha ($)" value={newGradeAmount} onChange={(e) => setNewGradeAmount(e.target.value)} />
            <button type="submit" className="btn-primary">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Ku Dar
            </button>
          </form>
        </div>
      )}

      {/* ===== SANNADKA WAXBARASHO ===== */}
      {activeTab === 'academic' && (
        <div className="dash-card settings-card">
          <h3 className="settings-section-title">Sannadka Waxbarasho</h3>
          <p className="settings-section-desc">Qeex bilowga iyo dhammaadka sannadka waxbarasho ee hadda socda.</p>

          <form onSubmit={handleAcademicSave}>
            <div className="settings-grid">
              <div className="settings-field">
                <label>Bilowga Sannadka</label>
                <input
                  type="date"
                  value={settings.academicYear.start}
                  onChange={(e) => updateAcademicYear({ start: e.target.value })}
                />
              </div>
              <div className="settings-field">
                <label>Dhammaadka Sannadka</label>
                <input
                  type="date"
                  value={settings.academicYear.end}
                  onChange={(e) => updateAcademicYear({ end: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn-primary settings-save-btn">Kaydi Isbeddelka</button>
          </form>
        </div>
      )}

      {/* ===== OGEYSIISYADA ===== */}
      {activeTab === 'notifications' && (
        <div className="dash-card settings-card">
          <h3 className="settings-section-title">Doorashooyinka Ogeysiisyada</h3>
          <p className="settings-section-desc">Xulo noocyada ogeysiisyada aad rabto in nidaamku kuu soo diro.</p>

          <div className="settings-toggle-list">
            {[
              { key: 'feeReminders', label: 'Xasuusin Lacageed', desc: 'Ogeysii marka lacag dib u dhacdo ama dhawaan dhammaanayso.' },
              { key: 'attendanceAlerts', label: 'Digniin Imaansho', desc: 'Ogeysii marka heerka imaanshaha fasal hoos u dhaco.' },
              { key: 'examResults', label: 'Natiijooyinka Imtixaanka', desc: 'Ogeysii marka buundooyinka la geliyo.' },
              { key: 'emailDigest', label: 'Soo Koobid Toddobaadle (Email)', desc: 'Hel soo koobid guud oo toddobaadle ah email ahaan.' },
            ].map((item) => (
              <div className="settings-toggle-row" key={item.key}>
                <div>
                  <div className="settings-toggle-label">{item.label}</div>
                  <div className="settings-toggle-desc">{item.desc}</div>
                </div>
                <button
                  className={`settings-switch ${settings.notificationPrefs[item.key] ? 'on' : ''}`}
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
          <h3 className="settings-section-title">Xogta Akoonkayga</h3>
          <div className="settings-account-card">
            <div className="settings-account-avatar">{(profile?.fullName || 'U').slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="settings-account-name">{profile?.fullName || 'Isticmaale'}</div>
              <div className="settings-account-role">{profile?.role === 'teacher' ? 'Macallin' : 'Maamule / Owner'}</div>
            </div>
          </div>

          <div className="settings-grid">
            <div className="settings-field full">
              <label>Iimaylka</label>
              <input type="email" value={profile?.email || ''} disabled />
            </div>
            <div className="settings-field">
              <label>Furaha Sirta Cusub</label>
              <input type="password" placeholder="••••••••" />
            </div>
            <div className="settings-field">
              <label>Xaqiiji Furaha Sirta</label>
              <input type="password" placeholder="••••••••" />
            </div>
          </div>
          <button type="button" className="btn-primary settings-save-btn" onClick={flashSaved}>Kaydi Isbeddelka</button>
        </div>
      )}

      <SavedToast show={toastVisible} />
    </div>
  );
}

export default Settings;