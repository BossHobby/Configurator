import{_ as m}from"./index-CCMMQM5C.js";function w(p={}){const{immediate:u=!1,onNeedRefresh:n,onOfflineReady:i,onRegistered:o,onRegisteredSW:l,onRegisterError:s}=p;let t,c,r;const v=async(e=!0)=>{await c,r==null||r()};async function _(){if("serviceWorker"in navigator){if(t=await m(async()=>{const{Workbox:e}=await import("./workbox-window.prod.es5-B9K5rw8f.js");return{Workbox:e}},[]).then(({Workbox:e})=>new e("/develop/sw.js",{scope:"/develop/",type:"classic"})).catch(e=>{s==null||s(e)}),!t)return;r=()=>{t==null||t.messageSkipWaiting()};{let e=!1;const d=()=>{e=!0,t==null||t.addEventListener("controlling",a=>{a.isUpdate&&window.location.reload()}),n==null||n()};t.addEventListener("installed",a=>{typeof a.isUpdate>"u"?typeof a.isExternal<"u"&&a.isExternal?d():!e&&(i==null||i()):a.isUpdate||i==null||i()}),t.addEventListener("waiting",d)}t.register({immediate:u}).then(e=>{l?l("/develop/sw.js",e):o==null||o(e)}).catch(e=>{s==null||s(e)})}}return c=_(),v}export{w as registerSW};
