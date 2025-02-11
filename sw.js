(function(){"use strict";try{self["workbox:core:7.0.0"]&&_()}catch{}const _t=null,se=(a,...e)=>{let t=a;return e.length>0&&(t+=` :: ${JSON.stringify(e)}`),t};let u=class extends Error{constructor(e,t){const s=se(e,t);super(s),this.name=e,this.details=t}};const ae=new Set,d={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:typeof registration<"u"?registration.scope:""},O=a=>[d.prefix,a,d.suffix].filter(e=>e&&e.length>0).join("-"),re=a=>{for(const e of Object.keys(d))a(e)},E={updateDetails:a=>{re(e=>{typeof a[e]=="string"&&(d[e]=a[e])})},getGoogleAnalyticsName:a=>a||O(d.googleAnalytics),getPrecacheName:a=>a||O(d.precache),getPrefix:()=>d.prefix,getRuntimeName:a=>a||O(d.runtime),getSuffix:()=>d.suffix};function H(a,e){const t=new URL(a);for(const s of e)t.searchParams.delete(s);return t.href}async function ne(a,e,t,s){const r=H(e.url,t);if(e.url===r)return a.match(e,s);const i=Object.assign(Object.assign({},s),{ignoreSearch:!0}),n=await a.keys(e,i);for(const c of n){const o=H(c.url,t);if(r===o)return a.match(c,s)}}let y;function ie(){if(y===void 0){const a=new Response("");if("body"in a)try{new Response(a.body),y=!0}catch{y=!1}y=!1}return y}let ce=class{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}};async function oe(){for(const a of ae)await a()}const le=a=>new URL(String(a),location.href).href.replace(new RegExp(`^${location.origin}`),"");function he(a){return new Promise(e=>setTimeout(e,a))}function B(a,e){const t=e();return a.waitUntil(t),t}async function ue(a,e){let t=null;if(a.url&&(t=new URL(a.url).origin),t!==self.location.origin)throw new u("cross-origin-copy-response",{origin:t});const s=a.clone(),i={headers:new Headers(s.headers),status:s.status,statusText:s.statusText},n=ie()?s.body:await s.blob();return new Response(n,i)}function fe(){self.addEventListener("activate",()=>self.clients.claim())}try{self["workbox:core:7.2.0"]&&_()}catch{}const de=(a,...e)=>{let t=a;return e.length>0&&(t+=` :: ${JSON.stringify(e)}`),t};let v=class extends Error{constructor(e,t){const s=de(e,t);super(s),this.name=e,this.details=t}};try{self["workbox:routing:7.2.0"]&&_()}catch{}const F="GET",D=a=>a&&typeof a=="object"?a:{handle:a};let L=class{constructor(e,t,s=F){this.handler=D(t),this.match=e,this.method=s}setCatchHandler(e){this.catchHandler=D(e)}},pe=class extends L{constructor(e,t,s){const r=({url:i})=>{const n=e.exec(i.href);if(n&&!(i.origin!==location.origin&&n.index!==0))return n.slice(1)};super(r,t,s)}},ge=class{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)})}addCacheListener(){self.addEventListener("message",e=>{if(e.data&&e.data.type==="CACHE_URLS"){const{payload:t}=e.data,s=Promise.all(t.urlsToCache.map(r=>{typeof r=="string"&&(r=[r]);const i=new Request(...r);return this.handleRequest({request:i,event:e})}));e.waitUntil(s),e.ports&&e.ports[0]&&s.then(()=>e.ports[0].postMessage(!0))}})}handleRequest({request:e,event:t}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return;const r=s.origin===location.origin,{params:i,route:n}=this.findMatchingRoute({event:t,request:e,sameOrigin:r,url:s});let c=n&&n.handler;const o=e.method;if(!c&&this._defaultHandlerMap.has(o)&&(c=this._defaultHandlerMap.get(o)),!c)return;let l;try{l=c.handle({url:s,request:e,event:t,params:i})}catch(h){l=Promise.reject(h)}const f=n&&n.catchHandler;return l instanceof Promise&&(this._catchHandler||f)&&(l=l.catch(async h=>{if(f)try{return await f.handle({url:s,request:e,event:t,params:i})}catch(k){k instanceof Error&&(h=k)}if(this._catchHandler)return this._catchHandler.handle({url:s,request:e,event:t});throw h})),l}findMatchingRoute({url:e,sameOrigin:t,request:s,event:r}){const i=this._routes.get(s.method)||[];for(const n of i){let c;const o=n.match({url:e,sameOrigin:t,request:s,event:r});if(o)return c=o,(Array.isArray(c)&&c.length===0||o.constructor===Object&&Object.keys(o).length===0||typeof o=="boolean")&&(c=void 0),{route:n,params:c}}return{}}setDefaultHandler(e,t=F){this._defaultHandlerMap.set(t,D(e))}setCatchHandler(e){this._catchHandler=D(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new v("unregister-route-but-not-found-with-method",{method:e.method});const t=this._routes.get(e.method).indexOf(e);if(t>-1)this._routes.get(e.method).splice(t,1);else throw new v("unregister-route-route-not-registered")}},b;const me=()=>(b||(b=new ge,b.addFetchListener(),b.addCacheListener()),b);function we(a,e,t){let s;if(typeof a=="string"){const i=new URL(a,location.href),n=({url:c})=>c.href===i.href;s=new L(n,e,t)}else if(a instanceof RegExp)s=new pe(a,e,t);else if(typeof a=="function")s=new L(a,e,t);else if(a instanceof L)s=a;else throw new v("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});return me().registerRoute(s),s}try{self["workbox:core:7.2.0"]&&_()}catch{}const ye=(a,...e)=>{let t=a;return e.length>0&&(t+=` :: ${JSON.stringify(e)}`),t};let U=class extends Error{constructor(e,t){const s=ye(e,t);super(s),this.name=e,this.details=t}};const xt=null,p={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:typeof registration<"u"?registration.scope:""},M=a=>[p.prefix,a,p.suffix].filter(e=>e&&e.length>0).join("-"),_e=a=>{for(const e of Object.keys(p))a(e)},be={updateDetails:a=>{_e(e=>{typeof a[e]=="string"&&(p[e]=a[e])})},getGoogleAnalyticsName:a=>a||M(p.googleAnalytics),getPrecacheName:a=>a||M(p.precache),getPrefix:()=>p.prefix,getRuntimeName:a=>a||M(p.runtime),getSuffix:()=>p.suffix},Re=a=>new URL(String(a),location.href).href.replace(new RegExp(`^${location.origin}`),"");function V(a,e){const t=new URL(a);for(const s of e)t.searchParams.delete(s);return t.href}async function Ce(a,e,t,s){const r=V(e.url,t);if(e.url===r)return a.match(e,s);const i=Object.assign(Object.assign({},s),{ignoreSearch:!0}),n=await a.keys(e,i);for(const c of n){const o=V(c.url,t);if(r===o)return a.match(c,s)}}class xe{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}const ke=new Set;async function Ee(){for(const a of ke)await a()}function De(a){return new Promise(e=>setTimeout(e,a))}try{self["workbox:strategies:7.2.0"]&&_()}catch{}function P(a){return typeof a=="string"?new Request(a):a}let Le=class{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new xe,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const s of this._plugins)this._pluginStateMap.set(s,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:t}=this;let s=P(e);if(s.mode==="navigate"&&t instanceof FetchEvent&&t.preloadResponse){const n=await t.preloadResponse;if(n)return n}const r=this.hasCallback("fetchDidFail")?s.clone():null;try{for(const n of this.iterateCallbacks("requestWillFetch"))s=await n({request:s.clone(),event:t})}catch(n){if(n instanceof Error)throw new U("plugin-error-request-will-fetch",{thrownErrorMessage:n.message})}const i=s.clone();try{let n;n=await fetch(s,s.mode==="navigate"?void 0:this._strategy.fetchOptions);for(const c of this.iterateCallbacks("fetchDidSucceed"))n=await c({event:t,request:i,response:n});return n}catch(n){throw r&&await this.runCallbacks("fetchDidFail",{error:n,event:t,originalRequest:r.clone(),request:i.clone()}),n}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=P(e);let s;const{cacheName:r,matchOptions:i}=this._strategy,n=await this.getCacheKey(t,"read"),c=Object.assign(Object.assign({},i),{cacheName:r});s=await caches.match(n,c);for(const o of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await o({cacheName:r,matchOptions:i,cachedResponse:s,request:n,event:this.event})||void 0;return s}async cachePut(e,t){const s=P(e);await De(0);const r=await this.getCacheKey(s,"write");if(!t)throw new U("cache-put-with-no-response",{url:Re(r.url)});const i=await this._ensureResponseSafeToCache(t);if(!i)return!1;const{cacheName:n,matchOptions:c}=this._strategy,o=await self.caches.open(n),l=this.hasCallback("cacheDidUpdate"),f=l?await Ce(o,r.clone(),["__WB_REVISION__"],c):null;try{await o.put(r,l?i.clone():i)}catch(h){if(h instanceof Error)throw h.name==="QuotaExceededError"&&await Ee(),h}for(const h of this.iterateCallbacks("cacheDidUpdate"))await h({cacheName:n,oldResponse:f,newResponse:i.clone(),request:r,event:this.event});return!0}async getCacheKey(e,t){const s=`${e.url} | ${t}`;if(!this._cacheKeys[s]){let r=e;for(const i of this.iterateCallbacks("cacheKeyWillBeUsed"))r=P(await i({mode:t,request:r,event:this.event,params:this.params}));this._cacheKeys[s]=r}return this._cacheKeys[s]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if(typeof t[e]=="function"){const s=this._pluginStateMap.get(t);yield i=>{const n=Object.assign(Object.assign({},i),{state:s});return t[e](n)}}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const r of this.iterateCallbacks("cacheWillUpdate"))if(t=await r({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&t.status!==200&&(t=void 0),t}},Ue=class{constructor(e={}){this.cacheName=be.getRuntimeName(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s=typeof e.request=="string"?new Request(e.request):e.request,r="params"in e?e.params:void 0,i=new Le(this,{event:t,request:s,params:r}),n=this._getResponse(i,s,t),c=this._awaitComplete(n,i,s,t);return[n,c]}async _getResponse(e,t,s){await e.runCallbacks("handlerWillStart",{event:s,request:t});let r;try{if(r=await this._handle(t,e),!r||r.type==="error")throw new U("no-response",{url:t.url})}catch(i){if(i instanceof Error){for(const n of e.iterateCallbacks("handlerDidError"))if(r=await n({error:i,event:s,request:t}),r)break}if(!r)throw i}for(const i of e.iterateCallbacks("handlerWillRespond"))r=await i({event:s,request:t,response:r});return r}async _awaitComplete(e,t,s,r){let i,n;try{i=await e}catch{}try{await t.runCallbacks("handlerDidRespond",{event:r,request:s,response:i}),await t.doneWaiting()}catch(c){c instanceof Error&&(n=c)}if(await t.runCallbacks("handlerDidComplete",{event:r,request:s,response:i,error:n}),t.destroy(),n)throw n}};class Pe extends Ue{async _handle(e,t){let s=await t.cacheMatch(e),r;if(!s)try{s=await t.fetchAndCachePut(e)}catch(i){i instanceof Error&&(r=i)}if(!s)throw new U("no-response",{url:e.url,error:r});return s}}try{self["workbox:core:7.2.0"]&&_()}catch{}const Ne=(a,...e)=>{let t=a;return e.length>0&&(t+=` :: ${JSON.stringify(e)}`),t};class Te extends Error{constructor(e,t){const s=Ne(e,t);super(s),this.name=e,this.details=t}}function G(a){a.then(()=>{})}const Oe=(a,e)=>e.some(t=>a instanceof t);let Q,J;function ve(){return Q||(Q=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Me(){return J||(J=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const z=new WeakMap,S=new WeakMap,X=new WeakMap,I=new WeakMap,K=new WeakMap;function Se(a){const e=new Promise((t,s)=>{const r=()=>{a.removeEventListener("success",i),a.removeEventListener("error",n)},i=()=>{t(g(a.result)),r()},n=()=>{s(a.error),r()};a.addEventListener("success",i),a.addEventListener("error",n)});return e.then(t=>{t instanceof IDBCursor&&z.set(t,a)}).catch(()=>{}),K.set(e,a),e}function Ie(a){if(S.has(a))return;const e=new Promise((t,s)=>{const r=()=>{a.removeEventListener("complete",i),a.removeEventListener("error",n),a.removeEventListener("abort",n)},i=()=>{t(),r()},n=()=>{s(a.error||new DOMException("AbortError","AbortError")),r()};a.addEventListener("complete",i),a.addEventListener("error",n),a.addEventListener("abort",n)});S.set(a,e)}let A={get(a,e,t){if(a instanceof IDBTransaction){if(e==="done")return S.get(a);if(e==="objectStoreNames")return a.objectStoreNames||X.get(a);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return g(a[e])},set(a,e,t){return a[e]=t,!0},has(a,e){return a instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in a}};function Ke(a){A=a(A)}function Ae(a){return a===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const s=a.call(W(this),e,...t);return X.set(s,e.sort?e.sort():[e]),g(s)}:Me().includes(a)?function(...e){return a.apply(W(this),e),g(z.get(this))}:function(...e){return g(a.apply(W(this),e))}}function We(a){return typeof a=="function"?Ae(a):(a instanceof IDBTransaction&&Ie(a),Oe(a,ve())?new Proxy(a,A):a)}function g(a){if(a instanceof IDBRequest)return Se(a);if(I.has(a))return I.get(a);const e=We(a);return e!==a&&(I.set(a,e),K.set(e,a)),e}const W=a=>K.get(a);function $e(a,e,{blocked:t,upgrade:s,blocking:r,terminated:i}={}){const n=indexedDB.open(a,e),c=g(n);return s&&n.addEventListener("upgradeneeded",o=>{s(g(n.result),o.oldVersion,o.newVersion,g(n.transaction),o)}),t&&n.addEventListener("blocked",o=>t(o.oldVersion,o.newVersion,o)),c.then(o=>{i&&o.addEventListener("close",()=>i()),r&&o.addEventListener("versionchange",l=>r(l.oldVersion,l.newVersion,l))}).catch(()=>{}),c}function qe(a,{blocked:e}={}){const t=indexedDB.deleteDatabase(a);return e&&t.addEventListener("blocked",s=>e(s.oldVersion,s)),g(t).then(()=>{})}const je=["get","getKey","getAll","getAllKeys","count"],He=["put","add","delete","clear"],$=new Map;function Y(a,e){if(!(a instanceof IDBDatabase&&!(e in a)&&typeof e=="string"))return;if($.get(e))return $.get(e);const t=e.replace(/FromIndex$/,""),s=e!==t,r=He.includes(t);if(!(t in(s?IDBIndex:IDBObjectStore).prototype)||!(r||je.includes(t)))return;const i=async function(n,...c){const o=this.transaction(n,r?"readwrite":"readonly");let l=o.store;return s&&(l=l.index(c.shift())),(await Promise.all([l[t](...c),r&&o.done]))[0]};return $.set(e,i),i}Ke(a=>({...a,get:(e,t,s)=>Y(e,t)||a.get(e,t,s),has:(e,t)=>!!Y(e,t)||a.has(e,t)}));try{self["workbox:expiration:7.2.0"]&&_()}catch{}const Be="workbox-expiration",R="cache-entries",Z=a=>{const e=new URL(a,location.href);return e.hash="",e.href};class Fe{constructor(e){this._db=null,this._cacheName=e}_upgradeDb(e){const t=e.createObjectStore(R,{keyPath:"id"});t.createIndex("cacheName","cacheName",{unique:!1}),t.createIndex("timestamp","timestamp",{unique:!1})}_upgradeDbAndDeleteOldDbs(e){this._upgradeDb(e),this._cacheName&&qe(this._cacheName)}async setTimestamp(e,t){e=Z(e);const s={url:e,timestamp:t,cacheName:this._cacheName,id:this._getId(e)},i=(await this.getDb()).transaction(R,"readwrite",{durability:"relaxed"});await i.store.put(s),await i.done}async getTimestamp(e){const s=await(await this.getDb()).get(R,this._getId(e));return s==null?void 0:s.timestamp}async expireEntries(e,t){const s=await this.getDb();let r=await s.transaction(R).store.index("timestamp").openCursor(null,"prev");const i=[];let n=0;for(;r;){const o=r.value;o.cacheName===this._cacheName&&(e&&o.timestamp<e||t&&n>=t?i.push(r.value):n++),r=await r.continue()}const c=[];for(const o of i)await s.delete(R,o.id),c.push(o.url);return c}_getId(e){return this._cacheName+"|"+Z(e)}async getDb(){return this._db||(this._db=await $e(Be,1,{upgrade:this._upgradeDbAndDeleteOldDbs.bind(this)})),this._db}}class Ve{constructor(e,t={}){this._isRunning=!1,this._rerunRequested=!1,this._maxEntries=t.maxEntries,this._maxAgeSeconds=t.maxAgeSeconds,this._matchOptions=t.matchOptions,this._cacheName=e,this._timestampModel=new Fe(e)}async expireEntries(){if(this._isRunning){this._rerunRequested=!0;return}this._isRunning=!0;const e=this._maxAgeSeconds?Date.now()-this._maxAgeSeconds*1e3:0,t=await this._timestampModel.expireEntries(e,this._maxEntries),s=await self.caches.open(this._cacheName);for(const r of t)await s.delete(r,this._matchOptions);this._isRunning=!1,this._rerunRequested&&(this._rerunRequested=!1,G(this.expireEntries()))}async updateTimestamp(e){await this._timestampModel.setTimestamp(e,Date.now())}async isURLExpired(e){if(this._maxAgeSeconds){const t=await this._timestampModel.getTimestamp(e),s=Date.now()-this._maxAgeSeconds*1e3;return t!==void 0?t<s:!0}else return!1}async delete(){this._rerunRequested=!1,await this._timestampModel.expireEntries(1/0)}}const m={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:typeof registration<"u"?registration.scope:""},q=a=>[m.prefix,a,m.suffix].filter(e=>e&&e.length>0).join("-"),Ge=a=>{for(const e of Object.keys(m))a(e)},Qe={updateDetails:a=>{Ge(e=>{typeof a[e]=="string"&&(m[e]=a[e])})},getGoogleAnalyticsName:a=>a||q(m.googleAnalytics),getPrecacheName:a=>a||q(m.precache),getPrefix:()=>m.prefix,getRuntimeName:a=>a||q(m.runtime),getSuffix:()=>m.suffix},Je=new Set;function ze(a){Je.add(a)}class Xe{constructor(e={}){this.cachedResponseWillBeUsed=async({event:t,request:s,cacheName:r,cachedResponse:i})=>{if(!i)return null;const n=this._isResponseDateFresh(i),c=this._getCacheExpiration(r);G(c.expireEntries());const o=c.updateTimestamp(s.url);if(t)try{t.waitUntil(o)}catch{}return n?i:null},this.cacheDidUpdate=async({cacheName:t,request:s})=>{const r=this._getCacheExpiration(t);await r.updateTimestamp(s.url),await r.expireEntries()},this._config=e,this._maxAgeSeconds=e.maxAgeSeconds,this._cacheExpirations=new Map,e.purgeOnQuotaError&&ze(()=>this.deleteCacheAndMetadata())}_getCacheExpiration(e){if(e===Qe.getRuntimeName())throw new Te("expire-custom-caches-only");let t=this._cacheExpirations.get(e);return t||(t=new Ve(e,this._config),this._cacheExpirations.set(e,t)),t}_isResponseDateFresh(e){if(!this._maxAgeSeconds)return!0;const t=this._getDateHeaderTimestamp(e);if(t===null)return!0;const s=Date.now();return t>=s-this._maxAgeSeconds*1e3}_getDateHeaderTimestamp(e){if(!e.headers.has("date"))return null;const t=e.headers.get("date"),r=new Date(t).getTime();return isNaN(r)?null:r}async deleteCacheAndMetadata(){for(const[e,t]of this._cacheExpirations)await self.caches.delete(e),await t.delete();this._cacheExpirations=new Map}}try{self["workbox:precaching:7.0.0"]&&_()}catch{}const Ye="__WB_REVISION__";function Ze(a){if(!a)throw new u("add-to-cache-list-unexpected-type",{entry:a});if(typeof a=="string"){const i=new URL(a,location.href);return{cacheKey:i.href,url:i.href}}const{revision:e,url:t}=a;if(!t)throw new u("add-to-cache-list-unexpected-type",{entry:a});if(!e){const i=new URL(t,location.href);return{cacheKey:i.href,url:i.href}}const s=new URL(t,location.href),r=new URL(t,location.href);return s.searchParams.set(Ye,e),{cacheKey:s.href,url:r.href}}class et{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:s})=>{if(e.type==="install"&&t&&t.originalRequest&&t.originalRequest instanceof Request){const r=t.originalRequest.url;s?this.notUpdatedURLs.push(r):this.updatedURLs.push(r)}return s}}}class tt{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:t,params:s})=>{const r=(s==null?void 0:s.cacheKey)||this._precacheController.getCacheKeyForURL(t.url);return r?new Request(r,{headers:t.headers}):t},this._precacheController=e}}try{self["workbox:strategies:7.0.0"]&&_()}catch{}function N(a){return typeof a=="string"?new Request(a):a}class st{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new ce,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const s of this._plugins)this._pluginStateMap.set(s,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:t}=this;let s=N(e);if(s.mode==="navigate"&&t instanceof FetchEvent&&t.preloadResponse){const n=await t.preloadResponse;if(n)return n}const r=this.hasCallback("fetchDidFail")?s.clone():null;try{for(const n of this.iterateCallbacks("requestWillFetch"))s=await n({request:s.clone(),event:t})}catch(n){if(n instanceof Error)throw new u("plugin-error-request-will-fetch",{thrownErrorMessage:n.message})}const i=s.clone();try{let n;n=await fetch(s,s.mode==="navigate"?void 0:this._strategy.fetchOptions);for(const c of this.iterateCallbacks("fetchDidSucceed"))n=await c({event:t,request:i,response:n});return n}catch(n){throw r&&await this.runCallbacks("fetchDidFail",{error:n,event:t,originalRequest:r.clone(),request:i.clone()}),n}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=N(e);let s;const{cacheName:r,matchOptions:i}=this._strategy,n=await this.getCacheKey(t,"read"),c=Object.assign(Object.assign({},i),{cacheName:r});s=await caches.match(n,c);for(const o of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await o({cacheName:r,matchOptions:i,cachedResponse:s,request:n,event:this.event})||void 0;return s}async cachePut(e,t){const s=N(e);await he(0);const r=await this.getCacheKey(s,"write");if(!t)throw new u("cache-put-with-no-response",{url:le(r.url)});const i=await this._ensureResponseSafeToCache(t);if(!i)return!1;const{cacheName:n,matchOptions:c}=this._strategy,o=await self.caches.open(n),l=this.hasCallback("cacheDidUpdate"),f=l?await ne(o,r.clone(),["__WB_REVISION__"],c):null;try{await o.put(r,l?i.clone():i)}catch(h){if(h instanceof Error)throw h.name==="QuotaExceededError"&&await oe(),h}for(const h of this.iterateCallbacks("cacheDidUpdate"))await h({cacheName:n,oldResponse:f,newResponse:i.clone(),request:r,event:this.event});return!0}async getCacheKey(e,t){const s=`${e.url} | ${t}`;if(!this._cacheKeys[s]){let r=e;for(const i of this.iterateCallbacks("cacheKeyWillBeUsed"))r=N(await i({mode:t,request:r,event:this.event,params:this.params}));this._cacheKeys[s]=r}return this._cacheKeys[s]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if(typeof t[e]=="function"){const s=this._pluginStateMap.get(t);yield i=>{const n=Object.assign(Object.assign({},i),{state:s});return t[e](n)}}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const r of this.iterateCallbacks("cacheWillUpdate"))if(t=await r({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&t.status!==200&&(t=void 0),t}}class at{constructor(e={}){this.cacheName=E.getRuntimeName(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s=typeof e.request=="string"?new Request(e.request):e.request,r="params"in e?e.params:void 0,i=new st(this,{event:t,request:s,params:r}),n=this._getResponse(i,s,t),c=this._awaitComplete(n,i,s,t);return[n,c]}async _getResponse(e,t,s){await e.runCallbacks("handlerWillStart",{event:s,request:t});let r;try{if(r=await this._handle(t,e),!r||r.type==="error")throw new u("no-response",{url:t.url})}catch(i){if(i instanceof Error){for(const n of e.iterateCallbacks("handlerDidError"))if(r=await n({error:i,event:s,request:t}),r)break}if(!r)throw i}for(const i of e.iterateCallbacks("handlerWillRespond"))r=await i({event:s,request:t,response:r});return r}async _awaitComplete(e,t,s,r){let i,n;try{i=await e}catch{}try{await t.runCallbacks("handlerDidRespond",{event:r,request:s,response:i}),await t.doneWaiting()}catch(c){c instanceof Error&&(n=c)}if(await t.runCallbacks("handlerDidComplete",{event:r,request:s,response:i,error:n}),t.destroy(),n)throw n}}class w extends at{constructor(e={}){e.cacheName=E.getPrecacheName(e.cacheName),super(e),this._fallbackToNetwork=e.fallbackToNetwork!==!1,this.plugins.push(w.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const s=await t.cacheMatch(e);return s||(t.event&&t.event.type==="install"?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,t){let s;const r=t.params||{};if(this._fallbackToNetwork){const i=r.integrity,n=e.integrity,c=!n||n===i;s=await t.fetch(new Request(e,{integrity:e.mode!=="no-cors"?n||i:void 0})),i&&c&&e.mode!=="no-cors"&&(this._useDefaultCacheabilityPluginIfNeeded(),await t.cachePut(e,s.clone()))}else throw new u("missing-precache-entry",{cacheName:this.cacheName,url:e.url});return s}async _handleInstall(e,t){this._useDefaultCacheabilityPluginIfNeeded();const s=await t.fetch(e);if(!await t.cachePut(e,s.clone()))throw new u("bad-precaching-response",{url:e.url,status:s.status});return s}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,r]of this.plugins.entries())r!==w.copyRedirectedCacheableResponsesPlugin&&(r===w.defaultPrecacheCacheabilityPlugin&&(e=s),r.cacheWillUpdate&&t++);t===0?this.plugins.push(w.defaultPrecacheCacheabilityPlugin):t>1&&e!==null&&this.plugins.splice(e,1)}}w.defaultPrecacheCacheabilityPlugin={async cacheWillUpdate({response:a}){return!a||a.status>=400?null:a}},w.copyRedirectedCacheableResponsesPlugin={async cacheWillUpdate({response:a}){return a.redirected?await ue(a):a}};class rt{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new w({cacheName:E.getPrecacheName(e),plugins:[...t,new tt({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const t=[];for(const s of e){typeof s=="string"?t.push(s):s&&s.revision===void 0&&t.push(s.url);const{cacheKey:r,url:i}=Ze(s),n=typeof s!="string"&&s.revision?"reload":"default";if(this._urlsToCacheKeys.has(i)&&this._urlsToCacheKeys.get(i)!==r)throw new u("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(i),secondEntry:r});if(typeof s!="string"&&s.integrity){if(this._cacheKeysToIntegrities.has(r)&&this._cacheKeysToIntegrities.get(r)!==s.integrity)throw new u("add-to-cache-list-conflicting-integrities",{url:i});this._cacheKeysToIntegrities.set(r,s.integrity)}if(this._urlsToCacheKeys.set(i,r),this._urlsToCacheModes.set(i,n),t.length>0){const c=`Workbox is precaching URLs without revision info: ${t.join(", ")}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(c)}}}install(e){return B(e,async()=>{const t=new et;this.strategy.plugins.push(t);for(const[i,n]of this._urlsToCacheKeys){const c=this._cacheKeysToIntegrities.get(n),o=this._urlsToCacheModes.get(i),l=new Request(i,{integrity:c,cache:o,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:n},request:l,event:e}))}const{updatedURLs:s,notUpdatedURLs:r}=t;return{updatedURLs:s,notUpdatedURLs:r}})}activate(e){return B(e,async()=>{const t=await self.caches.open(this.strategy.cacheName),s=await t.keys(),r=new Set(this._urlsToCacheKeys.values()),i=[];for(const n of s)r.has(n.url)||(await t.delete(n),i.push(n.url));return{deletedURLs:i}})}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s)return(await self.caches.open(this.strategy.cacheName)).match(s)}createHandlerBoundToURL(e){const t=this.getCacheKeyForURL(e);if(!t)throw new u("non-precached-url",{url:e});return s=>(s.request=new Request(e),s.params=Object.assign({cacheKey:t},s.params),this.strategy.handle(s))}}let j;const ee=()=>(j||(j=new rt),j);try{self["workbox:routing:7.0.0"]&&_()}catch{}const te="GET",T=a=>a&&typeof a=="object"?a:{handle:a};class C{constructor(e,t,s=te){this.handler=T(t),this.match=e,this.method=s}setCatchHandler(e){this.catchHandler=T(e)}}class nt extends C{constructor(e,t,s){const r=({url:i})=>{const n=e.exec(i.href);if(n&&!(i.origin!==location.origin&&n.index!==0))return n.slice(1)};super(r,t,s)}}class it{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)})}addCacheListener(){self.addEventListener("message",e=>{if(e.data&&e.data.type==="CACHE_URLS"){const{payload:t}=e.data,s=Promise.all(t.urlsToCache.map(r=>{typeof r=="string"&&(r=[r]);const i=new Request(...r);return this.handleRequest({request:i,event:e})}));e.waitUntil(s),e.ports&&e.ports[0]&&s.then(()=>e.ports[0].postMessage(!0))}})}handleRequest({request:e,event:t}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return;const r=s.origin===location.origin,{params:i,route:n}=this.findMatchingRoute({event:t,request:e,sameOrigin:r,url:s});let c=n&&n.handler;const o=e.method;if(!c&&this._defaultHandlerMap.has(o)&&(c=this._defaultHandlerMap.get(o)),!c)return;let l;try{l=c.handle({url:s,request:e,event:t,params:i})}catch(h){l=Promise.reject(h)}const f=n&&n.catchHandler;return l instanceof Promise&&(this._catchHandler||f)&&(l=l.catch(async h=>{if(f)try{return await f.handle({url:s,request:e,event:t,params:i})}catch(k){k instanceof Error&&(h=k)}if(this._catchHandler)return this._catchHandler.handle({url:s,request:e,event:t});throw h})),l}findMatchingRoute({url:e,sameOrigin:t,request:s,event:r}){const i=this._routes.get(s.method)||[];for(const n of i){let c;const o=n.match({url:e,sameOrigin:t,request:s,event:r});if(o)return c=o,(Array.isArray(c)&&c.length===0||o.constructor===Object&&Object.keys(o).length===0||typeof o=="boolean")&&(c=void 0),{route:n,params:c}}return{}}setDefaultHandler(e,t=te){this._defaultHandlerMap.set(t,T(e))}setCatchHandler(e){this._catchHandler=T(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new u("unregister-route-but-not-found-with-method",{method:e.method});const t=this._routes.get(e.method).indexOf(e);if(t>-1)this._routes.get(e.method).splice(t,1);else throw new u("unregister-route-route-not-registered")}}let x;const ct=()=>(x||(x=new it,x.addFetchListener(),x.addCacheListener()),x);function ot(a,e,t){let s;if(typeof a=="string"){const i=new URL(a,location.href),n=({url:c})=>c.href===i.href;s=new C(n,e,t)}else if(a instanceof RegExp)s=new nt(a,e,t);else if(typeof a=="function")s=new C(a,e,t);else if(a instanceof C)s=a;else throw new u("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});return ct().registerRoute(s),s}function lt(a,e=[]){for(const t of[...a.searchParams.keys()])e.some(s=>s.test(t))&&a.searchParams.delete(t);return a}function*ht(a,{ignoreURLParametersMatching:e=[/^utm_/,/^fbclid$/],directoryIndex:t="index.html",cleanURLs:s=!0,urlManipulation:r}={}){const i=new URL(a,location.href);i.hash="",yield i.href;const n=lt(i,e);if(yield n.href,t&&n.pathname.endsWith("/")){const c=new URL(n.href);c.pathname+=t,yield c.href}if(s){const c=new URL(n.href);c.pathname+=".html",yield c.href}if(r){const c=r({url:i});for(const o of c)yield o.href}}class ut extends C{constructor(e,t){const s=({request:r})=>{const i=e.getURLsToCacheKeys();for(const n of ht(r.url,t)){const c=i.get(n);if(c){const o=e.getIntegrityForCacheKey(c);return{cacheKey:c,integrity:o}}}};super(s,e.strategy)}}function ft(a){const e=ee(),t=new ut(e,a);ot(t)}const dt="-precache-",pt=async(a,e=dt)=>{const s=(await self.caches.keys()).filter(r=>r.includes(e)&&r.includes(self.registration.scope)&&r!==a);return await Promise.all(s.map(r=>self.caches.delete(r))),s};function gt(){self.addEventListener("activate",a=>{const e=E.getPrecacheName();a.waitUntil(pt(e).then(t=>{}))})}function mt(a){ee().precache(a)}function wt(a,e){mt(a),ft(e)}const yt=["raw.githubusercontent.com","api.github.com","cors.bubblesort.me"];self.__WB_DISABLE_DEV_LOGS=!0,self.addEventListener("message",a=>{a.data&&a.data.type==="SKIP_WAITING"&&(a.waitUntil(caches.keys().then(e=>Promise.all(e.map(t=>caches.delete(t))))),self.skipWaiting())}),fe(),gt(),we(({url:a})=>yt.includes(a.hostname),new Pe({cacheName:"github-cache",matchOptions:{ignoreVary:!0},plugins:[new Xe({matchOptions:{ignoreVary:!0},purgeOnQuotaError:!0,maxAgeSeconds:5*60})]})),wt([{"revision":null,"url":"assets/index-CpgJ1VEI.js"},{"revision":null,"url":"assets/index-CTUyMDrQ.css"},{"revision":null,"url":"assets/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3-UBGEe-DAIrzMIp.woff2"},{"revision":null,"url":"assets/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3CUBGEe-DnPa8eh0.woff2"},{"revision":null,"url":"assets/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3GUBGEe-mFIB_JhL.woff2"},{"revision":null,"url":"assets/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3iUBGEe-B1tIhOr4.woff2"},{"revision":null,"url":"assets/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3KUBGEe-Dqr_DJ6L.woff2"},{"revision":null,"url":"assets/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3OUBGEe-CaxB3VTI.woff2"},{"revision":null,"url":"assets/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMa3yUBA-CHnqiQTt.woff2"},{"revision":null,"url":"assets/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMawCUBGEe-SopRAUEK.woff2"},{"revision":null,"url":"assets/KFO7CnqEu92Fr1ME7kSn66aGLdTylUAMaxKUBGEe-Bm5C9Z0M.woff2"},{"revision":null,"url":"assets/virtual_pwa-register-CIvX8jmb.js"},{"revision":null,"url":"assets/workbox-window.prod.es5-D5gOYdM7.js"},{"revision":"6ce0e5a8d9a0d3c0c9ace2f223b7068a","url":"favicon.ico"},{"revision":"d4bc03e2017da139e2a4603eaf8195a1","url":"favicon.svg"},{"revision":"988ee9f256c3b730bb4e7771e18b4848","url":"gt20.glb"},{"revision":"f1dccf6d2b84a9148ce88dfa7dad0f78","url":"index.html"},{"revision":"2a0a75b8b7f06e047283bedf79d3896d","url":"manifest.webmanifest"},{"revision":"c5616857dd9f8ee730a159f701da92f6","url":"osd_background.jpg"},{"revision":"4c1e1e57346542f8fd4747cd88283300","url":"osd_logo.png"},{"revision":"2de77aadd0392a044c8954b4c51557b6","url":"osd/betaflight.png"},{"revision":"7f4ba3bdccda9ca69f2440e3f8938d05","url":"osd/bold.png"},{"revision":"772349aafae91d4ffb4593623bd43eb3","url":"osd/clarity.png"},{"revision":"499dabcf42c7daa9f57df69d9226b9c7","url":"osd/default.png"},{"revision":"85ae0a13d466af533c71f0c77a33f7c9","url":"osd/digital.png"},{"revision":"d33a8a1111380b4d8695c07f2f3e8d52","url":"osd/extra_large.png"},{"revision":"5ca8a29e5c03412804f56f909df13b4c","url":"osd/hdzero_quic.png"},{"revision":"760b7aeba8f52775bcfd391930192408","url":"osd/impact_mini.png"},{"revision":"063bfdbdd6c093259ec3734081fa6df9","url":"osd/impact.png"},{"revision":"a9a4c1e13773eb117a552408f1f6f4ae","url":"osd/large.png"},{"revision":"d86544fadae762bde5a852b71dc5df91","url":"osd/vision.png"},{"revision":"d616d98486a4b04ce126936035465084","url":"pwa.png"},{"revision":"f77c87f977e0fcce05a6df46c885a129","url":"robots.txt"},{"revision":"d616d98486a4b04ce126936035465084","url":"pwa.png"},{"revision":"2a0a75b8b7f06e047283bedf79d3896d","url":"manifest.webmanifest"}])})();
