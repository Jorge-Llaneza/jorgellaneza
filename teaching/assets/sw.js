/* Offline cache for MP Productions Teaching: serve from cache, refresh in the background. */
const V='mpt-v1',FILES=['./','./MP_PRODUCTIONS_TEACHING_6.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 e.respondWith(caches.open(V).then(c=>c.match(r,{ignoreSearch:true}).then(hit=>{const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>hit||(r.mode==='navigate'?c.match('./MP_PRODUCTIONS_TEACHING_6.html'):undefined));return hit||net}))) });
