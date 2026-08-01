import { useTranslation } from 'react-i18next';
import './FinanceEntryModal.css';

// Liiska ardayda "Bilaash" — waxaa laga furaa stat-ka la mid ah ee Finance.jsx
// (Xaaladda Lacagta Guud), si loo muujiyo magacyada dhabta ah.
function FeeCategoryListModal({ isOpen, onClose, title, items }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fem-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fem-modal">
        <div className="fem-header">
          <div>
            <h2>{title}</h2>
          </div>
          <button className="fem-close" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="fem-body">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('finance.feeCategoryModal.student')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.name}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>
                      {t('common.noResults')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeeCategoryListModal;
