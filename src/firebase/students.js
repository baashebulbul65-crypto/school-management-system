// firebase/students.js
// CRUD dhammaystiran ee collection-ka "students" ee Firestore.
// Xogta arday kasta waxay leedahay field "schoolCode" si dugsi kasta uu
// u arko kaliya ardaydiisa (multi-tenant).

import {
  collection,
  doc,
  addDoc,
  setDoc,
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
const LOOKUP_COLLECTION = 'studentLookup';

// Doc ID deterministic ah — u oggolaanaya inaan si toos ah (getDoc) ugu heli
// karno raadinta, iyada oo aan loo baahnayn query/index (fiiri firestore.rules).
function lookupDocId(schoolCode, studentId) {
  return `${encodeURIComponent(schoolCode)}_${encodeURIComponent(studentId)}`;
}

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
  if (data.studentId) {
    await setDoc(doc(db, LOOKUP_COLLECTION, lookupDocId(schoolCode, data.studentId)), {
      schoolCode,
      studentId: data.studentId,
      studentDocId: docRef.id,
    });
  }
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
  const ref = doc(db, COLLECTION, studentId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const { schoolCode, studentId: humanId } = snap.data();
    if (schoolCode && humanId) {
      await deleteDoc(doc(db, LOOKUP_COLLECTION, lookupDocId(schoolCode, humanId))).catch(() => {});
    }
  }
  await deleteDoc(ref);
}

// Waxaa loo isticmaalaa xiriirinta waalid/arday — barbardhigga Diiwaan ID-ga la
// geliyay iyo studentId-ga dhabta ah ee dugsigan. Waxay akhridaa collection-ka
// gaaban 'studentLookup' halkii ay ka akhrin lahayd 'students' oo buuxa, si
// waalidku uusan u helin xogta gaarka ah ee ardayda kale (fiiri firestore.rules).
export async function findStudentByStudentId(schoolCode, studentId) {
  const snap = await getDoc(doc(db, LOOKUP_COLLECTION, lookupDocId(schoolCode, studentId)));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: data.studentDocId, studentId: data.studentId };
}

// Hal mar loo isticmaalo — u abuurta lookup doc-yada ardayda hore loo abuuray
// ka hor intaan collection-ka 'studentLookup' la darin (fiiri SchoolDataContext).
export async function backfillStudentLookups(schoolCode) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  const snap = await getDocs(q);
  await Promise.all(
    snap.docs.map((d) => {
      const data = d.data();
      if (!data.studentId) return null;
      return setDoc(doc(db, LOOKUP_COLLECTION, lookupDocId(schoolCode, data.studentId)), {
        schoolCode,
        studentId: data.studentId,
        studentDocId: d.id,
      });
    })
  );
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
