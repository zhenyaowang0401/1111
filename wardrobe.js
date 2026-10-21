/* Prices are fixed star exchanges; cosmetics never change reward rates. */
'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WardrobeCatalog=factory();})(typeof window==='undefined'?globalThis:window,()=>{
 const items=[
  {id:'hat',name:'Explorer hat',category:'hats',cost:3,rarity:'Common',headTop:-1},
  {id:'sunhat',name:'Sun hat',category:'hats',cost:6,rarity:'Common',headTop:-2},
  {id:'bucket',name:'Bucket hat',category:'hats',cost:9,rarity:'Common',headTop:-2},
  {id:'baseball',name:'Baseball cap',category:'hats',cost:30,rarity:'Rare',headTop:-2},
  {id:'bunny',name:'Bunny hat',category:'hats',cost:65,rarity:'Rare',headTop:-13},
  {id:'astronaut',name:'Space helmet',category:'hats',cost:80,rarity:'Epic',headTop:-5},
  {id:'crown',name:'Little crown',category:'hats',cost:120,rarity:'Legendary',headTop:-7},
  {id:'sweater',name:'Cream sweater',category:'clothes',cost:12,rarity:'Common'},
  {id:'coat',name:'Honey coat',category:'clothes',cost:15,rarity:'Common'},
  {id:'hoodie',name:'Lilac hoodie',category:'clothes',cost:20,rarity:'Uncommon'},
  {id:'uniform',name:'Brown school uniform',category:'clothes',cost:25,rarity:'Uncommon'},
  {id:'puffer',name:'Peach puffer',category:'clothes',cost:40,rarity:'Rare'},
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
  {id:'star',name:'Star pin',category:'extras',cost:5,rarity:'Uncommon'}
 ];
 const tools=[
  {id:'spoon',name:'Giant spoon',cost:45,rarity:'Uncommon'},
  {id:'shovel',name:'Garden shovel',cost:60,rarity:'Uncommon'},
  {id:'fork',name:'Garden fork',cost:75,rarity:'Rare'},
  {id:'drill',name:'Electric drill',cost:90,rarity:'Rare'},
  {id:'jackhammer',name:'Jackhammer',cost:150,rarity:'Epic'},
  {id:'crystaldrill',name:'Crystal drill',cost:240,rarity:'Legendary'}
 ];
 const categories=[{id:'all',label:'All'},{id:'hats',label:'Hats'},{id:'clothes',label:'Clothes'},{id:'scarves',label:'Scarves'},{id:'glasses',label:'Glasses'},{id:'tools',label:'Tools'},{id:'extras',label:'Extras'}];
 function equip(current,id){const item=items.find(i=>i.id===id);if(!item)return [...current];return [...current.filter(old=>old!==id&&(item.category==='extras'||items.find(i=>i.id===old)?.category!==item.category)),id];}
 function normalize(current,owned){let result=[];for(const id of current)if(owned.includes(id)&&items.some(i=>i.id===id))result=equip(result,id);return result;}
 function headTop(current){return items.find(i=>i.category==='hats'&&current.includes(i.id))?.headTop??5;}
 return {items,tools,categories,equip,normalize,headTop};
});
