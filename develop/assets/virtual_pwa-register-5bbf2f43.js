import{_ as w}from"./index-fb5dd486.js";function _(p={}){const{immediate:u=!1,onNeedRefresh:s,onOfflineReady:n,onRegistered:a,onRegisteredSW:r,onRegisterError:d}=p;let e,f,o;const g=async(c=!0)=>{await f,await(o==null?void 0:o())};async function v(){if("serviceWorker"in navigator){const{Workbox:c}=await w(()=>import("./workbox-window.prod.es5-a7b12eab.js"),[]);e=new c("/develop/sw.js",{scope:"/develop/",type:"classic"}),o=async()=>{await(e==null?void 0:e.messageSkipWaiting())};{let i=!1;const l=()=>{i=!0,e==null||e.addEventListener("controlling",t=>{t.isUpdate&&window.location.reload()}),s==null||s()};e.addEventListener("installed",t=>{typeof t.isUpdate>"u"?typeof t.isExternal<"u"?t.isExternal?l():!i&&(n==null||n()):t.isExternal?window.location.reload():!i&&(n==null||n()):t.isUpdate||n==null||n()}),e.addEventListener("waiting",l),e.addEventListener("externalwaiting",l)}e.register({immediate:u}).then(i=>{r?r("/develop/sw.js",i):a==null||a(i)}).catch(i=>{d==null||d(i)})}}return f=v(),g}export{_ as registerSW};
