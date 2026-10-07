import fs from 'node:fs/promises';
const shop = 'i9f8uv-gq.myshopify.com';
const response = await fetch(`https://${shop}/admin/oauth/access_token`, {method:'POST',body:new URLSearchParams({grant_type:'client_credentials',client_id:process.env.SHOPIFY_CLIENT_ID,client_secret:process.env.SHOPIFY_CLIENT_SECRET})});
if (!response.ok) throw new Error(`OAuth ${response.status}`);
const {access_token:token} = await response.json();
export async function gql(query,variables={}) {
 const r=await fetch(`https://${shop}/admin/api/2026-07/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':token},body:JSON.stringify({query,variables})});
 const j=await r.json(); if(!r.ok||j.errors) throw new Error(JSON.stringify(j.errors||{status:r.status}));
 for(const v of Object.values(j.data)) if(v?.userErrors?.length) throw new Error(JSON.stringify(v.userErrors));
 return j.data;
}
export const dir='tmp/airrelief-audit';
export const id='gid://shopify/Product/8052528480317';
export async function files(names) {return (await gql(`query($id:ID!,$names:[String!]){theme(id:$id){files(first:50,filenames:$names){nodes{filename checksumMd5 body{... on OnlineStoreThemeFileBodyText{content}}}}}}`,{id:'gid://shopify/OnlineStoreTheme/140538314813',names})).theme.files.nodes;}
if(process.argv[2]==='audit') {
 await fs.mkdir(dir,{recursive:true});
 const state=await gql(`{shop{name currencyCode} currentAppInstallation{accessScopes{handle}} product(id:"${id}"){id title handle vendor productType status descriptionHtml templateSuffix seo{title description} options{name values} variants(first:50){nodes{id title price compareAtPrice availableForSale}} media(first:50){nodes{id alt mediaContentType preview{image{url}}}} metafields(first:100){nodes{namespace key type value}}} products(first:5,query:"handle:dialfit-knee-brace"){nodes{id title handle templateSuffix}}}`);
 await fs.writeFile(`${dir}/before.json`,JSON.stringify(state,null,2));
 const names=['templates/product.altaeron-dialfit.json','sections/altaeron-pdp-dialfit.liquid','assets/altaeron-pdp.css','assets/altaeron-pdp.js','locales/en.default.json','snippets/altaeron-pdp-media.liquid','snippets/altaeron-pdp-icon.liquid','snippets/altaeron-pdp-section-heading.liquid'];
 const remote=await files(names); await fs.writeFile(`${dir}/files-before.json`,JSON.stringify(remote,null,2));
 for(const f of remote) await fs.writeFile(`${dir}/${f.filename.replaceAll('/','__')}`,f.body.content);
 console.log(JSON.stringify({product:state.product,dialfit:state.products.nodes,currency:state.shop.currencyCode,scopes:state.currentAppInstallation.accessScopes.filter(s=>/themes|products|content/.test(s.handle))},null,2));
}
