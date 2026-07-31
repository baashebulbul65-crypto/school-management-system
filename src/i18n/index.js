// i18n/index.js
// Isku dhaqaajinta nidaamka turjumaadda (i18next). Luuqadaha la taageero hadda:
// 'so' (Soomaali, LTR, default) iyo 'ar' (Carabi, RTL). 'en' waxay dib ugu
// noqonaysaa 'so' ilaa turjumaad Ingiriisi ah la sameeyo.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import so from './locales/so.json';
import ar from './locales/ar.json';

export const RTL_LANGUAGES = ['ar'];

i18n
  .use(initReactI18next)
  .init({
    resources: {
      so: { translation: so },
      ar: { translation: ar },
    },
    lng: 'so',
    fallbackLng: 'so',
    interpolation: { escapeValue: false },
  });

export function applyDirection(language) {
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = language;
}

export default i18n;
