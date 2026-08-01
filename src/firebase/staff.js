// firebase/staff.js
// Maamulka akoonada shaqaalaha (bogga "Users") — xogtoodu waxay ku jirtaa
// collection-ka "users" (isla mid ah profile-ka isticmaale kasta, fiiri
// auth.js), la xaddiday accountType == 'staff'.
//
// createStaffAccount waxay isticmaashaa APP LABAAD oo GOONI AH (fiiri
// firebase/config.js -> getSecondaryAuth) si "createUserWithEmailAndPassword"
// uusan u beddelin session-ka owner-ka hadda login ah — xaddidaad la yaqaan
// oo Firebase Auth SDK-ka browser-ka ah leeyahay.

import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { db, getSecondaryAuth } from './config';

const COLLECTION = 'users';

export function subscribeToStaff(schoolCode, onChange, onError) {
  const q = query(
    collection(db, COLLECTION),
    where('schoolCode', '==', schoolCode),
    where('accountType', '==', 'staff')
  );
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function createStaffAccount({ schoolCode, fullName, email, password, role, title, teacherDocId }) {
  const secondaryAuth = getSecondaryAuth();
  const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  await signOut(secondaryAuth);

  // Qorista doc-ka waxaa lagu sameeyaa 'db' (app-ka koowaad) — waxaa loo
  // fasiraa (authorize) sida owner-ka session-kiisa hadda socda, ma aha
  // sida account-ka cusub (fiiri firestore.rules: users/{userId} create).
  await setDoc(doc(db, COLLECTION, result.user.uid), {
    uid: result.user.uid,
    fullName,
    email,
    schoolCode,
    role, // 'owner' | 'teacher' — fiiri auth.js registerStaff
    title, // magaca la muujiyo (School Owner, Principal, iwm) — cosmetic
    // Xiriirinta diiwaanka macallinka (collection "teachers") — ikhtiyaari,
    // waxaa loo isticmaalaa Sidebar.jsx/Messages.jsx si loo ogaado fasallada
    // macallinkan (fiiri classes.classTeacherId), iyada oo aan lala xiriirin
    // isbarbardhig magac (fiiri commit-kii hore ee ka saaray isbarbardhigga).
    teacherDocId: teacherDocId || null,
    accountType: 'staff',
    status: 'active',
    createdAt: serverTimestamp(),
  });

  return result.user.uid;
}

export async function updateStaffDoc(uid, data) {
  await updateDoc(doc(db, COLLECTION, uid), data);
}

export async function setStaffStatus(uid, status) {
  await updateDoc(doc(db, COLLECTION, uid), { status });
}

// Ma tirtiro account-ka Firebase Auth (SDK-ga browser-ku uma oggola in la
// tirtiro account qof kale — waxaa loo baahan yahay Admin SDK/backend). Waxay
// tirtiraa doc-ka Firestore, taasoo dhab ahaantii xannibaysa gelitaanka oo
// dhan, maadaama rules-ka OO DHAN ku tiirsan yihiin 'me()' (fiiri
// firestore.rules) — doc la'aan, isticmaaluhu waxba kama akhrin/qori karo.
export async function removeStaffDoc(uid) {
  await deleteDoc(doc(db, COLLECTION, uid));
}
