import * as THREE from './vendor/three.module.js';

// A fixed 23.5° axis and a changing Sun direction model four orbital positions.
// Camera follows the orbital position; it never changes the Earth's axial tilt.
export function initSolarView() {
  const $ = s => document.querySelector(s);
  const host = $('#solarGlobe');
  const rad = Math.PI / 180;
  const tilt = 23.5 * rad;
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.prepend(renderer.domElement);
  const camera = new THREE.OrthographicCamera(-3.4,3.4,2.1,-2.1,.1,40);
  const axis = new THREE.Group();
  axis.rotation.z = tilt;
  scene.add(axis);
  const globe = new THREE.Group();
  axis.add(globe);
  const texture = new THREE.TextureLoader().load('./earth.jpg', () => { $('#solarLoading').hidden = true; }, undefined, () => { $('#solarLoading').textContent = 'No se ha cargado la imagen. Las luces y las líneas siguen funcionando.'; });
  texture.colorSpace = THREE.SRGBColorSpace;
  const earthMaterial = new THREE.MeshLambertMaterial({map:texture});
  // Lift dark ocean colors so children can distinguish the lit half on a tablet.
  earthMaterial.onBeforeCompile = shader => { shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08, 0.22, 0.30), 0.20);'); };
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1,80,56),earthMaterial);
  earth.rotation.y = -Math.PI / 2;
  globe.add(earth);
  const sunlight = new THREE.DirectionalLight(0xffffff, 2.5);
  scene.add(sunlight);
  scene.add(new THREE.AmbientLight(0x9eb9db,.13));
  const sun = new THREE.Mesh(new THREE.SphereGeometry(.44,40,32), new THREE.MeshBasicMaterial({color:0xffd36b}));
  scene.add(sun);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(.53,32,24),new THREE.MeshBasicMaterial({color:0xffb643,transparent:true,opacity:.13}));
  sun.add(glow);
  const point = (lat,lon,r=1.008) => new THREE.Vector3(r*Math.cos(lat*rad)*Math.sin(lon*rad),r*Math.sin(lat*rad),r*Math.cos(lat*rad)*Math.cos(lon*rad));
  function line(points,color,parent,opacity=1) {
    const object = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity}));
    parent.add(object); return object;
  }
  [0,23.5,-23.5,66.5,-66.5].forEach(lat => line(Array.from({length:181},(_,i)=>point(lat,i*2)),lat===0?0x77cce4:Math.abs(lat)<30?0xffac68:0xd6e3ed,axis));
  line([new THREE.Vector3(0,-1.35,0),new THREE.Vector3(0,1.35,0)],0xffffff,axis);
  const north = new THREE.Mesh(new THREE.SphereGeometry(.035,16,12),new THREE.MeshBasicMaterial({color:0xa6e5ff}));
  north.position.y = 1.02; axis.add(north);
  const south = north.clone(); south.position.y = -1.02; axis.add(south);
  const direct = new THREE.Mesh(new THREE.SphereGeometry(.045,20,12),new THREE.MeshBasicMaterial({color:0xffed8d}));scene.add(direct);
  // A rotating surface dot makes daily rotation visible even on the shaded side.
  const traveler = new THREE.Mesh(new THREE.SphereGeometry(.025,16,12),new THREE.MeshBasicMaterial({color:0x9af7bb}));
  traveler.position.copy(point(45,0,1.018));globe.add(traveler);
  const rays = new THREE.Group();scene.add(rays);
  const labels=[];
  function label(text,object,offset=0) {
    const el=document.createElement('span');el.className='solar-label';el.textContent=text;$('#solarLabels').append(el);labels.push({el,object,offset});return el;
  }
  label('SOL',sun,-48);
  label('Norte',north,-23);
  label('Sur',south,24);
  const directLabel=label('Rayos directos',direct,32);
  let season='june', spinning=false, last=0;
  const positions={march:90,june:0,september:270,december:180};
  const descriptions={
    june:['JUNIO · SOLSTICIO','El norte mira hacia el Sol','El polo norte recibe luz durante toda la vuelta. El polo sur queda en la parte oscura, incluso mientras la Tierra gira.','Norte: 24 horas de luz','Sur: 24 horas sin Sol','Cáncer · 23,5° N','El punto amarillo llega a su límite más al norte. En el trópico de Cáncer, el Sol está justo sobre la cabeza al mediodía solar.'],
    december:['DICIEMBRE · SOLSTICIO','Ahora el sur mira hacia el Sol','Medio año después se intercambian los papeles: el polo sur recibe luz durante toda la vuelta y el polo norte queda en la oscuridad.','Norte: 24 horas sin Sol','Sur: 24 horas de luz','Capricornio · 23,5° S','El punto amarillo llega a su límite más al sur. En el trópico de Capricornio, el Sol está justo sobre la cabeza al mediodía solar.'],
    march:['MARZO · EQUINOCCIO','La luz se reparte entre las dos mitades','Ningún hemisferio se inclina hacia el Sol. En casi toda la Tierra, el día y la noche duran unas 12 horas. En los polos, el Sol está cerca del horizonte.','Norte: Sol en el horizonte','Sur: Sol en el horizonte','Ecuador · 0°','Al mediodía solar, los rayos llegan perpendiculares al suelo en el ecuador. El punto amarillo pasa por la mitad del camino entre los trópicos.'],
    september:['SEPTIEMBRE · EQUINOCCIO','Otra vez, luz en las dos mitades','Ningún hemisferio se inclina hacia el Sol. En casi toda la Tierra, el día y la noche duran unas 12 horas. En los polos, el Sol está cerca del horizonte.','Norte: Sol en el horizonte','Sur: Sol en el horizonte','Ecuador · 0°','El punto amarillo vuelve a pasar por el ecuador. Ahora sigue su viaje hacia el trópico de Capricornio.']
  };
  function setSeason(key) {
    season=key;
    const a=positions[key]*rad;
    const sunDirection=new THREE.Vector3(-Math.cos(a),0,Math.sin(a));
    const cameraDirection=new THREE.Vector3(Math.sin(a),0,Math.cos(a));
    sun.position.copy(sunDirection).multiplyScalar(3.05);
    sunlight.position.copy(sunDirection).multiplyScalar(10);
    direct.position.copy(sunDirection).multiplyScalar(1.02);
    const target=sunDirection.clone().multiplyScalar(.9);
    camera.position.copy(target).addScaledVector(cameraDirection,10);
    camera.lookAt(target);camera.updateMatrixWorld();
    while(rays.children.length){const o=rays.children[0];rays.remove(o);o.geometry.dispose();o.material.dispose()}
    // Parallel incoming rays stop at the lit surface, not inside or behind the Earth.
    for(const y of [-.8,-.4,0,.4,.8]){
      const start=sunDirection.clone().multiplyScalar(2.45);start.y=y;
      const end=sunDirection.clone().multiplyScalar(Math.sqrt(1-y*y)+.012);end.y=y;
      line([start,end],0xffdc79,rays,y===0?1:.55);
      const arrowBase=end.clone().addScaledVector(sunDirection,.16);
      line([arrowBase.clone().add(new THREE.Vector3(0,.045,0)),end,arrowBase.clone().add(new THREE.Vector3(0,-.045,0))],0xffdc79,rays);
    }
    const d=descriptions[key];
    ['seasonName','solarHeadline','solarText','northStatus','southStatus','directTitle','directText'].forEach((id,i)=>$('#'+id).textContent=d[i]);
    directLabel.textContent='Directos: '+d[5];
    document.querySelectorAll('[data-season]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.season===key)));
    host.setAttribute('aria-label',`${d[1]}. ${d[3]}. ${d[4]}. Rayos directos: ${d[5]}.`);
    host.dataset.season=key;
    // Expose physical quantities on the diagram for accessible inspection and QA.
    const worldAxis=new THREE.Vector3(-Math.sin(tilt),Math.cos(tilt),0);
    host.dataset.solarLatitude=(Math.asin(worldAxis.dot(sunDirection))/rad).toFixed(1);
    host.dataset.northLight=worldAxis.dot(sunDirection).toFixed(4);
  }
  document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>setSeason(b.dataset.season));
  function stop(){spinning=false;$('#solarSpin').textContent='▶ Ver girar la Tierra';$('#solarSpin').setAttribute('aria-pressed','false')}
  $('#solarSpin').onclick=()=>{if(spinning){stop()}else{spinning=true;$('#solarSpin').textContent='Ⅱ Pausar el giro';$('#solarSpin').setAttribute('aria-pressed','true')}};
  $('#solarStep').onclick=()=>{stop();globe.rotation.y+=Math.PI/2;host.dataset.rotation=String(globe.rotation.y)};
  new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const halfWidth=Math.max(2.85,1.5*w/h);const halfHeight=halfWidth*h/w;camera.left=-halfWidth;camera.right=halfWidth;camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();renderer.setSize(w,h)}).observe(host);
  setSeason(season);
  const inView={value:true};new IntersectionObserver(([entry])=>{inView.value=entry.isIntersecting}).observe(host);
  function frame(t){requestAnimationFrame(frame);const dt=Math.min(t-last,50);last=t;if(document.hidden||$('#sunSection').hidden||!inView.value)return;if(spinning)globe.rotation.y+=dt*.00025;scene.updateMatrixWorld();labels.forEach(({el,object,offset})=>{const p=object.getWorldPosition(new THREE.Vector3()).project(camera);el.style.left=`${(p.x+1)*host.clientWidth/2}px`;el.style.top=`${(1-p.y)*host.clientHeight/2+offset}px`});renderer.render(scene,camera)}requestAnimationFrame(frame);
}
