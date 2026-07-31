// firebase/messages.js
// Fariimaha u dhexeeya Waalidka iyo Shaqaalaha (Macallin/Admin) — collection "messages".
// Hal "thread" ayaa loo sameeyaa arday kasta (studentId), waxaana wadaaga waalidka
// iyo dhammaan shaqaalaha dugsiga — ma aha thread hal-shaqaale ah, maadaama xogta
// hadda jirta aan si taxaddar leh loogu xirin macallin gaar ah (classTeacher waa
// qoraal magac ah, ma aha uid, marka la isku halayn karo si sax ah).

import { collection, addDoc, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'messages';

// Waxaa isticmaala ParentPortal — fariimaha hal arday oo kaliya (thread-ka ilmahaas).
export function subscribeToThread(schoolCode, studentId, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode), where('studentId', '==', studentId));
  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      onChange(msgs);
    },
    onError
  );
}

// Waxaa isticmaala dhinaca Shaqaalaha — dhammaan fariimaha dugsiga hal listener ah,
// waxaana loo qaybiyaa "threads" (hal arday = hal thread) gudaha Messages.jsx/Sidebar.
export function subscribeToAllThreads(schoolCode, onChange, onError) {
  const q = query(collection(db, COLLECTION), where('schoolCode', '==', schoolCode));
  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      onChange(msgs);
    },
    onError
  );
}

export async function sendMessage({ schoolCode, studentId, studentName, className, parentId, senderRole, senderId, senderName, text }) {
  await addDoc(collection(db, COLLECTION), {
    schoolCode,
    studentId,
    studentName,
    className,
    parentId: parentId || null,
    senderRole,
    senderId,
    senderName,
    text,
    createdAt: new Date().toISOString(),
    readByParent: senderRole === 'parent',
    readByStaff: senderRole === 'staff',
  });
}

// Waxaa loo isticmaalaa marka thread la furo — calaamadinta fariimaha aan la akhrin.
export async function markMessagesRead(messageIds, readerRole) {
  if (!messageIds || messageIds.length === 0) return;
  const field = readerRole === 'parent' ? 'readByParent' : 'readByStaff';
  await Promise.all(messageIds.map((id) => updateDoc(doc(db, COLLECTION, id), { [field]: true })));
}
