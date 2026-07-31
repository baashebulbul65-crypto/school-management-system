import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './FinanceEntryModal.css';

function AddFeeRowModal({ isOpen, onClose, onSave, viewMode }) {
  const { t } = useTranslation();
  const isClass = viewMode === 'class';
  const EMPTY_FORM = { name: '', shift: '', students: '', total: '', discount: '' };
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isOpen) setForm(EMPTY_FORM);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      students: Number(form.students) || 0,
      total: Number(form.total) || 0,
      discount: Number(form.discount) || 0,
    };
    if (isClass) payload.shift = form.shift.trim();
    onSave(payload);
    onClose();
  };

  return (
    <div className="fem-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fem-modal">
        <div className="fem-header">
          <div>
            <h2>{t('finance.addFeeRow.title')}</h2>
            <p>{t('finance.addFeeRow.subtitle')}</p>
          </div>
          <button className="fem-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fem-body">
            <div className="fem-grid">
              <div className="fem-field full">
                <label>{t('finance.addFeeRow.name')}</label>
                <input type="text" value={form.name} onChange={update('name')} placeholder={t('finance.addFeeRow.namePlaceholder')} required />
              </div>

              {isClass && (
                <div className="fem-field">
                  <label>{t('finance.addFeeRow.shift')}</label>
                  <input type="text" value={form.shift} onChange={update('shift')} placeholder={t('finance.addFeeRow.shiftPlaceholder')} />
                </div>
              )}

              <div className="fem-field">
                <label>{t('finance.addFeeRow.students')}</label>
                <input type="number" min="0" value={form.students} onChange={update('students')} required />
              </div>

              <div className="fem-field">
                <label>{t('finance.addFeeRow.total')}</label>
                <input type="number" min="0" value={form.total} onChange={update('total')} required />
              </div>

              <div className="fem-field">
                <label>{t('finance.addFeeRow.discount')}</label>
                <input type="number" min="0" value={form.discount} onChange={update('discount')} />
              </div>
            </div>
          </div>

          <div className="fem-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>{t('common.cancel')}</button>
            <button type="submit" className="btn-primary">{t('finance.addFeeRow.submit')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFeeRowModal;
