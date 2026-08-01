// utils/somaliDate.js
// Helper-yo la wadaago dhammaan bogagga u baahan taariikhda maanta Soomaali ahaan.

export const SOMALI_DAYS = ['Axad', 'Isniin', 'Talaado', 'Arbaco', 'Khamiis', 'Jimce', 'Sabti'];
export const SOMALI_MONTHS = [
  'Janaayo', 'Febraayo', 'Maarso', 'Abriil', 'Maajo', 'Juun',
  'Luulyo', 'Ogosto', 'Sebtembar', 'Oktoobar', 'Nofembar', 'Disembar',
];

export function todaySomaliDayName() {
  return SOMALI_DAYS[new Date().getDay()];
}

export function todayISODate() {
  return new Date().toISOString().split('T')[0];
}

export function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

export function formatTodaySomali() {
  const d = new Date();
  return `${SOMALI_DAYS[d.getDay()]}, ${d.getDate()} ${SOMALI_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDMY(isoString) {
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}
