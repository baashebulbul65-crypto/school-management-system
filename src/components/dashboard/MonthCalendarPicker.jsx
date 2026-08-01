import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './MonthCalendarPicker.css';

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Bishii/Sanadka la doortay ee Xisaabaadka Finance — hore waxaa la isticmaali
// jiray <input type="month">, kaas oo browser-adka qaarkood (Firefox, iwm)
// ku tusi kara sanad+bil oo kaliya, isaga oo aan waligiis tusin maalmaha
// bisha (calendar dhab ah). Halkan waxaan ku dhisnay calendar-ka dhabta ah
// oo tusaya maalmaha bisha la doortay, si kastaba ha ahaatee doorashadu
// waxay wali ku xiran tahay heerka BISHA (Finance-gu bil-bil ayuu u shaqeeyaa,
// ma aha maalin-maalin).
function MonthCalendarPicker({ value, onChange }) {
  const { t } = useTranslation();
  const dayNames = t('common.dayNames', { returnObjects: true });
  const monthNames = t('common.monthNames', { returnObjects: true });

  const [yearStr, monthStr] = value.split('-');
  const selectedYear = Number(yearStr);
  const selectedMonthIdx = Number(monthStr) - 1;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedYear);
  const [viewMonth, setViewMonth] = useState(selectedMonthIdx);
  const wrapRef = useRef(null);

  useEffect(() => {
    setViewYear(selectedYear);
    setViewMonth(selectedMonthIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;
    const handleOutsideClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); } else setViewMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); } else setViewMonth((m) => m + 1);
  };

  const applySelection = () => {
    onChange(`${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`);
    setOpen(false);
  };

  const today = new Date();
  const isTodayInView = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  return (
    <div className="mcp-wrap" ref={wrapRef}>
      <button type="button" className="acc-month-picker mcp-trigger" onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        {monthNames[selectedMonthIdx]} {selectedYear}
      </button>

      {open && (
        <div className="mcp-panel">
          <div className="mcp-panel-header">
            <button type="button" className="mcp-nav-btn" onClick={goPrevMonth}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="mcp-panel-title">{monthNames[viewMonth]} {viewYear}</span>
            <button type="button" className="mcp-nav-btn" onClick={goNextMonth}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          <div className="mcp-weekdays">
            {dayNames.map((d) => <span key={d}>{d.slice(0, 2)}</span>)}
          </div>

          <div className="mcp-days-grid">
            {cells.map((d, i) => (
              <button
                type="button"
                key={i}
                className={`mcp-day ${d === null ? 'mcp-day-empty' : ''} ${isTodayInView && d === today.getDate() ? 'mcp-day-today' : ''}`}
                disabled={d === null}
                onClick={applySelection}
              >
                {d || ''}
              </button>
            ))}
          </div>

          <button type="button" className="mcp-confirm-btn" onClick={applySelection}>
            {t('common.select')} {monthNames[viewMonth]} {viewYear}
          </button>
        </div>
      )}
    </div>
  );
}

export default MonthCalendarPicker;
