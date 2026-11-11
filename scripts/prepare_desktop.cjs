'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'desktop/web');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const entries=['index.html',...Array.from(html.matchAll(/<script src="([^"/]+\.js)">/g),m=>m[1]),'style.css','woodland.css'];
for(const name of entries)fs.copyFileSync(path.join(root,name),path.join(out,name));
fs.cpSync(path.join(root,'assets'),path.join(out,'assets'),{recursive:true});
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.relative(out,path.join(dir,d.name)).split(path.sep).join('/')]);}
const manifest=walk(out).sort();fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));
console.log(`Bundled ${manifest.length} local files; server code and secrets are excluded.`);
