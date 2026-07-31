// scripts/check-i18n.mjs
// Static check: every t('...') call in src/ must resolve to a real key in
// BOTH locale files (so.json, ar.json). Catches the class of bug where a
// page ships with translation keys that were never added to the locales
// (e.g. Messages.jsx originally used `messages.*` keys that didn't exist).
//
// Usage: node scripts/check-i18n.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');

const LOCALES = {
  so: JSON.parse(fs.readFileSync(path.join(srcDir, 'i18n/locales/so.json'), 'utf8')),
  ar: JSON.parse(fs.readFileSync(path.join(srcDir, 'i18n/locales/ar.json'), 'utf8')),
};

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'i18n') continue; // locale data itself, not source using t()
      walk(full, files);
    } else if (/\.jsx?$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function resolvePath(obj, keyPath) {
  let cur = obj;
  for (const part of keyPath.split('.')) {
    if (cur == null || typeof cur !== 'object' || !(part in cur)) return undefined;
    cur = cur[part];
  }
  return cur;
}

// Matches t('a.b.c'), t("a.b.c", {..}), t(`a.b.${dynamic}`)
const CALL_RE = /\bt\(\s*(['"`])((?:(?!\1)[\s\S])*)\1/g;

const files = walk(srcDir);
let missingCount = 0;

for (const file of files) {
  const rel = path.relative(root, file);
  const content = fs.readFileSync(file, 'utf8');
  let match;
  CALL_RE.lastIndex = 0;
  while ((match = CALL_RE.exec(content))) {
    const raw = match[2];
    const isDynamic = raw.includes('${');
    const key = isDynamic ? raw.split('${')[0].replace(/\.$/, '') : raw;
    if (!key) continue; // fully dynamic key (e.g. t(someVar)), nothing static to check

    const line = content.slice(0, match.index).split('\n').length;

    for (const [locale, data] of Object.entries(LOCALES)) {
      const resolved = resolvePath(data, key);
      // For dynamic keys we can only confirm the namespace object exists,
      // not every possible interpolated value.
      const ok = isDynamic ? resolved && typeof resolved === 'object' : resolved !== undefined;
      if (!ok) {
        missingCount++;
        console.log(`[${locale}] missing "${key}"${isDynamic ? ' (namespace)' : ''} — ${rel}:${line}`);
      }
    }
  }
}

if (missingCount === 0) {
  console.log('i18n check passed — every t() key resolves in so.json and ar.json.');
  process.exit(0);
} else {
  console.log(`\n${missingCount} missing translation(s).`);
  process.exit(1);
}
