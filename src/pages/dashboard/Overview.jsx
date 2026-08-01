import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useSchoolData } from '../../context/SchoolDataContext';
import { useNotifications } from '../../context/NotificationsContext';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
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
  const { students, teachers, classes, subjects, exams, classFees, attendanceToday, feePayments } = useSchoolData();
  const { notifications } = useNotifications();
  const [showAbsentModal, setShowAbsentModal] = useState(false);

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

  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;
  const totalSubjects = subjects.length;
  const feeDueStudents = students.filter((s) => s.fee !== 'paid').length;

  const feesCollected = useMemo(() => {
    const wadar = classFees.reduce((s, r) => s + r.total, 0);
    const dhimis = classFees.reduce((s, r) => s + r.discount, 0);
    const baaqi = classFees.reduce((s, r) => s + r.balance, 0);
    return wadar - dhimis - baaqi;
  }, [classFees]);

  const attendanceCounts = useMemo(() => {
    const statusOf = (s) => attendanceToday.students[s.id] || 'present';
    return {
      present: students.filter((s) => statusOf(s) === 'present').length,
      absent: students.filter((s) => statusOf(s) === 'absent').length,
      leave: students.filter((s) => statusOf(s) === 'leave').length,
      sick: students.filter((s) => statusOf(s) === 'sick').length,
    };
  }, [students, attendanceToday]);

  const attendanceRate = students.length ? Math.round((attendanceCounts.present / students.length) * 100) : 0;

  const absentStudents = useMemo(
    () =>
      students
        .filter((s) => attendanceToday.students[s.id] === 'absent')
        .map((s) => ({ id: s.id, name: s.fullName, className: s.className })),
    [students, attendanceToday]
  );

  const upcomingExamsCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return exams.filter((e) => new Date(e.date) >= today).length;
  }, [exams]);

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
          <div>
            <h2>{t(getGreetingKey(), { name: adminName })}</h2>
            <p>{todayLabel} · {settings.school.name}</p>
          </div>
        </div>

        <div className="overview-header-actions">
          <button className="btn-primary" onClick={() => navigate('/dashboard/students', { state: { openAdd: true } })}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            {t('overview.actions.addStudent')}
          </button>
          <button className="btn-secondary" onClick={() => navigate('/dashboard/teachers', { state: { openAdd: true } })}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            {t('overview.actions.addTeacher')}
          </button>
          <button className="btn-secondary" onClick={() => navigate('/dashboard/finance', { state: { openCollect: true } })}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            {t('overview.actions.collectFee')}
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label={t('overview.stats.totalStudents')}
          value={totalStudents}
          accent="mint"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 14a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/></svg>}
        />
        <StatCard
          label={t('overview.stats.totalTeachers')}
          value={totalTeachers}
          accent="navy"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12H8l-4 4V4z"/></svg>}
        />
        <StatCard
          label={t('overview.stats.totalClasses')}
          value={totalClasses}
          accent="gold"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg>}
        />
        <StatCard
          label={t('overview.stats.totalSubjects')}
          value={totalSubjects}
          accent="coral"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/><path d="M8 7h8M8 11h8"/></svg>}
        />
        <StatCard
          label={t('overview.stats.feesCollected')}
          value={`$${feesCollected.toLocaleString()}`}
          accent="mint"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
        />
        <StatCard
          label={t('overview.stats.feeDueStudents')}
          value={feeDueStudents}
          accent="navy"
          icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>}
        />
        <StatCard
          label={t('overview.stats.attendanceToday')}
          value={`${attendanceRate}%`}
          accent="gold"
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
            sick={attendanceCounts.sick}
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
