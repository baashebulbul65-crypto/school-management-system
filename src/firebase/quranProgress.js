// firebase/quranProgress.js
// Horumarka Quraanka ee ardayda — collection "quranProgress". Document ID kasta
// waa "{date}_{studentId}" (deterministic), si calaamadinta labaad ee isla
// maalinta ay u beddesho isla record-ka halkii ay u abuuri lahayd mid cusub.

import { collection, doc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'quranProgress';

function recordId(date, studentId) {
  return `${date}_${studentId}`;
}

export function subscribeToQuranProgressByDate(schoolCode, date, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode), where('date', '==', date));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data())),
    onError
  );
}

export async function setQuranProgressRecord(schoolCode, date, studentId, className, result, surah) {
  await setDoc(doc(db, COLLECTION, recordId(date, studentId)), {
    schoolCode, date, studentId, className, result, surah: surah || '',
  });
}

// Taariikhda garashada Quraanka oo dhan ee arday gaar ah — waxaa isticmaala ParentPortal.
export function subscribeToStudentQuranProgressHistory(schoolCode, studentId, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode), where('studentId', '==', studentId));
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs.map((d) => d.data());
      records.sort((a, b) => b.date.localeCompare(a.date));
      onChange(records);
    },
    onError
  );
}
