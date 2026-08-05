import fs from 'node:fs/promises';

const shop = process.env.SHOPIFY_STORE;
const clientId = process.env.SHOPIFY_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
const themeId = process.env.SHOPIFY_THEME_ID;
const apiVersion = '2026-07';
if (!shop || !clientId || !clientSecret || !themeId) throw new Error('Missing Shopify environment variables.');

const filenames = [
  'assets/altaeron-home.css',
  'assets/altaeron-home.js',
  'config/settings_data.json',
  'config/settings_schema.json',
  'sections/altaeron-home.liquid',
  'sections/announcement-bar.liquid',
  'sections/footer-group.json',
  'sections/footer.liquid',
  'sections/header-group.json',
  'sections/header.liquid',
  'snippets/altaeron-home-product.liquid',
  'templates/index.json',
  'templates/product.altaeron.json',
];

const oauthResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
});
if (!oauthResponse.ok) throw new Error(`OAuth failed (${oauthResponse.status}).`);
const { access_token: token } = await oauthResponse.json();
async function gql(query, variables, label) {
  const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token }, body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(`${label}: ${JSON.stringify(payload.errors || payload)}`);
  return payload.data;
}

const gid = themeId.startsWith('gid://') ? themeId : `gid://shopify/OnlineStoreTheme/${themeId}`;
const before = await gql(`query ThemeFiles($id: ID!, $filenames: [String!]) {
  theme(id: $id) { id name role files(first: 50, filenames: $filenames) { nodes { filename checksumMd5 body { ... on OnlineStoreThemeFileBodyText { content } ... on OnlineStoreThemeFileBodyBase64 { contentBase64 } ... on OnlineStoreThemeFileBodyUrl { url } } } } }
}`, { id: gid, filenames }, 'Read development theme files');
await fs.mkdir('tmp/homepage-audit/theme-before', { recursive: true });
await fs.writeFile('tmp/homepage-audit/theme-before/manifest.json', JSON.stringify(before, null, 2));
for (const file of before.theme.files.nodes) {
  const value = file.body.content ?? file.body.contentBase64;
  if (value != null) {
    const safeName = file.filename.replaceAll('/', '__');
    await fs.writeFile(`tmp/homepage-audit/theme-before/${safeName}`, value, file.body.contentBase64 ? 'base64' : 'utf8');
  }
}

const files = await Promise.all(filenames.map(async (filename) => ({ filename, body: { type: 'TEXT', value: await fs.readFile(filename, 'utf8') } })));
const result = await gql(`mutation UpsertThemeFiles($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
  themeFilesUpsert(themeId: $themeId, files: $files) { upsertedThemeFiles { filename } job { id done } userErrors { field message } }
}`, { themeId: gid, files }, 'Upsert development theme files');
if (result.themeFilesUpsert.userErrors.length) throw new Error(JSON.stringify(result.themeFilesUpsert.userErrors));
await fs.writeFile('tmp/homepage-audit/theme-upsert-result.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ theme: before.theme.name, role: before.theme.role, files: result.themeFilesUpsert.upsertedThemeFiles.map((file) => file.filename), job: result.themeFilesUpsert.job }, null, 2));
