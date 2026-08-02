import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import { findLinkedStaffAccount } from '../../firebase/staff';
import TeacherProfileModal from './TeacherProfileModal';
import TeacherFormModal from './TeacherFormModal';
import '../../styles/dashboard-shared.css';

const STATUS_CLS = { active: 'badge-success', leave: 'badge-warning', inactive: 'badge-neutral' };
const STATUS_LABEL_KEY = { active: 'common.status.active', leave: 'common.leave', inactive: 'common.status.inactive' };

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Teachers() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showError } = useToast();
  const { teachers, addTeacher, updateTeacher, cycleTeacherAttendanceRecord, cascadeUnlinkTeacher, allStaffAttendanceRecords } = useSchoolData();
  const [search, setSearch] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || null;

  const selectedTeacherAttendance = useMemo(
    () => allStaffAttendanceRecords
      .filter((r) => r.category === 'teachers' && r.personId === selectedTeacherId)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [allStaffAttendanceRecords, selectedTeacherId]
  );

  // Macallimiinta 'inactive' (la saaray, fiiri cascadeUnlinkTeacher) waa in
  // aysan ka muuqan liiska caadiga ah — sida ay ka baxeen Users.jsx/Classes.jsx,
  // waa in ay sidoo kale ka baxaan halkan (xogtoodu weli waxay ku jirtaa
  // Firestore taariikh ahaan, kaliya ma muuqato UI-gan).
  const activeTeachers = teachers.filter((t) => t.status !== 'inactive');

  const filtered = activeTeachers.filter((t) =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingTeacher(null);
    setShowFormModal(true);
  };

  useEffect(() => {
    if (location.state?.openAdd) {
      openAddModal();
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setShowFormModal(true);
  };

  const handleSaveTeacher = (payload, teacherId) => {
    if (teacherId) {
      updateTeacher(teacherId, payload);
    } else {
      addTeacher(payload);
    }
  };

  // "Ka Saar" gaar ah oo Teachers.jsx (madax-bannaan Users.jsx) — la mid ah
  // habka Users.jsx isticmaalo marka macallin laga saaro halkaas (fiiri
  // cascadeUnlinkTeacher: nadiifiya classes/subjects, status->inactive, ma
  // tirtiro dhab ahaan). Haddii macallinkan uu weli haysto account gelitaan
  // (Users.jsx, teacherDocId isku xiran), waa la diidayaa — si aan looga
  // tagin account gelitaan ah oo aan lahayn macallin la xiriira.
  const handleRemoveTeacher = async (teacher) => {
    if (!window.confirm(t('teachers.confirmRemove', { name: teacher.fullName }))) return;
    try {
      const linkedAccount = await findLinkedStaffAccount(profile.schoolCode, teacher.id);
      if (linkedAccount) {
        showError(t('teachers.linkedAccountBlocked'));
        return;
      }
      await cascadeUnlinkTeacher(teacher.id);
    } catch (err) {
      console.error('Khalad ayaa dhacay markii macallinka la saarayay:', err);
      showError(t('teachers.removeError'));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('teachers.pageTitle')}</h2>
          <p>{t('teachers.pageSubtitle')}</p>
        </div>
        <button className="btn-primary" onClick={openAddModal}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          {t('teachers.addNew')}
        </button>
      </div>

      <div className="dash-card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder={t('teachers.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('teachers.table.teacher')}</th>
                <th>{t('teachers.table.email')}</th>
                <th>{t('teachers.table.subject')}</th>
                <th>{t('teachers.table.classes')}</th>
                <th>{t('teachers.table.phone')}</th>
                <th>{t('teachers.table.status')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t2) => (
                <tr key={t2.id}>
                  <td>
                    <div className="cell-person">
                      <div className="cell-avatar">{initials(t2.fullName)}</div>
                      <div>
                        <div className="cell-name">{t2.fullName}</div>
                        <div className="cell-sub">{t2.teacherId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-sub">{t2.email}</td>
                  <td>{t2.subject}</td>
                  <td>{t2.assignedClasses.join(', ')}</td>
                  <td className="cell-sub">{t2.phone}</td>
                  <td><span className={`badge ${STATUS_CLS[t2.status] || STATUS_CLS.active}`}>{t(STATUS_LABEL_KEY[t2.status] || STATUS_LABEL_KEY.active)}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action-btn" title={t('common.actions.view')} onClick={() => setSelectedTeacherId(t2.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="row-action-btn" title={t('common.actions.edit')} onClick={() => openEditModal(t2)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                      </button>
                      <button className="row-action-btn" title={t('common.actions.delete')} onClick={() => handleRemoveTeacher(t2)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.noResults')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <span className="pagination-info">{t('teachers.pagination', { shown: filtered.length, total: activeTeachers.length })}</span>
        </div>
      </div>

      {selectedTeacher && (
        <TeacherProfileModal
          teacher={selectedTeacher}
          attendanceRecords={selectedTeacherAttendance}
          onClose={() => setSelectedTeacherId(null)}
          onToggleAttendance={cycleTeacherAttendanceRecord}
        />
      )}

      <TeacherFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveTeacher}
        teacher={editingTeacher}
      />
    </div>
  );
}

export default Teachers;
