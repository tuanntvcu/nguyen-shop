import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const localeNames = ['de', 'es', 'fr', 'pt-PT'];
const additionalLocaleNames = ['pt-BR'];
const activeNamespaces = [
  'storefront',
  'altaeron_home',
  'altaeron_pdp_reels_v2',
  'altaeron_pdp_reels_v3',
  'altaeron_pdp_dialfit',
];

const readLocale = async (name) =>
  JSON.parse((await readFile(`locales/${name}.json`, 'utf8')).replace(/^\s*\/\*[\s\S]*?\*\//, ''));

const flatten = (value, prefix = '', result = {}) => {
  for (const [key, child] of Object.entries(value ?? {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, fullKey, result);
    else result[fullKey] = child;
  }
  return result;
};

const hasPath = (value, key) =>
  key.split('.').every((part) => {
    if (!value || typeof value !== 'object' || !(part in value)) return false;
    value = value[part];
    return true;
  });

const english = await readLocale('en.default');
for (const localeName of [...localeNames, ...additionalLocaleNames]) {
  const locale = await readLocale(localeName);
  for (const namespace of activeNamespaces) {
    const expected = flatten(english[namespace], namespace);
    const actual = flatten(locale[namespace], namespace);
    const missing = Object.keys(expected).filter((key) => !(key in actual));
    assert.deepEqual(missing, [], `${localeName}: missing active storefront keys in ${namespace}`);
  }
}

for (const localeName of localeNames) {
  const locale = await readLocale(localeName);
  const expected = flatten(english.altaeron_pdp_cro_v1, 'altaeron_pdp_cro_v1');
  const actual = flatten(locale.altaeron_pdp_cro_v1, 'altaeron_pdp_cro_v1');
  const missing = Object.keys(expected).filter((key) => !(key in actual));
  assert.deepEqual(missing, [], `${localeName}: missing legacy CRO PDP keys`);
}

const liquidDirectories = ['layout', 'sections', 'snippets'];
const liquidFiles = [];
for (const directory of liquidDirectories) {
  for (const filename of await readdir(directory)) {
    if (filename.endsWith('.liquid')) liquidFiles.push(path.join(directory, filename));
  }
}

const literalKeys = new Set();
for (const filename of liquidFiles) {
  const source = await readFile(filename, 'utf8');
  for (const match of source.matchAll(/'([a-zA-Z0-9_.-]+)'\s*\|\s*t\b/g)) {
    if (!match[1].startsWith('.')) literalKeys.add(match[1]);
  }
}

for (const localeName of localeNames) {
  const locale = await readLocale(localeName);
  const missing = [...literalKeys].filter((key) => !hasPath(locale, key));
  assert.deepEqual(missing, [], `${localeName}: missing literal translation keys`);
}

const announcement = await readFile('sections/announcement-bar.liquid', 'utf8');
assert.match(announcement, /gap:\s*19px/);
assert.match(announcement, /padding-right:\s*19px/);
assert.match(announcement, /translate3d\(-50%, 0, 0\)/);

console.log(`Storefront localization passed for ${localeNames.join(', ')}.`);
