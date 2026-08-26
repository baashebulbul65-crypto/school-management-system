// firebase/notifications.js
// Ogeysiisyada (Notifications) — Firestore collection "notifications". Waxaa
// wadaaga Shaqaalaha (schoolCode-wide) iyo Waalidiinta (studentId IN childrenIds),
// isla qaabka messages.js (readByStaff/readByParent gaar ah, ma jiro userId
// oo la xalliyay marka la abuurayo, si looga fogaado query cusub oo aan
// horey loo tijaabin ee users.childrenIds array-contains ah).

import { collection, doc, setDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'notifications';

function sortByCreatedAtDesc(docs) {
  return docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Waxaa isticmaala dhinaca Shaqaalaha — dhammaan ogeysiisyada dugsiga hal
// listener ah (owner). "classTeacherId" (Teacher Firestore Hardening,
// 2026-08-02) — haddii la gudbiyo (macallin), query-gu wuxuu si toos ah u
// xaddidaa type=='absent' + classTeacherId-diisa kaliya, maadaama
// firestore.rules-ku hadda xannibayo macallin uga akhriyo ogeysiisyo 'fee' ah
// ama kuwa fasallada kale (query-ga oo isku darsan schoolCode-wide oo aan
// xaddidnayn ayaa Firestore ku diidi lahaa oo dhan, ma aha qayb kaliya, fiiri
// firestore.rules: notifications).
export function subscribeToAllNotifications(schoolCode, classTeacherId, onChange, onError) {
  const constraints = [where('schoolCode', '==', schoolCode)];
  if (classTeacherId) constraints.push(where('type', '==', 'absent'), where('classTeacherId', '==', classTeacherId));
  const q = query(collection(db, COLLECTION), ...constraints);
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
export async function createAbsentNotification({ schoolCode, studentId, studentName, className, classTeacherId, date }) {
  await setDoc(doc(db, COLLECTION, `absent_${date}_${studentId}`), {
    schoolCode, studentId, studentName, className, classTeacherId: classTeacherId || null, date,
    type: 'absent',
    createdAt: new Date().toISOString(),
    readByStaff: false,
    readByParent: false,
  });
}

// Hal ogeysiis BIL-GAAR AH arday kasta (doc id: "fee_{studentId}_{month}") —
// bishii cusub marka ay bilaabato waxaa si otomaatig ah u samaysma ogeysiis
// cusub oo aan la akhrin, iyada oo aan la taaban ogeysiiskii bishii hore
// (kaas oo u hadhaya taariikh/history). Waxaa loo yeeraa NotificationsContext
// KELIYA haddii ogeysiin la mid ah aanu horeba u jirin (fiiri hubinta
// rawNotifications), si aan mar walba dib loogu celin "aan la akhrin".
export async function createFeeNotification({ schoolCode, studentId, studentName, className, month }) {
  await setDoc(doc(db, COLLECTION, `fee_${studentId}_${month}`), {
    schoolCode, studentId, studentName, className, month,
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

// "Tirtir" ogeysiiska nooca 'fee' (Notifications audit MEDIUM, 2026-08-26) —
// SOFT-dismiss, ma aha hard-delete: doc-ku wuu sii jiraa (dismissedByStaff:
// true) si effect-ka xasuusinta lacagta (NotificationsContext.jsx) uusan
// dib u abuurin isla ogeysiiska maadaama ardaygu weli yahay 'unpaid' —
// hard-delete wuu u dhaqmi lahaa sida mid aan waxba samaynayn (dib buu u
// soo noqon lahaa isla mar). Bishii xigta, doc ID cusub (fee_{id}_{month})
// ayaa la abuuraa, sidaas darteed dismiss-kan bishaas hore kuma xannibayo.
export async function dismissFeeNotification(id) {
  await updateDoc(doc(db, COLLECTION, id), { dismissedByStaff: true });
}

// Hal mar loo isticmaalo (Teacher Firestore Hardening, 2026-08-02) — u
// buuxisa 'classTeacherId' ogeysiisyada 'absent' ee hore loo abuuray ka hor
// intaan field-kaas cusub la darin (fiiri backfillAttendanceClassScoping,
// firebase/attendance.js — isla mabda'a). Ogeysiisyada 'fee' uma baahna
// classTeacherId (owner-kaliya ayaa akhriyaya, fiiri firestore.rules).
export async function backfillNotificationClassScoping(schoolCode, classNameToTeacherId) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode), where('type', '==', 'absent'));
  const snap = await getDocs(q);
  await Promise.all(
    snap.docs.map((d) => {
      const data = d.data();
      if (data.classTeacherId !== undefined) return null;
      return updateDoc(doc(db, COLLECTION, d.id), { classTeacherId: classNameToTeacherId.get(data.className) || null });
    })
  );
}
