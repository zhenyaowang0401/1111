/* Prices are fixed star exchanges; cosmetics never change reward rates. */
'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WardrobeCatalog=factory();})(typeof window==='undefined'?globalThis:window,()=>{
 const items=[
  {id:'hat',name:'Explorer hat',category:'hats',cost:3,rarity:'Common',headTop:-1},
  {id:'sunhat',name:'Sun hat',category:'hats',cost:6,rarity:'Common',headTop:-2},
  {id:'bucket',name:'Bucket hat',category:'hats',cost:9,rarity:'Common',headTop:-2},
  {id:'baseball',name:'Baseball cap',category:'hats',cost:30,rarity:'Rare',headTop:-2},
  {id:'bunny',name:'Bunny hat',category:'hats',cost:65,rarity:'Rare',headTop:-13},
  {id:'cat',name:'Kitten hat',category:'hats',cost:24,rarity:'Uncommon',headTop:-7},
  {id:'cowcat',name:'Tuxedo cat hat',category:'hats',cost:15,rarity:'Uncommon',headTop:-8},
  {id:'dog',name:'Puppy hat',category:'hats',cost:28,rarity:'Uncommon',headTop:-2},
  {id:'frog',name:'Frog hat',category:'hats',cost:32,rarity:'Uncommon',headTop:-5},
  {id:'panda',name:'Panda hat',category:'hats',cost:45,rarity:'Rare',headTop:-6},
  {id:'fox',name:'Fox hat',category:'hats',cost:50,rarity:'Rare',headTop:-8},
  {id:'lion',name:'Lion hat',category:'hats',cost:60,rarity:'Rare',headTop:-5},
  {id:'astronaut',name:'Space helmet',category:'hats',cost:80,rarity:'Epic',headTop:-5},
  {id:'crown',name:'Little crown',category:'hats',cost:120,rarity:'Legendary',headTop:-7},
  {id:'scarf',name:'Mint scarf',category:'scarves',cost:3,rarity:'Common'},
  {id:'striped',name:'Striped scarf',category:'scarves',cost:8,rarity:'Common'},
  {id:'checkered',name:'Checkered scarf',category:'scarves',cost:14,rarity:'Uncommon'},
  {id:'bow',name:'Ribbon scarf',category:'scarves',cost:22,rarity:'Uncommon'},
  {id:'fur',name:'Fluffy scarf',category:'scarves',cost:38,rarity:'Rare'},
  {id:'glasses',name:'Goggles',category:'glasses',cost:2,rarity:'Common'},
  {id:'sunglasses',name:'Sunglasses',category:'glasses',cost:6,rarity:'Common'},
  {id:'roundglasses',name:'Round glasses',category:'glasses',cost:8,rarity:'Common'},
  {id:'squareglasses',name:'Square frames',category:'glasses',cost:10,rarity:'Uncommon'},
  {id:'heartglasses',name:'Heart frames',category:'glasses',cost:24,rarity:'Rare'},
  {id:'starglasses',name:'Star shades',category:'glasses',cost:45,rarity:'Epic'},
  {id:'star',name:'Star pin',category:'extras',cost:5,rarity:'Uncommon'},
  {id:'heartpin',name:'Heart pin',category:'extras',cost:6,rarity:'Common'},
  {id:'leafpin',name:'Leaf pin',category:'extras',cost:8,rarity:'Common'},
  {id:'flowerpin',name:'Daisy pin',category:'extras',cost:10,rarity:'Common'},
  {id:'moonpin',name:'Moon pin',category:'extras',cost:12,rarity:'Uncommon'},
  {id:'mushroompin',name:'Mushroom pin',category:'extras',cost:15,rarity:'Uncommon'},
  {id:'bellpin',name:'Little bell',category:'extras',cost:18,rarity:'Uncommon'},
  {id:'crystalpin',name:'Crystal pin',category:'extras',cost:22,rarity:'Rare'}
 ];
 items.push(
  {id:'mushroomhat',name:'Forager mushroom beret',category:'hats',cost:0,recipe:{mushroom:40},rarity:'Epic',headTop:-4},
  {id:'starhat',name:'Starlight sorcerer hat',category:'hats',cost:0,recipe:{star:40},rarity:'Epic',headTop:-9},
  {id:'fossilhat',name:'Spiral explorer hat',category:'hats',cost:0,recipe:{fossil:30},rarity:'Rare',headTop:-4},
  {id:'crystalhat',name:'Crystal circlet',category:'hats',cost:0,recipe:{crystal:30},rarity:'Rare',headTop:-7}
 );
 function redeem(s,id){const i=items.find(i=>i.id===id);if(!i?.recipe||s.owned.includes(id)||s.session?.status==='running')return false;const materials=['star','mushroom','crystal','fossil'];
  for(const [id,n] of Object.entries(i.recipe)){const reserved=Object.values(s.home?.slots||{}).filter(v=>v==='find:'+id).length+(s.heldItem===id?1:0);const total=s.inventory[materials.indexOf(id)];if(!Number.isFinite(total)||total-reserved<n)return false;}
  for(const [id,n] of Object.entries(i.recipe))s.inventory[materials.indexOf(id)]-=n;s.owned.push(i.id);return true;
 }
 const tools=[
  {id:'spoon',name:'Giant spoon',cost:45,rarity:'Uncommon'},
  {id:'shovel',name:'Garden shovel',cost:60,rarity:'Uncommon'},
  {id:'fork',name:'Garden fork',cost:75,rarity:'Rare'},
  {id:'drill',name:'Electric drill',cost:90,rarity:'Rare'},
  {id:'jackhammer',name:'Jackhammer',cost:150,rarity:'Epic'},
  {id:'crystaldrill',name:'Crystal drill',cost:240,rarity:'Legendary'}
 ];
 const categories=[{id:'all',label:'All'},{id:'hats',label:'Hats'},{id:'scarves',label:'Scarves'},{id:'glasses',label:'Glasses'},{id:'tools',label:'Tools'},{id:'extras',label:'Extras'}];
 function equip(current,id){const item=items.find(i=>i.id===id);if(!item)return [...current];return [...current.filter(old=>old!==id&&items.find(i=>i.id===old)?.category!==item.category),id];}
 function normalize(current,owned){let result=[];for(const id of current)if(owned.includes(id)&&items.some(i=>i.id===id))result=equip(result,id);return result;}
 function headTop(current){return items.find(i=>i.category==='hats'&&current.includes(i.id))?.headTop??5;}
 const retiredClothes={sweater:12,coat:15,hoodie:20,uniform:25,puffer:40};
 function clothingRefund(owned){return [...new Set(Array.isArray(owned)?owned:[])].reduce((n,id)=>n+(Object.hasOwn(retiredClothes,id)?retiredClothes[id]:0),0);}
 return {items,redeem,tools,categories,equip,normalize,headTop,clothingRefund};
});
