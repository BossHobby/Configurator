import{_}from"./index-BYpKQA5U.js";function m(p={}){const{immediate:u=!1,onNeedRefresh:n,onOfflineReady:i,onRegistered:o,onRegisteredSW:d,onRegisterError:s}=p;let t,c,r;const w=async(e=!0)=>{await c,await(r==null?void 0:r())};async function v(){if("serviceWorker"in navigator){if(t=await _(async()=>{const{Workbox:e}=await import("./workbox-window.prod.es5-D5gOYdM7.js");return{Workbox:e}},[]).then(({Workbox:e})=>new e("/develop/sw.js",{scope:"/develop/",type:"classic"})).catch(e=>{s==null||s(e)}),!t)return;r=async()=>{await(t==null?void 0:t.messageSkipWaiting())};{let e=!1;const l=()=>{e=!0,t==null||t.addEventListener("controlling",a=>{a.isUpdate&&window.location.reload()}),n==null||n()};t.addEventListener("installed",a=>{typeof a.isUpdate>"u"?typeof a.isExternal<"u"?a.isExternal?l():!e&&(i==null||i()):a.isExternal?window.location.reload():!e&&(i==null||i()):a.isUpdate||i==null||i()}),t.addEventListener("waiting",l),t.addEventListener("externalwaiting",l)}t.register({immediate:u}).then(e=>{d?d("/develop/sw.js",e):o==null||o(e)}).catch(e=>{s==null||s(e)})}}return c=v(),w}export{m as registerSW};
