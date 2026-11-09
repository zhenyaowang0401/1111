'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HomeCatalog=factory();})(typeof window==='undefined'?globalThis:window,()=>{
 const catalog={
 themes:[{id:'cave',name:'Cozy burrow',cost:0,wall:'#a7956b',floor:'#b69b65',trim:'#4e5137'},{id:'moss',name:'Moss garden',cost:30,wall:'#88935e',floor:'#b1a974',trim:'#3c5740'},{id:'rain',name:'Rainy burrow',cost:45,wall:'#687984',floor:'#a0907e',trim:'#35434d'},{id:'moon',name:'Moonlit burrow',cost:60,wall:'#486c68',floor:'#939373',trim:'#254c49'}],
 items:[{id:'rug',name:'Woven rug',cost:0,slots:['floor'],scale:2,foot:22},{id:'lamp',name:'Warm lamp',cost:5,slots:['left','right'],scale:1.3,foot:29},{id:'cushion',name:'Soft cushion',cost:10,slots:['left','right'],scale:1.3,foot:28},{id:'desk',name:'Writing desk',cost:15,slots:['left','right'],scale:1.65,foot:31},{id:'bookcase',name:'Little bookcase',cost:20,slots:['left','right'],scale:1.65,foot:31},{id:'bed',name:'Small bed',cost:25,slots:['left','right'],scale:2,foot:32},{id:'art',name:'Star picture',cost:10,slots:['wall'],scale:1,foot:30}],
 materials:[{id:'star',name:'Star fragment'},{id:'mushroom',name:'Glow mushroom'},{id:'crystal',name:'Stardust crystal'},{id:'fossil',name:'Spiral fossil'}],
 slots:{left:{x:88,y:148,label:'Living room',kind:'left'},right:{x:106,y:280,label:'Bedroom',kind:'right'},wall:{x:474,y:240,label:'Gallery wall',kind:'wall'},floor:{x:193,y:151,label:'Living rug',kind:'floor'},study:{x:480,y:148,label:'Study',kind:'right'},studyWall:{x:390,y:111,label:'Study wall',kind:'wall'},bedWall:{x:211,y:236,label:'Bedroom wall',kind:'wall'},gallery:{x:552,y:280,label:'Gallery',kind:'left'}}
 };
 catalog.items.push(
  {id:'mushroomPlanter',name:'Mushroom planter',recipe:{mushroom:1},slots:['left','right'],scale:1.3,foot:30,description:'A tiny patch of forest for your nook.'},
  {id:'mushroomLamp',name:'Mushroom lamp',recipe:{mushroom:2},slots:['left','right'],scale:1.4,foot:30,description:'A soft glow beneath a rosy mushroom cap.'},
  {id:'crystalChime',name:'Crystal wind chime',recipe:{crystal:2},slots:['wall'],scale:1.25,foot:30,description:'Little blue crystals hanging from a wooden branch.'},
  {id:'fossilFrame',name:'Fossil frame',recipe:{fossil:1},slots:['wall'],scale:1.1,foot:30,description:'Your own little piece of natural history.'},
  {id:'starMobile',name:'Starry mobile',recipe:{star:2},slots:['wall'],scale:1.25,foot:30,description:'A small constellation for the burrow wall.'}
 );
 for(const item of catalog.items){item.slots=Object.keys(catalog.slots).filter(key=>item.slots.includes(catalog.slots[key].kind));}
 function sharedHome(raw){
  if(!raw||typeof raw!=='object'||!catalog.themes.some(t=>t.id===raw.theme))return null;
  const slots={};for(const key of Object.keys(catalog.slots)){const id=raw.slots?.[key];slots[key]=catalog.items.some(i=>i.id===id&&i.slots.includes(key))||key!=='floor'&&['find:star','find:mushroom','find:crystal','find:fossil'].includes(id)?id:null;}
  return {theme:raw.theme,slots};
 }
 function spareMaterials(s){return catalog.materials.map((m,index)=>{
  const raw=Number(s.inventory?.[index]),total=Number.isFinite(raw)?Math.max(0,Math.floor(raw)):0;
  const reserved=Object.values(s.home?.slots||{}).filter(id=>id==='find:'+m.id).length+(s.heldItem===m.id?1:0);
  return {...m,index,total,reserved,available:Math.max(0,total-reserved)};
 });}
 function rememberFinds(s){s.foundDiscoveries=catalog.materials.filter((m,i)=>s.foundDiscoveries?.includes(m.id)||s.inventory?.[i]>0).map(m=>m.id);}
 function recipeStatus(s,id){
  const item=catalog.items.find(i=>i.id===id&&i.recipe);if(!item)return null;
  const ingredients=spareMaterials(s).filter(m=>item.recipe[m.id]).map(m=>({...m,needed:item.recipe[m.id]}));
  const owned=!!s.home?.owned?.includes(id),running=s.session?.status==='running',enough=ingredients.every(m=>m.available>=m.needed);
  return {item,ingredients,owned,running,enough,canCraft:!owned&&!running&&enough};
 }
 function craft(s,id){
  const status=recipeStatus(s,id);if(!status?.canCraft||!s.home||!Array.isArray(s.home.owned))return false;
  const next=[...s.inventory];for(const m of status.ingredients)next[m.index]=m.total-m.needed;
  rememberFinds(s);s.inventory=next;s.home.owned=[...s.home.owned,id];return true;
 }
 return {...catalog,sharedHome,spareMaterials,rememberFinds,recipeStatus,craft};
});
