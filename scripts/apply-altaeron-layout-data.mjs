import fs from 'node:fs/promises';

const shopDomain = process.env.SHOPIFY_STORE;
const clientId = process.env.SHOPIFY_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
const apiVersion = '2026-07';
if (!shopDomain || !clientId || !clientSecret) throw new Error('Missing Shopify credentials.');

const oauth = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
});
if (!oauth.ok) throw new Error(`OAuth failed (${oauth.status}).`);
const { access_token: token } = await oauth.json();

async function gql(query, variables = {}, label = 'GraphQL operation') {
  const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/graphql.json`, {
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

const state = await gql(`query LayoutState {
  shop { id name contactEmail }
  products(first: 50) { nodes { id title handle metafields(first: 50) { nodes { namespace key type value } } } }
  blogs(first: 20) { nodes { id title handle articles(first: 20) { nodes { id title handle image { url altText } metafields(first: 20) { nodes { namespace key type value } } } } } }
  collections(first: 50) { nodes { id title handle } }
  menus(first: 50) { nodes { id title handle items { title type url resourceId items { title type url resourceId } } } }
  metafieldDefinitions(first: 100, ownerType: PRODUCT, namespace: "custom") { nodes { id key type { name } } }
}`, {}, 'Audit layout state');

await fs.mkdir('tmp/homepage-audit', { recursive: true });
await fs.writeFile('tmp/homepage-audit/layout-state-before-mutations.json', JSON.stringify(state, null, 2));

const definitions = [
  { ownerType: 'PRODUCT', key: 'homepage_card_image', name: 'Homepage card image', type: 'file_reference' },
  { ownerType: 'PRODUCT', key: 'short_title', name: 'Homepage short title', type: 'single_line_text_field' },
  { ownerType: 'PRODUCT', key: 'homepage_priority', name: 'Homepage priority', type: 'number_integer' },
  { ownerType: 'ARTICLE', key: 'cover_image', name: 'Homepage cover image', type: 'file_reference' },
  { ownerType: 'SHOP', key: 'homepage_demo_video', name: 'Homepage demonstration video', type: 'file_reference' },
];
for (const definition of definitions) {
  try {
    await gql(`mutation CreateDefinition($definition: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $definition) { createdDefinition { id key } userErrors { field message } } }`, {
      definition: { namespace: 'custom', pin: true, ...definition },
    }, `Create custom.${definition.key}`);
  } catch (error) {
    if (!String(error).includes('already exists') && !String(error).includes('Key is in use')) throw error;
  }
}

const cleanMedia = {
  'adjustable-bunion-corrector': 'gid://shopify/MediaImage/27826304679997',
  'breathable-bunion-support': 'gid://shopify/MediaImage/27833284460605',
  'rotating-toe-alignment-support': 'gid://shopify/MediaImage/27833290948669',
  'plantar-fasciitis-night-splint-sock': 'gid://shopify/MediaImage/27833291178045',
  'ankle-support-side-stabilizers': 'gid://shopify/MediaImage/27833291440189',
  'electric-foot-hand-massager': 'gid://shopify/MediaImage/27833292521533',
  'day-night-bunion-corrector': 'gid://shopify/MediaImage/27833291833405',
};
const shortTitles = {
  'adjustable-bunion-corrector': 'Adjustable Bunion Corrector',
  'breathable-bunion-support': 'Breathable Bunion Support',
  'rotating-toe-alignment-support': 'Rotating Toe Support',
  'plantar-fasciitis-night-splint-sock': 'Plantar Fasciitis Night Splint',
  'ankle-support-side-stabilizers': 'Ankle Support with Stabilizers',
  'electric-foot-hand-massager': 'Foot & Hand Massager',
  'day-night-bunion-corrector': 'Day & Night Bunion Corrector',
};
const productMetafields = state.products.nodes.flatMap((product, index) => cleanMedia[product.handle] ? [
  { ownerId: product.id, namespace: 'custom', key: 'homepage_card_image', type: 'file_reference', value: cleanMedia[product.handle] },
  { ownerId: product.id, namespace: 'custom', key: 'short_title', type: 'single_line_text_field', value: shortTitles[product.handle] },
  { ownerId: product.id, namespace: 'custom', key: 'homepage_priority', type: 'number_integer', value: String(index + 1) },
] : []);
await gql(`mutation SetMetafields($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { metafields { id namespace key value } userErrors { field message code } } }`, { metafields: productMetafields }, 'Set clean product media');

const videoId = 'gid://shopify/Video/27758272446525';
await gql(`mutation SetShopVideo($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { metafields { id key value } userErrors { field message code } } }`, {
  metafields: [{ ownerId: state.shop.id, namespace: 'custom', key: 'homepage_demo_video', type: 'file_reference', value: videoId }],
}, 'Set homepage demo video');

const blog = state.blogs.nodes.find((item) => item.handle === 'news');
const coverByHandle = {
  'what-causes-bunions-and-how-to-treat-them': cleanMedia['adjustable-bunion-corrector'],
  'how-to-relieve-foot-pain-naturally': cleanMedia['electric-foot-hand-massager'],
  'can-bunion-correctors-really-help': cleanMedia['breathable-bunion-support'],
};
const articleMetafields = (blog?.articles.nodes || []).filter((article) => coverByHandle[article.handle]).map((article) => ({
  ownerId: article.id, namespace: 'custom', key: 'cover_image', type: 'file_reference', value: coverByHandle[article.handle],
}));
if (articleMetafields.length) await gql(`mutation SetArticleCovers($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { metafields { id key value } userErrors { field message code } } }`, { metafields: articleMetafields }, 'Set article cover images');

const collections = new Map(state.collections.nodes.map((item) => [item.handle, item]));
const menus = new Map(state.menus.nodes.map((item) => [item.handle, item]));
const concernItems = ['bunion-toe-alignment', 'heel-plantar-fascia', 'ankle-support', 'recovery-massage'].map((handle) => ({
  title: collections.get(handle).title, type: 'COLLECTION', resourceId: collections.get(handle).id,
}));
const updateMenu = async (handle, items) => {
  const menu = menus.get(handle);
  if (!menu) throw new Error(`Menu ${handle} is missing.`);
  await gql(`mutation UpdateMenu($id: ID!, $title: String!, $handle: String, $items: [MenuItemUpdateInput!]!) { menuUpdate(id: $id, title: $title, handle: $handle, items: $items) { menu { id title handle } userErrors { field message } } }`, { id: menu.id, title: menu.title, handle, items }, `Update ${handle}`);
};
await updateMenu('footer-shop', [...concernItems, { title: 'All Products', type: 'CATALOG' }]);
await updateMenu('footer-support', [
  { title: 'FAQ', type: 'HTTP', url: '/#altaeron-faq' },
  { title: 'Shipping', type: 'HTTP', url: '/policies/shipping-policy' },
  { title: 'Returns', type: 'SHOP_POLICY', resourceId: 'gid://shopify/ShopPolicy/33301495869' },
  { title: 'Contact Us', type: 'PAGE', resourceId: 'gid://shopify/Page/106624811069' },
  { title: 'Track Order', type: 'CUSTOMER_ACCOUNT_PAGE', resourceId: 'gid://shopify/CustomerAccountPage/53178859581' },
]);
await updateMenu('footer-company', [
  { title: 'About Us', type: 'HTTP', url: '/#altaeron-values' },
  { title: 'Our Story', type: 'HTTP', url: '/#altaeron-values' },
  { title: 'Reviews', type: 'HTTP', url: '/#altaeron-reviews' },
  ...(blog ? [{ title: 'Blog', type: 'BLOG', resourceId: blog.id }] : []),
]);

const after = await gql(`query LayoutStateAfter { shop { id metafields(first: 20, namespace: "custom") { nodes { key type value } } } products(first: 50) { nodes { id handle metafields(first: 20, namespace: "custom") { nodes { key type value } } } } blogs(first: 20) { nodes { id handle articles(first: 20) { nodes { id handle metafields(first: 20, namespace: "custom") { nodes { key type value } } } } } } menus(first: 50) { nodes { id title handle items { title type url resourceId } } } }`, {}, 'Audit updated layout state');
await fs.writeFile('tmp/homepage-audit/layout-state-after-mutations.json', JSON.stringify(after, null, 2));
console.log(JSON.stringify({ productsWithCleanMedia: Object.keys(cleanMedia).length, articlesWithCover: articleMetafields.length, videoId, menusUpdated: ['footer-shop', 'footer-support', 'footer-company'] }, null, 2));
