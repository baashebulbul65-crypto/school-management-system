import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './FinanceEntryModal.css';

const EXPENSE_CATEGORIES = ['Mushahar', 'Adeegyada', 'Qalabka', 'Dhismaha', 'Gaadiid', 'Dayactir', 'Kale'];

const EMPTY_FORMS = {
  expenses: { category: EXPENSE_CATEGORIES[0], description: '', amount: '', date: '' },
  income: { source: '', description: '', amount: '', date: '' },
  salary: { staffName: '', role: '', amount: '', month: '', teacherId: '' },
  discounts: { studentId: '', student: '', type: 'discount', amount: '', reason: '' },
  documents: { type: 'invoice', party: '', amount: '', date: '' },
};

const TITLE_KEYS = {
  expenses: 'finance.entryModal.addExpenseTitle',
  income: 'finance.entryModal.addIncomeTitle',
  salary: 'finance.entryModal.addSalaryTitle',
  discounts: 'finance.entryModal.addDiscountTitle',
  documents: 'finance.entryModal.addDocumentTitle',
};

const SUBMIT_KEYS = {
  expenses: 'finance.entryModal.submitExpense',
  income: 'finance.entryModal.submitIncome',
  salary: 'finance.entryModal.submitSalary',
  discounts: 'finance.entryModal.submitDiscount',
  documents: 'finance.entryModal.submitDocument',
};

function FinanceEntryModal({ isOpen, onClose, onSave, type, teachers = [], students = [] }) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORMS[type] || EMPTY_FORMS.expenses);

  useEffect(() => {
    setForm(EMPTY_FORMS[type] || EMPTY_FORMS.expenses);
  }, [type, isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Finance audit (2026-08-03, gap CRITICAL #2): khaanadda "arday" ee
  // Discounts/Scholarships hore waxay ahayd qoraal bilaash ah (ma jirin
  // xiriir dhab ah la arday-ka dhabta ah, marka ay khaldantahay/khaldanaan
  // karto). Hadda waa dropdown arday DHAB ah — "studentId" waa xiriirka
  // (fiiri firestore.rules/students), "student" waa magaca la kaydiyo
  // (denormalized, la mid ah staffName ee mushaharka) si liiska Discounts
  // uu si fudud u tuso magaca isaga oo aan mar walba u baahnayn in la
  // xisaabiyo (get) diiwaanka ardayga.
  const handleStudentSelect = (e) => {
    const studentId = e.target.value;
    const selected = students.find((s) => s.id === studentId);
    setForm((f) => ({ ...f, studentId, student: selected?.fullName || '' }));
  };

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
            <h2>{t(TITLE_KEYS[type] || TITLE_KEYS.expenses)}</h2>
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
                    <input type="text" value={form.staffName} onChange={update('staffName')} placeholder={t('finance.entryModal.staffNamePlaceholder')} required />
                  </div>
                  <div className="fem-field">
                    <label>{t('finance.salary.table.role')}</label>
                    <input type="text" value={form.role} onChange={update('role')} placeholder={t('finance.entryModal.rolePlaceholder')} />
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
                    <input type="text" value={form.month} onChange={update('month')} placeholder={t('finance.entryModal.monthPlaceholder')} />
                  </div>
                </>
              )}

              {type === 'discounts' && (
                <>
                  <div className="fem-field">
                    <label>{t('finance.discounts.table.student')}</label>
                    <select value={form.studentId} onChange={handleStudentSelect} required disabled={students.length === 0}>
                      <option value="" disabled>
                        {students.length === 0 ? t('finance.discounts.noStudents') : t('finance.discounts.selectStudent')}
                      </option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName}</option>
                      ))}
                    </select>
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
                    <input type="text" value={form.reason} onChange={update('reason')} placeholder={t('finance.entryModal.reasonPlaceholder')} />
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
                    <input type="text" value={form.party} onChange={update('party')} placeholder={t('finance.entryModal.partyPlaceholder')} required />
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
            <button type="submit" className="btn-primary">{t(SUBMIT_KEYS[type] || SUBMIT_KEYS.expenses)}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FinanceEntryModal;
