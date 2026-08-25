import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import { currentMonthValue } from '../../utils/somaliDate';
import { summarizeAttendanceRecords, buildTopList } from '../../utils/leaderboard';
import StatCard from '../../components/dashboard/StatCard';
import AbsentStudentsModal from '../../components/dashboard/AbsentStudentsModal';
import AttendanceDonutChart from '../../components/dashboard/AttendanceDonutChart';
import '../../styles/dashboard-shared.css';
import './Overview.css';

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'overview.greeting.morning';
  if (hour < 17) return 'overview.greeting.afternoon';
  return 'overview.greeting.evening';
}

function Overview() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { settings } = useSettings();
  const { students, teachers, classes, subjects, exams, attendanceToday, feePayments, myClasses, myClassIds, myClassNames, quranProgressToday, allStudentAttendanceRecords } = useSchoolData();
  const [showAbsentModal, setShowAbsentModal] = useState(false);

  const isTeacher = profile?.role === 'teacher';

  // PRINCIPLE-KA GUUD (Teacher Role Scoping, 2026-08-02): macallinku
  // dashboard-kiisa waa in uu ka arkaa KALIYA xogta la xiriirta
  // fasalladiisa gaarka ah — ma aha xogta guud ee dugsiga oo dhan. myClassIds/
  // myClassNames waa null marka isticmaaluhu yahay owner (ma jiro xaddidaad).
  const myStudents = useMemo(
    () => (myClassIds ? students.filter((s) => (s.classId ? myClassIds.has(s.classId) : myClassNames.has(s.className))) : students),
    [students, myClassIds, myClassNames]
  );
  const myExams = useMemo(
    () => (myClassIds ? exams.filter((e) => (e.classId ? myClassIds.has(e.classId) : myClassNames.has(e.className))) : exams),
    [exams, myClassIds, myClassNames]
  );

  const dayNames = t('common.dayNames', { returnObjects: true });
  const monthNames = t('common.monthNames', { returnObjects: true });
  const formatTodayLocalized = () => {
    const d = new Date();
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const totalStudents = myStudents.length;
  const totalTeachers = teachers.length;
  const totalClasses = myClasses ? myClasses.length : classes.length;

  // "Fasallada" stat card (Overview) — sixitaan (2026-08-17): hore wuxuu u
  // geynayay Finance (khalad, ka duwan macnaha card-ka). Halkan waxaa
  // isticmaalay isla xisaabinta "Teacher Role Scoping" (myClasses, kore) ee
  // Attendance.jsx/Sidebar.jsx horeba isticmaalaan: macallinku wuxuu leeyahay
  // hal fasal (case-ka ugu badan) -> si toos ah loo geeyaa ClassWorkspace-
  // kiisa; haddii 0 ama fasallo badan (dhif ah), loo daayaa liiska guud
  // (Classes.jsx horeba u xaddiday macallinka fasalladiisa kaliya). Owner-ku
  // had iyo jeer wuxuu helaa liiska guud.
  const handleClassesCardClick = () => {
    if (isTeacher && myClasses?.length === 1) {
      navigate(`/dashboard/classes/${myClasses[0].id}`);
    } else {
      navigate('/dashboard/classes');
    }
  };
  const totalSubjects = useMemo(() => {
    if (!myClasses) return subjects.length;
    const subjectIds = new Set(myClasses.flatMap((c) => c.subjectIds || []));
    return subjectIds.size;
  }, [myClasses, subjects]);

  // Bishan — labadan waxay ka soo qaataan xisaabinta DHABTA AH ee feePayments
  // (fiiri utils/studentFee.js), ma aha field-kii hore ee "fee" (paid/pending/
  // overdue) ee la joojiyay, ama safafkii hore ee classFees ee aan hadda la
  // sii cusboonaysiin (fiiri Finance.jsx).
  const currentMonth = currentMonthValue();

  const feesCollected = useMemo(
    () => feePayments
      .filter((p) => p.feeType === 'student' && p.month === currentMonth)
      .reduce((s, p) => s + (p.amount || 0), 0),
    [feePayments, currentMonth]
  );

  const attendanceCounts = useMemo(() => {
    const statusOf = (s) => attendanceToday.students[s.id] || null;
    return {
      present: myStudents.filter((s) => statusOf(s) === 'present').length,
      absent: myStudents.filter((s) => statusOf(s) === 'absent').length,
      leave: myStudents.filter((s) => statusOf(s) === 'leave').length,
    };
  }, [myStudents, attendanceToday]);

  const attendanceRate = myStudents.length ? Math.round((attendanceCounts.present / myStudents.length) * 100) : 0;

  const absentStudents = useMemo(
    () =>
      myStudents
        .filter((s) => attendanceToday.students[s.id] === 'absent')
        .map((s) => ({ id: s.id, name: s.fullName, className: s.className })),
    [myStudents, attendanceToday]
  );

  const upcomingExamsCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return myExams.filter((e) => new Date(e.date) >= today).length;
  }, [myExams]);

  // Ardayda maanta la calaamadiyay "Magaran" (result: garanwaa) — quranProgressToday
  // horeba waa class-scoped (macallinku KALIYA wuu arkaa fasalladiisa, fiiri
  // SchoolDataContext.jsx), sidaas darteed halkan waxaa lagu isticmaalaa
  // myStudents (isla mabda'a attendanceCounts kore).
  const quranMissedTodayCount = useMemo(
    () => myStudents.filter((s) => quranProgressToday[s.id]?.result === 'garanwaa').length,
    [myStudents, quranProgressToday]
  );

  // Fasal kasta oo macallinku leeyahay -> si toos ah loo geeyaa liiska ardayda
  // fasalkaas (isla mabda'a handleClassesCardClick kore); owner-ku had iyo
  // jeer wuxuu helaa kala-soocidda fasallada oo dhan.
  const handleQuranMissedCardClick = () => {
    if (isTeacher && myClasses?.length === 1) {
      navigate(`/dashboard/quran-tracking/${myClasses[0].id}`);
    } else {
      navigate('/dashboard/quran-tracking');
    }
  };

  // Card-ka "Top 10" (Attendance Leaderboard) — value-ga card-ku wuxuu tusayaa
  // arday-ka #1 ee ugu badan maalmaha "Joog" (tab-ka default-ka ah ee
  // Leaderboard.jsx), taabashadu waxay geeysaa bogga oo dhan (labada tab).
  // Xisaabinta waa la wadaagaa Leaderboard.jsx (utils/leaderboard.js), si aan
  // laba jeer loo qorin.
  const topPresentStudent = useMemo(() => {
    const { presentCounts } = summarizeAttendanceRecords(allStudentAttendanceRecords);
    return buildTopList(myStudents, (s) => presentCounts[s.id] || 0, 1)[0]?.student || null;
  }, [myStudents, allStudentAttendanceRecords]);

  const todayLabel = formatTodayLocalized();
  const adminName = profile?.fullName || t('overview.defaultAdminName');

  return (
    <div>
      <div className="dash-card overview-header">
        <div className="overview-header-left">
          {settings.school.logo ? (
            <img className="overview-header-logo" src={settings.school.logo} alt={settings.school.name} />
          ) : (
            <div className="overview-header-logo overview-header-logo-fallback">
              {settings.school.name?.slice(0, 2).toUpperCase() || 'XX'}
            </div>
          )}
          <div className="overview-header-text">
            <h2>{t(getGreetingKey(), { name: adminName })}</h2>
            <p>
              <span>{todayLabel}</span> ·{' '}
              <span className="overview-header-schoolname-badge">
                <span className="overview-header-schoolname" dir="auto">{settings.school.name}</span>
                <svg className="overview-header-verified-icon" viewBox="0 0 24 24" width="15" height="15" aria-label={t('overview.verifiedTooltip')}>
                  <title>{t('overview.verifiedTooltip')}</title>
                  <path fill="var(--mint-dark)" d="M12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3z"/>
                  <path fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15 9.75"/>
                </svg>
              </span>
            </p>
          </div>
        </div>

        <div className="overview-header-actions">
          {!isTeacher && (
            <button className="btn-primary" onClick={() => navigate('/dashboard/students', { state: { openAdd: true } })}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {t('overview.actions.addStudent')}
            </button>
          )}
          {!isTeacher && (
            <button className="btn-secondary" onClick={() => navigate('/dashboard/teachers', { state: { openAdd: true } })}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {t('overview.actions.addTeacher')}
            </button>
          )}
          {!isTeacher && (
            <button className="btn-secondary" onClick={() => navigate('/dashboard/finance')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              {t('overview.actions.collectFee')}
            </button>
          )}
        </div>
      </div>

      <div className="overview-stats-grid">
        <StatCard
          label={t('overview.stats.totalStudents')}
          value={totalStudents}
          accent="mint"
          onClick={() => navigate('/dashboard/students')}
          actionLabel={t('overview.viewDetails')}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 14a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/></svg>}
        />
        {!isTeacher && (
          <StatCard
            label={t('overview.stats.totalTeachers')}
            value={totalTeachers}
            accent="navy"
            onClick={() => navigate('/dashboard/teachers')}
            actionLabel={t('overview.viewDetails')}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12H8l-4 4V4z"/></svg>}
          />
        )}
        <StatCard
          label={t('overview.stats.totalClasses')}
          value={totalClasses}
          accent="blue"
          onClick={handleClassesCardClick}
          actionLabel={t('overview.viewDetails')}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg>}
        />
        <StatCard
          label={t('overview.stats.totalSubjects')}
          value={totalSubjects}
          accent="gold"
          onClick={() => navigate('/dashboard/subjects')}
          actionLabel={t('overview.viewDetails')}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/><path d="M8 7h8M8 11h8"/></svg>}
        />
        {!isTeacher && (
          <StatCard
            label={t('overview.stats.feesCollected')}
            value={`$${feesCollected.toLocaleString()}`}
            accent="mint"
            onClick={() => navigate('/dashboard/finance', { state: { activeTab: 'accounting' } })}
            actionLabel={t('overview.viewDetails')}
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          />
        )}
        <StatCard
          label={t('overview.stats.attendanceToday')}
          value={`${attendanceRate}%`}
          accent="coral"
          onClick={() => navigate('/dashboard/attendance')}
          actionLabel={t('overview.viewDetails')}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>}
        />
        <StatCard
          label={t('overview.stats.upcomingExams')}
          value={upcomingExamsCount}
          accent="coral"
          onClick={() => navigate('/dashboard/exams')}
          actionLabel={t('overview.viewDetails')}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
        />
        <StatCard
          label={t('overview.stats.absentToday')}
          value={absentStudents.length}
          accent="coral"
          onClick={() => setShowAbsentModal(true)}
          actionLabel={t('overview.viewDetails')}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12.5 7a4 4 0 11-8 0 4 4 0 018 0zM17 8l4 4m0-4l-4 4"/></svg>}
        />
        <StatCard
          label={t('overview.stats.quranMissedToday')}
          value={quranMissedTodayCount}
          accent="coral"
          onClick={handleQuranMissedCardClick}
          actionLabel={t('overview.viewDetails')}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/><path d="M9 8.5l3 3-3 3M15 14.5h-3"/></svg>}
        />
        <StatCard
          label={t('overview.stats.leaderboard')}
          value={topPresentStudent?.fullName?.split(' ')[0] || '—'}
          accent="gold"
          onClick={() => navigate('/dashboard/leaderboard')}
          actionLabel={t('overview.viewDetails')}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 01-10 0V4zM7 6H4a3 3 0 003 3M17 6h3a3 3 0 01-3 3"/></svg>}
        />
      </div>

      <div className="dash-card overview-attendance-card">
        <div className="dash-card-head">
          <h3>{t('overview.attendanceCard.title')}</h3>
          <a href="/dashboard/attendance" className="see-all-link">{t('overview.attendanceCard.viewAll')}</a>
        </div>

        <AttendanceDonutChart
          present={attendanceCounts.present}
          absent={attendanceCounts.absent}
          leave={attendanceCounts.leave}
        />
      </div>

      <AbsentStudentsModal
        isOpen={showAbsentModal}
        onClose={() => setShowAbsentModal(false)}
        date={todayLabel}
        students={absentStudents}
      />
    </div>
  );
}

export default Overview;
