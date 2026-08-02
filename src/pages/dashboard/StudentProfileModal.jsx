import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import { currentMonthValue } from '../../utils/somaliDate';
import { getMonthlyFeeStatus, studentFeeOwed } from '../../utils/studentFee';
import './StudentProfileModal.css';

function initials(name) {
  return name ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '';
}

function InfoRow({ label, value }) {
  return (
    <div className="spm-info-row">
      <span className="spm-info-label">{label}</span>
      <span className="spm-info-value">{value || '—'}</span>
    </div>
  );
}

function StudentProfileModal({ student, attendanceRecords, onClose, onToggleAttendance }) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('guud');
  const { feePayments } = useSchoolData();
  // Macallinku gebi ahaanba wuu ka mamnuucan yahay Finance-ka — xitaa
  // xaaladda lacagta fasalkiisa gaarka ah (Teacher Role Scoping audit,
  // 2026-08-02). feePayments-ku waa madhan macallinka (fiiri
  // SchoolDataContext.jsx), sidaas darteed tab-kan waa in laga qariyaa.
  const isTeacher = profile?.role === 'teacher';

  if (!student) return null;

  // Xaaladda bishan + taariikhda bixinnada DHABTA AH ee ardaygan (feePayments),
  // ma aha "student.fees" (array hore oo mar walba madhan, fiiri commit-kii
  // ParentPortal-ka).
  const currentMonth = currentMonthValue();
  const feeStatus = getMonthlyFeeStatus(student, feePayments, currentMonth);
  const feeOwed = studentFeeOwed(student);
  const studentPayments = feePayments
    .filter((p) => p.feeType === 'student' && p.studentId === student.id)
    .sort((a, b) => b.month.localeCompare(a.month));

  const TABS = [
    { id: 'guud', label: t('students.profile.tabs.general') },
    { id: 'waxbarasho', label: t('students.profile.tabs.academic') },
    { id: 'imaanshaha', label: t('students.profile.tabs.attendance') },
    { id: 'natiijo', label: t('students.profile.tabs.results') },
    ...(isTeacher ? [] : [{ id: 'lacag', label: t('students.profile.tabs.fees') }]),
    { id: 'anshax', label: t('students.profile.tabs.behaviour') },
    { id: 'dukumenti', label: t('students.profile.tabs.documents') },
  ];

  return (
    <div className="spm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="spm-modal">

        {/* HEADER */}
        <div className="spm-header">
          <button className="spm-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>

          <div className="spm-header-top">
            <div className="spm-avatar">{initials(student.fullName)}</div>
            <div className="spm-header-info">
              <h2>{student.fullName}</h2>
              <p>{student.studentId} &middot; {student.className} - {student.section}</p>
              <span className={`badge ${student.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                {t(`common.status.${student.status}`)}
              </span>
            </div>
            <div className="spm-qr">
              <QRCodeSVG value={student.studentId || ''} size={72} bgColor="transparent" fgColor="#0B1F2B" />
              <span>{t('students.profile.qrCode')}</span>
            </div>
          </div>

          <div className="spm-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`spm-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="spm-body">

          {activeTab === 'guud' && (
            <div className="spm-grid">
              <InfoRow label={t('students.profile.info.fullName')} value={student.fullName} />
              <InfoRow label={t('students.profile.info.studentId')} value={student.studentId} />
              <InfoRow label={t('students.profile.info.gender')} value={student.gender} />
              <InfoRow label={t('students.profile.info.dob')} value={student.dob} />
              <InfoRow label={t('students.profile.info.phone')} value={student.phone} />
              <InfoRow label={t('students.profile.info.address')} value={student.address} />
              <div className="spm-divider">{t('students.profile.info.parentSection')}</div>
              <InfoRow label={t('students.profile.info.parentName')} value={student.parentName} />
              <InfoRow label={t('students.profile.info.relation')} value={student.parentRelation} />
              <InfoRow label={t('students.profile.info.parentPhone')} value={student.parentPhone} />
            </div>
          )}

          {activeTab === 'waxbarasho' && (
            <div className="spm-grid">
              <InfoRow label={t('students.profile.info.className')} value={student.className} />
              <InfoRow label={t('students.profile.info.section')} value={student.section} />
              <InfoRow label={t('students.profile.info.rollNumber')} value={student.rollNumber} />
              <div className="spm-divider">{t('students.profile.info.subjectsSection')}</div>
              <div className="spm-tags">
                {student.subjects?.map((sub) => (
                  <span key={sub} className="spm-tag">{sub}</span>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'imaanshaha' && (
            <div>
              <p className="spm-note">{t('students.profile.attendanceNote')}</p>
              <div className="attendance-grid">
                {(!attendanceRecords || attendanceRecords.length === 0) && (
                  <p className="spm-note">Weli imaansho ma jiro.</p>
                )}
                {attendanceRecords?.map((a) => (
                  <button
                    key={a.date}
                    className={`attendance-cell ${a.status}`}
                    onClick={() => onToggleAttendance?.(student.id, a.date)}
                    title={a.date}
                  >
                    <span className="attendance-date">{a.date.split('-')[2]}</span>
                    <span className="attendance-status">
                      {a.status === 'present' ? t('common.present')
                        : a.status === 'leave' ? t('common.leave')
                        : a.status === 'sick' ? t('common.sick')
                        : t('common.absent')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'natiijo' && (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>{t('students.profile.table.subject')}</th><th>{t('students.profile.table.marks')}</th><th>{t('students.profile.table.total')}</th><th>{t('students.profile.table.grade')}</th></tr>
                </thead>
                <tbody>
                  {student.examResults?.map((r) => (
                    <tr key={r.subject}>
                      <td>{r.subject}</td>
                      <td>{r.marks}</td>
                      <td>{r.maxMarks}</td>
                      <td><span className={`badge ${r.grade === 'A' ? 'badge-success' : r.grade === 'F' ? 'badge-danger' : 'badge-warning'}`}>{r.grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isTeacher && activeTab === 'lacag' && (
            <div>
              <p className="spm-fee-current-status">
                <span className={`badge ${feeStatus === 'paid' ? 'badge-success' : feeStatus === 'free' ? 'badge-neutral' : 'badge-danger'}`}>
                  {t(`finance.classDetail.stats.${feeStatus}`)}
                </span>
                {feeStatus !== 'free' && <span className="spm-fee-amount">${feeOwed.toFixed(2)}</span>}
              </p>

              <div className="spm-divider" style={{ marginTop: 20 }}>{t('students.profile.feeHistoryTitle')}</div>
              {studentPayments.length === 0 ? (
                <p className="spm-note">{t('students.profile.noFeeHistory')}</p>
              ) : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>{t('students.profile.table.month')}</th><th>{t('students.profile.table.amount')}</th><th>{t('students.profile.table.date')}</th></tr>
                    </thead>
                    <tbody>
                      {studentPayments.map((p) => (
                        <tr key={p.id}>
                          <td>{p.month}</td>
                          <td>${(p.amount || 0).toFixed(2)}</td>
                          <td className="cell-sub">{p.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'anshax' && (
            <div className="behaviour-list">
              {(!student.behaviour || student.behaviour.length === 0) && <p className="spm-note">{t('students.profile.noBehaviour')}</p>}
              {student.behaviour?.map((b, i) => (
                <div key={i} className={`behaviour-item ${b.type}`}>
                  <span className="behaviour-dot"></span>
                  <div>
                    <p>{b.note}</p>
                    <span className="behaviour-date">{b.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'dukumenti' && (
            <div className="documents-list">
              {(!student.documents || student.documents.length === 0) && <p className="spm-note">{t('students.profile.noDocuments')}</p>}
              {student.documents?.map((d, i) => (
                <div key={i} className="document-row">
                  <div className="document-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                  </div>
                  <div className="document-info">
                    <div className="document-name">{d.name}</div>
                    <div className="document-meta">{d.type} &middot; {d.uploadDate}</div>
                  </div>
                  <button className="row-action-btn" title={t('common.actions.download')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default StudentProfileModal;
