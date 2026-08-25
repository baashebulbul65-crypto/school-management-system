import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './BackButton.css';

// Badhanka "Noqo" — hal style oo qura oo loo isticmaalo dhammaan bogagga
// Dashboard-ka (Back-button audit, 2026-08-25). Hore waxay ahaayeen laba
// style oo kala duwan: (1) grey + qoraal dheer ("Ku Noqo Dashboard-ka",
// 13 bog) iyo (2) ClassDetailModal cas + "Noqo" (hal-meel-oo-qura). Waxaa
// la doortay in dhammaantood loo beddelo style (2) — fiiri qoraal-hadalka
// user-ka ee audit-ka. `to` (route) waxaa la isticmaalaa marka badhanku
// navigate-gareynayo; `onClick` waxaa la isticmaalaa marka kale (tusaale
// ClassDetailModal oo xiraya overlay-ga, ma aha navigate).
function BackButton({ to, onClick }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleClick = onClick || (() => navigate(to));

  return (
    <button type="button" className="btn-back" onClick={handleClick}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      {t('common.back')}
    </button>
  );
}

export default BackButton;
