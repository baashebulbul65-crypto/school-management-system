import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../../styles/dashboard-shared.css';
import './Reports.css';

const TERMS = ['Semester 1 - 2026', 'Semester 2 - 2026', 'Sannadka 2026 (Guud)'];

const ENROLLMENT_BY_CLASS = [
  { className: 'Form 1A', students: 46 },
  { className: 'Form 1B', students: 27 },
  { className: 'Form 2A', students: 31 },
  { className: 'Form 3A', students: 23 },
  { className: 'Form 3B', students: 34 },
  { className: 'Form 4A', students: 31 },
];

const ATTENDANCE_TREND = [
  { week: 'Toddobaad 1', rate: 88 },
  { week: 'Toddobaad 2', rate: 84 },
  { week: 'Toddobaad 3', rate: 91 },
  { week: 'Toddobaad 4', rate: 79 },
  { week: 'Toddobaad 5', rate: 93 },
  { week: 'Toddobaad 6', rate: 87 },
];

const FINANCE_SUMMARY = { income: 5600, expenses: 3225 };

const EXAM_PERFORMANCE_BY_CLASS = [
  { className: 'Form 1A', avgPercent: 78 },
  { className: 'Form 2A', avgPercent: 71 },
  { className: 'Form 3A', avgPercent: 84 },
  { className: 'Form 4A', avgPercent: 69 },
];

const TOP_STUDENTS = [
  { name: 'Sacdiyo Xasan Nuur', className: 'Form 3A', gpa: 3.9 },
  { name: 'Ismaaciil Cabdi Xasan', className: 'Form 1A', gpa: 3.7 },
  { name: 'Xaawo Maxamed Cali', className: 'Form 2A', gpa: 3.6 },
  { name: 'Maxamed Xuseen Cige', className: 'Form 4A', gpa: 3.4 },
  { name: 'Amiina Cabdulle', className: 'Form 2A', gpa: 3.2 },
];

