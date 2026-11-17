import assert from 'node:assert/strict';
import {createRunner} from '../../multiplicar/runner-core.js';
function until(g,test,max=20000){for(let i=0;i<max&&!test();i++)g.tick(.05);assert(test(),'reached state');}
const events=[];const g=createRunner({table:'7',mode:'trail',random:()=>0,onEvent:e=>events.push(e)});const s=g.state;
assert.equal(s.groups,1);assert.equal(s.total,7);assert.equal(s.score,0);g.start();until(g,()=>s.objects.length===3);
assert.deepEqual(s.objects.map(o=>o.value).sort((a,b)=>a-b),[14,15,20]);
const wrong=s.objects.find(o=>o.value===15);g.move(wrong.lane-s.lane);g.jump();g.magnet();assert.equal(s.jump,0);assert.equal(s.magnet,0);until(g,()=>events.some(e=>e.type==='trailwrong'));assert.equal(s.groups,1);assert.equal(s.score,0);assert.equal(s.total,7);assert(!events.some(e=>e.type==='collect'));
until(g,()=>s.objects.some(o=>!o.passed));assert(s.objects.some(o=>o.value===14));const correct=s.objects.find(o=>o.value===14);g.move(correct.lane-s.lane);g.pause();const y=correct.y;g.tick(.05);assert.equal(correct.y,y);g.resume();until(g,()=>s.groups===2);assert.equal(s.total,14);assert.equal(s.score,10);assert.equal(events.filter(e=>e.type==='collect').length,1);
for(const level of ['easy','all'])for(let table=1;table<=10;table++){
 const race=createRunner({table:String(table),level,mode:'trail'});const st=race.state;race.start();let iterations=0;
 while(st.phase!=='finished'&&iterations++<50000){if(st.phase==='checkpoint'){race.next();continue;}
 const gates=st.objects.filter(o=>!o.passed);if(gates.length){assert.equal(gates.length,3);assert.equal(new Set(gates.map(o=>o.value)).size,3);assert(gates.every(o=>o.value>=1&&o.value<=100));const right=gates.find(o=>o.value===(st.groups+1)*table);assert(right);race.move(right.lane-st.lane);}race.tick(.05);}
 assert.equal(st.phase,'finished');assert.equal(st.rescued,3);assert.equal(st.score,3*(st.limit-1)*10);assert.equal(st.total,3*table*st.limit);assert(st.facts.every(f=>f.value===f.a*f.b));
}
console.log('PASS trail: starts at 7, gates 14/15/20, wrong-answer retry without rewards/progress, no jump/magnet bypass, pause, all 10 tables and both levels through three zones.');
