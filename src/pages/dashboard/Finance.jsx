import { useState, useMemo } from 'react';
import FinanceEntryModal from './FinanceEntryModal';
import FeeCollectionModal from './FeeCollectionModal';
import ClassDetailModal from './ClassDetailModal';
import '../../styles/dashboard-shared.css';
import './Finance.css';

const TABS = [
  { id: 'accounting', label: 'Xisaabaadka' },
  { id: 'expenses', label: 'Kharashka' },
  { id: 'income', label: 'Dakhliga' },
  { id: 'salary', label: 'Mushaharka' },
  { id: 'discounts', label: 'Dhimis & Deeq' },
  { id: 'documents', label: 'Invoices & Receipts' },
];

// ===== XISAABAADKA (Class-based fee dashboard) =====
const CLASS_FEES = [
  { id: 1, name: 'Fasalka Sare ee Xasan', shift: 'Sabaxi', students: 46, total: 229, discount: 0, balance: 20 },
  { id: 2, name: 'Fasalka Sare ee Xasan', shift: "Masaa'i", students: 27, total: 155, discount: 5, balance: 0 },
  { id: 3, name: 'Fasal 2 - Amiina', shift: 'Sabaxi', students: 31, total: 110, discount: 0, balance: 15 },
  { id: 4, name: 'Fasal 3 - Xaawo', shift: 'Sabaxi', students: 23, total: 150, discount: 0, balance: 0 },
  { id: 5, name: 'Fasal 3 - Xaawo', shift: "Masaa'i", students: 34, total: 240, discount: 10, balance: 25 },
  { id: 6, name: 'Fasal 4 - Cumar', shift: 'Sabaxi', students: 31, total: 153, discount: 0, balance: 0 },
  { id: 7, name: 'Fasal 4 - Cumar', shift: "Masaa'i", students: 28, total: 132, discount: 3, balance: 18 },
];

const FAMILY_FEES = [
  { id: 101, name: 'Qoyska Xasan Warsame', students: 3, total: 360, discount: 20, balance: 0 },
  { id: 102, name: 'Qoyska Cabdi Nuur', students: 2, total: 240, discount: 0, balance: 45 },
  { id: 103, name: 'Qoyska Maxamed Cige', students: 2, total: 220, discount: 15, balance: 0 },
  { id: 104, name: 'Qoyska Yoonis Cali', students: 1, total: 120, discount: 0, balance: 30 },
];

// Tirooyin dheeraad ah oo la xiriira xisaabaadka (stats box-ka midig)
const EXTRA_STATS = { paymentsCount: 139, discountRecipients: 8, scholarshipCount: 71, unpaidCount: 0 };

const INITIAL_EXPENSES = [
  { id: 1, category: 'Mushahar', description: 'Mushaharka Macallimiinta - Juun', amount: 2400, date: '2026-06-28' },
  { id: 2, category: 'Adeegyada', description: 'Korontada iyo Biyaha', amount: 340, date: '2026-07-05' },
  { id: 3, category: 'Qalabka', description: 'Alaabta Fasalka (Sabuurad, Kuraas)', amount: 210, date: '2026-07-08' },
  { id: 4, category: 'Dhismaha', description: 'Dayactirka Qolka 101', amount: 180, date: '2026-07-12' },
  { id: 5, category: 'Adeegyada', description: 'Internet-ka Bisha', amount: 95, date: '2026-07-01' },
];

const INITIAL_INCOME = [
  { id: 1, source: 'Fees Ardayda', description: 'Fees Semester 2', amount: 4200, date: '2026-07-10' },
  { id: 2, source: 'Deeqo (Donations)', description: 'Deeq ka timid Irmaan Group', amount: 800, date: '2026-07-02' },
  { id: 3, source: 'Fees Ardayda', description: 'Fees Semester 2 - dhaqaale dheeraad', amount: 600, date: '2026-07-15' },
];

