import{_ as f}from"./index-C77RKq0t.js";function g(p={}){const{immediate:u=!1,onNeedRefresh:n,onOfflineReady:i,onRegistered:l,onRegisteredSW:o,onRegisterError:s}=p;let t,c,r;const w=async(e=!0)=>{await c,await(r==null?void 0:r())};async function _(){if("serviceWorker"in navigator){if(t=await f(()=>import("./workbox-window.prod.es5-D5gOYdM7.js"),[]).then(({Workbox:e})=>new e("/sw.js",{scope:"/",type:"classic"})).catch(e=>{s==null||s(e)}),!t)return;r=async()=>{await(t==null?void 0:t.messageSkipWaiting())};{let e=!1;const d=()=>{e=!0,t==null||t.addEventListener("controlling",a=>{a.isUpdate&&window.location.reload()}),n==null||n()};t.addEventListener("installed",a=>{typeof a.isUpdate>"u"?typeof a.isExternal<"u"?a.isExternal?d():!e&&(i==null||i()):a.isExternal?window.location.reload():!e&&(i==null||i()):a.isUpdate||i==null||i()}),t.addEventListener("waiting",d),t.addEventListener("externalwaiting",d)}t.register({immediate:u}).then(e=>{o?o("/sw.js",e):l==null||l(e)}).catch(e=>{s==null||s(e)})}}return c=_(),w}export{g as registerSW};
