import*as E from"https://deno.land/std@0.183.0/fs/mod.ts";import*as q from"https://deno.land/std@0.183.0/path/mod.ts";import*as W from"https://deno.land/x/cliffy@v0.25.7/mod.ts";import*as u from"https://deno.land/std@0.183.0/semver/mod.ts";import*as b from"https://deno.land/std@0.183.0/semver/mod.ts";var z={denoLand:"deno_land",npmPackage:"npm_package",rawGitHub:"raw_github",unknown:"unknown"},m=z;var B=async function(e){let o=`https://registry.npmjs.org/${e}`,n=await fetch(o);if(!n.ok)return null;let r=JSON.parse(await n.text());return Object.keys(r.versions).map(l=>b.parse(l)).filter(l=>l!==null)},X=async function(e){let o=`https://apiland.deno.dev/v2/modules/${e}`,n=await fetch(o);return n.ok?JSON.parse(await n.text()).versions.map(l=>b.parse(l)).filter(l=>l!==null):null},Y=async function(e,o){let n={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};typeof o=="string"&&Object.defineProperty(n,"Authorization",{value:`Bearer ${o}`});let r=await fetch(`https://api.github.com/repos/${e}/releases`,{headers:n});return r.ok?JSON.parse(await r.text()).map(p=>b.parse(p.tag_name)).filter(p=>p!==null):null},K={[m.npmPackage]:B,[m.denoLand]:X,[m.rawGitHub]:Y};var $=K;var G=new Map,Q=async function(e,o,...n){let r=e+":"+o,t=G.get(r);if(typeof t!="undefined")return t;let l=await $[e](o,...n);return G.set(r,l),l},H=e=>e.reduce((o,n)=>u.gt(n,o)?n:o),Z=async function(e,o){let n=e.version??"",r=u.parse(n)!==null;if(!(e.type in $))return null;let t=e.type,l=[];t==="raw_github"&&typeof(o==null?void 0:o.gitHubToken)=="string"&&l.push(o.gitHubToken);let p=await Q(t,e.name,...l);if(p===null)return{fixed:r,outdated:"not_found",latest:null};o.usePrerelease||(p=p.filter(i=>i.prerelease.length===0));let M=p.filter(i=>u.satisfies(i,n,{includePrerelease:o.usePrerelease}));if(M.length<1)return{fixed:r,outdated:"not_found",latest:null};let g=H(M),y=p.filter(i=>u.gtr(i,n,{includePrerelease:o.usePrerelease})).filter(i=>{switch(o.level){case"major":return!0;case"minor":return u.major(g)===i.major;case"patch":return u.major(g)===i.major&&u.minor(g)===i.minor}}),v="none",c=null;return y.length>0&&(c=H(y),c.major>g.major?v="major":c.minor>g.minor?v="minor":c.patch>g.patch?v="patch":o.usePrerelease&&u.gt(c,g,{includePrerelease:!0})&&(v="pre_release")),{fixed:r,outdated:v,latest:(c==null?void 0:c.version)??null}},R=Z;import*as C from"https://deno.land/std@0.183.0/fs/mod.ts";import*as D from"https://deno.land/std@0.183.0/path/mod.ts";var V=function(e){let o=e.lastIndexOf("@");return o<=0?[e,""]:[e.slice(0,o),e.slice(o+1)]};var k={test:/^https?:\/\/deno.land/,parse:e=>{let o=new URL(e).pathname.split("/").slice(1),n=o[0]==="x"?o[1]:o[0],[r,t]=V(n);return{type:m.denoLand,name:r,version:t}}},N={test:/^https?:\/\/raw.githubusercontent.com/,parse:e=>{let o=new URL(e).pathname.split("/").slice(1),n=`${o[0]}/${o[1]}`,r=o[2];return{type:m.rawGitHub,name:n,version:r}}},w={test:/^npm:/,parse:e=>{let[o,n]=V(e.slice(4));return{type:m.npmPackage,name:o,version:n}}},J=function(e,o){for(let n of o)if(n.test.test(e))return n.parse(e);return null};var U=function(e){let o=JSON.parse(e),n=[];for(let r in o.dependencies)n.push({type:m.npmPackage,name:r,version:o.dependencies[r]});for(let r in o.devDependencies)n.push({type:m.npmPackage,name:r,version:o.devDependencies[r]});return n},I=function(e,o){return J(e,o)??{type:m.unknown,name:e,version:null}},A=function(e,o){let n=JSON.parse(e);return[...Object.values((n==null?void 0:n.imports)??{}),...Object.values((n==null?void 0:n.scope)??{}).flatMap(t=>Object.values(t))].map(t=>I(t,o))},_=function(e,o){return[/"https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-@]+"/g,/'https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-@]+'/g,/`https?:\/\/[\w/:%#\$&\?\(\)~\.=\+\-@]+`/g,/"npm:[\w/:%#\$&\?\(\)~\.=\+\-@]+"/g,/'npm:[\w/:%#\$&\?\(\)~\.=\+\-@]+'/g,/`npm:[\w/:%#\$&\?\(\)~\.=\+\-@]+`/g].flatMap(t=>[...e.matchAll(t)]).map(t=>t[0].slice(1,-1)).map(t=>I(t,o))};var j=new Map,S=e=>{let o=j.get(e);return typeof o=="boolean"?o:C.existsSync(D.join(e,"deno.json"),{isFile:!0})||C.existsSync(D.join(e,"deno.jsonc"),{isFile:!0})?(j.set(e,!0),!0):(j.set(e,!1),!1)},ne={file:"package.json",resolver:e=>U(e)},se={file:"import_map.json",enabled:S,resolver:e=>A(e,[k,N,w])},re={file:"deps.ts",enabled:S,resolver:e=>_(e,[k,N,w])},te={file:"**/deps.js",enabled:S,resolver:e=>_(e,[k,N,w])},T=[ne,se,re,te];var x={name:"Delichon",repository:"Tsukina-7mochi/delichon",version:"0.2.1"};var le=async function*(e,o){for(let n of o)for await(let r of E.expandGlob(q.resolve(e,n)))r.isFile&&(yield[r.path,n])},ie=async function(){let e=await R({type:"raw_github",name:x.repository,version:x.version},{usePrerelease:!1,level:"major"});e&&e.outdated!=="none"&&e.outdated!=="not_found"&&(console.log(`Update ${e.latest} found`),console.log("You can update with $\x1B[33mdeno cache --reload\x1B[0m"));let o=new W.Command().name(x.name).version(x.version).description("Dependency scanner for Node.js and Deno project").option("-l, --level [level:string]","version update limit",{default:"major"}).option("--prerelease","use prerelease").arguments("[path]"),{options:n,args:r}=await o.parse(Deno.args),t=typeof n.level=="string"?n.level.toLowerCase():n.level;t!=="major"&&t!=="minor"&&t!=="patch"&&(console.error(`${t} is not a valid level.`),Deno.exit(1));let l=t,p=n.prerelease===!0,M=r.filter(s=>typeof s=="string")[0]??Deno.cwd(),g=[];for(let s of T)(s.enabled===void 0||s.enabled(M))&&g.push(s.file);let y=new Map;for await(let[s,a]of le(M,g)){console.log(`Scanning ${s}...`);let h=await Deno.readTextFile(s);for(let d of T)d.file===a&&d.resolver(h).forEach(f=>{y.set(`${f.type}-${f.name}`,f)})}let v=[...y.values()],c=[];for(let s of v){let a=await R(s,{level:l,usePrerelease:p});a===null?console.log(`\u2754${s.name} cannot be resolved (${s.type})`):a.outdated==="not_found"?console.log(`\u2754 ${s.name} not found on remote (${s.type})`):a.outdated==="none"?a.fixed?console.log(`\u2705 ${s.name} is up to date`):console.log(`\u26A0\uFE0F ${s.name} may up to date (version not fixed)`):a.fixed?console.log(`\u274C ${s.name} is outdated (${a.outdated})`):console.log(`\u274C ${s.name} is outdated (${a.outdated}) and version is not fixed`),a!==null&&c.push([s,a])}let i=c.filter(([,s])=>s.outdated!=="none"&&s.outdated!=="not_found"),O=c.filter(([s,a])=>a.outdated==="not_found"),F=c.filter(([s,a])=>!a.fixed);if(console.log(),console.log(`\x1B[1m${i.length}\x1B[0m module${i.length>1?"s are":" is"} outdated.`),O.length>0&&(console.log("Could not find following modules:"),console.log("  "+O.map(([s])=>s.name).join(", "))),F.length>0&&(console.log("Version not fixed at following modules:"),console.log("  "+F.map(([s])=>s.name).join(", "))),i.length>0){let s=[["","package","current","latest"]],a={major:"\x1B[31mMajor\x1B[0m",minor:"\x1B[33mMinor\x1B[0m",patch:"\x1B[34mPatch\x1B[0m",pre_release:"\x1B[36mPre\x1B[0m",none:"Latest",not_found:"Not Found"};for(let[d,f]of i)s.push([`${a[f.outdated]}`,d.name,d.version??"(null)",f.latest??"(null)"]);let h=new Array(s[0].length).fill(0).map((d,f)=>s.reduce((P,L)=>L[f].length>P?L[f].length:P,0));s=s.map(d=>d.map((f,P)=>`${f}${" ".repeat(h[P])}`.slice(0,h[P]))),h[0]=5,s[0][0]="     ",console.log(s[0].join(" ")),console.log(h.map(d=>"-".repeat(d)).join(" ")),console.log(s.slice(1).map(d=>d.join(" ")).join(`
`))}};ie();
