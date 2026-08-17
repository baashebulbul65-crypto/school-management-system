import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import { useNotifications } from '../../context/NotificationsContext';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { currentMonthValue } from '../../utils/somaliDate';
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
  const { students, teachers, classes, subjects, exams, attendanceToday, feePayments, myClasses, myClassIds, myClassNames } = useSchoolData();
  const { notifications } = useNotifications();
  const [showAbsentModal, setShowAbsentModal] = useState(false);

  // Macallinku gebi ahaanba wuu ka mamnuucan yahay xogta lacagta, xitaa
  // dashboard-ka guud (Teacher Role Scoping audit, 2026-08-02) — feePayments
  // waa madhan macallinka horeba (fiiri SchoolDataContext.jsx), laakiin
  // ogeysiisyada type=='fee' waxay kasoo baxaan collection "notifications"
  // (kaas oo aan xaddidnayn), sidaas darteed waa in halkanna la shaandhaystaa.
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

  // Waxaa isku darsanaya dhacdooyinka dhabta ah ee ugu dambeeyay: lacagaha la
  // ururiyay (feePayments) + ogeysiisyada (maqnaanshaha/lacagta baaqiga ah),
  // labaduba waxay leeyihiin taariikh (createdAt) dhab ah — ma aha xog beebeen ah.
  const recentActivity = useMemo(() => {
    const paymentEvents = feePayments
      .filter((p) => p.createdAt)
      .map((p) => ({
        id: `payment_${p.id}`,
        type: 'success',
        text: `Lacag $${(p.amount || 0).toLocaleString()} ayaa la ururiyay${p.collectedByName ? ` — ${p.collectedByName}` : ''}`,
        time: p.createdAt,
      }));
    // notifications waxay horeba u shaandhaysan tahay (NotificationsContext.jsx)
    // fee-ga iyo fasallada kale ee macallinka — halkan lama baahna filter dheeraad ah.
    const notifEvents = notifications
      .filter((n) => n.time)
      .map((n) => ({
        id: `notif_${n.id}`,
        type: n.type === 'fee' ? 'warning' : 'neutral',
        text: `${n.title} — ${n.description}`,
        time: n.time,
      }));
    return [...paymentEvents, ...notifEvents]
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 5);
  }, [feePayments, notifications]);

  const dayNames = t('common.dayNames', { returnObjects: true });
  const monthNames = t('common.monthNames', { returnObjects: true });
  const formatTodayLocalized = () => {
    const d = new Date();
    return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const totalStudents = myStudents.length;
  const totalTeachers = teachers.length;
  const totalClasses = myClasses ? myClasses.length : classes.length;
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
              <span>{todayLabel}</span> · <span className="overview-header-schoolname" dir="auto">{settings.school.name}</span>
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
          size="lg"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 14a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/></svg>}
        />
        {!isTeacher && (
          <StatCard
            label={t('overview.stats.totalTeachers')}
            value={totalTeachers}
            accent="navy"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12H8l-4 4V4z"/></svg>}
          />
        )}
        <StatCard
          label={t('overview.stats.totalClasses')}
          value={totalClasses}
          accent="blue"
          onClick={!isTeacher ? () => navigate('/dashboard/finance', { state: { activeTab: 'accounting' } }) : undefined}
          actionLabel={!isTeacher ? t('overview.viewDetails') : undefined}
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg>}
        />
        <StatCard
          label={t('overview.stats.totalSubjects')}
          value={totalSubjects}
          accent="gold"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/><path d="M8 7h8M8 11h8"/></svg>}
        />
        {!isTeacher && (
          <StatCard
            label={t('overview.stats.feesCollected')}
            value={`$${feesCollected.toLocaleString()}`}
            accent="mint"
            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          />
        )}
        <StatCard
          label={t('overview.stats.attendanceToday')}
          value={`${attendanceRate}%`}
          accent="coral"
          size="lg"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>}
        />
        <StatCard
          label={t('overview.stats.upcomingExams')}
          value={upcomingExamsCount}
          accent="coral"
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
      </div>

      <div className="overview-grid">
        <div className="dash-card">
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

        <div className="dash-card">
          <div className="dash-card-head">
            <h3>{t('overview.recentActivity.title')}</h3>
          </div>

          <div className="activity-list">
            {recentActivity.length === 0 && (
              <p style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>Weli dhaqdhaqaaq lama diiwaan gelin.</p>
            )}
            {recentActivity.map((a) => (
              <div className="activity-row" key={a.id}>
                <span className={`activity-dot ${a.type}`}></span>
                <div className="activity-text">
                  <div>{a.text}</div>
                  <div className="activity-time">{formatRelativeTime(a.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
