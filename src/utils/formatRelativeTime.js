// Beddela taariikh ISO ah una rogo qoraal fudud sida "8 daqiiqo kahor"
export function formatRelativeTime(isoString) {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Hadda';
  if (diffMin < 60) return `${diffMin} daqiiqo kahor`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} saacadood kahor`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} maalmood kahor`;

  return then.toISOString().split('T')[0];
}