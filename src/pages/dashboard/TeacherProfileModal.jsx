import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSchoolData } from '../../context/SchoolDataContext';
import { useSettings } from '../../context/SettingsContext';
import { classroomName } from '../../hooks/useClassOptions';
import { currencySymbol } from '../../utils/currency';
import './TeacherProfileModal.css';

// Isla habka Teachers.jsx (liiska) — hubi 'inactive' (macallin la saaray,
// cascadeUnlinkTeacher) si aan lagu qalin qaadin "Fasax" (leave) haddii
// mustaqbalka profile-kan loo furi karo macallin 'inactive' ah (hadda
// Teachers.jsx horeba wuu ka qariyaa liiska, marka ma la gaari karo, laakiin
// waa in muuqaalku sax yahay haddii taasi isbeddesho).
const STATUS_CLS = { active: 'badge-success', leave: 'badge-warning', inactive: 'badge-neutral' };
const STATUS_LABEL_KEY = { active: 'common.status.active', leave: 'common.leave', inactive: 'common.status.inactive' };

function initials(name) {
  return name ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '';
}

function InfoRow({ label, value }) {
  return (
    <div className="tpm-info-row">
      <span className="tpm-info-label">{label}</span>
      <span className="tpm-info-value">{value || '—'}</span>
    </div>
  );
}

function TeacherProfileModal({ teacher, attendanceRecords, onClose, onToggleAttendance }) {
  const { t } = useTranslation();
  const { classes, salaries } = useSchoolData();
  const { settings } = useSettings();
  const cur = currencySymbol(settings.currency);
  const [activeTab, setActiveTab] = useState('guud');

  if (!teacher) return null;

  const TABS = [
    { id: 'guud', label: t('teachers.profile.tabs.general') },
    { id: 'imaanshaha', label: t('teachers.profile.tabs.attendance') },
    { id: 'mushahar', label: t('teachers.profile.tabs.salary') },
  ];

  // Audit (2026-08-02, gap #3) — fasallada la muujinayo halkan hadda waxaa
  // laga soo xisaabiyaa xiriirka DHABTA AH (classes.classTeacherId), ma aha
  // field-kii hore ee teacher.assignedClasses (oo aan lahayn xiriir dhab ah,
  // fiiri TeacherFormModal.jsx).
  const assignedClasses = classes.filter((c) => c.classTeacherId === teacher.id);
  const attendance = attendanceRecords || [];
  // Mushaharka DHABTA AH (financeSalaries, la xiriiray teacherId) — ma aha
  // teacher.salary (array hore oo mar walba madhan, marnaba lama qorin,
  // fiiri commit-kii ka saaray student.fees ee isla dhibaatadaas ahaa).
  const salary = salaries.filter((s) => s.teacherId === teacher.id);

  return (
    <div className="tpm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tpm-modal">

        {/* HEADER */}
        <div className="tpm-header">
          <button className="tpm-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <div className="tpm-header-top">
            <div className="tpm-avatar">{initials(teacher.fullName)}</div>
            <div className="tpm-header-info">
              <h2>{teacher.fullName}</h2>
              <p>{teacher.teacherId} &middot; {teacher.subject}</p>
              <span className={`badge ${STATUS_CLS[teacher.status] || STATUS_CLS.active}`}>
                {t(STATUS_LABEL_KEY[teacher.status] || STATUS_LABEL_KEY.active)}
              </span>
            </div>
          </div>

          <div className="tpm-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tpm-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="tpm-body">

          {activeTab === 'guud' && (
            <div className="tpm-grid">
              <InfoRow label={t('teachers.profile.info.fullName')} value={teacher.fullName} />
              <InfoRow label={t('teachers.profile.info.teacherId')} value={teacher.teacherId} />
              <InfoRow label={t('teachers.profile.info.phone')} value={teacher.phone} />
              <InfoRow label={t('teachers.profile.info.email')} value={teacher.email} />
              <InfoRow label={t('teachers.profile.info.qualification')} value={teacher.qualification} />
              <InfoRow label={t('teachers.profile.info.subject')} value={teacher.subject} />
              <div className="tpm-divider">{t('teachers.profile.assignedClassesSection')}</div>
              <div className="tpm-tags">
                {assignedClasses.length === 0 ? (
                  <p className="tpm-note">{t('teachers.profile.noAssignedClasses')}</p>
                ) : (
                  assignedClasses.map((c) => (
                    <span key={c.id} className="tpm-tag">{classroomName(c)}</span>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'imaanshaha' && (
            <div>
              <p className="tpm-note">{t('teachers.profile.attendanceNote')}</p>
              <div className="attendance-grid">
                {attendance.length === 0 ? (
                  <p className="tpm-note">{t('teachers.profile.noAttendance')}</p>
                ) : (
                  attendance.map((a) => (
                    <button
                      key={a.date}
                      className={`attendance-cell ${a.status}`}
                      onClick={() => onToggleAttendance?.(teacher.id, a.date)}
                      title={a.date}
                    >
                      <span className="attendance-date">{a.date.split('-')[2]}</span>
                      <span className="attendance-status">
                        {a.status === 'present' ? t('common.present') : a.status === 'late' ? t('common.late') : t('common.absent')}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'mushahar' && (
            <div className="data-table-wrap">
              {salary.length === 0 ? (
                <p className="tpm-note">{t('teachers.profile.noSalary')}</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>{t('teachers.profile.table.month')}</th><th>{t('teachers.profile.table.amount')}</th><th>{t('teachers.profile.table.payDate')}</th><th>{t('teachers.profile.table.status')}</th></tr>
                  </thead>
                  <tbody>
                    {salary.map((s) => (
                      <tr key={s.id}>
                        <td>{s.month}</td>
                        <td>{cur}{s.amount}</td>
                        <td className="cell-sub">{s.date || '—'}</td>
                        <td>
                          <span className={`badge ${s.status === 'paid' ? 'badge-success' : s.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                            {t(`common.status.${s.status}`)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default TeacherProfileModal;
