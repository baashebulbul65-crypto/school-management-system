// firebase/finance.js
// Xisaabaadka dugsiga: kharashaadka, dakhliga, safafka lacagta fasalka
// (qeexid kaliya — balance-ku KUMA kaydsana halkan), iyo "feePayments" oo ah
// diiwaan (ledger) bixin kasta oo la ururiyay. Balance-ka safka waxaa laga
// soo xisaabiyaa (derive) isu geynta feePayments-ka la xiriira row-gaas,
// ma aha counter la is dhimo — fiiri SchoolDataContext.jsx.

import { collection, doc, addDoc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const EXPENSES_COLLECTION = 'financeExpenses';
const INCOME_COLLECTION = 'financeIncome';
const CLASS_FEES_COLLECTION = 'classFees';
const FEE_PAYMENTS_COLLECTION = 'feePayments';
const SALARIES_COLLECTION = 'financeSalaries';
const DISCOUNTS_COLLECTION = 'financeDiscounts';
const DOCUMENTS_COLLECTION = 'financeDocuments';

function subscribeToCollection(collectionName, schoolCode, onChange, onError) {
  const q = query(collection(db, collectionName), where('schoolCode', '==', schoolCode));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

// ===== Kharashaadka =====
export function subscribeToExpenses(schoolCode, onChange, onError) {
  return subscribeToCollection(EXPENSES_COLLECTION, schoolCode, onChange, onError);
}
export async function createExpenseDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

// ===== Dakhliga =====
export function subscribeToIncome(schoolCode, onChange, onError) {
  return subscribeToCollection(INCOME_COLLECTION, schoolCode, onChange, onError);
}
export async function createIncomeDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, INCOME_COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

// ===== Safafka Lacagta - Fasalka (qeexid, ma aha balance) =====
export function subscribeToClassFees(schoolCode, onChange, onError) {
  return subscribeToCollection(CLASS_FEES_COLLECTION, schoolCode, onChange, onError);
}
export async function createClassFeeRowDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, CLASS_FEES_COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

// ===== Bixinada (feePayments) — diiwaan (ledger), ma aha la beddeli karo
// (append-only, fiiri firestore.rules) =====
export function subscribeToFeePayments(schoolCode, onChange, onError) {
  return subscribeToCollection(FEE_PAYMENTS_COLLECTION, schoolCode, onChange, onError);
}
// Waxaa isticmaala ParentPortal — taariikhda bixinnada arday-gaarka ah ee
// ilmaha la doortay (isla qaabka subscribeToStudentAttendanceHistory).
export function subscribeToStudentFeePayments(schoolCode, studentId, onChange, onError) {
  const q = query(
    collection(db, FEE_PAYMENTS_COLLECTION),
    where('schoolCode', '==', schoolCode),
    where('feeType', '==', 'student'),
    where('studentId', '==', studentId)
  );
  return onSnapshot(
    q,
    (snap) => {
      const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      records.sort((a, b) => b.month.localeCompare(a.month));
      onChange(records);
    },
    onError
  );
}

export async function createFeePaymentDoc(data) {
  const docRef = await addDoc(collection(db, FEE_PAYMENTS_COLLECTION), { ...data, createdAt: new Date().toISOString() });
  return docRef.id;
}

// ===== Mushaharka Shaqaalaha (financeSalaries) — diiwaan (ledger), isla
// habka feePayments: waxaa la abuuraa KALIYA marka la bixiyo, marnaba lama
// beddelo (append-only, fiiri firestore.rules) — xaaladda "Sugaya" ma aha
// doc, waa la XISAABIYAA (fiiri utils/staffSalary.js: getMonthlySalaryStatus).
export function subscribeToSalaries(schoolCode, onChange, onError) {
  return subscribeToCollection(SALARIES_COLLECTION, schoolCode, onChange, onError);
}
export async function createSalaryDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, SALARIES_COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

// ===== Dhimista/Deeqaha Waxbarasho (financeDiscounts) — diiwaan, append-only =====
export function subscribeToDiscounts(schoolCode, onChange, onError) {
  return subscribeToCollection(DISCOUNTS_COLLECTION, schoolCode, onChange, onError);
}
export async function createDiscountDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, DISCOUNTS_COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

// ===== Invoices/Receipts (financeDocuments) — diiwaan, append-only =====
export function subscribeToDocuments(schoolCode, onChange, onError) {
  return subscribeToCollection(DOCUMENTS_COLLECTION, schoolCode, onChange, onError);
}
export async function createDocumentDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), { ...data, schoolCode });
  return docRef.id;
}
