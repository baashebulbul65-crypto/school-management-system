// firebase/attendance.js
// Xogta imaanshaha ARDAYDA — collection "attendanceRecords". Document ID kasta
// waa "{date}_{studentId}" (deterministic), si calaamadinta labaad ee isla
// maalinta ay u beddesho isla record-ka halkii ay u abuuri lahayd mid cusub.

import { collection, doc, setDoc, updateDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'attendanceRecords';

function recordId(date, studentId) {
  return `${date}_${studentId}`;
}

// "classTeacherId" (Teacher Firestore Hardening, 2026-08-02): haddii la
// gudbiyo (macallin), query-ga waxaa lagu daraa 'classTeacherId' si Firestore
// Rules-ku ay u ogolaadaan KALIYA records-ka fasalka macallinkan — haddii kale
// (owner/null) query-gu waa schoolCode-wide sida hore. Fiiri firestore.rules:
// attendanceRecords.
export function subscribeToAttendanceByDate(schoolCode, date, classTeacherId, onChange, onError) {
  const constraints = [where('schoolCode', '==', schoolCode), where('date', '==', date)];
  if (classTeacherId) constraints.push(where('classTeacherId', '==', classTeacherId));
  const q = query(collection(db, COLLECTION), ...constraints);
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data())),
    onError
  );
}

export async function setStudentAttendanceRecord(schoolCode, date, studentId, className, classTeacherId, status) {
  await setDoc(doc(db, COLLECTION, recordId(date, studentId)), {
    schoolCode, date, studentId, className, classTeacherId: classTeacherId || null, status,
  });
}

// Dhammaan diiwaanka imaanshaha ee ARDAYDA OO DHAN (taariikhda oo dhan, ma
// ahan hal maalin) — waxaa isticmaala bogga Attendance ee warbixinnada
// toddobaadka/bisha/sanadka (fiiri Attendance.jsx). "classTeacherId" — fiiri
// faallada subscribeToAttendanceByDate kore.
export function subscribeToAllAttendanceRecords(schoolCode, classTeacherId, onChange, onError) {
  const constraints = [where('schoolCode', '==', schoolCode)];
  if (classTeacherId) constraints.push(where('classTeacherId', '==', classTeacherId));
  const q = query(collection(db, COLLECTION), ...constraints);
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data())),
    onError
  );
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

// Dhammaan diiwaanka imaanshaha ee MACALLIMIINTA + SHAQAALAHA OO DHAN
// (taariikhda oo dhan) — la mid ah subscribeToAllAttendanceRecords ee
// ardayda, loo isticmaalo warbixinnada toddobaadka/bisha/sanadka.
export function subscribeToAllStaffAttendanceRecords(schoolCode, onChange, onError) {
  const q = query(collection(db, STAFF_COLLECTION), where('schoolCode', '==', schoolCode));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data())),
    onError
  );
}

// Hal mar loo isticmaalo (Teacher Firestore Hardening, 2026-08-02) — u
// buuxisa 'classTeacherId' record-yadii ARDAYDA ee hore loo abuuray ka hor
// intaan field-kaas cusub la darin (firestore.rules-ku hadda ku tiirsan
// yahay), iyada oo ka soo qaadaysa xiriirka className -> classTeacherId ee
// fasallada hadda (Map, fiiri SchoolDataContext.jsx). Records-ka horeba
// leh field-ka (xitaa null) waa la boodaa — ma dib-u-qorin.
export async function backfillAttendanceClassScoping(schoolCode, classNameToTeacherId) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  const snap = await getDocs(q);
  await Promise.all(
    snap.docs.map((d) => {
      const data = d.data();
      if (data.classTeacherId !== undefined) return null;
      return updateDoc(doc(db, COLLECTION, d.id), { classTeacherId: classNameToTeacherId.get(data.className) || null });
    })
  );
}
