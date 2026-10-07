import fs from 'node:fs/promises';
import {gql} from './airrelief-store.mjs';
const names=['assets/altaeron-pdp-massager.css','assets/altaeron-pdp-massager.js','sections/altaeron-pdp-massager.liquid'];
console.log(JSON.stringify(await gql(`mutation($files:[OnlineStoreThemeFilesUpsertFileInput!]!){themeFilesUpsert(themeId:"gid://shopify/OnlineStoreTheme/140538314813",files:$files){upsertedThemeFiles{filename}userErrors{field message}}}`,{files:await Promise.all(names.map(async filename=>({filename,body:{type:'TEXT',value:await fs.readFile(filename,'utf8')}})))})));
