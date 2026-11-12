'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const H=require('../home.js'),W=require('../wardrobe.js'),T=require('../treasures.js'),ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../journey.js'),'utf8'),ctx);const J=ctx.window.Journey;
const state=()=>({balance:500,owned:[],inventory:[50,40,35,30],heldItem:'mushroom',home:{owned:['rug','lamp'],slots:{floor:'rug',wall:'find:mushroom'},positions:{},ownedThemes:['cave'],theme:'cave'}});
test('free positions move existing owned objects without duplication and share/restore safely',()=>{const s=state();const key=H.place(s,'lamp',150,140);assert(key);assert.equal(H.place(s,'lamp',500,170),key);assert.equal(Object.values(s.home.slots).filter(id=>id==='lamp').length,1);assert.deepEqual(H.sharedHome(s.home).positions[key],{x:500,y:170});assert.equal(H.place(s,'television',500,170),false);assert.equal(H.place(s,'lamp',Infinity,170),false);s.session={status:'running'};assert.equal(H.place(s,'lamp',200,150),false);});
test('material hats require spare inventory, charge exactly once and cannot spend displayed finds',()=>{const s=state();assert.equal(W.redeem(s,'mushroomhat'),false);s.inventory[1]=42;assert.equal(W.redeem(s,'mushroomhat'),true);assert.equal(s.inventory[1],2);assert.equal(s.balance,500);assert.equal(W.redeem(s,'mushroomhat'),false);assert.equal(s.home.slots.wall,'find:mushroom');assert.equal(s.heldItem,'mushroom');assert(W.equip([], 'mushroomhat').includes('mushroomhat'));});
test('new material rolls reduce drops without reducing stars or independent legendary rolls',()=>{const session={id:'test',mode:'study',plannedSeconds:6000000,elapsed:6000000,baseEligible:0,rareSeed:'stable',rewardVersion:2};const events=J.pickups(session),r=J.rewards(session);const count=r.finds.reduce((a,b)=>a+b,0);assert(count>3500&&count<4500,count);assert.equal(r.stars,20000);const old={...session,rewardVersion:undefined};assert.equal(J.rewards(old).finds.reduce((a,b)=>a+b,0),10000);assert.equal(T.awards(session,events).length,T.awards(old,J.pickups(old)).length);let base=0,sum=0;for(let i=0;i<100;i++){sum+=J.rewards({...session,id:String(i),baseEligible:base,plannedSeconds:60000,elapsed:60000}).finds.reduce((a,b)=>a+b,0);base+=60000;}assert.equal(sum,count);});
test('background rarity prices ascend and every material has a long-term hat sink',()=>{const themes=['forest','rainforest','snow','starlit'].map(id=>H.themes.find(t=>t.id===id));assert.deepEqual(themes.map(t=>t.rarity),['Uncommon','Rare','Epic','Legendary']);assert(themes.every((t,i)=>!i||t.cost>themes[i-1].cost));for(const m of H.materials)assert(W.items.some(i=>i.recipe?.[m.id]>=30));});

test('new demos do not grant materials, while active legacy demos retain their rewards',()=>{const demo={id:'demo',demo:true,mode:'study',plannedSeconds:15,elapsed:15};const next=J.rewards({...demo,rewardVersion:2});assert.equal(next.finds.reduce((a,b)=>a+b,0),0);assert.equal(next.stars,1);assert.equal(next.depth,5);assert.equal(J.rewards(demo).finds.reduce((a,b)=>a+b,0),1);});

test('putting away keeps ownership and materials, releases only that displayed copy',()=>{
 const s=state(),before=[...s.inventory];assert.equal(H.putAway(s,'wall'),true);assert.equal(s.home.slots.wall,null);assert.deepEqual(s.inventory,before);assert.equal(H.spareMaterials(s)[1].reserved,1);assert.equal(s.balance,500);
 H.place(s,'lamp',150,140);const key=Object.keys(s.home.slots).find(k=>s.home.slots[k]==='lamp');assert(H.putAway(s,key));assert(s.home.owned.includes('lamp'));assert(!s.home.positions[key]);assert.equal(H.putAway(s,key),false);
 s.session={status:'running'};assert.equal(H.putAway(s,'floor'),false);assert.equal(s.home.slots.floor,'rug');
});
test('lower background prices credit existing owners once, never future purchases',()=>{
 const s=state();s.home.ownedThemes=['cave','forest','rainforest','snow','starlit','starlit'];assert.equal(H.applyThemePrices(s),240);assert.equal(s.balance,740);assert.equal(H.applyThemePrices(JSON.parse(JSON.stringify(s))),0);
 const fresh=state();assert.equal(H.applyThemePrices(fresh),0);fresh.home.ownedThemes.push('starlit');assert.equal(H.applyThemePrices(fresh),0);assert.equal(fresh.balance,500);
 assert.deepEqual(['forest','rainforest','snow','starlit'].map(id=>H.themes.find(t=>t.id===id).cost),[60,100,160,240]);
});
test('material hats align to the head centre and keep their compact wearable bounds',()=>{
 const artContext={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../wardrobe-art.js'),'utf8'),artContext);const art=artContext.window.WardrobeArt;
 for(const id of ['mushroomhat','starhat','fossilhat','crystalhat']){
  const rects=[];art.hat((...r)=>rects.push(r),id);const left=Math.min(...rects.map(r=>r[0])),right=Math.max(...rects.map(r=>r[0]+r[2])),top=Math.min(...rects.map(r=>r[1])),bottom=Math.max(...rects.map(r=>r[1]+r[3]));
  assert.equal((left+right)/2,13,id);assert(right-left<=26,id);assert(bottom<=8&&top>=-9,id);assert.equal(W.items.find(i=>i.id===id).headTop,top,id);
 }
});
