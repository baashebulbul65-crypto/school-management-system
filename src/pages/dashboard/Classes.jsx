import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import ClassFormModal from './ClassFormModal';
import BackButton from '../../components/dashboard/BackButton';
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
  const [openMenuId, setOpenMenuId] = useState(null);

  const toggleMenu = (id) => setOpenMenuId((prev) => (prev === id ? null : id));
  const closeMenu = () => setOpenMenuId(null);

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

  // Subax/Galab kala soocid (2026-09-14, Diiwaan comparison) — hore ayay
  // isugu jireen hal grid random ah (2 column, session ma xisaabinayn column-
  // ka), taasoo dhanka mobile-ka aad muhiim ugu ahayd, marka la eego. Hadda
  // waa 2 qaybood oo gooni ah (.filter() ma bedelin dariiqooyinka, sidaas
  // darteed fasal cusub wuxuu ku dhamaadaa hoosta liiskiisa qaybta — ma aha
  // meel random ah).
  const subaxClasses = filtered.filter((c) => (c.session || 'subax') === 'subax');
  const galabClasses = filtered.filter((c) => (c.session || 'subax') === 'galab');

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

  // Card-ka fasalka — la soo saaray hal function (Subax/Galab columns audit,
  // 2026-09-14) si aan loo laba-qorin isla JSX-ka gudaha labada qaybood.
  // Diiwaan-comparison redesign (2026-09-15): icon-box-kii kor ku yiil
  // (book icon) la saaray — reference-ka Diiwaan gebi ahaanba ma lahayn
  // (kaliya kebab-menu-ga edit/delete ayaa haray, mid qura oo geeska sare
  // ku taal). session-ka badge/pill-kiisii waxaa loo beddelay qoraal
  // cagaaran oo hoos ka socda magaca (ma aha pill). progress bar-kii
  // (xx/capacity) waxaa loo beddelay icon-qof + tirada ardayda oo qura
  // (user-ka la weydiiyay, la doortay "sida Diiwaan" — capacity kama
  // muuqato card-ka, waa xog la keydiyo oo la isticmaali karo meel kale).
  const renderClassCard = (c) => {
    // Tirada ardayda waa in la xisaabiyaa (derived) xogta DHABTA AH ee
    // "students" — ma aha counter kaydsan (c.students), kaas oo mar
    // walba ahaan lahaa 0 (weligiis lama cusboonaysiin, fiiri
    // SchoolDataContext.jsx: addClass).
    const studentCount = students.filter((s) => (s.classId ? s.classId === c.id : s.className === `${c.grade}${c.section}`)).length;
    // Fasallada hore ee la abuuray ka hor field-kan (Classes audit,
    // 2026-08-26) ma laha "session" — waxay noqonayaan "subax" default
    // ahaan ilaa Owner-ku dib u eego oo kaydiyo (fiiri ClassFormModal.jsx:
    // isla fallback-ka), si aan xogta jirta u jajabin.
    const session = c.session || 'subax';
    return (
      <div className={`class-card session-${session}`} key={c.id}>
        {isOwner && (
          <div className="class-card-top">
            <div className="class-card-actions">
              <button className="row-action-btn" title={t('common.actions.more')} onClick={(e) => { e.stopPropagation(); toggleMenu(c.id); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </button>
              {openMenuId === c.id && (
                <>
                  <div className="class-card-menu-overlay" onClick={closeMenu}></div>
                  <div className="class-card-menu">
                    <button onClick={() => { closeMenu(); openEditModal(c); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                      {t('common.actions.edit')}
                    </button>
                    <button className="danger" onClick={() => { closeMenu(); handleDeleteClass(c.id, `${c.grade} ${c.section}`); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                      {t('common.actions.delete')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* "- {section}" laga saaray (2026-09-15, Diiwaan-comparison
            round 2, user-request): reference-ku ma muujiyo section-ka
            card-ka — "section" xogteedu weli waa la kaydiyaa (fiiri
            ClassFormModal.jsx), kaliya card-ka lagama muujin. */}
        <h3>{c.grade}</h3>
        <p className={`class-session-label ${session}`}>{t(`classes.session.${session}`)}</p>
        <p className="class-room">{c.room}</p>
        <p className="class-teacher">
          {teachers.find((tc) => tc.id === c.classTeacherId)?.fullName || c.classTeacher || '—'}
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

        <div className="class-student-count">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zM4 22c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>
          <span>{studentCount}</span>
        </div>

        <button className="btn-secondary class-open-btn" onClick={() => navigate(`/dashboard/classes/${c.id}`)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
          {t('classes.openWorkspace')}
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('classes.pageTitle')}</h2>
          <p>{t('classes.pageSubtitle')}</p>
        </div>
        <div className="page-header-actions">
          <BackButton to="/dashboard" />
          {isOwner && (
            <button className="btn-primary" onClick={openAddModal}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {t('classes.addNew')}
            </button>
          )}
        </div>
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
        filtered.length === 0 ? (
          <p style={{ color: '#94A3B8', textAlign: 'center', padding: '32px' }}>{t('common.noResults')}</p>
        ) : (
          <div className="classes-session-columns">
            <div className="classes-session-col">
              <h3 className="classes-session-heading subax">{t('classes.session.subax')}</h3>
              {subaxClasses.length > 0 ? (
                <div className="classes-grid">{subaxClasses.map(renderClassCard)}</div>
              ) : (
                <p className="classes-session-empty">{t('classes.noneInSession')}</p>
              )}
            </div>
            <div className="classes-session-col">
              <h3 className="classes-session-heading galab">{t('classes.session.galab')}</h3>
              {galabClasses.length > 0 ? (
                <div className="classes-grid">{galabClasses.map(renderClassCard)}</div>
              ) : (
                <p className="classes-session-empty">{t('classes.noneInSession')}</p>
              )}
            </div>
          </div>
        )
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
