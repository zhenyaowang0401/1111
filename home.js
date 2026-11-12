'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.HomeCatalog=factory();})(typeof window==='undefined'?globalThis:window,()=>{
 const catalog={
 themes:[{id:'cave',name:'Cozy burrow',cost:0,wall:'#a7956b',floor:'#b69b65',trim:'#4e5137'},{id:'moss',name:'Moss garden',cost:30,wall:'#88935e',floor:'#b1a974',trim:'#3c5740'},{id:'rain',name:'Rainy burrow',cost:45,wall:'#687984',floor:'#a0907e',trim:'#35434d'},{id:'moon',name:'Moonlit burrow',cost:60,wall:'#486c68',floor:'#939373',trim:'#254c49'}],
 items:[{id:'rug',name:'Woven rug',cost:0,slots:['floor'],scale:2,foot:22},{id:'lamp',name:'Warm lamp',cost:5,slots:['left','right'],scale:1.3,foot:29},{id:'cushion',name:'Soft cushion',cost:10,slots:['left','right'],scale:1.3,foot:28},{id:'desk',name:'Writing desk',cost:15,slots:['left','right'],scale:1.65,foot:31},{id:'bookcase',name:'Little bookcase',cost:20,slots:['left','right'],scale:1.65,foot:31},{id:'bed',name:'Small bed',cost:25,slots:['left','right'],scale:2,foot:32},{id:'art',name:'Star picture',cost:10,slots:['wall'],scale:1,foot:30}],
 materials:[{id:'star',name:'Star fragment'},{id:'mushroom',name:'Glow mushroom'},{id:'crystal',name:'Stardust crystal'},{id:'fossil',name:'Spiral fossil'}],
 slots:{left:{x:137,y:316,label:'Living room',kind:'left'},right:{x:91,y:149,label:'Bedroom',kind:'right'},wall:{x:552,y:271,label:'Gallery wall',kind:'wall'},floor:{x:246,y:320,label:'Living rug',kind:'floor'},study:{x:498,y:177,label:'Study',kind:'right'},studyWall:{x:439,y:120,label:'Study wall',kind:'wall'},bedWall:{x:178,y:103,label:'Bedroom wall',kind:'wall'},gallery:{x:560,y:310,label:'Gallery',kind:'left'},livingWall:{x:151,y:248,label:'Living wall',kind:'wall'},livingWindow:{x:305,y:253,label:'Living nook',kind:'wall'},studyWindow:{x:554,y:122,label:'Study nook',kind:'wall'},bedWindow:{x:96,y:102,label:'Bedroom nook',kind:'wall'}}
 };
 catalog.items.push(
  {id:'archedWindow',name:'Meadow window',cost:18,slots:['wall'],scale:1.4,foot:30},
  {id:'hangingLantern',name:'Honey lantern',cost:8,slots:['wall'],scale:1,foot:30},
  {id:'herbShelf',name:'Herb shelf',cost:12,slots:['wall'],scale:1.4,foot:30},
  {id:'crockeryShelf',name:'Pottery shelf',cost:12,slots:['wall'],scale:1.5,foot:30},
  {id:'kitchenUnit',name:'Little kitchen',cost:30,slots:['left','right'],scale:2,foot:32},
  {id:'mushroomPlanter',name:'Mushroom planter',recipe:{mushroom:1},slots:['left','right'],scale:1.3,foot:30,description:'A tiny patch of forest for your nook.'},
  {id:'mushroomLamp',name:'Mushroom lamp',recipe:{mushroom:2},slots:['left','right'],scale:1.4,foot:30,description:'A soft glow beneath a rosy mushroom cap.'},
  {id:'crystalChime',name:'Crystal wind chime',recipe:{crystal:2},slots:['wall'],scale:1.25,foot:30,description:'Little blue crystals hanging from a wooden branch.'},
  {id:'fossilFrame',name:'Fossil frame',recipe:{fossil:1},slots:['wall'],scale:1.1,foot:30,description:'Your own little piece of natural history.'},
  {id:'starMobile',name:'Starry mobile',recipe:{star:2},slots:['wall'],scale:1.25,foot:30,description:'A small constellation for the burrow wall.'}
 );
 catalog.themes.forEach(t=>t.rarity=t.cost===0?'Common':t.cost<40?'Uncommon':'Rare');
 catalog.themes.push(
  {id:'forest',name:'Twilight forest',cost:80,rarity:'Uncommon',biome:'forest',wall:'#9ab5a1',floor:'#879b81',trim:'#425e50'},
  {id:'rainforest',name:'Emerald rainforest',cost:140,rarity:'Rare',biome:'rainforest',wall:'#68988a',floor:'#6b8664',trim:'#294e43'},
  {id:'snow',name:'Alpine snow',cost:220,rarity:'Epic',biome:'snow',wall:'#cadfe3',floor:'#a8bec4',trim:'#577584'},
  {id:'starlit',name:'Celestial night',cost:360,rarity:'Legendary',biome:'stars',wall:'#333c64',floor:'#606381',trim:'#262b49'}
 );
 catalog.items.push(
  {id:'television',name:'Retro television',cost:35,slots:['left','right'],scale:1.8,foot:31},
  {id:'mushroomSofa',name:'Mushroom sofa',recipe:{mushroom:8},slots:['left','right'],scale:2,foot:31,description:'A rosy seat for slow afternoons.'},
  {id:'fossilClock',name:'Spiral clock',recipe:{fossil:6},slots:['wall'],scale:1.3,foot:30,description:'Little spirals, keeping burrow time.'},
  {id:'starWindow',name:'Constellation window',recipe:{star:12,crystal:4},slots:['wall'],scale:1.7,foot:31,description:'A view of your own small galaxy.'}
 );
 for(let n=0;n<16;n++)catalog.slots['extra'+n]={x:140,y:300,label:'Furniture',kind:n%2?'wall':'left'};
 for(const item of catalog.items){item.slots=Object.keys(catalog.slots).filter(key=>item.slots.includes(catalog.slots[key].kind));}
 function sharedHome(raw){
  if(!raw||typeof raw!=='object'||!catalog.themes.some(t=>t.id===raw.theme))return null;
  const slots={};for(const key of Object.keys(catalog.slots)){const id=raw.slots?.[key];slots[key]=catalog.items.some(i=>i.id===id&&i.slots.includes(key))||key!=='floor'&&['find:star','find:mushroom','find:crystal','find:fossil'].includes(id)?id:null;}
  return {theme:raw.theme,slots,positions:positions(raw.positions)};
 }
 function positions(raw){const result={};for(const key of Object.keys(catalog.slots)){const p=raw?.[key];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=16&&p.x<=624&&p.y>=48&&p.y<=350)result[key]={x:Math.round(p.x),y:Math.round(p.y)};}return result;}
 function spot(home,key){return {...catalog.slots[key],...positions(home.positions)[key]};}
 function place(s,id,x,y,source){
  if(s.session?.status==='running')return false;
  const item=catalog.items.find(i=>i.id===id),material=catalog.materials.findIndex(m=>'find:'+m.id===id),h=s.home;
  if(!h||!Number.isFinite(x)||!Number.isFinite(y)||x<16||x>624||y<48||y>350)return false;
  if(item&&!h.owned.includes(id)||!item&&material<0)return false;
  const existing=source&&h.slots[source]===id?source:item?Object.keys(h.slots).find(k=>h.slots[k]===id):null;
  if(!item&&!existing&&spareMaterials(s)[material].available<1)return false;
  const key=existing||Object.keys(catalog.slots).find(k=>!h.slots[k]&&(item?item.slots.includes(k):k!=='floor'));
  if(!key)return false;h.slots[key]=id;h.positions=h.positions||{};h.positions[key]={x:Math.round(x),y:Math.round(y)};return key;
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
 return {...catalog,positions,spot,place,sharedHome,spareMaterials,rememberFinds,recipeStatus,craft};
});
