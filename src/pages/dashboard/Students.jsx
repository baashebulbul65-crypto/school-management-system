import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import { getMonthlyFeeStatus } from '../../utils/studentFee';
import { currentMonthValue } from '../../utils/somaliDate';
import StudentProfileModal from './StudentProfileModal';
import StudentFormModal from './StudentFormModal';
import ArchiveStudentModal from './ArchiveStudentModal';
import BackButton from '../../components/dashboard/BackButton';
import '../../styles/dashboard-shared.css';

const STATUS_CLS = { active: 'badge-success', inactive: 'badge-neutral' };
const FEE_CLS = { paid: 'badge-success', unpaid: 'badge-danger', free: 'badge-neutral' };
const FEE_LABEL_KEY = { paid: 'finance.classDetail.stats.paid', unpaid: 'finance.classDetail.stats.unpaid', free: 'finance.classDetail.stats.free' };

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Students() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    students, studentsLoading, addStudent, updateStudent, deleteStudent, seedDemoStudents,
    allStudentAttendanceRecords, feePayments, myClassIds, myClassNames, archiveStudent,
  } = useSchoolData();
  // Macallinku gebi ahaanba wuu ka mamnuucan yahay Finance-ka, xitaa xaaladda
  // lacagta ardayda fasalkiisa (Teacher Role Scoping audit, 2026-08-02) —
  // "Ku Dar Arday" waa owner-kaliya, gudarkiisu waa ku xiran yahay Firestore
  // Rules-ka cusub (fiiri firestore.rules: students create).
  const isOwner = profile?.role !== 'teacher';
  // Macallinku wuxuu kaliya arkaa ardayda fasalladiisa gaarka ah (myClassIds/
  // myClassNames, fiiri SchoolDataContext.jsx) — ma aha ardayda dugsiga oo
  // dhan (Teacher Role Scoping, 2026-08-02).
  const visibleStudents = myClassIds
    ? students.filter((s) => (s.classId ? myClassIds.has(s.classId) : myClassNames.has(s.className)))
    : students;
  const currentMonth = currentMonthValue();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [archivingStudent, setArchivingStudent] = useState(null);

  const selectedStudent = visibleStudents.find((s) => s.id === selectedStudentId) || null;

  const selectedStudentAttendance = useMemo(
    () => allStudentAttendanceRecords
      .filter((r) => r.studentId === selectedStudentId)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [allStudentAttendanceRecords, selectedStudentId]
  );

  // Fasallada dropdown-ka filter-ka — waxaa lagu kala saaraa classId (ma aha
  // className oo free-text ah), si labo fasal oo isku magac ah (className)
  // balse classId kala duwan aanay isku darsamin hal khayaad filter ah
  // (Students audit MEDIUM, 2026-08-26). Ardayda hore ee aan lahayn classId
  // waxay isticmaalaan className sida "key" fallback ah (isla mabda'a
  // myClassIds/myClassNames kore).
  const classFilterOptions = useMemo(() => {
    const seen = new Map();
    visibleStudents.forEach((s) => {
      const key = s.classId || s.className;
      if (key && !seen.has(key)) seen.set(key, s.className);
    });
    return [...seen.entries()];
  }, [visibleStudents]);

  const filtered = visibleStudents.filter((s) => {
    const matchesSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === 'all' || (s.classId || s.className) === classFilter;
    return matchesSearch && matchesClass;
  });

  const openAddModal = () => {
    setEditingStudent(null);
    setShowAddModal(true);
  };

  useEffect(() => {
    if (location.state?.openAdd && isOwner) {
      openAddModal();
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const openEditModal = (student) => {
    setEditingStudent(student);
    setShowAddModal(true);
  };

  const handleSaveStudent = (payload, studentId) => {
    if (studentId) {
      updateStudent(studentId, payload);
    } else {
      addStudent(payload);
    }
  };

  const handleDeleteStudent = (studentId, fullName) => {
    const confirmed = window.confirm(t('common.confirmSoftDelete', { name: fullName }));
    if (confirmed) {
      deleteStudent(studentId);
      if (selectedStudentId === studentId) setSelectedStudentId(null);
    }
  };

  const handleConfirmArchive = (enrollmentStatus, note) => {
    if (!archivingStudent) return;
    archiveStudent(archivingStudent.id, enrollmentStatus, note);
    if (selectedStudentId === archivingStudent.id) setSelectedStudentId(null);
    setArchivingStudent(null);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('students.pageTitle')}</h2>
          <p>{t('students.pageSubtitle')}</p>
        </div>
        <div className="page-header-actions">
          <BackButton to="/dashboard" />
          {isOwner && (
            <button className="btn-primary" onClick={openAddModal}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {t('students.addNew')}
            </button>
          )}
        </div>
      </div>

      <div className="dash-card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder={t('students.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
            <option value="all">{t('students.allClasses')}</option>
            {classFilterOptions.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('students.table.student')}</th>
                <th>{t('students.table.id')}</th>
                <th>{t('students.table.class')}</th>
                <th>{t('students.table.gender')}</th>
                <th>{t('students.table.status')}</th>
                {isOwner && <th>{t('students.table.fee')}</th>}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="cell-person">
                      <div className="cell-avatar">{initials(s.fullName)}</div>
                      <span className="cell-name">{s.fullName}</span>
                    </div>
                  </td>
                  <td className="cell-sub">{s.studentId}</td>
                  <td>{s.className}</td>
                  <td>{s.gender}</td>
                  <td><span className={`badge ${STATUS_CLS[s.status]}`}>{t(`common.status.${s.status}`)}</span></td>
                  {isOwner && (
                    <td>
                      {(() => {
                        const feeStatus = getMonthlyFeeStatus(s, feePayments, currentMonth);
                        return <span className={`badge ${FEE_CLS[feeStatus]}`}>{t(FEE_LABEL_KEY[feeStatus])}</span>;
                      })()}
                    </td>
                  )}
                  <td>
                    <div className="row-actions">
                      <button className="row-action-btn" title={t('common.actions.view')} onClick={() => setSelectedStudentId(s.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      {isOwner && (
                        <>
                          <button className="row-action-btn" title={t('common.actions.edit')} onClick={() => openEditModal(s)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                          </button>
                          <button className="row-action-btn" title={t('students.archive.action')} onClick={() => setArchivingStudent(s)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>
                          </button>
                          <button className="row-action-btn danger" title={t('common.actions.delete')} onClick={() => handleDeleteStudent(s.id, s.fullName)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {studentsLoading && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.loading')}</td></tr>
              )}
              {!studentsLoading && filtered.length === 0 && isOwner && students.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>
                    {t('students.emptyNoStudents')}
                    <div style={{ marginTop: 12 }}>
                      <button type="button" className="btn-secondary" onClick={seedDemoStudents}>
                        {t('students.seedDemo')}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!studentsLoading && filtered.length === 0 && !(isOwner && students.length === 0) && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.noResults')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <span className="pagination-info">{t('students.pagination', { shown: filtered.length, total: visibleStudents.length })}</span>
          <div className="pagination-controls">
            <button className="page-btn active">1</button>
          </div>
        </div>
      </div>

      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          attendanceRecords={selectedStudentAttendance}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      <StudentFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveStudent}
        student={editingStudent}
      />

      <ArchiveStudentModal
        isOpen={!!archivingStudent}
        onClose={() => setArchivingStudent(null)}
        onConfirm={handleConfirmArchive}
        student={archivingStudent}
      />
    </div>
  );
}

export default Students;
