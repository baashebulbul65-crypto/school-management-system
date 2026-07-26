// firebase/auth.js
// Dhammaan shaqooyinka la xiriira authentication-ka: Shaqaale iyo Arday/Waalid

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './config';

/* ============================================================
   SHAQAALE LOGIN  (Maamule / Macallin) — G-Mail + Password
   ============================================================ */
export async function loginStaff(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(result.user.uid);
  return { user: result.user, profile };
}

export async function registerStaff({ email, password, fullName, schoolCode, role = 'owner' }) {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, 'users', result.user.uid), {
    uid: result.user.uid,
    fullName,
    email,
    schoolCode,
    role, // 'owner' | 'teacher' — (owner wuxuu matalaa School Owner/Principal/VP/Accountant/Receptionist)
    accountType: 'staff',
    createdAt: serverTimestamp(),
  });

  return result.user;
}

export async function resetStaffPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

/* ============================================================
   ARDAY / WAALID LOGIN — School Code + Diiwaan ID + Password
   Firebase Auth waxay u baahan tahay email, sidaas darteed
   waxaan dhisaynaa "pseudo-email" ka kooban School Code + ID.
   ============================================================ */
function buildStudentPseudoEmail(schoolCode, diiwaanId) {
  const clean = (str) => str.trim().toLowerCase().replace(/\s+/g, '');
  return `${clean(schoolCode)}-${clean(diiwaanId)}@xarun-students.app`;
}

export async function loginStudentOrParent({ schoolCode, diiwaanId, password, role }) {
  // role: 'arday' | 'waalid'
  const pseudoEmail = buildStudentPseudoEmail(schoolCode, diiwaanId);
  const result = await signInWithEmailAndPassword(auth, pseudoEmail, password);
  const profile = await getUserProfile(result.user.uid);

  if (profile?.role !== role) {
    throw new Error('NOOCA_AKOONKA_KHALDAN'); // role mismatch guard
  }
  return { user: result.user, profile };
}

export async function registerStudentOrParent({
  schoolCode,
  diiwaanId,
  password,
  role, // 'arday' | 'waalid'
  fullName,
}) {
  const pseudoEmail = buildStudentPseudoEmail(schoolCode, diiwaanId);
  const result = await createUserWithEmailAndPassword(auth, pseudoEmail, password);

  await setDoc(doc(db, 'users', result.user.uid), {
    uid: result.user.uid,
    fullName,
    schoolCode: schoolCode.trim(),
    diiwaanId: diiwaanId.trim(),
    role, // 'arday' | 'waalid'
    accountType: 'student-parent',
    createdAt: serverTimestamp(),
  });

  return result.user;
}

/* ============================================================
   PROFILE LOOKUP + SESSION HELPERS
   ============================================================ */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function findSchoolByCode(schoolCode) {
  const q = query(collection(db, 'schools'), where('schoolCode', '==', schoolCode.trim()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export function logout() {
  return signOut(auth);
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}