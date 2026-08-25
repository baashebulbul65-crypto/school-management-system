import { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from 'react-i18next';
import { useSchoolData } from '../../context/SchoolDataContext';
import { classroomName } from '../../hooks/useClassOptions';
import { gradeFromPercent } from '../../utils/grades';
import BackButton from '../../components/dashboard/BackButton';
import ExamFormModal from './ExamFormModal';
import '../../styles/dashboard-shared.css';
import './Exams.css';

const EXAM_TYPES = ['Midterm', 'Final', 'Monthly', 'Quiz', 'Oral', 'Practical'];

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Exams() {
  const { t } = useTranslation();
  const { students, classes, subjects, exams, examMarks, addExam, updateExam, removeExam, updateExamMark } = useSchoolData();
  const [activeTab, setActiveTab] = useState('exams');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id);
  // resultsClass hadda waa classId dhab ah (Firestore doc id), ma aha magac
  // qoraal ah — fiiri effect-ka hoose ee dooranaya fasalka ugu horreeya
  // marka classes-ku horay uga soo shubmo Firestore.
  const [resultsClass, setResultsClass] = useState('');
  const [reportStudentId, setReportStudentId] = useState(students[0]?.id);
  // Buundooyinka la qorayo hadda (kama bixin Firestore ilaa "onBlur") — si aan u
  // yareyno qorista Firestore keystroke kasta, isla markaana looga fogaado in
  // xogta soo socota (onSnapshot) ay kala jabiso wax qorista socota.
  const [pendingMarks, setPendingMarks] = useState({});

  const TABS = [
    { id: 'exams', label: t('exams.tabs.exams') },
    { id: 'marks', label: t('exams.tabs.marks') },
    { id: 'results', label: t('exams.tabs.results') },
    { id: 'reportcard', label: t('exams.tabs.reportcard') },
  ];

  // Ardayda waxaa laga soo shubaa Firestore si aan degdeg ah u socon (async) —
  // haddii aan la doorbidin arday weli, ama midkii la doortay uu tirtiran yahay,
  // dib u dooro kan ugu horreeya ee liiska.
  useEffect(() => {
    if (students.length && !students.some((s) => s.id === reportStudentId)) {
      setReportStudentId(students[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students]);

  // Isla qaabkaas — dooro fasalka ugu horreeya ee "classes" (dhab ah) marka
  // uu la doorto weli maqan yahay ama uu tirtiran yahay.
  useEffect(() => {
    if (classes.length && !classes.some((c) => c.id === resultsClass)) {
      setResultsClass(classes[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes]);

  const openAddModal = () => { setEditingExam(null); setShowFormModal(true); };
  const openEditModal = (exam) => { setEditingExam(exam); setShowFormModal(true); };

  const handleSaveExam = (payload, examId) => {
    if (examId) {
      updateExam(examId, payload);
    } else {
      addExam(payload);
    }
  };

  const handleDeleteExam = (examId, label) => {
    if (window.confirm(t('exams.confirmDelete', { label }))) {
      removeExam(examId);
    }
  };

  const markKey = (examId, studentId) => `${examId}_${studentId}`;

  const handleMarkChange = (examId, studentId, value) => {
    setPendingMarks((prev) => ({ ...prev, [markKey(examId, studentId)]: value }));
  };

  const commitMark = (examId, studentId) => {
    const key = markKey(examId, studentId);
    if (pendingMarks[key] === undefined) return;
    updateExamMark(examId, studentId, pendingMarks[key]);
    setPendingMarks((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // studentInClass/examInClass: classId marka jira, className fallback ilaa
  // ardayda/imtixaannada aan weli la dib-u-kaydin (fiiri backfill-ka
  // SchoolDataContext.jsx).
  const studentInClass = (s, cls) => (s.classId ? s.classId === cls.id : s.className === classroomName(cls));
  const examInClass = (e, cls) => (e.classId ? e.classId === cls.id : e.className === classroomName(cls));

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const selectedExamClass = selectedExam ? classes.find((c) => c.id === selectedExam.classId || classroomName(c) === selectedExam.className) : null;
  const studentsForSelectedExam = selectedExam
    ? students.filter((s) => (selectedExamClass ? studentInClass(s, selectedExamClass) : s.className === selectedExam.className))
    : [];

  // ===== RESULTS & GPA CALCULATION (per class) =====
  const resultsCls = classes.find((c) => c.id === resultsClass);
  const classResults = useMemo(() => {
    const studentsInClass = resultsCls ? students.filter((s) => studentInClass(s, resultsCls)) : [];
    const examsInClass = resultsCls ? exams.filter((e) => examInClass(e, resultsCls)) : [];

    const rows = studentsInClass.map((student) => {
      let totalPct = 0;
      let count = 0;
      let totalGpa = 0;

      examsInClass.forEach((exam) => {
        const mark = examMarks[exam.id]?.[student.id];
        if (mark !== undefined && mark !== '') {
          const pct = (mark / exam.maxMarks) * 100;
          const { gpa } = gradeFromPercent(pct);
          totalPct += pct;
          totalGpa += gpa;
          count += 1;
        }
      });

      const avgPct = count > 0 ? totalPct / count : 0;
      const avgGpa = count > 0 ? totalGpa / count : 0;
      const overallGrade = count > 0 ? gradeFromPercent(avgPct).grade : '—';

      return { student, avgPct, avgGpa, overallGrade, examCount: count };
    });

    // Position (ranking) — sida ugu sarreysa avgPct
    const sorted = [...rows].sort((a, b) => b.avgPct - a.avgPct);
    const withPosition = rows.map((row) => ({
      ...row,
      position: sorted.findIndex((r) => r.student.id === row.student.id) + 1,
    }));

    return withPosition.sort((a, b) => a.position - b.position);
  }, [resultsCls, exams, examMarks, students]);

  // ===== REPORT CARD (per student) =====
  const reportStudent = students.find((s) => s.id === reportStudentId);
  const reportStudentClass = reportStudent ? classes.find((c) => c.id === reportStudent.classId || classroomName(c) === reportStudent.className) : null;
  const reportExams = exams.filter((e) => (reportStudentClass ? examInClass(e, reportStudentClass) : e.className === reportStudent?.className));
  const reportRows = reportExams.map((exam) => {
    const mark = examMarks[exam.id]?.[reportStudent.id];
    const pct = mark !== undefined && mark !== '' ? (mark / exam.maxMarks) * 100 : null;
    const gradeInfo = pct !== null ? gradeFromPercent(pct) : null;
    return { exam, mark, gradeInfo };
  });
  const validReportRows = reportRows.filter((r) => r.mark !== undefined && r.mark !== null && r.mark !== '');
  const reportGpa = validReportRows.length
    ? (validReportRows.reduce((sum, r) => sum + r.gradeInfo.gpa, 0) / validReportRows.length).toFixed(2)
    : '—';
  const reportPosition = classResults.find((r) => r.student.id === reportStudent?.id)?.position;

  const handleExportReportCard = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(t('exams.pdf.title'), 14, 18);
    doc.setFontSize(11);
    doc.text(`${t('exams.pdf.student')}: ${reportStudent.fullName}`, 14, 28);
    doc.text(`${t('exams.pdf.class')}: ${reportStudent.className}`, 14, 35);
    doc.text(`${t('exams.pdf.overallGpa')}: ${reportGpa}`, 14, 42);
    doc.text(`${t('exams.pdf.position')}: ${reportPosition || '—'}`, 14, 49);

    autoTable(doc, {
      startY: 58,
      head: [[t('exams.table.subject'), t('exams.table.type'), t('students.profile.table.marks'), t('students.profile.table.grade')]],
      body: reportRows.map((r) => [
        r.exam.subject,
        r.exam.type,
        r.mark !== undefined && r.mark !== '' ? `${r.mark}/${r.exam.maxMarks}` : t('exams.notEntered'),
        r.gradeInfo ? r.gradeInfo.grade : '—',
      ]),
    });

    doc.save(`report-card-${reportStudent.fullName.replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('exams.pageTitle')}</h2>
          <p>{t('exams.pageSubtitle')}</p>
        </div>
        <div className="page-header-actions">
          <BackButton to="/dashboard" />
          {activeTab === 'exams' && (
            <button className="btn-primary" onClick={openAddModal}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {t('exams.addNew')}
            </button>
          )}
        </div>
      </div>

      <div className="fin-tabs">
        {TABS.map((tb) => (
          <button key={tb.id} className={`fin-tab ${activeTab === tb.id ? 'active' : ''}`} onClick={() => setActiveTab(tb.id)}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ===== EXAMS LIST ===== */}
      {activeTab === 'exams' && (
        <div className="dash-card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>{t('exams.table.type')}</th><th>{t('exams.table.subject')}</th><th>{t('exams.table.class')}</th><th>{t('exams.table.date')}</th><th>{t('exams.table.maxMarks')}</th><th></th></tr>
              </thead>
              <tbody>
                {exams.map((e) => (
                  <tr key={e.id}>
                    <td><span className="badge badge-neutral">{t(`exams.types.${e.type}`, e.type)}</span></td>
                    <td className="cell-name">{e.subject}</td>
                    <td>{e.className}</td>
                    <td className="cell-sub">{e.date}</td>
                    <td>{e.maxMarks}</td>
                    <td>
                      <div className="row-actions">
                        <button className="row-action-btn" title={t('common.actions.edit')} onClick={() => openEditModal(e)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                        </button>
                        <button className="row-action-btn danger" title={t('common.actions.delete')} onClick={() => handleDeleteExam(e.id, `${e.type} - ${e.subject}`)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MARKS ENTRY ===== */}
      {activeTab === 'marks' && (
        <div className="dash-card">
          <div className="exam-select-row">
            <label>{t('exams.selectExam')}</label>
            <select value={selectedExamId} onChange={(e) => setSelectedExamId(Number(e.target.value))}>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>{e.type} — {e.subject} ({e.className})</option>
              ))}
            </select>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('exams.marksTable.student')}</th><th>{t('exams.marksTable.marks', { max: selectedExam?.maxMarks })}</th><th>{t('exams.marksTable.percent')}</th></tr></thead>
              <tbody>
                {studentsForSelectedExam.map((s) => {
                  const key = markKey(selectedExamId, s.id);
                  const savedMark = examMarks[selectedExamId]?.[s.id];
                  const mark = pendingMarks[key] !== undefined ? pendingMarks[key] : savedMark;
                  const pct = mark !== undefined && mark !== '' ? Math.round((mark / selectedExam.maxMarks) * 100) : null;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="cell-person">
                          <div className="cell-avatar">{initials(s.fullName)}</div>
                          <span className="cell-name">{s.fullName}</span>
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="marks-input"
                          min="0"
                          max={selectedExam?.maxMarks}
                          value={mark ?? ''}
                          onChange={(ev) => handleMarkChange(selectedExamId, s.id, ev.target.value)}
                          onBlur={() => commitMark(selectedExamId, s.id)}
                          placeholder="—"
                        />
                      </td>
                      <td className="cell-sub">{pct !== null ? `${pct}%` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== RESULTS & GPA ===== */}
      {activeTab === 'results' && (
        <div className="dash-card">
          <div className="exam-select-row">
            <label>{t('exams.selectClass')}</label>
            <select value={resultsClass} onChange={(e) => setResultsClass(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{classroomName(c)}</option>)}
            </select>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>{t('exams.resultsTable.position')}</th><th>{t('exams.resultsTable.student')}</th><th>{t('exams.resultsTable.examsTaken')}</th><th>{t('exams.resultsTable.average')}</th><th>{t('exams.resultsTable.gpa')}</th><th>{t('exams.resultsTable.grade')}</th></tr>
              </thead>
              <tbody>
                {classResults.map((r) => (
                  <tr key={r.student.id}>
                    <td>
                      <span className={`position-badge ${r.position === 1 ? 'gold' : r.position === 2 ? 'silver' : r.position === 3 ? 'bronze' : ''}`}>
                        #{r.position}
                      </span>
                    </td>
                    <td className="cell-name">{r.student.fullName}</td>
                    <td className="cell-sub">{r.examCount}</td>
                    <td>{r.avgPct ? r.avgPct.toFixed(1) : '0.0'}%</td>
                    <td><span className="badge badge-neutral">{r.avgGpa.toFixed(2)}</span></td>
                    <td>
                      <span className={`badge ${r.overallGrade === 'A' ? 'badge-success' : r.overallGrade === 'F' ? 'badge-danger' : r.overallGrade === '—' ? 'badge-neutral' : 'badge-warning'}`}>
                        {r.overallGrade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== REPORT CARD ===== */}
      {activeTab === 'reportcard' && reportStudent && (
        <div className="dash-card">
          <div className="exam-select-row">
            <label>{t('exams.selectStudent')}</label>
            <select value={reportStudentId} onChange={(e) => setReportStudentId(Number(e.target.value))}>
              {students.map((s) => <option key={s.id} value={s.id}>{s.fullName} ({s.className})</option>)}
            </select>
            <button className="btn-primary report-export-btn" onClick={handleExportReportCard}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              {t('exams.exportPdf')}
            </button>
          </div>

          <div className="report-card">
            <div className="report-card-header">
              <div className="report-avatar">{initials(reportStudent.fullName)}</div>
              <div>
                <h3>{reportStudent.fullName}</h3>
                <p>{reportStudent.className}</p>
              </div>
              <div className="report-stats">
                <div><span>{reportGpa}</span><label>{t('exams.gpaLabel')}</label></div>
                <div><span>#{reportPosition || '—'}</span><label>{t('exams.positionLabel')}</label></div>
              </div>
            </div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>{t('exams.table.subject')}</th><th>{t('exams.table.type')}</th><th>{t('students.profile.table.marks')}</th><th>{t('students.profile.table.grade')}</th></tr></thead>
                <tbody>
                  {reportRows.map((r, i) => (
                    <tr key={i}>
                      <td className="cell-name">{r.exam.subject}</td>
                      <td><span className="badge badge-neutral">{t(`exams.types.${r.exam.type}`, r.exam.type)}</span></td>
                      <td>{r.mark !== undefined && r.mark !== '' ? `${r.mark}/${r.exam.maxMarks}` : t('exams.notEntered')}</td>
                      <td>
                        {r.gradeInfo ? (
                          <span className={`badge ${r.gradeInfo.grade === 'A' ? 'badge-success' : r.gradeInfo.grade === 'F' ? 'badge-danger' : 'badge-warning'}`}>
                            {r.gradeInfo.grade}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ExamFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveExam}
        exam={editingExam}
        examTypes={EXAM_TYPES}
        subjects={subjects}
        classes={classes}
      />
    </div>
  );
}

export default Exams;
