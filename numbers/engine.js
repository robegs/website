/* Numberworks simulation. No DOM dependencies; usable in headless tests. */
(function (root) {
'use strict';
const DIRS = [[1,0],[0,1],[-1,0],[0,-1]];
const GRID = .25;
const SOURCE_SIZE = .75;
const HUB_TILES = Array.from({length:16},(_,i)=>[i%4,Math.floor(i/4)]);
const MAX_VALUE = 999999999;
const TYPES = {
 belt:{name:'Conveyor',icon:'→',key:'1',unlock:0,description:'Carries one number. Output follows the arrow.'},
 extractor:{name:'Extractor',icon:'↥',key:'2',unlock:0,description:'Activates an entire number patch. Each outward-facing edge belt has independent output. Starts at one number every two seconds; upgrade speed in the workshop.'},
 add:{name:'Add',icon:'+',key:'3',unlock:0,description:'A + B. Input A at the rear, B on the left; output at the front.'},
 splitter:{name:'Splitter',icon:'⑂',key:'4',unlock:2,description:'One rear input. Fairly distributes numbers to front and side outputs.'},
 merger:{name:'Merger',icon:'⋈',key:'5',unlock:2,description:'Combines rear and side inputs into one forward output.'},
 mul:{name:'Multiply',icon:'×',key:'6',unlock:3,description:'A × B. Input A at the rear, B on the left.'},
 sub:{name:'Subtract',icon:'−',key:'7',unlock:5,description:'A − B. Negative results pause the machine.'},
 div:{name:'Divide',icon:'÷',key:'8',unlock:7,description:'A ÷ B. Only exact, nonnegative integer results are allowed.'},
 cross:{name:'Crossing',icon:'╋',key:'9',unlock:8,description:'Two independent lanes: rear to front and left to right.'},
 mod:{name:'Remainder',icon:'%',key:'0',unlock:10,description:'A mod B. Returns the remainder of division.'},
 trash:{name:'Recycler',icon:'⌫',key:'',unlock:0,description:'Consumes unwanted numbers from any side.'},
 hub:{name:'Delivery hub',icon:'◎',unlock:0,description:'Accepts deliveries on all four sides. Deliveries automatically count toward any matching active contract.'}
};
const KIDS_LESSONS=[
 ['add',2,2,'Put two groups together'],['add',2,3,'Count on from two'],['add',3,4,'Make seven'],['add',5,5,'Double five'],
 ['sub',5,2,'Take two away'],['sub',9,4,'Find what is left'],
 ['mul',2,3,'Two groups of three'],['mul',3,4,'Three groups of four'],['mul',4,4,'Four equal groups'],
 ['div',6,2,'Share six into two groups'],['div',8,4,'Share eight into four groups'],['div',9,3,'Share nine equally']
];
const OBJECTIVES = [
 {value:4,count:10,title:'Two plus two',hint:'Only 2 is unlocked. Feed two streams of 2 into an adder: 2 + 2 = 4.'},
 {value:10,count:12,title:'Build ten from twos',hint:'Keep using only 2s and addition: make 4 = 2 + 2, then 8 = 4 + 4, then 10 = 8 + 2. Finish to open the workshop.'},
 {value:6,count:20,title:'Branch out',hint:'Use splitters and mergers to share production. Try 3 + 3.'},
 {value:12,count:24,title:'Multiply your output',hint:'Multiply 3 × 4, or reuse your addition lines.'},
 {value:24,count:28,title:'Build on what works',hint:'Multiply your 12 production by 2.'},
 {value:7,count:25,title:'The difference',hint:'Try 9 − 2. The rear port is A and the left port is B.'},
 {value:42,count:32,title:'A useful answer',hint:'Combine a 7 line with a 6 line, then multiply.'},
 {value:8,count:30,title:'Equal shares',hint:'Try 24 ÷ 3. Division needs an exact integer result.'},
 {value:64,count:36,title:'Cross paths',hint:'Multiply 8 × 8. Crossings keep two routes independent.'},
 {value:100,count:40,title:'A round number',hint:'Build 10 from 5 + 5, then square it.'},
 {value:1,count:40,title:'What remains',hint:'Try 7 mod 3, or 3 − 2.'},
 {value:144,count:50,title:'The grand assembly',hint:'Bring it all together: 12 × 12. Finish to enter endless mode.'}
];
// Long contracts use square numbers with compact, achievable multiplication recipes.
const PROJECT_TARGETS = [256,1024,4096,16384,65536,262144,1048576,4194304,16777216,67108864,268435456];
const PROJECT_COUNTS = [120,180,240,320,420,540,680,840,1000,1200,1500];
const ENDLESS_TARGETS = [288,720,1728,3600,14400,43200,129600,388800,1166400,3499200,10497600,31492800,94478400,283435200,850305600];
function projectDefinition(index){const tier=index%PROJECT_TARGETS.length,value=PROJECT_TARGETS[tier],root=Math.sqrt(value);return {id:`project-${index}`,index,kind:'project',value,count:Math.min(5000,PROJECT_COUNTS[tier]+Math.floor(index/PROJECT_TARGETS.length)*100),title:`Production order ${index+1}`,hint:`Build ${root.toLocaleString('en-US')} × ${root.toLocaleString('en-US')}. Keep this line running while you work on other contracts.`};}
const OPERATIONS=['add','sub','mul','div','mod'];
const NUMBER_COSTS={1:90,3:35,4:25,5:45,6:35,7:55,8:45,9:55};
const OPERATION_COSTS={sub:45,mul:60,div:80,mod:70};
const EXTRACTOR_TICKS=[40,32,24,16,10],OPERATOR_TICKS=[24,20,16,12,8],UPGRADE_COSTS=[80,160,280,440];
const capacityFor=completed=>completed>=6?3:completed>=3?2:1;
const TRANSPORT = new Set(['belt','splitter','merger','cross','trash']);
const sizeOf=b=>typeof b==='string'?(TRANSPORT.has(b)?GRID:b==='extractor'?SOURCE_SIZE:1):(b.size??sizeOf(b.type));
const key=(x,y)=>`${x},${y}`;
const side=(d,n)=>(d+n+4)%4;
const travelTicks=b=>TRANSPORT.has(b.type)?2:4;
// Refine a saved layout without changing its machine anchors or losing items.
function refineLayout(layout,fromStep=.5,toStep=GRID){
 const oldOccupied=new Set(),occupied=new Set();
 for(const b of layout)for(let x=0;x<b.size;x+=fromStep)for(let y=0;y<b.size;y+=fromStep)oldOccupied.add(key(b.x+x,b.y+y));
 const result=layout.map(b=>({...b,size:TRANSPORT.has(b.type)?toStep:b.size}));
 for(const b of result)for(let x=0;x<b.size;x+=toStep)for(let y=0;y<b.size;y+=toStep)occupied.add(key(b.x+x,b.y+y));
 for(let n=0;n<layout.length;n++){
 const old=layout[n],b=result[n],dirs=old.type==='extractor'?[0,1,2,3]:old.type==='splitter'?[old.dir,side(old.dir,1),side(old.dir,3)]:old.type==='cross'?[old.dir,side(old.dir,1)]:['hub','trash'].includes(old.type)?[]:[old.dir];
 for(const d of dirs)for(let along=0;along<old.size;along+=fromStep){
 const ox=d===0?old.x+old.size:d===2?old.x-fromStep:old.x+along,oy=d===1?old.y+old.size:d===3?old.y-fromStep:old.y+along;
 if(!oldOccupied.has(key(ox,oy)))continue;
 let x=d===0?b.x+b.size:d===2?b.x-toStep:ox,y=d===1?b.y+b.size:d===3?b.y-toStep:oy;
 const [dx,dy]=DIRS[d],length=Math.round((Math.abs(ox-x)+Math.abs(oy-y))/toStep);
 for(let j=0;j<=length;j++,x+=dx*toStep,y+=dy*toStep){if(!occupied.has(key(x,y))){result.push({type:'belt',x,y,dir:d,size:toStep});occupied.add(key(x,y));}}
 }
 }
 return result;
}
function hash(x,y,seed) { let h=Math.imul(x^seed,374761393)^Math.imul(y,668265263); h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0; }
function arithmetic(type,a,b) {
 let value;
 if(type==='add')value=a+b;
 else if(type==='sub')value=a-b;
 else if(type==='mul')value=a*b;
 else if(type==='div'){if(!b)return {error:'Division by zero'};if(a%b)return {error:'Needs exact division'};value=a/b;}
 else if(type==='mod'){if(!b)return {error:'Division by zero'};value=a%b;}
 else return {error:'Unknown operation'};
 if(value<0)return {error:'Negative result'};
 if(!Number.isSafeInteger(value)||value>MAX_VALUE)return {error:'Number too large'};
 return {value};
}
class World {
 constructor(seed=2026,mode='standard') {
 this.seed=seed>>>0;this.mode=mode;this.buildings=new Map();this.occupancy=new Map();this.tick=0;this.level=0;this.progress=0;this.delivered=0;this.generated=0;this.discarded=0;this.operations=0;this.nextId=1;this.extent=48;this.events=[];this.history=[];this.rates=[];this.sessionDeliveries=0;
 this.projectContracts=[];this.projectsCompleted=0;this.nextProjectIndex=0;this.coreOverride=null;
 this.xp=0;this.xpEarned=0;this.unlockedNumbers=mode==='sandbox'?[1,2,3,4,5,6,7,8,9]:[2];this.unlockedOperations=mode==='sandbox'?[...OPERATIONS]:['add'];this.upgrades={extractor:1,operator:1};this.targetSequence=0;this.hubTotals={};
 this.put('hub',0,0,0,true);
 if(mode==='kids'){this.unlockedNumbers=[1,2,3,4,5,6,7,8,9];this.unlockedOperations=['add','sub','mul','div'];this.put('add',-2,0,0,true);for(let x=-1;x<0;x+=GRID)this.put('belt',x,0,0,true);}
 }
 get kidsLesson(){const [operation,a,b,title]=KIDS_LESSONS[this.level%KIDS_LESSONS.length];return {operation,a,b,title,value:arithmetic(operation,a,b).value};}
 tryLesson(answer){
 if(this.mode!=='kids')return {error:'Choose Math playground mode first.'};const lesson=this.kidsLesson;
 if(answer!==lesson.value)return {error:'Try again. Use the picture and count carefully. There is no penalty.'};
 const machine=this.get(-2,0);if(!machine||!OPERATIONS.includes(machine.type))return {error:'Place an operator at -2, 0 to use the lesson machine.'};
 if([...this.buildings.values()].some(b=>this.contents(b).length))return {error:'Let the numbers reach the hub before trying again.'};
 machine.type=lesson.operation;machine.dir=0;machine.a=this.token(lesson.a);machine.b=this.token(lesson.b);machine.error=null;this.generated+=2;return {value:lesson.value};
 }
 get objective(){
 if(this.mode==='kids'){const lesson=this.kidsLesson;return {value:lesson.value,count:1,title:lesson.title,hint:`Open Math lesson to predict the answer, then watch the machine work.`};}

 const definition=OBJECTIVES[this.level]||{value:ENDLESS_TARGETS[Math.min(this.level-12,ENDLESS_TARGETS.length-1)],count:Math.min(2500,70+(this.level-12)*20),title:`Factory contract ${this.level+1}`,hint:'Reuse your production lines and combine their outputs.'};
 if(!this.coreOverride){let value=definition.value,random=false;if(this.level>=2&&this.randomContractsReady){value=this.randomTarget(this.projectContracts.map(c=>c.value));random=true;}else while(!this.canMake(value))value++;this.coreOverride={value,count:definition.count,random};}
 return {...definition,...this.coreOverride,hint:this.coreOverride.random?'Produce this number using your unlocked sources and operations. Other contracts keep their progress.':this.coreOverride.value!==definition.value?'Build this target using your unlocked numbers and addition. The workshop can unlock more ways to solve it.':definition.hint};
 }
 get randomContractsReady(){return this.mode!=='kids'&&this.unlockedNumbers.length>=7&&this.unlockedOperations.length>=4;}
 canMake(value){if(!Number.isSafeInteger(value)||value<1||value>MAX_VALUE)return false;if(this.unlockedOperations.includes('div')||this.unlockedNumbers.includes(1))return true;const odd=this.unlockedNumbers.filter(n=>n%2);if(value%2===0)return true;if(!odd.length)return false;if(this.unlockedOperations.includes('sub')||this.unlockedOperations.includes('mod'))return true;return value>=Math.min(...odd);}
 randomTarget(excluded=[]){let value;do{value=1+hash(this.targetSequence++,this.seed,9137)%10000;}while(!this.canMake(value)||excluded.includes(value));return value;}
 isUnlocked(type){return OPERATIONS.includes(type)?this.unlockedOperations.includes(type):TYPES[type]?.unlock<=this.unlocked;}
 earnXP(amount){this.xp+=amount;this.xpEarned+=amount;}
 get workshopOpen(){return this.mode==='sandbox'||this.level>=2;}
 get extractorInterval(){return EXTRACTOR_TICKS[this.upgrades.extractor-1];}
 get operatorInterval(){return OPERATOR_TICKS[this.upgrades.operator-1];}
 purchase(kind,id){
 if(!this.workshopOpen)return {error:'Complete the 4 and 10 contracts to open the workshop.'};
 let cost;
 if(kind==='number'){id=Number(id);if(this.unlockedNumbers.includes(id))return {error:'This number is already unlocked.'};cost=NUMBER_COSTS[id];}
 else if(kind==='operation'){if(this.unlockedOperations.includes(id))return {error:'This operation is already unlocked.'};cost=OPERATION_COSTS[id];}
 else if(kind==='upgrade'&&['extractor','operator'].includes(id)){cost=UPGRADE_COSTS[this.upgrades[id]-1];if(cost===undefined)return {error:'Already at maximum speed.'};}
 if(!Number.isSafeInteger(cost))return {error:'Unknown workshop item.'};if(this.xp<cost)return {error:`You need ${cost-this.xp} more XP.`};
 this.xp-=cost;
 if(kind==='number'){this.unlockedNumbers.push(id);this.unlockedNumbers.sort((a,b)=>a-b);}
 else if(kind==='operation')this.unlockedOperations.push(id);
 else{this.upgrades[id]++;for(const b of this.buildings.values()){if(id==='operator'&&OPERATIONS.includes(b.type))b.work=Math.min(b.work,this.operatorInterval);if(id==='extractor'&&b.type==='extractor')for(const k of Object.keys(b.outputs))b.outputs[k]=Math.min(b.outputs[k],this.tick+this.extractorInterval);}}
 return {cost};
 }
 get completedContracts(){return this.level+this.projectsCompleted;}
 get contractCapacity(){return this.mode==='kids'?1:capacityFor(this.completedContracts);}
 syncContracts(){while(this.projectContracts.length<this.contractCapacity-1){const index=this.nextProjectIndex++,definition=projectDefinition(index);if(this.randomContractsReady){definition.value=this.randomTarget([this.objective.value,...this.projectContracts.map(c=>c.value)]);definition.random=true;definition.hint='Build this number with your unlocked sources and operations.';}if(definition.value===this.objective.value||this.projectContracts.some(c=>c.value===definition.value))continue;this.projectContracts.push({...definition,progress:0});}}
 get activeContracts(){this.syncContracts();return [{...this.objective,id:`core-${this.level}`,kind:'core',progress:this.progress},...this.projectContracts];}
 creditContract(value,active){
 const contract=active.find(c=>c.value===value&&c.progress<c.count);if(!contract)return;
 contract.progress++;if(contract.kind==='core')this.progress++;
 this.sessionDeliveries++;this.earnXP(1);
 }
 finishContracts(){
 const previousCapacity=this.contractCapacity,completed=[];
 if(this.progress>=this.objective.count){completed.push({id:`core-${this.level}`,kind:'core',...this.objective});this.level++;this.progress=0;this.coreOverride=null;}
 this.projectContracts=this.projectContracts.filter(c=>{if(c.progress<c.count)return true;completed.push({...c});this.projectsCompleted++;return false;});
 if(completed.length){for(const c of completed)this.earnXP(c.kind==='core'&&this.level<=2?(this.level===1?40:60):40+Math.min(160,Math.floor(Math.sqrt(c.value))));this.syncContracts();this.events.push({type:'contracts',completed,newSlots:this.contractCapacity-previousCapacity});}
 }
 get unlocked(){return this.mode==='sandbox'?99:this.level;}
 depositAt(x,y,legacy=false) {
 const patchSize=legacy?2:SOURCE_SIZE;
 const fixed=[[-8,-3,2],[-8,3,3],[-4,8,4],[5,7,5],[9,-5,9],[5,-8,1],[12,5,6],[-12,-8,7],[10,10,8]];
 for(const [px,py,value] of fixed)if(x>=px&&x<px+patchSize&&y>=py&&y<py+patchSize)return {x:px,y:py,value,size:patchSize};
 if(Math.abs(x)<14&&Math.abs(y)<14)return null;
 const cx=Math.floor(x/9),cy=Math.floor(y/9),h=hash(cx,cy,this.seed);
 const px=cx*9+1+h%5,py=cy*9+1+(h>>>4)%5;
 if(!legacy&&px<14&&px+2>-14&&py<14&&py+2>-14)return null;
 return x>=px&&x<px+patchSize&&y>=py&&y<py+patchSize?{x:px,y:py,value:1+(h>>>8)%9,size:patchSize}:null;
 }
 deposit(x,y){return this.depositAt(x,y)?.value??null;}
 get(x,y){return this.occupancy.get(key(x,y));}
 cells(b){if(b.type==='hub')return (b.hubTiles??HUB_TILES).map(([x,y])=>({x:b.x+x*GRID,y:b.y+y*GRID}));const cells=[];for(let dx=0;dx<sizeOf(b);dx+=GRID)for(let dy=0;dy<sizeOf(b);dy+=GRID)cells.push({x:b.x+dx,y:b.y+dy});return cells;}
 placement(type,x,y,size=sizeOf(type)){const patch=type==='extractor'&&size===SOURCE_SIZE?this.depositAt(x,y):null;return patch?{x:patch.x,y:patch.y}:{x,y};}
 index(b){this.buildings.set(key(b.x,b.y),b);for(const p of this.cells(b))this.occupancy.set(key(p.x,p.y),b);}
 canPlace(type,x,y,dir=0,size=sizeOf(type)){
 if(!Object.hasOwn(TYPES,type)||type==='hub')return 'Choose a building';
 ({x,y}=this.placement(type,x,y,size));
 if(!Number.isInteger(x/GRID)||!Number.isInteger(y/GRID)||x<-this.extent||y<-this.extent||x+size-GRID>this.extent+1-GRID||y+size-GRID>this.extent+1-GRID)return 'Outside map; expand from the World menu';
 if(!Number.isInteger(dir)||dir<0||dir>3)return 'Invalid direction';
 if(!this.isUnlocked(type))return 'Complete more objectives to unlock';
 const replacesBelt=type==='splitter'&&size===GRID&&this.get(x,y)?.type==='belt';
 if(!replacesBelt&&this.cells({x,y,size}).some(p=>this.get(p.x,p.y)))return 'Space occupied';
 if(!replacesBelt&&this.buildings.size>=100000)return 'Factory limit reached (100,000 buildings)';
 if(type==='extractor'&&this.deposit(x,y)===null)return 'Extractors need a number deposit';
 if(type==='extractor'&&!this.unlockedNumbers.includes(this.deposit(x,y)))return `Number ${this.deposit(x,y)} is locked. Unlock it in the workshop`;
 return null;
 }
 put(type,x,y,dir=0,force=false,size=sizeOf(type)){
 ({x,y}=this.placement(type,x,y,size));
 if(!force&&this.canPlace(type,x,y,dir,size))return null;
 const existing=this.get(x,y);if(!force&&type==='splitter'&&existing?.type==='belt'){existing.type='splitter';return existing;}
 const b={id:this.nextId++,type,x,y,size,dir,sourceValue:type==='extractor'?(this.depositAt(x,y,size>SOURCE_SIZE)?.value??null):null,q:null,lanes:[null,null],a:null,b:null,work:0,pending:null,cooldown:0,outputs:{},rr:0,inputCursor:0,received:0,sent:0,error:null};if(type==='hub')b.hubTiles=HUB_TILES.map(p=>[...p]);this.index(b);return b;
 }
 remove(x,y){const b=this.get(x,y);if(!b||b.type==='hub')return null;this.discarded+=this.contents(b).length;this.buildings.delete(key(b.x,b.y));for(const p of this.cells(b))this.occupancy.delete(key(p.x,p.y));return b;}
 canMove(b,x,y){if(!b||!OPERATIONS.includes(b.type))return 'Only arithmetic operators can be moved';if(!Number.isInteger(x/GRID)||!Number.isInteger(y/GRID)||x<-this.extent||y<-this.extent||x+sizeOf(b)-GRID>this.extent+1-GRID||y+sizeOf(b)-GRID>this.extent+1-GRID)return 'Outside the map';if(this.cells({...b,x,y}).some(p=>this.get(p.x,p.y)&&this.get(p.x,p.y)!==b))return 'Space occupied';return null;}
 move(b,x,y){const error=this.canMove(b,x,y);if(error)return {error};for(const p of this.cells(b))this.occupancy.delete(key(p.x,p.y));this.buildings.delete(key(b.x,b.y));b.x=x;b.y=y;this.index(b);return {ok:true};}
 rotate(x,y,delta=1){const b=this.get(x,y);if(!b||['hub','extractor','trash'].includes(b.type))return false;b.dir=side(b.dir,delta);return true;}
 edge(b,d){const points=[],size=sizeOf(b);for(let i=0;i<size;i+=GRID){const x=d===0?b.x+size:d===2?b.x-GRID:b.x+i,y=d===1?b.y+size:d===3?b.y-GRID:b.y+i;points.push({x,y,d,port:`${d}:${i}`});}return points;}
 destinations(b,dirs){return dirs.flatMap(d=>this.edge(b,d));}
 contents(b){return [b.q,...b.lanes,b.a,b.b,b.pending].filter(t=>t!==null);}
 token(value){return {value,born:this.tick};}
 inputSlot(b,from){
 if(b.type==='hub'||b.type==='trash')return 'sink';
 if(b.type==='extractor')return null;
 if(['add','mul','sub','div','mod'].includes(b.type)){
 if(from===side(b.dir,2))return b.a===null?'a':null;
 if(from===side(b.dir,3))return b.b===null?'b':null;
 return null;
 }
 if(b.type==='cross'){
 if(from===side(b.dir,2)&&b.lanes[0]===null)return 'lane0';
 if(from===side(b.dir,3)&&b.lanes[1]===null)return 'lane1';
 return null;
 }
 if(b.q!==null||from===b.dir)return null;
 if(b.type==='splitter'&&from!==side(b.dir,2))return null;
 return 'q';
 }
 autoCross(x,y,direction,incomingId=null){
 const b=this.get(x,y);if(b?.type==='cross')return [b.dir,side(b.dir,1)].includes(direction)?{building:b}:{error:'This crossing runs in the opposite direction.'};
 if(b?.type!=='belt'||b.dir%2===direction%2)return {error:'Only perpendicular belts can cross.'};
 if(!this.isUnlocked('cross'))return {error:'Crossings are locked. Complete more core contracts first.'};
 if(this.incomingSources(b).some(n=>n.id!==incomingId&&!this.destinations(n,this.outputDirections(n)).some(p=>p.x===x&&p.y===y&&p.d===b.dir)))return {error:'Cannot bridge a corner or junction. Cross a straight belt.'};
 const old=b.dir,token=b.q;b.type='cross';b.dir=side(old,1)===direction?old:direction;b.q=null;b.lanes=[null,null];b.lanes[b.dir===old?0:1]=token;return {building:b};
 }
 outputDirections(b){return b.type==='extractor'?[0,1,2,3]:b.type==='splitter'?[b.dir,side(b.dir,1),side(b.dir,3)]:b.type==='cross'?[b.dir,side(b.dir,1)]:['hub','trash'].includes(b.type)?[]:[b.dir];}
 incomingSources(b){
 const result=[];
 for(let d=0;d<4;d++){
 if(d===b.dir)continue;const [dx,dy]=DIRS[d],n=this.get(b.x+dx*GRID,b.y+dy*GRID);if(!n||n===b)continue;
 if(n.type==='extractor'&&b.dir!==side(d,2))continue;
 if(this.destinations(n,this.outputDirections(n)).some(p=>p.x===b.x&&p.y===b.y))result.push(n);
 }
 return result;
 }
 beltRun(x,y){
 const selected=this.get(x,y);if(selected?.type!=='belt')return {error:'Select a conveyor first.'};
 if(this.incomingSources(selected).length>1)return {error:'This tile is a junction. Select a belt farther along one branch.'};
 let start=selected;const seen=new Set([start.id]);
 while(true){const inputs=this.incomingSources(start);if(inputs.length!==1||inputs[0].type!=='belt'||this.incomingSources(inputs[0]).length>1)break;start=inputs[0];if(seen.has(start.id))return {error:'Closed loops cannot be shortened automatically.'};seen.add(start.id);}
 const run=[],forward=new Set();let current=start;
 while(current?.type==='belt'){
 if(forward.has(current.id))return {error:'Closed loops cannot be shortened automatically.'};forward.add(current.id);run.push(current);
 const [dx,dy]=DIRS[current.dir],next=this.get(current.x+dx*GRID,current.y+dy*GRID);
 if(next?.type!=='belt'||this.incomingSources(next).length!==1||next.dir===side(current.dir,2))break;current=next;
 }
 return {run};
 }
 planShorterRoute(x,y){
 const traced=this.beltRun(x,y);if(traced.error)return traced;const original=traced.run;
 if(original.length<3)return {error:'This run is already as short as possible.'};
 const start=original[0],end=original.at(-1),allowed=new Set(original.map(b=>key(b.x,b.y))),goal=key(end.x,end.y),parents=new Map(),cost=new Map([[key(start.x,start.y),0]]);
 // A* on the fine grid: exact shortest length, with ties biased toward the goal.
 const heap=[];let serial=0;const less=(a,b)=>a.f!==b.f?a.f<b.f:a.h!==b.h?a.h<b.h:a.order<b.order;
 const push=n=>{heap.push(n);let i=heap.length-1;while(i){const p=(i-1)>>1;if(!less(heap[i],heap[p]))break;[heap[i],heap[p]]=[heap[p],heap[i]];i=p;}};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;while(true){let child=i*2+1;if(child>=heap.length)break;if(child+1<heap.length&&less(heap[child+1],heap[child]))child++;if(!less(heap[child],heap[i]))break;[heap[i],heap[child]]=[heap[child],heap[i]];i=child;}}return top;};
 const heuristic=(x,y)=>(Math.abs(end.x-x)+Math.abs(end.y-y))/GRID;
 push({x:start.x,y:start.y,g:0,h:heuristic(start.x,start.y),f:heuristic(start.x,start.y),order:serial++});let visits=0,found=false;
 while(heap.length){
 const n=pop(),nk=key(n.x,n.y);if(n.g!==cost.get(nk))continue;
 if(nk===goal){found=true;break;}
 if(++visits>150000)return {error:'This route is too large to optimize in one step. Try a shorter run.'};
 const dirs=n.g===0?[start.dir]:[0,1,2,3];
 for(const d of dirs){const [dx,dy]=DIRS[d],px=n.x+dx*GRID,py=n.y+dy*GRID,k=key(px,py),g=n.g+1;
 if(px<-this.extent||py<-this.extent||px>this.extent+1-GRID||py>this.extent+1-GRID||g>=original.length)continue;
 if(k===goal&&side(d,2)===end.dir)continue;
 if(this.get(px,py)&&!allowed.has(k))continue;
 // Do not introduce accidental joins with unrelated routes beside the new run.
 if(k!==key(start.x,start.y)&&k!==goal){const probe={type:'belt',x:px,y:py,dir:d};if(this.incomingSources(probe).some(b=>!allowed.has(key(b.x,b.y))))continue;}
 if(g>=(cost.get(k)??Infinity))continue;
 cost.set(k,g);parents.set(k,{x:n.x,y:n.y});const h=heuristic(px,py);push({x:px,y:py,g,h,f:g+h,order:serial++});
 }
 }
 if(!found)return {error:'No shorter clear route preserves these connections.'};
 const path=[{x:end.x,y:end.y,dir:end.dir}];let cursor=goal;
 while(parents.has(cursor)){const p=parents.get(cursor),next=path.at(-1),dir=DIRS.findIndex(([dx,dy])=>p.x+dx*GRID===next.x&&p.y+dy*GRID===next.y);path.push({...p,dir});cursor=key(p.x,p.y);}path.reverse();
 if(path.length>=original.length)return {error:'This run is already a shortest route.'};
 if(original.filter(b=>b.q).length>path.length)return {error:'The shorter route cannot hold all its numbers yet. Let this run drain, then try again.'};
 return {original,path};
 }
 replaceBeltRun(original,path){
 const tokens=original.filter(b=>b.q).map(b=>({...b.q}));
 // Move inventory transactionally; this is relocation, not item deletion.
 for(const b of original){this.buildings.delete(key(b.x,b.y));for(const p of this.cells(b))this.occupancy.delete(key(p.x,p.y));}
 const placed=path.map(p=>this.put('belt',p.x,p.y,p.dir,true));
 for(let i=0;i<tokens.length;i++){const index=placed.length-tokens.length+i,b=placed[index],previous=placed[index-1];b.q={...tokens[i],born:this.tick,from:previous?side(previous.dir,2):side(b.dir,2)};}
 return placed;
 }
 optimizeRoute(x,y){
 const plan=this.planShorterRoute(x,y);if(plan.error)return plan;
 const before=plan.original.map(b=>({x:b.x,y:b.y,dir:b.dir})),placed=this.replaceBeltRun(plan.original,plan.path);
 return {removed:before.length-placed.length,start:{x:placed[0].x,y:placed[0].y},undo:{before,after:placed.map(b=>({x:b.x,y:b.y,id:b.id}))}};
 }
 undoRoute(action){
 const current=action.after.map(p=>this.get(p.x,p.y));if(current.some((b,i)=>!b||b.type!=='belt'||b.id!==action.after[i].id))return false;
 const allowed=new Set(current.map(b=>b.id));if(action.before.some(p=>this.get(p.x,p.y)&&!allowed.has(this.get(p.x,p.y).id)))return false;
 this.replaceBeltRun(current,action.before);return true;
 }
 outputOffers(b){
 if(b.type==='cross')return b.lanes.flatMap((t,i)=>t&&this.tick-t.born>=travelTicks(b)?[{b,slot:`lane${i}`,t,dirs:[side(b.dir,i)]}]:[]);
 if(!b.q||this.tick-b.q.born<travelTicks(b))return [];
 const dirs=b.type==='extractor'?[0,1,2,3]:b.type==='splitter'?[b.dir,side(b.dir,1),side(b.dir,3)]:[b.dir];
 if(b.type==='splitter'){const n=b.rr%3;dirs.push(...dirs.splice(0,n));}
 return [{b,slot:'q',t:b.q,dirs}];
 }
 step(){
 this.tick++;
 // Only contracts active at the start of this tick can receive its deliveries.
 const active=this.activeContracts;
 // Reserve destinations against the pre-transfer state, then commit simultaneously.
 const offers=[];for(const b of this.buildings.values())offers.push(...this.outputOffers(b));
 const pending=[],reserved=new Set(),moves=[];
 for(const o of offers){
 const options=[];
 for(const {x,y,d} of this.destinations(o.b,o.dirs)){const dest=this.get(x,y);if(!dest)continue;if(o.b.type==='extractor'&&(dest.type!=='belt'||dest.dir!==d))continue;const slot=this.inputSlot(dest,side(d,2));if(slot)options.push({dest,targetSlot:slot,d,reservation:`${dest.id}:${slot}`});}
 if(options.length)pending.push({...o,options,done:false});
 }
 // Each receiver advances its own input cursor. Unrelated factory activity
 // cannot starve a merger. Losing splitter offers can try another exit.
 for(let round=0;round<16;round++){
 const groups=new Map();
 for(const o of pending){if(o.done)continue;const option=o.options.find(p=>p.targetSlot==='sink'||!reserved.has(p.reservation));if(!option)continue;const proposal={...o,...option,offer:o};const group=groups.get(option.reservation);if(group)group.push(proposal);else groups.set(option.reservation,[proposal]);}
 if(!groups.size)break;
 for(const group of groups.values()){
 let winners=group;
 if(group[0].targetSlot!=='sink'){
 group.sort((a,b)=>a.b.id-b.b.id);
 const cursor=group[0].dest.inputCursor;
 winners=[group.find(p=>p.b.id>cursor)||group[0]];
 reserved.add(winners[0].reservation);
 }
 for(const winner of winners){winner.offer.done=true;moves.push(winner);}
 }
 }
 for(const m of moves){
 const {b,slot,t,dest,targetSlot,d}=m;
 if(slot==='q')b.q=null;else b.lanes[Number(slot.slice(-1))]=null;
 b.sent++;if(b.type==='splitter')b.rr=([b.dir,side(b.dir,1),side(b.dir,3)].indexOf(d)+1)%3;
 dest.received++;dest.inputCursor=b.id;
 const nt={value:t.value,born:this.tick,from:side(d,2)};
 if(targetSlot==='sink'){
 if(dest.type==='hub'){
 this.delivered++;this.hubTotals[t.value]=(this.hubTotals[t.value]??0)+1;this.history.push({tick:this.tick,value:t.value});
 this.creditContract(t.value,active);
 }else this.discarded++;
 }else if(targetSlot.startsWith('lane'))dest.lanes[Number(targetSlot.slice(-1))]=nt;
 else dest[targetSlot]=nt;
 }
 for(const b of this.buildings.values()){
 if(b.type==='extractor'){
 // Each outward belt is an independent source outlet. A blocked outlet
 // does not throttle any of the others, and no items spawn inside the patch.
 for(const p of this.destinations(b,[0,1,2,3])){
 const dest=this.get(p.x,p.y);
 if(dest?.type!=='belt'||dest.dir!==p.d||dest.q||(b.outputs[p.port]??0)>this.tick)continue;
 dest.q={value:b.sourceValue,born:this.tick,from:side(p.d,2)};
 dest.received++;b.sent++;this.generated++;b.outputs[p.port]=this.tick+this.extractorInterval;
 }
 }else if(['add','mul','sub','div','mod'].includes(b.type)){
 b.error=null;
 if(b.pending){if(b.work>0)b.work--;if(b.work===0&&b.q===null){b.q=this.token(b.pending.value);b.pending=null;}}
 if(!b.pending&&b.q===null&&b.a&&b.b){const r=arithmetic(b.type,b.a.value,b.b.value);if(r.error)b.error=r.error;else{b.pending=this.token(r.value);b.a=null;b.b=null;b.work=this.operatorInterval;this.operations++;}}
 }
 }
 this.finishContracts();
 this.history=this.history.filter(h=>h.tick>this.tick-1200);
 }
 status(b){
 if(b.type==='hub')return 'Accepting deliveries';
 if(b.type==='trash')return 'Recycling';
 if(b.error)return b.error;
 if(b.pending)return 'Processing';
 if(b.q||b.lanes.some(Boolean)){const offers=this.outputOffers(b);if(!offers.length)return 'Transporting';return offers.some(o=>this.destinations(b,o.dirs).some(({x,y,d})=>{const dest=this.get(x,y);return dest&&this.inputSlot(dest,side(d,2));}))?'Transporting':'Output blocked';}
 if(b.type==='extractor')return 'Feeding all outward belts';
 if(['add','mul','sub','div','mod'].includes(b.type))return !b.a&&!b.b?'Waiting for A and B':!b.a?'Waiting for input A':'Waiting for input B';
 return 'Waiting for numbers';
 }
 serialize(){this.objective;this.syncContracts();return {version:5,progression:{xp:this.xp,xpEarned:this.xpEarned,numbers:[...this.unlockedNumbers],operations:[...this.unlockedOperations],upgrades:{...this.upgrades},targetSequence:this.targetSequence},hubTotals:{...this.hubTotals},contracts:{projectsCompleted:this.projectsCompleted,nextProjectIndex:this.nextProjectIndex,projects:this.projectContracts.map(c=>({index:c.index,progress:c.progress,value:c.value,random:!!c.random})),coreOverride:this.coreOverride},seed:this.seed,mode:this.mode,tick:this.tick,level:this.level,progress:this.progress,delivered:this.delivered,generated:this.generated,discarded:this.discarded,operations:this.operations,nextId:this.nextId,extent:this.extent,buildings:[...this.buildings.values()],history:this.history};}
 static restore(data){
 if(!data||![1,2,3,4,5].includes(data.version)||!Array.isArray(data.buildings)||data.buildings.length>100000)throw Error('Unsupported or invalid save');
 const integer=(v,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
 for(const k of ['seed','tick','level','progress','delivered','generated','discarded','operations','nextId','extent'])if(!integer(data[k],k==='extent'?16:0,k==='extent'?512:Number.MAX_SAFE_INTEGER))throw Error(`Invalid ${k}`);
 if(data.seed>4294967295)throw Error('Invalid seed');
 if(!['standard','sandbox','challenge','kids'].includes(data.mode))throw Error('Invalid game mode');
 const legacy=data.version===1,fineGrid=data.version>=4,coordinateScale=legacy?1:fineGrid?4:2;
 const w=new World(data.seed,data.mode);w.buildings.clear();w.occupancy.clear();const ids=new Set();let hubs=0;
 const validToken=t=>t===null||(t&&integer(t.value,0,MAX_VALUE)&&integer(t.born,0,data.tick)&&(t.from===undefined||integer(t.from,0,3)));
 for(const b of data.buildings){
 if(!b||!Object.hasOwn(TYPES,b.type)||!integer(b.x*coordinateScale,-data.extent*coordinateScale,(data.extent+1-GRID)*coordinateScale)||!integer(b.y*coordinateScale,-data.extent*coordinateScale,(data.extent+1-GRID)*coordinateScale)||!integer(b.dir,0,3)||!integer(b.id,1)||ids.has(b.id)||w.get(b.x,b.y))throw Error('Invalid building');
 if(!Array.isArray(b.lanes)||b.lanes.length!==2||![b.q,...b.lanes,b.a,b.b,b.pending].every(validToken))throw Error('Invalid item');
 for(const k of ['work','cooldown','rr','received','sent'])if(!integer(b[k]))throw Error('Invalid machine state');
 if(b.type==='hub'){hubs++;if(b.x!==0||b.y!==0)throw Error('Invalid hub');}
 const source=b.type==='extractor'?w.depositAt(b.x,b.y,!fineGrid||b.size>SOURCE_SIZE):null;
 if(b.type==='extractor'&&!source)throw Error('Invalid extractor');
 const restored=JSON.parse(JSON.stringify(b));
 restored.sourceValue??=source?.value??null;
 if(restored.sourceValue!==(source?.value??null))throw Error('Invalid source value');
 restored.size=legacy?(b.type==='extractor'?1:TRANSPORT.has(b.type)?.5:1):b.size;
 if(restored.size!==(TRANSPORT.has(b.type)&&!fineGrid?.5:sizeOf(b.type))&&!(b.type==='extractor'&&[1,2].includes(restored.size)))throw Error('Invalid footprint');
 if(b.type==='hub'){
 restored.hubTiles=fineGrid?b.hubTiles:HUB_TILES.slice(0,16).map(p=>[...p]);
 const allowed=new Set([...HUB_TILES.slice(0,16),...Array.from({length:4},(_,i)=>[-1,i]),...Array.from({length:4},(_,i)=>[4,i]),...Array.from({length:4},(_,i)=>[i,-1]),...Array.from({length:4},(_,i)=>[i,4])].map(p=>key(...p)));
 if(!Array.isArray(restored.hubTiles)||restored.hubTiles.length!==(data.version===4&&b.legacyFootprint!==true?19:16)||restored.hubTiles.some(p=>!Array.isArray(p)||p.length!==2||!allowed.has(key(...p)))||new Set(restored.hubTiles.map(p=>key(...p))).size!==restored.hubTiles.length||HUB_TILES.slice(0,16).some(p=>!restored.hubTiles.some(q=>q[0]===p[0]&&q[1]===p[1])))throw Error('Invalid hub footprint');
 }
 if(w.cells(restored).some(p=>w.get(p.x,p.y)||p.x>data.extent+1-GRID||p.y>data.extent+1-GRID))throw Error('Overlapping buildings');
 if(b.type==='extractor'&&restored.size===SOURCE_SIZE){const patch=w.depositAt(b.x,b.y);if(patch.x!==b.x||patch.y!==b.y)throw Error('Invalid extractor footprint');}
 restored.outputs??={};
 if(!restored.outputs||typeof restored.outputs!=='object'||Array.isArray(restored.outputs)||Object.entries(restored.outputs).some(([k,v])=>! /^[0-3]:(0|0\.25|0\.5|0\.75|1|1\.25|1\.5|1\.75)$/.test(k)||!integer(v)))throw Error('Invalid source outlets');
 restored.inputCursor??=0;if(!integer(restored.inputCursor))throw Error('Invalid input cursor');
 if(restored.error!==null&&!['Division by zero','Needs exact division','Negative result','Number too large','Unknown operation'].includes(restored.error))throw Error('Invalid machine error');
 ids.add(b.id);w.index(restored);
 }
 if(hubs!==1||[...ids].some(id=>id>=data.nextId))throw Error('Invalid world');
 for(const k of ['tick','level','progress','delivered','generated','discarded','operations','nextId','extent'])w[k]=data[k];
 if(data.version>=3){
 const c=data.contracts;
 if(!c||!integer(c.projectsCompleted)||!integer(c.nextProjectIndex)||!Array.isArray(c.projects)||c.projects.length>2||c.nextProjectIndex<c.projectsCompleted+c.projects.length)throw Error('Invalid contracts');
 w.projectsCompleted=c.projectsCompleted;w.nextProjectIndex=c.nextProjectIndex;
 if(c.projects.length!==w.contractCapacity-1)throw Error('Invalid contract slots');
 const seen=new Set();
 w.projectContracts=c.projects.map(p=>{if(!p||!integer(p.index,0,c.nextProjectIndex-1)||seen.has(p.index))throw Error('Invalid project contract');seen.add(p.index);const def=projectDefinition(p.index);if(data.version>=5){if(!integer(p.value,1,MAX_VALUE)||typeof p.random!=='boolean'||(p.random&&p.value>10000))throw Error('Invalid project target');def.value=p.value;def.random=p.random;if(p.random)def.hint='Build this number with your unlocked sources and operations.';}if(!integer(p.progress,0,def.count-1))throw Error('Invalid contract progress');return {...def,progress:p.progress};});
 if(c.coreOverride!==null){if(!c.coreOverride||!integer(c.coreOverride.value,1,MAX_VALUE)||!integer(c.coreOverride.count,1,Number.MAX_SAFE_INTEGER))throw Error('Invalid migrated contract');w.coreOverride={value:c.coreOverride.value,count:c.coreOverride.count,random:!!c.coreOverride.random};}
 if(data.version<5&&!w.coreOverride){const old=OBJECTIVES[w.level];w.coreOverride={value:w.level===0?2:w.level===1?5:old?.value??ENDLESS_TARGETS[Math.min(w.level-12,ENDLESS_TARGETS.length-1)],count:w.level===0?12:w.level===1?15:old?.count??Math.min(2500,70+(w.level-12)*20),random:false};}
 if(!integer(w.progress,0,w.objective.count-1)||w.projectContracts.some(p=>p.value===w.objective.value)||new Set(w.projectContracts.map(p=>p.value)).size!==w.projectContracts.length)throw Error('Invalid active contracts');
 }else{
 // Preserve the current target and partial deliveries when upgrading a serial campaign.
 if(w.level>=2&&w.level<12)w.coreOverride={value:OBJECTIVES[w.level].value,count:OBJECTIVES[w.level].count,random:false};
 if(w.level<2)w.coreOverride={value:w.level===0?2:5,count:w.level===0?12:15,random:false};
 if(w.level>=12){const value=144+(w.level-11)*36,count=50+(w.level-11)*10;if(!integer(value,1,MAX_VALUE)||!integer(count,1))throw Error('Invalid legacy contract');w.coreOverride={value,count,random:false};}
 if(w.progress>=w.objective.count)throw Error('Invalid legacy contract progress');
 w.syncContracts();w.contractsMigrated=true;
 }
 if(legacy){
 // Preserve old footprints for extractors and bridge each old adjacency
 // with a half-size conveyor. Existing inventory and progress remain intact.
 const oldBuildings=[...w.buildings.values()];
 const oldMap=new Map(oldBuildings.map(b=>[key(b.x,b.y),b]));
 for(const b of oldBuildings){
 const dirs=b.type==='splitter'?[b.dir,side(b.dir,1),side(b.dir,3)]:b.type==='cross'?[b.dir,side(b.dir,1)]:['hub','trash'].includes(b.type)?[]:[b.dir];
 for(const d of dirs){const [dx,dy]=DIRS[d];if(!oldMap.has(key(b.x+dx,b.y+dy)))continue;const x=b.x+dx*.5,y=b.y+dy*.5;if(!w.get(x,y))w.put('belt',x,y,d,true,.5);}
 }
 if(w.buildings.size>100000)throw Error('Legacy factory exceeds the upgraded building limit');
 w.migrated=true;
 }
 if(!fineGrid){
 const refined=refineLayout([...w.buildings.values()]);w.buildings.clear();w.occupancy.clear();
 for(const b of refined){if(b.id)w.index(b);else w.put(b.type,b.x,b.y,b.dir,true,b.size);}
 if(w.buildings.size>100000)throw Error('Upgraded factory exceeds the building limit');w.fineGridMigrated=true;
 }
 if(data.version===4){
 const hub=w.get(0,0),removed=hub.hubTiles.filter(([x,y])=>x<0||x>3||y<0||y>3);for(const [x,y] of removed)w.occupancy.delete(key(x*GRID,y*GRID));hub.hubTiles=HUB_TILES.map(p=>[...p]);delete hub.legacyFootprint;
 for(const [x,y] of removed){const px=x*GRID,py=y*GRID,d=x<0?0:x>3?2:y<0?1:3,probe={type:'belt',x:px,y:py,dir:d};if(w.incomingSources(probe).length)w.put('belt',px,py,d,true);}
 }
 if(data.version>=5){
 const p=data.progression;
 if(!p||!integer(p.xp)||!integer(p.xpEarned,p.xp)||!integer(p.targetSequence)||!Array.isArray(p.numbers)||!p.numbers.includes(2)||p.numbers.some(n=>!integer(n,1,9))||new Set(p.numbers).size!==p.numbers.length||!Array.isArray(p.operations)||!p.operations.includes('add')||p.operations.some(n=>!OPERATIONS.includes(n))||new Set(p.operations).size!==p.operations.length||!p.upgrades||!integer(p.upgrades.extractor,1,5)||!integer(p.upgrades.operator,1,5))throw Error('Invalid progression');
 w.xp=p.xp;w.xpEarned=p.xpEarned;w.targetSequence=p.targetSequence;w.unlockedNumbers=[...p.numbers];w.unlockedOperations=[...p.operations];w.upgrades={...p.upgrades};
 if(!data.hubTotals||typeof data.hubTotals!=='object'||Array.isArray(data.hubTotals)||Object.keys(data.hubTotals).length>50000||Object.entries(data.hubTotals).some(([value,count])=>!/^\d+$/.test(value)||!integer(Number(value),0,MAX_VALUE)||!integer(count,1))||Object.values(data.hubTotals).reduce((a,b)=>a+b,0)>w.delivered)throw Error('Invalid delivery histogram');w.hubTotals={...data.hubTotals};
 }else{
 w.unlockedNumbers=[1,2,3,4,5,6,7,8,9];w.unlockedOperations=OPERATIONS.filter(type=>type==='add'||TYPES[type].unlock<=w.unlocked||[...w.buildings.values()].some(b=>b.type===type));w.xp=w.xpEarned=w.completedContracts*60;w.progressionMigrated=true;
 }
 w.history=Array.isArray(data.history)?data.history.filter(h=>h&&integer(h.tick,Math.max(0,w.tick-1200),w.tick)&&integer(h.value,0,MAX_VALUE)).slice(-100000):[];
 if(data.version<5)for(const h of w.history)w.hubTotals[h.value]=(w.hubTotals[h.value]??0)+1;
 return w;
 }
}
const api={KIDS_LESSONS,OPERATIONS,NUMBER_COSTS,OPERATION_COSTS,EXTRACTOR_TICKS,OPERATOR_TICKS,UPGRADE_COSTS,GRID,SOURCE_SIZE,HUB_TILES,TRANSPORT,travelTicks,refineLayout,World,TYPES,OBJECTIVES,DIRS,MAX_VALUE,arithmetic,key,side,sizeOf,projectDefinition,PROJECT_TARGETS,ENDLESS_TARGETS};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.Numberworks=api;
})(typeof globalThis!=='undefined'?globalThis:this);
