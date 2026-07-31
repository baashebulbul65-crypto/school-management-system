// firebase/finance.js
// Xisaabaadka dugsiga: kharashaadka, dakhliga, safafka lacagta fasalka/qoyska
// (qeexid kaliya — balance-ku KUMA kaydsana halkan), iyo "feePayments" oo ah
// diiwaan (ledger) bixin kasta oo la ururiyay. Balance-ka safka waxaa laga
// soo xisaabiyaa (derive) isu geynta feePayments-ka la xiriira row-gaas,
// ma aha counter la is dhimo — fiiri SchoolDataContext.jsx.

import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './config';

const EXPENSES_COLLECTION = 'financeExpenses';
const INCOME_COLLECTION = 'financeIncome';
const CLASS_FEES_COLLECTION = 'classFees';
const FAMILY_FEES_COLLECTION = 'familyFees';
const FEE_PAYMENTS_COLLECTION = 'feePayments';

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

// ===== Safafka Lacagta - Qoyska (qeexid, ma aha balance) =====
export function subscribeToFamilyFees(schoolCode, onChange, onError) {
  return subscribeToCollection(FAMILY_FEES_COLLECTION, schoolCode, onChange, onError);
}
export async function createFamilyFeeRowDoc(schoolCode, data) {
  const docRef = await addDoc(collection(db, FAMILY_FEES_COLLECTION), { ...data, schoolCode });
  return docRef.id;
}

// ===== Bixinada (feePayments) — diiwaan (ledger), ma aha la beddeli karo
// (append-only, fiiri firestore.rules) =====
export function subscribeToFeePayments(schoolCode, onChange, onError) {
  return subscribeToCollection(FEE_PAYMENTS_COLLECTION, schoolCode, onChange, onError);
}
export async function createFeePaymentDoc(data) {
  const docRef = await addDoc(collection(db, FEE_PAYMENTS_COLLECTION), { ...data, createdAt: new Date().toISOString() });
  return docRef.id;
}
