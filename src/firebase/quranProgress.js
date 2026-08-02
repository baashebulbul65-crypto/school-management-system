// firebase/quranProgress.js
// Horumarka Quraanka ee ardayda — collection "quranProgress". Document ID kasta
// waa "{date}_{studentId}" (deterministic), si calaamadinta labaad ee isla
// maalinta ay u beddesho isla record-ka halkii ay u abuuri lahayd mid cusub.

import { collection, doc, setDoc, updateDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'quranProgress';

function recordId(date, studentId) {
  return `${date}_${studentId}`;
}

// "classTeacherId" (Teacher Firestore Hardening, 2026-08-02): haddii la
// gudbiyo (macallin), query-ga waxaa lagu daraa 'classTeacherId' si Firestore
// Rules-ku ay u ogolaadaan KALIYA horumarka fasalka macallinkan — haddii
// kale (owner/null) query-gu waa schoolCode-wide sida hore. Fiiri
// firestore.rules: quranProgress.
export function subscribeToQuranProgressByDate(schoolCode, date, classTeacherId, onChange, onError) {
  const constraints = [where('schoolCode', '==', schoolCode), where('date', '==', date)];
  if (classTeacherId) constraints.push(where('classTeacherId', '==', classTeacherId));
  const q = query(collection(db, COLLECTION), ...constraints);
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data())),
    onError
  );
}

export async function setQuranProgressRecord(schoolCode, date, studentId, className, result, surah, classTeacherId) {
  await setDoc(doc(db, COLLECTION, recordId(date, studentId)), {
    schoolCode, date, studentId, className, result, surah: surah || '', classTeacherId: classTeacherId || null,
  });
}

// Hal mar loo isticmaalo (Teacher Firestore Hardening, 2026-08-02) — u
// buuxisa 'classTeacherId' record-yadii hore loo abuuray ka hor intaan
// field-kaas cusub la darin, iyada oo ka soo qaadaysa xiriirka
// className -> classTeacherId (fiiri SchoolDataContext.jsx). Records-ka
// horeba leh field-ka (xitaa null) waa la boodaa — ma dib-u-qorin.
export async function backfillQuranProgressClassScoping(schoolCode, classNameToTeacherId) {
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
