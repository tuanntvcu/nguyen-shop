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

const state = await gql(`#graphql
  query ReviewMetaobjectState {
    metaobjectDefinitions(first: 100) {
      nodes {
        id
        type
        name
        fieldDefinitions { key name type { name } }
      }
    }
    products(first: 10, query: "handle:adjustable-bunion-corrector") {
      nodes {
        handle
        metafield(namespace: "altaeron", key: "pdp_reviews") {
          references(first: 20) {
            nodes { ... on Metaobject { type } }
          }
        }
      }
    }
  }
`, {}, 'Read review metaobject definition');

const reviewTypes = new Set(
  state.products.nodes.flatMap((product) => product.metafield?.references?.nodes || []).map((item) => item.type),
);
const definition = state.metaobjectDefinitions.nodes.find((item) => reviewTypes.has(item.type))
  || state.metaobjectDefinitions.nodes.find((item) => item.type.includes('review'));

if (!definition) throw new Error('Could not find the metaobject definition used by altaeron.pdp_reviews.');

const existingField = definition.fieldDefinitions.find((field) => field.key === 'review_image');
if (existingField) {
  if (existingField.type.name !== 'file_reference') {
    throw new Error(`Existing ${definition.type}.review_image has incompatible type ${existingField.type.name}.`);
  }
  console.log(JSON.stringify({ status: 'unchanged', definition: definition.type, field: 'review_image' }, null, 2));
  process.exit(0);
}

const updated = await gql(`#graphql
  mutation AddReviewImage($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition {
        id
        type
        fieldDefinitions { key name type { name } }
      }
      userErrors { field message code }
    }
  }
`, {
  id: definition.id,
  definition: {
    fieldDefinitions: [{ create: { key: 'review_image', name: 'Review image', type: 'file_reference' } }],
  },
}, 'Add review image field');

const result = updated.metaobjectDefinitionUpdate;
if (result.userErrors.length) throw new Error(`Add review image field: ${JSON.stringify(result.userErrors)}`);
console.log(JSON.stringify({ status: 'created', definition: result.metaobjectDefinition.type, field: 'review_image' }, null, 2));
