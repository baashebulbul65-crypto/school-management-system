import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import SubjectFormModal from './SubjectFormModal';
import '../../styles/dashboard-shared.css';

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Subjects() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { subjects, teachers, addSubject, updateSubject, removeSubject } = useSchoolData();
  // Add/Edit/Delete waa owner-kaliya (Teacher Role Scoping audit, 2026-08-02)
  // — la mid ah Classes.jsx, fiiri firestore.rules: subjects.
  const isOwner = profile?.role !== 'teacher';
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const filtered = subjects.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingSubject(null);
    setShowFormModal(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setShowFormModal(true);
  };

  const handleSaveSubject = (payload, subjectId) => {
    if (subjectId) {
      updateSubject(subjectId, payload);
    } else {
      addSubject(payload);
    }
  };

  const handleDeleteSubject = (subjectId, name) => {
    const confirmed = window.confirm(t('subjects.confirmDelete', { name }));
    if (confirmed) {
      removeSubject(subjectId);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('subjects.pageTitle')}</h2>
          <p>{t('subjects.pageSubtitle')}</p>
        </div>
        {isOwner && (
          <button className="btn-primary" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            {t('subjects.addNew')}
          </button>
        )}
      </div>

      <div className="dash-card">
        <div className="table-toolbar">
          <div className="table-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder={t('subjects.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('subjects.table.subject')}</th>
                <th>{t('subjects.table.code')}</th>
                <th>{t('subjects.table.teacher')}</th>
                <th>{t('subjects.table.credit')}</th>
                <th>{t('subjects.table.weeklyHours')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="cell-person">
                      <div className="cell-avatar">{initials(s.name)}</div>
                      <span className="cell-name">{s.name}</span>
                    </div>
                  </td>
                  <td className="cell-sub">{s.code}</td>
                  <td>{teachers.find((tc) => tc.id === s.teacherId)?.fullName || s.teacher || '—'}</td>
                  <td><span className="badge badge-neutral">{s.credit} {t('subjects.creditUnit')}</span></td>
                  <td className="cell-sub">{s.weeklyHours} {t('subjects.hoursPerWeek')}</td>
                  <td>
                    {isOwner && (
                      <div className="row-actions">
                        <button className="row-action-btn" title={t('common.actions.edit')} onClick={() => openEditModal(s)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                        </button>
                        <button className="row-action-btn danger" title={t('common.actions.delete')} onClick={() => handleDeleteSubject(s.id, s.name)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.noResults')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <span className="pagination-info">{t('subjects.pagination', { shown: filtered.length, total: subjects.length })}</span>
        </div>
      </div>

      <SubjectFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveSubject}
        subject={editingSubject}
        teachers={teachers.filter((tc) => tc.status !== 'inactive')}
      />
    </div>
  );
}

export default Subjects;
