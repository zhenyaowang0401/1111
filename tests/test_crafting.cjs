'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Home=require('../home.js');
const state=()=>({inventory:[2,4,2,1],balance:77,heldItem:'mushroom',home:{owned:['rug'],slots:{left:'find:mushroom',right:null,wall:null,floor:'rug'}},rareInventory:{mask:1},displayedTreasure:'mask'});
test('crafting reserves both placed and head copies and charges materials once',()=>{
 const s=state(),before=structuredClone(s),status=Home.recipeStatus(s,'mushroomLamp');
 assert.equal(status.ingredients[0].available,2);assert.equal(status.ingredients[0].reserved,2);
 assert.equal(Home.craft(s,'mushroomLamp'),true);assert.deepEqual(s.inventory,[2,2,2,1]);assert.equal(s.balance,77);
 assert.deepEqual(s.home.slots,before.home.slots);assert.equal(s.heldItem,'mushroom');assert.deepEqual(s.rareInventory,before.rareInventory);assert.equal(s.displayedTreasure,before.displayedTreasure);
 const done=structuredClone(s);assert.equal(Home.craft(s,'mushroomLamp'),false);assert.equal(Home.craft(s,'mushroomPlanter'),false);assert.deepEqual(s,done);
});
test('insufficient, invalid, ordinary star furniture and running requests never change state',()=>{
 const s=state();s.inventory[1]=2;
 for(const id of ['mushroomPlanter','mushroomLamp','lamp','unknown']){const before=structuredClone(s);assert.equal(Home.craft(s,id),false);assert.deepEqual(s,before);}
 s.session={status:'running'};const before=structuredClone(s);assert.equal(Home.craft(s,'starMobile'),false);assert.deepEqual(s,before);
 s.session.status='paused';assert.equal(Home.craft(s,'starMobile'),true);assert.equal(s.inventory[0],0);assert.equal(s.balance,77);
});
test('confirmation rechecks material availability, including changed displays',()=>{
 const s=state();assert.equal(Home.recipeStatus(s,'crystalChime').canCraft,true);
 s.home.slots.wall='find:crystal';const before=structuredClone(s);assert.equal(Home.craft(s,'crystalChime'),false);assert.deepEqual(s,before);
 s.home.slots.wall=null;assert.equal(Home.craft(s,'crystalChime'),true);
});
test('consuming the last material keeps discovery history and furniture ownership across serialization',()=>{
 const s=state();s.heldItem=null;s.home.slots.left=null;
 for(const id of ['mushroomPlanter','mushroomLamp','crystalChime','fossilFrame','starMobile'])assert.equal(Home.craft(s,id),true);
 assert.deepEqual(s.inventory,[0,1,0,0]);assert.deepEqual(s.foundDiscoveries,['star','mushroom','crystal','fossil']);
 const restored=JSON.parse(JSON.stringify(s));Home.rememberFinds(restored);assert.deepEqual(restored.foundDiscoveries,s.foundDiscoveries);
 for(const item of Home.items.filter(i=>restored.home.owned.includes(i.id)&&i.recipe)){assert.equal(Home.recipeStatus(restored,item.id).owned,true);assert.equal(Home.craft(restored,item.id),false);}
});
test('unavailable and corrupt counts cannot create free materials',()=>{
 const s=state();s.inventory=[NaN,Infinity,-1,0];
 for(const item of Home.items.filter(i=>i.recipe))assert.equal(Home.craft(s,item.id),false);
 assert.equal(Home.spareMaterials(s)[1].available,0);
});
