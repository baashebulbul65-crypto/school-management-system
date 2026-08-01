// firebase/exams.js
// CRUD ee collection-ka "exams" ee Firestore (qeexidda imtixaanka — fiiri
// examMarks.js oo kaydiya buundada ardaygu ku qaatay imtixaankan).

import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'exams';

export function subscribeToExams(schoolCode, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function createExamDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

export async function updateExamDoc(examId, data) {
  await updateDoc(doc(db, COLLECTION, examId), data);
}

export async function deleteExamDoc(examId) {
  await deleteDoc(doc(db, COLLECTION, examId));
}

// Waxaa isticmaala ParentPortal — imtixaannada fasalka ilmaha la doortay
// KALIYA (classId), ma aha dhammaan imtixaanada dugsiga (kaas oo staff-only
// ah, fiiri SchoolDataContext.jsx). Query gaar ah ayaa loo baahan yahay si
// Firestore Rules-ku ugu ogolaadaan waalidka inuu akhriyo kaliya fasalka
// ilmihiisa (fiiri firestore.rules).
export function subscribeToClassExamsForParent(schoolCode, classId, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode), where('classId', '==', classId));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}
