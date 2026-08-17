import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSchoolData } from '../../context/SchoolDataContext';
import StudentProfileModal from './StudentProfileModal';
import '../../styles/dashboard-shared.css';

const STATUS_CLS = { graduated: 'badge-success', withdrawn: 'badge-warning' };

function initials(name) {
  return name ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '';
}

function ArchivedStudents() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { archivedStudents, restoreArchivedStudent, allStudentAttendanceRecords } = useSchoolData();
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const selectedStudent = archivedStudents.find((s) => s.id === selectedStudentId) || null;
  const selectedStudentAttendance = useMemo(
    () => allStudentAttendanceRecords.filter((r) => r.studentId === selectedStudentId),
    [allStudentAttendanceRecords, selectedStudentId]
  );

  const handleRestore = (studentId, fullName) => {
    const confirmed = window.confirm(t('students.archive.confirmRestore', { name: fullName }));
    if (confirmed) restoreArchivedStudent(studentId);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('students.archive.pageTitle')}</h2>
          <p>{t('students.archive.pageSubtitle')}</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {t('common.backToDashboard')}
        </button>
      </div>

      <div className="dash-card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('students.archive.table.name')}</th>
                <th>{t('students.archive.table.lastClass')}</th>
                <th>{t('students.archive.table.status')}</th>
                <th>{t('students.archive.table.archivedDate')}</th>
                <th>{t('students.archive.table.note')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {archivedStudents.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="cell-person">
                      <div className="cell-avatar">{initials(s.fullName)}</div>
                      <span className="cell-name">{s.fullName}</span>
                    </div>
                  </td>
                  <td className="cell-sub">{s.className || '—'}</td>
                  <td>
                    <span className={`badge ${STATUS_CLS[s.enrollmentStatus]}`}>
                      {t(`students.archive.modal.${s.enrollmentStatus}`)}
                    </span>
                  </td>
                  <td className="cell-sub">{s.archivedAt ? s.archivedAt.split('T')[0] : '—'}</td>
                  <td className="cell-sub">{s.archivedNote || '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action-btn" title={t('common.actions.view')} onClick={() => setSelectedStudentId(s.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="row-action-btn" title={t('students.archive.restore')} onClick={() => handleRestore(s.id, s.fullName)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {archivedStudents.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('students.archive.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          attendanceRecords={selectedStudentAttendance}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
}

export default ArchivedStudents;
