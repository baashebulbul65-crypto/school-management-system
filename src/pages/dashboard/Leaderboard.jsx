import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import { summarizeAttendanceRecords, resolveEnrollmentDate, tenureDays, buildTopList, summarizeQuranMemorization } from '../../utils/leaderboard';
import { currentMonthValue } from '../../utils/somaliDate';
import BackButton from '../../components/dashboard/BackButton';
import '../../styles/dashboard-shared.css';
import './Exams.css';
import './Leaderboard.css';

function initials(name) {
  return name ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '';
}

function rankBadgeClass(rank) {
  if (rank === 1) return 'lb-rank gold';
  if (rank === 2) return 'lb-rank silver';
  if (rank === 3) return 'lb-rank bronze';
  return 'lb-rank';
}

function Leaderboard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const {
    students, classes, myClasses, allStudentAttendanceRecords, allQuranProgressRecords,
  } = useSchoolData();

  const isTeacher = profile?.role === 'teacher';
  const [activeTab, setActiveTab] = useState('present');
  const [classFilter, setClassFilter] = useState('all');

  // Fasallada la muujin karo dropdown-ka — macallinku KALIYA fasalladiisa
  // (isla mabda'a QuranTracking.jsx/Overview.jsx), owner-ku dhammaantood.
  const visibleClasses = isTeacher ? (myClasses || []) : classes;

  const scopedStudents = useMemo(() => {
    if (classFilter === 'all') return students;
    const cls = visibleClasses.find((c) => String(c.id) === classFilter);
    if (!cls) return students;
    const classroomName = `${cls.grade}${cls.section}`;
    return students.filter((s) => (s.classId ? s.classId === cls.id : s.className === classroomName));
  }, [students, visibleClasses, classFilter]);

  // Hal-mar-pass ah (memoized) oo dhan attendanceRecords-ka HOREBA la soo
  // dejiyay — ma sameeyo query Firestore cusub marka tab-ka la beddelo ama
  // page-ka la furo (performance, fiiri utils/leaderboard.js).
  const { presentCounts, earliestDates } = useMemo(
    () => summarizeAttendanceRecords(allStudentAttendanceRecords),
    [allStudentAttendanceRecords]
  );

  const presentTop = useMemo(
    () => buildTopList(scopedStudents, (s) => presentCounts[s.id] || 0),
    [scopedStudents, presentCounts]
  );

  const tenureTop = useMemo(
    () => buildTopList(scopedStudents, (s) => tenureDays(resolveEnrollmentDate(s, earliestDates[s.id]))),
    [scopedStudents, earliestDates]
  );

  const excludedFromTenure = useMemo(
    () => scopedStudents.filter((s) => resolveEnrollmentDate(s, earliestDates[s.id]) === null).length,
    [scopedStudents, earliestDates]
  );

  // "Top 10 Gartay Quraanka" — bil-bil ah (monthly reset), ma aha cumulative
  // sida labada tab kore (fiiri summarizeQuranMemorization). currentMonthValue()
  // waxay isticmashaa waqtiga maxalliga ah (ma aha UTC), sidaas darteed
  // bishu si otomaatig ah u beddeshaa marka bil cusub bilaabato.
  const quranCounts = useMemo(
    () => summarizeQuranMemorization(allQuranProgressRecords, currentMonthValue()),
    [allQuranProgressRecords]
  );

  const quranTop = useMemo(
    () => buildTopList(scopedStudents, (s) => quranCounts[s.id] || 0),
    [scopedStudents, quranCounts]
  );

  const rows = activeTab === 'present' ? presentTop : activeTab === 'tenure' ? tenureTop : quranTop;
  const valueUnit = activeTab === 'present' ? t('leaderboard.presentUnit')
    : activeTab === 'tenure' ? t('leaderboard.tenureUnit')
    : t('leaderboard.quranUnit');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('leaderboard.title')}</h2>
          <p>{t('leaderboard.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <BackButton to="/dashboard" />
        </div>
      </div>

      <div className="dash-card">
        <div className="fin-tabs">
          <button className={`fin-tab ${activeTab === 'present' ? 'active' : ''}`} onClick={() => setActiveTab('present')}>
            {t('leaderboard.tabs.present')}
          </button>
          <button className={`fin-tab ${activeTab === 'tenure' ? 'active' : ''}`} onClick={() => setActiveTab('tenure')}>
            {t('leaderboard.tabs.tenure')}
          </button>
          <button className={`fin-tab ${activeTab === 'quran' ? 'active' : ''}`} onClick={() => setActiveTab('quran')}>
            {t('leaderboard.tabs.quran')}
          </button>
        </div>

        {visibleClasses.length > 0 && (
          <div className="exam-select-row lb-class-filter">
            <label>{t('leaderboard.classFilterLabel')}</label>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="all">{t('leaderboard.allClasses')}</option>
              {visibleClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.grade}{c.section}</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'tenure' && excludedFromTenure > 0 && (
          <p className="lb-note">{t('leaderboard.tenureExcludedNote', { count: excludedFromTenure })}</p>
        )}

        {activeTab === 'quran' && (
          <p className="lb-note">{t('leaderboard.quranMonthNote', { month: t('common.monthNames', { returnObjects: true })[new Date().getMonth()] })}</p>
        )}

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('leaderboard.table.rank')}</th>
                <th>{t('leaderboard.table.student')}</th>
                <th>{t('leaderboard.table.value')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.student.id}>
                  <td><span className={rankBadgeClass(idx + 1)}>#{idx + 1}</span></td>
                  <td>
                    <div className="cell-person">
                      <div className="cell-avatar">{initials(row.student.fullName)}</div>
                      <span className="cell-name">{row.student.fullName}</span>
                    </div>
                  </td>
                  <td className="cell-sub">{row.value} {valueUnit}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('leaderboard.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
