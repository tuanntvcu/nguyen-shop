import fs from 'node:fs/promises';
import {gql,files} from './airrelief-store.mjs';
const dir='tmp/airrelief-audit/design';await fs.mkdir(dir,{recursive:true});
const names=['sections/altaeron-pdp-dialfit.liquid','sections/altaeron-pdp-massager.liquid','assets/altaeron-pdp.css','assets/altaeron-pdp.js','assets/altaeron-pdp-massager.css','assets/altaeron-pdp-massager.js','templates/product.altaeron-dialfit.json','templates/product.altaeron-massager.json','snippets/altaeron-pdp-section-heading.liquid','locales/en.default.json'];
const remote=await files(names);await fs.writeFile(`${dir}/files-before.json`,JSON.stringify(remote,null,2));
for(const f of remote)await fs.writeFile(`${dir}/${f.filename.replaceAll('/','__')}`,f.body.content);
const state=await gql(`{product(id:"gid://shopify/Product/8052528480317"){id title handle descriptionHtml vendor productType templateSuffix seo{title description} variants(first:20){nodes{id title price compareAtPrice availableForSale}}media(first:30){nodes{id alt}}metafields(first:100){nodes{namespace key type value}}}}`);
await fs.writeFile(`${dir}/product-before.json`,JSON.stringify(state,null,2));console.log(JSON.stringify({files:remote.map(f=>f.filename),product:state.product.title}));
