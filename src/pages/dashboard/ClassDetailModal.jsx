import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSchoolData } from '../../context/SchoolDataContext';
import { getFeeType, studentFeeOwed } from '../../utils/studentFee';
import './ClassDetailModal.css';

// M.Qoys (family) — Finance audit (2026-08-03, gap CRITICAL #1): tan hore
// waxay isticmaali jirtay roster BEENSAN (magacyo random ah oo "SAMPLE_NAMES"
// ka yimid, ma ahayn arday dhab ah), maadaama safafka qoyska aan lala
// xiriirin arday/qoys DHAB AH (ma jiro className/studentId la mid ah).
// Guji-yaal "Qabo Lacagta" oo qof-qof ah ma kaydin jirin waxba Firestore
// ahaan — kaliya local state ayay beddeli jireen. Modal-kani hadda waa
// CLASS VIEW OO QURA (roster dhab ah oo ka yimid "students" collection-ka
// Firestore) — lacagta safka M.Qoys waxaa lagu qaataa "Qabo Lacagta" button-
// ka Finance.jsx (FeeCollectionModal), oo horeba diiwaan dhab ah u qoraa
// feePayments.
function ClassDetailModal({ row, monthValue, onClose }) {
  const { t } = useTranslation();
  const { students, feePayments, collectStudentFee } = useSchoolData();
  const [sortBy, setSortBy] = useState('default');
  const [statusFilter, setStatusFilter] = useState('all');

  // Marka fasal kale la furo, filter-ka/kala-soocidda hore ha ku hadhin.
  useEffect(() => {
    setStatusFilter('all');
    setSortBy('default');
  }, [row?.id]);

  // Liiska ARDAYDA DHABTA AH ee fasalkan (Firestore "students"), xaaladdoodana
  // waxaa laga soo xisaabiyaa feeAmount + feePayments-ka bishaas la doortay
  // (monthValue). Marka bil cusub bilaabmayso (monthValue is beddesha), ma
  // jiro feePayment bishaas ah weli, sidaas darteed ardayda dhammaantood dib
  // ayay ugu noqdaan "Aan Bixin" iyada oo aan gacan lagu bedelin (fiiri
  // collectStudentFee).
  const roster = useMemo(() => {
    if (!row) return [];
    // row.id waa classId dhabta ah (fiiri Finance.jsx: financeClassRows) —
    // waa in la isticmaalo halkii la isticmaali lahaa className kaliya, si
    // liiskan uu had iyo jeer la mid noqdo tirada Finance.jsx table-kiisa.
    return students
      .filter((s) => (s.classId ? s.classId === row.id : s.className === row.name))
      .map((s) => {
        const feeType = getFeeType(s);
        const amount = studentFeeOwed(s);
        let status = 'free';
        if (feeType !== 'free') {
          const isPaid = feePayments.some((p) => p.feeType === 'student' && p.studentId === s.id && p.month === monthValue);
          status = isPaid ? 'paid' : 'unpaid';
        }
        return {
          id: s.id, name: s.fullName, status, amount,
          isDiscount: feeType === 'discount',
          discountPercent: Number(s.discountPercent) || 0,
        };
      });
  }, [students, feePayments, row, monthValue]);

  if (!row) return null;

  const stats = useMemo(() => {
    const total = roster.length;
    const bixiyey = roster.filter((r) => r.status === 'paid').length;
    const aanBixin = roster.filter((r) => r.status === 'unpaid').length;
    const bilaash = roster.filter((r) => r.status === 'free').length;
    return { total, bixiyey, aanBixin, bilaash, qiimoDhimista: row.discount || 0, aBaska: row.unpaidTotal || 0 };
  }, [roster, row]);

  // Filter-ka xaaladda (Dhammaan/Bixiyay/Ma Bixin/Bilaash) iyo kala-soocidda
  // A-Z waa laba shay oo kala duwan oo isku shaqeeya: marka hore liiska waxaa
  // lagu XANTIYAA (filter) xaaladda la doortay, dabadeedna liiskaas la kala
  // saaraa (sort) — sidaas darteed doorashada "Ma Bixin" ka dib, liiska wali
  // waa loo kala saari karaa A-Z.
  const filteredRoster = useMemo(() => {
    if (statusFilter === 'all') return roster;
    return roster.filter((r) => r.status === statusFilter);
  }, [roster, statusFilter]);

  const sortedRoster = useMemo(() => {
    const copy = [...filteredRoster];
    if (sortBy === 'name') copy.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'status') copy.sort((a, b) => a.status.localeCompare(b.status));
    return copy;
  }, [filteredRoster, sortBy]);

  const handleCollect = (rosterId) => {
    const person = roster.find((r) => r.id === rosterId);
    if (!person) return;
    const confirmed = window.confirm(t('finance.classDetail.confirmCollect', { name: person.name }));
    if (!confirmed) return;
    collectStudentFee(rosterId, monthValue);
  };

  const handlePrint = () => window.print();

  return (
    <div className="cdm-page">
      <div className="cdm-topbar">
        <button className="cdm-back" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {t('finance.classDetail.back')}
        </button>
        <div className="cdm-title">{row.name}</div>
        <div className="cdm-toolbar-right">
          <button className="cdm-icon-btn" title={t('finance.classDetail.print')} onClick={handlePrint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z"/></svg>
          </button>
          <div className="cdm-month">{monthValue}</div>
          <select className="cdm-sort" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">{t('finance.classDetail.filterAll')}</option>
            <option value="paid">{t('finance.classDetail.stats.paid')}</option>
            <option value="unpaid">{t('finance.classDetail.stats.unpaid')}</option>
            <option value="free">{t('finance.classDetail.stats.free')}</option>
          </select>
          <select className="cdm-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="default">{t('finance.classDetail.sortDefault')}</option>
            <option value="name">{t('finance.classDetail.sortName')}</option>
            <option value="status">{t('finance.classDetail.sortStatus')}</option>
          </select>
        </div>
      </div>

      <div className="cdm-stats-row">
        <div className="cdm-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          <div><strong>{stats.total}</strong><span>{t('finance.classDetail.stats.total')}</span></div>
        </div>
        <div className="cdm-stat green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          <div><strong>{stats.bixiyey}</strong><span>{t('finance.classDetail.stats.paid')}</span></div>
        </div>
        <div className="cdm-stat red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          <div><strong>{stats.aanBixin}</strong><span>{t('finance.classDetail.stats.unpaid')}</span></div>
        </div>
        <div className="cdm-stat blue">
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9"/></svg>
          <div><strong>{stats.bilaash}</strong><span>{t('finance.classDetail.stats.free')}</span></div>
        </div>
        <div className="cdm-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z"/></svg>
          <div><strong>${stats.qiimoDhimista}</strong><span>{t('finance.classDetail.stats.discountValue')}</span></div>
        </div>
        <div className="cdm-stat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>
          <div><strong>${stats.aBaska}</strong><span>{t('finance.classDetail.stats.unpaidCount')}</span></div>
        </div>
      </div>

      <div className="cdm-table-wrap">
        <table className="cdm-table">
          <thead><tr><th>{t('finance.classDetail.table.student')}</th><th>{t('finance.classDetail.table.status')}</th></tr></thead>
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
                      {t('finance.classDetail.stats.paid')} (${s.amount.toFixed(2)})
                      {s.isDiscount ? ` · ${t('finance.classDetail.discountLabel')} ${s.discountPercent}%` : ''}
                    </span>
                  )}
                  {s.status === 'free' && (
                    <div className="cdm-unpaid-row">
                      <span className="cdm-fii-status free"></span>
                      <span className="cdm-fii-status">{t('finance.classDetail.stats.free')}</span>
                    </div>
                  )}
                  {s.status === 'unpaid' && (
                    <div className="cdm-unpaid-row">
                      <span className="cdm-fii-status unpaid">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        {t('finance.classDetail.stats.unpaid')} (${s.amount.toFixed(2)})
                        {s.isDiscount ? ` · ${t('finance.classDetail.discountLabel')} ${s.discountPercent}%` : ''}
                      </span>
                      <button className="cdm-collect-btn" onClick={() => handleCollect(s.id)}>{t('finance.classDetail.collect')}</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {sortedRoster.length === 0 && (
              <tr><td colSpan="2" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.noResults')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClassDetailModal;
