import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSchoolData } from '../../context/SchoolDataContext';
import '../../styles/dashboard-shared.css';

const RETENTION_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;

function initials(name) {
  return name ? name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase() : '';
}

function daysLeft(deletedAt) {
  const elapsed = Date.now() - new Date(deletedAt).getTime();
  return Math.max(0, Math.ceil((RETENTION_DAYS * DAY_MS - elapsed) / DAY_MS));
}

function Trash() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { deletedStudents, restoreStudent, permanentlyDeleteStudent } = useSchoolData();

  const handlePermanentDelete = (studentId, fullName) => {
    const confirmed = window.confirm(t('trash.confirmPermanentDelete', { name: fullName }));
    if (confirmed) permanentlyDeleteStudent(studentId);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>{t('trash.title')}</h2>
          <p>{t('trash.subtitle')}</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {t('common.backToDashboard')}
        </button>
      </div>

      <div className="dash-card">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('trash.table.name')}</th>
                <th>{t('trash.table.className')}</th>
                <th>{t('trash.table.deletedDate')}</th>
                <th>{t('trash.table.daysLeft')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {deletedStudents.map((s) => {
                const remaining = daysLeft(s.deletedAt);
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-person">
                        <div className="cell-avatar">{initials(s.fullName)}</div>
                        <span className="cell-name">{s.fullName}</span>
                      </div>
                    </td>
                    <td>{s.className}</td>
                    <td className="cell-sub">{s.deletedAt ? s.deletedAt.split('T')[0] : '—'}</td>
                    <td>
                      <span className={`badge ${remaining === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {remaining === 0 ? t('trash.expired') : t('trash.daysLeftLabel', { count: remaining })}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="row-action-btn" title={t('trash.restore')} onClick={() => restoreStudent(s.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        </button>
                        <button className="row-action-btn danger" title={t('trash.deletePermanently')} onClick={() => handlePermanentDelete(s.id, s.fullName)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {deletedStudents.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#94A3B8', padding: '32px' }}>{t('trash.empty')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Trash;
