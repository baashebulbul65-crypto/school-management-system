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

// Xogta imaanshaha "MAANTA" ee MACALLIMIINTA/SHAQAALAHA — collection GOONI ah
// oo ka duwan "attendanceRecords" (kaas oo gaar u ah ardayda), maadaama
// person-yadan aysan lahayn "studentId". Document ID kasta waa
// "{category}_{date}_{personId}" ("category" waa 'teachers' ama 'staff').
const STAFF_COLLECTION = 'staffAttendanceRecords';

function staffRecordId(category, date, personId) {
  return `${category}_${date}_${personId}`;
}

export function subscribeToStaffAttendanceByDate(schoolCode, category, date, onChange, onError) {
  const q = query(
    collection(db, STAFF_COLLECTION),
    where('schoolCode', '==', schoolCode),
    where('category', '==', category),
    where('date', '==', date)
  );
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data())),
    onError
  );
}

export async function setStaffAttendanceRecord(schoolCode, category, date, personId, status) {
  await setDoc(doc(db, STAFF_COLLECTION, staffRecordId(category, date, personId)), {
    schoolCode, date, category, personId, status,
  });
}
