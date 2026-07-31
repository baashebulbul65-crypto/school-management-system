import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSchoolData } from '../../context/SchoolDataContext';
import '../../styles/dashboard-shared.css';
import './Attendance.css';

const VALUE_CLS = { present: 'success', absent: 'danger', late: 'warning', leave: 'warning', sick: 'danger' };

// Warbixin tijaabo ah oo xilliyada dhaafay (weekly/monthly/yearly) — ma jirto xog
// taariikheed oo dhab ah (backend), "daily" waxaa laga soo xisaabiyaa xogta nool
// ee hoos ku qoran (isla liiska calaamadinta ee sare).
const STATIC_REPORT_STATS = {
  students: {
    weekly: { present: 32, absent: 4, late: 3, total: 39, rate: 82 },
    monthly: { present: 138, absent: 14, late: 10, total: 162, rate: 85 },
    yearly: { present: 1620, absent: 145, late: 98, total: 1863, rate: 87 },
  },
  teachers: {
    weekly: { present: 22, absent: 2, late: 3, total: 27, rate: 81 },
    monthly: { present: 96, absent: 6, late: 8, total: 110, rate: 87 },
    yearly: { present: 1150, absent: 62, late: 78, total: 1290, rate: 89 },
  },
  staff: {
    weekly: { present: 18, absent: 1, late: 2, total: 21, rate: 86 },
    monthly: { present: 78, absent: 4, late: 6, total: 88, rate: 89 },
    yearly: { present: 940, absent: 38, late: 52, total: 1030, rate: 91 },
  },
};

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Attendance() {
  const { t } = useTranslation();
  const { students, teachers, staff, attendanceToday, cycleAttendanceStatus, setStudentAttendanceStatus } = useSchoolData();
  const [category, setCategory] = useState('students');
  const [period, setPeriod] = useState('daily');
  const [date] = useState(new Date().toISOString().split('T')[0]);

  const CATEGORIES = [
    { id: 'students', label: t('attendance.categories.students') },
    { id: 'teachers', label: t('attendance.categories.teachers') },
    { id: 'staff', label: t('attendance.categories.staff') },
  ];

  const PERIODS = [
    { id: 'daily', label: t('attendance.periods.daily') },
    { id: 'weekly', label: t('attendance.periods.weekly') },
    { id: 'monthly', label: t('attendance.periods.monthly') },
    { id: 'yearly', label: t('attendance.periods.yearly') },
  ];

  // Ardayda hadda waxay leeyihiin 4 xaalado (Joog/Maqan/Fasax/Buka), Macallimiinta iyo
  // Shaqaalaha waxay wali isticmaalaan 3-da xaalado ee hore (Joog/Maqan/Daahid).
  const STATUS_DEFS = {
    students: [
      { key: 'present', label: t('common.present') },
      { key: 'absent', label: t('common.absent') },
      { key: 'leave', label: t('common.leave') },
      { key: 'sick', label: t('common.sick') },
    ],
    teachers: [
      { key: 'present', label: t('common.present') },
      { key: 'absent', label: t('common.absent') },
      { key: 'late', label: t('common.late') },
    ],
    staff: [
      { key: 'present', label: t('common.present') },
      { key: 'absent', label: t('common.absent') },
      { key: 'late', label: t('common.late') },
    ],
  };

  const statusDefs = STATUS_DEFS[category];

  const list = useMemo(() => {
    if (category === 'students') {
      return students.map((s) => ({
        id: s.id,
        name: s.fullName,
        sub: `${s.className} · ${s.studentId}`,
        className: s.className,
        status: attendanceToday.students[s.id] || 'present',
      }));
    }
    if (category === 'teachers') {
      return teachers.map((t2) => ({
        id: t2.id,
        name: t2.fullName,
        sub: `${t2.subject} · ${t2.teacherId}`,
        status: attendanceToday.teachers[t2.id] || 'present',
      }));
    }
    return staff.map((s) => ({
      id: s.id,
      name: s.name,
      sub: s.sub,
      status: attendanceToday.staff[s.id] || 'present',
    }));
  }, [category, students, teachers, staff, attendanceToday]);

  const todayCounts = useMemo(() => {
    const counts = { total: list.length };
    statusDefs.forEach((def) => {
      counts[def.key] = list.filter((p) => p.status === def.key).length;
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, category]);

  const stats = period === 'daily'
    ? { ...todayCounts, rate: todayCounts.total ? Math.round((todayCounts.present / todayCounts.total) * 100) : 0 }
    : STATIC_REPORT_STATS[category][period];

  const handleMark = (person, statusKey) => {
    if (category === 'students') {
      setStudentAttendanceStatus(person.id, person.className, statusKey);
    } else {
      cycleAttendanceStatus(category, person.id);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('attendance.pageTitle')}</h2>
          <p>{t('attendance.pageSubtitle')}</p>
        </div>
        <input type="date" className="attendance-date-picker" value={date} disabled />
      </div>

      {/* CATEGORY TABS */}
      <div className="att-category-tabs">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`att-cat-tab ${category === c.id ? 'active' : ''}`}
            onClick={() => setCategory(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* TODAY SUMMARY */}
      <div className="att-summary-grid">
        {statusDefs.map((def) => (
          <div className={`att-summary-card ${def.key}`} key={def.key}>
            <span className="att-summary-value">{todayCounts[def.key]}</span>
            <span className="att-summary-label">{def.label} {t('attendance.today')}</span>
          </div>
        ))}
        <div className="att-summary-card total">
          <span className="att-summary-value">{todayCounts.total}</span>
          <span className="att-summary-label">{t('attendance.total')}</span>
        </div>
      </div>

      {/* MARKING TABLE */}
      <div className="dash-card">
        <div className="att-card-head">
          <h3>{t('attendance.markingTitle', { date })}</h3>
          <p className="att-note">
            {category === 'students' ? t('attendance.noteStudents') : t('attendance.noteOthers')}
          </p>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>{t('attendance.table.name')}</th><th>{t('attendance.table.details')}</th><th>{t('attendance.table.status')}</th></tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-person">
                      <div className="cell-avatar">{initials(p.name)}</div>
                      <span className="cell-name">{p.name}</span>
                    </div>
                  </td>
                  <td className="cell-sub">{p.sub}</td>
                  <td>
                    {category === 'students' ? (
                      <div className="att-status-btn-group">
                        {statusDefs.map((def) => (
                          <button
                            key={def.key}
                            className={`att-status-btn ${def.key}${p.status === def.key ? ' active' : ''}`}
                            onClick={() => handleMark(p, def.key)}
                          >
                            {def.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button className={`att-status-btn ${p.status}`} onClick={() => handleMark(p, null)}>
                        {statusDefs.find((d) => d.key === p.status)?.label || p.status}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPORTS */}
      <div className="dash-card">
        <div className="att-card-head">
          <h3>{t('attendance.reportsTitle')}</h3>
          <div className="att-period-tabs">
            {PERIODS.map((p) => (
              <button
                key={p.id}
                className={`att-period-tab ${period === p.id ? 'active' : ''}`}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="att-report-grid">
          {statusDefs.map((def) => (
            <div className="att-report-stat" key={def.key}>
              <span className={`att-report-value ${VALUE_CLS[def.key]}`}>{stats[def.key] ?? 0}</span>
              <span className="att-report-label">{def.label}</span>
            </div>
          ))}
          <div className="att-report-stat">
            <span className="att-report-value">{stats.total}</span>
            <span className="att-report-label">{t('attendance.total')}</span>
          </div>
          <div className="att-report-rate">
            <div className="att-report-rate-bar">
              <div className="att-report-rate-fill" style={{ width: `${stats.rate}%` }}></div>
            </div>
            <span>{stats.rate}{t('attendance.attendanceRate')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attendance;
