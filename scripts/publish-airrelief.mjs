import {gql,id,dir} from './airrelief-store.mjs';
import fs from 'node:fs/promises';
const before=await gql(`{product(id:"${id}"){resourcePublications(first:20){nodes{isPublished publication{id name}}}}}`);
await fs.writeFile(`${dir}/publication-before.json`,JSON.stringify(before,null,2));
console.log(JSON.stringify(await gql(`mutation($id:ID!,$input:[PublicationInput!]!){publishablePublish(id:$id,input:$input){userErrors{field message}publishable{... on Product{id onlineStoreUrl}}}}`,{id,input:[{publicationId:'gid://shopify/Publication/140224528445'}]}),null,2));
