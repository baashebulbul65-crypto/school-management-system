// firebase/teachers.js
// CRUD ee collection-ka "teachers" ee Firestore — xogta macallinka kasta
// waxay leedahay field "schoolCode" si dugsi kasta uu u arko kaliya
// macallimiintiisa (multi-tenant), la mid ah students.js.

import { collection, doc, addDoc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'teachers';

export function subscribeToTeachers(schoolCode, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function createTeacherDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

export async function updateTeacherDoc(teacherId, data) {
  await updateDoc(doc(db, COLLECTION, teacherId), data);
}

// Marka macallin laga saaro nidaamka (Users.jsx "Ka Saar") — diiwaanka
// "teachers" lafteeda LAMA TIRTIRO (firestore.rules: allow delete: if false,
// isla mabda'a diiwaannada taariikheed ee kale), waxaa loo beddelaa
// status:'inactive' si Teachers.jsx uu u muujiyo xaaladdiisa oo
// ClassFormModal/SubjectFormModal/FinanceEntryModal aysan mar dambe ku xulan
// karin (fiiri SchoolDataContext.jsx: cascadeUnlinkTeacher).
export async function deactivateTeacherDoc(teacherId) {
  await updateDoc(doc(db, COLLECTION, teacherId), { status: 'inactive' });
}