const INITIAL_SALARY = [
  { id: 1, staffName: 'Cali Xasan Warsame', role: 'Macallin - Xisaabta', amount: 420, month: 'Luulyo 2026', status: 'pending' },
  { id: 2, staffName: 'Faadumo Nuur Cige', role: 'Macallin - Ingiriisi', amount: 380, month: 'Luulyo 2026', status: 'pending' },
  { id: 3, staffName: 'Xasan Cabdulle Nuur', role: 'Maamule Guud', amount: 550, month: 'Luulyo 2026', status: 'paid' },
  { id: 4, staffName: 'Zaynab Cali Warsame', role: 'Xisaabiye', amount: 400, month: 'Luulyo 2026', status: 'paid' },
];

const INITIAL_DISCOUNTS = [
  { id: 1, student: 'Cabdiraxman Yoonis', type: 'discount', amount: 30, reason: 'Walaalo dhowr ah oo isku dugsi ah' },
  { id: 2, student: 'Sacdiyo Xasan Nuur', type: 'scholarship', amount: 150, reason: 'Deeq waxbarasho - buundo sare' },
];

const INITIAL_DOCUMENTS = [
  { id: 1, no: 'INV-2026-014', type: 'invoice', party: 'Ismaaciil Cabdi Xasan', amount: 120, date: '2026-07-15' },
  { id: 2, no: 'RCT-2026-032', type: 'receipt', party: 'Xaawo Maxamed Cali', amount: 120, date: '2026-07-10' },
  { id: 3, no: 'INV-2026-015', type: 'invoice', party: 'Amiina Cabdulle', amount: 120, date: '2026-07-16' },
];

function statusBadge(status) {
  if (status === 'paid') return { label: 'La Bixiyay', cls: 'badge-success' };
  if (status === 'pending') return { label: 'Sugaya', cls: 'badge-warning' };
  return { label: 'Dib U Dhacay', cls: 'badge-danger' };
}