const TEACHER_ATTENDANCE_SUMMARY = [
  { name: 'Cali Xasan Warsame', rate: 96 },
  { name: 'Faadumo Nuur Cige', rate: 92 },
  { name: 'Yoonis Cabdi Maxamed', rate: 89 },
  { name: 'Xamdi Maxamed Xuseen', rate: 84 },
];

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Reports() {
  const [term, setTerm] = useState(TERMS[1]);

  const totalStudents = useMemo(() => ENROLLMENT_BY_CLASS.reduce((s, c) => s + c.students, 0), []);
  const maxEnrollment = Math.max(...ENROLLMENT_BY_CLASS.map((c) => c.students));
  const avgAttendance = Math.round(ATTENDANCE_TREND.reduce((s, w) => s + w.rate, 0) / ATTENDANCE_TREND.length);
  const netProfit = FINANCE_SUMMARY.income - FINANCE_SUMMARY.expenses;
  const maxFinanceBar = Math.max(FINANCE_SUMMARY.income, FINANCE_SUMMARY.expenses);
  const overallExamAvg = Math.round(
    EXAM_PERFORMANCE_BY_CLASS.reduce((s, c) => s + c.avgPercent, 0) / EXAM_PERFORMANCE_BY_CLASS.length
  );

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Kayd — Warbixinta Guud', 14, 18);
    doc.setFontSize(10);
    doc.text(`Xilliga: ${term}`, 14, 25);

    doc.setFontSize(11);
    doc.text(`Wadarta Ardayda: ${totalStudents}`, 14, 36);
    doc.text(`Celceliska Imaanshaha: ${avgAttendance}%`, 14, 43);
    doc.text(`Dakhliga: $${FINANCE_SUMMARY.income}  |  Kharashka: $${FINANCE_SUMMARY.expenses}  |  Faa'iidada: $${netProfit}`, 14, 50);
    doc.text(`Celceliska Imtixaanada: ${overallExamAvg}%`, 14, 57);

    autoTable(doc, {
      startY: 65,
      head: [['Fasalka', 'Tirada Ardayda']],
      body: ENROLLMENT_BY_CLASS.map((c) => [c.className, c.students]),
    });

    autoTable(doc, {
      head: [['Ardayga', 'Fasalka', 'GPA']],
      body: TOP_STUDENTS.map((s) => [s.name, s.className, s.gpa.toFixed(2)]),
    });

    doc.save('kayd-warbixinta-guud.pdf');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Warbixinno</h2>
          <p>Warbixin guud oo isku keenta xogta ardayda, macallimiinta, lacagta, iyo imtixaanada.</p>
        </div>
        <div className="rep-header-actions">
          <select className="rep-term-select" value={term} onChange={(e) => setTerm(e.target.value)}>
            {TERMS.map((t) => <option key={t}>{t}</option>)}
          </select>
          <button className="btn-primary" onClick={handleExportPDF}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* KEY METRICS */}
      <div className="rep-metrics-grid">
        <div className="rep-metric-card">
          <div className="rep-metric-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div><span className="rep-metric-value">{totalStudents}</span><span className="rep-metric-label">Wadarta Ardayda</span></div>
        </div>
        <div className="rep-metric-card">
          <div className="rep-metric-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>
          </div>
          <div><span className="rep-metric-value">{avgAttendance}%</span><span className="rep-metric-label">Celceliska Imaanshaha</span></div>
        </div>
        <div className="rep-metric-card">
          <div className="rep-metric-icon teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div><span className={`rep-metric-value ${netProfit >= 0 ? 'success' : 'danger'}`}>${netProfit.toLocaleString()}</span><span className="rep-metric-label">Faa'iidada Saafiga Ah</span></div>
        </div>
        <div className="rep-metric-card">
          <div className="rep-metric-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          </div>
          <div><span className="rep-metric-value">{overallExamAvg}%</span><span className="rep-metric-label">Celceliska Imtixaanada</span></div>
        </div>
      </div>

      <div className="rep-grid-2col">

        {/* ENROLLMENT BY CLASS */}
        <div className="dash-card">
          <h3 className="rep-card-title">Diiwaan Gelinta Fasal Kasta</h3>
          <div className="rep-bar-list">
            {ENROLLMENT_BY_CLASS.map((c) => (
              <div className="rep-bar-row" key={c.className}>
                <span className="rep-bar-label">{c.className}</span>
                <div className="rep-bar-track">
                  <div className="rep-bar-fill blue" style={{ width: `${(c.students / maxEnrollment) * 100}%` }}></div>
                </div>
                <span className="rep-bar-value">{c.students}</span>
              </div>
            ))}
          </div>
        </div>

        {/* EXAM PERFORMANCE BY CLASS */}
        <div className="dash-card">
          <h3 className="rep-card-title">Waxqabadka Imtixaanada Fasal Kasta</h3>
          <div className="rep-bar-list">
            {EXAM_PERFORMANCE_BY_CLASS.map((c) => (
              <div className="rep-bar-row" key={c.className}>
                <span className="rep-bar-label">{c.className}</span>
                <div className="rep-bar-track">
                  <div className={`rep-bar-fill ${c.avgPercent >= 75 ? 'green' : c.avgPercent >= 60 ? 'orange' : 'red'}`} style={{ width: `${c.avgPercent}%` }}></div>
                </div>
                <span className="rep-bar-value">{c.avgPercent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ATTENDANCE TREND */}
        <div className="dash-card">
          <h3 className="rep-card-title">Isbeddelka Imaanshaha (6 Toddobaad)</h3>
          <div className="rep-trend-chart">
            {ATTENDANCE_TREND.map((w) => (
              <div className="rep-trend-col" key={w.week}>
                <div className="rep-trend-bar-wrap">
                  <div className="rep-trend-bar" style={{ height: `${w.rate}%` }}>
                    <span>{w.rate}%</span>
                  </div>
                </div>
                <span className="rep-trend-label">{w.week.replace('Toddobaad ', 'T')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FINANCE SUMMARY */}
        <div className="dash-card">
          <h3 className="rep-card-title">Warbixinta Maaliyadda</h3>
          <div className="rep-finance-bars">
            <div className="rep-finance-row">
              <span className="rep-finance-label">Dakhliga</span>
              <div className="rep-bar-track">
                <div className="rep-bar-fill green" style={{ width: `${(FINANCE_SUMMARY.income / maxFinanceBar) * 100}%` }}></div>
              </div>
              <span className="rep-bar-value">${FINANCE_SUMMARY.income.toLocaleString()}</span>
            </div>
            <div className="rep-finance-row">
              <span className="rep-finance-label">Kharashka</span>
              <div className="rep-bar-track">
                <div className="rep-bar-fill red" style={{ width: `${(FINANCE_SUMMARY.expenses / maxFinanceBar) * 100}%` }}></div>
              </div>
              <span className="rep-bar-value">${FINANCE_SUMMARY.expenses.toLocaleString()}</span>
            </div>
          </div>
          <div className={`rep-net-banner ${netProfit >= 0 ? 'positive' : 'negative'}`}>
            Faa'iidada Saafiga Ah: <strong>${netProfit.toLocaleString()}</strong>
          </div>
        </div>

      </div>

      <div className="rep-grid-2col">

        {/* TOP STUDENTS */}
        <div className="dash-card">
          <h3 className="rep-card-title">Ardayda Ugu Sarreeya (GPA)</h3>
          <div className="rep-leaderboard">
            {TOP_STUDENTS.map((s, i) => (
              <div className="rep-leader-row" key={s.name}>
                <span className={`rep-leader-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>#{i + 1}</span>
                <div className="rep-leader-avatar">{initials(s.name)}</div>
                <div className="rep-leader-info">
                  <div className="rep-leader-name">{s.name}</div>
                  <div className="rep-leader-class">{s.className}</div>
                </div>
                <span className="rep-leader-gpa">{s.gpa.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* TEACHER ATTENDANCE */}
        <div className="dash-card">
          <h3 className="rep-card-title">Imaanshaha Macallimiinta</h3>
          <div className="rep-bar-list">
            {TEACHER_ATTENDANCE_SUMMARY.map((t) => (
              <div className="rep-bar-row" key={t.name}>
                <span className="rep-bar-label">{t.name}</span>
                <div className="rep-bar-track">
                  <div className={`rep-bar-fill ${t.rate >= 90 ? 'green' : t.rate >= 80 ? 'orange' : 'red'}`} style={{ width: `${t.rate}%` }}></div>
                </div>
                <span className="rep-bar-value">{t.rate}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Reports;