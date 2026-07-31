// firebase/quranTargets.js
// Yoolka Quraanka (Quran Target) — collection "quranTargets", GOONI AH oo aan lala
// darin "quranProgress" (maadaama tani tahay yool muddo-dheer ah, ee kale maalinle).
// Doc kasta wuxuu matalaa hal jeer oo yool la dejiyay — arday kastaa wuxuu yeelan
// karaa dhowr doc oo taariikheed, laakiin kaliya ta ugu dambeysay (createdAt) ayaa
// "firfircoon" loo tixgeliyaa.

import { collection, doc, addDoc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'quranTargets';

export function subscribeToQuranTargets(schoolCode, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function createQuranTargetDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

export async function updateQuranTargetDoc(targetId, data) {
  await updateDoc(doc(db, COLLECTION, targetId), data);
}

// Yoolalka arday gaar ah — waxaa isticmaala ParentPortal. Query-gan gaar ah
// (studentId filter) ayaa loo baahan yahay si Firestore Security Rules-ku ugu
// ogolaadaan waalidka inuu akhriyo kaliya yoolalka ilmihiisa.
export function subscribeToQuranTargetsForStudent(schoolCode, studentId, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode), where('studentId', '==', studentId));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}
