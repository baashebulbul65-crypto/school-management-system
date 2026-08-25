import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import { isoDateDaysAgo, formatDMY } from '../../utils/somaliDate';
import BackButton from '../../components/dashboard/BackButton';
import '../../styles/dashboard-shared.css';
import './ClassWorkspace.css';
import './QuranTracking.css';

const HISTORY_DAYS = 10;

function initials(name) {
  return name ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '';
}

function QuranTracking() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { classId } = useParams();
  const navigate = useNavigate();
  const {
    students, classes, myClasses,
    quranProgressToday, allQuranProgressRecords,
  } = useSchoolData();

  const isTeacher = profile?.role === 'teacher';

  // ===== LIISKA FASALLADA (marka aan classId la haynin — QAYBTA 2) =====
  // Macallinku wuxuu arkaa KALIYA fasalladiisa (myClasses, isla mabda'a
  // Overview.jsx/Classes.jsx); owner-ku wuxuu arkaa dhammaan fasallada.
  const visibleClasses = isTeacher ? (myClasses || []) : classes;

  const classCounts = useMemo(
    () =>
      visibleClasses
        .map((c) => {
          const classroomName = `${c.grade}${c.section}`;
          const classStudents = students.filter((s) => (s.classId ? s.classId === c.id : s.className === classroomName));
          const count = classStudents.filter((s) => quranProgressToday[s.id]?.result === 'garanwaa').length;
          return { cls: c, count };
        })
        .sort((a, b) => b.count - a.count),
    [visibleClasses, students, quranProgressToday]
  );

  // ===== GUDAHA FASAL GAAR AH (marka classId la haysto — QAYBTA 3) =====
  const cls = classId ? classes.find((c) => String(c.id) === classId) : null;
  // Xannibaad (isla mabda'a ClassWorkspace.jsx): macallinku si toos ah URL
  // ugu mari maayo fasal aan kiisa ahayn.
  const notMyClass = !!classId && isTeacher && !!cls && cls.classTeacherId !== profile?.teacherDocId;

  const classroomName = cls ? `${cls.grade}${cls.section}` : '';
  const classStudents = useMemo(
    () => (cls ? students.filter((s) => (s.classId ? s.classId === cls.id : s.className === classroomName)) : []),
    [students, cls, classroomName]
  );

  const missedStudents = useMemo(
    () => classStudents.filter((s) => quranProgressToday[s.id]?.result === 'garanwaa'),
    [classStudents, quranProgressToday]
  );

  const last10Dates = useMemo(() => {
    const dates = [];
    for (let i = HISTORY_DAYS - 1; i >= 0; i--) dates.push(isoDateDaysAgo(i));
    return dates;
  }, []);

  const historyByStudent = useMemo(() => {
    const map = {};
    allQuranProgressRecords.forEach((r) => {
      if (!map[r.studentId]) map[r.studentId] = {};
      map[r.studentId][r.date] = r.result;
    });
    return map;
  }, [allQuranProgressRecords]);

  if (classId && (!cls || notMyClass)) {
    return (
      <div className="dash-card cw-not-found">
        <p>{t('quranTracking.notFound')}</p>
        <BackButton to="/dashboard/quran-tracking" />
      </div>
    );
  }

  // ===== VIEW 1: LIISKA FASALLADA =====
  if (!classId) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-text">
            <h2>{t('quranTracking.title')}</h2>
            <p>{t('quranTracking.subtitle')}</p>
          </div>
          <div className="page-header-actions">
            <BackButton to="/dashboard" />
          </div>
        </div>

        <div className="dash-card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('quranTracking.table.class')}</th><th>{t('quranTracking.table.count')}</th></tr></thead>
              <tbody>
                {classCounts.map(({ cls: c, count }) => (
                  <tr key={c.id} className="qh-class-row" onClick={() => navigate(`/dashboard/quran-tracking/${c.id}`)}>
                    <td className="cell-name">{c.grade}{c.section}</td>
                    <td>
                      <span className={`badge ${count > 0 ? 'badge-danger' : 'badge-neutral'}`}>
                        {t('quranTracking.table.countBadge', { count })}
                      </span>
                    </td>
                  </tr>
                ))}
                {classCounts.length === 0 && (
                  <tr><td colSpan="2" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('quranTracking.empty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ===== VIEW 2: LIISKA ARDAYDA (fasal gaar ah) =====
  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('quranTracking.classTitle', { grade: cls.grade, section: cls.section })}</h2>
          <p>{t('quranTracking.classSubtitle', { count: missedStudents.length })}</p>
        </div>
        <div className="page-header-actions">
          <BackButton to="/dashboard/quran-tracking" />
        </div>
      </div>

      <div className="dash-card">
        {missedStudents.length > 0 && (
          <div className="qh-legend">
            <span className="qh-legend-item"><i className="qh-legend-dot knew"></i>{t('classWorkspace.quran.knew')}</span>
            <span className="qh-legend-item"><i className="qh-legend-dot missed"></i>{t('classWorkspace.quran.didNotKnow')}</span>
            <span className="qh-legend-item"><i className="qh-legend-dot neutral"></i>{t('quranTracking.legendNotMarked')}</span>
          </div>
        )}

        {missedStudents.length === 0 && <p className="cw-empty-note">{t('quranTracking.classEmpty')}</p>}

        <div className="qh-student-list">
          {missedStudents.map((s) => {
            const history = historyByStudent[s.id] || {};
            return (
              <div key={s.id} className="qh-student-card">
                <div className="cell-person qh-student-person">
                  <div className="cell-avatar">{initials(s.fullName)}</div>
                  <span className="cell-name">{s.fullName}</span>
                </div>
                <div className="qh-history-grid">
                  {last10Dates.map((date) => {
                    const result = history[date];
                    const variant = result === 'gartay' ? 'knew' : result === 'garanwaa' ? 'missed' : 'neutral';
                    return (
                      <div key={date} className={`qh-history-cell ${variant}`} title={formatDMY(date)}>
                        {date.split('-')[2]}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default QuranTracking;
