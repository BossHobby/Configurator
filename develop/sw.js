if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const o=e||("document"in self?document.currentScript.src:"")||location.href;if(s[o])return;let c={};const t=e=>i(e,o),d={module:{uri:o},exports:c,require:t};s[o]=Promise.all(n.map((e=>d[e]||t(e)))).then((e=>(r(...e),c)))}}define(["./workbox-7369c0e1"],(function(e){"use strict";self.addEventListener("message",(e=>{e.data&&"SKIP_WAITING"===e.data.type&&self.skipWaiting()})),e.precacheAndRoute([{url:"assets/index-4f4fdd6c.js",revision:null},{url:"assets/index-d1e31e67.css",revision:null},{url:"assets/virtual_pwa-register-46d5c493.js",revision:null},{url:"assets/workbox-window.prod.es5-dc90f814.js",revision:null},{url:"index.html",revision:"ea0fe2455824c236da944d6f15108260"},{url:"favicon.svg",revision:"d4bc03e2017da139e2a4603eaf8195a1"},{url:"favicon.ico",revision:"6ce0e5a8d9a0d3c0c9ace2f223b7068a"},{url:"robots.txt",revision:"f77c87f977e0fcce05a6df46c885a129"},{url:"apple-touch-icon.png",revision:"3fdcc5ed80fe9e1281bb37e8f09d7dfe"},{url:"pwa-192x192.png",revision:"2db5793b9be971d50e1a2076028daa6a"},{url:"pwa-512x512.png",revision:"cab59206261b6d26308ef3dcfa06c135"},{url:"manifest.webmanifest",revision:"aebc12724353fd603685c1b59633cb31"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html")))}));
