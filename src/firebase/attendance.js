// firebase/attendance.js
// Xogta imaanshaha ARDAYDA — collection "attendanceRecords". Document ID kasta
// waa "{date}_{studentId}" (deterministic), si calaamadinta labaad ee isla
// maalinta ay u beddesho isla record-ka halkii ay u abuuri lahayd mid cusub.

import { collection, doc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'attendanceRecords';

function recordId(date, studentId) {
  return `${date}_${studentId}`;
}

export function subscribeToAttendanceByDate(schoolCode, date, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode), where('date', '==', date));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data())),
    onError
  );
}

export async function setStudentAttendanceRecord(schoolCode, date, studentId, className, status) {
  await setDoc(doc(db, COLLECTION, recordId(date, studentId)), {
    schoolCode, date, studentId, className, status,
  });
}

// Taariikhda imaanshaha oo dhan ee arday gaar ah — waxaa isticmaala ParentPortal.
export function subscribeToStudentAttendanceHistory(schoolCode, studentId, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode), where('studentId', '==', studentId));
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs.map((d) => d.data());
      records.sort((a, b) => a.date.localeCompare(b.date));
      onChange(records);
    },
    onError
  );
}
