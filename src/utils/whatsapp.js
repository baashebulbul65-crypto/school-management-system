// utils/whatsapp.js
// "Click-to-chat" WhatsApp links (wa.me) — ma jirto WhatsApp Business API
// automation ah, waxaa loo isticmaalaa kaliya URL scheme-ka guud (wa.me/
// {lambar}?text={fariin}), kaas oo furaya WhatsApp isaga oo fariinta u
// diyaariyay — isticmaaluhu (Owner) wuxuu gacanta ku taabanayaa "Send"
// gudaha WhatsApp lafteeda.

// Somalia (+252) default marka lambarku ku bilaabmo '0' (qaabka guud ee
// dadku isticmaalaan marka la geliyo diiwaan-gelinta), tusaale
// "0615123456" -> "252615123456". Lambarro horeba leh "+252"/"252" ama
// wadan kale (+xxx) waxaa loo daayaa sidoodii (kaliya la nadiifiyaa
// xarfaha aan lambar ahayn).
export function normalizePhoneForWhatsApp(phone) {
  if (!phone) return '';
  const digitsOnly = String(phone).replace(/[^\d]/g, '');
  if (!digitsOnly) return '';
  if (digitsOnly.startsWith('0')) return `252${digitsOnly.slice(1)}`;
  return digitsOnly;
}

// Waxay soo celisaa null haddii lambarku maqan yahay ama uusan sax ahayn
// (si UI-gu u ogaado inuu qariyo/disable gareeyo badhanka).
export function buildWhatsAppLink(phone, message) {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
