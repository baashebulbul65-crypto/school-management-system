// utils/staffSalary.js
// Xisaabinta mushaharka shaqaalaha (macallimiin + shaqaale kale) — isla habka
// utils/studentFee.js (feePayments/getMonthlyFeeStatus), si Finance.jsx iyo
// TeacherProfileModal.jsx ay isla xisaab u dhigin.

// Liiska "payroll" otomaatig ah — waxaa laga soo ururiyaa laba il: teachers
// (macallimiinta, salaryAmount-kooda wuxuu ku jiraa doc-ka teachers) iyo users
// (shaqaalaha kale ee aan macallin ahayn, salaryAmount-kooda wuxuu ku jiraa
// doc-ka users). Kaliya kuwa salaryAmount la buuxiyay (> 0) ayaa ku jira — isla
// sida ardayda "Bilaash" (feeAmount 0) aan ku jirin liiska bixinta.
export function buildPayrollList(teachers, staffUsers) {
  const teacherRows = (teachers || [])
    .filter((t) => t.status !== 'inactive' && (Number(t.salaryAmount) || 0) > 0)
    .map((t) => ({
      personId: t.id,
      personType: 'teacher',
      teacherId: t.id,
      staffName: t.fullName,
      role: t.subject ? `${'Macallin'} - ${t.subject}` : 'Macallin',
      amount: Number(t.salaryAmount) || 0,
    }));
  const staffRows = (staffUsers || [])
    .filter((u) => u.title !== 'Teacher' && (u.status || 'active') === 'active' && (Number(u.salaryAmount) || 0) > 0)
    .map((u) => ({
      personId: u.id,
      personType: 'staff',
      teacherId: null,
      staffName: u.fullName,
      role: u.title,
      amount: Number(u.salaryAmount) || 0,
    }));
  return [...teacherRows, ...staffRows];
}

// Xaaladda mushaharka BISHAAN — 'paid' (waxaa jira diiwaan financeSalaries oo
// bishaas ah), 'pending' (Sugaya, ma jiro diiwaan bishaas ah weli).
export function getMonthlySalaryStatus(personId, salaryRecords, month) {
  const isPaid = salaryRecords.some((s) => s.personId === personId && s.month === month);
  return isPaid ? 'paid' : 'pending';
}
