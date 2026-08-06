import fs from 'node:fs/promises';
import path from 'node:path';

const inventory = JSON.parse(await fs.readFile('tmp/pdp-audit/store-inventory.json', 'utf8'));
const roots = ['assets', 'config', 'layout', 'sections', 'snippets', 'templates'];
const files = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(filename);
    else if (/\.(liquid|json|js|css)$/.test(entry.name)) files.push({ filename: filename.replaceAll('\\', '/'), content: await fs.readFile(filename, 'utf8') });
  }
}
for (const root of roots) await walk(root);

const products = inventory.products.nodes;
const definitions = inventory.productDefinitions.nodes.map((definition) => {
  const direct = `${definition.namespace}.${definition.key}`;
  const references = files.filter((file) => file.content.includes(direct) || file.content.includes(`['${definition.key}']`) || file.content.includes(`["${definition.key}"]`)).map((file) => file.filename);
  const populatedProducts = products.filter((product) => product.metafields.nodes.some((field) => field.namespace === definition.namespace && field.key === definition.key && field.value !== '')).map((product) => product.handle);
  const protectedNamespace = ['judgeme', 'reviews', 'swym', 'klaviyo', 'mm-google-shopping', 'mm_google_shopping_extension', 'scaloratheme'].includes(definition.namespace) || definition.namespace.startsWith('app--');
  let decision = 'manual_review';
  let reason = 'No automatic deletion: definition requires merchant review.';
  if (protectedNamespace) { decision = 'retain'; reason = 'App-owned or integration namespace.'; }
  else if (references.length) { decision = 'retain'; reason = 'Referenced by theme code.'; }
  else if (populatedProducts.length) { decision = 'retain'; reason = 'Contains product data; retained for rollback or migration review.'; }
  return { id: definition.id, namespace: definition.namespace, key: definition.key, type: definition.type.name, references, populatedProducts, decision, reason };
});

const report = {
  generatedAt: new Date().toISOString(),
  definitionsAudited: definitions.length,
  retained: definitions.filter((item) => item.decision === 'retain').length,
  manualReview: definitions.filter((item) => item.decision === 'manual_review').length,
  deleted: 0,
  note: 'Dry-run only. No metafield or metaobject definition was deleted.',
  definitions,
};
await fs.writeFile('tmp/pdp-audit/cleanup-dry-run.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ definitionsAudited: report.definitionsAudited, retained: report.retained, manualReview: report.manualReview, deleted: 0 }, null, 2));
