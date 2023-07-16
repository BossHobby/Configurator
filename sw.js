(function(){"use strict";try{self["workbox:core:7.0.0"]&&_()}catch{}const i={}.NODE_ENV==="production"?null:(()=>{"__WB_DISABLE_DEV_LOGS"in globalThis||(self.__WB_DISABLE_DEV_LOGS=!1);let r=!1;const e={debug:"#7f8c8d",log:"#2ecc71",warn:"#f39c12",error:"#c0392b",groupCollapsed:"#3498db",groupEnd:null},t=function(a,o){if(self.__WB_DISABLE_DEV_LOGS)return;if(a==="groupCollapsed"&&/^((?!chrome|android).)*safari/i.test(navigator.userAgent)){console[a](...o);return}const c=[`background: ${e[a]}`,"border-radius: 0.5em","color: white","font-weight: bold","padding: 2px 0.5em"],l=r?[]:["%cworkbox",c.join(";")];console[a](...l,...o),a==="groupCollapsed"&&(r=!0),a==="groupEnd"&&(r=!1)},s={},n=Object.keys(e);for(const a of n){const o=a;s[o]=(...c)=>{t(o,c)}}return s})(),A={"invalid-value":({paramName:r,validValueDescription:e,value:t})=>{if(!r||!e)throw new Error("Unexpected input to 'invalid-value' error.");return`The '${r}' parameter was given a value with an unexpected value. ${e} Received a value of ${JSON.stringify(t)}.`},"not-an-array":({moduleName:r,className:e,funcName:t,paramName:s})=>{if(!r||!e||!t||!s)throw new Error("Unexpected input to 'not-an-array' error.");return`The parameter '${s}' passed into '${r}.${e}.${t}()' must be an array.`},"incorrect-type":({expectedType:r,paramName:e,moduleName:t,className:s,funcName:n})=>{if(!r||!e||!t||!n)throw new Error("Unexpected input to 'incorrect-type' error.");const a=s?`${s}.`:"";return`The parameter '${e}' passed into '${t}.${a}${n}()' must be of type ${r}.`},"incorrect-class":({expectedClassName:r,paramName:e,moduleName:t,className:s,funcName:n,isReturnValueProblem:a})=>{if(!r||!t||!n)throw new Error("Unexpected input to 'incorrect-class' error.");const o=s?`${s}.`:"";return a?`The return value from '${t}.${o}${n}()' must be an instance of class ${r}.`:`The parameter '${e}' passed into '${t}.${o}${n}()' must be an instance of class ${r}.`},"missing-a-method":({expectedMethod:r,paramName:e,moduleName:t,className:s,funcName:n})=>{if(!r||!e||!t||!s||!n)throw new Error("Unexpected input to 'missing-a-method' error.");return`${t}.${s}.${n}() expected the '${e}' parameter to expose a '${r}' method.`},"add-to-cache-list-unexpected-type":({entry:r})=>`An unexpected entry was passed to 'workbox-precaching.PrecacheController.addToCacheList()' The entry '${JSON.stringify(r)}' isn't supported. You must supply an array of strings with one or more characters, objects with a url property or Request objects.`,"add-to-cache-list-conflicting-entries":({firstEntry:r,secondEntry:e})=>{if(!r||!e)throw new Error("Unexpected input to 'add-to-cache-list-duplicate-entries' error.");return`Two of the entries passed to 'workbox-precaching.PrecacheController.addToCacheList()' had the URL ${r} but different revision details. Workbox is unable to cache and version the asset correctly. Please remove one of the entries.`},"plugin-error-request-will-fetch":({thrownErrorMessage:r})=>{if(!r)throw new Error("Unexpected input to 'plugin-error-request-will-fetch', error.");return`An error was thrown by a plugins 'requestWillFetch()' method. The thrown error message was: '${r}'.`},"invalid-cache-name":({cacheNameId:r,value:e})=>{if(!r)throw new Error("Expected a 'cacheNameId' for error 'invalid-cache-name'");return`You must provide a name containing at least one character for setCacheDetails({${r}: '...'}). Received a value of '${JSON.stringify(e)}'`},"unregister-route-but-not-found-with-method":({method:r})=>{if(!r)throw new Error("Unexpected input to 'unregister-route-but-not-found-with-method' error.");return`The route you're trying to unregister was not  previously registered for the method type '${r}'.`},"unregister-route-route-not-registered":()=>"The route you're trying to unregister was not previously registered.","queue-replay-failed":({name:r})=>`Replaying the background sync queue '${r}' failed.`,"duplicate-queue-name":({name:r})=>`The Queue name '${r}' is already being used. All instances of backgroundSync.Queue must be given unique names.`,"expired-test-without-max-age":({methodName:r,paramName:e})=>`The '${r}()' method can only be used when the '${e}' is used in the constructor.`,"unsupported-route-type":({moduleName:r,className:e,funcName:t,paramName:s})=>`The supplied '${s}' parameter was an unsupported type. Please check the docs for ${r}.${e}.${t} for valid input types.`,"not-array-of-class":({value:r,expectedClass:e,moduleName:t,className:s,funcName:n,paramName:a})=>`The supplied '${a}' parameter must be an array of '${e}' objects. Received '${JSON.stringify(r)},'. Please check the call to ${t}.${s}.${n}() to fix the issue.`,"max-entries-or-age-required":({moduleName:r,className:e,funcName:t})=>`You must define either config.maxEntries or config.maxAgeSecondsin ${r}.${e}.${t}`,"statuses-or-headers-required":({moduleName:r,className:e,funcName:t})=>`You must define either config.statuses or config.headersin ${r}.${e}.${t}`,"invalid-string":({moduleName:r,funcName:e,paramName:t})=>{if(!t||!r||!e)throw new Error("Unexpected input to 'invalid-string' error.");return`When using strings, the '${t}' parameter must start with 'http' (for cross-origin matches) or '/' (for same-origin matches). Please see the docs for ${r}.${e}() for more info.`},"channel-name-required":()=>"You must provide a channelName to construct a BroadcastCacheUpdate instance.","invalid-responses-are-same-args":()=>"The arguments passed into responsesAreSame() appear to be invalid. Please ensure valid Responses are used.","expire-custom-caches-only":()=>"You must provide a 'cacheName' property when using the expiration plugin with a runtime caching strategy.","unit-must-be-bytes":({normalizedRangeHeader:r})=>{if(!r)throw new Error("Unexpected input to 'unit-must-be-bytes' error.");return`The 'unit' portion of the Range header must be set to 'bytes'. The Range header provided was "${r}"`},"single-range-only":({normalizedRangeHeader:r})=>{if(!r)throw new Error("Unexpected input to 'single-range-only' error.");return`Multiple ranges are not supported. Please use a  single start value, and optional end value. The Range header provided was "${r}"`},"invalid-range-values":({normalizedRangeHeader:r})=>{if(!r)throw new Error("Unexpected input to 'invalid-range-values' error.");return`The Range header is missing both start and end values. At least one of those values is needed. The Range header provided was "${r}"`},"no-range-header":()=>"No Range header was found in the Request provided.","range-not-satisfiable":({size:r,start:e,end:t})=>`The start (${e}) and end (${t}) values in the Range are not satisfiable by the cached response, which is ${r} bytes.`,"attempt-to-cache-non-get-request":({url:r,method:e})=>`Unable to cache '${r}' because it is a '${e}' request and only 'GET' requests can be cached.`,"cache-put-with-no-response":({url:r})=>`There was an attempt to cache '${r}' but the response was not defined.`,"no-response":({url:r,error:e})=>{let t=`The strategy could not generate a response for '${r}'.`;return e&&(t+=` The underlying error is ${e}.`),t},"bad-precaching-response":({url:r,status:e})=>`The precaching request for '${r}' failed`+(e?` with an HTTP status of ${e}.`:"."),"non-precached-url":({url:r})=>`createHandlerBoundToURL('${r}') was called, but that URL is not precached. Please pass in a URL that is precached instead.`,"add-to-cache-list-conflicting-integrities":({url:r})=>`Two of the entries passed to 'workbox-precaching.PrecacheController.addToCacheList()' had the URL ${r} with different integrity values. Please remove one of them.`,"missing-precache-entry":({cacheName:r,url:e})=>`Unable to find a precached response in ${r} for ${e}.`,"cross-origin-copy-response":({origin:r})=>`workbox-core.copyResponse() can only be used with same-origin responses. It was passed a response with origin ${r}.`,"opaque-streams-source":({type:r})=>{const e=`One of the workbox-streams sources resulted in an '${r}' response.`;return r==="opaqueredirect"?`${e} Please do not use a navigation request that results in a redirect as a source.`:`${e} Please ensure your sources are CORS-enabled.`}},q=(r,...e)=>{let t=r;return e.length>0&&(t+=` :: ${JSON.stringify(e)}`),t},I=(r,e={})=>{const t=A[r];if(!t)throw new Error(`Unable to find message for code '${r}'.`);return t(e)},W={}.NODE_ENV==="production"?q:I;class u extends Error{constructor(e,t){const s=W(e,t);super(s),this.name=e,this.details=t}}const M=(r,e)=>{if(!Array.isArray(r))throw new u("not-an-array",e)},F=(r,e,t)=>{if(typeof r[e]!=="function")throw t.expectedMethod=e,new u("missing-a-method",t)},j=(r,e,t)=>{if(typeof r!==e)throw t.expectedType=e,new u("incorrect-type",t)},H=(r,e,t)=>{if(!(r instanceof e))throw t.expectedClassName=e.name,new u("incorrect-class",t)},B=(r,e,t)=>{if(!e.includes(r))throw t.validValueDescription=`Valid values are ${JSON.stringify(e)}.`,new u("invalid-value",t)},G=(r,e,t)=>{const s=new u("not-array-of-class",t);if(!Array.isArray(r))throw s;for(const n of r)if(!(n instanceof e))throw s},d={}.NODE_ENV==="production"?null:{hasMethod:F,isArray:M,isInstance:H,isOneOf:B,isType:j,isArrayOfClass:G},T=new Set,g={googleAnalytics:"googleAnalytics",precache:"precache-v2",prefix:"workbox",runtime:"runtime",suffix:typeof registration<"u"?registration.scope:""},k=r=>[g.prefix,r,g.suffix].filter(e=>e&&e.length>0).join("-"),J=r=>{for(const e of Object.keys(g))r(e)},R={updateDetails:r=>{J(e=>{typeof r[e]=="string"&&(g[e]=r[e])})},getGoogleAnalyticsName:r=>r||k(g.googleAnalytics),getPrecacheName:r=>r||k(g.precache),getPrefix:()=>g.prefix,getRuntimeName:r=>r||k(g.runtime),getSuffix:()=>g.suffix};function O(r,e){const t=new URL(r);for(const s of e)t.searchParams.delete(s);return t.href}async function Y(r,e,t,s){const n=O(e.url,t);if(e.url===n)return r.match(e,s);const a=Object.assign(Object.assign({},s),{ignoreSearch:!0}),o=await r.keys(e,a);for(const c of o){const l=O(c.url,t);if(n===l)return r.match(c,s)}}let b;function Q(){if(b===void 0){const r=new Response("");if("body"in r)try{new Response(r.body),b=!0}catch{b=!1}b=!1}return b}class X{constructor(){this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}}async function Z(){({}).NODE_ENV!=="production"&&i.log(`About to run ${T.size} callbacks to clean up caches.`);for(const r of T)await r(),{}.NODE_ENV!=="production"&&i.log(r,"is complete.");({}).NODE_ENV!=="production"&&i.log("Finished running callbacks.")}const h=r=>new URL(String(r),location.href).href.replace(new RegExp(`^${location.origin}`),"");function z(r){return new Promise(e=>setTimeout(e,r))}function v(r,e){const t=e();return r.waitUntil(t),t}async function ee(r,e){let t=null;if(r.url&&(t=new URL(r.url).origin),t!==self.location.origin)throw new u("cross-origin-copy-response",{origin:t});const s=r.clone(),n={headers:new Headers(s.headers),status:s.status,statusText:s.statusText},a=e?e(n):n,o=Q()?s.body:await s.blob();return new Response(o,a)}function te(){self.addEventListener("activate",()=>self.clients.claim())}try{self["workbox:routing:7.0.0"]&&_()}catch{}const x="GET",re=["DELETE","GET","HEAD","PATCH","POST","PUT"],C=r=>r&&typeof r=="object"?({}.NODE_ENV!=="production"&&d.hasMethod(r,"handle",{moduleName:"workbox-routing",className:"Route",funcName:"constructor",paramName:"handler"}),r):({}.NODE_ENV!=="production"&&d.isType(r,"function",{moduleName:"workbox-routing",className:"Route",funcName:"constructor",paramName:"handler"}),{handle:r});class N{constructor(e,t,s=x){({}).NODE_ENV!=="production"&&(d.isType(e,"function",{moduleName:"workbox-routing",className:"Route",funcName:"constructor",paramName:"match"}),s&&d.isOneOf(s,re,{paramName:"method"})),this.handler=C(t),this.match=e,this.method=s}setCatchHandler(e){this.catchHandler=C(e)}}class se extends N{constructor(e,t,s){({}).NODE_ENV!=="production"&&d.isInstance(e,RegExp,{moduleName:"workbox-routing",className:"RegExpRoute",funcName:"constructor",paramName:"pattern"});const n=({url:a})=>{const o=e.exec(a.href);if(o){if(a.origin!==location.origin&&o.index!==0){({}).NODE_ENV!=="production"&&i.debug(`The regular expression '${e.toString()}' only partially matched against the cross-origin URL '${a.toString()}'. RegExpRoute's will only handle cross-origin requests if they match the entire URL.`);return}return o.slice(1)}};super(n,t,s)}}class ne{constructor(){this._routes=new Map,this._defaultHandlerMap=new Map}get routes(){return this._routes}addFetchListener(){self.addEventListener("fetch",e=>{const{request:t}=e,s=this.handleRequest({request:t,event:e});s&&e.respondWith(s)})}addCacheListener(){self.addEventListener("message",e=>{if(e.data&&e.data.type==="CACHE_URLS"){const{payload:t}=e.data;({}).NODE_ENV!=="production"&&i.debug("Caching URLs from the window",t.urlsToCache);const s=Promise.all(t.urlsToCache.map(n=>{typeof n=="string"&&(n=[n]);const a=new Request(...n);return this.handleRequest({request:a,event:e})}));e.waitUntil(s),e.ports&&e.ports[0]&&s.then(()=>e.ports[0].postMessage(!0))}})}handleRequest({request:e,event:t}){({}).NODE_ENV!=="production"&&d.isInstance(e,Request,{moduleName:"workbox-routing",className:"Router",funcName:"handleRequest",paramName:"options.request"});const s=new URL(e.url,location.href);if(!s.protocol.startsWith("http")){({}).NODE_ENV!=="production"&&i.debug("Workbox Router only supports URLs that start with 'http'.");return}const n=s.origin===location.origin,{params:a,route:o}=this.findMatchingRoute({event:t,request:e,sameOrigin:n,url:s});let c=o&&o.handler;const l=[];({}).NODE_ENV!=="production"&&c&&(l.push(["Found a route to handle this request:",o]),a&&l.push(["Passing the following params to the route's handler:",a]));const m=e.method;if(!c&&this._defaultHandlerMap.has(m)&&({}.NODE_ENV!=="production"&&l.push(`Failed to find a matching route. Falling back to the default handler for ${m}.`),c=this._defaultHandlerMap.get(m)),!c){({}).NODE_ENV!=="production"&&i.debug(`No route found for: ${h(s)}`);return}({}).NODE_ENV!=="production"&&(i.groupCollapsed(`Router is responding to: ${h(s)}`),l.forEach(p=>{Array.isArray(p)?i.log(...p):i.log(p)}),i.groupEnd());let y;try{y=c.handle({url:s,request:e,event:t,params:a})}catch(p){y=Promise.reject(p)}const f=o&&o.catchHandler;return y instanceof Promise&&(this._catchHandler||f)&&(y=y.catch(async p=>{if(f){({}).NODE_ENV!=="production"&&(i.groupCollapsed(`Error thrown when responding to:  ${h(s)}. Falling back to route's Catch Handler.`),i.error("Error thrown by:",o),i.error(p),i.groupEnd());try{return await f.handle({url:s,request:e,event:t,params:a})}catch(S){S instanceof Error&&(p=S)}}if(this._catchHandler)return{}.NODE_ENV!=="production"&&(i.groupCollapsed(`Error thrown when responding to:  ${h(s)}. Falling back to global Catch Handler.`),i.error("Error thrown by:",o),i.error(p),i.groupEnd()),this._catchHandler.handle({url:s,request:e,event:t});throw p})),y}findMatchingRoute({url:e,sameOrigin:t,request:s,event:n}){const a=this._routes.get(s.method)||[];for(const o of a){let c;const l=o.match({url:e,sameOrigin:t,request:s,event:n});if(l)return{}.NODE_ENV!=="production"&&l instanceof Promise&&i.warn(`While routing ${h(e)}, an async matchCallback function was used. Please convert the following route to use a synchronous matchCallback function:`,o),c=l,(Array.isArray(c)&&c.length===0||l.constructor===Object&&Object.keys(l).length===0||typeof l=="boolean")&&(c=void 0),{route:o,params:c}}return{}}setDefaultHandler(e,t=x){this._defaultHandlerMap.set(t,C(e))}setCatchHandler(e){this._catchHandler=C(e)}registerRoute(e){({}).NODE_ENV!=="production"&&(d.isType(e,"object",{moduleName:"workbox-routing",className:"Router",funcName:"registerRoute",paramName:"route"}),d.hasMethod(e,"match",{moduleName:"workbox-routing",className:"Router",funcName:"registerRoute",paramName:"route"}),d.isType(e.handler,"object",{moduleName:"workbox-routing",className:"Router",funcName:"registerRoute",paramName:"route"}),d.hasMethod(e.handler,"handle",{moduleName:"workbox-routing",className:"Router",funcName:"registerRoute",paramName:"route.handler"}),d.isType(e.method,"string",{moduleName:"workbox-routing",className:"Router",funcName:"registerRoute",paramName:"route.method"})),this._routes.has(e.method)||this._routes.set(e.method,[]),this._routes.get(e.method).push(e)}unregisterRoute(e){if(!this._routes.has(e.method))throw new u("unregister-route-but-not-found-with-method",{method:e.method});const t=this._routes.get(e.method).indexOf(e);if(t>-1)this._routes.get(e.method).splice(t,1);else throw new u("unregister-route-route-not-registered")}}let E;const ae=()=>(E||(E=new ne,E.addFetchListener(),E.addCacheListener()),E);function D(r,e,t){let s;if(typeof r=="string"){const a=new URL(r,location.href);if({}.NODE_ENV!=="production"){if(!(r.startsWith("/")||r.startsWith("http")))throw new u("invalid-string",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});const c=r.startsWith("http")?a.pathname:r,l="[*:?+]";new RegExp(`${l}`).exec(c)&&i.debug(`The '$capture' parameter contains an Express-style wildcard character (${l}). Strings are now always interpreted as exact matches; use a RegExp for partial or wildcard matches.`)}const o=({url:c})=>({}.NODE_ENV!=="production"&&c.pathname===a.pathname&&c.origin!==a.origin&&i.debug(`${r} only partially matches the cross-origin URL ${c.toString()}. This route will only handle cross-origin requests if they match the entire URL.`),c.href===a.href);s=new N(o,e,t)}else if(r instanceof RegExp)s=new se(r,e,t);else if(typeof r=="function")s=new N(r,e,t);else if(r instanceof N)s=r;else throw new u("unsupported-route-type",{moduleName:"workbox-routing",funcName:"registerRoute",paramName:"capture"});return ae().registerRoute(s),s}try{self["workbox:strategies:7.0.0"]&&_()}catch{}function $(r){return typeof r=="string"?new Request(r):r}class oe{constructor(e,t){this._cacheKeys={},{}.NODE_ENV!=="production"&&d.isInstance(t.event,ExtendableEvent,{moduleName:"workbox-strategies",className:"StrategyHandler",funcName:"constructor",paramName:"options.event"}),Object.assign(this,t),this.event=t.event,this._strategy=e,this._handlerDeferred=new X,this._extendLifetimePromises=[],this._plugins=[...e.plugins],this._pluginStateMap=new Map;for(const s of this._plugins)this._pluginStateMap.set(s,{});this.event.waitUntil(this._handlerDeferred.promise)}async fetch(e){const{event:t}=this;let s=$(e);if(s.mode==="navigate"&&t instanceof FetchEvent&&t.preloadResponse){const o=await t.preloadResponse;if(o)return{}.NODE_ENV!=="production"&&i.log(`Using a preloaded navigation response for '${h(s.url)}'`),o}const n=this.hasCallback("fetchDidFail")?s.clone():null;try{for(const o of this.iterateCallbacks("requestWillFetch"))s=await o({request:s.clone(),event:t})}catch(o){if(o instanceof Error)throw new u("plugin-error-request-will-fetch",{thrownErrorMessage:o.message})}const a=s.clone();try{let o;o=await fetch(s,s.mode==="navigate"?void 0:this._strategy.fetchOptions),{}.NODE_ENV!=="production"&&i.debug(`Network request for '${h(s.url)}' returned a response with status '${o.status}'.`);for(const c of this.iterateCallbacks("fetchDidSucceed"))o=await c({event:t,request:a,response:o});return o}catch(o){throw{}.NODE_ENV!=="production"&&i.log(`Network request for '${h(s.url)}' threw an error.`,o),n&&await this.runCallbacks("fetchDidFail",{error:o,event:t,originalRequest:n.clone(),request:a.clone()}),o}}async fetchAndCachePut(e){const t=await this.fetch(e),s=t.clone();return this.waitUntil(this.cachePut(e,s)),t}async cacheMatch(e){const t=$(e);let s;const{cacheName:n,matchOptions:a}=this._strategy,o=await this.getCacheKey(t,"read"),c=Object.assign(Object.assign({},a),{cacheName:n});s=await caches.match(o,c),{}.NODE_ENV!=="production"&&(s?i.debug(`Found a cached response in '${n}'.`):i.debug(`No cached response found in '${n}'.`));for(const l of this.iterateCallbacks("cachedResponseWillBeUsed"))s=await l({cacheName:n,matchOptions:a,cachedResponse:s,request:o,event:this.event})||void 0;return s}async cachePut(e,t){const s=$(e);await z(0);const n=await this.getCacheKey(s,"write");if({}.NODE_ENV!=="production"){if(n.method&&n.method!=="GET")throw new u("attempt-to-cache-non-get-request",{url:h(n.url),method:n.method});const f=t.headers.get("Vary");f&&i.debug(`The response for ${h(n.url)} has a 'Vary: ${f}' header. Consider setting the {ignoreVary: true} option on your strategy to ensure cache matching and deletion works as expected.`)}if(!t)throw{}.NODE_ENV!=="production"&&i.error(`Cannot cache non-existent response for '${h(n.url)}'.`),new u("cache-put-with-no-response",{url:h(n.url)});const a=await this._ensureResponseSafeToCache(t);if(!a)return{}.NODE_ENV!=="production"&&i.debug(`Response '${h(n.url)}' will not be cached.`,a),!1;const{cacheName:o,matchOptions:c}=this._strategy,l=await self.caches.open(o),m=this.hasCallback("cacheDidUpdate"),y=m?await Y(l,n.clone(),["__WB_REVISION__"],c):null;({}).NODE_ENV!=="production"&&i.debug(`Updating the '${o}' cache with a new Response for ${h(n.url)}.`);try{await l.put(n,m?a.clone():a)}catch(f){if(f instanceof Error)throw f.name==="QuotaExceededError"&&await Z(),f}for(const f of this.iterateCallbacks("cacheDidUpdate"))await f({cacheName:o,oldResponse:y,newResponse:a.clone(),request:n,event:this.event});return!0}async getCacheKey(e,t){const s=`${e.url} | ${t}`;if(!this._cacheKeys[s]){let n=e;for(const a of this.iterateCallbacks("cacheKeyWillBeUsed"))n=$(await a({mode:t,request:n,event:this.event,params:this.params}));this._cacheKeys[s]=n}return this._cacheKeys[s]}hasCallback(e){for(const t of this._strategy.plugins)if(e in t)return!0;return!1}async runCallbacks(e,t){for(const s of this.iterateCallbacks(e))await s(t)}*iterateCallbacks(e){for(const t of this._strategy.plugins)if(typeof t[e]=="function"){const s=this._pluginStateMap.get(t);yield a=>{const o=Object.assign(Object.assign({},a),{state:s});return t[e](o)}}}waitUntil(e){return this._extendLifetimePromises.push(e),e}async doneWaiting(){let e;for(;e=this._extendLifetimePromises.shift();)await e}destroy(){this._handlerDeferred.resolve(null)}async _ensureResponseSafeToCache(e){let t=e,s=!1;for(const n of this.iterateCallbacks("cacheWillUpdate"))if(t=await n({request:this.request,response:t,event:this.event})||void 0,s=!0,!t)break;return s||(t&&t.status!==200&&(t=void 0),{}.NODE_ENV!=="production"&&t&&t.status!==200&&(t.status===0?i.warn(`The response for '${this.request.url}' is an opaque response. The caching strategy that you're using will not cache opaque responses by default.`):i.debug(`The response for '${this.request.url}' returned a status code of '${e.status}' and won't be cached as a result.`))),t}}class L{constructor(e={}){this.cacheName=R.getRuntimeName(e.cacheName),this.plugins=e.plugins||[],this.fetchOptions=e.fetchOptions,this.matchOptions=e.matchOptions}handle(e){const[t]=this.handleAll(e);return t}handleAll(e){e instanceof FetchEvent&&(e={event:e,request:e.request});const t=e.event,s=typeof e.request=="string"?new Request(e.request):e.request,n="params"in e?e.params:void 0,a=new oe(this,{event:t,request:s,params:n}),o=this._getResponse(a,s,t),c=this._awaitComplete(o,a,s,t);return[o,c]}async _getResponse(e,t,s){await e.runCallbacks("handlerWillStart",{event:s,request:t});let n;try{if(n=await this._handle(t,e),!n||n.type==="error")throw new u("no-response",{url:t.url})}catch(a){if(a instanceof Error){for(const o of e.iterateCallbacks("handlerDidError"))if(n=await o({error:a,event:s,request:t}),n)break}if(n)({}).NODE_ENV!=="production"&&i.log(`While responding to '${h(t.url)}', an ${a instanceof Error?a.toString():""} error occurred. Using a fallback response provided by a handlerDidError plugin.`);else throw a}for(const a of e.iterateCallbacks("handlerWillRespond"))n=await a({event:s,request:t,response:n});return n}async _awaitComplete(e,t,s,n){let a,o;try{a=await e}catch{}try{await t.runCallbacks("handlerDidRespond",{event:n,request:s,response:a}),await t.doneWaiting()}catch(c){c instanceof Error&&(o=c)}if(await t.runCallbacks("handlerDidComplete",{event:n,request:s,response:a,error:o}),t.destroy(),o)throw o}}const P={strategyStart:(r,e)=>`Using ${r} to respond to '${h(e.url)}'`,printFinalResponse:r=>{r&&(i.groupCollapsed("View the final response here."),i.log(r||"[No response returned]"),i.groupEnd())}},ie={cacheWillUpdate:async({response:r})=>r.status===200||r.status===0?r:null};class ce extends L{constructor(e={}){super(e),this.plugins.some(t=>"cacheWillUpdate"in t)||this.plugins.unshift(ie)}async _handle(e,t){const s=[];({}).NODE_ENV!=="production"&&d.isInstance(e,Request,{moduleName:"workbox-strategies",className:this.constructor.name,funcName:"handle",paramName:"request"});const n=t.fetchAndCachePut(e).catch(()=>{});t.waitUntil(n);let a=await t.cacheMatch(e),o;if(a)({}).NODE_ENV!=="production"&&s.push(`Found a cached response in the '${this.cacheName}' cache. Will update with the network response in the background.`);else{({}).NODE_ENV!=="production"&&s.push(`No response found in the '${this.cacheName}' cache. Will wait for the network response.`);try{a=await n}catch(c){c instanceof Error&&(o=c)}}if({}.NODE_ENV!=="production"){i.groupCollapsed(P.strategyStart(this.constructor.name,e));for(const c of s)i.log(c);P.printFinalResponse(a),i.groupEnd()}if(!a)throw new u("no-response",{url:e.url,error:o});return a}}try{self["workbox:precaching:7.0.0"]&&_()}catch{}const le="__WB_REVISION__";function ue(r){if(!r)throw new u("add-to-cache-list-unexpected-type",{entry:r});if(typeof r=="string"){const a=new URL(r,location.href);return{cacheKey:a.href,url:a.href}}const{revision:e,url:t}=r;if(!t)throw new u("add-to-cache-list-unexpected-type",{entry:r});if(!e){const a=new URL(t,location.href);return{cacheKey:a.href,url:a.href}}const s=new URL(t,location.href),n=new URL(t,location.href);return s.searchParams.set(le,e),{cacheKey:s.href,url:n.href}}class he{constructor(){this.updatedURLs=[],this.notUpdatedURLs=[],this.handlerWillStart=async({request:e,state:t})=>{t&&(t.originalRequest=e)},this.cachedResponseWillBeUsed=async({event:e,state:t,cachedResponse:s})=>{if(e.type==="install"&&t&&t.originalRequest&&t.originalRequest instanceof Request){const n=t.originalRequest.url;s?this.notUpdatedURLs.push(n):this.updatedURLs.push(n)}return s}}}class de{constructor({precacheController:e}){this.cacheKeyWillBeUsed=async({request:t,params:s})=>{const n=(s==null?void 0:s.cacheKey)||this._precacheController.getCacheKeyForURL(t.url);return n?new Request(n,{headers:t.headers}):t},this._precacheController=e}}const fe=(r,e)=>{i.groupCollapsed(r);for(const t of e)i.log(t);i.groupEnd()};function pe(r){const e=r.length;e>0&&(i.groupCollapsed(`During precaching cleanup, ${e} cached request${e===1?" was":"s were"} deleted.`),fe("Deleted Cache Requests",r),i.groupEnd())}function V(r,e){if(e.length!==0){i.groupCollapsed(r);for(const t of e)i.log(t);i.groupEnd()}}function ge(r,e){const t=r.length,s=e.length;if(t||s){let n=`Precaching ${t} file${t===1?"":"s"}.`;s>0&&(n+=` ${s} file${s===1?" is":"s are"} already cached.`),i.groupCollapsed(n),V("View newly precached URLs.",r),V("View previously precached URLs.",e),i.groupEnd()}}class w extends L{constructor(e={}){e.cacheName=R.getPrecacheName(e.cacheName),super(e),this._fallbackToNetwork=e.fallbackToNetwork!==!1,this.plugins.push(w.copyRedirectedCacheableResponsesPlugin)}async _handle(e,t){const s=await t.cacheMatch(e);return s||(t.event&&t.event.type==="install"?await this._handleInstall(e,t):await this._handleFetch(e,t))}async _handleFetch(e,t){let s;const n=t.params||{};if(this._fallbackToNetwork){({}).NODE_ENV!=="production"&&i.warn(`The precached response for ${h(e.url)} in ${this.cacheName} was not found. Falling back to the network.`);const a=n.integrity,o=e.integrity,c=!o||o===a;if(s=await t.fetch(new Request(e,{integrity:e.mode!=="no-cors"?o||a:void 0})),a&&c&&e.mode!=="no-cors"){this._useDefaultCacheabilityPluginIfNeeded();const l=await t.cachePut(e,s.clone());({}).NODE_ENV!=="production"&&l&&i.log(`A response for ${h(e.url)} was used to "repair" the precache.`)}}else throw new u("missing-precache-entry",{cacheName:this.cacheName,url:e.url});if({}.NODE_ENV!=="production"){const a=n.cacheKey||await t.getCacheKey(e,"read");i.groupCollapsed("Precaching is responding to: "+h(e.url)),i.log(`Serving the precached url: ${h(a instanceof Request?a.url:a)}`),i.groupCollapsed("View request details here."),i.log(e),i.groupEnd(),i.groupCollapsed("View response details here."),i.log(s),i.groupEnd(),i.groupEnd()}return s}async _handleInstall(e,t){this._useDefaultCacheabilityPluginIfNeeded();const s=await t.fetch(e);if(!await t.cachePut(e,s.clone()))throw new u("bad-precaching-response",{url:e.url,status:s.status});return s}_useDefaultCacheabilityPluginIfNeeded(){let e=null,t=0;for(const[s,n]of this.plugins.entries())n!==w.copyRedirectedCacheableResponsesPlugin&&(n===w.defaultPrecacheCacheabilityPlugin&&(e=s),n.cacheWillUpdate&&t++);t===0?this.plugins.push(w.defaultPrecacheCacheabilityPlugin):t>1&&e!==null&&this.plugins.splice(e,1)}}w.defaultPrecacheCacheabilityPlugin={async cacheWillUpdate({response:r}){return!r||r.status>=400?null:r}},w.copyRedirectedCacheableResponsesPlugin={async cacheWillUpdate({response:r}){return r.redirected?await ee(r):r}};class we{constructor({cacheName:e,plugins:t=[],fallbackToNetwork:s=!0}={}){this._urlsToCacheKeys=new Map,this._urlsToCacheModes=new Map,this._cacheKeysToIntegrities=new Map,this._strategy=new w({cacheName:R.getPrecacheName(e),plugins:[...t,new de({precacheController:this})],fallbackToNetwork:s}),this.install=this.install.bind(this),this.activate=this.activate.bind(this)}get strategy(){return this._strategy}precache(e){this.addToCacheList(e),this._installAndActiveListenersAdded||(self.addEventListener("install",this.install),self.addEventListener("activate",this.activate),this._installAndActiveListenersAdded=!0)}addToCacheList(e){({}).NODE_ENV!=="production"&&d.isArray(e,{moduleName:"workbox-precaching",className:"PrecacheController",funcName:"addToCacheList",paramName:"entries"});const t=[];for(const s of e){typeof s=="string"?t.push(s):s&&s.revision===void 0&&t.push(s.url);const{cacheKey:n,url:a}=ue(s),o=typeof s!="string"&&s.revision?"reload":"default";if(this._urlsToCacheKeys.has(a)&&this._urlsToCacheKeys.get(a)!==n)throw new u("add-to-cache-list-conflicting-entries",{firstEntry:this._urlsToCacheKeys.get(a),secondEntry:n});if(typeof s!="string"&&s.integrity){if(this._cacheKeysToIntegrities.has(n)&&this._cacheKeysToIntegrities.get(n)!==s.integrity)throw new u("add-to-cache-list-conflicting-integrities",{url:a});this._cacheKeysToIntegrities.set(n,s.integrity)}if(this._urlsToCacheKeys.set(a,n),this._urlsToCacheModes.set(a,o),t.length>0){const c=`Workbox is precaching URLs without revision info: ${t.join(", ")}
This is generally NOT safe. Learn more at https://bit.ly/wb-precache`;({}).NODE_ENV==="production"?console.warn(c):i.warn(c)}}}install(e){return v(e,async()=>{const t=new he;this.strategy.plugins.push(t);for(const[a,o]of this._urlsToCacheKeys){const c=this._cacheKeysToIntegrities.get(o),l=this._urlsToCacheModes.get(a),m=new Request(a,{integrity:c,cache:l,credentials:"same-origin"});await Promise.all(this.strategy.handleAll({params:{cacheKey:o},request:m,event:e}))}const{updatedURLs:s,notUpdatedURLs:n}=t;return{}.NODE_ENV!=="production"&&ge(s,n),{updatedURLs:s,notUpdatedURLs:n}})}activate(e){return v(e,async()=>{const t=await self.caches.open(this.strategy.cacheName),s=await t.keys(),n=new Set(this._urlsToCacheKeys.values()),a=[];for(const o of s)n.has(o.url)||(await t.delete(o),a.push(o.url));return{}.NODE_ENV!=="production"&&pe(a),{deletedURLs:a}})}getURLsToCacheKeys(){return this._urlsToCacheKeys}getCachedURLs(){return[...this._urlsToCacheKeys.keys()]}getCacheKeyForURL(e){const t=new URL(e,location.href);return this._urlsToCacheKeys.get(t.href)}getIntegrityForCacheKey(e){return this._cacheKeysToIntegrities.get(e)}async matchPrecache(e){const t=e instanceof Request?e.url:e,s=this.getCacheKeyForURL(t);if(s)return(await self.caches.open(this.strategy.cacheName)).match(s)}createHandlerBoundToURL(e){const t=this.getCacheKeyForURL(e);if(!t)throw new u("non-precached-url",{url:e});return s=>(s.request=new Request(e),s.params=Object.assign({cacheKey:t},s.params),this.strategy.handle(s))}}let U;const K=()=>(U||(U=new we),U);function me(r,e=[]){for(const t of[...r.searchParams.keys()])e.some(s=>s.test(t))&&r.searchParams.delete(t);return r}function*ye(r,{ignoreURLParametersMatching:e=[/^utm_/,/^fbclid$/],directoryIndex:t="index.html",cleanURLs:s=!0,urlManipulation:n}={}){const a=new URL(r,location.href);a.hash="",yield a.href;const o=me(a,e);if(yield o.href,t&&o.pathname.endsWith("/")){const c=new URL(o.href);c.pathname+=t,yield c.href}if(s){const c=new URL(o.href);c.pathname+=".html",yield c.href}if(n){const c=n({url:a});for(const l of c)yield l.href}}class be extends N{constructor(e,t){const s=({request:n})=>{const a=e.getURLsToCacheKeys();for(const o of ye(n.url,t)){const c=a.get(o);if(c){const l=e.getIntegrityForCacheKey(c);return{cacheKey:c,integrity:l}}}({}).NODE_ENV!=="production"&&i.debug("Precaching did not find a match for "+h(n.url))};super(s,e.strategy)}}function Ne(r){const e=K(),t=new be(e,r);D(t)}const Ee="-precache-",Re=async(r,e=Ee)=>{const s=(await self.caches.keys()).filter(n=>n.includes(e)&&n.includes(self.registration.scope)&&n!==r);return await Promise.all(s.map(n=>self.caches.delete(n))),s};function _e(){self.addEventListener("activate",r=>{const e=R.getPrecacheName();r.waitUntil(Re(e).then(t=>{({}).NODE_ENV!=="production"&&t.length>0&&i.log("The following out-of-date precaches were cleaned up automatically:",t)}))})}function Ce(r){K().precache(r)}function $e(r,e){Ce(r),Ne(e)}const ke=["raw.githubusercontent.com","api.github.com","cors.bubblesort.me"];self.__WB_DISABLE_DEV_LOGS=!0,self.addEventListener("message",r=>{r.data&&r.data.type==="SKIP_WAITING"&&self.skipWaiting()}),te(),_e(),D(({url:r})=>ke.includes(r.hostname),new ce),$e([{"revision":null,"url":"assets/index-999baf3d.css"},{"revision":null,"url":"assets/index-b7afd027.js"},{"revision":null,"url":"assets/virtual_pwa-register-dc0b7596.js"},{"revision":null,"url":"assets/workbox-window.prod.es5-a7b12eab.js"},{"revision":"4d58dc5dcd93f3461ddc99a57a49fce4","url":"index.html"},{"revision":"2db5793b9be971d50e1a2076028daa6a","url":"pwa-192x192.png"},{"revision":"cab59206261b6d26308ef3dcfa06c135","url":"pwa-512x512.png"},{"revision":"dc6fe59e472af0f31ee12401319ad4d3","url":"manifest.webmanifest"}])})();
