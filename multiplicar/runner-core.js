// Fixed logical coordinates keep touch, keyboard and collisions identical on every screen.
export const LANES=[90,180,270];
export function createRunner({table='2',level='easy',mode='free',random=Math.random,onEvent=()=>{}}={}){
 const limit=level==='easy'?5:10;
 const trail=mode==='trail';
 const state={mode,phase:'ready',zone:0,lane:1,x:180,table:2,groups:0,total:0,score:0,rescued:0,charge:0,jump:0,cooldown:0,magnet:0,stun:0,elapsed:0,spawned:0,cleared:0,objects:[],facts:[],limit};
 let spawnClock=0,id=0;
 const emit=(type,extra={})=>onEvent({type,...extra});
 function setup(){state.groups=0;state.spawned=0;state.cleared=0;state.objects=[];state.charge=0;state.magnet=0;state.jump=0;state.cooldown=0;state.stun=0;state.lane=1;state.x=180;spawnClock=.6;const tables=level==='easy'?[2,5,10]:[2,3,4,5,6,7,8,9,10];state.table=table==='mix'?tables[Math.floor(random()*tables.length)]:Number(table);if(trail){state.groups=1;state.total+=state.table;state.facts.push({a:1,b:state.table,value:state.table});}}
 setup();
 function start(){if(state.phase==='ready'){state.phase='playing';emit('start');}}
 function move(direction){if(state.phase!=='playing')return;state.lane=Math.max(0,Math.min(2,state.lane+direction));}
 function jump(){if(trail||state.phase!=='playing'||state.cooldown>0)return;state.jump=.85;state.cooldown=1.1;emit('jump');}
 function magnet(){if(trail||state.phase!=='playing'||state.charge<3)return;state.charge=0;state.magnet=5;emit('magnet');}
 function pause(){if(state.phase==='playing'){state.phase='paused';emit('pause');}}
 function resume(){if(state.phase==='paused'){state.phase='playing';emit('resume');}}
 function next(){if(state.phase!=='checkpoint')return;if(state.zone===2){state.phase='finished';emit('finished');return;}state.zone++;setup();state.phase='playing';emit('start');}
 function trailTick(dt){
 if(spawnClock<=0&&state.objects.length===0&&state.groups<limit){
 const value=(state.groups+1)*state.table;
 const options=[value];
 for(const n of [value+1,value+state.table-1,value-1,value+2,value-2])if(n>0&&n<=100&&!options.includes(n)&&options.length<3)options.push(n);
 for(let i=options.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
 state.objects=options.map((value,lane)=>({id:id++,type:'gate',lane,value,y:-40,passed:false}));state.spawned++;emit('gates');
 }
 const speed=level==='easy'?100:125;
 for(const o of state.objects)o.y+=dt*speed;
 const gate=state.objects.find(o=>!o.passed&&o.lane===state.lane&&o.y>=410);
 if(gate){for(const o of state.objects)o.passed=true;const expected=(state.groups+1)*state.table;
 if(gate.value===expected){state.groups++;state.cleared++;state.total+=state.table;state.score+=10;const fact={a:state.groups,b:state.table,value:expected};state.facts.push(fact);emit('collect',{fact});}
 else emit('trailwrong',{chosen:gate.value,expected});
 spawnClock=1.2;
 }
 state.objects=state.objects.filter(o=>o.y<540);
 if(state.groups===limit&&state.objects.length===0){state.rescued++;state.phase='checkpoint';emit('checkpoint',{rescued:true});}
 }
 function tick(dt){if(state.phase!=='playing')return;dt=Math.min(Math.max(dt,0),.05);state.elapsed+=dt;state.jump=Math.max(0,state.jump-dt);state.cooldown=Math.max(0,state.cooldown-dt);state.magnet=Math.max(0,state.magnet-dt);state.stun=Math.max(0,state.stun-dt);state.x+=(LANES[state.lane]-state.x)*Math.min(1,dt*18);spawnClock-=dt;
 if(trail){trailTick(dt);return;}
 if(spawnClock<=0&&state.spawned<limit){const lane=Math.floor(random()*3);const rock=(lane+1+Math.floor(random()*2))%3;state.objects.push({id:id++,type:'basket',lane,y:-40,passed:false},{id:id++,type:'rock',lane:rock,y:-40,passed:false});state.spawned++;spawnClock=level==='easy'?2.25:1.85;}
 const speed=(level==='easy'?140:180)+state.zone*12;
 for(const object of state.objects){object.y+=dt*speed*(state.stun>0?.65:1);if(!object.passed&&object.y>=410){object.passed=true;if(object.type==='basket'){state.cleared++;if(object.lane===state.lane||state.magnet>0){state.groups++;state.total+=state.table;state.score+=10;state.charge=Math.min(3,state.charge+1);const fact={a:state.groups,b:state.table,value:state.groups*state.table};state.facts.push(fact);emit('collect',{fact});object.caught=true;}else emit('miss');}else if(object.lane===state.lane&&state.jump<=0&&state.magnet<=0){state.stun=.8;emit('bump');}else if(object.lane===state.lane&&state.jump>0){state.score+=5;emit('dodge');}}}
 state.objects=state.objects.filter(o=>o.y<540&&!o.caught);
 if(state.cleared===limit&&state.objects.length===0){const rescued=state.groups>=3;if(rescued)state.rescued++;state.phase='checkpoint';emit('checkpoint',{rescued});}
 }
 return {state,start,move,jump,magnet,pause,resume,next,tick};
}
