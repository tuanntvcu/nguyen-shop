import fs from 'node:fs/promises';
import {gql,files,dir} from './airrelief-store.mjs';
const names=['templates/product.altaeron-dialfit.json','sections/altaeron-pdp-dialfit.liquid','templates/product.altaeron-massager.json','sections/altaeron-pdp-massager.liquid'];
const remote=await files(names);
await fs.writeFile(`${dir}/preview-media-before.json`,JSON.stringify(remote,null,2));
const product=await gql(`{product(id:"gid://shopify/Product/7996620341309"){title media(first:30){nodes{id mediaContentType preview{image{url}} ... on Video{sources{url} }}}metafields(first:100,namespace:"altaeron"){nodes{key type value reference{... on MediaImage{image{url}} ... on Video{id sources{url} preview{image{url}}}}}}}}`);
await fs.writeFile(`${dir}/dialfit-preview-media.json`,JSON.stringify(product,null,2));
const parse=s=>JSON.parse(s.replace(/^\s*\/\*[\s\S]*?\*\//,''));
const source=parse(remote.find(f=>f.filename===names[0]).body.content);
const target=parse(remote.find(f=>f.filename===names[2]).body.content);
const settings=Object.values(source.sections).find(s=>s.type==='altaeron-pdp-dialfit').settings;
const imageSetting=media=>`shopify://shop_images/${decodeURIComponent(new URL(media.preview.image.url).pathname.split('/').at(-1))}`;
const massager=Object.values(target.sections).find(s=>s.type==='altaeron-pdp-massager');
Object.assign(massager.settings,{
 hero_image:settings.hero_image||imageSetting(product.product.media.nodes[0]),
 story_image:settings.point_1_image||imageSetting(product.product.media.nodes[4]),
 mechanism_image:settings.point_2_image||imageSetting(product.product.media.nodes[2]),
 comparison_image_1:settings.point_5_image_1,
 comparison_image_2:settings.point_5_image_2,
 proof_video:settings.point_6_video,
 proof_image_1:settings.point_6_image_1,
 proof_image_2:settings.point_6_image_2,
 proof_image_3:settings.point_6_image_3,
 proof_image_4:settings.point_6_image_4,
 final_cta_image:settings.final_cta_image
});
const video=product.product.metafields.nodes.find(m=>m.key==='pdp_hero_video');
if(video){
 const backup=await gql('{product(id:"gid://shopify/Product/8052528480317"){metafield(namespace:"altaeron",key:"massager_preview_hero_video"){id type value}}}');
 await fs.writeFile(`${dir}/preview-video-metafield-before.json`,JSON.stringify(backup,null,2));
 await gql(`mutation($metafields:[MetafieldsSetInput!]!){metafieldsSet(metafields:$metafields){metafields{id key}userErrors{field message}}}`,{metafields:[{ownerId:'gid://shopify/Product/8052528480317',namespace:'altaeron',key:'massager_preview_hero_video',type:'file_reference',value:video.value}]});
 delete massager.settings.hero_video;
 massager.settings.preview_hero_video=true;
}
await fs.writeFile('templates/product.altaeron-massager.json',JSON.stringify(target,null,2)+'\n');
const newNames=['sections/altaeron-pdp-massager.liquid','templates/product.altaeron-massager.json'];
console.log(JSON.stringify(await gql(`mutation($files:[OnlineStoreThemeFilesUpsertFileInput!]!){themeFilesUpsert(themeId:"gid://shopify/OnlineStoreTheme/140538314813",files:$files){upsertedThemeFiles{filename}userErrors{field message}}}`,{files:await Promise.all(newNames.map(async filename=>({filename,body:{type:'TEXT',value:await fs.readFile(filename,'utf8')}})))})));
const after=await files(names.slice(0,2));
for(const f of after) if(f.checksumMd5!==remote.find(o=>o.filename===f.filename).checksumMd5)throw new Error('DialFit source checksum changed');
console.log(JSON.stringify({copiedMediaSettings:massager.settings,dialfitUnchanged:true},null,2));
