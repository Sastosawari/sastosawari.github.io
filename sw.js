var V='ss-v8',FILES=['./','index.html','style.css','data.js','long.js','fares.js','dropdown.js','geo.js','points.js','proof.js','calc.js','longui.js','check.js','apps.js','ui.js','logo.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(FILES)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==V}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  var u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(function(r){if(r.ok){var c=r.clone();caches.open(V).then(function(x){x.put(e.request,c)})}return r}).catch(function(){return caches.match(e.request,{ignoreSearch:true})}));
});
