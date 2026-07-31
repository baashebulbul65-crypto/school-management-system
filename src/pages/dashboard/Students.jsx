import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSchoolData } from '../../context/SchoolDataContext';
import StudentProfileModal from './StudentProfileModal';
import StudentFormModal from './StudentFormModal';
import '../../styles/dashboard-shared.css';

const STATUS_CLS = { active: 'badge-success', inactive: 'badge-neutral' };
const FEE_CLS = { paid: 'badge-success', pending: 'badge-warning', overdue: 'badge-danger' };

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Students() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { students, studentsLoading, addStudent, updateStudent, deleteStudent, toggleStudentAttendanceDay, seedDemoStudents } = useSchoolData();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  const classes = useMemo(() => ['all', ...new Set(students.map((s) => s.className))], [students]);

  const filtered = students.filter((s) => {
    const matchesSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === 'all' || s.className === classFilter;
    return matchesSearch && matchesClass;
  });

  const openAddModal = () => {
    setEditingStudent(null);
    setShowAddModal(true);
  };

  useEffect(() => {
    if (location.state?.openAdd) {
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

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('students.pageTitle')}</h2>
          <p>{t('students.pageSubtitle')}</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          {t('students.addNew')}
        </button>
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
            {classes.map((c) => (
              <option key={c} value={c}>{c === 'all' ? t('students.allClasses') : c}</option>
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
                <th>{t('students.table.fee')}</th>
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
                  <td><span className={`badge ${FEE_CLS[s.fee]}`}>{t(`common.status.${s.fee}`)}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action-btn" title={t('common.actions.view')} onClick={() => setSelectedStudentId(s.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="row-action-btn" title={t('common.actions.edit')} onClick={() => openEditModal(s)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                      </button>
                      <button className="row-action-btn danger" title={t('common.actions.delete')} onClick={() => handleDeleteStudent(s.id, s.fullName)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {studentsLoading && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.loading')}</td></tr>
              )}
              {!studentsLoading && filtered.length === 0 && students.length === 0 && (
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
              {!studentsLoading && filtered.length === 0 && students.length > 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.noResults')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <span className="pagination-info">{t('students.pagination', { shown: filtered.length, total: students.length })}</span>
          <div className="pagination-controls">
            <button className="page-btn active">1</button>
          </div>
        </div>
      </div>

      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudentId(null)}
          onToggleAttendance={toggleStudentAttendanceDay}
        />
      )}

      <StudentFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveStudent}
        student={editingStudent}
      />
    </div>
  );
}

export default Students;
