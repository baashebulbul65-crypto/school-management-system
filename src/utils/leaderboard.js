// utils/leaderboard.js
// Xisaabinta Top-10 Leaderboard-ka Xaadiriska ("Ugu Joogta Badan" +
// "Ugu Waqtiga Dheer") — waxaa isku wadaaga Overview.jsx (card-ka) iyo
// Leaderboard.jsx (bogga labada tab), si aan xisaabta laba jeer loo qorin.
// Dhammaan function-yadan waa xisaab-celin FUDUD (single-pass reduce) oo
// lagu sameeyo xogta HOREBA la soo dejiyay (allStudentAttendanceRecords,
// students) — ma sameeyaan wax query Firestore cusub ah.

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateSafe(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Hal-mar-pass ah oo ka soo qaadaysa attendanceRecords OO DHAN: tirada
// maalmaha "Joog" + taariikhda ugu horreysay ee record kasta arday
// (loo isticmaalo "enrollment date" proxy-ga, fiiri resolveEnrollmentDate).
export function summarizeAttendanceRecords(records) {
  const presentCounts = {};
  const earliestDates = {};
  records.forEach((r) => {
    if (r.status === 'present') presentCounts[r.studentId] = (presentCounts[r.studentId] || 0) + 1;
    if (!earliestDates[r.studentId] || r.date < earliestDates[r.studentId]) earliestDates[r.studentId] = r.date;
  });
  return { presentCounts, earliestDates };
}

// Taariikhda "enrollment" ee arday kasta — student.createdAt (Firestore
// Timestamp, ardayda la abuuray createStudentDoc ka dib 2026-08-25) haddii
// jirto; haddii kale taariikhda ugu horreysay ee xaadiris record ah (proxy-ga
// ardayda HORE ee jiray ka hor field-kan, fiiri firebase/students.js). null
// haddii midna la haynin (ma jirto sabab la xisaabiyo).
export function resolveEnrollmentDate(student, earliestAttendanceDate) {
  return toDateSafe(student.createdAt) || toDateSafe(earliestAttendanceDate);
}

export function tenureDays(enrollmentDate) {
  if (!enrollmentDate) return null;
  return Math.max(0, Math.floor((Date.now() - enrollmentDate.getTime()) / DAY_MS));
}

// Xisaabinta "Top 10 Gartay Quraanka" — bil-bil ah (monthly reset, ma aha
// cumulative sida presentCounts/tenure kore), ku salaysan tirada record-yada
// quranProgress ee result === 'gartay' (fiiri ClassWorkspace.jsx) ee dhacay
// BISHAAS KALIYA (monthValue, tusaale "2026-08" — fiiri currentMonthValue,
// utils/somaliDate.js). Hal-mar-pass ah, xogta HOREBA la soo dejiyay
// (allQuranProgressRecords), ma sameeyo query Firestore cusub.
export function summarizeQuranMemorization(records, monthValue) {
  const counts = {};
  records.forEach((r) => {
    if (r.result === 'gartay' && r.date && r.date.slice(0, 7) === monthValue) {
      counts[r.studentId] = (counts[r.studentId] || 0) + 1;
    }
  });
  return counts;
}

// Liiska Top-N, midkasta { student, value }, kala-soocan hoos-u-dhac ah
// (value ugu badan marka hore); tie-break waa magaca (localeCompare). Ardayda
// aan lahayn qiime (null/undefined, tusaale enrollment date la'aan) waa laga
// saaraa — lama xisaabin karo.
export function buildTopList(students, valueFn, limit = 10) {
  return students
    .map((s) => ({ student: s, value: valueFn(s) }))
    .filter((row) => row.value !== null && row.value !== undefined)
    .sort((a, b) => b.value - a.value || a.student.fullName.localeCompare(b.student.fullName))
    .slice(0, limit);
}
