import fs from 'node:fs/promises';

const shop = process.env.SHOPIFY_STORE;
const clientId = process.env.SHOPIFY_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
const apiVersion = '2026-07';
if (!shop || !clientId || !clientSecret) throw new Error('SHOPIFY_STORE, SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET are required.');

const oauth = await fetch(`https://${shop}/admin/oauth/access_token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
});
if (!oauth.ok) throw new Error(`OAuth failed (${oauth.status}).`);
const { access_token: token } = await oauth.json();

async function gql(query, variables = {}, label = 'GraphQL operation') {
  const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(`${label}: ${JSON.stringify(payload.errors || payload)}`);
  const root = Object.values(payload.data || {})[0];
  if (root?.userErrors?.length) throw new Error(`${label}: ${JSON.stringify(root.userErrors)}`);
  return payload.data;
}

const audit = await gql(`query HomepageState {
  products(first: 50) { nodes { id title handle featuredMedia { preview { image { url altText } } } metafields(first: 50) { nodes { namespace key type value } } } }
  collections(first: 50) { nodes { id title handle descriptionHtml image { url altText } products(first: 50) { nodes { id } } } }
  menus(first: 30) { nodes { id handle title items { title type url resourceId items { title type url resourceId } } } }
  metafieldDefinitions(first: 100, ownerType: PRODUCT, namespace: "custom") { nodes { id namespace key name type { name } } }
}`, {}, 'Pre-mutation audit');

await fs.mkdir('tmp/homepage-audit', { recursive: true });
await fs.writeFile('tmp/homepage-audit/graphql-state-before-mutations.json', JSON.stringify(audit, null, 2));

const definitions = [
  ['concern', 'Concern', 'single_line_text_field'],
  ['short_benefit', 'Short benefit', 'single_line_text_field'],
  ['product_badge', 'Homepage badge', 'single_line_text_field'],
  ['quiz_tags', 'Quiz tags', 'list.single_line_text_field'],
];
const existingDefinitionKeys = new Set(audit.metafieldDefinitions.nodes.map((item) => item.key));
for (const [key, name, type] of definitions) {
  if (existingDefinitionKeys.has(key)) continue;
  await gql(`mutation CreateDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) { createdDefinition { id key } userErrors { field message } }
  }`, { definition: { namespace: 'custom', key, name, type, ownerType: 'PRODUCT', pin: true } }, `Create metafield definition custom.${key}`);
}

const productPlans = [
  { id: 'gid://shopify/Product/7950010253373', title: 'Adjustable Bunion Corrector', handle: 'adjustable-bunion-corrector', concern: 'Bunion & Toe Alignment', benefit: 'Adjustable toe support for everyday comfort.', tags: ['bunion', 'toe', 'adjustable'], collection: 'bunion-toe-alignment' },
  { id: 'gid://shopify/Product/7950822867005', title: 'Breathable Bunion Support', handle: 'breathable-bunion-support', concern: 'Bunion & Toe Alignment', benefit: 'Breathable support with soft cushioning.', tags: ['bunion', 'toe', 'gentle'], collection: 'bunion-toe-alignment' },
  { id: 'gid://shopify/Product/7950824439869', title: 'Rotating Toe Alignment Support', handle: 'rotating-toe-alignment-support', concern: 'Bunion & Toe Alignment', benefit: 'Adjustable alignment support for the big toe.', tags: ['bunion', 'toe', 'adjustable'], collection: 'bunion-toe-alignment' },
  { id: 'gid://shopify/Product/7950824505405', title: 'Plantar Fasciitis Night Splint Sock', handle: 'plantar-fasciitis-night-splint-sock', concern: 'Heel & Plantar Fascia', benefit: 'Nighttime support for the heel and plantar fascia.', tags: ['heel', 'plantar-fascia', 'night'], collection: 'heel-plantar-fascia' },
  { id: 'gid://shopify/Product/7950824538173', title: 'Ankle Support with Side Stabilizers', handle: 'ankle-support-side-stabilizers', concern: 'Ankle Support', benefit: 'Side stabilizers provide adjustable ankle support.', tags: ['ankle', 'stability', 'adjustable'], collection: 'ankle-support' },
  { id: 'gid://shopify/Product/7950824570941', title: 'Electric Foot & Hand Massager', handle: 'electric-foot-hand-massager', concern: 'Recovery & Massage', benefit: 'Portable vibration and heat for post-activity relaxation.', tags: ['recovery', 'massage', 'heat'], collection: 'recovery-massage' },
  { id: 'gid://shopify/Product/7950824603709', title: 'Day & Night Bunion Corrector', handle: 'day-night-bunion-corrector', concern: 'Bunion & Toe Alignment', benefit: 'Adjustable support designed for day or night use.', tags: ['bunion', 'toe', 'day', 'night'], collection: 'bunion-toe-alignment' },
];
const productById = new Map(audit.products.nodes.map((item) => [item.id, item]));
const collectionPlans = [
  { title: 'Bunion & Toe Alignment', handle: 'bunion-toe-alignment', descriptionHtml: '<p>Adjustable products designed to support toe alignment and everyday foot comfort.</p>', productId: 'gid://shopify/Product/7950010253373' },
  { title: 'Heel & Plantar Fascia', handle: 'heel-plantar-fascia', descriptionHtml: '<p>Support options for heel and plantar fascia comfort, including nighttime wear.</p>', productId: 'gid://shopify/Product/7950824505405' },
  { title: 'Ankle Support', handle: 'ankle-support', descriptionHtml: '<p>Stabilizing support for everyday movement and ankle confidence.</p>', productId: 'gid://shopify/Product/7950824538173' },
  { title: 'Recovery & Massage', handle: 'recovery-massage', descriptionHtml: '<p>Portable massage tools for relaxation after work, walking, or exercise.</p>', productId: 'gid://shopify/Product/7950824570941' },
];

const collectionsByHandle = new Map(audit.collections.nodes.map((item) => [item.handle, item]));
for (const plan of collectionPlans) {
  if (collectionsByHandle.has(plan.handle)) continue;
  const source = productById.get(plan.productId)?.featuredMedia?.preview?.image;
  const collection = { title: plan.title, handle: plan.handle, descriptionHtml: plan.descriptionHtml, sortOrder: 'MANUAL' };
  if (source?.url) collection.image = { src: source.url, altText: source.altText || `${plan.title} collection` };
  const result = await gql(`mutation CreateCollection($collection: CollectionCreateInput!) {
    collectionCreate(collection: $collection) { collection { id title handle } userErrors { field message } }
  }`, { collection }, `Create collection ${plan.title}`);
  collectionsByHandle.set(plan.handle, result.collectionCreate.collection);
}

for (const plan of productPlans) {
  const collectionId = collectionsByHandle.get(plan.collection)?.id;
  if (!collectionId) throw new Error(`Missing collection ${plan.collection}`);
  await gql(`mutation UpdateProduct($product: ProductUpdateInput!) {
    productUpdate(product: $product) { product { id title handle } userErrors { field message } }
  }`, { product: {
    id: plan.id,
    title: plan.title,
    handle: plan.handle,
    redirectNewHandle: true,
    collectionsToJoin: [collectionId],
    metafields: [
      { namespace: 'custom', key: 'concern', type: 'single_line_text_field', value: plan.concern },
      { namespace: 'custom', key: 'short_benefit', type: 'single_line_text_field', value: plan.benefit },
      { namespace: 'custom', key: 'quiz_tags', type: 'list.single_line_text_field', value: JSON.stringify(plan.tags) },
    ],
  } }, `Update product ${plan.id}`);
}

const mainMenu = audit.menus.nodes.find((menu) => menu.handle === 'main-menu');
if (!mainMenu) throw new Error('Main menu was not found.');
const concernItems = collectionPlans.map((plan) => ({ title: plan.title, type: 'COLLECTION', resourceId: collectionsByHandle.get(plan.handle).id }));
await gql(`mutation UpdateMenu($id: ID!, $title: String!, $handle: String, $items: [MenuItemUpdateInput!]!) {
  menuUpdate(id: $id, title: $title, handle: $handle, items: $items) { menu { id handle title } userErrors { field message } }
}`, { id: mainMenu.id, title: mainMenu.title, handle: mainMenu.handle, items: [
  { title: 'Shop by Concern', type: 'HTTP', url: '/#AltaeronConcerns', items: concernItems },
  { title: 'Shop All', type: 'CATALOG' },
  { title: 'About Us', type: 'HTTP', url: '/#altaeron-values' },
  { title: 'Reviews', type: 'HTTP', url: '/#altaeron-reviews' },
  { title: 'Support', type: 'HTTP', url: '/pages/contact' },
] }, 'Update main menu');

const after = await gql(`query HomepageStateAfter {
  products(first: 50) { nodes { id title handle metafields(first: 20, namespace: "custom") { nodes { namespace key type value } } collections(first: 10) { nodes { id handle title } } } }
  collections(first: 50) { nodes { id title handle productsCount { count } } }
  menus(first: 30) { nodes { id handle title items { title type url resourceId items { title type url resourceId } } } }
}`, {}, 'Post-mutation audit');
await fs.writeFile('tmp/homepage-audit/graphql-state-after-mutations.json', JSON.stringify(after, null, 2));
await fs.writeFile('tmp/homepage-audit/graphql-mutation-summary.json', JSON.stringify({ apiVersion, definitions, collectionPlans, productPlans, menu: 'main-menu' }, null, 2));
console.log(JSON.stringify({ productsUpdated: productPlans.length, collectionsReady: collectionPlans.length, menuUpdated: mainMenu.handle }, null, 2));
