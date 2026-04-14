function a(t){const n=Math.floor(t/36e5),o=Math.floor(t%36e5/6e4),e=Math.floor(t%6e4/1e3),r=t%1e3;return`${n.toString().padStart(2,"0")}:${o.toString().padStart(2,"0")}:${e.toString().padStart(2,"0")},${r.toString().padStart(3,"0")}`}function i(t){const n=Math.floor(t/36e5),o=Math.floor(t%36e5/6e4),e=Math.floor(t%6e4/1e3),r=t%1e3;return`${n.toString().padStart(2,"0")}:${o.toString().padStart(2,"0")}:${e.toString().padStart(2,"0")}.${r.toString().padStart(3,"0")}`}function c(t){return t.map((n,o)=>{const e=a(n.startTime),r=a(n.endTime);return`${o+1}
${e} --> ${r}
${n.text}
`}).join(`
`)}function u(t){const n=`WEBVTT

`,o=t.map(e=>{const r=i(e.startTime),s=i(e.endTime);return`${r} --> ${s}
${e.text}
`}).join(`
`);return n+o}function T(){return`${Date.now()}-${Math.random().toString(36).substring(2,9)}`}function S(t){return t.replace(/<[^>]*>/g,"").replace(/\s+/g," ").trim()}function d(t){return t.replace(/[/\\?%*:|"<>]/g,"-").replace(/\s+/g,"_").substring(0,100)}export{u as a,c as b,S as c,T as g,d as s};
