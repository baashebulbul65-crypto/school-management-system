// functions/index.js
// Cloud Functions — kaliya shaqo GOONI ah oo aan client-ka (browser SDK) awoodin
// inuu sameeyo: tirtiridda account-ka Firebase Auth ee qof KALE.

const { onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

initializeApp();

// Marka doc-ka "users/{uid}" la tirtiro (Users.jsx "Ka Saar" -> firebase/staff.js:
// removeStaffDoc) — SDK-ga browser-ku (client-side) qof kale kama tirtiri/kama
// xannibi karo Firebase Auth account (xad SDK-ga, ma aha khalad koodh: haddii
// kale browser kastaa wuxuu heli lahaa awood uu ku tirtiro isticmaale kasta).
// Function-kan (Admin SDK, server-side, ku shaqeeya kaliya marka doc-ga
// dhabta ah la tirtiro) ayaa isla markiiba tirtira Auth account-ka isla
// uid-kan, si qofka la saaray uusan waligiis dib ugu login gelin karin
// (email/password-kiisii hore) — fiiri ProtectedRoute.jsx oo horeba
// xannibaya inuu galo dashboard-ka intii lagu sugayo function-kan, laakiin
// account-ka Auth-ka lafteeda wuu sii jirayay ilaa function-kan la deploy-geliyo.
exports.cleanupAuthOnUserDelete = onDocumentDeleted('users/{uid}', async (event) => {
  const uid = event.params.uid;
  try {
    await getAuth().deleteUser(uid);
  } catch (err) {
    // 'auth/user-not-found' — doc-gu horeba uma jirin Auth account (tusaale
    // xog tijaabo/seed ah), ma aha khalad run ah, ha boodo aamusnaan.
    if (err.code !== 'auth/user-not-found') {
      console.error(`Khalad ayaa dhacay markii Auth account ${uid} la tirtirayay:`, err);
      throw err;
    }
  }
});
