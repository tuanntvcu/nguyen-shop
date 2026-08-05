import fs from 'node:fs/promises';

const shop = process.env.SHOPIFY_STORE;
const clientId = process.env.SHOPIFY_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
const apiVersion = '2026-07';
if (!shop || !clientId || !clientSecret) throw new Error('Missing Shopify credentials.');

const oauth = await fetch(`https://${shop}/admin/oauth/access_token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
});
if (!oauth.ok) throw new Error(`OAuth failed (${oauth.status}).`);
const { access_token: token } = await oauth.json();

async function gql(query, variables = {}) {
  const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(JSON.stringify(payload.errors || payload));
  return payload.data;
}

const candidateIds = ['Video', 'MediaImage', 'GenericFile'].map((type) => `gid://shopify/${type}/27758272446525`);
const data = await gql(`query LayoutAudit($ids: [ID!]!) {
  nodes(ids: $ids) {
    id
    __typename
    ... on Video { alt status originalSource { url mimeType format height width } sources { url mimeType format height width } preview { image { url altText width height } } }
    ... on MediaImage { alt status image { url altText width height } preview { image { url altText width height } } }
    ... on GenericFile { alt url mimeType fileStatus preview { image { url altText width height } } }
  }
  files(first: 100, sortKey: CREATED_AT, reverse: true) {
    nodes {
      id
      __typename
      alt
      createdAt
      fileStatus
      preview { image { url altText width height } }
      ... on Video { originalSource { url mimeType format height width } sources { url mimeType format height width } }
      ... on MediaImage { image { url altText width height } }
      ... on GenericFile { url mimeType }
    }
  }
  blogs(first: 20) { nodes { id title handle articles(first: 20) { nodes { id title handle image { url altText width height } publishedAt } } } }
  menus(first: 50) { nodes { id title handle items { id title type url resourceId items { id title type url resourceId } } } }
  shop { name contactEmail primaryDomain { url } }
  products(first: 50) { nodes { id title handle status featuredMedia { preview { image { url altText width height } } } media(first: 20) { nodes { id __typename alt preview { image { url altText width height } } } } variants(first: 20) { nodes { id title price compareAtPrice availableForSale } } metafields(first: 50) { nodes { namespace key value type } } } }
}`, { ids: candidateIds });

await fs.mkdir('tmp/homepage-audit', { recursive: true });
await fs.writeFile('tmp/homepage-audit/layout-data-audit.json', JSON.stringify(data, null, 2));
const supplied = data.nodes.filter(Boolean);
const matchingFiles = data.files.nodes.filter((file) => file.id.endsWith('/27758272446525'));
console.log(JSON.stringify({ supplied, matchingFiles, blogs: data.blogs.nodes, menus: data.menus.nodes.map(({ id, title, handle, items }) => ({ id, title, handle, items })), shop: data.shop }, null, 2));
