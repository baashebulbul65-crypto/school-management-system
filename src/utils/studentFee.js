// utils/studentFee.js
// Xisaabinta fee-ga ardayga — la wadaago StudentFormModal, Finance.jsx, iyo
// ClassDetailModal.jsx, si aan halka kasta xisaab u dhigin.

// getFeeType: doc-yada ardayda ee laga sameeyay ka hor inta "feeType" aan la
// darin (fiiri commit-kii hore) waxay leeyihiin feeAmount kaliya — 0 macnaheedu
// wuxuu ahaa "Bilaash". Sidaas darteed marka feeType maqan yahay waxaan ka
// soo qaadanaa qiimahaas hore, si aan loo baahnayn in xogta hore la beddelo
// (backfill) Firestore.
export function getFeeType(student) {
  if (student?.feeType) return student.feeType;
  return (Number(student?.feeAmount) || 0) === 0 ? 'free' : 'fixed';
}

// Lacagta ardaygu bishii uu ku leeyahay (fiiri feePayments) — 'free' waa $0,
// 'discount' waa feeAmount-ka la dhimay boqolkiiba discountPercent, 'fixed'
// waa feeAmount-ka caadiga ah.
export function studentFeeOwed(student) {
  const feeType = getFeeType(student);
  const base = Number(student?.feeAmount) || 0;
  if (feeType === 'free') return 0;
  if (feeType === 'discount') {
    const pct = Math.min(100, Math.max(0, Number(student?.discountPercent) || 0));
    return Math.max(0, base * (1 - pct / 100));
  }
  return base;
}

// Xaaladda ardayga ee BISHAAN — 'free' (Bilaash), 'paid' (La Bixiyay, waxaa
// jira feePayment diiwan ah oo bishaas ah), 'unpaid' (Ma Bixin, ma jiro
// feePayment bishaas ah weli). La wadaago Students.jsx, Overview.jsx,
// NotificationsContext.jsx, iyo ParentPortal.jsx, si meel kastaa isla xisaab
// isu isticmaasho — halkii mid kastaa uu gooni u dhisan lahaa xisaabtiisa.
export function getMonthlyFeeStatus(student, feePayments, month) {
  const feeType = getFeeType(student);
  if (feeType === 'free') return 'free';
  const isPaid = feePayments.some((p) => p.feeType === 'student' && p.studentId === student.id && p.month === month);
  return isPaid ? 'paid' : 'unpaid';
}
