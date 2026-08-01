import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './FinanceEntryModal.css';

const EXPENSE_CATEGORIES = ['Mushahar', 'Adeegyada', 'Qalabka', 'Dhismaha', 'Gaadiid', 'Dayactir', 'Kale'];

const EMPTY_FORMS = {
  expenses: { category: EXPENSE_CATEGORIES[0], description: '', amount: '', date: '' },
  income: { source: '', description: '', amount: '', date: '' },
  salary: { staffName: '', role: '', amount: '', month: '', teacherId: '' },
  discounts: { student: '', type: 'discount', amount: '', reason: '' },
  documents: { type: 'invoice', party: '', amount: '', date: '' },
};

const TITLES = {
  expenses: 'Ku Dar Kharash Cusub',
  income: 'Ku Dar Dakhli Cusub',
  salary: 'Ku Dar Mushahar',
  discounts: 'Ku Dar Dhimis/Deeq Waxbarasho',
  documents: 'Ku Dar Invoice/Receipt',
};

function FinanceEntryModal({ isOpen, onClose, onSave, type, teachers = [] }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORMS[type] || EMPTY_FORMS.expenses);

  useEffect(() => {
    setForm(EMPTY_FORMS[type] || EMPTY_FORMS.expenses);
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
            <h2>{TITLES[type]}</h2>
            <p>{t('finance.entryModal.fillInfo')}</p>
          </div>
          <button className="fem-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fem-body">
            <div className="fem-grid">
              {type === 'expenses' && (
                <div className="fem-field">
                  <label>{t('finance.entryModal.category')}</label>
                  <select value={form.category} onChange={update('category')}>
                    {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{t(`finance.entryModal.categories.${c}`)}</option>)}
                  </select>
                </div>
              )}

              {type === 'income' && (
                <div className="fem-field">
                  <label>{t('finance.entryModal.source')}</label>
                  <input type="text" value={form.source} onChange={update('source')} placeholder={t('finance.entryModal.sourcePlaceholder')} required />
                </div>
              )}

              {type === 'salary' && (
                <>
                  <div className="fem-field">
                    <label>{t('finance.salary.table.staff')}</label>
                    <input type="text" value={form.staffName} onChange={update('staffName')} placeholder="Tusaale: Cali Xasan Warsame" required />
                  </div>
                  <div className="fem-field">
                    <label>{t('finance.salary.table.role')}</label>
                    <input type="text" value={form.role} onChange={update('role')} placeholder="Tusaale: Macallin - Xisaabta" />
                  </div>
                  <div className="fem-field full">
                    <label>{t('finance.salary.linkTeacher')}</label>
                    <select value={form.teacherId} onChange={update('teacherId')}>
                      <option value="">{t('finance.salary.linkTeacherNone')}</option>
                      {teachers.map((tc) => (
                        <option key={tc.id} value={tc.id}>{tc.fullName}</option>
                      ))}
                    </select>
                    <span className="fem-hint">{t('finance.salary.linkTeacherHint')}</span>
                  </div>
                  <div className="fem-field full">
                    <label>{t('finance.salary.table.month')}</label>
                    <input type="text" value={form.month} onChange={update('month')} placeholder="Tusaale: Luulyo 2026" />
                  </div>
                </>
              )}

              {type === 'discounts' && (
                <>
                  <div className="fem-field">
                    <label>{t('finance.discounts.table.student')}</label>
                    <input type="text" value={form.student} onChange={update('student')} placeholder="Tusaale: Cabdiraxman Yoonis" required />
                  </div>
                  <div className="fem-field">
                    <label>{t('finance.discounts.table.type')}</label>
                    <select value={form.type} onChange={update('type')}>
                      <option value="discount">{t('finance.discounts.discount')}</option>
                      <option value="scholarship">{t('finance.discounts.scholarship')}</option>
                    </select>
                  </div>
                  <div className="fem-field full">
                    <label>{t('finance.discounts.table.reason')}</label>
                    <input type="text" value={form.reason} onChange={update('reason')} placeholder="Tusaale: Deeq waxbarasho - buundo sare" />
                  </div>
                </>
              )}

              {type === 'documents' && (
                <>
                  <div className="fem-field">
                    <label>{t('finance.documents.table.type')}</label>
                    <select value={form.type} onChange={update('type')}>
                      <option value="invoice">{t('finance.documents.invoice')}</option>
                      <option value="receipt">{t('finance.documents.receipt')}</option>
                    </select>
                  </div>
                  <div className="fem-field">
                    <label>{t('finance.documents.table.party')}</label>
                    <input type="text" value={form.party} onChange={update('party')} placeholder="Tusaale: Ismaaciil Cabdi Xasan" required />
                  </div>
                </>
              )}

              {(type === 'salary' || type === 'discounts' || type === 'expenses' || type === 'income' || type === 'documents') && (
                <div className="fem-field">
                  <label>{t('finance.entryModal.amount')}</label>
                  <input type="number" value={form.amount} onChange={update('amount')} placeholder={t('finance.entryModal.amountPlaceholder')} required />
                </div>
              )}

              {(type === 'expenses' || type === 'income') && (
                <div className="fem-field full">
                  <label>{t('finance.entryModal.description')}</label>
                  <input type="text" value={form.description} onChange={update('description')} placeholder={t('finance.entryModal.descriptionPlaceholder')} />
                </div>
              )}

              {(type === 'expenses' || type === 'income' || type === 'documents') && (
                <div className="fem-field">
                  <label>{t('finance.entryModal.date')}</label>
                  <input type="date" value={form.date} onChange={update('date')} />
                </div>
              )}
            </div>
          </div>

          <div className="fem-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">Ku Dar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FinanceEntryModal;
