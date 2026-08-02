// firebase/subjects.js
// CRUD ee collection-ka "subjects" ee Firestore — la mid ah teachers.js/classes.js.

import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'subjects';

export function subscribeToSubjects(schoolCode, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function createSubjectDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

export async function updateSubjectDoc(subjectId, data) {
  await updateDoc(doc(db, COLLECTION, subjectId), data);
}

export async function deleteSubjectDoc(subjectId) {
  await deleteDoc(doc(db, COLLECTION, subjectId));
}

// Marka macallin laga saaro nidaamka (Users.jsx "Ka Saar") — dhammaan
// maadooyinka uu ahaa "teacherId" waa in la nadiifiyo (null), ma aha in
// maadada la tirtiro (fiiri SchoolDataContext.jsx: cascadeUnlinkTeacher).
export async function unlinkTeacherFromSubjects(schoolCode, teacherDocId) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode), where('teacherId', '==', teacherDocId));
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => updateDoc(doc(db, COLLECTION, d.id), { teacherId: null })));
}
