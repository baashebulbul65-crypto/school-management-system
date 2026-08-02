// firebase/quranTargets.js
// Yoolka Quraanka (Quran Target) — collection "quranTargets", GOONI AH oo aan lala
// darin "quranProgress" (maadaama tani tahay yool muddo-dheer ah, ee kale maalinle).
// Doc kasta wuxuu matalaa hal jeer oo yool la dejiyay — arday kastaa wuxuu yeelan
// karaa dhowr doc oo taariikheed, laakiin kaliya ta ugu dambeysay (createdAt) ayaa
// "firfircoon" loo tixgeliyaa.

import { collection, doc, addDoc, updateDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'quranTargets';

// "classTeacherId" (Teacher Firestore Hardening, 2026-08-02): haddii la
// gudbiyo (macallin), query-ga waxaa lagu daraa 'classTeacherId' si Firestore
// Rules-ku ay u ogolaadaan KALIYA yoolalka fasalka macallinkan — haddii kale
// (owner/null) query-gu waa schoolCode-wide sida hore. Fiiri firestore.rules:
// quranTargets.
export function subscribeToQuranTargets(schoolCode, classTeacherId, onChange, onError) {
  const constraints = [where('schoolCode', '==', schoolCode)];
  if (classTeacherId) constraints.push(where('classTeacherId', '==', classTeacherId));
  const q = query(collection(db, COLLECTION), ...constraints);
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

// Hal mar loo isticmaalo (Teacher Firestore Hardening, 2026-08-02) — u
// buuxisa 'classTeacherId' yoolashii hore loo abuuray ka hor intaan
// field-kaas cusub la darin, iyada oo ka soo qaadaysa xiriirka
// classId -> classTeacherId (fiiri SchoolDataContext.jsx). Yoolasha horeba
// leh field-ka (xitaa null) waa la boodaa — ma dib-u-qorin.
export async function backfillQuranTargetsClassScoping(schoolCode, classIdToTeacherId) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  const snap = await getDocs(q);
  await Promise.all(
    snap.docs.map((d) => {
      const data = d.data();
      if (data.classTeacherId !== undefined) return null;
      return updateDoc(doc(db, COLLECTION, d.id), { classTeacherId: classIdToTeacherId.get(data.classId) || null });
    })
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
