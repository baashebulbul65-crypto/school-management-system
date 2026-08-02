// firebase/examMarks.js
// Buundooyinka imtixaanada — collection "examMarks". Document ID kasta waa
// "{examId}_{studentId}" (deterministic), si beddelka buundada uu u cusbooneysiiyo
// isla record-ka halkii ay u abuuri lahayd mid cusub.

import { collection, doc, setDoc, updateDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'examMarks';

function recordId(examId, studentId) {
  return `${examId}_${studentId}`;
}

// "classTeacherId" (Teacher Firestore Hardening, 2026-08-02): haddii la
// gudbiyo (macallin), query-ga waxaa lagu daraa 'classTeacherId' si Firestore
// Rules-ku ay u ogolaadaan KALIYA buundooyinka fasalka macallinkan — haddii
// kale (owner/null) query-gu waa schoolCode-wide sida hore. Fiiri
// firestore.rules: examMarks.
export function subscribeToExamMarks(schoolCode, classTeacherId, onChange, onError) {
  const constraints = [where('schoolCode', '==', schoolCode)];
  if (classTeacherId) constraints.push(where('classTeacherId', '==', classTeacherId));
  const q = query(collection(db, COLLECTION), ...constraints);
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data())),
    onError
  );
}

export async function setExamMarkRecord(schoolCode, examId, studentId, mark, classTeacherId) {
  await setDoc(doc(db, COLLECTION, recordId(examId, studentId)), {
    schoolCode, examId, studentId, mark, classTeacherId: classTeacherId || null,
  });
}

// Hal mar loo isticmaalo (Teacher Firestore Hardening, 2026-08-02) — u
// buuxisa 'classTeacherId' buundooyinkii hore loo abuuray ka hor intaan
// field-kaas cusub la darin, iyada oo ka soo qaadaysa xiriirka
// examId -> classTeacherId (fiiri SchoolDataContext.jsx). Records-ka horeba
// leh field-ka (xitaa null) waa la boodaa — ma dib-u-qorin.
export async function backfillExamMarksClassScoping(schoolCode, examIdToTeacherId) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  const snap = await getDocs(q);
  await Promise.all(
    snap.docs.map((d) => {
      const data = d.data();
      if (data.classTeacherId !== undefined) return null;
      return updateDoc(doc(db, COLLECTION, d.id), { classTeacherId: examIdToTeacherId.get(data.examId) || null });
    })
  );
}

// Buundooyinka arday gaar ah — waxaa isticmaala ParentPortal. Query-gan gaar ah
// (studentId filter) ayaa loo baahan yahay si Firestore Security Rules-ku ugu
// ogolaadaan waalidka inuu akhriyo kaliya buundooyinka ilmihiisa.
export function subscribeToStudentExamMarks(schoolCode, studentId, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode), where('studentId', '==', studentId));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data())),
    onError
  );
}
