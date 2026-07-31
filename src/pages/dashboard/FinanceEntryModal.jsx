import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './FinanceEntryModal.css';

const EXPENSE_CATEGORIES = ['Mushahar', 'Adeegyada', 'Qalabka', 'Dhismaha', 'Gaadiid', 'Dayactir', 'Kale'];

function FinanceEntryModal({ isOpen, onClose, onSave, type }) {
  const { t } = useTranslation();
  const isExpense = type === 'expenses';

  const EMPTY_FORM = isExpense
    ? { category: EXPENSE_CATEGORIES[0], description: '', amount: '', date: '' }
    : { source: '', description: '', amount: '', date: '' };

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setForm(EMPTY_FORM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) || 0 };
    onSave(payload, type);
    onClose();
  };

  return (
    <div className="fem-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fem-modal">
        <div className="fem-header">
          <div>
            <h2>{isExpense ? t('finance.entryModal.addExpenseTitle') : t('finance.entryModal.addIncomeTitle')}</h2>
            <p>{t('finance.entryModal.fillInfo')}</p>
          </div>
          <button className="fem-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fem-body">
            <div className="fem-grid">
              {isExpense ? (
                <div className="fem-field">
                  <label>{t('finance.entryModal.category')}</label>
                  <select value={form.category} onChange={update('category')}>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{t(`finance.entryModal.categories.${c}`)}</option>)}
                  </select>
                </div>
              ) : (
                <div className="fem-field">
                  <label>{t('finance.entryModal.source')}</label>
                  <input type="text" value={form.source} onChange={update('source')} placeholder={t('finance.entryModal.sourcePlaceholder')} required />
                </div>
              )}

              <div className="fem-field">
                <label>{t('finance.entryModal.amount')}</label>
                <input type="number" value={form.amount} onChange={update('amount')} placeholder={t('finance.entryModal.amountPlaceholder')} required />
              </div>

              <div className="fem-field full">
                <label>{t('finance.entryModal.description')}</label>
                <input type="text" value={form.description} onChange={update('description')} placeholder={t('finance.entryModal.descriptionPlaceholder')} />
              </div>

              <div className="fem-field">
                <label>{t('finance.entryModal.date')}</label>
                <input type="date" value={form.date} onChange={update('date')} />
              </div>
            </div>
          </div>

          <div className="fem-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">
              {isExpense ? t('finance.entryModal.submitExpense') : t('finance.entryModal.submitIncome')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FinanceEntryModal;
