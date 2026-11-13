const form=document.querySelector('#researchForm');
const fields=[...form.querySelectorAll('input,textarea')];
const status=document.querySelector('#researchStatus');
const key='lorca-reporteros-v1';
function mirrors(){for(const field of fields)document.querySelector(`[data-answer="${field.name}"]`).textContent=field.value||'________________________________________________________________';}
try{const saved=JSON.parse(localStorage.getItem(key)||'{}');for(const field of fields)if(typeof saved[field.name]==='string')field.value=saved[field.name].slice(0,field.maxLength);}catch{status.textContent='Puedes escribir aquí. El guardado automático no está disponible; descarga tus respuestas antes de salir.';}
mirrors();
form.addEventListener('submit',e=>e.preventDefault());
form.addEventListener('input',()=>{mirrors();try{localStorage.setItem(key,JSON.stringify(Object.fromEntries(fields.map(f=>[f.name,f.value]))));status.textContent='Respuestas guardadas en este dispositivo.';}catch{status.textContent='No se ha podido guardar aquí. Usa «Guardar mis respuestas» antes de salir.';}});
document.querySelector('#printResearch').onclick=()=>{mirrors();window.print();};
window.addEventListener('beforeprint',mirrors);
document.querySelector('#downloadResearch').onclick=()=>{const text='¡REPORTEROS DE LA POESÍA!\nMI CUADERNO DE INVESTIGACIÓN · FEDERICO GARCÍA LORCA\n\n'+fields.map(f=>`${f.labels[0].querySelector('span').textContent}\n${f.value||'(Sin completar)'}\n`).join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='mi-investigacion-lorca.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Cuaderno descargado. Puedes guardarlo o compartirlo con tu profe.';};
document.querySelector('#clearResearch').onclick=()=>{if(!confirm('¿Borrar todas tus respuestas guardadas en este dispositivo?'))return;form.reset();try{localStorage.removeItem(key);}catch{}mirrors();status.textContent='Respuestas borradas. Puedes empezar otra investigación.';};
