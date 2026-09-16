import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSchoolData } from '../../context/SchoolDataContext';
import { useSettings } from '../../context/SettingsContext';
import { getFeeType, studentFeeOwed } from '../../utils/studentFee';
import { currencySymbol } from '../../utils/currency';
import BackButton from '../../components/dashboard/BackButton';
import './ClassDetailModal.css';

// Finance audit (2026-08-03): qaybta M.Qoys (family) — labadaba roster-ka
// beensan ee tan hore isticmaali jirtay (gap CRITICAL #1) iyo qaybta M.Qoys
// ee Finance.jsx oo dhan (gap CRITICAL #2) — waa la saaray gebi ahaanba.
// Modal-kani hadda waa CLASS VIEW OO QURA: roster dhab ah oo ka yimid
// "students" collection-ka Firestore.
function ClassDetailModal({ row, monthValue, onClose }) {
  const { t } = useTranslation();
  const { students, feePayments, collectStudentFee } = useSchoolData();
  const { settings } = useSettings();
  const cur = currencySymbol(settings.currency);
  const [statusFilter, setStatusFilter] = useState('all');

  // Marka fasal kale la furo, filter-ka hore ha ku hadhin.
  useEffect(() => {
    setStatusFilter('all');
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

  // Filter-ka xaaladda (Dhammaan/Bixiyay/Ma Bixin/Bilaash) — kala-soocidda
  // A-Z/status (sort dropdown) waa la saaray (2026-09-16, user-report: "muhiim
  // ma aha"), sidaas darteed liiska waxaa kaliya lagu XANTIYAA (filter).
  const filteredRoster = useMemo(() => {
    if (statusFilter === 'all') return roster;
    return roster.filter((r) => r.status === statusFilter);
  }, [roster, statusFilter]);

  // Guard duplicate feePayment (Finance audit MEDIUM, 2026-08-26): badhanka
  // "Bixi" ma lahayn disabled/pending-state intii collectStudentFee (async)
  // socoto — network latency ka dhexeysa, marka la riixo laba jeer degdeg ah
  // (ka hor intii onSnapshot uu soo cusboonaysiin karo status-ka) waxaa
  // dhici karta laba diiwaan (feePayment) oo isku arday+bil ah. collectingIds
  // waxay xannibaysaa row-kan kaliya, ma xannibayso rosterka intiisa kale.
  const [collectingIds, setCollectingIds] = useState(new Set());

  const handleCollect = async (rosterId) => {
    if (collectingIds.has(rosterId)) return;
    const person = roster.find((r) => r.id === rosterId);
    if (!person) return;
    const confirmed = window.confirm(t('finance.classDetail.confirmCollect', { name: person.name }));
    if (!confirmed) return;
    setCollectingIds((prev) => new Set(prev).add(rosterId));
    try {
      await collectStudentFee(rosterId, monthValue);
    } finally {
      setCollectingIds((prev) => {
        const next = new Set(prev);
        next.delete(rosterId);
        return next;
      });
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="cdm-page">
      <div className="cdm-header-card">
        <div className="cdm-topbar">
          <BackButton onClick={onClose} />
          <div className="cdm-header-pills">
            <span className="cdm-pill cdm-pill-total">
              {t('finance.classDetail.stats.total')} <strong>{stats.total}</strong>
            </span>
            <span className="cdm-pill cdm-pill-unpaid">
              {t('finance.classDetail.stats.unpaid')} <strong>{stats.aanBixin}</strong>
            </span>
          </div>
        </div>
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
        </div>
      </div>

      <div className="cdm-stats-card">
        <div className="cdm-stats-row-top">
          <div className="cdm-stat-box total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            <div><strong>{stats.total}</strong><span>{t('finance.classDetail.stats.total')}</span></div>
          </div>
          <div className="cdm-stat-box paid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            <div><strong>{stats.bixiyey}</strong><span>{t('finance.classDetail.stats.paid')}</span></div>
          </div>
          <div className="cdm-stat-box unpaid">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            <div><strong>{stats.aanBixin}</strong><span>{t('finance.classDetail.stats.unpaid')}</span></div>
          </div>
          <div className="cdm-stat-box free">
            <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9"/></svg>
            <div><strong>{stats.bilaash}</strong><span>{t('finance.classDetail.stats.free')}</span></div>
          </div>
        </div>
        <div className="cdm-stats-row-bottom">
          <div className="cdm-stat-box outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z"/></svg>
            <div><strong>{cur}{stats.qiimoDhimista}</strong><span>{t('finance.classDetail.stats.discountValue')}</span></div>
          </div>
          <div className="cdm-stat-box outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>
            <div><strong>{cur}{stats.aBaska}</strong><span>{t('finance.classDetail.stats.unpaidCount')}</span></div>
          </div>
        </div>
      </div>

      <div className="cdm-table-wrap" dir="rtl">
        <table className="cdm-table" dir="rtl">
          <thead><tr><th>{t('finance.classDetail.table.student')}</th><th>{t('finance.classDetail.table.status')}</th></tr></thead>
          <tbody>
            {filteredRoster.map((s, i) => (
              <tr key={s.id} className={`cdm-row-${s.status}`}>
                <td className="cdm-student-cell">
                  <span className="cdm-name" dir="auto">{s.name}</span>
                  <span className="cdm-idx">{i + 1}</span>
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
                      <button
                        className="cdm-collect-btn"
                        disabled={collectingIds.has(s.id)}
                        onClick={() => handleCollect(s.id)}
                      >
                        {t('finance.classDetail.collect')}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filteredRoster.length === 0 && (
              <tr><td colSpan="2" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('common.noResults')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ClassDetailModal;
