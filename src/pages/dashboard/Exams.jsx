import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExamFormModal from './ExamFormModal';
import '../../styles/dashboard-shared.css';
import './Exams.css';

const EXAM_TYPES = ['Midterm', 'Final', 'Monthly', 'Quiz', 'Oral', 'Practical'];

const TABS = [
  { id: 'exams', label: 'Imtixaanada' },
  { id: 'marks', label: 'Gelinta Buundooyinka' },
  { id: 'results', label: 'Natiijooyinka & GPA' },
  { id: 'reportcard', label: 'Report Card' },
];

const STUDENTS = [
  { id: 1, name: 'Ismaaciil Cabdi Xasan', className: 'Form 1A' },
  { id: 2, name: 'Cabdiraxman Yoonis', className: 'Form 1A' },
  { id: 3, name: 'Xaawo Maxamed Cali', className: 'Form 2A' },
  { id: 4, name: 'Amiina Cabdulle', className: 'Form 2A' },
  { id: 5, name: 'Sacdiyo Xasan Nuur', className: 'Form 3A' },
  { id: 6, name: 'Maxamed Xuseen Cige', className: 'Form 4A' },
];

const INITIAL_EXAMS = [
  { id: 1, type: 'Midterm', subject: 'Xisaabta', className: 'Form 1A', date: '2026-07-10', maxMarks: 100 },
  { id: 2, type: 'Final', subject: 'Ingiriisi', className: 'Form 1A', date: '2026-07-22', maxMarks: 100 },
  { id: 3, type: 'Quiz', subject: 'Sayniska', className: 'Form 2A', date: '2026-07-14', maxMarks: 20 },
  { id: 4, type: 'Monthly', subject: 'Xisaabta', className: 'Form 2A', date: '2026-07-05', maxMarks: 50 },
  { id: 5, type: 'Oral', subject: 'Ingiriisi', className: 'Form 3A', date: '2026-07-08', maxMarks: 30 },
  { id: 6, type: 'Practical', subject: 'Fiisigis', className: 'Form 4A', date: '2026-07-16', maxMarks: 40 },
];

const INITIAL_MARKS = {
  1: { 1: 82, 2: 48 },
  2: { 1: 74, 2: 55 },
  3: { 3: 17, 4: 19 },
  4: { 3: 40, 4: 44 },
  5: { 5: 24 },
  6: { 6: 34 },
};

function gradeFromPercent(pct) {
  if (pct >= 80) return { grade: 'A', gpa: 4.0 };
  if (pct >= 65) return { grade: 'B', gpa: 3.0 };
  if (pct >= 50) return { grade: 'C', gpa: 2.0 };
  if (pct >= 40) return { grade: 'D', gpa: 1.0 };
  return { grade: 'F', gpa: 0.0 };
}

