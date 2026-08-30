import fs from 'node:fs/promises';

const shop = process.env.SHOPIFY_STORE;
const clientId = process.env.SHOPIFY_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
const requestedThemeId = process.env.SHOPIFY_THEME_ID;
const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-07';
if (!shop || !clientId || !clientSecret) throw new Error('Missing Shopify credentials.');

const filenames = [
  'assets/altaeron-pdp.css',
  'assets/altaeron-pdp.js',
  'locales/en.default.json',
  'sections/altaeron-pdp.liquid',
  'snippets/altaeron-pdp-card.liquid',
  'snippets/altaeron-pdp-icon.liquid',
  'snippets/altaeron-pdp-media.liquid',
  'snippets/altaeron-pdp-review-cards.liquid',
  'templates/product.altaeron.json',
  'templates/product.altaeron-cro-v1.json',
];

const oauth = await fetch(`https://${shop}/admin/oauth/access_token`, {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
});
if (!oauth.ok) throw new Error(`Shopify OAuth failed (${oauth.status}).`);
const { access_token: token } = await oauth.json();

async function gql(query, variables = {}, label = 'GraphQL operation') {
  const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token }, body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(`${label}: ${JSON.stringify(payload.errors || payload)}`);
  return payload.data;
}

const themeState = await gql(`query PdpThemes { themes(first: 50) { nodes { id name role updatedAt } } }`, {}, 'Read themes');
let theme = requestedThemeId
  ? themeState.themes.nodes.find((item) => item.id.endsWith(`/${requestedThemeId}`) || item.id === requestedThemeId)
  : themeState.themes.nodes.filter((item) => item.role === 'DEVELOPMENT').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
if (!theme) throw new Error('No target development theme found.');

const before = await gql(`query PdpThemeFiles($id: ID!, $filenames: [String!]) { theme(id: $id) { id name role files(first: 50, filenames: $filenames) { nodes { filename checksumMd5 body { ... on OnlineStoreThemeFileBodyText { content } ... on OnlineStoreThemeFileBodyBase64 { contentBase64 } ... on OnlineStoreThemeFileBodyUrl { url } } } } } }`, { id: theme.id, filenames }, 'Back up PDP theme files');
const themeNumericId = theme.id.split('/').at(-1);
const backupDirectory = `tmp/pdp-audit/theme-before-${themeNumericId}`;
await fs.mkdir(backupDirectory, { recursive: true });
await fs.writeFile(`${backupDirectory}/manifest.json`, JSON.stringify(before, null, 2));
for (const file of before.theme.files.nodes) {
  const content = file.body.content ?? file.body.contentBase64;
  if (content == null) continue;
  await fs.writeFile(`${backupDirectory}/${file.filename.replaceAll('/', '__')}`, content, file.body.contentBase64 ? 'base64' : 'utf8');
}

const files = await Promise.all(filenames.map(async (filename) => ({ filename, body: { type: 'TEXT', value: await fs.readFile(filename, 'utf8') } })));
const mutation = `mutation UpsertPdpThemeFiles($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) { themeFilesUpsert(themeId: $themeId, files: $files) { upsertedThemeFiles { filename } job { id done } userErrors { field message } } }`;
// Sections must be present before templates that instantiate newly added block types.
const sectionFiles = files.filter((file) => !file.filename.startsWith('templates/'));
const templateFiles = files.filter((file) => file.filename.startsWith('templates/'));
const sectionResult = await gql(mutation, { themeId: theme.id, files: sectionFiles }, 'Deploy PDP section files');
if (sectionResult.themeFilesUpsert.userErrors.length) throw new Error(JSON.stringify(sectionResult.themeFilesUpsert.userErrors));
const templateResult = await gql(mutation, { themeId: theme.id, files: templateFiles }, 'Deploy PDP template files');
if (templateResult.themeFilesUpsert.userErrors.length) throw new Error(JSON.stringify(templateResult.themeFilesUpsert.userErrors));
const deployedFiles = [...sectionResult.themeFilesUpsert.upsertedThemeFiles, ...templateResult.themeFilesUpsert.upsertedThemeFiles];
const report = {
  theme, files: deployedFiles.map((file) => file.filename), job: templateResult.themeFilesUpsert.job,
  backupDirectory,
  previewUrl: `https://${shop}/products/adjustable-bunion-corrector?preview_theme_id=${themeNumericId}`,
};
await fs.writeFile('tmp/pdp-audit/theme-deploy-result.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
