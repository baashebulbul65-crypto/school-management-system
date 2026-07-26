import { useState, useEffect, useMemo } from 'react';
import './ClassDetailModal.css';

const SAMPLE_NAMES = [
  'Shucayb Xasan Cabdi', 'Axmed Xaawo Nuur', 'Cabdiraxmaan Warsame', 'Xamse Diriye Cismaan',
  'Yaacquub Xasan Cige', 'Cimraan Nuur Maxamed', 'Cabdi Maxamuud Cige', 'Cabdilaahi Salaan Cali',
  'Xamse Mukhtaar Cige', 'Cabdi Fatax Cabdillaahi', 'Cabdirisaaq Maxamed Cumar', 'Faarax Aadan Warsame',
  'Xasan Cige Maxamed', 'Nuur Cali Ibraahim', 'Warsame Cige Aadan', 'Cali Xasan Warsame',
  'Maxamed Xuseen Cige', 'Sacdiyo Xasan Nuur', 'Amiina Cabdulle', 'Xaawo Maxamed Cali',
];

function buildRoster(row) {
  if (!row) return [];
  const count = row.students;
  const perFee = Math.max(1, Math.round(row.total / count));
  const unpaidCount = row.balance > 0 ? Math.max(1, Math.round(row.balance / perFee)) : 0;
  const freeCount = row.discount > 0 ? Math.max(1, Math.round(row.discount / perFee)) : 0;
  const paidCount = Math.max(0, count - unpaidCount - freeCount);

  const roster = [];
  let idx = 0;
  for (let i = 0; i < paidCount && idx < count; i++, idx++) {
    roster.push({ id: idx + 1, name: SAMPLE_NAMES[idx % SAMPLE_NAMES.length], status: 'paid', amount: perFee });
  }
  for (let i = 0; i < unpaidCount && idx < count; i++, idx++) {
    roster.push({ id: idx + 1, name: SAMPLE_NAMES[idx % SAMPLE_NAMES.length], status: 'unpaid', amount: perFee });
  }
  for (let i = 0; i < freeCount && idx < count; i++, idx++) {
    roster.push({ id: idx + 1, name: SAMPLE_NAMES[idx % SAMPLE_NAMES.length], status: 'free', amount: 0 });
  }
  return roster;
}

function ClassDetailModal({ row, monthValue, onClose, onCollected }) {
  const [roster, setRoster] = useState([]);
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    setRoster(buildRoster(row));
  }, [row]);

  if (!row) return null;

  const stats = useMemo(() => {
    const total = roster.length;
    const bixiyey = roster.filter((r) => r.status === 'paid').length;
    const aanBixin = roster.filter((r) => r.status === 'unpaid').length;
    const bilaash = roster.filter((r) => r.status === 'free').length;
    return { total, bixiyey, aanBixin, bilaash, qiimoDhimista: row.discount, aBaska: 0 };
  }, [roster, row]);

  const sortedRoster = useMemo(() => {
    const copy = [...roster];
    if (sortBy === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'status') copy.sort((a, b) => a.status.localeCompare(b.status));
    return copy;
  }, [roster, sortBy]);

  const handleCollect = (studentId) => {
    const student = roster.find((r) => r.id === studentId);
    if (!student) return;
    setRoster((prev) => prev.map((r) => (r.id === studentId ? { ...r, status: 'paid' } : r)));
    onCollected?.(row.id, student.amount);
  };

  const handlePrint = () => window.print();

  return (
    <div className="cdm-page">
      <div className="cdm-topbar">
        <button className="cdm-back" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Noqo
        </button>
        <div className="cdm-title">{row.name} <span>{row.shift}</span></div>
        <div className="cdm-toolbar-right">
          <button className="cdm-icon-btn" title="Print" onClick={handlePrint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/></svg>
          </button>
          <div className="cdm-month">{monthValue}</div>
          <select className="cdm-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="default">Kala saar...</option>
            <option value="name">Magaca (A-Z)</option>
            <option value="status">Xaaladda</option>
          </select>
        </div>
      </div>

      <div className="cdm-stats-row">
        <div className="cdm-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          <div><strong>{stats.total}</strong><span>Total</span></div>
        </div>
        <div className="cdm-stat green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          <div><strong>{stats.bixiyey}</strong><span>Bixiyey</span></div>
        </div>
        <div className="cdm-stat red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          <div><strong>{stats.aanBixin}</strong><span>Aan Bixin</span></div>
        </div>
        <div className="cdm-stat blue">
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9"/></svg>
          <div><strong>{stats.bilaash}</strong><span>Bilaash</span></div>
        </div>
        <div className="cdm-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z"/></svg>
          <div><strong>${stats.qiimoDhimista}</strong><span>Qiimo Dhimista</span></div>
        </div>
        <div className="cdm-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>
          <div><strong>{stats.aBaska}</strong><span>A.Baska</span></div>
        </div>
      </div>

      <div className="cdm-table-wrap">
        <table className="cdm-table">
          <thead><tr><th>Magaca Ardayga</th><th>Fii</th></tr></thead>
          <tbody>
            {sortedRoster.map((s, i) => (
              <tr key={s.id}>
                <td className="cdm-student-cell">
                  <span className="cdm-avatar-dot"></span>
                  <span className="cdm-idx">{i + 1}</span>
                  {s.name}
                </td>
                <td>
                  {s.status === 'paid' && (
                    <span className="cdm-fii-status paid">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                      ${s.amount}
                    </span>
                  )}
                  {s.status === 'free' && <span className="cdm-fii-status free"></span>}
                  {s.status === 'unpaid' && (
                    <div className="cdm-unpaid-row">
                      <span className="cdm-fii-status unpaid">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </span>
                      <button className="cdm-collect-btn" onClick={() => handleCollect(s.id)}>Lacag Qabo</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClassDetailModal;