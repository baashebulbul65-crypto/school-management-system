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

// MUHIIM: waxaa la isticmaalaa qiimayaasha SAXDA AH ee taariikhda MAANTA
// (getFullYear/getMonth/getDate), MA AHA toISOString() — kaas oo UTC ah oo
// kartida ku ridi kara maalin/bil qaldan wakhtiyada u dhow saqda dhexe
// (tusaale: saacadaha ugu horreeya ee maalin/bil cusub ee waqtiga
// maxalliga ah, UTC-du weli waxay ku jirtaa maalin/bil hore, sidaas
// darteed calendarku qalday haddii toISOString() la isticmaalo).
function pad2(n) {
  return String(n).padStart(2, '0');
}

export function todayISODate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

// "N maalmood ka hor maanta" (local time, ma aha UTC) — waxaa loo isticmaalaa
// xudduudaha warbixinnada toddobaad/bil/sano (fiiri Attendance.jsx), si aan
// isla bug-ka toISOString() ee kore looga dhicin xisaabinta xudduudka.
export function isoDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Taariikhda "Axad-ka" (bilowga toddobaadka calendar-ka) ee toddobaadka uu
// ku jiro taariikhda la siiyay — waxaa loo isticmaalaa Reports.jsx si xogta
// imaanshaha loogu kooban toddobaadyo dhab ah (calendar), ma aha kaliya
// in la kala googooyo taariikhaha xogtu ku jirto 7-7 ah (kaas oo qalda
// haddii maalmo aan xog lahayn ay ka dhex jiraan, sida weekend/fasax).
// Waxaa la parse-gareeyaa qaybaha (year/month/day) si toos ah halkii la
// isticmaali lahaa `new Date(isoString)` — taasoo UTC ahaan u fasiran
// karta, oo maalinta beddeli karta wakhtiyada ku dhow saqda dhexe.
export function weekStartISODate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - date.getDay());
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
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
