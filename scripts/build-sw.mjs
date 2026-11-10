import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const files = [];
const base = process.env.VITE_BASE_PATH || "/";
if (!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(base))
  throw new Error(
    "VITE_BASE_PATH must be an absolute folder path ending with /.",
  );
const prefix = `monter-shell-${createHash("sha256").update(base).digest("hex").slice(0, 8)}-`;
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${item.name}`;
    if (item.isDirectory()) await walk(path);
    else if (item.name !== "sw.js") files.push(path);
  }
}
await walk("dist");
const hash = createHash("sha256");
for (const path of files.sort()) if (!path.endsWith("/prices.json")) hash.update(await readFile(path));
const version = hash.digest("hex").slice(0, 16);
const urls = [base, ...files.map((p) => base + p.replace(/^dist\//, ""))];
await writeFile(
  "dist/sw.js",
  `const PREFIX=${JSON.stringify(prefix)};
const CACHE=PREFIX+'${version}';
const BASE=${JSON.stringify(base)};
const URLS=${JSON.stringify(urls)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS.map(url=>new Request(url,{cache:'reload'})))));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;event.respondWith(caches.open(CACHE).then(async cache=>{if(url.pathname===BASE+'prices.json'){try{const fresh=await fetch(event.request);if(fresh.ok){await cache.put(event.request,fresh.clone());return fresh;}}catch{}const last=await cache.match(event.request,{ignoreVary:true});if(last)return last;return new Response('{}',{headers:{'Content-Type':'application/json'}});}const cached=await cache.match(event.request,{ignoreVary:true});if(cached)return cached;try{return await fetch(event.request);}catch(error){if(event.request.mode==='navigate')return (await cache.match(BASE+'index.html'));throw error;}}));});
`,
);
console.log(`PWA: ${urls.length} ressurser, versjon ${version}`);
