// firebase/classes.js
// CRUD ee collection-ka "classes" ee Firestore — la mid ah teachers.js.

import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, where, arrayRemove } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'classes';

export function subscribeToClasses(schoolCode, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function createClassDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

export async function updateClassDoc(classId, data) {
  await updateDoc(doc(db, COLLECTION, classId), data);
}

export async function deleteClassDoc(classId) {
  await deleteDoc(doc(db, COLLECTION, classId));
}

// Marka macallin laga saaro nidaamka (Users.jsx "Ka Saar") — dhammaan
// fasallada uu ahaa "classTeacherId" waa in la nadiifiyo (null), ma aha in
// fasalka qudhiisa la tirtiro, si fasalku uusan sii muujin macallin aan
// hadda jirin (fiiri SchoolDataContext.jsx: cascadeUnlinkTeacher).
export async function unlinkTeacherFromClasses(schoolCode, teacherDocId) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode), where('classTeacherId', '==', teacherDocId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => updateDoc(doc(db, COLLECTION, d.id), { classTeacherId: null })));
}

// Marka subject laga saaro Subjects.jsx ("Tirtir") — dhammaan fasallada
// isticmaali jiray subject-kaas ID-giisa waa in laga saaraa (arrayRemove)
// "subjectIds"-kooda, si aan looga tagin ID orphan ah oo aan ka fasaxin
// meel kasta (Classes audit qayb 2aad, 2026-08-02). arrayRemove wuu
// nabdoon yahay xitaa haddii ID-gu horeba ka maqan yahay array-ka
// (no-op), sidaas darteed lama baahna in hore loo hubiyo.
export async function unlinkSubjectFromClasses(schoolCode, subjectId) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode), where('subjectIds', 'array-contains', subjectId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => updateDoc(doc(db, COLLECTION, d.id), { subjectIds: arrayRemove(subjectId) })));
}
