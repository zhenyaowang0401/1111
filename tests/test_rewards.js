/* Reward invariants: splitting tasks and reloading must not improve payouts. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../journey.js'),'utf8'),context);
const J=context.window.Journey;
function earned(parts){let base=0,stars=0,depth=0,finds=[0,0,0,0];for(const [i,elapsed] of parts.entries()){const s={id:'session-'+i,mode:'study',demo:false,plannedSeconds:7200,elapsed,baseEligible:base},r=J.rewards(s);stars+=r.stars;depth+=r.depth;r.finds.forEach((n,i)=>finds[i]+=n);base+=elapsed;}return {stars,depth,finds};}
assert.deepEqual(earned([1500]),earned([300,300,300,300,300]));
assert.deepEqual(earned([1500]),earned([420,180,899,1]));
assert.equal(earned([299]).stars,0);assert.equal(earned([300]).stars,1);
assert.equal(earned([599]).finds.reduce((a,n)=>a+n,0),0);
assert.equal(earned([600]).finds.reduce((a,n)=>a+n,0),1);
assert.equal(earned([7200,3600]).stars,36); // No daily hard cap.
const demo={id:'dev-test',demo:true,mode:'rest',plannedSeconds:15,elapsed:15};
assert.equal(J.rewards(demo).stars,1);assert.equal(J.rewards(demo).depth,5);
assert.equal(J.rewards(demo).finds.reduce((a,n)=>a+n,0),1);
assert.equal(J.rewards({...demo,elapsed:9}).stars,0);
assert.equal(J.rewards({...demo,elapsed:9}).finds.reduce((a,n)=>a+n,0),1);
const rest=J.rewards({...demo,demo:false,mode:'rest',elapsed:7200});assert.equal(rest.stars,0);assert.equal(rest.depth,0);
const session={id:'refresh',demo:false,mode:'work',plannedSeconds:3000,elapsed:1700,baseEligible:420};
assert.equal(JSON.stringify(J.rewards(session)),JSON.stringify(J.rewards(JSON.parse(JSON.stringify(session)))));
assert.equal(new Set(J.events(session).map(e=>e.id)).size,J.events(session).length);
console.log('PASS: reward boundaries, split/continuous equivalence, carry, no cap, repeatable developer demo, Break exclusion, stable unique pickup events after reload.');
