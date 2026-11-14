import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

const canvas=document.querySelector('#scene'), scoreEl=document.querySelector('#score'), timerEl=document.querySelector('#timer'), comboEl=document.querySelector('#combo'), messageEl=document.querySelector('#message'), hintEl=document.querySelector('#aimHint'), shootBtn=document.querySelector('#shootBtn'), overlay=document.querySelector('#overlay');
const scene=new THREE.Scene();scene.background=new THREE.Color('#8ddcf4');scene.fog=new THREE.Fog('#a9e8e9',23,68);
const camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,120);camera.position.set(0,5.8,14.4);camera.lookAt(0,2.45,-4.2);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;
scene.add(new THREE.HemisphereLight('#e7fbff','#55785a',2.05));const sun=new THREE.DirectionalLight('#fff1d2',3.3);sun.position.set(-5,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-15;sun.shadow.camera.right=15;sun.shadow.camera.top=16;sun.shadow.camera.bottom=-12;sun.shadow.bias=-.0003;scene.add(sun);
const mat=(color,rough=.72,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const materials={court:mat('#ecaa5a'),cream:mat('#fff0d0'),red:mat('#ef4a3e'),blue:mat('#2474c7'),navy:mat('#233d64'),skin:mat('#ffc58e'),dark:mat('#52352d'),wood:mat('#cc7743'),white:mat('#fff9ec'),green:mat('#53bc78'),yellow:mat('#ffc742'),orange:mat('#f2832e'),net:mat('#fff7e6'),glass:new THREE.MeshPhysicalMaterial({color:'#d7f7ff',transparent:true,opacity:.37,roughness:.16,metalness:.05}),rim:mat('#fa5636',.4)};
function mesh(geo,material,parent=scene,position=[0,0,0],cast=true,receive=true){const m=new THREE.Mesh(geo,material);m.position.set(...position);m.castShadow=cast;m.receiveShadow=receive;parent.add(m);return m;}
function box(parent,material,pos,size,r=0){const m=mesh(new THREE.BoxGeometry(...size),material,parent,pos);if(r){m.geometry.dispose();m.geometry=new THREE.BoxGeometry(...size);}return m;}
function sphere(parent,material,pos,scale){const m=mesh(new THREE.SphereGeometry(1,24,16),material,parent,pos);m.scale.set(...scale);return m;}
function cylinder(parent,material,pos,r1,r2,h,segments=16){return mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material,parent,pos);}
// Floating seaside court, glossy honey-colored parquet.
const floor=mesh(new THREE.PlaneGeometry(19,31),materials.court,scene,[0,-.08,-1]);floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;
const ground=mesh(new THREE.PlaneGeometry(200,200),mat('#83c99c'),scene,[0,-.45,-20],false,false);ground.rotation.x=-Math.PI/2;
for(let i=-5;i<=5;i++){box(scene,mat(i%2?'#f4bd70':'#f0b467'),[i*1.72,.005,-1],[1.68,.012,30]);}
// Court markings laid flat over the boards.
const lineMat=new THREE.MeshBasicMaterial({color:'#fff3da'});function courtLine(x,z,w,d){const l=mesh(new THREE.BoxGeometry(w,.018,d),lineMat,scene,[x,.025,z],false,false);return l;}
courtLine(0,-14,18,.09);courtLine(0,12,18,.09);courtLine(-8.8,-1,.09,26);courtLine(8.8,-1,.09,26);courtLine(0,4.3,8.2,.08);courtLine(0,-3.3,8.2,.08);
const circle=mesh(new THREE.TorusGeometry(2.15,.045,8,64),lineMat,scene,[0,.034,1.1],false,false);circle.rotation.x=Math.PI/2;
const paint=mesh(new THREE.PlaneGeometry(5.1,7.8),mat('#e98e58'),scene,[0,.015,-5]);paint.rotation.x=-Math.PI/2;courtLine(0,-5,5.1,.07);courtLine(-2.55,-5,.07,7.8);courtLine(2.55,-5,.07,7.8);
// Backboard, painted square, supports and an open, netted rim.
const hoopZ=-7.55,hoopY=3.65;box(scene,materials.navy,[0,4.48,-8.52],[2.5,1.72,.18]);box(scene,materials.glass,[0,4.5,-8.405],[2.34,1.55,.09]);
const boardFrame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(.76,.54)),new THREE.LineBasicMaterial({color:'#ef6547'}));boardFrame.position.set(0,4.22,-8.33);scene.add(boardFrame);
box(scene,materials.navy,[0,5.55,-8.73],[.22,2.05,.24]);box(scene,materials.navy,[0,6.53,-8.55],[1.2,.18,.5]);
const rim=mesh(new THREE.TorusGeometry(.67,.075,12,48),materials.rim,scene,[0,hoopY,hoopZ]);
// Net: loose curved strands taper below the orange ring.
const netGroup=new THREE.Group();scene.add(netGroup);for(let i=0;i<12;i++){const a=i*Math.PI*2/12;const pts=[];for(let j=0;j<=7;j++){const t=j/7,r=.62-.25*t;pts.push(new THREE.Vector3(Math.cos(a)*r, -t*.88,Math.sin(a)*r));}const c=new THREE.CatmullRomCurve3(pts);netGroup.add(new THREE.Mesh(new THREE.TubeGeometry(c,12,.018,5,false),materials.net));if(i%2===0){const a2=a+Math.PI/6;const pts2=[];for(let j=0;j<=7;j++){const t=j/7,r=.62-.25*t;pts2.push(new THREE.Vector3(Math.cos(a2)*r,-t*.88,Math.sin(a2)*r));}netGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2),12,.012,4,false),materials.net));}}
netGroup.position.set(0,hoopY-.04,hoopZ-.02);
for(const x of [-.61,.61]){const rod=cylinder(scene,materials.navy,[x,4.3,-8.15],.045,.045,1.25);rod.rotation.x=Math.PI/2;}
// Peach-colored horizon hills, puffy clouds, tiny crowd pennants and mushrooms.
function cloud(x,y,z,s){const g=new THREE.Group();scene.add(g);sphere(g,mat('#fff9ec'),[0,0,0],[1.15*s,.42*s,.38*s]);sphere(g,mat('#fff9ec'),[-.58*s,-.02*s,0],[.62*s,.38*s,.34*s]);sphere(g,mat('#fff9ec'),[.52*s,.08*s,0],[.74*s,.5*s,.4*s]);g.position.set(x,y,z);return g;}
const clouds=[cloud(-8,8,-11,1.2),cloud(7.5,9,-18,1.5),cloud(-4,6,-25,.8),cloud(11,6,-7,.9),cloud(-12,10,-29,1.3)];
for(let i=0;i<9;i++){const x=(i-4)*2.1;const hill=sphere(scene,mat(i%2?'#68c990':'#75d39a'),[x,-1.7,-25-Math.random()*8],[3.3,2.5,2.1]);hill.castShadow=false;}
function mushroom(x,z,s=1){const g=new THREE.Group();scene.add(g);const stem=cylinder(g,materials.cream,[0,.48,0],.26*s,.34*s,.95*s);const cap=sphere(g,materials.red,[0,1.05*s,0],[.69*s,.42*s,.62*s]);for(const [a,b] of [[-.27,.12],[.2,.23],[.1,-.15],[-.1,-.06]])sphere(g,materials.white,[a*s,1.12*s,b*s],[.14*s,.12*s,.13*s]);g.position.set(x,-.1,z);return g;}
mushroom(-8,-4,1.15);mushroom(8,-2,.92);mushroom(-7,-12,.8);mushroom(7,-14,1.05);
for(let i=0;i<10;i++){const x=(i-4.5)*1.62;const pennant=mesh(new THREE.ConeGeometry(.19,.42,3),mat(['#ef5646','#f9c340','#4f9fe6','#65c987'][i%4]),scene,[x,.58,-13.8],false,false);pennant.rotation.z=Math.PI;const pole=cylinder(scene,materials.cream,[x,.28,-13.8],.025,.025,.62,8);}
// Cute blocky Mario-inspired point guard (original procedural geometry).
const mario=new THREE.Group();scene.add(mario);mario.position.set(-1.6,0,2.3);
const overalls=mat('#277bd1'), shirt=mat('#ed493d'), glove=mat('#fffaf1'), buttonMat=mat('#ffdb52');
// feet and legs
for(const x of [-.3,.3]){const leg=cylinder(mario,overalls,[x,.57,0],.18,.2,.65);const shoe=sphere(mario,materials.dark,[x,.2,.08],[.3,.18,.37]);shoe.rotation.x=.1;}
// torso and straps
box(mario,shirt,[0,1.3,0],[.83,.8,.46]);box(mario,overalls,[0,.94,-.004],[.87,.53,.49]);for(const x of [-.27,.27]){const strap=box(mario,overalls,[x,1.35,.245],[.17,.54,.11]);strap.rotation.z=x<0?-.13:.13;sphere(mario,buttonMat,[x,1.47,.31],[.075,.075,.04]);}
// neck/head, ears, bulbous nose, eyebrows and cheerful moustache
cylinder(mario,materials.skin,[0,1.76,0],.18,.18,.22);sphere(mario,materials.skin,[0,2.05,.02],[.48,.46,.42]);for(const x of [-.47,.47])sphere(mario,materials.skin,[x,2.06,0],[.14,.18,.15]);
const face=new THREE.Group();mario.add(face);face.position.z=.37;
for(const x of [-.17,.17]){sphere(face,materials.white,[x,2.11,.015],[.09,.125,.055]);sphere(face,materials.navy,[x,2.1,.065],[.045,.07,.026]);sphere(face,materials.dark,[x-.02,2.28,.01],[.14,.055,.06]);}
sphere(face,materials.skin,[0,1.99,.09],[.2,.15,.17]);for(const x of [-.13,.13]){const st=sphere(face,materials.dark,[x,1.88,.085],[.19,.12,.08]);st.rotation.z=x<0?-.2:.2;}
// red cap with bill and white M badge
sphere(mario,shirt,[0,2.43,-.01],[.56,.25,.49]);sphere(mario,shirt,[0,2.39,.31],[.47,.18,.38]);sphere(mario,materials.white,[0,2.47,.48],[.15,.15,.055]);
const badge=mesh(new THREE.PlaneGeometry(.16,.18),new THREE.MeshBasicMaterial({color:'#ee493d'}),mario,[0,2.47,.535],false,false);badge.rotation.y=0;
// raised shooting arm + white glove
const arm=cylinder(mario,shirt,[.53,1.52,.04],.13,.16,.58);arm.rotation.z=-.66;const gloveBall=sphere(mario,glove,[.76,1.76,.17],[.24,.21,.23]);sphere(mario,glove,[.85,1.7,.3],[.13,.13,.14]);
// Ball with dark raised seams.
const ballGroup=new THREE.Group();scene.add(ballGroup);const ballMesh=mesh(new THREE.SphereGeometry(.29,32,24),mat('#f4812c',.48),ballGroup,[0,0,0]);
const seamMat=new THREE.MeshBasicMaterial({color:'#713921'});for(let i=0;i<3;i++){const curve=new THREE.EllipseCurve(0,0,.285,.285,0,Math.PI*2,false,0);const points=curve.getPoints(50);const geo=new THREE.BufferGeometry().setFromPoints(points);const line=new THREE.Line(geo,seamMat);line.rotation.y=i*Math.PI/3;ballGroup.add(line);}const seam1=mesh(new THREE.TorusGeometry(.287,.012,6,40),seamMat,ballGroup,[0,0,0],false,false);seam1.rotation.y=Math.PI/2;const seam2=mesh(new THREE.TorusGeometry(.287,.012,6,40),seamMat,ballGroup,[0,0,0],false,false);seam2.rotation.x=Math.PI/2;
const ballStart=new THREE.Vector3(-.72,1.88,1.92);ballGroup.position.copy(ballStart);

