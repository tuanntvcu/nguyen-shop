import fs from 'node:fs/promises';
import {gql,dir,id,files} from './airrelief-store.mjs';
const names=['assets/altaeron-pdp-massager.css','assets/altaeron-pdp-massager.js','sections/altaeron-pdp-massager.liquid','templates/product.altaeron-massager.json'];
const before=JSON.parse(await fs.readFile(`${dir}/before.json`,'utf8'));
const originalFiles=JSON.parse(await fs.readFile(`${dir}/files-before.json`,'utf8'));
const current=await files(originalFiles.map(f=>f.filename));
if(current.some(f=>f.checksumMd5!==originalFiles.find(o=>o.filename===f.filename)?.checksumMd5)) throw new Error('Live source changed since audit. Re-inspection required.');
const existing=await files(names); await fs.writeFile(`${dir}/massager-files-before.json`,JSON.stringify(existing,null,2));
const upsert=`mutation($theme:ID!,$files:[OnlineStoreThemeFilesUpsertFileInput!]!){themeFilesUpsert(themeId:$theme,files:$files){upsertedThemeFiles{filename} job{id done} userErrors{field message}}}`;
const theme='gid://shopify/OnlineStoreTheme/140538314813';
for(const group of [names.slice(0,3),names.slice(3)]) {
 const data=await gql(upsert,{theme,files:await Promise.all(group.map(async filename=>({filename,body:{type:'TEXT',value:await fs.readFile(filename,'utf8')}})))});
 console.log(JSON.stringify(data));
 if(data.themeFilesUpsert.job&&!data.themeFilesUpsert.job.done){
  for(let n=0;n<30;n++){await new Promise(r=>setTimeout(r,1000));if((await gql('query($id:ID!){job(id:$id){done}}',{id:data.themeFilesUpsert.job.id})).job.done)break;if(n===29)throw new Error('Upload job pending');}
 }
}
const seo={title:'Foot & Ankle Massager with Heat & Compression | Altaeron',description:'Relax tired, heavy feet in 15 minutes with Altaeron AirRelief. Air compression, warming heat and vibration deliver cordless foot and ankle massage at home.'};
const descriptionHtml='<p>Give tired, heavy feet a 15-minute reset with Altaeron™ AirRelief. This cordless foot and ankle massager combines rhythmic air compression, warming heat and high-frequency vibration to help loosen tightness, soothe end-of-day aches and leave overworked feet feeling lighter.</p><p>Choose from 3 air-compression cycles and 5 intensity levels, plus 4 heat levels and 4 vibration levels, then sit back and let AirRelief do the work.</p><ul><li>1200mAh rechargeable lithium battery; DC 3.7V; rated power 5W</li><li>Approximately 3-hour charge and 1–2 hours total runtime</li><li>Approximately 20 × 17 × 4 cm; soft technical fabric and ABS control housing</li><li>Black; adjustable hook-and-loop closure; one unit per purchase</li></ul>';
const update=await gql(`mutation($product:ProductUpdateInput!){productUpdate(product:$product){product{id title handle vendor productType templateSuffix seo{title description} variants(first:10){nodes{id price compareAtPrice}}}userErrors{field message}}}`,{product:{id,title:'Altaeron™ AirRelief Foot & Ankle Massager',handle:'airrelief-foot-ankle-massager',redirectNewHandle:true,vendor:'Altaeron',productType:'Foot & Ankle Massager',descriptionHtml,templateSuffix:'altaeron-massager',seo}});
await fs.writeFile(`${dir}/product-after.json`,JSON.stringify(update,null,2));
// Set descriptive alt text only on the existing product-specific image.
await gql(`mutation($productId:ID!,$media:[UpdateMediaInput!]!){productUpdateMedia(productId:$productId,media:$media){media{id alt}mediaUserErrors{field message}}}`,{productId:id,media:before.product.media.nodes.filter(m=>m.mediaContentType==='IMAGE').map((m,i)=>({id:m.id,alt:i===0?'Altaeron AirRelief cordless foot and ankle massager':'AirRelief foot and ankle massage controls'}))});
const afterFiles=await files(originalFiles.map(f=>f.filename));
if(afterFiles.some(f=>f.checksumMd5!==originalFiles.find(o=>o.filename===f.filename)?.checksumMd5)) throw new Error('Unexpected original theme file change');
await fs.writeFile(`${dir}/isolation-after.json`,JSON.stringify(afterFiles.map(f=>({filename:f.filename,checksumMd5:f.checksumMd5})),null,2));
console.log(JSON.stringify({product:update.productUpdate.product,originalFilesUnchanged:true},null,2));
