'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),nav=require('../home-navigation.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<.001,`${a} != ${b}`);
test('same-floor travel follows passages; upstairs travel uses the ladder',()=>{
 const floor=nav.plan({x:247,y:316},{x:550,y:310});assert.ok(floor.every(p=>p.mode==='walk'));assert.ok(floor.some(p=>p.x===370));
 const upstairs=nav.plan({x:550,y:310},{x:120,y:149});assert.ok(upstairs.some(p=>p.mode==='climb'));
 let previous={x:550,y:310};for(const p of upstairs){if(p.mode==='climb'){near(p.x,312);near(previous.x,312);}previous=p;}
 assert.deepEqual(upstairs.at(-1),{x:120,y:149,mode:'walk'});
});
test('every room pair is reachable without overshoot or leaving the route',()=>{
 const targets=[{x:65,y:149},{x:205,y:149},{x:420,y:177},{x:566,y:177},{x:115,y:316},{x:300,y:316},{x:452,y:310},{x:566,y:310},{x:312,y:104}];
 for(const from of targets)for(const to of targets){const a=nav.create(from.x,from.y);nav.go(a,to);let ticks=0;while(a.moving&&ticks++<1500){nav.advance(a,.016);assert.ok(nav.project(a).distance<.001);}assert.ok(ticks<1500);near(a.x,to.x);near(a.y,to.y);}
});
test('replanning during a step or climb is continuous and changes facing',()=>{
 const a=nav.create();nav.go(a,{x:150,y:149});nav.advance(a,.5);assert.equal(a.facing,1);const before={x:a.x,y:a.y};nav.go(a,{x:115,y:316});near(a.x,before.x);near(a.y,before.y);nav.advance(a,.1);assert.equal(a.facing,-1);
 nav.go(a,{x:120,y:149});nav.advance(a,2);assert.equal(a.motion,'climb');assert.equal(a.climbDirection,-1);const y=a.y;nav.go(a,{x:500,y:177});near(a.y,y);nav.advance(a,.01);assert.ok(Math.abs(a.y-y)<=.46+.001);
 nav.go(a,{x:312,y:290});nav.advance(a,.1);assert.equal(a.climbDirection,1);nav.stop(a);const stopped={x:a.x,y:a.y};nav.advance(a,5);near(a.x,stopped.x);near(a.y,stopped.y);assert.equal(a.target,null);
});
test('invalid destinations do not create motion or corrupt positions',()=>{
 const a=nav.create();assert.equal(nav.go(a,{x:NaN,y:100}),false);assert.equal(nav.go(a,{x:100,y:Infinity}),false);assert.equal(a.moving,false);near(a.x,247);near(a.y,316);
});

test('clicking the current position cancels the previous destination',()=>{const a=nav.create();nav.go(a,{x:150,y:149});nav.advance(a,.5);nav.go(a,{x:a.x,y:a.y});assert.equal(a.moving,false);assert.equal(a.target,null);});
