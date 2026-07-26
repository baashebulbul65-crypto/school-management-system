import { useState, useEffect } from 'react';
import './FinanceEntryModal.css';

const EXPENSE_CATEGORIES = ['Mushahar', 'Adeegyada', 'Qalabka', 'Dhismaha', 'Gaadiid', 'Dayactir', 'Kale'];

function FinanceEntryModal({ isOpen, onClose, onSave, type }) {
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
            <h2>{isExpense ? 'Ku Dar Kharash Cusub' : 'Ku Dar Dakhli Cusub'}</h2>
            <p>Buuxi macluumaadka hoose</p>
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
                  <label>Qaybta (Category) *</label>
                  <select value={form.category} onChange={update('category')}>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              ) : (
                <div className="fem-field">
                  <label>Isha Dakhliga (Source) *</label>
                  <input type="text" value={form.source} onChange={update('source')} placeholder="Tusaale: Fees Ardayda" required />
                </div>
              )}

              <div className="fem-field">
                <label>Qadarka ($) *</label>
                <input type="number" value={form.amount} onChange={update('amount')} placeholder="Tusaale: 200" required />
              </div>

              <div className="fem-field full">
                <label>Sharraxaad</label>
                <input type="text" value={form.description} onChange={update('description')} placeholder="Faahfaahin gaaban" />
              </div>

              <div className="fem-field">
                <label>Taariikhda</label>
                <input type="date" value={form.date} onChange={update('date')} />
              </div>
            </div>
          </div>

          <div className="fem-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Jooji</button>
            <button type="submit" className="btn-primary">
              {isExpense ? 'Ku Dar Kharashka' : 'Ku Dar Dakhliga'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FinanceEntryModal;