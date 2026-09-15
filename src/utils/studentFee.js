// utils/studentFee.js
// Xisaabinta fee-ga ardayga — la wadaago StudentFormModal, Finance.jsx, iyo
// ClassDetailModal.jsx, si aan halka kasta xisaab u dhigin.

// getFeeType: doc-yada ardayda ee laga sameeyay ka hor inta "feeType" aan la
// darin (fiiri commit-kii hore) waxay leeyihiin feeAmount kaliya — 0 macnaheedu
// wuxuu ahaa "Bilaash". Sidaas darteed marka feeType maqan yahay waxaan ka
// soo qaadanaa qiimahaas hore, si aan loo baahnayn in xogta hore la beddelo
// (backfill) Firestore.
//
// "Ghost state" guard (2026-09-15, user-reported): arday feeType='fixed'
// (ama 'discount') leh laakiin feeAmount=0/maan — sababtu badanaa waa
// Settings > Qiimaha (fasalka feeAmount-kiisu 0 noqday, fiiri Settings.jsx:
// handleFeeChange, oo la saxay si aan mar dambe u dhicin) ama arday si
// gaar ah loo dib-u-eegay oo qiimaha laga tirtiray. Natiijadu waxay ahayd
// "ghost state": Students.jsx/StudentProfileModal/Finance.jsx waxay ardayga
// u muujin jireen 'unpaid' (baaqi/culaysyahay), laakiin studentFeeOwed()
// wuxuu soo celin jiray $0 — ardaygu "ma dhex-maro" xaaladdii la-bixiyay
// iyo mid aan la bixin toona. Haddii base-fee-gu (feeAmount) 0/hoos yahay
// ee feeType aanu 'free' ahayn si toos ah, halkan waxaa lagu la dhaqmayaa
// sidii 'free' — sax ahaan waa la mid, maadaama $0 lacag la rabo aysan ka
// duwanayn 'Bilaash'.
export function getFeeType(student) {
  const feeType = student?.feeType || ((Number(student?.feeAmount) || 0) === 0 ? 'free' : 'fixed');
  if (feeType !== 'free' && (Number(student?.feeAmount) || 0) <= 0) return 'free';
  return feeType;
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
