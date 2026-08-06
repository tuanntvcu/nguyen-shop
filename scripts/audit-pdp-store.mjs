import fs from 'node:fs/promises';

const shop = process.env.SHOPIFY_STORE;
const clientId = process.env.SHOPIFY_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-07';

if (!shop || !clientId || !clientSecret) {
  throw new Error('SHOPIFY_STORE, SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET are required.');
}

const oauth = await fetch(`https://${shop}/admin/oauth/access_token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  }),
});

if (!oauth.ok) throw new Error(`Shopify OAuth failed (${oauth.status}).`);
const { access_token: token } = await oauth.json();

async function gql(query, variables = {}, label = 'GraphQL operation') {
  const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(`${label}: ${JSON.stringify(payload.errors || payload)}`);
  }
  return payload.data;
}

const inventory = await gql(`#graphql
  query PdpStoreAudit {
    shop {
      id
      name
      myshopifyDomain
      primaryDomain { host url }
      currencyCode
      metafields(first: 100) { nodes { id namespace key type value } }
    }
    products(first: 100, sortKey: TITLE) { nodes { id title handle status } }
    productDefinitions: metafieldDefinitions(first: 250, ownerType: PRODUCT) {
      nodes { id namespace key name description ownerType type { name category } pinnedPosition validations { name value } }
    }
    shopDefinitions: metafieldDefinitions(first: 100, ownerType: SHOP) {
      nodes { id namespace key name description ownerType type { name category } pinnedPosition validations { name value } }
    }
    metaobjectDefinitions(first: 100) {
      nodes { id type name description fieldDefinitions { key name description required type { name } validations { name value } } }
    }
    files(first: 100, query: "id:27758272446525") {
      nodes {
        id
        alt
        createdAt
        fileStatus
        ... on Video { duration sources { url mimeType format height width } preview { image { url width height } } }
      }
    }
    themes(first: 50) { nodes { id name role createdAt updatedAt } }
    currentAppInstallation { id launchUrl accessScopes { handle } }
  }
`, {}, 'Read PDP store inventory');

const products = [];
for (const productStub of inventory.products.nodes) {
  const data = await gql(`#graphql
    query ProductPdpAudit($id: ID!) {
      product(id: $id) {
        id title handle status productType vendor templateSuffix tags descriptionHtml createdAt updatedAt totalInventory
        options { id name position optionValues { id name hasVariants } }
        variants(first: 100) { nodes { id title sku availableForSale inventoryQuantity price compareAtPrice selectedOptions { name value } } }
        media(first: 100) { nodes { id mediaContentType alt status preview { image { id url width height altText } } ... on MediaImage { image { id url width height altText } } ... on Video { duration sources { url mimeType format height width } } ... on ExternalVideo { host originUrl embedUrl } } }
        metafields(first: 250) { nodes { id namespace key type value description reference { __typename ... on MediaImage { id image { url width height altText } } ... on Video { id duration sources { url mimeType format height width } preview { image { url width height } } } } references(first: 50) { nodes { __typename ... on Product { id title handle } ... on MediaImage { id image { url width height altText } } ... on Video { id duration sources { url mimeType format height width } } ... on Metaobject { id handle type displayName fields { key type value } } } } } }
        collections(first: 25) { nodes { id title handle } }
      }
    }
  `, { id: productStub.id }, `Read ${productStub.handle}`);
  products.push(data.product);
}
inventory.products.nodes = products;

const activeProducts = inventory.products.nodes.filter((product) => product.status === 'ACTIVE');
const judgeMe = activeProducts.map((product) => {
  const fields = product.metafields.nodes.filter((field) => field.namespace.toLowerCase().includes('judgeme'));
  return { handle: product.handle, fields: fields.map(({ namespace, key, type, value }) => ({ namespace, key, type, value })) };
});

const summary = {
  generatedAt: new Date().toISOString(),
  apiVersion,
  shop: {
    name: inventory.shop.name,
    myshopifyDomain: inventory.shop.myshopifyDomain,
    primaryDomain: inventory.shop.primaryDomain,
    currencyCode: inventory.shop.currencyCode,
  },
  activeProducts: activeProducts.map((product) => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    productType: product.productType,
    templateSuffix: product.templateSuffix,
    variants: product.variants.nodes.length,
    availableVariants: product.variants.nodes.filter((variant) => variant.availableForSale).length,
    media: product.media.nodes.length,
    collections: product.collections.nodes.map((collection) => collection.handle),
    metafieldCount: product.metafields.nodes.length,
    judgeMeFields: judgeMe.find((entry) => entry.handle === product.handle)?.fields.map((field) => field.key) || [],
  })),
  productDefinitionCount: inventory.productDefinitions.nodes.length,
  shopDefinitionCount: inventory.shopDefinitions.nodes.length,
  metaobjectDefinitionCount: inventory.metaobjectDefinitions.nodes.length,
  placeholderFiles: inventory.files.nodes.map((file) => ({ id: file.id, fileStatus: file.fileStatus, duration: file.duration, sources: file.sources?.length || 0 })),
  themes: inventory.themes.nodes,
  appScopes: inventory.currentAppInstallation?.accessScopes.map((scope) => scope.handle) || [],
};

await fs.mkdir('tmp/pdp-audit', { recursive: true });
await Promise.all([
  fs.writeFile('tmp/pdp-audit/store-inventory.json', JSON.stringify(inventory, null, 2)),
  fs.writeFile('tmp/pdp-audit/summary.json', JSON.stringify(summary, null, 2)),
  fs.writeFile('tmp/pdp-audit/judgeme-inventory.json', JSON.stringify(judgeMe, null, 2)),
]);

console.log(JSON.stringify(summary, null, 2));
