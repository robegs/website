/* Browser presentation and editor for Numberworks. */
(() => {
'use strict';
const {OPERATIONS,NUMBER_COSTS,OPERATION_COSTS,EXTRACTOR_TICKS,OPERATOR_TICKS,UPGRADE_COSTS,GRID,SOURCE_SIZE,TRANSPORT,travelTicks,refineLayout,World,TYPES,OBJECTIVES,DIRS,key,side,sizeOf}=Numberworks;
const $=id=>document.getElementById(id),canvas=$('world'),ctx=canvas.getContext('2d');
const SAVE_KEY='numberworks.save.v1',BLUEPRINT_KEY='numberworks.blueprints.v1';
const tileSize=48;
let world=new World(),camera={x:-1,y:0,zoom:1},tool='belt',direction=0,paused=false,speed=1,sound=false,overlay=false;
let width=innerWidth,height=innerHeight,dpr=1,hover=null,inspected=null,pointer=null,selection=null,clipboard=null,undo=[],stroke=null;
let frameTime=performance.now(),accumulator=0,uiTime=0,saveTime=0,toastTimer,audioCtx,library=[],storageAvailable=true;
const touchDevice=matchMedia('(pointer:coarse)').matches;let lastRender=0;
let histogramWorld=null,histogramTotal=-1;let showGrid=false;let challengeDone=false;let contractSignature='';
const colors={belt:'#8ba6bb',extractor:'#e8bf61',add:'#73d99b',mul:'#b295f4',sub:'#f39a64',div:'#69cfec',mod:'#e48fc8',splitter:'#f0d46b',merger:'#62c7b6',cross:'#87a7f3',trash:'#db8582',hub:'#d7ed91'};
function readStorage(k){try{return localStorage.getItem(k);}catch{storageAvailable=false;return null;}}
function writeStorage(k,v){try{localStorage.setItem(k,v);return true;}catch{storageAvailable=false;return false;}}
function toast(message){
 $('toast').textContent=message;$('toast').classList.add('visible');
 document.querySelectorAll('.dialog-notice').forEach(n=>n.remove());
 const dialogs=[...document.querySelectorAll('dialog[open]')],active=dialogs.at(-1);
 if(active){const notice=document.createElement('p');notice.className='dialog-notice';notice.setAttribute('role','status');notice.textContent=message;active.append(notice);notice.scrollIntoView({block:'nearest'});}
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('toast').classList.remove('visible');document.querySelectorAll('.dialog-notice').forEach(n=>n.remove());},3800);
}
function beep(f=440){if(!sound)return;try{audioCtx ||= new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.12);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.12);}catch{sound=false;}}
function modalOpen(){return !!document.querySelector('dialog[open]');}
function openDialog(id){releasePointer();$(id).showModal();}
function releasePointer(){if(pointer&&canvas.hasPointerCapture(pointer.id))canvas.releasePointerCapture(pointer.id);pointer=null;endStroke();}
function closeDialogs(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
function save(notify=true){const data={world:world.serialize(),camera};const ok=writeStorage(SAVE_KEY,JSON.stringify(data));if(notify)toast(ok?'Factory saved. Every number accounted for.':'Browser storage unavailable. Use World → Export save.');$('save').textContent=ok?'Saved ✓':'Export save';setTimeout(()=>$('save').textContent='Save',1600);return ok;}
function validCamera(c){return c&&Number.isFinite(c.x)&&Number.isFinite(c.y)&&Number.isFinite(c.zoom)&&Math.abs(c.x)<=512&&Math.abs(c.y)<=512&&c.zoom>=.3&&c.zoom<=2.5;}
function loadData(data){const next=World.restore(data.world||data);if(next.progressionMigrated&&!readStorage('numberworks.save.before-progression-v5'))writeStorage('numberworks.save.before-progression-v5',JSON.stringify(data));if(next.fineGridMigrated&&!readStorage('numberworks.save.before-fine-grid-v4'))writeStorage('numberworks.save.before-fine-grid-v4',JSON.stringify(data));if(next.contractsMigrated&&!readStorage('numberworks.save.before-contracts-v3'))writeStorage('numberworks.save.before-contracts-v3',JSON.stringify(data));if(next.migrated&&!readStorage('numberworks.save.before-grid-v2'))writeStorage('numberworks.save.before-grid-v2',JSON.stringify(data));world=next;camera=validCamera(data.camera)?{...data.camera}:{x:-1,y:0,zoom:1};undo=[];clipboard=null;inspected=null;hover=null;paused=false;accumulator=0;challengeDone=false;setTool('belt');updateUI();}
let loaded=false;
const raw=readStorage(SAVE_KEY);
if(raw){try{loadData(JSON.parse(raw));loaded=true;}catch{setTimeout(()=>toast('Could not read the saved factory. Start a new world or import a backup.'),500);}}
try{const stored=JSON.parse(readStorage(BLUEPRINT_KEY)||'[]');library=Array.isArray(stored)?stored.filter(validBlueprint).map(upgradeBlueprint).slice(0,30):[];}catch{library=[];}
function validBlueprint(p){return p&&typeof p.name==='string'&&p.name.length<=80&&Array.isArray(p.cells)&&p.cells.length>0&&p.cells.length<=10000&&p.cells.every(b=>b&&Object.hasOwn(TYPES,b.type)&&b.type!=='hub'&&Number.isInteger(b.x/GRID)&&Number.isInteger(b.y/GRID)&&Math.abs(b.x)<=1024&&Math.abs(b.y)<=1024&&Number.isInteger(b.dir)&&b.dir>=0&&b.dir<4&&(b.size===undefined||b.size===sizeOf(b.type)||(b.type==='extractor'&&[1,2].includes(b.size))||((p.version??1)<3&&TRANSPORT.has(b.type)&&b.size===.5)))&&new Set(p.cells.map(b=>key(b.x,b.y))).size===p.cells.length;}
function upgradeBlueprint(p){
 if(p.version===3)return p;
 let cells=p.cells.map(b=>({...b,size:b.size??1}));
 if(p.version!==2)cells=refineLayout(cells,1,.5);
 cells=refineLayout(cells,.5,GRID);
 return {name:p.name,version:3,cells};
}
function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,matchMedia('(pointer:coarse)').matches?1.5:2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}
addEventListener('resize',resize);resize();
function worldPoint(px,py){const s=tileSize*camera.zoom;return {x:(px-width/2)/s+camera.x,y:(py-height/2+20)/s+camera.y};}
function cellPoint(px,py){const p=worldPoint(px,py);return {x:Math.floor(p.x/GRID+.5)*GRID,y:Math.floor(p.y/GRID+.5)*GRID};}
function screenPoint(x,y){const s=tileSize*camera.zoom;return {x:width/2+(x-camera.x)*s,y:height/2-20+(y-camera.y)*s};}
function zoomAt(z,px=width/2,py=height/2){const before=worldPoint(px,py);camera.zoom=Math.max(.3,Math.min(2.5,z));const after=worldPoint(px,py);camera.x+=before.x-after.x;camera.y+=before.y-after.y;}
function setTool(t){tool=t;selection=null;$('selection-options').hidden=true;if(t!=='select'){inspected=null;updateInspector();}renderToolbar();for(const name of ['pan','select','copy','paste']){const active=t===(name==='copy'?'area':name);$('touch-'+name).classList.toggle('active',active);$('touch-'+name).setAttribute('aria-pressed',String(active));}const name=TYPES[t]?.name||({erase:'Erase',select:'Inspect',copy:'Copy blueprint',paste:'Paste blueprint',pan:'Pan camera',area:'Select area'}[t]);$('tool-name').textContent=name;$('tool-description').textContent=t==='belt'?'Fine routing · four lanes per machine width':t==='copy'?'Drag a rectangle to copy buildings':t==='paste'?'Click to stamp · R to rotate':t==='erase'?'Drag to remove buildings':t==='select'?'Select a building · R to rotate it':TYPES[t]?.description||'';canvas.style.cursor=t==='select'?'default':t==='erase'?'not-allowed':'crosshair';updateRotation();}
function updateRotation(){const b=inspected&&world.get(inspected.x,inspected.y),d=tool==='select'&&b?b.dir:direction;$('rotation-label').innerHTML=`${['→ EAST','↓ SOUTH','← WEST','↑ NORTH'][d]} <kbd>R</kbd> ${tool==='select'&&b?'ROTATE SELECTED':'ROTATE'}`;}
function renderToolbar(){const bar=$('toolbar');bar.replaceChildren();for(const [type,def] of Object.entries(TYPES)){if(type==='hub'||(world.mode==='kids'&&['cross','merger','mod'].includes(type)))continue;const b=document.createElement('button'),locked=!world.isUnlocked(type);b.className=(type===tool?'active ':'')+(locked?'locked':'');b.style.setProperty('--component-color',colors[type]);b.title=locked?OPERATIONS.includes(type)?`${def.name} · unlock in the workshop`:`${def.name} · complete ${def.unlock} core contracts`:def.description;b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',String(type===tool));b.innerHTML=`<span class="shortcut">${locked?'◆':def.key}</span><span class="tool-icon">${type==='splitter'?'<svg width="25" height="25" viewBox="0 0 25 25" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 12h18m-5-4 5 4-5 4M10 12V3m-4 4 4-4 4 4m-4 5v9m-4-4 4 4 4-4"/></svg>':def.icon}</span><span class="tool-label">${def.name}</span>`;b.onclick=()=>{if(locked)toast(OPERATIONS.includes(type)?`${def.name} is available in the workshop.`:`${def.name} unlocks after ${def.unlock} core contracts.`);else setTool(type);};bar.append(b);}const b=document.createElement('button');b.className=tool==='erase'?'active':'';b.title='Erase (X). Contained numbers are discarded.';b.innerHTML='<span class="shortcut">X</span><span class="tool-icon">×</span><span class="tool-label">Erase</span>';b.onclick=()=>setTool('erase');bar.append(b);}
function beginStroke(){if(!stroke)stroke=new Map();}
function remember(x,y){beginStroke();const b=world.get(x,y);if(b){x=b.x;y=b.y;}const k=key(x,y);if(!stroke.has(k))stroke.set(k,{x,y,before:b&&b.type!=='hub'?{type:b.type,dir:b.dir,size:sizeOf(b)}:null});}
function endStroke(){if(stroke?.size){undo.push([...stroke.values()]);if(undo.length>100)undo.shift();}stroke=null;}
function undoEdit(){endStroke();const edits=undo.pop();if(!edits)return toast('No construction to undo.');
 if(edits[0].move){const m=edits[0].move,b=world.get(m.to.x,m.to.y),result=b?.id===m.id?world.move(b,m.from.x,m.from.y):{error:'This operator has changed.'};if(result.error)return toast(result.error);inspected=m.from;updateInspector();return toast('Operator moved back. Contents preserved.');}
 if(edits[0].optimizedRoute){const ok=world.undoRoute(edits[0].optimizedRoute);updateInspector();return toast(ok?'Original route restored. Numbers preserved.':'This route has changed and cannot be restored.');}
 if(edits[0].rotation){const r=edits[0].rotation,b=world.get(r.x,r.y);if(b?.id===r.id)b.dir=r.dir;updateInspector();updateRotation();return toast('Rotation undone.');}
 for(const e of edits)world.remove(e.x,e.y);
 for(const e of edits)if(e.before)world.put(e.before.type,e.x,e.y,e.before.dir,true,e.before.size);
 toast('Construction restored. Contained numbers are not restored.');}
function build(x,y,quiet=false){
 if(tool==='erase'){const b=world.get(x,y);if(b&&b.type!=='hub'){remember(x,y);world.remove(x,y);}return;}
 if(!TYPES[tool])return;
 if(tool==='belt'&&(world.get(x,y)?.type==='extractor'||(pointer?.beltOrigin&&world.get(x,y)===pointer.beltOrigin)))return;
 ({x,y}=world.placement(tool,x,y));
 const reason=world.canPlace(tool,x,y,direction);if(reason){if(!quiet)toast(reason);return;}
 remember(x,y);world.put(tool,x,y,direction);if(!quiet)beep(280);
}
function lineCells(a,b){const result=[];let x=a.x,y=a.y;const dx=Math.abs(b.x-x)/GRID,dy=Math.abs(b.y-y)/GRID,sx=Math.sign(b.x-x),sy=Math.sign(b.y-y);let ix=0,iy=0;while(ix<dx||iy<dy){if(ix<dx&&(iy===dy||(ix+.5)/Math.max(1,dx)<(iy+.5)/Math.max(1,dy))){x+=sx*GRID;ix++;}else{y+=sy*GRID;iy++;}result.push({x,y});if(result.length>2048)break;}return result;}
function dragBuild(previous,next){
 if(pointer?.blocked)return;
 for(const p of lineCells(previous,next)){
 if(tool==='belt'){
 const d=DIRS.findIndex(v=>v[0]===(p.x-previous.x)/GRID&&v[1]===(p.y-previous.y)/GRID),prev=world.get(previous.x,previous.y),target=world.get(p.x,p.y);
 if(prev?.type==='cross'&&direction!==d){if(pointer)pointer.blocked=true;toast('Continue straight through the crossing.');return;}
 if(prev?.type==='belt'&&prev.dir!==d&&stroke?.get(key(prev.x,prev.y))?.before!==null){if(pointer)pointer.blocked=true;toast('Start the new route beside the existing belt.');return;}
 direction=d;updateRotation();
 if(target&&target.type!=='extractor'&&target!==pointer?.beltOrigin){
 if(OPERATIONS.includes(target.type)){
 const from=side(d,2),validInput=from===side(target.dir,2)||from===side(target.dir,3);
 if(validInput&&prev?.type==='belt'&&stroke?.get(key(prev.x,prev.y))?.before===null)prev.dir=d;
 if(pointer)pointer.blocked=true;
 if(!validInput)toast('Connect to input A at the rear or input B on the left.');
 return;
 }
 if(target.type==='belt'&&target.dir===d){}else if(target.type==='belt'||target.type==='cross'){
 const before={type:target.type,dir:target.dir,size:sizeOf(target)},result=world.autoCross(p.x,p.y,d,prev?.id);if(result.error){if(pointer)pointer.blocked=true;if(prev?.type==='belt'&&stroke?.get(key(prev.x,prev.y))?.before===null)world.remove(prev.x,prev.y);toast(result.error);return;}beginStroke();if(!stroke.has(key(p.x,p.y)))stroke.set(key(p.x,p.y),{x:p.x,y:p.y,before});
 }else {if(pointer)pointer.blocked=true;return;}
 }
 if(prev?.type==='belt'&&stroke?.get(key(prev.x,prev.y))?.before===null)prev.dir=d;
 if(!target)build(p.x,p.y,true);
 }else build(p.x,p.y,true);
 previous=p;
 }
}
function inspect(x,y){setTool('select');const b=world.get(x,y);inspected=b?{x:b.x,y:b.y}:null;updateInspector();updateRotation();}
function updateInspector(){const b=inspected&&world.get(inspected.x,inspected.y);$('inspector').hidden=!b;if(!b)return;$('inspect-name').textContent=TYPES[b.type].name;$('inspect-name').style.color=colors[b.type];$('rotate-selected').hidden=['hub','extractor','trash'].includes(b.type);$('shorten-route').hidden=b.type!=='belt';const values=world.contents(b).map(t=>t.value.toLocaleString()).join(', ')||'Empty';let html=`<p>${b.x}, ${b.y} · ${b.type==='extractor'?'All sides': ['East','South','West','North'][b.dir]}</p><p class="port-value">${world.status(b)}</p>`;if(['add','sub','mul','div','mod'].includes(b.type))html+=`<p>A: <span class="port-value">${b.a?.value??'—'}</span> &nbsp; B: <span class="port-value">${b.b?.value??'—'}</span></p>`;html+=`<p>Contents: <span class="port-value">${values}</span></p><p>Received ${b.received.toLocaleString()} · Sent ${b.sent.toLocaleString()}</p>`;html+=`<p>${b.type==='extractor'&&sizeOf(b)>SOURCE_SIZE?'Legacy extractor: rebuild after clearing this number patch to enable whole-patch output.':TYPES[b.type].description}</p>`;$('inspect-body').innerHTML=html;$('clear-machine').hidden=['hub','trash'].includes(b.type);if(OPERATIONS.includes(b.type))$('inspect-body').insertAdjacentHTML('beforeend','<p>Drag this operator to reuse it elsewhere. Stored numbers move with it.</p>');}
function rotate(reverse=false){if(tool==='paste'&&clipboard){const n=reverse?3:1;for(let i=0;i<n;i++){clipboard.cells=clipboard.cells.map(b=>({...b,x:-b.y-sizeOf(b)+GRID,y:b.x,dir:side(b.dir,1)}));}const minX=Math.min(...clipboard.cells.map(b=>b.x)),minY=Math.min(...clipboard.cells.map(b=>b.y));clipboard.cells.forEach(b=>{b.x-=minX;b.y-=minY;});}else if(tool==='select'&&inspected){
 const b=world.get(inspected.x,inspected.y);if(!b)return;
 const old=b.dir;if(!world.rotate(b.x,b.y,reverse?-1:1))return toast(b.type==='extractor'?'Extractors already feed all sides.':'This building works on every side.');
 endStroke();undo.push([{rotation:{x:b.x,y:b.y,id:b.id,dir:old}}]);updateInspector();beep(350);
 }else direction=side(direction,reverse?-1:1);updateRotation();}
function copySelection(a,b){const minX=Math.min(a.x,b.x),minY=Math.min(a.y,b.y),maxX=Math.max(a.x,b.x),maxY=Math.max(a.y,b.y);const cells=[...world.buildings.values()].filter(c=>c.type!=='hub'&&c.x+sizeOf(c)>minX&&c.x<=maxX&&c.y+sizeOf(c)>minY&&c.y<=maxY).map(c=>({type:c.type,x:c.x-minX,y:c.y-minY,dir:c.dir,size:sizeOf(c)}));if(!cells.length)return toast('No buildings selected. Drag over a production line.');if(cells.length>10000)return toast('Select at most 10,000 buildings per blueprint.');const ox=Math.min(...cells.map(c=>c.x)),oy=Math.min(...cells.map(c=>c.y));cells.forEach(c=>{c.x-=ox;c.y-=oy;});clipboard={name:'Production line',version:3,cells};setTool('paste');toast(`Copied ${cells.length} buildings. Click to paste; R to rotate.`);}
function selectedBuildings(){
 if(!selection)return [];const {a,b}=selection,minX=Math.min(a.x,b.x),minY=Math.min(a.y,b.y),maxX=Math.max(a.x,b.x),maxY=Math.max(a.y,b.y);
 return [...world.buildings.values()].filter(c=>c.type!=='hub'&&c.x+sizeOf(c)>minX&&c.x<=maxX&&c.y+sizeOf(c)>minY&&c.y<=maxY);
}
function showSelectionOptions(){const count=selectedBuildings().length;$('selection-options').hidden=!count;$('selection-count').textContent=`${count} object${count===1?'':'s'} selected`;if(!count){selection=null;toast('No objects selected. Right-drag an area around buildings.');}}
function deleteSelection(){const buildings=selectedBuildings();if(!buildings.length)return;endStroke();for(const b of buildings){remember(b.x,b.y);world.remove(b.x,b.y);}endStroke();selection=null;$('selection-options').hidden=true;toast(`Deleted ${buildings.length} objects. Undo restores their layout.`);}
$('copy-selection').onclick=()=>{if(selection)copySelection(selection.a,selection.b);};
$('delete-selection').onclick=deleteSelection;
$('close-selection').onclick=()=>{selection=null;$('selection-options').hidden=true;};
function blueprintOrigin(x,y){const source=clipboard?.cells.find(b=>b.type==='extractor'&&sizeOf(b)===SOURCE_SIZE);if(source){const p=world.depositAt(x+source.x,y+source.y);if(p)return {x:p.x-source.x,y:p.y-source.y};}return {x,y};}
function pasteAt(x,y){
 if(!clipboard)return;({x,y}=blueprintOrigin(x,y));if(world.buildings.size+clipboard.cells.length>100000)return toast('This blueprint would exceed the factory limit.');
 const planned=[],occupied=new Set();
 for(const b of clipboard.cells){const p=world.placement(b.type,b.x+x,b.y+y,sizeOf(b)),reason=world.canPlace(b.type,p.x,p.y,b.dir,sizeOf(b));if(reason)return toast(`Cannot paste: ${reason.toLowerCase()}.`);
 if(p.x!==b.x+x||p.y!==b.y+y)return toast('Cannot paste: source patches do not match this layout.');
 const cells=world.cells({...b,...p});if(cells.some(c=>occupied.has(key(c.x,c.y))))return toast('Cannot paste: building footprints overlap.');cells.forEach(c=>occupied.add(key(c.x,c.y)));planned.push({...b,...p});}
 for(const b of planned){remember(b.x,b.y);world.put(b.type,b.x,b.y,b.dir,false,sizeOf(b));}endStroke();beep(380);
}
// Pinch in Pan mode keeps the world point under the fingers stationary.
const panTouches=new Map();let pinch=null;
canvas.addEventListener('pointerdown',e=>{
 if(e.pointerType!=='touch'||tool!=='pan'||modalOpen())return;
 panTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(panTouches.size===2){const [a,b]=[...panTouches.values()],x=(a.x+b.x)/2,y=(a.y+b.y)/2;releasePointer();pinch={distance:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),zoom:camera.zoom,anchor:worldPoint(x,y)};e.preventDefault();e.stopImmediatePropagation();}
},true);
canvas.addEventListener('pointermove',e=>{
 if(!panTouches.has(e.pointerId))return;panTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!pinch)return;
 const [a,b]=[...panTouches.values()];if(!b)return;camera.zoom=Math.max(.3,Math.min(2.5,pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance));
 camera.x=pinch.anchor.x-((a.x+b.x)/2-width/2)/(tileSize*camera.zoom);camera.y=pinch.anchor.y-((a.y+b.y)/2-height/2+20)/(tileSize*camera.zoom);e.preventDefault();e.stopImmediatePropagation();
},true);
for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,e=>{panTouches.delete(e.pointerId);if(pinch){pinch=null;releasePointer();e.preventDefault();e.stopImmediatePropagation();}},true);
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{
 if(modalOpen())return;e.preventDefault();hover=cellPoint(e.clientX,e.clientY);
 if(e.button===2){if(pointer)return;if(world.get(hover.x,hover.y)){inspect(hover.x,hover.y);return;}setTool('select');inspected=null;updateInspector();selection={a:{...hover},b:{...hover}};pointer={id:e.pointerId,boxSelect:true};canvas.setPointerCapture(e.pointerId);return;}
 if(pointer)return;
 const pan=e.button===1||e.altKey||tool==='pan';
 pointer={id:e.pointerId,pan,last:{...hover},px:e.clientX,py:e.clientY,start:{...hover}};canvas.setPointerCapture(e.pointerId);
 if(pan){canvas.style.cursor='grabbing';return;}
 if(tool==='area'){selection={a:{...hover},b:{...hover}};pointer.boxSelect=true;return;}
 const movable=world.get(hover.x,hover.y);
 if(tool==='belt'&&movable&&OPERATIONS.includes(movable.type))pointer.beltOrigin=movable;
 if(movable&&OPERATIONS.includes(movable.type)&&!['belt','erase','copy','paste'].includes(tool)){pointer.moving={b:movable,from:{x:movable.x,y:movable.y},offset:{x:hover.x-movable.x,y:hover.y-movable.y},to:{x:movable.x,y:movable.y}};canvas.style.cursor='grabbing';return;}
 if(tool==='select'){inspect(hover.x,hover.y);return;}
 if(tool==='copy'){selection={a:{...hover},b:{...hover}};return;}
 if(tool==='paste'){pasteAt(hover.x,hover.y);return;}
 beginStroke();build(hover.x,hover.y);
});
canvas.addEventListener('pointermove',e=>{
 if(pointer&&e.pointerId!==pointer.id)return;hover=cellPoint(e.clientX,e.clientY);if(!pointer)return;
 if(pointer.boxSelect){selection.b={...hover};return;}
 if(pointer.pan){camera.x-=(e.clientX-pointer.px)/(tileSize*camera.zoom);camera.y-=(e.clientY-pointer.py)/(tileSize*camera.zoom);camera.x=Math.max(-world.extent,Math.min(world.extent,camera.x));camera.y=Math.max(-world.extent,Math.min(world.extent,camera.y));pointer.px=e.clientX;pointer.py=e.clientY;return;}
 if(pointer.moving){pointer.moving.to={x:hover.x-pointer.moving.offset.x,y:hover.y-pointer.moving.offset.y};return;}
 if(tool==='copy'){selection.b={...hover};return;}
 if(tool==='paste'||tool==='select'||tool==='pan')return;
 if(hover.x!==pointer.last.x||hover.y!==pointer.last.y){dragBuild(pointer.last,hover);pointer.last={...hover};}
});
function pointerEnd(e){if(pointer&&e&&e.pointerId!==pointer.id)return;if(pointer?.boxSelect){showSelectionOptions();releasePointer();return;}if(pointer?.moving){const {b,from,to}=pointer.moving;if(from.x!==to.x||from.y!==to.y){const result=world.move(b,to.x,to.y);if(result.error)toast(result.error);else{undo.push([{move:{id:b.id,from,to}}]);toast('Operator moved. Inputs and processing progress preserved.');}}inspect(b.x,b.y);releasePointer();canvas.style.cursor='default';return;}if(pointer&&!pointer.pan&&tool==='copy'&&selection)copySelection(selection.a,selection.b);releasePointer();canvas.style.cursor=tool==='select'?'default':'crosshair';}
canvas.addEventListener('pointerup',pointerEnd);canvas.addEventListener('pointercancel',()=>releasePointer());canvas.addEventListener('lostpointercapture',()=>{pointer=null;endStroke();});canvas.addEventListener('pointerleave',()=>{if(!pointer)hover=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoomAt(camera.zoom*Math.exp(-e.deltaY*.001),e.clientX,e.clientY);},{passive:false});
addEventListener('keydown',e=>{
 if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName))return;
 if(modalOpen())return;
 if(selection&&!$('selection-options').hidden){if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();deleteSelection();return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'){e.preventDefault();copySelection(selection.a,selection.b);return;}}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();save();return;}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undoEdit();return;}
 if(e.ctrlKey||e.metaKey)return;
 const k=e.key.toLowerCase();
 if(k==='r')rotate(e.shiftKey);
 else if(k==='x')setTool('erase');
 else if(k==='escape'){setTool('select');inspected=null;updateInspector();}
 else if(k==='b'){setTool('copy');toast('Drag a rectangle over the buildings to copy.');}
 else if(k==='v'){if(clipboard)setTool('paste');else toast('Copy a production line with B first.');}
 else if(k==='g'){showGrid=!showGrid;$('grid-toggle').classList.toggle('active',showGrid);$('grid-toggle').setAttribute('aria-pressed',String(showGrid));}
 else if(k==='h')camera={x:0,y:0,zoom:camera.zoom};
 else if(k===' '){e.preventDefault();paused=!paused;updateUI();}
 else if(k==='?'||k==='f1'){e.preventDefault();openDialog('guide');}
 else if(k.startsWith('arrow')){e.preventDefault();const d={arrowright:0,arrowdown:1,arrowleft:2,arrowup:3}[k];camera.x=Math.max(-world.extent,Math.min(world.extent,camera.x+DIRS[d][0]*2));camera.y=Math.max(-world.extent,Math.min(world.extent,camera.y+DIRS[d][1]*2));}
 else{const entry=Object.entries(TYPES).find(([,v])=>v.key===k);if(entry){if(world.isUnlocked(entry[0]))setTool(entry[0]);else toast(`${entry[1].name} is still locked.`);}}
});
for(const t of ['pan','select','paste'])$('touch-'+t).onclick=()=>setTool(t);
$('touch-copy').onclick=()=>setTool('area');
$('touch-rotate').onclick=()=>rotate();$('touch-undo').onclick=()=>undoEdit();
for(const name of ['contracts','stats'])$('touch-'+name).onclick=()=>{const open=document.body.classList.toggle('show-'+name);$('touch-'+name).setAttribute('aria-expanded',String(open));if(open){const other=name==='contracts'?'stats':'contracts';document.body.classList.remove('show-'+other);$('touch-'+other).setAttribute('aria-expanded','false');}};
// Activate touch buttons on release, including the first tap after a canvas gesture.
// Suppress the browser's later compatibility click so an action runs only once.
let buttonTouch=null,lastTouchActivation=null;
document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'){const button=e.target.closest('button');buttonTouch=button?{button,id:e.pointerId,x:e.clientX,y:e.clientY}:null;}},true);
document.addEventListener('pointercancel',()=>{buttonTouch=null;},true);
document.addEventListener('pointerup',e=>{
 const tap=buttonTouch;if(!tap||e.pointerId!==tap.id)return;buttonTouch=null;
 if(e.target.closest('button')!==tap.button||tap.button.disabled||Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>10)return;
 lastTouchActivation={button:tap.button,time:performance.now()};e.preventDefault();tap.button.click();
},true);
document.addEventListener('click',e=>{if(e.isTrusted&&e.detail>0&&lastTouchActivation&&performance.now()-lastTouchActivation.time<700){e.preventDefault();e.stopImmediatePropagation();}},true);
$('pause').onclick=()=>{paused=!paused;updateUI();};$('speed').onclick=()=>{speed=speed===1?2:speed===2?4:1;updateUI();};$('save').onclick=()=>save();$('help').onclick=()=>openDialog('guide');$('brand').onclick=e=>{e.preventDefault();camera={x:0,y:0,zoom:1};};
$('menu').onclick=()=>{$('world-summary').textContent=`Seed ${world.seed} · ${world.extent*2+1} × ${world.extent*2+1} tiles · ${world.mode} mode`;$('seed').value=world.seed;openDialog('world-menu');};
$('grid-toggle').onclick=()=>{showGrid=!showGrid;$('grid-toggle').classList.toggle('active',showGrid);$('grid-toggle').setAttribute('aria-pressed',String(showGrid));};
$('zoom-in').onclick=()=>zoomAt(camera.zoom*1.2);$('zoom-out').onclick=()=>zoomAt(camera.zoom/1.2);$('home').onclick=()=>camera={x:0,y:0,zoom:1};$('sound').onclick=()=>{sound=!sound;$('sound').classList.toggle('active',sound);$('sound').setAttribute('aria-pressed',String(sound));toast(sound?'Sound on':'Sound off');beep();};$('overlay').onclick=()=>{overlay=!overlay;$('overlay').classList.toggle('active',overlay);$('overlay').textContent=overlay?'Hide machine states':'Show machine states';$('state-legend').hidden=!overlay;};
$('shorten-route').onclick=()=>{if(!inspected)return;endStroke();const result=world.optimizeRoute(inspected.x,inspected.y);if(result.error)return toast(result.error);undo.push([{optimizedRoute:result.undo}]);inspected=result.start;updateInspector();toast(`Route shortened by ${result.removed} belt${result.removed===1?'':'s'}. Numbers and connections preserved.`);};
$('rotate-selected').onclick=()=>rotate();$('close-inspector').onclick=()=>{inspected=null;updateInspector();updateRotation();};$('clear-machine').onclick=()=>{const b=inspected&&world.get(inspected.x,inspected.y);if(!b||b.type==='hub')return;world.discarded+=world.contents(b).length;b.q=b.a=b.b=b.pending=null;b.lanes=[null,null];b.work=0;b.error=null;updateInspector();toast('Contents cleared. Machine ready.');};
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>b.closest('dialog').close();
$('start').onclick=()=>{$('welcome').close();toast('Select Extractor (2), then click a numbered deposit.');};
$('demo').onclick=()=>{
 world=new World();world.put('extractor',-8,-3,0);world.put('add',-4,-3,0);
 for(let x=-7.25;x<-4;x+=GRID)world.put('belt',x,-3,0);
 for(let y=-3.25;y>=-4;y-=GRID)world.put('belt',-7.5,y,y===-4?0:3);
 for(let x=-7.25;x<=-4;x+=GRID)world.put('belt',x,-4,x===-4?1:0);
 for(let y=-3.75;y<-3;y+=GRID)world.put('belt',-4,y,1);
 for(let x=-3;x<=-2;x+=GRID)world.put('belt',x,-3,x===-2?1:0);
 for(let y=-2.75;y<=0;y+=GRID)world.put('belt',-2,y,y===0?0:1);
 for(let x=-1.75;x<0;x+=GRID)world.put('belt',x,0,0);camera={x:-2,y:-1,zoom:1};$('welcome').close();save(false);updateUI();toast('Two streams of 2 make 4. Follow the first working addition line.');
};
$('expand').onclick=()=>{if(world.extent>=512)return toast('The map is already at its maximum size.');world.extent=Math.min(512,world.extent+32);$('world-summary').textContent=`Seed ${world.seed} · ${world.extent*2+1} × ${world.extent*2+1} tiles · ${world.mode} mode`;toast('Map expanded. More deposits await beyond the starting field.');};
$('restart-game').onclick=()=>{$('seed').value=world.seed;$('new-mode').value=world.mode;openDialog('confirm-dialog');};
$('menu-save').onclick=()=>save();
$('new-game').onclick=()=>openDialog('confirm-dialog');$('confirm-new').onclick=()=>{const value=$('seed').value.trim();if(!/^\d{1,10}$/.test(value)||Number(value)>4294967295)return toast('Enter a seed between 0 and 4,294,967,295.');world=new World(Number(value),$('new-mode').value);camera={x:-1,y:0,zoom:world.mode==='kids'?2:1};paused=false;speed=1;undo=[];clipboard=null;inspected=null;challengeDone=false;accumulator=0;closeDialogs();setTool('belt');save(false);updateUI();toast(world.mode==='challenge'?'Sprint started. Complete as many contracts as possible in 10 simulation minutes.':'Fresh field. Fresh possibilities.');};
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({world:world.serialize(),camera},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`numberworks-${world.seed}-${world.tick}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import').onclick=()=>$('import-file').click();$('import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>25*1024*1024)throw Error('Save is too large (25 MB limit)');const data=JSON.parse(await file.text());loadData(data);save(false);closeDialogs();toast('Factory restored. Welcome back.');}catch(err){toast(`Could not import: ${err.message}`);}finally{e.target.value='';}};
function renderLibrary(){const el=$('blueprint-list');el.replaceChildren();if(!library.length){const p=document.createElement('p');p.textContent='Your saved production lines will appear here.';el.append(p);}library.forEach((p,i)=>{const row=document.createElement('div');row.className='blueprint-row';const use=document.createElement('button');use.textContent=p.name;const small=document.createElement('small');small.textContent=`${p.cells.length} buildings`;use.append(small);use.onclick=()=>{clipboard=JSON.parse(JSON.stringify(p));closeDialogs();setTool('paste');};const del=document.createElement('button');del.textContent='×';del.setAttribute('aria-label',`Delete ${p.name}`);del.onclick=()=>{library.splice(i,1);writeStorage(BLUEPRINT_KEY,JSON.stringify(library));renderLibrary();};row.append(use,del);el.append(row);});}
$('blueprints').onclick=()=>{renderLibrary();openDialog('blueprint-dialog');};$('store-blueprint').onclick=()=>{if(!clipboard)return toast('Copy buildings with B before saving a blueprint.');if(library.length>=30)return toast('Library full. Remove a blueprint first.');const name=$('blueprint-name').value.trim()||'Production line';library.push({name,version:3,cells:JSON.parse(JSON.stringify(clipboard.cells))});const ok=writeStorage(BLUEPRINT_KEY,JSON.stringify(library));renderLibrary();toast(ok?'Blueprint saved.': 'Blueprint available this session; browser storage unavailable.');};
addEventListener('beforeunload',()=>save(false));document.addEventListener('visibilitychange',()=>{frameTime=performance.now();accumulator=0;if(document.hidden)save(false);});
function rounded(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function arrow(x,y,d,size,color){ctx.save();ctx.translate(x,y);ctx.rotate(d*Math.PI/2);ctx.strokeStyle=color;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-size,0);ctx.lineTo(size,0);ctx.moveTo(size-4,-3);ctx.lineTo(size,0);ctx.lineTo(size-4,3);ctx.stroke();ctx.restore();}
function beltInputs(b){
 if(b.type==='cross')return [side(b.dir,2),side(b.dir,3)];
 if(b.type==='splitter')return [side(b.dir,2)];
 const inputs=[];
 for(let d=0;d<4;d++){
 if(d===b.dir)continue;const [dx,dy]=DIRS[d],n=world.get(b.x+dx*GRID,b.y+dy*GRID);if(!n||['hub','trash'].includes(n.type))continue;
 const outs=n.type==='extractor'?[0,1,2,3]:n.type==='splitter'?[n.dir,side(n.dir,1),side(n.dir,3)]:n.type==='cross'?[n.dir,side(n.dir,1)]:[n.dir];
 if(outs.includes(side(d,2)))inputs.push(d);
 }
 return inputs.length?inputs:[b.q?.from??side(b.dir,2)];
}
function beltPath(from,to,half){
 const a=DIRS[from],b=DIRS[to];ctx.beginPath();ctx.moveTo(a[0]*half,a[1]*half);
 if(side(from,2)===to)ctx.lineTo(b[0]*half,b[1]*half);else ctx.quadraticCurveTo(0,0,b[0]*half,b[1]*half);
}
function drawTrack(b,alpha){
 const half=GRID*24,c=colors[b.type],inputs=beltInputs(b),paths=b.type==='cross'?[[side(b.dir,2),b.dir],[side(b.dir,3),side(b.dir,1)]]:b.type==='splitter'?[b.dir,side(b.dir,1),side(b.dir,3)].map(d=>[side(b.dir,2),d]):inputs.map(d=>[d,b.dir]);
 ctx.lineCap='butt';ctx.lineJoin='round';
 for(const [from,to] of paths){beltPath(from,to,half);ctx.strokeStyle='#0b151b';ctx.lineWidth=10;ctx.stroke();ctx.strokeStyle=b.type==='belt'?'#46575f':c+'b0';ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle=b.type==='belt'?'#9baeb64a':c;ctx.lineWidth=1;ctx.stroke();}
 if(b.type==='cross'){beltPath(side(b.dir,2),b.dir,half);ctx.strokeStyle='#132028';ctx.lineWidth=10;ctx.stroke();ctx.strokeStyle=c+'b0';ctx.lineWidth=6;ctx.stroke();}
 if(b.type==='trash'){rounded(-5,-5,10,10,2,'#413035',c);ctx.strokeStyle=c;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-2,-2);ctx.lineTo(2,2);ctx.moveTo(2,-2);ctx.lineTo(-2,2);ctx.stroke();}
 else if(b.type!=='belt'||(Math.round(b.x/GRID)+Math.round(b.y/GRID))%3===0){ctx.save();ctx.rotate(b.dir*Math.PI/2);ctx.strokeStyle='#d0dce39c';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-1.5,-2);ctx.lineTo(1,0);ctx.lineTo(-1.5,2);ctx.stroke();ctx.restore();}
}
function drawToken(t,b,lane,alpha){
 if(!t)return;const half=sizeOf(b)*24,progress=Math.min(1,(world.tick-t.born+alpha)/travelTicks(b)),output=b.type==='cross'?side(b.dir,lane):b.dir,from=t.from??side(output,2),entry=DIRS[from],out=DIRS[output];
 let x,y;
 if(TRANSPORT.has(b.type)){const a=1-progress;x=(entry[0]*a*a+out[0]*progress*progress)*half;y=(entry[1]*a*a+out[1]*progress*progress)*half;}
 else{x=out[0]*(half-8)*progress;y=out[1]*(half-8)*progress;}
 const label=String(t.value),font=label.length>5?5.5:label.length>3?6.5:8,tw=Math.min(25,Math.max(10,label.length*font*.55+3));
 rounded(x-tw/2,y-5,tw,10,2,'#e7ecdb','#faffed70');ctx.fillStyle='#223025';ctx.font=`600 ${font}px "Space Grotesk",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x,y+.3);
}
function hubShape(b,fill,stroke){
 const cells=world.cells(b),set=new Set(cells.map(p=>key(p.x,p.y))),unit=GRID*48;
 ctx.fillStyle=fill;for(const p of cells)ctx.fillRect(p.x*48-unit/2,p.y*48-unit/2,unit,unit);
 ctx.beginPath();for(const p of cells){const x=p.x*48-unit/2,y=p.y*48-unit/2;for(let d=0;d<4;d++){const [dx,dy]=DIRS[d];if(set.has(key(p.x+dx*GRID,p.y+dy*GRID)))continue;if(d===0){ctx.moveTo(x+unit,y);ctx.lineTo(x+unit,y+unit);}if(d===1){ctx.moveTo(x,y+unit);ctx.lineTo(x+unit,y+unit);}if(d===2){ctx.moveTo(x,y);ctx.lineTo(x,y+unit);}if(d===3){ctx.moveTo(x,y);ctx.lineTo(x+unit,y);}}}ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();
}
function drawBuilding(b,alpha,ghost=false,tokensOnly=false){
 const size=sizeOf(b),half=size*24,offset=(size-GRID)*24,c=colors[b.type];
 if(b.type==='hub'&&!tokensOnly){hubShape(b,'#a6bb77','#e0edb6');ctx.save();ctx.translate(b.x*48+18,b.y*48+18);ctx.fillStyle='#273d2e';ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d7ed91';ctx.lineWidth=1.5;for(const radius of [9,4]){ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();}ctx.restore();return;}
 ctx.save();ctx.translate(b.x*48+offset,b.y*48+offset);ctx.textAlign='center';ctx.textBaseline='middle';
 if(tokensOnly){if(b.type==='cross'){drawToken(b.lanes[0],b,0,alpha);drawToken(b.lanes[1],b,1,alpha);}else drawToken(b.q,b,0,alpha);ctx.restore();return;}
 if(b.type==='extractor'){
 const blockHalf=size>SOURCE_SIZE?SOURCE_SIZE*24:half;
 rounded(-blockHalf+1,-blockHalf+1,blockHalf*2-2,blockHalf*2-2,7,'#3c3525','#b7a374');
 ctx.fillStyle='#e7d29b';ctx.font='600 21px "Space Grotesk",sans-serif';ctx.fillText(String(b.sourceValue??world.deposit(b.x,b.y)),0,0);
 for(let d=0;d<4;d++){const [dx,dy]=DIRS[d];ctx.fillStyle='#d2ba7c';ctx.beginPath();ctx.arc(dx*(blockHalf-3),dy*(blockHalf-3),1.4,0,Math.PI*2);ctx.fill();}
 if(size>SOURCE_SIZE){for(const p of world.destinations(b,[0,1,2,3])){const dest=world.get(p.x,p.y);if(dest?.type!=='belt'||dest.dir!==p.d)continue;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo((p.x-b.x)*48-offset,(p.y-b.y)*48-offset);ctx.strokeStyle='#8d804455';ctx.lineWidth=2;ctx.stroke();}}
 }else if(TRANSPORT.has(b.type))drawTrack(b,alpha);
 else{
 // Three separate edge sections: rear A, left B, and forward output.
 rounded(-half+1,-half+1,half*2-2,half*2-2,5,'#14201e',c);
 ctx.save();ctx.rotate(b.dir*Math.PI/2);
 ctx.fillStyle=b.a?c+'90':c+'35';ctx.fillRect(-22,-8,12,30);
 ctx.fillStyle=b.b?c+'90':c+'35';ctx.fillRect(-22,-22,31,12);
 ctx.fillStyle=c;ctx.fillRect(11,-22,11,44);
 ctx.strokeStyle=c+'aa';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-10,22);ctx.lineTo(-10,-10);ctx.lineTo(-22,-10);ctx.moveTo(-10,-10);ctx.lineTo(9,-10);ctx.moveTo(10,-22);ctx.lineTo(10,22);ctx.stroke();
 arrow(-16,16,0,3,'#f1f5e9');arrow(4,-16,1,3,'#f1f5e9');arrow(16,4,0,4,'#13201c');
 ctx.restore();
 const label=(text,x,y,font,color)=>{const angle=b.dir*Math.PI/2;ctx.fillStyle=color;ctx.font=font;ctx.fillText(text,x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle));};
 label('A',-16,3,'700 12px sans-serif','#f5f7ed');label('B',-13,-16,'700 12px sans-serif','#f5f7ed');
 label(TYPES[b.type].icon,0,3,'700 28px "Space Grotesk",sans-serif',c);
 if(b.pending){ctx.save();ctx.rotate(b.dir*Math.PI/2);ctx.fillStyle=c;ctx.fillRect(-8,18,16*(1-b.work/world.operatorInterval),3);ctx.restore();}

 }
 if(b.error){ctx.fillStyle='#ffad99';ctx.beginPath();ctx.arc(half-6,-half+6,4,0,Math.PI*2);ctx.fill();}
 if(overlay&&!ghost){const state=world.status(b),status=b.error?'#f1a08a':state==='Output blocked'?'#e5ae78':state.startsWith('Waiting')?'#7d9897':'#d7ed91';ctx.fillStyle=status;ctx.beginPath();ctx.arc(-half+3,-half+3,1.8,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
function outline(b,color){if(b.type==='hub'){hubShape(b,'#d7ed9120',color);return;}const size=sizeOf(b);ctx.strokeStyle=color;ctx.lineWidth=1;ctx.strokeRect(b.x*48-GRID*24,b.y*48-GRID*24,size*48,size*48);}
function render(alpha){
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#111b18';ctx.fillRect(0,0,width,height);
 const s=tileSize*camera.zoom;ctx.save();ctx.translate(width/2-camera.x*s,height/2-20-camera.y*s);ctx.scale(camera.zoom,camera.zoom);
 const minX=Math.max(-world.extent,Math.floor(camera.x-width/(2*s))-2),maxX=Math.min(world.extent+1,Math.ceil(camera.x+width/(2*s))+2),minY=Math.max(-world.extent,Math.floor(camera.y-height/(2*s))-2),maxY=Math.min(world.extent+1,Math.ceil(camera.y+height/(2*s))+2);
 // Quiet world markers; the fine alignment grid is optional and local while building.
 ctx.fillStyle='#87938b22';for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++)ctx.fillRect(x*48-1,y*48-1,1.5,1.5);
 const building=TYPES[tool]&&!modalOpen()&&hover;
 if(showGrid||building){const left=showGrid?minX:Math.max(minX,hover.x-2),right=showGrid?maxX:Math.min(maxX,hover.x+2),top=showGrid?minY:Math.max(minY,hover.y-2),bottom=showGrid?maxY:Math.min(maxY,hover.y+2);ctx.strokeStyle='#7588791c';ctx.lineWidth=.6/camera.zoom;ctx.beginPath();for(let x=left;x<=right;x+=GRID){ctx.moveTo(x*48-6,top*48-6);ctx.lineTo(x*48-6,bottom*48+6);}for(let y=top;y<=bottom;y+=GRID){ctx.moveTo(left*48-6,y*48-6);ctx.lineTo(right*48+6,y*48-6);}ctx.stroke();}
 const patches=new Map();for(let x=minX;x<=maxX;x++)for(let y=minY;y<=maxY;y++){const p=world.depositAt(x,y);if(p)patches.set(key(p.x,p.y),p);}
 for(const p of patches.values()){
 if(world.get(p.x,p.y)?.type==='extractor')continue;
 const center=(SOURCE_SIZE-GRID)*24,px=p.x*48+center,py=p.y*48+center;
 ctx.fillStyle='#b9a8770c';ctx.beginPath();ctx.arc(px,py,22,0,Math.PI*2);ctx.fill();rounded(px-17,py-17,34,34,8,'#b9a8770a','#b9a87750');
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=world.unlockedNumbers.includes(p.value)?'#baa978':'#59635b';ctx.font='500 21px "Space Grotesk",sans-serif';ctx.fillText(p.value,px,py);
 }
 ctx.strokeStyle='#74805755';ctx.lineWidth=1;ctx.strokeRect(-world.extent*48-6,-world.extent*48-6,(world.extent*2+1)*48,(world.extent*2+1)*48);
 const visible=[];for(const b of world.buildings.values())if(b.x+sizeOf(b)>=minX&&b.x<=maxX&&b.y+sizeOf(b)>=minY&&b.y<=maxY)visible.push(b);
 // Tracks connect edge-to-edge, with all items drawn afterward so labels remain readable.
 for(const b of visible){ctx.globalAlpha=pointer?.moving?.b===b? .3:1;drawBuilding(b,alpha);}ctx.globalAlpha=1;for(const b of visible)drawBuilding(b,alpha,false,true);
 const selected=inspected&&world.get(inspected.x,inspected.y);if(selected)outline(selected,'#f4f6dd');
 if(pointer?.moving){const m=pointer.moving,invalid=world.canMove(m.b,m.to.x,m.to.y),preview={...m.b,...m.to};ctx.globalAlpha=.75;drawBuilding(preview,alpha,true);ctx.globalAlpha=1;outline(preview,invalid?'#e49b86':'#d7ed91');}
 if(hover&&!modalOpen()&&!pointer?.pan&&!pointer?.moving){
 if(tool==='paste'&&clipboard){const origin=blueprintOrigin(hover.x,hover.y);for(const b of clipboard.cells){const p=world.placement(b.type,b.x+origin.x,b.y+origin.y,sizeOf(b)),invalid=world.canPlace(b.type,p.x,p.y,b.dir,sizeOf(b));ctx.globalAlpha=.5;drawBuilding({...b,...p,lanes:[null,null]},alpha,true);ctx.globalAlpha=1;outline({...b,...p},invalid?'#e49b86':'#d7ed91');}}
 else if(TYPES[tool]){const p=world.placement(tool,hover.x,hover.y),invalid=world.canPlace(tool,p.x,p.y,direction),b={type:tool,...p,dir:tool==='splitter'&&world.get(p.x,p.y)?.type==='belt'?world.get(p.x,p.y).dir:direction,lanes:[null,null]};ctx.globalAlpha=.5;if(!invalid)drawBuilding(b,alpha,true);ctx.globalAlpha=1;outline(b,invalid?'#e49b86':'#d7ed91');}
 else outline(world.get(hover.x,hover.y)||{...hover,size:GRID},tool==='erase'?'#e49b86':'#d7ed91');
 }
 if(selection){const x=Math.min(selection.a.x,selection.b.x),y=Math.min(selection.a.y,selection.b.y),w=Math.abs(selection.a.x-selection.b.x)+GRID,h=Math.abs(selection.a.y-selection.b.y)+GRID;ctx.fillStyle='#d7ed9120';ctx.fillRect(x*48-6,y*48-6,w*48,h*48);ctx.strokeStyle='#d7ed91';ctx.setLineDash([5,4]);ctx.strokeRect(x*48-6,y*48-6,w*48,h*48);ctx.setLineDash([]);}
 ctx.restore();
}
function formatTime(t){const seconds=Math.floor(t/20);return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
function updateContracts(){
 const contracts=world.activeContracts,signature=contracts.map(c=>`${c.id}:${c.value}:${c.count}`).join('|'),list=$('contract-list');
 if(signature!==contractSignature||!list.children.length){
 contractSignature=signature;list.replaceChildren();
 for(const c of contracts){
 const card=document.createElement('article');card.className=`contract-card ${c.kind}`;card.dataset.contractId=c.id;
 const tag=document.createElement('div');tag.className='contract-kind';tag.textContent=c.kind==='core'?'CORE CONTRACT · EARN XP':'PRODUCTION ORDER · LONG RUN';
 const heading=document.createElement('h2');heading.textContent=c.title;
 const value=document.createElement('div');value.className='contract-value';value.textContent=c.value.toLocaleString();if(c.value>=1000000)value.classList.add('large-number');
 const counters=document.createElement('div');counters.className='contract-counters';const count=document.createElement('strong');count.className='contract-count';const rate=document.createElement('span');rate.className='contract-rate';counters.append(count,rate);
 const track=document.createElement('div');track.className='progress-track';track.setAttribute('role','progressbar');track.setAttribute('aria-label',`${c.value.toLocaleString()} deliveries`);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(c.count));const bar=document.createElement('div');track.append(bar);
 const hint=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p');hint.className='contract-hint';summary.textContent='Production hint';text.textContent=c.hint;hint.append(summary,text);
 card.append(tag,heading,value,counters,track,hint);list.append(card);
 }
 }
 for(const c of contracts){const card=list.querySelector(`[data-contract-id="${c.id}"]`),rate=world.history.filter(h=>h.value===c.value).length;card.querySelector('.contract-count').textContent=`${c.progress.toLocaleString()} / ${c.count.toLocaleString()}`;card.querySelector('.contract-rate').textContent=`${rate} / min`;const track=card.querySelector('.progress-track');track.setAttribute('aria-valuenow',String(c.progress));track.firstElementChild.style.width=`${100*c.progress/c.count}%`;}
 $('mode-tag').textContent=world.mode==='standard'?'CAMPAIGN':world.mode.toUpperCase();$('contracts-completed').textContent=`${world.completedContracts} complete`;
 document.querySelector('.board-heading h1').textContent=world.mode==='kids'?'Let’s learn math!':'Keep it flowing.';
 if(world.mode==='kids'){$('contract-slots').textContent='One puzzle at a time · no timer';$('contracts-completed').textContent=`★ ${world.level} stars`;$('next-unlock').textContent='Open Math lesson. Predict the answer, explain your thinking, then watch the numbers travel.';return;}
 const nextSlot=world.contractCapacity===1?3:6;$('contract-slots').textContent=world.contractCapacity<3?`${contracts.length} active · next slot in ${nextSlot-world.completedContracts} completion${nextSlot-world.completedContracts===1?'':'s'}`:`${contracts.length} active · all slots unlocked`;
 const next=Object.entries(TYPES).filter(([type,t])=>!OPERATIONS.includes(type)&&t.unlock>world.unlocked).map(([,t])=>t).sort((a,b)=>a.unlock-b.unlock)[0];$('next-unlock').textContent=next?`Next machine: ${next.name} · ${next.unlock-world.level} core contract${next.unlock-world.level===1?'':'s'} away`:'Spend contract XP in the workshop for numbers, operations and speed.';
}
function renderWorkshop(){
 $('workshop-xp').textContent=`${world.xp.toLocaleString()} XP available`;
 $('workshop-status').textContent=world.workshopOpen?'Choose new building blocks or make every machine of a type faster. Each matched delivery earns 1 XP; finished contracts award a bonus.':'Finish 4 from twos, then 10 from twos, to open the workshop.';
 $('random-status').textContent=world.randomContractsReady?'New contracts now choose reachable random numbers from 1–10,000.':`Random contracts unlock at 7 number sources and 4 operations (${world.unlockedNumbers.length}/7 numbers · ${world.unlockedOperations.length}/4 operations).`;
 const sections=[['number-shop',Object.entries(NUMBER_COSTS).map(([id,cost])=>({kind:'number',id:Number(id),cost,name:`Number ${id}`,owned:world.unlockedNumbers.includes(Number(id))}))],['operation-shop',Object.entries(OPERATION_COSTS).map(([id,cost])=>({kind:'operation',id,cost,name:TYPES[id].name,owned:world.unlockedOperations.includes(id)}))],['upgrade-shop',['extractor','operator'].map(id=>{const level=world.upgrades[id],rates=id==='extractor'?EXTRACTOR_TICKS:OPERATOR_TICKS;return {kind:'upgrade',id,cost:UPGRADE_COSTS[level-1],name:`${id==='extractor'?'Extractors':'Operators'} · level ${level}/5`,detail:level<5?`${(rates[level-1]/20).toFixed(1)}s → ${(rates[level]/20).toFixed(1)}s per number`:'Maximum speed',owned:level===5};})]];
 for(const [id,items] of sections){const list=$(id);list.replaceChildren();for(const item of items){const button=document.createElement('button');button.className='shop-item';button.dataset.kind=item.kind;button.dataset.item=String(item.id);const name=document.createElement('strong');name.textContent=item.name;const detail=document.createElement('small');detail.textContent=item.owned?'Unlocked':`${item.cost} XP${item.detail?' · '+item.detail:''}`;button.append(name,detail);button.disabled=item.owned||!world.workshopOpen||world.xp<item.cost;button.onclick=()=>{const result=world.purchase(item.kind,item.id);if(result.error)toast(result.error);else{renderToolbar();renderWorkshop();updateUI();beep(540);}};list.append(button);}}
}
function showLesson(){
 const l=world.kidsLesson,symbol=TYPES[l.operation].icon;$('lesson-title').textContent=l.title;$('lesson-stars').textContent=`★ ${world.level} lesson${world.level===1?'':'s'} completed · lesson ${world.level%12+1} of 12`;$('lesson-equation').textContent=`${l.a} ${symbol} ${l.b} = ?`;
 const dots=n=>'● '.repeat(n).trim();let picture,explanation;
 if(l.operation==='add'){picture=`${dots(l.a)}  +  ${dots(l.b)}`;explanation='Join the two groups. How many dots are there altogether?';}
 if(l.operation==='sub'){picture=`${dots(l.a-l.b)}  ${'○ '.repeat(l.b)}`;explanation=`Start with ${l.a}. The ${l.b} empty circles are taken away. Count the filled circles.`;}
 if(l.operation==='mul'){picture=Array.from({length:l.a},()=>dots(l.b)).join('\n');explanation=`There are ${l.a} equal groups, with ${l.b} dots in each. How many dots altogether?`;}
 if(l.operation==='div'){picture=dots(l.a);explanation=`Share these ${l.a} dots equally between ${l.b} groups. How many will each group get?`;}
 $('lesson-picture').textContent=picture;$('lesson-explanation').textContent=explanation;$('lesson-answer').value='';$('lesson-feedback').textContent='';openDialog('lesson-dialog');$('lesson-title').focus({preventScroll:true});$('lesson-dialog').scrollTop=0;
}
$('math-lesson').onclick=showLesson;
$('start-kids').onclick=()=>{world=new World(2026,'kids');camera={x:-1,y:0,zoom:2};closeDialogs();setTool('select');save(false);updateUI();showLesson();};
$('lesson-form').onsubmit=e=>{e.preventDefault();const raw=$('lesson-answer').value;if(!raw.trim())return;const result=world.tryLesson(Number(raw));if(result.error){$('lesson-feedback').textContent=result.error;return;}closeDialogs();paused=false;camera={x:-1,y:0,zoom:2};updateUI();toast(`Correct! Watch the machine make ${result.value} and send it to the hub.`);};
$('workshop').onclick=()=>{renderWorkshop();openDialog('workshop-dialog');};
function updateHistogram(){
 if(histogramWorld===world&&histogramTotal===world.delivered)return;histogramWorld=world;histogramTotal=world.delivered;
 const entries=Object.entries(world.hubTotals).sort((a,b)=>b[1]-a[1]||Number(a[0])-Number(b[0])),max=entries[0]?.[1]||1,container=$('delivery-histogram');container.replaceChildren();
 if(!entries.length){const empty=document.createElement('p');empty.className='histogram-empty';empty.textContent='No deliveries yet';container.append(empty);return;}
 for(const [value,count] of entries){const row=document.createElement('div');row.className='histogram-row';row.dataset.value=value;row.setAttribute('role','listitem');row.setAttribute('aria-label',`Number ${value}: ${count} deliveries`);const label=document.createElement('span');label.textContent=Number(value).toLocaleString();label.title=label.textContent;const bar=document.createElement('div');bar.className='histogram-bar';const fill=document.createElement('i');fill.style.width=`${Math.max(1,count/max*100)}%`;bar.append(fill);const amount=document.createElement('strong');amount.textContent=count.toLocaleString();row.append(label,bar,amount);container.append(row);}
}
function updateUI(){
 const kids=world.mode==='kids';document.body.classList.toggle('kids-mode',kids);$('math-lesson').hidden=!kids;$('workshop').hidden=kids;
 updateContracts();updateHistogram();$('xp-balance').textContent=`${world.xp.toLocaleString()} XP`;
 $('building-count').textContent=(world.buildings.size-1).toLocaleString();let count=0;for(const b of world.buildings.values())count+=world.contents(b).length;$('item-count').textContent=count.toLocaleString();$('rate').textContent=world.history.length;$('runtime').textContent=world.mode==='challenge'?`${formatTime(Math.max(0,12000-world.tick))} left`:formatTime(world.tick);$('zoom').textContent=`${Math.round(camera.zoom*100)}%`;$('sector').textContent=`${Math.round(camera.x)} : ${Math.round(camera.y)}`;$('pause').innerHTML=paused?'▶ <span>Resume</span>':'Ⅱ <span>Pause</span>';$('pause').classList.toggle('active',paused);$('speed').textContent=`${speed}×`;
 const spark=$('sparkline').getContext('2d');spark.clearRect(0,0,240,48);const bins=Array(24).fill(0);for(const h of world.history){const i=23-Math.floor((world.tick-h.tick)/50);if(i>=0&&i<24)bins[i]++;}const max=Math.max(3,...bins);spark.fillStyle='#70874d';bins.forEach((n,i)=>spark.fillRect(i*10,46-Math.max(2,n/max*40),6,Math.max(2,n/max*40)));
 updateInspector();
}
function frame(now){const elapsed=Math.min(250,now-frameTime);frameTime=now;const running=!paused&&!modalOpen()&&!document.hidden&&!pointer?.moving&&!(pointer&&!pointer.pan&&tool==='belt');if(running){accumulator+=elapsed*speed;let steps=0;while(accumulator>=50&&steps<24){world.step();accumulator-=50;steps++;if(world.mode==='challenge'&&world.tick>=12000&&!challengeDone){challengeDone=true;$('challenge-score').textContent=`You completed ${world.completedContracts} contracts and delivered ${world.delivered.toLocaleString()} numbers. Your factory is now a sandbox—keep building as long as you like.`;world.mode='sandbox';renderToolbar();openDialog('challenge-result');accumulator=0;break;}}}else accumulator=0;
 while(world.events.length){const event=world.events.shift();if(event.type==='contracts'){renderToolbar();const values=event.completed.map(c=>c.value.toLocaleString()).join(' + ');toast(world.mode==='kids'?`★ Well done! ${world.level} lessons completed. Open Math lesson for the next puzzle.`:event.newSlots?`Delivered ${values}! ${world.contractCapacity} contracts can now run in parallel.`:`Contract complete: ${values}. Other contracts keep their progress.`);beep(660);}}

 if(!touchDevice||now-lastRender>=1000/30){render(running?accumulator/50:0);lastRender=now;}
 if(now-uiTime>200){updateUI();uiTime=now;}
 if(now-saveTime>20000){if(!modalOpen())save(false);saveTime=now;}
 requestAnimationFrame(frame);
}
setTool('belt');updateUI();requestAnimationFrame(frame);
if(!loaded)openDialog('welcome');
if(!storageAvailable)setTimeout(()=>toast('Browser storage unavailable. Export saves from the World menu.'),1200);
// A read-only debug snapshot is useful for automated browser validation.
window.numberworksDebug=()=>({world:world.serialize(),tool,paused,showGrid,camera:{...camera},clipboard:clipboard&&JSON.parse(JSON.stringify(clipboard))});
})();