function Finance() {
  const [activeTab, setActiveTab] = useState('accounting');

  // ----- Xisaabaadka state -----
  const [viewMode, setViewMode] = useState('class'); // 'class' | 'family'
  const [monthValue, setMonthValue] = useState('2026-07');
  const [classFilter, setClassFilter] = useState('all');
  const [classFees, setClassFees] = useState(CLASS_FEES);
  const [familyFees, setFamilyFees] = useState(FAMILY_FEES);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  const [income, setIncome] = useState(INITIAL_INCOME);
  const [salary] = useState(INITIAL_SALARY);
  const [discounts] = useState(INITIAL_DISCOUNTS);
  const [documents] = useState(INITIAL_DOCUMENTS);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryType, setEntryType] = useState('expenses');

  const activeRows = viewMode === 'class' ? classFees : familyFees;

  const filteredRows = useMemo(() => {
    if (viewMode === 'family' || classFilter === 'all') return activeRows;
    return activeRows.filter((r) => r.name === classFilter);
  }, [activeRows, classFilter, viewMode]);

  const uniqueClassNames = useMemo(() => [...new Set(CLASS_FEES.map((r) => r.name))], []);

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
    const updater = (rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, balance: Math.max(0, r.balance - amount) } : r));
    if (viewMode === 'class') setClassFees(updater);
    else setFamilyFees(updater);
  };

  const handleCollectDetail = (rowId, amount) => {
    const updater = (rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, balance: Math.max(0, r.balance - amount) } : r));
    if (viewMode === 'class') setClassFees(updater);
    else setFamilyFees(updater);
    setSelectedRow((prev) => (prev && prev.id === rowId ? { ...prev, balance: Math.max(0, prev.balance - amount) } : prev));
  };

  // ----- Kharashka/Dakhliga (sida hore) -----
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
    if (type === 'expenses') setExpenses((prev) => [...prev, { ...payload, id: Date.now() }]);
    else if (type === 'income') setIncome((prev) => [...prev, { ...payload, id: Date.now() }]);
  };

  const handlePrint = () => window.print();

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Lacagta</h2>
          <p>Maamul dakhliga, kharashka, iyo xisaabaadka guud ee dugsiga.</p>
        </div>
        <button className="btn-secondary" onClick={handlePrint}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/></svg>
          PDF Export / Print
        </button>
      </div>

      {/* TABS */}
      <div className="fin-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`fin-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
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
                Fasalada
              </button>
              <button className={`acc-toggle-btn ${viewMode === 'family' ? 'active' : ''}`} onClick={() => setViewMode('family')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                M.Qoys
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
                  <div className="acc-card-label">Wadar</div>
                  <div className="acc-card-value">${accSummary.wadar.toLocaleString()}.00 <span>({totalStudents})</span></div>
                </div>
              </div>
              <div className="acc-card">
                <div className="acc-card-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div>
                  <div className="acc-card-label">La Ururiyey</div>
                  <div className="acc-card-value success">${accSummary.laUururiyey.toLocaleString()}.00</div>
                </div>
              </div>
              <div className="acc-card">
                <div className="acc-card-icon red">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </div>
                <div>
                  <div className="acc-card-label">Aan La Ururin</div>
                  <div className="acc-card-value danger">${accSummary.baaqi.toLocaleString()}.00</div>
                </div>
              </div>
              <div className="acc-card">
                <div className="acc-card-icon teal">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41L11 3.83A2 2 0 009.58 3H4a1 1 0 00-1 1v5.58a2 2 0 00.59 1.41l9.58 9.59a2 2 0 002.83 0l5.59-5.59a2 2 0 000-2.83z"/></svg>
                </div>
                <div>
                  <div className="acc-card-label">Qiimo Dhimis</div>
                  <div className="acc-card-value">${accSummary.dhimis.toLocaleString()}.00</div>
                </div>
              </div>
              <div className="acc-card">
                <div className="acc-card-icon orange">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div>
                  <div className="acc-card-label">Hadhaa</div>
                  <div className="acc-card-value">$0.00</div>
                </div>
              </div>
              <div className="acc-card">
                <div className="acc-card-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </div>
                <div>
                  <div className="acc-card-label">Kharashaad</div>
                  <div className="acc-card-value">${accSummary.totalExpenses.toLocaleString()}.00</div>
                </div>
              </div>
            </div>

            {/* STATS BOX */}
            <div className="acc-stats-box">
              <div className="acc-stat"><strong>{viewMode === 'class' ? classFees.length : familyFees.length}</strong><span>{viewMode === 'class' ? 'Fasalo' : 'Qoysas'}</span></div>
              <div className="acc-stat"><strong>{totalStudents}</strong><span>Arday</span></div>
              <div className="acc-stat"><strong>{EXTRA_STATS.paymentsCount}</strong><span>L.Bixisa</span></div>
              <div className="acc-stat"><strong>{EXTRA_STATS.discountRecipients}</strong><span>Q.Dhimis</span></div>
              <div className="acc-stat"><strong>{EXTRA_STATS.scholarshipCount}</strong><span>Bilaash</span></div>
              <div className="acc-stat"><strong>{EXTRA_STATS.unpaidCount}</strong><span>A.Baska</span></div>
            </div>
          </div>

          {/* FILTER ROW */}
          <div className="acc-filter-row">
            {viewMode === 'class' ? (
              <select className="acc-filter-select" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="all">Fasalada</option>
                {uniqueClassNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            ) : <div />}
            <button className="acc-collect-btn" onClick={() => setShowCollectModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              Lacag-Qabo
            </button>
          </div>

          {/* TABLE */}
          <div className="dash-card">
            <div className="data-table-wrap">
              <table className="data-table acc-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>{viewMode === 'class' ? 'Fasal' : 'Qoyska'}</th>
                    <th>Arday</th>
                    <th>Total ($)</th>
                    <th>Q.Dhimis ($)</th>
                    <th>Baaqi ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r, i) => (
                    <tr key={r.id} className="acc-row-clickable" onClick={() => setSelectedRow(r)}>
                      <td className="cell-sub">{i + 1}</td>
                      <td>
                        <div className="cell-name">{r.name}</div>
                        {r.shift && <div className="cell-sub">{r.shift}</div>}
                      </td>
                      <td>{r.students}</td>
                      <td>${r.total.toFixed(2)}</td>
                      <td className="cell-sub">{r.discount ? `$${r.discount.toFixed(2)}` : ''}</td>
                      <td className={r.balance ? 'acc-baaqi-owed' : ''}>{r.balance ? `$${r.balance.toFixed(2)}` : ''}</td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>Wax lama helin.</td></tr>
                  )}
                </tbody>
                {filteredRows.length > 0 && (
                  <tfoot>
                    <tr className="acc-total-row">
                      <td></td>
                      <td>Total ({filteredRows.length}) {viewMode === 'class' ? 'Fasal' : 'Qoyska'}</td>
                      <td>{filteredRows.reduce((s, r) => s + r.students, 0)}</td>
                      <td>${filteredRows.reduce((s, r) => s + r.total, 0).toFixed(2)}</td>
                      <td>${filteredRows.reduce((s, r) => s + r.discount, 0).toFixed(2)}</td>
                      <td>${filteredRows.reduce((s, r) => s + r.balance, 0).toFixed(2)}</td>
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
              Ku Dar Kharash
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
              <thead><tr><th>Nooca</th><th>Sharraxaad</th><th>Qadarka</th><th>Taariikhda</th></tr></thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td><span className="badge badge-neutral">{e.category}</span></td>
                    <td>{e.description}</td>
                    <td>${e.amount}</td>
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
              Ku Dar Dakhli
            </button>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr><th>Isha (Source)</th><th>Sharraxaad</th><th>Qadarka</th><th>Taariikhda</th></tr></thead>
              <tbody>
                {income.map((i) => (
                  <tr key={i.id}>
                    <td><span className="badge badge-success">{i.source}</span></td>
                    <td>{i.description}</td>
                    <td>${i.amount}</td>
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
              <thead><tr><th>Shaqaale</th><th>Doorka</th><th>Qadarka</th><th>Bisha</th><th>Xaaladda</th></tr></thead>
              <tbody>
                {salary.map((s) => {
                  const b = statusBadge(s.status);
                  return (
                    <tr key={s.id}>
                      <td>{s.staffName}</td>
                      <td className="cell-sub">{s.role}</td>
                      <td>${s.amount}</td>
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
              <thead><tr><th>Arday</th><th>Nooca</th><th>Qadarka</th><th>Sababta</th></tr></thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id}>
                    <td>{d.student}</td>
                    <td>
                      <span className={`badge ${d.type === 'scholarship' ? 'badge-success' : 'badge-warning'}`}>
                        {d.type === 'scholarship' ? 'Deeq Waxbarasho' : 'Dhimis'}
                      </span>
                    </td>
                    <td>${d.amount}</td>
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
              <thead><tr><th>Lambarka</th><th>Nooca</th><th>Qofka</th><th>Qadarka</th><th>Taariikhda</th><th></th></tr></thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d.id}>
                    <td className="cell-sub">{d.no}</td>
                    <td>
                      <span className={`badge ${d.type === 'invoice' ? 'badge-neutral' : 'badge-success'}`}>
                        {d.type === 'invoice' ? 'Invoice' : 'Receipt'}
                      </span>
                    </td>
                    <td>{d.party}</td>
                    <td>${d.amount}</td>
                    <td className="cell-sub">{d.date}</td>
                    <td>
                      <button className="row-action-btn" title="Print / PDF" onClick={handlePrint}>
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
          onClose={() => setSelectedRow(null)}
          onCollected={handleCollectDetail}
        />
      )}
    </div>
  );
}

export default Finance;