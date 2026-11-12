import * as THREE from './vendor/three.module.js';

export function initOrbitView() {
  const $ = s => document.querySelector(s);
  const host = $('#orbitGlobe');
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5,5,3,-3,.1,60);
  camera.position.set(0,8,11);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const radius = 3.1, earthRadius = .62, rad = Math.PI/180;
  const texture = new THREE.TextureLoader().load('./earth.jpg',()=>$('#orbitLoading').hidden=true,undefined,()=>{$('#orbitLoading').textContent='La imagen no se ha cargado. Puedes seguir viendo la órbita y el eje.';});
  texture.colorSpace = THREE.SRGBColorSpace;
  const sun = new THREE.Mesh(new THREE.SphereGeometry(.7,48,32),new THREE.MeshBasicMaterial({color:0xffd36b}));
  scene.add(sun);
  sun.add(new THREE.Mesh(new THREE.SphereGeometry(.81,32,24),new THREE.MeshBasicMaterial({color:0xffb643,transparent:true,opacity:.12})));
  scene.add(new THREE.AmbientLight(0xbad6ec,.3));
  const light = new THREE.DirectionalLight(0xffffff,3);scene.add(light);scene.add(light.target);
  // Translation and axial inclination are separate: the orbital angle NEVER
  // rotates the axis. The pole keeps the same world-space direction all year.
  const earthPosition = new THREE.Group();scene.add(earthPosition);
  const axis = new THREE.Group();earthPosition.add(axis);
  const dailyRotation = new THREE.Group();axis.add(dailyRotation);
  const material = new THREE.MeshLambertMaterial({map:texture});
  material.onBeforeCompile = shader => {shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08, 0.22, 0.30), 0.20);');};
  const earth = new THREE.Mesh(new THREE.SphereGeometry(earthRadius,64,48),material);earth.rotation.y=-Math.PI/2;dailyRotation.add(earth);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1.85,10),new THREE.MeshBasicMaterial({color:0xf2f5e5}));axis.add(rod);
  const north = new THREE.Mesh(new THREE.SphereGeometry(.045,16,12),new THREE.MeshBasicMaterial({color:0xb4edff}));north.position.y=.94;axis.add(north);
  const south = north.clone();south.position.y=-.94;axis.add(south);
  function line(points,color,parent=scene,opacity=1){const o=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity}));parent.add(o);return o;}
  line(Array.from({length:241},(_,i)=>{const a=i/240*Math.PI*2;return new THREE.Vector3(radius*Math.cos(a),0,-radius*Math.sin(a))}),0x648c83);
  line(Array.from({length:121},(_,i)=>{const a=i/120*Math.PI*2;return new THREE.Vector3((earthRadius+.006)*Math.cos(a),0,(earthRadius+.006)*Math.sin(a))}),0x80d9ef,axis);
  const ray = new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(),1,0xffd777,.15,.07);scene.add(ray);
  const referenceAxes=[];
  const labels=[];
  function label(text,object,dy=0,pole=false){const el=document.createElement('span');el.className='orbit-label'+(pole?' pole':'');el.textContent=text;$('#orbitLabels').append(el);labels.push({el,object,dy});}
  label('SOL',sun,0);label('N',north,-12,true);label('S',south,12,true);
  const stops=['Marzo','Junio','Septiembre','Diciembre'];
  for(let i=0;i<4;i++){
    const a=(i*90-90)*rad;
    const at=new THREE.Vector3(radius*Math.cos(a),0,-radius*Math.sin(a));
    const guide=new THREE.Group();guide.position.copy(at);scene.add(guide);referenceAxes.push(guide);
    line([new THREE.Vector3(0,-.85,0),new THREE.Vector3(0,.85,0)],0xadc6be,guide,.65);
    const dot=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),new THREE.MeshBasicMaterial({color:0xa7c7b1}));dot.position.copy(at);scene.add(dot);
    const anchor=new THREE.Object3D();anchor.position.set(4.05*Math.cos(a),0,-4.05*Math.sin(a));scene.add(anchor);label(stops[i],anchor);
  }
  let phase=0,playing=false,last=0,lastBucket=-1;
  function setPlaying(value){playing=value;$('#orbitPlay').textContent=value?'Ⅱ Pausar el viaje':'▶ Viajar un año';$('#orbitPlay').setAttribute('aria-pressed',String(value));}
  function update() {
    const a=(phase-90)*rad;
    const tilt=$('#orbitNoTilt').checked?0:23.5;
    axis.rotation.z=tilt*rad;
    referenceAxes.forEach(g=>g.rotation.z=tilt*rad);
    earthPosition.position.set(radius*Math.cos(a),0,-radius*Math.sin(a));
    light.position.set(0,0,0);light.target.position.copy(earthPosition.position);
    const outward=earthPosition.position.clone().normalize();ray.position.copy(outward).multiplyScalar(.9);ray.setDirection(outward);ray.setLength(radius-earthRadius-.95,.14,.07);
    const axisDirection=new THREE.Vector3(-Math.sin(tilt*rad),Math.cos(tilt*rad),0);
    const solarLat=Math.asin(axisDirection.dot(outward.clone().negate()))/rad;
    host.dataset.phase=phase.toFixed(2);host.dataset.tilt=String(tilt);host.dataset.axis=axisDirection.toArray().map(n=>n.toFixed(5)).join(',');host.dataset.solarLatitude=solarLat.toFixed(2);
    $('#orbitProgress').value=String(Math.round(phase));
    const bucket=Math.floor(phase);
    if(bucket!==lastBucket){lastBucket=bucket;updateText(tilt,solarLat);}
  }
  function updateText(tilt,solarLat){
    const wrapped=phase===360?0:phase;
    const quarter=Math.floor(wrapped/90);
    const nearStop=wrapped%90<.6;
    const name=nearStop?stops[quarter]+(quarter%2?' · Solsticio':' · Equinoccio'):`De ${stops[quarter].toLowerCase()} a ${stops[(quarter+1)%4].toLowerCase()}`;
    $('#orbitPosition').textContent=name;$('#orbitMoment').textContent=name;
    $('#orbitProgress').setAttribute('aria-valuetext',name);
    document.querySelectorAll('[data-orbit]').forEach(b=>b.setAttribute('aria-pressed',String(Math.abs(Number(b.dataset.orbit)-wrapped)<.6)));
    const northSeasons=['Primavera','Verano','Otoño','Invierno'];
    const southSeasons=['Otoño','Invierno','Primavera','Verano'];
    $('#orbitNorth').textContent=tilt?northSeasons[quarter]:'Sin ciclo de estaciones';
    $('#orbitSouth').textContent=tilt?southSeasons[quarter]:'Sin ciclo de estaciones';
    let title,text;
    if(!tilt){title='Sin inclinación, ¿qué pasa?';text='Los dos hemisferios reciben la luz de forma parecida todo el año. Desaparece el ciclo de estaciones causado por la inclinación. El día y la noche siguen existiendo: la Tierra continúa girando.';}
    else if(nearStop&&quarter%2===0){title='Los dos hemisferios comparten la luz';text='Es un equinoccio. Ninguno se inclina hacia el Sol. El día y la noche duran aproximadamente lo mismo en casi toda la Tierra.';}
    else if(wrapped>0&&wrapped<180){title='El norte se inclina hacia el Sol';text=nearStop?'En junio, la inclinación hacia el Sol es máxima en el norte: empieza su verano. En el sur comienza el invierno.':'Entre marzo y septiembre, el norte tiene días más largos que las noches. La inclinación hacia el Sol aumenta hasta junio y después disminuye.';}
    else{title='El sur se inclina hacia el Sol';text=nearStop?'En diciembre, la inclinación hacia el Sol es máxima en el sur: empieza su verano. En el norte comienza el invierno.':'Entre septiembre y marzo, el sur tiene días más largos que las noches. La inclinación hacia el Sol aumenta hasta diciembre y después disminuye.';}
    $('#orbitHeadline').textContent=title;$('#orbitExplanation').textContent=text;
    const value=Math.abs(solarLat)<.05?'Ecuador · 0°':`${Math.abs(solarLat).toFixed(1).replace('.',',')}° ${solarLat>0?'N':'S'}`;
    $('#orbitDirect').textContent=value;
    $('#orbitComparison').textContent=tilt?'Observa las líneas blancas en las cuatro paradas: todas apuntan en la misma dirección.':'El eje ahora está recto (0°). Activa de nuevo su inclinación quitando la marca de la casilla.';
    host.setAttribute('aria-label',`${name}. Eje inclinado ${tilt} grados. ${title}. Norte: ${$('#orbitNorth').textContent}. Sur: ${$('#orbitSouth').textContent}.`);
  }
  function seek(value){setPlaying(false);phase=value;lastBucket=-1;update();}
  $('#orbitPlay').onclick=()=>{if(!playing&&phase>=360){phase=0;lastBucket=-1;}setPlaying(!playing);update();};
  $('#orbitNext').onclick=()=>seek((Math.floor(phase/90)+1)%4*90);
  $('#orbitReset').onclick=()=>seek(0);
  $('#orbitProgress').oninput=e=>seek(Number(e.target.value));
  document.querySelectorAll('[data-orbit]').forEach(b=>b.onclick=()=>seek(Number(b.dataset.orbit)));
  $('#orbitNoTilt').onchange=()=>{lastBucket=-1;update();};
  new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const halfWidth=Math.max(4.65,3*w/h);const halfHeight=halfWidth*h/w;camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();renderer.setSize(w,h);}).observe(host);
  let visible=true;new IntersectionObserver(([entry])=>visible=entry.isIntersecting).observe(host);
  update();
  function frame(t){requestAnimationFrame(frame);const dt=Math.min(t-last,60);last=t;if(document.hidden||$('#orbitSection').hidden||!visible)return;if(playing){phase=Math.min(360,phase+dt*360/32000);dailyRotation.rotation.y+=dt*.0012;update();if(phase>=360)setPlaying(false);}scene.updateMatrixWorld();labels.forEach(({el,object,dy})=>{const p=object.getWorldPosition(new THREE.Vector3()).project(camera);const half=el.offsetWidth/2+5;const x=Math.max(half,Math.min(host.clientWidth-half,(p.x+1)*host.clientWidth/2));el.style.left=`${x}px`;el.style.top=`${(1-p.y)*host.clientHeight/2+dy}px`;});renderer.render(scene,camera);}
  requestAnimationFrame(frame);
}
