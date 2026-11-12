import assert from 'node:assert/strict';
import {factsFor,uniqueFacts,choicesFor,winningLine,sumText} from '../../multiplicar/core.js';
for(const level of ['easy','all'])for(const table of [...Array.from({length:10},(_,i)=>String(i+1)),'mix']){
 const pool=factsFor(table,level);assert(pool.length>0);
 for(const fact of pool){assert.equal(fact.value,fact.a*fact.b);assert(fact.a>=1&&fact.a<=10);assert(fact.b>=1&&fact.b<=(level==='easy'?5:10));if(table!=='mix')assert.equal(fact.a,Number(table));
  for(let i=0;i<10;i++){const options=choicesFor(fact);assert.equal(options.length,4);assert.equal(new Set(options).size,4);assert(options.includes(fact.value));assert(options.every(n=>Number.isInteger(n)&&n>=1&&n<=100));}
 }
 for(let i=0;i<20;i++){const size=level==='easy'?4:9;const board=uniqueFacts(pool,size);assert.equal(board.length,size);assert.equal(new Set(board.map(f=>f.value)).size,size);}
}
assert.deepEqual(winningLine(new Set([0,4,8]),3),[0,4,8]);assert.deepEqual(winningLine(new Set([1,4,7]),3),[1,4,7]);assert.equal(winningLine(new Set([0,4]),3),null);assert.deepEqual(winningLine(new Set([0,3]),2),[0,3]);assert.equal(sumText({a:3,b:4}),'4 + 4 + 4');console.log('PASS: all tables and levels, unique playable bingo boards, distractors, winning lines and repeated addition.');
