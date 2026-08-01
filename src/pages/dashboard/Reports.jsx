import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSchoolData } from '../../context/SchoolDataContext';
import { classroomName } from '../../hooks/useClassOptions';
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
  const { t, i18n } = useTranslation();
  const { students, teachers, classes, exams, examMarks, expenses, income, feePayments, allStudentAttendanceRecords, allStaffAttendanceRecords } = useSchoolData();

  // classId marka jira, className fallback ilaa ardayda/imtixaannada aan weli
  // la dib-u-kaydin (fiiri backfill-ka SchoolDataContext.jsx) — isla habka
  // Exams.jsx (studentInClass/examInClass), si aan loo isticmaalin
  // isbarbardhig magac oo keliya ah (Reports MEDIUM #2).
  const studentInClass = (s, cls) => (s.classId ? s.classId === cls.id : s.className === classroomName(cls));
  const examInClass = (e, cls) => (e.classId ? e.classId === cls.id : e.className === classroomName(cls));

  const enrollmentByClass = useMemo(() => {
    const rows = classes.map((cls) => ({
      className: classroomName(cls),
      students: students.filter((s) => studentInClass(s, cls)).length,
    }));
    const unassigned = students.filter((s) => !classes.some((cls) => studentInClass(s, cls))).length;
    if (unassigned > 0) rows.push({ className: t('reports.unassigned'), students: unassigned });
    return rows.filter((r) => r.students > 0).sort((a, b) => b.students - a.students);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, classes, t]);

  const totalStudents = students.length;
  const maxEnrollment = Math.max(1, ...enrollmentByClass.map((c) => c.students));

  const examPerformanceByClass = useMemo(() => {
    return classes
      .map((cls) => {
        const examsInClass = exams.filter((e) => examInClass(e, cls));
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
        return { className: classroomName(cls), avgPercent: count > 0 ? Math.round(totalPct / count) : 0, hasExams: examsInClass.length > 0 };
      })
      .filter((c) => c.hasExams)
      .map(({ hasExams, ...rest }) => rest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exams, examMarks, classes]);

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
      weeks.push({ weekNumber: weeks.length + 1, rate: total > 0 ? Math.round((present / total) * 100) : 0 });
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
        const studentCls = classes.find((cls) => studentInClass(student, cls));
        const examsInClass = studentCls
          ? exams.filter((e) => examInClass(e, studentCls))
          : exams.filter((e) => e.className === student.className);
        let totalGpa = 0;
        let count = 0;
        examsInClass.forEach((exam) => {
          const mark = examMarks[exam.id]?.[student.id];
          if (mark !== undefined && mark !== '' && exam.maxMarks) {
            totalGpa += gpaFromPercent((mark / exam.maxMarks) * 100);
            count += 1;
          }
        });
        return {
          name: student.fullName,
          className: studentCls ? classroomName(studentCls) : (student.className || t('reports.unassigned')),
          gpa: count > 0 ? totalGpa / count : null,
        };
      })
      .filter((s) => s.gpa !== null)
      .sort((a, b) => b.gpa - a.gpa)
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, exams, examMarks, classes, t]);

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
    doc.text(t('reports.pdf.title'), 14, 18);
    doc.setFontSize(10);
    doc.text(t('reports.pdf.generatedOn', { date: new Date().toLocaleDateString(i18n.language) }), 14, 25);

    doc.setFontSize(11);
    doc.text(t('reports.pdf.totalStudents', { count: totalStudents }), 14, 36);
    doc.text(t('reports.pdf.avgAttendance', { rate: avgAttendance }), 14, 43);
    doc.text(t('reports.pdf.financeLine', { income: totalIncome, expenses: totalExpenses, profit: netProfit }), 14, 50);
    doc.text(t('reports.pdf.examAvg', { rate: overallExamAvg }), 14, 57);

    autoTable(doc, {
      startY: 65,
      head: [[t('reports.pdf.headers.class'), t('reports.pdf.headers.studentCount')]],
      body: enrollmentByClass.map((c) => [c.className, c.students]),
    });

    autoTable(doc, {
      head: [[t('reports.pdf.headers.class'), t('reports.pdf.headers.examAvg')]],
      body: examPerformanceByClass.map((c) => [c.className, c.avgPercent]),
    });

    autoTable(doc, {
      head: [[t('reports.pdf.headers.week'), t('reports.pdf.headers.attendanceRate')]],
      body: attendanceTrend.map((w) => [t('reports.attendanceTrend.week', { n: w.weekNumber }), w.rate]),
    });

    autoTable(doc, {
      head: [[t('reports.pdf.headers.student'), t('reports.pdf.headers.class'), t('reports.pdf.headers.gpa')]],
      body: topStudents.map((s) => [s.name, s.className, s.gpa.toFixed(2)]),
    });

    autoTable(doc, {
      head: [[t('reports.pdf.headers.teacher'), t('reports.pdf.headers.attendanceRate')]],
      body: teacherAttendanceSummary.map((row) => [row.name, row.rate]),
    });

    doc.save('kayd-warbixinta-guud.pdf');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('reports.pageTitle')}</h2>
          <p>{t('reports.pageSubtitle')}</p>
        </div>
        <div className="rep-header-actions">
          <button className="btn-primary" onClick={handleExportPDF}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            {t('reports.exportPdf')}
          </button>
        </div>
      </div>

      {/* KEY METRICS */}
      <div className="rep-metrics-grid">
        <div className="rep-metric-card">
          <div className="rep-metric-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <div><span className="rep-metric-value">{totalStudents}</span><span className="rep-metric-label">{t('reports.metrics.totalStudents')}</span></div>
        </div>
        <div className="rep-metric-card">
          <div className="rep-metric-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/></svg>
          </div>
          <div><span className="rep-metric-value">{avgAttendance}%</span><span className="rep-metric-label">{t('reports.metrics.avgAttendance')}</span></div>
        </div>
        <div className="rep-metric-card">
          <div className="rep-metric-icon teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div><span className={`rep-metric-value ${netProfit >= 0 ? 'success' : 'danger'}`}>${netProfit.toLocaleString()}</span><span className="rep-metric-label">{t('reports.metrics.netProfit')}</span></div>
        </div>
        <div className="rep-metric-card">
          <div className="rep-metric-icon purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
          </div>
          <div><span className="rep-metric-value">{overallExamAvg}%</span><span className="rep-metric-label">{t('reports.metrics.examAvg')}</span></div>
        </div>
      </div>

      <div className="rep-grid-2col">

        {/* ENROLLMENT BY CLASS */}
        <div className="dash-card">
          <h3 className="rep-card-title">{t('reports.enrollment.title')}</h3>
          {enrollmentByClass.length === 0 ? (
            <p className="rep-empty">{t('reports.enrollment.empty')}</p>
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
          <h3 className="rep-card-title">{t('reports.examPerformance.title')}</h3>
          {examPerformanceByClass.length === 0 ? (
            <p className="rep-empty">{t('reports.examPerformance.empty')}</p>
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
          <h3 className="rep-card-title">
            {attendanceTrend.length
              ? t('reports.attendanceTrend.titleWithCount', { count: attendanceTrend.length })
              : t('reports.attendanceTrend.title')}
          </h3>
          {attendanceTrend.length === 0 ? (
            <p className="rep-empty">{t('reports.attendanceTrend.empty')}</p>
          ) : (
            <div className="rep-trend-chart">
              {attendanceTrend.map((w) => (
                <div className="rep-trend-col" key={w.weekNumber}>
                  <div className="rep-trend-bar-wrap">
                    <div className="rep-trend-bar" style={{ height: `${w.rate}%` }}>
                      <span>{w.rate}%</span>
                    </div>
                  </div>
                  <span className="rep-trend-label">{t('reports.attendanceTrend.weekShort', { n: w.weekNumber })}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FINANCE SUMMARY */}
        <div className="dash-card">
          <h3 className="rep-card-title">{t('reports.finance.title')}</h3>
          <div className="rep-finance-bars">
            <div className="rep-finance-row">
              <span className="rep-finance-label">{t('reports.finance.income')}</span>
              <div className="rep-bar-track">
                <div className="rep-bar-fill green" style={{ width: `${(totalIncome / maxFinanceBar) * 100}%` }}></div>
              </div>
              <span className="rep-bar-value">${totalIncome.toLocaleString()}</span>
            </div>
            <div className="rep-finance-row">
              <span className="rep-finance-label">{t('reports.finance.expenses')}</span>
              <div className="rep-bar-track">
                <div className="rep-bar-fill red" style={{ width: `${(totalExpenses / maxFinanceBar) * 100}%` }}></div>
              </div>
              <span className="rep-bar-value">${totalExpenses.toLocaleString()}</span>
            </div>
          </div>
          <div className={`rep-net-banner ${netProfit >= 0 ? 'positive' : 'negative'}`}>
            {t('reports.metrics.netProfit')}: <strong>${netProfit.toLocaleString()}</strong>
          </div>
        </div>

      </div>

      <div className="rep-grid-2col">

        {/* TOP STUDENTS */}
        <div className="dash-card">
          <h3 className="rep-card-title">{t('reports.topStudents.title')}</h3>
          {topStudents.length === 0 ? (
            <p className="rep-empty">{t('reports.topStudents.empty')}</p>
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
          <h3 className="rep-card-title">{t('reports.teacherAttendance.title')}</h3>
          {teacherAttendanceSummary.length === 0 ? (
            <p className="rep-empty">{t('reports.teacherAttendance.empty')}</p>
          ) : (
            <div className="rep-bar-list">
              {teacherAttendanceSummary.map((row) => (
                <div className="rep-bar-row" key={row.name}>
                  <span className="rep-bar-label">{row.name}</span>
                  <div className="rep-bar-track">
                    <div className={`rep-bar-fill ${row.rate >= 90 ? 'green' : row.rate >= 80 ? 'orange' : 'red'}`} style={{ width: `${row.rate}%` }}></div>
                  </div>
                  <span className="rep-bar-value">{row.rate}%</span>
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
