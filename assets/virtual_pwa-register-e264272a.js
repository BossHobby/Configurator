import{_ as v}from"./index-ae622e97.js";function _(u={}){const{immediate:g=!1,onNeedRefresh:a,onOfflineReady:n,onRegistered:l,onRegisteredSW:r,onRegisterError:d}=u;let e,f,o;const p=async(c=!0)=>{await f,await(o==null?void 0:o())};async function w(){if("serviceWorker"in navigator){const{Workbox:c}=await v(()=>import("./workbox-window.prod.es5-dc90f814.js"),[]);e=new c("/sw.js",{scope:"/",type:"classic"}),o=async()=>{await(e==null?void 0:e.messageSkipWaiting())};{let i=!1;const s=()=>{i=!0,e==null||e.addEventListener("controlling",t=>{t.isUpdate&&window.location.reload()}),a==null||a()};e.addEventListener("installed",t=>{typeof t.isUpdate>"u"?typeof t.isExternal<"u"?t.isExternal?s():!i&&(n==null||n()):t.isExternal?window.location.reload():!i&&(n==null||n()):t.isUpdate||n==null||n()}),e.addEventListener("waiting",s),e.addEventListener("externalwaiting",s)}e.register({immediate:g}).then(i=>{r?r("/sw.js",i):l==null||l(i)}).catch(i=>{d==null||d(i)})}}return f=w(),p}export{_ as registerSW};
