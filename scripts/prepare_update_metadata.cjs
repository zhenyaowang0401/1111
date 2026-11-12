'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),yaml=require('js-yaml');
async function prepare({directory,platform,arch,version}){
 if(!['win','mac'].includes(platform)||!['arm64','x64'].includes(arch)||!/^\d+\.\d+\.\d+$/.test(version))throw Error('Invalid update target');
 const source=path.join(directory,platform==='mac'?'latest-mac.yml':'latest.yml');
 const info=yaml.load(fs.readFileSync(source,'utf8'));
 if(info.version!==version||!Array.isArray(info.files)||!info.files.length)throw Error('Missing or mismatched update metadata');
 const prefix=`https://github.com/zhenyaowang0401/1111/releases/download/desktop-v${version}/`;
 for(const file of info.files){
  const name=file.url;
  if(typeof name!=='string'||path.basename(name)!==name||!name.startsWith(platform==='win'?'Eumo-Windows-x64-Setup.':`Eumo-macOS-${arch}.`))throw Error('Unexpected update artifact');
  const filename=path.join(directory,name),hash=crypto.createHash('sha512');let size=0;
  for await(const chunk of fs.createReadStream(filename)){hash.update(chunk);size+=chunk.length;}
  if(hash.digest('base64')!==file.sha512||file.size!=null&&size!==file.size)throw Error('Installer checksum mismatch');
  file.size=size;file.url=prefix+name;
 }
 if(info.path){const match=info.files.find(f=>f.url===prefix+info.path);if(!match)throw Error('Unexpected legacy update path');info.path=match.url;}
 const target=path.join(directory,platform==='mac'?`latest-${arch}-mac.yml`:'latest.yml');fs.writeFileSync(target,yaml.dump(info));
 if(source!==target)fs.unlinkSync(source);
 return target;
}
if(require.main===module){const [platform,arch]=process.argv.slice(2);prepare({directory:path.resolve(__dirname,'../desktop-dist'),platform,arch,version:require('../package.json').version}).then(file=>console.log('Verified updater metadata: '+path.basename(file))).catch(e=>{console.error(e.message);process.exitCode=1;});}
module.exports={prepare};
