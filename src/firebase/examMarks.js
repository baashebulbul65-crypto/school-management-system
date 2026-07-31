// firebase/examMarks.js
// Buundooyinka imtixaanada — collection "examMarks". Document ID kasta waa
// "{examId}_{studentId}" (deterministic), si beddelka buundada uu u cusbooneysiiyo
// isla record-ka halkii ay u abuuri lahayd mid cusub.

import { collection, doc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'examMarks';

function recordId(examId, studentId) {
  return `${examId}_${studentId}`;
}

export function subscribeToExamMarks(schoolCode, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data())),
    onError
  );
}

export async function setExamMarkRecord(schoolCode, examId, studentId, mark) {
  await setDoc(doc(db, COLLECTION, recordId(examId, studentId)), {
    schoolCode, examId, studentId, mark,
  });
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
