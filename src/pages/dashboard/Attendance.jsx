import { useState, useMemo } from 'react';
import '../../styles/dashboard-shared.css';
import './Attendance.css';

const CATEGORIES = [
  { id: 'students', label: 'Ardayda' },
  { id: 'teachers', label: 'Macallimiinta' },
  { id: 'staff', label: 'Shaqaalaha' },
];

const PERIODS = [
  { id: 'daily', label: 'Maalinlaha' },
  { id: 'weekly', label: 'Toddobaadlaha' },
  { id: 'monthly', label: 'Bishii' },
  { id: 'yearly', label: 'Sannadlaha' },
];

const STUDENTS = [
  { id: 1, name: 'Ismaaciil Cabdi Xasan', sub: 'Form 1A · STU-1042', status: 'present' },
  { id: 2, name: 'Xaawo Maxamed Cali', sub: 'Form 2A · STU-1043', status: 'present' },
  { id: 3, name: 'Cabdiraxman Yoonis', sub: 'Form 1A · STU-1044', status: 'absent' },
  { id: 4, name: 'Sacdiyo Xasan Nuur', sub: 'Form 3A · STU-1045', status: 'late' },
  { id: 5, name: 'Maxamed Xuseen Cige', sub: 'Form 4A · STU-1046', status: 'present' },
  { id: 6, name: 'Amiina Cabdulle', sub: 'Form 2A · STU-1047', status: 'present' },
];

const TEACHERS = [
  { id: 1, name: 'Cali Xasan Warsame', sub: 'Xisaabta · TCH-201', status: 'present' },
  { id: 2, name: 'Faadumo Nuur Cige', sub: 'Ingiriisi · TCH-202', status: 'present' },
  { id: 3, name: 'Yoonis Cabdi Maxamed', sub: 'Cilmiga Bulshada · TCH-203', status: 'late' },
  { id: 4, name: 'Xamdi Maxamed Xuseen', sub: 'Diinta Islaamka · TCH-204', status: 'absent' },
  { id: 5, name: 'Cabdiraxman Xasan', sub: 'Sayniska · TCH-205', status: 'present' },
];

const STAFF = [
  { id: 1, name: 'Xasan Cabdulle Nuur', sub: 'Maamule Guud', status: 'present' },
  { id: 2, name: 'Zaynab Cali Warsame', sub: 'Xisaabiye (Accountant)', status: 'present' },
  { id: 3, name: 'Cumar Faarax Cige', sub: 'Ilaaliye (Security)', status: 'present' },
  { id: 4, name: 'Halima Xuseen Nuur', sub: 'Kaaliye Maamul', status: 'late' },
];

// Warbixin tijaabo ah oo xilliyada kala duwan (Daily/Weekly/Monthly/Yearly)
const REPORT_STATS = {
  students: {
    daily: { present: 5, absent: 1, late: 1, total: 7, rate: 71 },
    weekly: { present: 32, absent: 4, late: 3, total: 39, rate: 82 },
    monthly: { present: 138, absent: 14, late: 10, total: 162, rate: 85 },
    yearly: { present: 1620, absent: 145, late: 98, total: 1863, rate: 87 },
  },
  teachers: {
    daily: { present: 3, absent: 1, late: 1, total: 5, rate: 60 },
    weekly: { present: 22, absent: 2, late: 3, total: 27, rate: 81 },
    monthly: { present: 96, absent: 6, late: 8, total: 110, rate: 87 },
    yearly: { present: 1150, absent: 62, late: 78, total: 1290, rate: 89 },
  },
  staff: {
    daily: { present: 3, absent: 0, late: 1, total: 4, rate: 75 },
    weekly: { present: 18, absent: 1, late: 2, total: 21, rate: 86 },
    monthly: { present: 78, absent: 4, late: 6, total: 88, rate: 89 },
    yearly: { present: 940, absent: 38, late: 52, total: 1030, rate: 91 },
  },
};

const DATA_BY_CATEGORY = { students: STUDENTS, teachers: TEACHERS, staff: STAFF };

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function statusLabel(status) {
  if (status === 'present') return 'Joog';
  if (status === 'late') return 'Daahid';
  return 'Maqan';
}

function Attendance() {
  const [category, setCategory] = useState('students');
  const [period, setPeriod] = useState('daily');
  const [date, setDate] = useState('2026-07-20');
  const [people, setPeople] = useState(DATA_BY_CATEGORY);

  const list = people[category];
  const stats = REPORT_STATS[category][period];

  const todayCounts = useMemo(() => {
    const present = list.filter((p) => p.status === 'present').length;
    const absent = list.filter((p) => p.status === 'absent').length;
    const late = list.filter((p) => p.status === 'late').length;
    return { present, absent, late, total: list.length };
  }, [list]);

  const cycleStatus = (id) => {
    const next = { present: 'absent', absent: 'late', late: 'present' };
    setPeople((prev) => ({
      ...prev,
      [category]: prev[category].map((p) => (p.id === id ? { ...p, status: next[p.status] } : p)),
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Imaanshaha</h2>
          <p>La soco oo maamul imaanshaha ardayda, macallimiinta, iyo shaqaalaha.</p>
        </div>
        <input
          type="date"
          className="attendance-date-picker"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
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
        <div className="att-summary-card present">
          <span className="att-summary-value">{todayCounts.present}</span>
          <span className="att-summary-label">Joog Maanta</span>
        </div>
        <div className="att-summary-card absent">
          <span className="att-summary-value">{todayCounts.absent}</span>
          <span className="att-summary-label">Maqan Maanta</span>
        </div>
        <div className="att-summary-card late">
          <span className="att-summary-value">{todayCounts.late}</span>
          <span className="att-summary-label">Daahid Maanta</span>
        </div>
        <div className="att-summary-card total">
          <span className="att-summary-value">{todayCounts.total}</span>
          <span className="att-summary-label">Wadarta</span>
        </div>
      </div>

      {/* MARKING TABLE */}
      <div className="dash-card">
        <div className="att-card-head">
          <h3>Calaamadinta Imaanshaha — {date}</h3>
          <p className="att-note">Guji xaaladda si aad u wareejiso: Joog → Maqan → Daahid</p>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Magaca</th><th>Faahfaahin</th><th>Xaaladda</th></tr>
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
                    <button className={`att-status-btn ${p.status}`} onClick={() => cycleStatus(p.id)}>
                      {statusLabel(p.status)}
                    </button>
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
          <h3>Warbixinnada</h3>
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
          <div className="att-report-stat">
            <span className="att-report-value success">{stats.present}</span>
            <span className="att-report-label">Joog</span>
          </div>
          <div className="att-report-stat">
            <span className="att-report-value danger">{stats.absent}</span>
            <span className="att-report-label">Maqan</span>
          </div>
          <div className="att-report-stat">
            <span className="att-report-value warning">{stats.late}</span>
            <span className="att-report-label">Daahid</span>
          </div>
          <div className="att-report-stat">
            <span className="att-report-value">{stats.total}</span>
            <span className="att-report-label">Wadarta</span>
          </div>
          <div className="att-report-rate">
            <div className="att-report-rate-bar">
              <div className="att-report-rate-fill" style={{ width: `${stats.rate}%` }}></div>
            </div>
            <span>{stats.rate}% Heerka Imaanshaha</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Attendance;