function initials(name) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function Exams() {
  const [exams, setExams] = useState(INITIAL_EXAMS);
  const [marks, setMarks] = useState(INITIAL_MARKS);
  const [activeTab, setActiveTab] = useState('exams');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id);
  const [resultsClass, setResultsClass] = useState('Form 1A');
  const [reportStudentId, setReportStudentId] = useState(STUDENTS[0].id);

  const classes = useMemo(() => [...new Set(STUDENTS.map((s) => s.className))], []);

  const openAddModal = () => { setEditingExam(null); setShowFormModal(true); };
  const openEditModal = (exam) => { setEditingExam(exam); setShowFormModal(true); };

  const handleSaveExam = (payload, examId) => {
    if (examId) {
      setExams((prev) => prev.map((e) => (e.id === examId ? { ...e, ...payload } : e)));
    } else {
      const newExam = { ...payload, id: Date.now() };
      setExams((prev) => [...prev, newExam]);
      setMarks((prev) => ({ ...prev, [newExam.id]: {} }));
    }
  };

  const handleDeleteExam = (examId, label) => {
    if (window.confirm(`Ma hubtaa inaad tirtirayso imtixaanka "${label}"?`)) {
      setExams((prev) => prev.filter((e) => e.id !== examId));
    }
  };

  const updateMark = (examId, studentId, value) => {
    setMarks((prev) => ({
      ...prev,
      [examId]: { ...prev[examId], [studentId]: value === '' ? '' : Number(value) },
    }));
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const studentsForSelectedExam = selectedExam ? STUDENTS.filter((s) => s.className === selectedExam.className) : [];

  // ===== RESULTS & GPA CALCULATION (per class) =====
  const classResults = useMemo(() => {
    const studentsInClass = STUDENTS.filter((s) => s.className === resultsClass);
    const examsInClass = exams.filter((e) => e.className === resultsClass);

    const rows = studentsInClass.map((student) => {
      let totalPct = 0;
      let count = 0;
      let totalGpa = 0;

      examsInClass.forEach((exam) => {
        const mark = marks[exam.id]?.[student.id];
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
  }, [resultsClass, exams, marks]);

  // ===== REPORT CARD (per student) =====
  const reportStudent = STUDENTS.find((s) => s.id === reportStudentId);
  const reportExams = exams.filter((e) => e.className === reportStudent?.className);
  const reportRows = reportExams.map((exam) => {
    const mark = marks[exam.id]?.[reportStudent.id];
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
    doc.text('Xarun — Report Card', 14, 18);
    doc.setFontSize(11);
    doc.text(`Ardayga: ${reportStudent.name}`, 14, 28);
    doc.text(`Fasalka: ${reportStudent.className}`, 14, 35);
    doc.text(`GPA Guud: ${reportGpa}`, 14, 42);
    doc.text(`Booska Fasalka (Position): ${reportPosition || '—'}`, 14, 49);

    autoTable(doc, {
      startY: 58,
      head: [['Maadada', 'Nooca', 'Buundooyinka', 'Darajada']],
      body: reportRows.map((r) => [
        r.exam.subject,
        r.exam.type,
        r.mark !== undefined && r.mark !== '' ? `${r.mark}/${r.exam.maxMarks}` : 'Lama gelin',
        r.gradeInfo ? r.gradeInfo.grade : '—',
      ]),
    });

    doc.save(`report-card-${reportStudent.name.replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Imtixaanada</h2>
          <p>Maamul imtixaanada, buundooyinka, darajooyinka, GPA, iyo Report Card-yada.</p>
        </div>
        {activeTab === 'exams' && (
          <button className="btn-primary" onClick={openAddModal}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Abuur Imtixaan Cusub
          </button>
        )}
      </div>

      <div className="fin-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`fin-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== EXAMS LIST ===== */}
      {activeTab === 'exams' && (
        <div className="dash-card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Nooca</th><th>Maadada</th><th>Fasalka</th><th>Taariikhda</th><th>Buundooyinka Guud</th><th></th></tr>
              </thead>
              <tbody>
                {exams.map((e) => (
                  <tr key={e.id}>
                    <td><span className="badge badge-neutral">{e.type}</span></td>
                    <td className="cell-name">{e.subject}</td>
                    <td>{e.className}</td>
                    <td className="cell-sub">{e.date}</td>
                    <td>{e.maxMarks}</td>
                    <td>
                      <div className="row-actions">
                        <button className="row-action-btn" title="Wax Ka Beddel" onClick={() => openEditModal(e)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z"/></svg>
                        </button>
                        <button className="row-action-btn danger" title="Tirtir" onClick={() => handleDeleteExam(e.id, `${e.type} - ${e.subject}`)}>
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
            <label>Dooro Imtixaanka:</label>
            <select value={selectedExamId} onChange={(e) => setSelectedExamId(Number(e.target.value))}>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>{e.type} — {e.subject} ({e.className})</option>
              ))}
            </select>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Ardayga</th><th>Buundooyinka (ka badan {selectedExam?.maxMarks} ma noqon karto)</th><th>Boqolkiiba</th></tr></thead>
              <tbody>
                {studentsForSelectedExam.map((s) => {
                  const mark = marks[selectedExamId]?.[s.id];
                  const pct = mark !== undefined && mark !== '' ? Math.round((mark / selectedExam.maxMarks) * 100) : null;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="cell-person">
                          <div className="cell-avatar">{initials(s.name)}</div>
                          <span className="cell-name">{s.name}</span>
                        </div>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="marks-input"
                          min="0"
                          max={selectedExam?.maxMarks}
                          value={mark ?? ''}
                          onChange={(ev) => updateMark(selectedExamId, s.id, ev.target.value)}
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
            <label>Dooro Fasalka:</label>
            <select value={resultsClass} onChange={(e) => setResultsClass(e.target.value)}>
              {classes.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Booska</th><th>Ardayga</th><th>Imtixaanada La Qaatay</th><th>Celceliska %</th><th>GPA</th><th>Darajada</th></tr>
              </thead>
              <tbody>
                {classResults.map((r) => (
                  <tr key={r.student.id}>
                    <td>
                      <span className={`position-badge ${r.position === 1 ? 'gold' : r.position === 2 ? 'silver' : r.position === 3 ? 'bronze' : ''}`}>
                        #{r.position}
                      </span>
                    </td>
                    <td className="cell-name">{r.student.name}</td>
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
            <label>Dooro Ardayga:</label>
            <select value={reportStudentId} onChange={(e) => setReportStudentId(Number(e.target.value))}>
              {STUDENTS.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.className})</option>)}
            </select>
            <button className="btn-primary report-export-btn" onClick={handleExportReportCard}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Export PDF
            </button>
          </div>

          <div className="report-card">
            <div className="report-card-header">
              <div className="report-avatar">{initials(reportStudent.name)}</div>
              <div>
                <h3>{reportStudent.name}</h3>
                <p>{reportStudent.className}</p>
              </div>
              <div className="report-stats">
                <div><span>{reportGpa}</span><label>GPA</label></div>
                <div><span>#{reportPosition || '—'}</span><label>Booska</label></div>
              </div>
            </div>

            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>Maadada</th><th>Nooca</th><th>Buundooyinka</th><th>Darajada</th></tr></thead>
                <tbody>
                  {reportRows.map((r, i) => (
                    <tr key={i}>
                      <td className="cell-name">{r.exam.subject}</td>
                      <td><span className="badge badge-neutral">{r.exam.type}</span></td>
                      <td>{r.mark !== undefined && r.mark !== '' ? `${r.mark}/${r.exam.maxMarks}` : 'Lama gelin'}</td>
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
      />
    </div>
  );
}

export default Exams;