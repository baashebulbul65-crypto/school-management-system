import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSchoolData } from '../../context/SchoolDataContext';
import TeacherProfileModal from './TeacherProfileModal';
import TeacherFormModal from './TeacherFormModal';
import '../../styles/dashboard-shared.css';

const STATUS_CLS = { active: 'badge-success', leave: 'badge-warning' };

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Teachers() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { teachers, addTeacher, updateTeacher, toggleTeacherAttendanceDay } = useSchoolData();
  const [search, setSearch] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || null;

  const filtered = teachers.filter((t) =>
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
                  <td><span className={`badge ${STATUS_CLS[t2.status]}`}>{t2.status === 'active' ? t('common.status.active') : t('common.leave')}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="row-action-btn" title={t('common.actions.view')} onClick={() => setSelectedTeacherId(t2.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="row-action-btn" title={t('common.actions.edit')} onClick={() => openEditModal(t2)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
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
          <span className="pagination-info">{t('teachers.pagination', { shown: filtered.length, total: teachers.length })}</span>
        </div>
      </div>

      {selectedTeacher && (
        <TeacherProfileModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacherId(null)}
          onToggleAttendance={toggleTeacherAttendanceDay}
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