const aimDots=[];for(let i=0;i<22;i++){const dot=mesh(new THREE.SphereGeometry(.055,8,6),new THREE.MeshBasicMaterial({color:'#fff4c4',transparent:true,opacity:.8-i*.025}),scene,[0,-30,0],false,false);aimDots.push(dot);}
const state={active:false,score:0,combo:0,time:60,aim:0,power:.58,shot:null,chargeStart:0,lastStamp:0,sound:true,drag:null,toastUntil:0,animTime:0};
let audio=null;function tone(frequency,duration=.11,type='sine',volume=.045){if(!state.sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.value=frequency;gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);osc.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);}catch{}}
function setPower(value){state.power=THREE.MathUtils.clamp(value,0,1);shootBtn.style.setProperty('--charge',`${Math.round(state.power*100)}%`);}
function showMessage(text,duration=1100){messageEl.textContent=text;messageEl.classList.add('show');state.toastUntil=performance.now()+duration;}
function resetBall(){state.shot=null;ballGroup.position.copy(ballStart);ballGroup.rotation.set(0,0,0);ballGroup.visible=true;}
function resetRound(){state.score=0;state.combo=0;state.time=60;state.aim=0;setPower(.58);scoreEl.textContent='000';timerEl.innerHTML='60<small>s</small>';comboEl.textContent='×0';resetBall();hintEl.style.opacity='1';state.active=true;state.lastStamp=performance.now();state.particles=[];overlay.classList.add('hidden');}
function startRound(){tone(640,.12);resetRound();}
function endRound(){state.active=false;resetBall();overlay.classList.remove('hidden');document.querySelector('#panelEmoji').textContent=state.score>=20?'🏆 🍄 ⭐':'🏀 🍄 ✨';document.querySelector('#panelTitle').innerHTML='FIM DE<span>JOGO!</span>';document.querySelector('#panelText').textContent=state.score>=20?'A torcida está de pé! Você é a estrela da quadra do Reino Cogumelo.':'Mais uma partida? A cesta está esperando por você!';document.querySelector('#howto').innerHTML='<div class="how-item"><b>🏀</b>PONTOS</div><div class="how-item"><b>🔥</b>SEGUIDAS</div><div class="how-item"><b>⭐</b>ESTRELAS</div>';document.querySelectorAll('#howto .how-item').forEach((el,i)=>el.innerHTML=`<b>${['🏀','🔥','⭐'][i]}</b>${[state.score+' pontos',state.combo+' seguidas',state.score>=20?'Craque!':'Bom jogo!'][i]}`);document.querySelector('#startBtn').textContent='JOGAR DE NOVO  ↻';document.querySelector('#footnote').textContent='A QUADRA É SUA, CRAQUE!';tone(440,.3,'triangle');}
document.querySelector('#startBtn').addEventListener('click',startRound);
function shoot(power=state.power){if(!state.active||state.shot)return;hintEl.style.opacity='0';const t=.82+power*.22;const targetX=THREE.MathUtils.clamp(state.aim*2.35,-2.6,2.6),targetZ=hoopZ;const dx=targetX-ballStart.x,dz=targetZ-ballStart.z,vy=(hoopY-ballStart.y+.5*9.8*t*t)/t;state.shot={t:0,duration:t,p0:ballStart.clone(),vx:dx/t,vy,vz:dz/t,scored:false,checked:false,power};ballGroup.position.copy(ballStart);ballGroup.visible=true;shootBtn.classList.remove('charging');tone(160,.07,'triangle',.022);}
function trajectoryPos(t,shot){return new THREE.Vector3(shot.p0.x+shot.vx*t,shot.p0.y+shot.vy*t-4.9*t*t,shot.p0.z+shot.vz*t);}
function makeShot(power){const t=.82+power*.22;const targetX=THREE.MathUtils.clamp(state.aim*2.35,-2.6,2.6);return{t:0,duration:t,p0:ballStart.clone(),vx:(targetX-ballStart.x)/t,vy:(hoopY-ballStart.y+4.9*t*t)/t,vz:(hoopZ-ballStart.z)/t,power};}
function setAim(value){state.aim=THREE.MathUtils.clamp(value,-1,1);}
document.querySelector('#leftBtn').addEventListener('pointerdown',e=>{e.preventDefault();setAim(state.aim-.13);tone(330,.05);});document.querySelector('#rightBtn').addEventListener('pointerdown',e=>{e.preventDefault();setAim(state.aim+.13);tone(390,.05);});
let holdTimer=null;function beginCharge(e){if(!state.active||state.shot)return;e.preventDefault();shootBtn.setPointerCapture?.(e.pointerId);state.chargeStart=performance.now();shootBtn.classList.add('charging');setPower(.2);holdTimer=setInterval(()=>{if(!state.chargeStart)return;setPower(.2+Math.min(.8,(performance.now()-state.chargeStart)/850)*.8);},35);}
function releaseCharge(e){if(!state.chargeStart)return;e?.preventDefault?.();clearInterval(holdTimer);holdTimer=null;const held=(performance.now()-state.chargeStart)/850;const power=Math.max(.25,Math.min(1,.2+held*.8));state.chargeStart=0;setPower(power);shoot(power);}
shootBtn.addEventListener('pointerdown',beginCharge);shootBtn.addEventListener('pointerup',releaseCharge);shootBtn.addEventListener('pointercancel',releaseCharge);shootBtn.addEventListener('lostpointercapture',()=>{if(state.chargeStart)releaseCharge();});
canvas.addEventListener('pointerdown',e=>{if(!state.active||state.shot)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);state.drag={id:e.pointerId,x:e.clientX,y:e.clientY,aim:state.aim};hintEl.style.opacity='0';});
canvas.addEventListener('pointermove',e=>{if(!state.drag||e.pointerId!==state.drag.id)return;const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;setAim(state.drag.aim+dx/Math.min(innerWidth,600)*1.25);setPower(.25+THREE.MathUtils.clamp(-dy/190,0,.75));});
canvas.addEventListener('pointerup',e=>{if(!state.drag||e.pointerId!==state.drag.id)return;e.preventDefault();const dy=e.clientY-state.drag.y;const charge=THREE.MathUtils.clamp(.25+Math.max(0,-dy)/190,0,1);state.drag=null;shoot(charge);});canvas.addEventListener('pointercancel',()=>state.drag=null);
document.querySelector('#soundBtn').addEventListener('click',e=>{state.sound=!state.sound;e.currentTarget.textContent=state.sound?'♫':'♪';e.currentTarget.setAttribute('aria-label',state.sound?'Desativar som':'Ativar som');if(state.sound)tone(520,.08);});
// Simple procedural crowd cheer made from little colorful spectators.
const spectators=[];for(let i=0;i<22;i++){const x=(i-10.5)*.57;const y=1.12+(i%3)*.035;const z=-13.25;const color=['#f45c4f','#ffc545','#54a9eb','#6acb8b','#b381d8'][i%5];const body=sphere(scene,mat(color),[x,y,z],[.16,.22,.14]);const head=sphere(scene,materials.skin,[x,y+.32,z],[.14,.15,.13]);const hat=sphere(scene,i%4===0?materials.red:materials.yellow,[x,y+.46,z],[.16,.075,.15]);spectators.push({body,head,hat,phase:i*.7});}
const particleGroup=new THREE.Group();scene.add(particleGroup);const particles=[];
function burst(position,count=20){for(let i=0;i<count;i++){const color=['#ffdc52','#fff6da','#ef5b42','#55c4e8'][i%4];const p=mesh(new THREE.IcosahedronGeometry(.07+Math.random()*.06,0),mat(color,.5),particleGroup,position.toArray(),false,false);p.userData.velocity=new THREE.Vector3((Math.random()-.5)*5,Math.random()*5+1,(Math.random()-.5)*4);p.userData.life=.7+Math.random()*.8;particles.push(p);}}
function updateAim(){if(!state.active||state.shot){aimDots.forEach(d=>d.position.y=-30);return;}const preview=makeShot(Math.max(.45,state.power));for(let i=0;i<aimDots.length;i++){const dot=aimDots[i],t=preview.duration*(i+1)/(aimDots.length+1),p=trajectoryPos(t,preview);dot.position.copy(p);dot.material.opacity=.8-i*.025;dot.scale.setScalar(i<2?.65:1);}}
function updateBall(dt){if(!state.shot)return;const s=state.shot;const prev=ballGroup.position.clone();s.t+=dt;const t=Math.min(s.t,s.duration);ballGroup.position.copy(trajectoryPos(t,s));ballGroup.rotation.x+=dt*6;ballGroup.rotation.y+=dt*4;
if(!s.checked&&prev.z>hoopZ&&ballGroup.position.z<=hoopZ+.12){s.checked=true;const x=ballGroup.position.x,y=ballGroup.position.y;const swish=Math.abs(x)<.43&&Math.abs(y-hoopY)<.42;if(swish){s.scored=true;state.score+=2+(state.combo>=2?1:0);state.combo++;scoreEl.textContent=String(state.score).padStart(3,'0');comboEl.textContent=`×${state.combo}`;showMessage(state.combo>=3?'SEQUÊNCIA! 🔥':'CESTAAA! ✨',1200);tone(660,.17,'sine',.055);setTimeout(()=>tone(880,.23,'sine',.05),90);burst(new THREE.Vector3(x,hoopY,hoopZ),24);netGroup.rotation.z=(Math.random()-.5)*.16;}else{state.combo=0;comboEl.textContent='×0';showMessage(Math.abs(x)<.9?'QUASE!':'TENTE DE NOVO',750);tone(115,.12,'triangle',.035);}}
if(s.t>=s.duration){if(!s.scored&&ballGroup.position.y>.4){ballGroup.position.y=.35;ballGroup.position.z-=.1;}state.shot=null;setTimeout(()=>{if(!state.shot)resetBall();},s.scored?350:550);}}
function resize(){camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<600?48:43;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);}
window.addEventListener('resize',resize,{passive:true});
function frame(now){requestAnimationFrame(frame);const dt=Math.min(.04,(now-(state.lastStamp||now))/1000);state.lastStamp=now;state.animTime+=dt;
if(state.active){state.time-=dt;if(state.time<=0){state.time=0;endRound();}timerEl.innerHTML=`${Math.ceil(state.time)}<small>s</small>`;if(state.time<10)timerEl.style.color=state.time%1<.5?'#e64a3b':'#ffb32b';else timerEl.style.color='';}
if(state.toastUntil&&now>state.toastUntil){messageEl.classList.remove('show');state.toastUntil=0;}
if(state.active&&!state.shot&&!state.drag){mario.position.y=Math.sin(now*.004)*.025;mario.rotation.y=Math.sin(now*.0015)*.035;ballGroup.position.copy(ballStart);ballGroup.position.y+=Math.sin(now*.004)*.04;}
if(state.shot)updateBall(dt);updateAim();netGroup.rotation.z*=.9;netGroup.rotation.x*=.9;for(const c of clouds)c.position.x+=Math.sin(now*.00014+c.position.z)*.0004;
for(const sp of spectators){sp.body.position.y=1.12+Math.abs(Math.sin(now*.006+sp.phase))*.11;sp.head.position.y=sp.body.position.y+.32;sp.hat.position.y=sp.body.position.y+.46;}
for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.userData.life-=dt;p.position.addScaledVector(p.userData.velocity,dt);p.userData.velocity.y-=8*dt;p.rotation.x+=dt*7;p.rotation.z+=dt*5;p.scale.multiplyScalar(Math.max(.01,1-dt*.65));if(p.userData.life<=0){particleGroup.remove(p);p.geometry.dispose();p.material.dispose();particles.splice(i,1);}}
renderer.render(scene,camera);}
requestAnimationFrame(frame);
