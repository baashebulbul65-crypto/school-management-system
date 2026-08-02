// utils/grades.js
// Xisaabinta darajada (grade) iyo GPA-ga boqolkiiba buundada — la wadaago
// Exams.jsx iyo StudentProfileModal.jsx, si aan halka kasta xisaab u dhigin.
export function gradeFromPercent(pct) {
  if (pct >= 80) return { grade: 'A', gpa: 4.0 };
  if (pct >= 65) return { grade: 'B', gpa: 3.0 };
  if (pct >= 50) return { grade: 'C', gpa: 2.0 };
  if (pct >= 40) return { grade: 'D', gpa: 1.0 };
  return { grade: 'F', gpa: 0.0 };
}
