import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './FeeCollectionModal.css';

const METHODS = ['Cash', 'Bangi (Bank)', 'EVC/Zaad (Mobile Money)'];

function FeeCollectionModal({ isOpen, onClose, onCollect, rows }) {
  const { t } = useTranslation();
  const [rowId, setRowId] = useState(rows[0]?.id);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(METHODS[0]);
  const [date, setDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRowId(rows[0]?.id);
      setAmount('');
      setMethod(METHODS[0]);
      setDate('');
    }
  }, [isOpen, rows]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCollect({ rowId, amount: Number(amount) || 0, method, date });
    onClose();
  };

  return (
    <div className="fcm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fcm-modal">
        <div className="fcm-header">
          <div>
            <h2>{t('finance.collectModal.title')}</h2>
            <p>{t('finance.collectModal.subtitle')}</p>
          </div>
          <button className="fcm-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fcm-body">
            <div className="fcm-grid">
              <div className="fcm-field full">
                <label>{t('finance.collectModal.classOrFamily')}</label>
                <select value={rowId} onChange={(e) => setRowId(e.target.value)}>
                  {rows.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} {r.shift ? `- ${r.shift}` : ''} ({t('finance.collectModal.balanceLabel')}: ${r.balance})</option>
                  ))}
                </select>
              </div>
              <div className="fcm-field">
                <label>{t('finance.collectModal.amount')}</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('finance.collectModal.amountPlaceholder')} required />
              </div>
              <div className="fcm-field">
                <label>{t('finance.collectModal.method')}</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  {METHODS.map((m) => <option key={m} value={m}>{t(`finance.collectModal.methods.${m}`)}</option>)}
                </select>
              </div>
              <div className="fcm-field full">
                <label>{t('finance.collectModal.date')}</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="fcm-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">{t('finance.collectModal.confirm')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FeeCollectionModal;
