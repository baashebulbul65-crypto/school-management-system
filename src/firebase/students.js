// firebase/students.js
// CRUD dhammaystiran ee collection-ka "students" ee Firestore.
// Xogta arday kasta waxay leedahay field "schoolCode" si dugsi kasta uu
// u arko kaliya ardaydiisa (multi-tenant).

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  documentId,
} from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'students';

export function subscribeToStudents(schoolCode, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  return onSnapshot(
    q,
    (snap) => {
      const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      students.sort((a, b) => a.fullName.localeCompare(b.fullName));
      onChange(students);
    },
    onError
  );
}

export async function createStudentDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

export async function updateStudentDoc(studentId, data) {
  await updateDoc(doc(db, COLLECTION, studentId), data);
}

// Tirtir dabacsan — xogta kuma baxdo Firestore, waxaa lagu calaamadiyaa
// isDeleted si ay uga muuqato liiska caadiga ah, laakiin waa lagu soo celin
// karaa 45 maalmood gudahood (fiiri "Xogta La Tirtiray").
export async function softDeleteStudentDoc(studentId) {
  await updateDoc(doc(db, COLLECTION, studentId), { isDeleted: true, deletedAt: new Date().toISOString() });
}

export async function restoreStudentDoc(studentId) {
  await updateDoc(doc(db, COLLECTION, studentId), { isDeleted: false, deletedAt: null });
}

export async function deleteStudentDoc(studentId) {
  await deleteDoc(doc(db, COLLECTION, studentId));
}

// Waxaa loo isticmaalaa xiriirinta waalid/arday — barbardhigga Diiwaan ID-ga la
// geliyay iyo studentId-ga dhabta ah ee dugsigan.
export async function findStudentByStudentId(schoolCode, studentId) {
  const q = query(
    collection(db, COLLECTION),
    where('schoolCode', '==', schoolCode),
    where('studentId', '==', studentId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// Waxaa loo isticmaalaa ParentPortal — soo qaadista ilmaha (childrenIds) waalidku
// leeyahay. Firestore "in" query wuxuu taageeraa ugu badnaan 30 qiimo.
export async function getStudentsByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const q = query(collection(db, COLLECTION), where(documentId(), 'in', ids.slice(0, 30)));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getStudentById(studentId) {
  const snap = await getDoc(doc(db, COLLECTION, studentId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
