try{self["workbox:window:6.5.2"]&&_()}catch{}function S(t,r){return new Promise(function(e){var o=new MessageChannel;o.port1.onmessage=function(f){e(f.data)},t.postMessage(r,[o.port2])})}function L(t,r){for(var e=0;e<r.length;e++){var o=r[e];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(t,o.key,o)}}function b(t,r){(r==null||r>t.length)&&(r=t.length);for(var e=0,o=new Array(r);e<r;e++)o[e]=t[e];return o}function W(t,r){var e;if(typeof Symbol=="undefined"||t[Symbol.iterator]==null){if(Array.isArray(t)||(e=function(f,d){if(f){if(typeof f=="string")return b(f,d);var c=Object.prototype.toString.call(f).slice(8,-1);return c==="Object"&&f.constructor&&(c=f.constructor.name),c==="Map"||c==="Set"?Array.from(f):c==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(c)?b(f,d):void 0}}(t))||r&&t&&typeof t.length=="number"){e&&(t=e);var o=0;return function(){return o>=t.length?{done:!0}:{done:!1,value:t[o++]}}}throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}return(e=t[Symbol.iterator]()).next.bind(e)}try{self["workbox:core:6.5.2"]&&_()}catch{}var y=function(){var t=this;this.promise=new Promise(function(r,e){t.resolve=r,t.reject=e})};function E(t,r){var e=location.href;return new URL(t,e).href===new URL(r,e).href}var g=function(t,r){this.type=t,Object.assign(this,r)};function p(t,r,e){return e?r?r(t):t:(t&&t.then||(t=Promise.resolve(t)),r?t.then(r):t)}function k(){}var j={type:"SKIP_WAITING"};function P(t,r){if(!r)return t&&t.then?t.then(k):Promise.resolve()}var R=function(t){var r,e;function o(u,v){var n,i;return v===void 0&&(v={}),(n=t.call(this)||this).nn={},n.tn=0,n.rn=new y,n.en=new y,n.on=new y,n.un=0,n.an=new Set,n.cn=function(){var s=n.fn,a=s.installing;n.tn>0||!E(a.scriptURL,n.sn.toString())||performance.now()>n.un+6e4?(n.vn=a,s.removeEventListener("updatefound",n.cn)):(n.hn=a,n.an.add(a),n.rn.resolve(a)),++n.tn,a.addEventListener("statechange",n.ln)},n.ln=function(s){var a=n.fn,l=s.target,h=l.state,w=l===n.vn,m={sw:l,isExternal:w,originalEvent:s};!w&&n.mn&&(m.isUpdate=!0),n.dispatchEvent(new g(h,m)),h==="installed"?n.wn=self.setTimeout(function(){h==="installed"&&a.waiting===l&&n.dispatchEvent(new g("waiting",m))},200):h==="activating"&&(clearTimeout(n.wn),w||n.en.resolve(l))},n.dn=function(s){var a=n.hn,l=a!==navigator.serviceWorker.controller;n.dispatchEvent(new g("controlling",{isExternal:l,originalEvent:s,sw:a,isUpdate:n.mn})),l||n.on.resolve(a)},n.gn=(i=function(s){var a=s.data,l=s.ports,h=s.source;return p(n.getSW(),function(){n.an.has(h)&&n.dispatchEvent(new g("message",{data:a,originalEvent:s,ports:l,sw:h}))})},function(){for(var s=[],a=0;a<arguments.length;a++)s[a]=arguments[a];try{return Promise.resolve(i.apply(this,s))}catch(l){return Promise.reject(l)}}),n.sn=u,n.nn=v,navigator.serviceWorker.addEventListener("message",n.gn),n}e=t,(r=o).prototype=Object.create(e.prototype),r.prototype.constructor=r,r.__proto__=e;var f,d,c=o.prototype;return c.register=function(u){var v=(u===void 0?{}:u).immediate,n=v!==void 0&&v;try{var i=this;return function(s,a){var l=s();return l&&l.then?l.then(a):a(l)}(function(){if(!n&&document.readyState!=="complete")return P(new Promise(function(s){return window.addEventListener("load",s)}))},function(){return i.mn=Boolean(navigator.serviceWorker.controller),i.yn=i.pn(),p(i.bn(),function(s){i.fn=s,i.yn&&(i.hn=i.yn,i.en.resolve(i.yn),i.on.resolve(i.yn),i.yn.addEventListener("statechange",i.ln,{once:!0}));var a=i.fn.waiting;return a&&E(a.scriptURL,i.sn.toString())&&(i.hn=a,Promise.resolve().then(function(){i.dispatchEvent(new g("waiting",{sw:a,wasWaitingBeforeRegister:!0}))}).then(function(){})),i.hn&&(i.rn.resolve(i.hn),i.an.add(i.hn)),i.fn.addEventListener("updatefound",i.cn),navigator.serviceWorker.addEventListener("controllerchange",i.dn),i.fn})})}catch(s){return Promise.reject(s)}},c.update=function(){try{return this.fn?P(this.fn.update()):void 0}catch(u){return Promise.reject(u)}},c.getSW=function(){return this.hn!==void 0?Promise.resolve(this.hn):this.rn.promise},c.messageSW=function(u){try{return p(this.getSW(),function(v){return S(v,u)})}catch(v){return Promise.reject(v)}},c.messageSkipWaiting=function(){this.fn&&this.fn.waiting&&S(this.fn.waiting,j)},c.pn=function(){var u=navigator.serviceWorker.controller;return u&&E(u.scriptURL,this.sn.toString())?u:void 0},c.bn=function(){try{var u=this;return function(v,n){try{var i=v()}catch(s){return n(s)}return i&&i.then?i.then(void 0,n):i}(function(){return p(navigator.serviceWorker.register(u.sn,u.nn),function(v){return u.un=performance.now(),v})},function(v){throw v})}catch(v){return Promise.reject(v)}},f=o,(d=[{key:"active",get:function(){return this.en.promise}},{key:"controlling",get:function(){return this.on.promise}}])&&L(f.prototype,d),o}(function(){function t(){this.Pn=new Map}var r=t.prototype;return r.addEventListener=function(e,o){this.Sn(e).add(o)},r.removeEventListener=function(e,o){this.Sn(e).delete(o)},r.dispatchEvent=function(e){e.target=this;for(var o,f=W(this.Sn(e.type));!(o=f()).done;)(0,o.value)(e)},r.Sn=function(e){return this.Pn.has(e)||this.Pn.set(e,new Set),this.Pn.get(e)},t}());function U(t={}){const{immediate:r=!1,onNeedRefresh:e,onOfflineReady:o,onRegistered:f,onRegisterError:d}=t;let c,u;const v=async(n=!0)=>{n&&(c==null||c.addEventListener("controlling",i=>{i.isUpdate&&window.location.reload()})),u&&u.waiting&&await S(u.waiting,{type:"SKIP_WAITING"})};if("serviceWorker"in navigator){c=new R("/develop/sw.js",{scope:"/develop/",type:"classic"}),c.addEventListener("activated",n=>{n.isUpdate||o==null||o()});{const n=()=>{e==null||e()};c.addEventListener("waiting",n),c.addEventListener("externalwaiting",n)}c.register({immediate:r}).then(n=>{u=n,f==null||f(n)}).catch(n=>{d==null||d(n)})}return v}export{U as registerSW};
