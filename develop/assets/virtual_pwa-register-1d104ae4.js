import{_ as m}from"./index-78743237.js";function E(w={}){const{immediate:g=!1,onNeedRefresh:r,onOfflineReady:t,onRegistered:o,onRegisteredSW:d,onRegisterError:l}=w;let e,c,s;const u=async(p=!0)=>{await c,await(s==null?void 0:s())};async function _(){if("serviceWorker"in navigator){const{Workbox:p}=await m(()=>import("./workbox-window.prod.es5-a7b12eab.js"),[]);e=new p("/develop/sw.js",{scope:"/develop/",type:"classic"}),s=async()=>{await(e==null?void 0:e.messageSkipWaiting())};{let i=!1;const n=()=>{i=!0,e==null||e.addEventListener("controlling",a=>{a.isUpdate&&window.location.reload()}),r==null||r()};e.addEventListener("installed",a=>{typeof a.isUpdate>"u"?typeof a.isExternal<"u"?a.isExternal?n():!i&&(t==null||t()):a.isExternal?window.location.reload():!i&&(t==null||t()):a.isUpdate||t==null||t()}),e.addEventListener("waiting",n),e.addEventListener("externalwaiting",n)}e.register({immediate:g}).then(i=>{d?d("/develop/sw.js",i):o==null||o(i)}).catch(i=>{l==null||l(i)})}}return c=_(),u}export{E as registerSW};
