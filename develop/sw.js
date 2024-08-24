(function(){"use strict";try{self["workbox:core:7.0.0"]&&_()}catch{}const le=null,x=(a,...e)=>{let t=a;return e.length>0&&(t+=` :: ${JSON.stringify(e)}`),t};class l extends Error{constructor(e,t){const s=x(e,t);super(s),this.name=e,this.details=t}}const E=new Set,f={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:typeof registration<"u"?registration.scope:""},b=a=>[f.prefix,a,f.suffix].filter(e=>e&&e.length>0).join("-"),O=a=>{for(const e of Object.keys(f))a(e)},m={updateDetails:a=>{O(e=>{typeof a[e]=="string"&&(f[e]=a[e])})},getGoogleAnalyticsName:a=>a||b(f.googleAnalytics),getPrecacheName:a=>a||b(f.precache),getPrefix:()=>f.prefix,getRuntimeName:a=>a||b(f.runtime),getSuffix:()=>f.suffix};function L(a,e){const t=new URL(a);for(const s of e)t.searchParams.delete(s);return t.href}async function I(a,e,t,s){const n=L(e.url,t);if(e.url===n)return a.match(e,s);const r=Object.assign(Object.assign({},s),{ignoreSearch:!0}),c=await a.keys(e,r);for(const i of c){const o=L(i.url,t);if(n===o)return a.match(i,s)}}let g;function M(){if(g===void 0){const a=new Response("");if("body"in a)try{new Response(a.body),g=!0}catch{g=!1}g=!1}return g}class W{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}async function A(){for(const a of E)await a()}const D=a=>new URL(String(a),location.href).href.replace(new RegExp(`^${location.origin}`),"");function S(a){return new Promise(e=>setTimeout(e,a))}function k(a,e){const t=e();return a.waitUntil(t),t}async function q(a,e){let t=null;if(a.url&&(t=new URL(a.url).origin),t!==self.location.origin)throw new l("cross-origin-copy-response",{origin:t});const s=a.clone(),r={headers:new Headers(s.headers),status:s.status,statusText:s.statusText},c=M()?s.body:await s.blob();return new Response(c,r)}function j(){self.addEventListener("activate",()=>self.clients.claim())}try{self["workbox:routing:7.0.0"]&&_()}catch{}const P="GET",R=a=>a&&typeof a=="object"?a:{handle:a};class p{constructor(e,t,s=P){this.handler=R(t),this.match=e,this.method=s}setCatchHandler(e){this.catchHandler=R(e)}}class F extends p{constructor(e,t,s){const n=({url:r})=>{const c=e.exec(r.href);if(c&&!(r.origin!==location.origin&&c.index!==0))return c.slice(1)};super(n,t,s)}}class H{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)})}addCacheListener(){self.addEventListener("message",e=>{if(e.data&&e.data.type==="CACHE_URLS"){const{payload:t}=e.data,s=Promise.all(t.urlsToCache.map(n=>{typeof n=="string"&&(n=[n]);const r=new Request(...n);return this.handleRequest({request:r,event:e})}));e.waitUntil(s),e.ports&&e.ports[0]&&s.then(()=>e.ports[0].postMessage(!0))}})}handleRequest({request:e,event:t}){const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http"))return;const n=s.origin===location.origin,{params:r,route:c}=this.findMatchingRoute({event:t,request:e,sameOrigin:n,url:s});let i=c&&c.handler;const o=e.method;if(!i&&this._defaultHandlerMap.has(o)&&(i=this._defaultHandlerMap.get(o)),!i)return;let h;try{h=i.handle({url:s,request:e,event:t,params:r})}catch(u){h=Promise.reject(u)}const w=c&&c.catchHandler;return h instanceof Promise&&(this._catchHandler||w)&&(h=h.catch(async u=>{if(w)try{return await w.handle({url:s,request:e,event:t,params:r})}catch(N){N instanceof Error&&(u=N)}if(this._catchHandler)return this._catchHandler.handle({url:s,request:e,event:t});throw u})),h}findMatchingRoute({url:e,sameOrigin:t,request:s,event:n}){const r=this._routes.get(s.method)||[];for(const c of r){let i;const o=c.match({url:e,sameOrigin:t,request:s,event:n});if(o)return i=o,(Array.isArray(i)&&i.length===0||o.constructor===Object&&Object.keys(o).length===0||typeof o=="boolean")&&(i=void 0),{route:c,params:i}}return{}}setDefaultHandler(e,t=P){this._defaultHandlerMap.set(t,R(e))}setCatchHandler(e){this._catchHandler=R(e)}registerRoute(e){this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new l("unregister-route-but-not-found-with-method",{method:e.method});const t=this._routes.get(e.method).indexOf(e);if(t>-1)this._routes.get(e.method).splice(t,1);else throw new l("unregister-route-route-not-registered")}}let y;const B=()=>(y||(y=new H,y.addFetchListener(),y.addCacheListener()),y);function K(a,e,t){let s;if(typeof a=="string"){const r=new URL(a,location.href),c=({url:i})=>i.href===r.href;s=new p(c,e,t)}else if(a instanceof RegExp)s=new F(a,e,t);else if(typeof a=="function")s=new p(a,e,t);else if(a instanceof p)s=a;else throw new l("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});return B().registerRoute(s),s}try{self["workbox:strategies:7.0.0"]&&_()}catch{}function C(a){return typeof a=="string"?new Request(a):a}class G{constructor(e,t){this._cacheKeys={},Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new W,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const s of this._plugins)this._pluginStateMap.set(s,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:t}=this;let s=C(e);if(s.mode==="navigate"&&t instanceof FetchEvent&&t.preloadResponse){const c=await t.preloadResponse;if(c)return c}const n=this.hasCallback("fetchDidFail")?s.clone():null;try{for(const c of this.iterateCallbacks("requestWillFetch"))s=await c({request:s.clone(),event:t})}catch(c){if(c instanceof Error)throw new l("plugin-error-request-will-fetch",{thrownErrorMessage:c.message})}const r=s.clone();try{let c;c=await fetch(s,s.mode==="navigate"?void 0:this._strategy.fetchOptions);for(const i of this.iterateCallbacks("fetchDidSucceed"))c=await i({event:t,request:r,response:c});return c}catch(c){throw n&&await this.runCallbacks("fetchDidFail",{error:c,event:t,originalRequest:n.clone(),request:r.clone()}),c}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=C(e);let s;const{cacheName:n,matchOptions:r}=this._strategy,c=await this.getCacheKey(t,"read"),i=Object.assign(Object.assign({},r),{cacheName:n});s=await caches.match(c,i);for(const o of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await o({cacheName:n,matchOptions:r,cachedResponse:s,request:c,event:this.event})||void 0;return s}async cachePut(e,t){const s=C(e);await S(0);const n=await this.getCacheKey(s,"write");if(!t)throw new l("cache-put-with-no-response",{url:D(n.url)});const r=await this._ensureResponseSafeToCache(t);if(!r)return!1;const{cacheName:c,matchOptions:i}=this._strategy,o=await self.caches.open(c),h=this.hasCallback("cacheDidUpdate"),w=h?await I(o,n.clone(),["__WB_REVISION__"],i):null;try{await o.put(n,h?r.clone():r)}catch(u){if(u instanceof Error)throw u.name==="QuotaExceededError"&&await A(),u}for(const u of this.iterateCallbacks("cacheDidUpdate"))await u({cacheName:c,oldResponse:w,newResponse:r.clone(),request:n,event:this.event});return!0}async getCacheKey(e,t){const s=`${e.url} | ${t}`;if(!this._cacheKeys[s]){let n=e;for(const r of this.iterateCallbacks("cacheKeyWillBeUsed"))n=C(await r({mode:t,request:n,event:this.event,params:this.params}));this._cacheKeys[s]=n}return this._cacheKeys[s]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if(typeof t[e]=="function"){const s=this._pluginStateMap.get(t);yield r=>{const c=Object.assign(Object.assign({},r),{state:s});return t[e](c)}}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const n of this.iterateCallbacks("cacheWillUpdate"))if(t=await n({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||t&&t.status!==200&&(t=void 0),t}}class v{constructor(e={}){this.cacheName=m.getRuntimeName(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s=typeof e.request=="string"?new Request(e.request):e.request,n="params"in e?e.params:void 0,r=new G(this,{event:t,request:s,params:n}),c=this._getResponse(r,s,t),i=this._awaitComplete(c,r,s,t);return[c,i]}async _getResponse(e,t,s){await e.runCallbacks("handlerWillStart",{event:s,request:t});let n;try{if(n=await this._handle(t,e),!n||n.type==="error")throw new l("no-response",{url:t.url})}catch(r){if(r instanceof Error){for(const c of e.iterateCallbacks("handlerDidError"))if(n=await c({error:r,event:s,request:t}),n)break}if(!n)throw r}for(const r of e.iterateCallbacks("handlerWillRespond"))n=await r({event:s,request:t,response:n});return n}async _awaitComplete(e,t,s,n){let r,c;try{r=await e}catch{}try{await t.runCallbacks("handlerDidRespond",{event:n,request:s,response:r}),await t.doneWaiting()}catch(i){i instanceof Error&&(c=i)}if(await t.runCallbacks("handlerDidComplete",{event:n,request:s,response:r,error:c}),t.destroy(),c)throw c}}const V={cacheWillUpdate:async({response:a})=>a.status===200||a.status===0?a:null};class $ extends v{constructor(e={}){super(e),this.plugins.some(t=>"cacheWillUpdate"in t)||this.plugins.unshift(V)}async _handle(e,t){const s=t.fetchAndCachePut(e).catch(()=>{});t.waitUntil(s);let n=await t.cacheMatch(e),r;if(!n)try{n=await s}catch(c){c instanceof Error&&(r=c)}if(!n)throw new l("no-response",{url:e.url,error:r});return n}}try{self["workbox:precaching:7.0.0"]&&_()}catch{}const Q="__WB_REVISION__";function z(a){if(!a)throw new l("add-to-cache-list-unexpected-type",{entry:a});if(typeof a=="string"){const r=new URL(a,location.href);return{cacheKey:r.href,url:r.href}}const{revision:e,url:t}=a;if(!t)throw new l("add-to-cache-list-unexpected-type",{entry:a});if(!e){const r=new URL(t,location.href);return{cacheKey:r.href,url:r.href}}const s=new URL(t,location.href),n=new URL(t,location.href);return s.searchParams.set(Q,e),{cacheKey:s.href,url:n.href}}class J{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:s})=>{if(e.type==="install"&&t&&t.originalRequest&&t.originalRequest instanceof Request){const n=t.originalRequest.url;s?this.notUpdatedURLs.push(n):this.updatedURLs.push(n)}return s}}}class X{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:t,params:s})=>{const n=(s==null?void 0:s.cacheKey)||this._precacheController.getCacheKeyForURL(t.url);return n?new Request(n,{headers:t.headers}):t},this._precacheController=e}}class d extends v{constructor(e={}){e.cacheName=m.getPrecacheName(e.cacheName),super(e),this._fallbackToNetwork=e.fallbackToNetwork!==!1,this.plugins.push(d.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const s=await t.cacheMatch(e);return s||(t.event&&t.event.type==="install"?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,t){let s;const n=t.params||{};if(this._fallbackToNetwork){const r=n.integrity,c=e.integrity,i=!c||c===r;s=await t.fetch(new Request(e,{integrity:e.mode!=="no-cors"?c||r:void 0})),r&&i&&e.mode!=="no-cors"&&(this._useDefaultCacheabilityPluginIfNeeded(),await t.cachePut(e,s.clone()))}else throw new l("missing-precache-entry",{cacheName:this.cacheName,url:e.url});return s}async _handleInstall(e,t){this._useDefaultCacheabilityPluginIfNeeded();const s=await t.fetch(e);if(!await t.cachePut(e,s.clone()))throw new l("bad-precaching-response",{url:e.url,status:s.status});return s}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,n]of this.plugins.entries())n!==d.copyRedirectedCacheableResponsesPlugin&&(n===d.defaultPrecacheCacheabilityPlugin&&(e=s),n.cacheWillUpdate&&t++);t===0?this.plugins.push(d.defaultPrecacheCacheabilityPlugin):t>1&&e!==null&&this.plugins.splice(e,1)}}d.defaultPrecacheCacheabilityPlugin={async cacheWillUpdate({response:a}){return!a||a.status>=400?null:a}},d.copyRedirectedCacheableResponsesPlugin={async cacheWillUpdate({response:a}){return a.redirected?await q(a):a}};class Y{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new d({cacheName:m.getPrecacheName(e),plugins:[...t,new X({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){const t=[];for(const s of e){typeof s=="string"?t.push(s):s&&s.revision===void 0&&t.push(s.url);const{cacheKey:n,url:r}=z(s),c=typeof s!="string"&&s.revision?"reload":"default";if(this._urlsToCacheKeys.has(r)&&this._urlsToCacheKeys.get(r)!==n)throw new l("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(r),secondEntry:n});if(typeof s!="string"&&s.integrity){if(this._cacheKeysToIntegrities.has(n)&&this._cacheKeysToIntegrities.get(n)!==s.integrity)throw new l("add-to-cache-list-conflicting-integrities",{url:r});this._cacheKeysToIntegrities.set(n,s.integrity)}if(this._urlsToCacheKeys.set(r,n),this._urlsToCacheModes.set(r,c),t.length>0){const i=`Workbox is precaching URLs without revision info: ${t.join(", ")}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`;console.warn(i)}}}install(e){return k(e,async()=>{const t=new J;this.strategy.plugins.push(t);for(const[r,c]of this._urlsToCacheKeys){const i=this._cacheKeysToIntegrities.get(c),o=this._urlsToCacheModes.get(r),h=new Request(r,{integrity:i,cache:o,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:c},request:h,event:e}))}const{updatedURLs:s,notUpdatedURLs:n}=t;return{updatedURLs:s,notUpdatedURLs:n}})}activate(e){return k(e,async()=>{const t=await self.caches.open(this.strategy.cacheName),s=await t.keys(),n=new Set(this._urlsToCacheKeys.values()),r=[];for(const c of s)n.has(c.url)||(await t.delete(c),r.push(c.url));return{deletedURLs:r}})}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s)return(await self.caches.open(this.strategy.cacheName)).match(s)}createHandlerBoundToURL(e){const t=this.getCacheKeyForURL(e);if(!t)throw new l("non-precached-url",{url:e});return s=>(s.request=new Request(e),s.params=Object.assign({cacheKey:t},s.params),this.strategy.handle(s))}}let U;const T=()=>(U||(U=new Y),U);function Z(a,e=[]){for(const t of[...a.searchParams.keys()])e.some(s=>s.test(t))&&a.searchParams.delete(t);return a}function*ee(a,{ignoreURLParametersMatching:e=[/^utm_/,/^fbclid$/],directoryIndex:t="index.html",cleanURLs:s=!0,urlManipulation:n}={}){const r=new URL(a,location.href);r.hash="",yield r.href;const c=Z(r,e);if(yield c.href,t&&c.pathname.endsWith("/")){const i=new URL(c.href);i.pathname+=t,yield i.href}if(s){const i=new URL(c.href);i.pathname+=".html",yield i.href}if(n){const i=n({url:r});for(const o of i)yield o.href}}class te extends p{constructor(e,t){const s=({request:n})=>{const r=e.getURLsToCacheKeys();for(const c of ee(n.url,t)){const i=r.get(c);if(i){const o=e.getIntegrityForCacheKey(i);return{cacheKey:i,integrity:o}}}};super(s,e.strategy)}}function se(a){const e=T(),t=new te(e,a);K(t)}const ae="-precache-",ne=async(a,e=ae)=>{const s=(await self.caches.keys()).filter(n=>n.includes(e)&&n.includes(self.registration.scope)&&n!==a);return await Promise.all(s.map(n=>self.caches.delete(n))),s};function re(){self.addEventListener("activate",a=>{const e=m.getPrecacheName();a.waitUntil(ne(e).then(t=>{}))})}function ce(a){T().precache(a)}function ie(a,e){ce(a),se(e)}const oe=["raw.githubusercontent.com","api.github.com","cors.bubblesort.me"];self.__WB_DISABLE_DEV_LOGS=!0,self.addEventListener("message",a=>{a.data&&a.data.type==="SKIP_WAITING"&&self.skipWaiting()}),j(),re(),K(({url:a})=>oe.includes(a.hostname),new $({cacheName:"github-cache",matchOptions:{ignoreVary:!0}})),ie([{"revision":null,"url":"assets/index-CEktxAzF.js"},{"revision":null,"url":"assets/index-CjbvI8OD.css"},{"revision":null,"url":"assets/KFOlCnqEu92Fr1MmWUlfABc4EsA-jruQITdB.woff2"},{"revision":null,"url":"assets/KFOlCnqEu92Fr1MmWUlfBBc4-CbYYDfWS.woff2"},{"revision":null,"url":"assets/KFOlCnqEu92Fr1MmWUlfBxc4EsA-Bs05n1ZH.woff2"},{"revision":null,"url":"assets/KFOlCnqEu92Fr1MmWUlfCBc4EsA-CqebB7cL.woff2"},{"revision":null,"url":"assets/KFOlCnqEu92Fr1MmWUlfChc4EsA-DchBbzVz.woff2"},{"revision":null,"url":"assets/KFOlCnqEu92Fr1MmWUlfCRc4EsA-CyZgh00P.woff2"},{"revision":null,"url":"assets/KFOlCnqEu92Fr1MmWUlfCxc4EsA-CBbheh0s.woff2"},{"revision":null,"url":"assets/KFOmCnqEu92Fr1Mu4mxK-DXyFPIdK.woff2"},{"revision":null,"url":"assets/KFOmCnqEu92Fr1Mu4WxKOzY-LPh2sqOm.woff2"},{"revision":null,"url":"assets/KFOmCnqEu92Fr1Mu5mxKOzY-BiRJyiea.woff2"},{"revision":null,"url":"assets/KFOmCnqEu92Fr1Mu72xKOzY-D76n7Daw.woff2"},{"revision":null,"url":"assets/KFOmCnqEu92Fr1Mu7GxKOzY-DgXbz5gU.woff2"},{"revision":null,"url":"assets/KFOmCnqEu92Fr1Mu7mxKOzY-Dduq6i1a.woff2"},{"revision":null,"url":"assets/KFOmCnqEu92Fr1Mu7WxKOzY-DhTUfTw_.woff2"},{"revision":null,"url":"assets/virtual_pwa-register-FSzRwN87.js"},{"revision":null,"url":"assets/workbox-window.prod.es5-D5gOYdM7.js"},{"revision":"6ce0e5a8d9a0d3c0c9ace2f223b7068a","url":"favicon.ico"},{"revision":"d4bc03e2017da139e2a4603eaf8195a1","url":"favicon.svg"},{"revision":"988ee9f256c3b730bb4e7771e18b4848","url":"gt20.glb"},{"revision":"d0c078828dacbea191ca3b6fdbf7ddb5","url":"index.html"},{"revision":"ae1e7c12dbec082dc4101ce77ff08e34","url":"manifest.webmanifest"},{"revision":"c5616857dd9f8ee730a159f701da92f6","url":"osd_background.jpg"},{"revision":"4c1e1e57346542f8fd4747cd88283300","url":"osd_logo.png"},{"revision":"2de77aadd0392a044c8954b4c51557b6","url":"osd/betaflight.png"},{"revision":"7f4ba3bdccda9ca69f2440e3f8938d05","url":"osd/bold.png"},{"revision":"772349aafae91d4ffb4593623bd43eb3","url":"osd/clarity.png"},{"revision":"499dabcf42c7daa9f57df69d9226b9c7","url":"osd/default.png"},{"revision":"85ae0a13d466af533c71f0c77a33f7c9","url":"osd/digital.png"},{"revision":"d33a8a1111380b4d8695c07f2f3e8d52","url":"osd/extra_large.png"},{"revision":"5ca8a29e5c03412804f56f909df13b4c","url":"osd/hdzero_quic.png"},{"revision":"760b7aeba8f52775bcfd391930192408","url":"osd/impact_mini.png"},{"revision":"063bfdbdd6c093259ec3734081fa6df9","url":"osd/impact.png"},{"revision":"a9a4c1e13773eb117a552408f1f6f4ae","url":"osd/large.png"},{"revision":"d86544fadae762bde5a852b71dc5df91","url":"osd/vision.png"},{"revision":"d616d98486a4b04ce126936035465084","url":"pwa.png"},{"revision":"f77c87f977e0fcce05a6df46c885a129","url":"robots.txt"},{"revision":"d616d98486a4b04ce126936035465084","url":"pwa.png"},{"revision":"ae1e7c12dbec082dc4101ce77ff08e34","url":"manifest.webmanifest"}])})();
