import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import ClassFormModal from './ClassFormModal';
import '../../styles/dashboard-shared.css';
import './Classes.css';

function Classes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { classes, teachers, students, subjects, addClass, updateClass, removeClass } = useSchoolData();
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // Macallinku gebi ahaanba wuu ka mamnuucan yahay class-management (add/
  // edit/delete), xitaa fasalkiisa gaarka ah — wuxuu isticmaalaa ClassWorkspace
  // (xaadiris/dhibco/Quraan). Wuxuu kaliya arkaa fasalka/fasallada uu
  // classTeacherId ahaan loo xilsaaray, ma aha liiska dugsiga oo dhan
  // (Teacher Role Scoping audit, 2026-08-02).
  const isOwner = profile?.role !== 'teacher';
  // Haddii macallinku uusan weli ku xirneyn diiwaanka Teachers (teacherDocId
  // maqan — fiiri UserFormModal.jsx, hadda waajib marka la abuurayo akoon
  // cusub, laakiin akoonada hore ee la abuuray ka hor waxay wali yeelan
  // karaan taas), waa in la muujiyaa fariin cad, ma aha "0 fasal" oo aan la
  // kala saarin khalad iyo xaalad caadi ah (Teacher Role Scoping audit).
  const notLinked = !isOwner && !profile?.teacherDocId;
  const visibleClasses = isOwner
    ? classes
    : classes.filter((c) => c.classTeacherId === profile?.teacherDocId);

  const filtered = visibleClasses.filter((c) =>
    `${c.grade} ${c.section}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingClass(null);
    setShowFormModal(true);
  };

  const openEditModal = (cls) => {
    setEditingClass(cls);
    setShowFormModal(true);
  };

  const handleSaveClass = (payload, classId) => {
    if (classId) {
      updateClass(classId, payload);
    } else {
      addClass(payload);
    }
  };

  const handleDeleteClass = (classId, className) => {
    const confirmed = window.confirm(t('common.confirmDelete', { name: className }));
    if (confirmed) {
      removeClass(classId);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('classes.pageTitle')}</h2>
          <p>{t('classes.pageSubtitle')}</p>
        </div>
        {isOwner && (
          <button className="btn-primary" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            {t('classes.addNew')}
          </button>
        )}
      </div>

      {notLinked && (
        <div className="dash-card" style={{ textAlign: 'center', padding: '24px', color: '#B45309', background: '#FFFBEB' }}>
          {t('classes.notLinked')}
        </div>
      )}

      {!notLinked && (
        <div className="table-toolbar">
          <div className="table-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              placeholder={t('classes.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {!notLinked && (
      <div className="classes-grid">
        {filtered.map((c) => {
          // Tirada ardayda waa in la xisaabiyaa (derived) xogta DHABTA AH ee
          // "students" — ma aha counter kaydsan (c.students), kaas oo mar
          // walba ahaan lahaa 0 (weligiis lama cusboonaysiin, fiiri
          // SchoolDataContext.jsx: addClass).
          const studentCount = students.filter((s) => (s.classId ? s.classId === c.id : s.className === `${c.grade}${c.section}`)).length;
          const percent = Math.round((studentCount / c.capacity) * 100);
          return (
            <div className="class-card" key={c.id}>
              <div className="class-card-top">
                <div className="class-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg>
                </div>
                {isOwner && (
                  <div className="class-card-actions">
                    <button className="row-action-btn" title={t('common.actions.edit')} onClick={() => openEditModal(c)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                    </button>
                    <button className="row-action-btn danger" title={t('common.actions.delete')} onClick={() => handleDeleteClass(c.id, `${c.grade} ${c.section}`)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                    </button>
                  </div>
                )}
              </div>

              <h3>{c.grade} - {c.section}</h3>
              <p className="class-room">{c.room}</p>
              <p className="class-teacher">
                {teachers.find((t) => t.id === c.classTeacherId)?.fullName || c.classTeacher || '—'}
              </p>

              {(() => {
                // subjectIds (xiriir dhab ah) haddii jiro, haddii kalese
                // fallback-ka qoraalka hore (cls.subjects) ilaa fasalku dib
                // loo kaydiyo dropdown-ka cusub.
                const subjectNames = c.subjectIds
                  ? c.subjectIds.map((id) => subjects.find((sub) => sub.id === id)?.name).filter(Boolean)
                  : (c.subjects || []);
                return (
                  <div className="class-subjects">
                    {subjectNames.slice(0, 3).map((s) => (
                      <span key={s} className="class-subject-tag">{s}</span>
                    ))}
                    {subjectNames.length > 3 && (
                      <span className="class-subject-tag more">+{subjectNames.length - 3}</span>
                    )}
                  </div>
                );
              })()}

              <div className="class-progress">
                <div className="class-progress-bar">
                  <div className="class-progress-fill" style={{ width: `${percent}%` }}></div>
                </div>
                <span>{studentCount}/{c.capacity}</span>
              </div>

              <button className="btn-secondary class-open-btn" onClick={() => navigate(`/dashboard/classes/${c.id}`)}>
                {t('classes.openWorkspace')}
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ color: '#94A3B8', gridColumn: '1 / -1', textAlign: 'center', padding: '32px' }}>{t('common.noResults')}</p>
        )}
      </div>
      )}

      <ClassFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveClass}
        cls={editingClass}
        teachers={teachers.filter((tc) => tc.status !== 'inactive')}
        subjects={subjects}
      />
    </div>
  );
}

export default Classes;
