import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSchoolData } from '../../context/SchoolDataContext';
import FinanceDonutChart from '../../components/dashboard/FinanceDonutChart';
import FinanceEntryModal from './FinanceEntryModal';
import FeeCollectionModal from './FeeCollectionModal';
import ClassDetailModal from './ClassDetailModal';
import '../../styles/dashboard-shared.css';
import './Finance.css';

// Tirooyin dheeraad ah oo la xiriira xisaabaadka (stats box-ka midig)
const EXTRA_STATS = { paymentsCount: 139, discountRecipients: 8, scholarshipCount: 71, unpaidCount: 0 };

const EXPENSE_META = [
  { id: 1, amount: 2400, date: '2026-06-28' },
  { id: 2, amount: 340, date: '2026-07-05' },
  { id: 3, amount: 210, date: '2026-07-08' },
  { id: 4, amount: 180, date: '2026-07-12' },
  { id: 5, amount: 95, date: '2026-07-01' },
];

const INCOME_META = [
  { id: 1, amount: 4200, date: '2026-07-10' },
  { id: 2, amount: 800, date: '2026-07-02' },
  { id: 3, amount: 600, date: '2026-07-15' },
];

const SALARY_META = [
  { id: 1, amount: 420, status: 'pending' },
  { id: 2, amount: 380, status: 'pending' },
  { id: 3, amount: 550, status: 'paid' },
  { id: 4, amount: 400, status: 'paid' },
];

const DISCOUNTS_META = [
  { id: 1, type: 'discount', amount: 30 },
  { id: 2, type: 'scholarship', amount: 150 },
];

const DOCUMENTS_META = [
  { id: 1, no: 'INV-2026-014', type: 'invoice', amount: 120, date: '2026-07-15' },
  { id: 2, no: 'RCT-2026-032', type: 'receipt', amount: 120, date: '2026-07-10' },
  { id: 3, no: 'INV-2026-015', type: 'invoice', amount: 120, date: '2026-07-16' },
];

