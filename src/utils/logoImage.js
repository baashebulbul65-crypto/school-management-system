// utils/logoImage.js
// Sawirka logo-ga waxaa loo beddelaa base64 oo lagu kaydiyo Firestore document-ka
// (Firestore document kasta wuxuu leeyahay xad ah 1MB, sidaas darteed sawirku waa
// inuu ahaadaa mid yar oo ka yar 500KB si base64-giisu uusan ka dhaafin xadka).

const MAX_LOGO_SIZE_BYTES = 500 * 1024; // 500KB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];

export function validateLogoFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Nooca faylka lama aqbalo. Isticmaal PNG, JPG, WEBP ama SVG.');
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    throw new Error('Sawirku waa inuu ka yar yahay 500KB.');
  }
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Lama akhriyi karo faylka la doortay.'));
    reader.readAsDataURL(file);
  });
}
