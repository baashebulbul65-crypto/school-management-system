// utils/currency.js
// Xarafka (symbol) lacagta la isticmaalayo (Settings > Xogta Dugsiga > Lacagta
// La Isticmaalo) — CURRENCIES ee Settings.jsx waxay kaydiyaan qiimaha oo dhan
// ("SOS (Shilin Soomaali)"), ma aha kod gaaban (ISO code) oo kaliya, sidaas
// darteed halkan waa la kala saaraa xarafka la muujiyo (Currency setting was
// dead, Settings audit HIGH, 2026-08-26 — meel kasta oo lacag lagu muujiyo
// waxay ahaayeen "$" adag, iyada oo aan la eegin doorashadan).

const CURRENCY_SYMBOLS = {
  USD: '$',
  'SOS (Shilin Soomaali)': 'Sh',
  'ETB (Birr)': 'Br',
};

export function currencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] || '$';
}
