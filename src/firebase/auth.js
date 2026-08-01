// firebase/auth.js
// Dhammaan shaqooyinka la xiriira authentication-ka: Shaqaale iyo Arday/Waalid

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore';
import { auth, db } from './config';
import { findStudentByStudentId } from './students';

/* ============================================================
   SHAQAALE LOGIN  (Maamule / Macallin) — G-Mail + Password
   ============================================================ */
export async function loginStaff(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const profile = await getUserProfile(result.user.uid);
  // Xayiraad UI-ga oo kaliya — ma aha xad-dhaaf (security boundary) dhab ah,
  // xogta dhabta ah ee isticmaaluhu heli karo waxaa go'aamiya Firestore Rules
  // (fiiri firebase/staff.js: removeStaffDoc). Halkan waxaa loogu talagalay
  // in mar hore loo sheego shaqaale la joojiyay wax uusan la moodin inuu
  // gali karo.
  if (profile?.status === 'suspended') {
    await signOut(auth);
    throw new Error('ACCOUNT_LA_JOOJIYAY');
  }
  return { user: result.user, profile };
}

export async function registerStaff({ email, password, fullName, schoolCode, role = 'owner', title = 'School Owner' }) {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(doc(db, 'users', result.user.uid), {
    uid: result.user.uid,
    fullName,
    email,
    schoolCode,
    role, // 'owner' | 'teacher' — (owner wuxuu matalaa School Owner/Principal/VP/Accountant/Receptionist)
    title, // magaca la muujiyo bogga "Users" (fiiri firebase/staff.js)
    accountType: 'staff',
    status: 'active',
    createdAt: serverTimestamp(),
  });

  return result.user;
}

export async function resetStaffPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

// Beddelidda password-ka (Settings > Akoonkayga) — waa in marka hore la
// xaqiijiyaa password-ka HORE (reauthenticate), sababo:
//   1) Firebase wuxuu xayiraa updatePassword haddii session-ku aanu
//      "dhawaan" ahayn (auth/requires-recent-login).
//   2) Waa habka ugu sax-badan si loo hubiyo in qofka beddelayaa password
//      uu dhab ahaantii yaqaano kan hore, ma aha in uu kaliya session
//      furan yahay (tusaale: laptop la iloobay oo furan).
export async function changeStaffPassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error('LAMA_HELIN_USER');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
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
  const cleanSchoolCode = schoolCode.trim();
  const cleanDiiwaanId = diiwaanId.trim();
  const pseudoEmail = buildStudentPseudoEmail(cleanSchoolCode, cleanDiiwaanId);
  const result = await createUserWithEmailAndPassword(auth, pseudoEmail, password);

  // Profile-ka waa in la sameeyaa KA HOR raadinta ardayga — Firestore Rules
  // waxay u baahan yihiin in users/{uid} doc-ku horeba jiro si loo xaqiijiyo
  // in isticmaaluhu isla dugsiga (schoolCode) yahay ka hor inta uu wax akhrin.
  await setDoc(doc(db, 'users', result.user.uid), {
    uid: result.user.uid,
    fullName,
    schoolCode: cleanSchoolCode,
    diiwaanId: cleanDiiwaanId,
    role, // 'arday' | 'waalid'
    accountType: 'student-parent',
    childrenIds: [],
    createdAt: serverTimestamp(),
  });

  // Xiriirinta ilmaha 1aad: Diiwaan ID-ga la geliyay waxaa lagu barbardhigaa
  // studentId-ga dhabta ah ee dugsigan — haddii la helo, waa lagu xiraa.
  const matchedStudent = await findStudentByStudentId(cleanSchoolCode, cleanDiiwaanId);
  if (matchedStudent) {
    await updateDoc(doc(db, 'users', result.user.uid), { childrenIds: [matchedStudent.id] });
  }

  return { user: result.user, childFound: !!matchedStudent };
}

// "Ku Dar Ilmo Kale" — ParentPortal marka waalidku rabo inuu ku daro ilmo labaad
// (ama saddexaad, iwm) akoonkiisa horeba u jiray.
export async function addChildToParent(uid, schoolCode, diiwaanId) {
  const matchedStudent = await findStudentByStudentId(schoolCode.trim(), diiwaanId.trim());
  if (!matchedStudent) {
    throw new Error('ARDAY_LAMA_HELIN');
  }
  await updateDoc(doc(db, 'users', uid), {
    childrenIds: arrayUnion(matchedStudent.id),
  });
  return matchedStudent;
}

/* ============================================================
   PROFILE LOOKUP + SESSION HELPERS
   ============================================================ */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

// Isla "users/{uid}" laakiin real-time (onSnapshot) — waxaa isticmaala
// AuthContext.jsx, si haddii owner-ku beddelo doorka/teacherDocId-ga
// shaqaale INTUU horeba login yahay, isbeddelku isla markiiba ugu muuqdo
// (ma aha in uu u baahdo dib-u-gelin/refresh, sida hore ee getUserProfile
// hal-mar ah lagu isticmaali jiray halkan).
export function subscribeToUserProfile(uid, onChange, onError) {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => onChange(snap.exists() ? snap.data() : null),
    onError
  );
}

// Doc-ka dugsiga (magaca, logo-ga, fees, iwm) — fiiri firebase/schools.js.

export function logout() {
  return signOut(auth);
}

export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, callback);
}