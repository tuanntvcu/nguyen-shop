import {gql,id} from './airrelief-store.mjs';
console.log(JSON.stringify(await gql(`{product(id:"${id}"){id handle status onlineStoreUrl publishedAt resourcePublications(first:20){nodes{isPublished publication{id name}}}} publications(first:20){nodes{id name}}}`),null,2));
