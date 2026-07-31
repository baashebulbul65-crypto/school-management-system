// firebase/schools.js
// Doc-ka dugsiga ee Firestore ("schools/{schoolCode}") — deterministic doc id
// (schoolCode-ka lafteeda, ma aha auto-id + query sida hore) si:
//   1) uploadLogo/settings-ku u shaqeeyaan mar kasta, xitaa marka doc-ku
//      uusan weli jirin (setDoc + merge:true wuxuu abuuraa haddii uusan
//      jirin, cusbooneysiiyaa haddii uu jiro) — kahor waxaa jiri jiray bug
//      "SCHOOL_LAMA_HELIN" oo logo upload-ku had iyo jeer ku fashilmi jiray
//      maadaama aan wax weligood abuurin doc-kan.
//   2) aan loo baahnayn query si loo helo doc-ka (getDoc toos ah).
//
// Fields: schoolCode, name, code, address, phone, email, logo,
// currency, timezone, academicYear{start,end}, feesByGrade[], notificationPrefs{...}.
// ('language' GA MAAHAN halkan — waa doorasho shakhsi ah oo browser-ka lagu
// kaydiyo, ma aha xog dugsi-guud ah, fiiri SettingsContext.jsx).

import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './config';

const COLLECTION = 'schools';

export function subscribeToSchool(schoolCode, onChange, onError) {
  return onSnapshot(
    doc(db, COLLECTION, schoolCode),
    (snap) => onChange(snap.exists() ? snap.data() : null),
    onError
  );
}

export async function findSchoolByCode(schoolCode) {
  const snap = await getDoc(doc(db, COLLECTION, schoolCode));
  return snap.exists() ? snap.data() : null;
}

export async function upsertSchoolSettings(schoolCode, data) {
  await setDoc(doc(db, COLLECTION, schoolCode), { ...data, schoolCode }, { merge: true });
}

export async function updateSchoolLogo(schoolCode, logoBase64) {
  await upsertSchoolSettings(schoolCode, { logo: logoBase64 });
}
