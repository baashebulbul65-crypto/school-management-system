import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import { useSchoolData } from '../../context/SchoolDataContext';
import { useSettings } from '../../context/SettingsContext';
import { classroomName } from '../../hooks/useClassOptions';
import { currentMonthValue } from '../../utils/somaliDate';
import { getFeeType, studentFeeOwed } from '../../utils/studentFee';
import FinanceDonutChart from '../../components/dashboard/FinanceDonutChart';
import MonthCalendarPicker from '../../components/dashboard/MonthCalendarPicker';
import FinanceEntryModal from './FinanceEntryModal';
import ClassDetailModal from './ClassDetailModal';
import FeeCategoryListModal from './FeeCategoryListModal';
import '../../styles/dashboard-shared.css';
import './Finance.css';

function Finance() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const {
    classes, students, teachers, feePayments,
    expenses, income, addExpense, addIncome,
    salaries, addSalary, markSalaryPaid,
    discounts, addDiscount,
    financeDocuments, addFinanceDocument,
  } = useSchoolData();
  const [activeTab, setActiveTab] = useState('accounting');

  // ----- Xisaabaadka state -----
  const [monthValue, setMonthValue] = useState(currentMonthValue());
  const [classFilter, setClassFilter] = useState('all');
  const [selectedRowId, setSelectedRowId] = useState(null);

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryType, setEntryType] = useState('expenses');
  const [showFreeModal, setShowFreeModal] = useState(false);

  // Safafka fasalada (Xisaabaadka > Fasalada) waxaa hadda si toos ah looga
  // soo saaraa xogta DHAB AH ee "classes" + "students" + "feePayments" ee
  // bishaas la doortay (monthValue) — ma aha safaf gacan lagu geliyay.
  // Sidaas darteed fasal kasta oo Classes.jsx lagu abuuro wuxuu si otomaatig
  // ah ugu soo muuqdaa halkan, iyo bishii cusub marka ay bilaabato arday
  // kastaa wuxuu dib ugu noqdaa "Aan Bixin" (ma jiro feePayment bishaas ah weli).
  // Ardayda la tirinayo (financeClassRows iyo liiska Bilaash-ka) waa in ay
  // isku mid ahaadaan: KELIYA ardayda className-tiisu ku beegan tahay fasal
  // DHAB AH oo hadda jira (classes collection-ka) — haddii arday leeyahay
  // className aan la mid ahayn fasal jira (fasal la beddelay/la tirtiray),
  // waa in la iska daayaa xisaabinta, si tirada iyo liiska la furo ee
  // "Bilaash" ay had iyo jeer isku mid ahaadaan (mar hore tiradu waxay
  // ahayd 2, laakiin liiska waxaa lagu arkay ilaa 7 arday — sababtoo ah
  // liiska hore wuxuu eegayay STUDENTS OO DHAN, isaga oo aan xaqiijin in
  // className-kooda uu ku beegan yahay fasal dhab ah).
  const validClassNames = useMemo(() => new Set(classes.map((c) => classroomName(c))), [classes]);
  // classId (xiriir dhab ah) waa la doortaa marka jira, si aan loo lumin
  // ardayda marka fasal la beddelo (rename) — className waxaa loo isticmaalaa
  // fallback kaliya ardayda aan weli la dib-u-kaydin dropdown-ka cusub.
  const realClassStudents = useMemo(
    () => students.filter((s) => (s.classId ? classes.some((c) => c.id === s.classId) : validClassNames.has(s.className))),
    [students, classes, validClassNames]
  );

  const financeClassRows = useMemo(() => classes.map((cls) => {
    const name = classroomName(cls);
    const classStudents = realClassStudents.filter((s) => (s.classId ? s.classId === cls.id : s.className === name));
    let paidCount = 0, paidTotal = 0, unpaidCount = 0, unpaidTotal = 0, freeCount = 0, discountTotal = 0;
    classStudents.forEach((s) => {
      const feeType = getFeeType(s);
      if (feeType === 'free') { freeCount += 1; return; }
      const owed = studentFeeOwed(s);
      // Re-audit (2026-08-03, HIGH): "discount" hore waxaa si adag loogu
      // dhigay 0 — kaadhka "Qiimaha Dhimista" (accSummary.dhimis) marnaba
      // ma tarayin xitaa haddii ardayda qaar leeyihiin feeType='discount'
      // dhab ah. Halkan waxaa lagu xisaabinayaa qadarka DHAB AH ee la
      // dhimay (base - owed), ma aha qadarka la rabo ka dib dhimista
      // (studentFeeOwed() ee kore horeba soo celisa tan labaad).
      if (feeType === 'discount') {
        const base = Number(s.feeAmount) || 0;
        discountTotal += Math.max(0, base - owed);
      }
      const isPaid = feePayments.some((p) => p.feeType === 'student' && p.studentId === s.id && p.month === monthValue);
      if (isPaid) { paidCount += 1; paidTotal += owed; } else { unpaidCount += 1; unpaidTotal += owed; }
    });
    return {
      id: cls.id, name,
      students: classStudents.length,
      // "total" waa WADARTA GUUD (gross, ka hor dhimis) — waa in ay noqoto
      // sidaas si ay accSummary.laUururiyey (wadar - dhimis - baaqi) u sii
      // ahaato "waxa dhab ahaan la bixiyay" (paidTotal): paidTotal +
      // unpaidTotal + discountTotal (gross) - discountTotal - unpaidTotal
      // (net) = paidTotal. Haddii "total" la dhigi lahaa net (paidTotal +
      // unpaidTotal oo qura), dhimista dhabta ah waa laga jari lahaa laba
      // jeer (mar horeba ku jirta studentFeeOwed(), mar kale halkan).
      total: paidTotal + unpaidTotal + discountTotal,
      discount: discountTotal,
      balance: unpaidTotal,
      paidCount, paidTotal, unpaidCount, unpaidTotal, freeCount,
    };
  }), [classes, realClassStudents, feePayments, monthValue]);

  // Liiska dhab ah ee ardayda "Bilaash" (dhammaan dugsiga, ma aha kaliya
  // fasalka la doortay) — waxaa laga furaa stat-ka "Bilaash" ee acc-stats-box
  // (fiiri hoos), tiradiisuna waa in ay isku mid ahaato financeClassRows.
  const freeStudentsList = useMemo(
    () => realClassStudents
      .filter((s) => getFeeType(s) === 'free')
      .map((s) => ({ id: s.id, name: s.fullName })),
    [realClassStudents]
  );

  const selectedRow = financeClassRows.find((r) => r.id === selectedRowId) || null;

  const filteredRows = useMemo(() => {
    if (classFilter === 'all') return financeClassRows;
    return financeClassRows.filter((r) => r.name === classFilter);
  }, [financeClassRows, classFilter]);

  const uniqueClassNames = useMemo(() => classes.map((c) => classroomName(c)), [classes]);

  // ----- Xisaabaadka summary (waxaa laga soo xisaabiyay xogta table-ka) -----
  const accSummary = useMemo(() => {
    const wadar = financeClassRows.reduce((s, r) => s + r.total, 0);
    const dhimis = financeClassRows.reduce((s, r) => s + r.discount, 0);
    const baaqi = financeClassRows.reduce((s, r) => s + r.balance, 0);
    const laUururiyey = wadar - dhimis - baaqi;
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    // "Hadhaa" = lacagta la haysto ka dib kharashaadka (la ururiyey - kharash),
    // ma aha "Aan La Ururin" (baaqi) — labadaas waa laba shay oo kala duwan.
    const remaining = laUururiyey - totalExpenses;
    return { wadar, dhimis, baaqi, laUururiyey, totalExpenses, remaining };
  }, [financeClassRows, expenses]);

  const totalStudents = useMemo(() => financeClassRows.reduce((s, r) => s + r.students, 0), [financeClassRows]);

  const extraStats = useMemo(() => {
    // "Bilaash" waa tirada ARDAYDA DHABTA AH ee feeType==='free'.
    const scholarshipCount = financeClassRows.reduce((s, r) => s + r.freeCount, 0);
    // Fiiro (2026-08-03): "L.Bixisa" hore waxay ahayd "feePayments.length"
    // (dhammaan diiwaanka lacag-bixinta ee TAARIIKHDA OO DHAN — bilo hore,
    // noocyo kale) — mid aan la filayn. "L.Bixisa" waa in ay noqoto tirada
    // ardayda AAN BILAASH AHAYN (fee-paying population): wadarta ardayda
    // - tirada bilaashka, iyada oo aan xisaabin haddii ay bishan bixiyeen
    // iyo in kale (tusaale: 40 arday, 5 bilaash → 35 waa L.Bixisa).
    const paymentsCount = financeClassRows.reduce((s, r) => s + r.students, 0) - scholarshipCount;
    return {
      paymentsCount,
      discountRecipients: discounts.filter((d) => d.type === 'discount').length,
      scholarshipCount,
    };
  }, [discounts, financeClassRows]);

  // ----- Kharashka/Dakhliga -----
  const expenseCategories = useMemo(() => {
    const grouped = {};
    expenses.forEach((e) => { grouped[e.category] = (grouped[e.category] || 0) + e.amount; });
    const maxVal = Math.max(...Object.values(grouped), 1);
    return Object.entries(grouped).map(([category, amount]) => ({
      category, amount, percent: Math.round((amount / maxVal) * 100),
    }));
  }, [expenses]);

  const openEntryModal = (type) => { setEntryType(type); setShowEntryModal(true); };

  const handleSaveEntry = (payload, type) => {
    if (type === 'expenses') addExpense(payload);
    else if (type === 'income') addIncome(payload);
    else if (type === 'salary') addSalary(payload);
    else if (type === 'discounts') addDiscount(payload);
    else if (type === 'documents') addFinanceDocument(payload);
  };

  const handlePrint = () => window.print();

  // Finance audit (2026-08-04, buttons-work-as-intended pass): badhanka
  // "Print/PDF" ee saf kasta (tab-ka Invoices & Receipts) hore wuxuu
  // isticmaali jiray isla handlePrint() guud (window.print()) — kaas oo
  // daabici jiray BOGGA OO DHAN (dhammaan safafka), ma ahayn dukumeentigaas
  // gaarka ah ee la gujiyay. Hadda waxaa loo dhisay PDF gaar u ah safkaas
  // kaliya, isla qaabka jsPDF ee Reports.jsx (handleExportPDF) horeba
  // isticmaalo.
  const handlePrintDocument = (d) => {
    const doc = new jsPDF();
    const title = d.type === 'invoice' ? t('finance.documents.invoice') : t('finance.documents.receipt');
    doc.setFontSize(16);
    doc.text(`${settings.school.name || ''} — ${title}`, 14, 18);
    doc.setFontSize(11);
    doc.text(`${t('finance.documents.table.no')}: ${d.no}`, 14, 32);
    doc.text(`${t('finance.documents.table.party')}: ${d.party}`, 14, 40);
    doc.text(`${t('finance.documents.table.amount')}: $${d.amount}`, 14, 48);
    doc.text(`${t('finance.documents.table.date')}: ${d.date || ''}`, 14, 56);
    doc.save(`${d.no}.pdf`);
  };

  const TABS = [
    { id: 'accounting', label: t('finance.tabs.accounting') },
    { id: 'expenses', label: t('finance.tabs.expenses') },
    { id: 'income', label: t('finance.tabs.income') },
    { id: 'salary', label: t('finance.tabs.salary') },
    { id: 'discounts', label: t('finance.tabs.discounts') },
    { id: 'documents', label: t('finance.tabs.documents') },
  ];

  const statusBadge = (status) => {
    if (status === 'paid') return { label: t('common.status.paid'), cls: 'badge-success' };
    if (status === 'pending') return { label: t('common.status.pending'), cls: 'badge-warning' };
    return { label: t('common.status.overdue'), cls: 'badge-danger' };
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('finance.pageTitle')}</h2>
          <p>{t('finance.pageSubtitle')}</p>
        </div>
        <button className="btn-secondary" onClick={handlePrint}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/></svg>
          {t('finance.printExport')}
        </button>
      </div>

      {/* TABS */}
      <div className="fin-tabs">
        {TABS.map((tb) => (
          <button key={tb.id} className={`fin-tab ${activeTab === tb.id ? 'active' : ''}`} onClick={() => setActiveTab(tb.id)}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* ===== XISAABAADKA TAB ===== */}
      {activeTab === 'accounting' && (
        <div>
          <div className="acc-toolbar">
            <MonthCalendarPicker value={monthValue} onChange={setMonthValue} />
          </div>

          {/* SUMMARY CARDS (6) */}
          <div className="acc-summary-row">
            <div className="acc-summary-cards">
              <div className="acc-card">
                <div className="acc-card-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                </div>
                <div>
                  <div className="acc-card-label">{t('finance.summaryCards.total')}</div>
                  <div className="acc-card-value">${accSummary.wadar.toLocaleString()}.00 <span>({totalStudents})</span></div>
                </div>
              </div>
              <div className="acc-card">
                <div className="acc-card-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div>
                  <div className="acc-card-label">{t('finance.summaryCards.collected')}</div>
                  <div className="acc-card-value success">${accSummary.laUururiyey.toLocaleString()}.00</div>
                </div>
              </div>
              <div className="acc-card">
                <div className="acc-card-icon red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </div>
                <div>
                  <div className="acc-card-label">{t('finance.summaryCards.uncollected')}</div>
                  <div className="acc-card-value danger">${accSummary.baaqi.toLocaleString()}.00</div>
                </div>
              </div>
              <div className="acc-card">
                <div className="acc-card-icon teal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41L11 3.83A2 2 0 009.58 3H4a1 1 0 00-1 1v5.58a2 2 0 00.59 1.41l9.58 9.59a2 2 0 002.83 0l5.59-5.59a2 2 0 000-2.83z"/></svg>
                </div>
                <div>
                  <div className="acc-card-label">{t('finance.summaryCards.discountValue')}</div>
                  <div className="acc-card-value">${accSummary.dhimis.toLocaleString()}.00</div>
                </div>
              </div>
              <div className="acc-card">
                <div className="acc-card-icon orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div>
                  <div className="acc-card-label">{t('finance.summaryCards.remaining')}</div>
                  <div className="acc-card-value">{accSummary.remaining < 0 ? '-' : ''}${Math.abs(accSummary.remaining).toLocaleString()}.00</div>
                </div>
              </div>
              <div className="acc-card">
                <div className="acc-card-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </div>
                <div>
                  <div className="acc-card-label">{t('finance.summaryCards.expenses')}</div>
                  <div className="acc-card-value">${accSummary.totalExpenses.toLocaleString()}.00</div>
                </div>
              </div>
            </div>

            {/* SIDE COLUMN: FINANCE DONUT CHART + STATS BOX */}
            <div className="acc-side-col">
              <div className="dash-card acc-chart-card">
                <div className="dash-card-head">
                  <h3>{t('finance.donutChart.title')}</h3>
                </div>
                <FinanceDonutChart
                  paid={accSummary.laUururiyey}
                  due={accSummary.baaqi}
                  discount={accSummary.dhimis}
                  centerValue={`$${accSummary.wadar.toLocaleString()}`}
                  centerLabel={t('finance.donutChart.centerLabel')}
                />
              </div>

              <div className="acc-stats-box">
                <div className="acc-stat"><strong>{financeClassRows.length}</strong><span>{t('finance.statsBox.classes')}</span></div>
                <div className="acc-stat"><strong>{totalStudents}</strong><span>{t('finance.statsBox.totalStudents')}</span></div>
                <div className="acc-stat"><strong>{extraStats.paymentsCount}</strong><span>{t('finance.statsBox.paymentsCount')}</span></div>
                <div className="acc-stat"><strong>{extraStats.discountRecipients}</strong><span>{t('finance.statsBox.discountRecipients')}</span></div>
                <div className="acc-stat acc-stat-clickable" onClick={() => setShowFreeModal(true)}>
                  <strong>{extraStats.scholarshipCount}</strong>
                  <span>{t('finance.statsBox.freeCount')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* FILTER ROW */}
          <div className="acc-filter-row">
            <select className="acc-filter-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
              <option value="all">{t('finance.allClasses')}</option>
              {uniqueClassNames.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* TABLE */}
          <div className="dash-card">
            <div className="data-table-wrap">
              <table className="data-table acc-table">
                <thead>
                  <tr>
                    <th>{t('finance.table.no')}</th>
                    <th>{t('finance.table.class')}</th>
                    <th>{t('finance.table.students')}</th>
                    <th>{t('finance.table.paidStudents')}</th>
                    <th>{t('finance.table.unpaidStudents')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r, i) => (
                    <tr key={r.id} className="acc-row-clickable" onClick={() => setSelectedRowId(r.id)}>
                      <td className="cell-sub">{i + 1}</td>
                      <td>
                        <div className="cell-name">{r.name}</div>
                      </td>
                      <td>{r.students}</td>
                      <td className="cell-amount">{r.paidCount} (${r.paidTotal.toFixed(2)})</td>
                      <td className={`cell-amount ${r.unpaidCount ? 'acc-baaqi-owed' : ''}`}>{r.unpaidCount} (${r.unpaidTotal.toFixed(2)})</td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.noResults')}</td></tr>
                  )}
                </tbody>
                {filteredRows.length > 0 && (
                  <tfoot>
                    <tr className="acc-total-row">
                      <td></td>
                      <td>{t('finance.table.totalRow')} ({filteredRows.length}) {t('finance.table.class')}</td>
                      <td>{filteredRows.reduce((s, r) => s + r.students, 0)}</td>
                      <td className="cell-amount">{filteredRows.reduce((s, r) => s + r.paidCount, 0)} (${filteredRows.reduce((s, r) => s + r.paidTotal, 0).toFixed(2)})</td>
                      <td className="cell-amount">{filteredRows.reduce((s, r) => s + r.unpaidCount, 0)} (${filteredRows.reduce((s, r) => s + r.unpaidTotal, 0).toFixed(2)})</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES TAB */}
      {activeTab === 'expenses' && (
        <div className="dash-card">
          <div className="fin-card-toolbar">
            <button className="btn-primary" onClick={() => openEntryModal('expenses')}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {t('finance.expenses.addNew')}
            </button>
          </div>
          <div className="fin-category-list" style={{ marginBottom: 22 }}>
            {expenseCategories.map((c) => (
              <div className="fin-category-row" key={c.category}>
                <span className="fin-category-name">{c.category}</span>
                <div className="fin-category-bar"><div className="fin-category-fill" style={{ width: `${c.percent}%` }}></div></div>
                <span className="fin-category-amount">${c.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('finance.expenses.table.category')}</th><th>{t('finance.expenses.table.description')}</th><th>{t('finance.expenses.table.amount')}</th><th>{t('finance.expenses.table.date')}</th></tr></thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td><span className="badge badge-neutral">{e.category}</span></td>
                    <td>{e.description}</td>
                    <td className="cell-amount">${e.amount}</td>
                    <td className="cell-sub">{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INCOME TAB */}
      {activeTab === 'income' && (
        <div className="dash-card">
          <div className="fin-card-toolbar">
            <button className="btn-primary" onClick={() => openEntryModal('income')}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {t('finance.income.addNew')}
            </button>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('finance.income.table.source')}</th><th>{t('finance.income.table.description')}</th><th>{t('finance.income.table.amount')}</th><th>{t('finance.income.table.date')}</th></tr></thead>
              <tbody>
                {income.map((i) => (
                  <tr key={i.id}>
                    <td><span className="badge badge-success">{i.source}</span></td>
                    <td>{i.description}</td>
                    <td className="cell-amount">${i.amount}</td>
                    <td className="cell-sub">{i.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SALARY TAB */}
      {activeTab === 'salary' && (
        <div className="dash-card">
          <div className="fin-card-toolbar">
            <button className="btn-primary" onClick={() => openEntryModal('salary')}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {t('finance.salary.addNew')}
            </button>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('finance.salary.table.staff')}</th><th>{t('finance.salary.table.role')}</th><th>{t('finance.salary.table.amount')}</th><th>{t('finance.salary.table.month')}</th><th>{t('finance.salary.table.status')}</th><th></th></tr></thead>
              <tbody>
                {salaries.map((s) => {
                  const b = statusBadge(s.status);
                  return (
                    <tr key={s.id}>
                      <td>
                        {s.staffName}
                        {!s.teacherId && (
                          <span
                            className="cell-sub"
                            style={{ marginInlineStart: 6, cursor: 'help' }}
                            title={t('finance.salary.notLinkedTooltip')}
                          >
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: 'inline', verticalAlign: 'middle' }}><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>
                          </span>
                        )}
                      </td>
                      <td className="cell-sub">{s.role}</td>
                      <td className="cell-amount">${s.amount}</td>
                      <td>{s.month}</td>
                      <td><span className={`badge ${b.cls}`}>{b.label}</span></td>
                      <td>
                        {s.status === 'pending' && (
                          <button className="btn-secondary" onClick={() => markSalaryPaid(s.id)}>{t('finance.salary.markPaid')}</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {salaries.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.noResults')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISCOUNTS & SCHOLARSHIPS TAB */}
      {activeTab === 'discounts' && (
        <div className="dash-card">
          <div className="fin-card-toolbar">
            <button className="btn-primary" onClick={() => openEntryModal('discounts')}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {t('finance.discounts.addNew')}
            </button>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('finance.discounts.table.student')}</th><th>{t('finance.discounts.table.type')}</th><th>{t('finance.discounts.table.amount')}</th><th>{t('finance.discounts.table.reason')}</th></tr></thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id}>
                    <td>{d.student}</td>
                    <td>
                      <span className={`badge ${d.type === 'scholarship' ? 'badge-success' : 'badge-warning'}`}>
                        {d.type === 'scholarship' ? t('finance.discounts.scholarship') : t('finance.discounts.discount')}
                      </span>
                    </td>
                    <td className="cell-amount">${d.amount}</td>
                    <td className="cell-sub">{d.reason}</td>
                  </tr>
                ))}
                {discounts.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.noResults')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVOICES & RECEIPTS TAB */}
      {activeTab === 'documents' && (
        <div className="dash-card">
          <div className="fin-card-toolbar">
            <button className="btn-primary" onClick={() => openEntryModal('documents')}>
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              {t('finance.documents.addNew')}
            </button>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('finance.documents.table.no')}</th><th>{t('finance.documents.table.type')}</th><th>{t('finance.documents.table.party')}</th><th>{t('finance.documents.table.amount')}</th><th>{t('finance.documents.table.date')}</th><th></th></tr></thead>
              <tbody>
                {financeDocuments.map((d) => (
                  <tr key={d.id}>
                    <td className="cell-sub">{d.no}</td>
                    <td>
                      <span className={`badge ${d.type === 'invoice' ? 'badge-neutral' : 'badge-success'}`}>
                        {d.type === 'invoice' ? t('finance.documents.invoice') : t('finance.documents.receipt')}
                      </span>
                    </td>
                    <td>{d.party}</td>
                    <td className="cell-amount">${d.amount}</td>
                    <td className="cell-sub">{d.date}</td>
                    <td>
                      <button className="row-action-btn" title={t('finance.printPdf')} onClick={() => handlePrintDocument(d)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {financeDocuments.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.noResults')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FinanceEntryModal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        onSave={handleSaveEntry}
        type={entryType}
        teachers={teachers.filter((tc) => tc.status !== 'inactive')}
        students={students}
      />

      {selectedRow && (
        <ClassDetailModal
          row={selectedRow}
          monthValue={monthValue}
          onClose={() => setSelectedRowId(null)}
        />
      )}

      <FeeCategoryListModal
        isOpen={showFreeModal}
        onClose={() => setShowFreeModal(false)}
        title={t('finance.statsBox.freeCount')}
        items={freeStudentsList}
      />
    </div>
  );
}

export default Finance;