function Finance() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { classFees, familyFees, collectClassFee, collectFamilyFee } = useSchoolData();
  const [activeTab, setActiveTab] = useState('accounting');

  // ----- Xisaabaadka state -----
  const [viewMode, setViewMode] = useState('class'); // 'class' | 'family'
  const [monthValue, setMonthValue] = useState('2026-07');
  const [classFilter, setClassFilter] = useState('all');
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);

  // Xogta tijaabada ah (seed) — reactive turjumaad, isla mar ahaantaana kordhinaya xogta
  // admin-ku gudaha foomka ku daro (mid kaliya oo aan la tarjumin, waa qoraal shakhsi ah)
  const seedExpenses = t('finance.expenses.items', { returnObjects: true }).map((item, i) => ({ ...EXPENSE_META[i], ...item }));
  const seedIncome = t('finance.income.items', { returnObjects: true }).map((item, i) => ({ ...INCOME_META[i], ...item }));
  const salary = t('finance.salary.items', { returnObjects: true }).map((item, i) => ({ ...SALARY_META[i], ...item }));
  const discounts = t('finance.discounts.items', { returnObjects: true }).map((item, i) => ({ ...DISCOUNTS_META[i], ...item }));
  const documents = t('finance.documents.items', { returnObjects: true }).map((item, i) => ({ ...DOCUMENTS_META[i], ...item }));

  const [addedExpenses, setAddedExpenses] = useState([]);
  const [addedIncome, setAddedIncome] = useState([]);
  const expenses = [...seedExpenses, ...addedExpenses];
  const income = [...seedIncome, ...addedIncome];

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryType, setEntryType] = useState('expenses');

  const activeRows = viewMode === 'class' ? classFees : familyFees;
  const selectedRow = activeRows.find((r) => r.id === selectedRowId) || null;

  const filteredRows = useMemo(() => {
    if (viewMode === 'family' || classFilter === 'all') return activeRows;
    return activeRows.filter((r) => r.name === classFilter);
  }, [activeRows, classFilter, viewMode]);

  const uniqueClassNames = useMemo(() => [...new Set(classFees.map((r) => r.name))], [classFees]);

  // ----- Xisaabaadka summary (waxaa laga soo xisaabiyay xogta table-ka) -----
  const accSummary = useMemo(() => {
    const wadar = activeRows.reduce((s, r) => s + r.total, 0);
    const dhimis = activeRows.reduce((s, r) => s + r.discount, 0);
    const baaqi = activeRows.reduce((s, r) => s + r.balance, 0);
    const laUururiyey = wadar - dhimis - baaqi;
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    return { wadar, dhimis, baaqi, laUururiyey, totalExpenses };
  }, [activeRows, expenses]);

  const totalStudents = useMemo(() => activeRows.reduce((s, r) => s + r.students, 0), [activeRows]);

  const handleCollectPayment = ({ rowId, amount }) => {
    if (viewMode === 'class') collectClassFee(rowId, amount);
    else collectFamilyFee(rowId, amount);
  };

  const handleCollectDetail = (rowId, amount) => {
    if (viewMode === 'class') collectClassFee(rowId, amount);
    else collectFamilyFee(rowId, amount);
  };

  // ----- Kharashka/Dakhliga (sida hore) -----
  const expenseCategories = useMemo(() => {
    const grouped = {};
    expenses.forEach((e) => { grouped[e.category] = (grouped[e.category] || 0) + e.amount; });
    const maxVal = Math.max(...Object.values(grouped), 1);
    return Object.entries(grouped).map(([category, amount]) => ({
      category, amount, percent: Math.round((amount / maxVal) * 100),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses.length, addedExpenses]);

  const openEntryModal = (type) => { setEntryType(type); setShowEntryModal(true); };

  const handleSaveEntry = (payload, type) => {
    if (type === 'expenses') setAddedExpenses((prev) => [...prev, { ...payload, id: Date.now() }]);
    else if (type === 'income') setAddedIncome((prev) => [...prev, { ...payload, id: Date.now() }]);
  };

  const handlePrint = () => window.print();

  useEffect(() => {
    if (location.state?.openCollect) {
      setActiveTab('accounting');
      setShowCollectModal(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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
            <div className="acc-toggle">
              <button className={`acc-toggle-btn ${viewMode === 'class' ? 'active' : ''}`} onClick={() => setViewMode('class')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg>
                {t('finance.toggle.byClass')}
              </button>
              <button className={`acc-toggle-btn ${viewMode === 'family' ? 'active' : ''}`} onClick={() => setViewMode('family')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                {t('finance.toggle.byFamily')}
              </button>
            </div>
            <input type="month" className="acc-month-picker" value={monthValue} onChange={(e) => setMonthValue(e.target.value)} />
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
                  <div className="acc-card-value">$0.00</div>
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
                <div className="acc-stat"><strong>{viewMode === 'class' ? classFees.length : familyFees.length}</strong><span>{viewMode === 'class' ? t('finance.statsBox.classes') : t('finance.statsBox.families')}</span></div>
                <div className="acc-stat"><strong>{totalStudents}</strong><span>{t('finance.statsBox.totalStudents')}</span></div>
                <div className="acc-stat"><strong>{EXTRA_STATS.paymentsCount}</strong><span>{t('finance.statsBox.paymentsCount')}</span></div>
                <div className="acc-stat"><strong>{EXTRA_STATS.discountRecipients}</strong><span>{t('finance.statsBox.discountRecipients')}</span></div>
                <div className="acc-stat"><strong>{EXTRA_STATS.scholarshipCount}</strong><span>{t('finance.statsBox.freeCount')}</span></div>
                <div className="acc-stat"><strong>{EXTRA_STATS.unpaidCount}</strong><span>{t('finance.statsBox.unpaidCount')}</span></div>
              </div>
            </div>
          </div>

          {/* FILTER ROW */}
          <div className="acc-filter-row">
            {viewMode === 'class' ? (
              <select className="acc-filter-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="all">{t('finance.allClasses')}</option>
                {uniqueClassNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            ) : <div />}
            <button className="acc-collect-btn" onClick={() => setShowCollectModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              {t('finance.collectFee')}
            </button>
          </div>

          {/* TABLE */}
          <div className="dash-card">
            <div className="data-table-wrap">
              <table className="data-table acc-table">
                <thead>
                  <tr>
                    <th>{t('finance.table.no')}</th>
                    <th>{viewMode === 'class' ? t('finance.table.class') : t('finance.table.family')}</th>
                    <th>{t('finance.table.students')}</th>
                    <th>{t('finance.table.total')}</th>
                    <th>{t('finance.table.discount')}</th>
                    <th>{t('finance.table.balance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r, i) => (
                    <tr key={r.id} className="acc-row-clickable" onClick={() => setSelectedRowId(r.id)}>
                      <td className="cell-sub">{i + 1}</td>
                      <td>
                        <div className="cell-name">{r.name}</div>
                        {r.shift && <div className="cell-sub">{r.shift}</div>}
                      </td>
                      <td>{r.students}</td>
                      <td className="cell-amount">${r.total.toFixed(2)}</td>
                      <td className="cell-sub">{r.discount ? `$${r.discount.toFixed(2)}` : ''}</td>
                      <td className={`cell-amount ${r.balance ? 'acc-baaqi-owed' : ''}`}>{r.balance ? `$${r.balance.toFixed(2)}` : ''}</td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.noResults')}</td></tr>
                  )}
                </tbody>
                {filteredRows.length > 0 && (
                  <tfoot>
                    <tr className="acc-total-row">
                      <td></td>
                      <td>{t('finance.table.totalRow')} ({filteredRows.length}) {viewMode === 'class' ? t('finance.table.class') : t('finance.table.family')}</td>
                      <td>{filteredRows.reduce((s, r) => s + r.students, 0)}</td>
                      <td className="cell-amount">${filteredRows.reduce((s, r) => s + r.total, 0).toFixed(2)}</td>
                      <td className="cell-amount">${filteredRows.reduce((s, r) => s + r.discount, 0).toFixed(2)}</td>
                      <td className="cell-amount">${filteredRows.reduce((s, r) => s + r.balance, 0).toFixed(2)}</td>
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
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('finance.salary.table.staff')}</th><th>{t('finance.salary.table.role')}</th><th>{t('finance.salary.table.amount')}</th><th>{t('finance.salary.table.month')}</th><th>{t('finance.salary.table.status')}</th></tr></thead>
              <tbody>
                {salary.map((s) => {
                  const b = statusBadge(s.status);
                  return (
                    <tr key={s.id}>
                      <td>{s.staffName}</td>
                      <td className="cell-sub">{s.role}</td>
                      <td className="cell-amount">${s.amount}</td>
                      <td>{s.month}</td>
                      <td><span className={`badge ${b.cls}`}>{b.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DISCOUNTS & SCHOLARSHIPS TAB */}
      {activeTab === 'discounts' && (
        <div className="dash-card">
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INVOICES & RECEIPTS TAB */}
      {activeTab === 'documents' && (
        <div className="dash-card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('finance.documents.table.no')}</th><th>{t('finance.documents.table.type')}</th><th>{t('finance.documents.table.party')}</th><th>{t('finance.documents.table.amount')}</th><th>{t('finance.documents.table.date')}</th><th></th></tr></thead>
              <tbody>
                {documents.map((d) => (
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
                      <button className="row-action-btn" title={t('finance.printPdf')} onClick={handlePrint}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
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
      />

      <FeeCollectionModal
        isOpen={showCollectModal}
        onClose={() => setShowCollectModal(false)}
        onCollect={handleCollectPayment}
        rows={activeRows}
      />

      {selectedRow && (
        <ClassDetailModal
          row={selectedRow}
          monthValue={monthValue}
          onClose={() => setSelectedRowId(null)}
          onCollected={handleCollectDetail}
        />
      )}
    </div>
  );
}

export default Finance;
