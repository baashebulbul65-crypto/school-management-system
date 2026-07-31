import './StatCard.css';

function StatCard({ label, value, change, changeType = 'up', icon, accent = 'mint', onClick, actionLabel }) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      className={`stat-card accent-${accent}${onClick ? ' stat-card-clickable' : ''}`}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <div className="stat-card-top">
        <div className="stat-icon">{icon}</div>
        {change && (
          <div className={`stat-change ${changeType}`}>
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {changeType === 'up'
                ? <path d="M18 15l-6-6-6 6" />
                : <path d="M6 9l6 6 6-6" />}
            </svg>
            {change}
          </div>
        )}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {onClick && <div className="stat-card-action">{actionLabel || 'Eeg Faahfaahin →'}</div>}
    </Wrapper>
  );
}

export default StatCard;