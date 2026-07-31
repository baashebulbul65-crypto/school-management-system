// firebase/notifications.js
// Ogeysiisyada (Notifications) — Firestore collection "notifications". Waxaa
// wadaaga Shaqaalaha (schoolCode-wide) iyo Waalidiinta (studentId IN childrenIds),
// isla qaabka messages.js (readByStaff/readByParent gaar ah, ma jiro userId
// oo la xalliyay marka la abuurayo, si looga fogaado query cusub oo aan
// horey loo tijaabin ee users.childrenIds array-contains ah).

import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'notifications';

function sortByCreatedAtDesc(docs) {
  return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Waxaa isticmaala dhinaca Shaqaalaha — dhammaan ogeysiisyada dugsiga hal listener ah.
export function subscribeToAllNotifications(schoolCode, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  return onSnapshot(
    q,
    (snap) => onChange(sortByCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    onError
  );
}

// Waxaa isticmaala ParentPortal — ogeysiisyada dhammaan ilmaha waalidku leeyahay
// (childrenIds). Firestore 'in' query waxay taageertaa ilaa 30 qiime.
export function subscribeToNotificationsForChildren(schoolCode, studentIds, onChange, onError) {
  if (!studentIds || studentIds.length === 0) {
    onChange([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTION),
    where('schoolCode', '==', schoolCode),
    where('studentId', 'in', studentIds)
  );
  return onSnapshot(
    q,
    (snap) => onChange(sortByCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))),
    onError
  );
}

// Hal alert oo maalinlaha ah arday kasta — deterministic id si aan loo koobin
// haddii arday isla maalintaas laba jeer loo calaamadiyo "Maqan". Qoraalka la
// tuso (message) laguma kaydiyo doc-ka — waxaa loo dhisaa marka la soo bandhigo
// (studentName/className), si luuqadda (so/ar) ay noqoto tan isticmaaluhu hadda
// dooranayo, ee aysan ku xayirneyn luuqaddii shaqaaluhu ku sameeyay ogeysiiska.
export async function createAbsentNotification({ schoolCode, studentId, studentName, className, date }) {
  await setDoc(doc(db, COLLECTION, `absent_${date}_${studentId}`), {
    schoolCode, studentId, studentName, className, date,
    type: 'absent',
    createdAt: new Date().toISOString(),
    readByStaff: false,
    readByParent: false,
  });
}

// Hal ogeysiis oo firfircoon arday kasta — cusboonaysiin marka baaqiga
// dib loo eego (setDoc waxay dib u dejinaysaa xaaladda la akhriyay).
export async function createFeeNotification({ schoolCode, studentId, studentName, className }) {
  await setDoc(doc(db, COLLECTION, `fee_${studentId}`), {
    schoolCode, studentId, studentName, className,
    type: 'fee',
    createdAt: new Date().toISOString(),
    readByStaff: false,
    readByParent: false,
  });
}

export async function markNotificationsRead(notificationIds, readerRole) {
  if (!notificationIds || notificationIds.length === 0) return;
  const field = readerRole === 'parent' ? 'readByParent' : 'readByStaff';
  await Promise.all(notificationIds.map((id) => updateDoc(doc(db, COLLECTION, id), { [field]: true })));
}

export async function deleteNotificationDoc(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}
