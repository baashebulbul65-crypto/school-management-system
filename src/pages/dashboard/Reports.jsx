import { useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSchoolData } from '../../context/SchoolDataContext';
import '../../styles/dashboard-shared.css';
import './Reports.css';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function gpaFromPercent(pct) {
  if (pct >= 80) return 4.0;
  if (pct >= 65) return 3.0;
  if (pct >= 50) return 2.0;
  if (pct >= 40) return 1.0;
  return 0.0;
}

function Reports() {
  const { students, teachers, exams, examMarks, expenses, income, feePayments, allStudentAttendanceRecords, allStaffAttendanceRecords } = useSchoolData();

  const enrollmentByClass = useMemo(() => {
    const counts = {};
    students.forEach((s) => {
      const cls = s.className || 'Aan la qeexin';
      counts[cls] = (counts[cls] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([className, count]) => ({ className, students: count }))
      .sort((a, b) => b.students - a.students);
  }, [students]);

  const totalStudents = students.length;
  const maxEnrollment = Math.max(1, ...enrollmentByClass.map((c) => c.students));

  const examPerformanceByClass = useMemo(() => {
    const classNames = [...new Set(exams.map((e) => e.className))];
    return classNames.map((className) => {
      const examsInClass = exams.filter((e) => e.className === className);
      let totalPct = 0;
      let count = 0;
      examsInClass.forEach((exam) => {
        const marksForExam = examMarks[exam.id] || {};
        Object.values(marksForExam).forEach((mark) => {
          if (mark !== undefined && mark !== '' && exam.maxMarks) {
            totalPct += (mark / exam.maxMarks) * 100;
            count += 1;
          }
        });
      });
      return { className, avgPercent: count > 0 ? Math.round(totalPct / count) : 0 };
    });
  }, [exams, examMarks]);

  const overallExamAvg = examPerformanceByClass.length
    ? Math.round(examPerformanceByClass.reduce((s, c) => s + c.avgPercent, 0) / examPerformanceByClass.length)
    : 0;

  const attendanceTrend = useMemo(() => {
    const dateBuckets = {};
    allStudentAttendanceRecords.forEach((a) => {
      if (!dateBuckets[a.date]) dateBuckets[a.date] = { present: 0, total: 0 };
      dateBuckets[a.date].total += 1;
      if (a.status === 'present') dateBuckets[a.date].present += 1;
    });
    const dates = Object.keys(dateBuckets).sort();
    const weeks = [];
    for (let i = 0; i < dates.length; i += 7) {
      const weekDates = dates.slice(i, i + 7);
      const present = weekDates.reduce((s, d) => s + dateBuckets[d].present, 0);
      const total = weekDates.reduce((s, d) => s + dateBuckets[d].total, 0);
      weeks.push({ week: `Toddobaad ${weeks.length + 1}`, rate: total > 0 ? Math.round((present / total) * 100) : 0 });
    }
    return weeks;
  }, [allStudentAttendanceRecords]);

  const avgAttendance = attendanceTrend.length
    ? Math.round(attendanceTrend.reduce((s, w) => s + w.rate, 0) / attendanceTrend.length)
    : 0;

  // "Dakhliga" waa in ay ku jiraan labada isha ee dakhliga dugsiga: lacagaha
  // ardayda ee dhab ahaan la ururiyay (feePayments — isha ugu weyn) IYO
  // dakhliga kale ee gacanta lagu galiyo (financeIncome). Hore waxaa loo
  // isticmaali jiray kaliya financeIncome, taasoo netProfit-ka ka dhigi
  // jirtay mid been abuur ah (lumis marnaba jirin).
  const totalFeeCollected = useMemo(() => feePayments.reduce((s, p) => s + (p.amount || 0), 0), [feePayments]);
  const totalOtherIncome = useMemo(() => income.reduce((s, i) => s + (i.amount || 0), 0), [income]);
  const totalIncome = totalFeeCollected + totalOtherIncome;
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + (e.amount || 0), 0), [expenses]);
  const netProfit = totalIncome - totalExpenses;
  const maxFinanceBar = Math.max(1, totalIncome, totalExpenses);

  const topStudents = useMemo(() => {
    return students
      .map((student) => {
        const examsInClass = exams.filter((e) => e.className === student.className);
        let totalGpa = 0;
        let count = 0;
        examsInClass.forEach((exam) => {
          const mark = examMarks[exam.id]?.[student.id];
          if (mark !== undefined && mark !== '' && exam.maxMarks) {
            totalGpa += gpaFromPercent((mark / exam.maxMarks) * 100);
            count += 1;
          }
        });
        return { name: student.fullName, className: student.className, gpa: count > 0 ? totalGpa / count : null };
      })
      .filter((s) => s.gpa !== null)
      .sort((a, b) => b.gpa - a.gpa)
      .slice(0, 5);
  }, [students, exams, examMarks]);

  const teacherAttendanceSummary = useMemo(() => {
    return teachers
      .map((teacher) => {
        const records = allStaffAttendanceRecords.filter((r) => r.category === 'teachers' && r.personId === teacher.id);
        const total = records.length;
        const present = records.filter((a) => a.status === 'present').length;
        return { name: teacher.fullName, rate: total > 0 ? Math.round((present / total) * 100) : 0 };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [teachers, allStaffAttendanceRecords]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Kayd — Warbixinta Guud', 14, 18);
    doc.setFontSize(10);
    doc.text(`La soo saaray: ${new Date().toLocaleDateString('so')}`, 14, 25);

    doc.setFontSize(11);
    doc.text(`Wadarta Ardayda: ${totalStudents}`, 14, 36);
    doc.text(`Celceliska Imaanshaha: ${avgAttendance}%`, 14, 43);
    doc.text(`Dakhliga: $${totalIncome}  |  Kharashka: $${totalExpenses}  |  Faa'iidada: $${netProfit}`, 14, 50);
    doc.text(`Celceliska Imtixaanada: ${overallExamAvg}%`, 14, 57);

    autoTable(doc, {
      startY: 65,
      head: [['Fasalka', 'Tirada Ardayda']],
      body: enrollmentByClass.map((c) => [c.className, c.students]),
    });

    autoTable(doc, {
      head: [['Fasalka', 'Celceliska Imtixaanada (%)']],
      body: examPerformanceByClass.map((c) => [c.className, c.avgPercent]),
    });

    autoTable(doc, {
      head: [['Toddobaadka', 'Heerka Imaanshaha (%)']],
      body: attendanceTrend.map((w) => [w.week, w.rate]),
    });

    autoTable(doc, {
      head: [['Ardayga', 'Fasalka', 'GPA']],
      body: topStudents.map((s) => [s.name, s.className, s.gpa.toFixed(2)]),
    });

    autoTable(doc, {
      head: [['Macallinka', 'Heerka Imaanshaha (%)']],
      body: teacherAttendanceSummary.map((t) => [t.name, t.rate]),
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
          {enrollmentByClass.length === 0 ? (
            <p className="rep-empty">Wali arday lama darin.</p>
          ) : (
            <div className="rep-bar-list">
              {enrollmentByClass.map((c) => (
                <div className="rep-bar-row" key={c.className}>
                  <span className="rep-bar-label">{c.className}</span>
                  <div className="rep-bar-track">
                    <div className="rep-bar-fill blue" style={{ width: `${(c.students / maxEnrollment) * 100}%` }}></div>
                  </div>
                  <span className="rep-bar-value">{c.students}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EXAM PERFORMANCE BY CLASS */}
        <div className="dash-card">
          <h3 className="rep-card-title">Waxqabadka Imtixaanada Fasal Kasta</h3>
          {examPerformanceByClass.length === 0 ? (
            <p className="rep-empty">Wali imtixaan lama qorin.</p>
          ) : (
            <div className="rep-bar-list">
              {examPerformanceByClass.map((c) => (
                <div className="rep-bar-row" key={c.className}>
                  <span className="rep-bar-label">{c.className}</span>
                  <div className="rep-bar-track">
                    <div className={`rep-bar-fill ${c.avgPercent >= 75 ? 'green' : c.avgPercent >= 60 ? 'orange' : 'red'}`} style={{ width: `${c.avgPercent}%` }}></div>
                  </div>
                  <span className="rep-bar-value">{c.avgPercent}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ATTENDANCE TREND */}
        <div className="dash-card">
          <h3 className="rep-card-title">Isbeddelka Imaanshaha{attendanceTrend.length ? ` (${attendanceTrend.length} Toddobaad)` : ''}</h3>
          {attendanceTrend.length === 0 ? (
            <p className="rep-empty">Wali imaanshaha arday lama qorin.</p>
          ) : (
            <div className="rep-trend-chart">
              {attendanceTrend.map((w) => (
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
          )}
        </div>

        {/* FINANCE SUMMARY */}
        <div className="dash-card">
          <h3 className="rep-card-title">Warbixinta Maaliyadda</h3>
          <div className="rep-finance-bars">
            <div className="rep-finance-row">
              <span className="rep-finance-label">Dakhliga</span>
              <div className="rep-bar-track">
                <div className="rep-bar-fill green" style={{ width: `${(totalIncome / maxFinanceBar) * 100}%` }}></div>
              </div>
              <span className="rep-bar-value">${totalIncome.toLocaleString()}</span>
            </div>
            <div className="rep-finance-row">
              <span className="rep-finance-label">Kharashka</span>
              <div className="rep-bar-track">
                <div className="rep-bar-fill red" style={{ width: `${(totalExpenses / maxFinanceBar) * 100}%` }}></div>
              </div>
              <span className="rep-bar-value">${totalExpenses.toLocaleString()}</span>
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
          {topStudents.length === 0 ? (
            <p className="rep-empty">Wali buundo imtixaan lama qorin.</p>
          ) : (
            <div className="rep-leaderboard">
              {topStudents.map((s, i) => (
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
          )}
        </div>

        {/* TEACHER ATTENDANCE */}
        <div className="dash-card">
          <h3 className="rep-card-title">Imaanshaha Macallimiinta</h3>
          {teacherAttendanceSummary.length === 0 ? (
            <p className="rep-empty">Wali macallin lama darin.</p>
          ) : (
            <div className="rep-bar-list">
              {teacherAttendanceSummary.map((t) => (
                <div className="rep-bar-row" key={t.name}>
                  <span className="rep-bar-label">{t.name}</span>
                  <div className="rep-bar-track">
                    <div className={`rep-bar-fill ${t.rate >= 90 ? 'green' : t.rate >= 80 ? 'orange' : 'red'}`} style={{ width: `${t.rate}%` }}></div>
                  </div>
                  <span className="rep-bar-value">{t.rate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Reports;
