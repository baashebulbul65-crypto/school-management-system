// firebase/staffRoster.js
// Liiska shaqaalaha aan macallimiinta ahayn (Maamule, Xisaabiye, Ilaaliye, iwm)
// ee loo isticmaalo bogga Attendance ee tabka "Staff" — GOONI AH, kama socoto
// akoonada gelitaanka (fiiri firebase/staff.js), maadaama qaar ka mid ah
// shaqaalahani aanay lahayn (u baahnayn) akoon gelitaan ah.

import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'staffRoster';

export function subscribeToStaffRoster(schoolCode, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function createStaffRosterDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

export async function updateStaffRosterDoc(id, data) {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function deleteStaffRosterDoc(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}
