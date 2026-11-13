'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const W=require('../wardrobe.js'),ctx={window:{}};
for(const file of ['wardrobe-art.js','mole-art.js'])vm.runInNewContext(fs.readFileSync(require.resolve('../'+file),'utf8'),ctx);
const art=ctx.window.WardrobeArt,materials=['star','mushroom','crystal','fossil'];
const additions=W.items.filter(i=>i.recipe&&i.category!=='hats');
test('each non-star material has a matching pair of glasses, scarf and accessory in one distinct tier',()=>{
 assert.equal(additions.length,9);assert.equal(new Set(W.items.map(i=>i.id)).size,W.items.length);
 for(const m of materials.slice(1))assert.deepEqual(additions.filter(i=>i.recipe[m]).map(i=>i.category).sort(),['extras','glasses','scarves']);
 assert(W.items.filter(i=>i.recipe).every(i=>i.rarity==='Relic'&&i.cost===0));assert(!W.items.some(i=>!i.recipe&&i.rarity==='Relic'));
 for(const i of additions){assert(art.iconSVG(i.id).includes('<rect'));assert(Object.values(i.recipe).every(n=>Number.isInteger(n)&&n>=18));}
});
test('new recipes reserve displayed materials, spend exactly once, and retain all equipped categories on reload',()=>{
 for(const i of additions){const [m,n]=Object.entries(i.recipe)[0],index=materials.indexOf(m),s={owned:['hat','glasses','scarf','star'],equipped:['hat','glasses','scarf','star'],balance:9,inventory:[0,0,0,0],heldItem:m,home:{slots:{wall:'find:'+m}}};
  s.inventory[index]=n+1;assert.equal(W.redeem(s,i.id),false);assert.equal(s.inventory[index],n+1);
  s.inventory[index]++;s.session={status:'running'};assert.equal(W.redeem(s,i.id),false);s.session=null;
  assert.equal(W.redeem(s,i.id),true);s.equipped=W.equip(s.equipped,i.id);assert.equal(s.inventory[index],2);assert.equal(s.balance,9);assert.equal(W.redeem(s,i.id),false);
  const restored=JSON.parse(JSON.stringify(s));assert.deepEqual(W.normalize(restored.equipped,restored.owned),s.equipped);assert.equal(s.equipped.length,4);assert(s.equipped.includes(i.id));
 }
});
test('every glasses style has a one-lens profile with a narrow temple, not a second frame',()=>{
 for(const i of W.items.filter(i=>i.category==='glasses')){const rects=[];art.glassesSide((...r)=>rects.push(r),i.id);assert(rects.length>3,i.id);
  assert(rects.some(([x,y,w])=>x===10&&w>=7),i.id);
  // The rear half has only a thin temple at the ear. Lens rims stay at the eye.
  assert(rects.every(([x,y,w,h])=>x>=16||y+h<=13),i.id);
  assert(Math.max(...rects.map(([x,y,w])=>x+w))<=24,i.id);
 }
});
test('walking and climbing keep a round, broad body and alternate their paws',()=>{
 for(const climbing of [false,true]){
  const frames=[];
  for(const phase of [0,2]){const pixels=new Map(),c={fillStyle:'',fillRect(x,y,w,h){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixels.set(xx+','+yy,this.fillStyle);}};ctx.window.MoleArt.paintTravel(c,{color:'#a9b4c6',climbing,phase});
   const width=y=>{const xs=[...pixels.keys()].map(k=>k.split(',').map(Number)).filter(p=>p[1]===y).map(p=>p[0]);return Math.max(...xs)-Math.min(...xs)+1;};
   assert(width(14)>=20);assert(width(5)<width(14));assert(width(22)<width(14));frames.push([...pixels].sort());
  }
  assert.notDeepEqual(frames[0],frames[1]);
 }
});

test('friend snapshots retain the new outfit parts for visits',()=>{
 const {snapshot}=require('../api/friends.js');
 for(const prefix of ['forager','spiral','prism']){const equipped=['mushroomhat',prefix+'glasses',prefix+'scarf',prefix+(prefix==='prism'?'pendant':'brooch')];assert.deepEqual(snapshot({equipped:[...equipped,'unknown-item']}).equipped,equipped);}
});
