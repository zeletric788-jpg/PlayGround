import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const $ = (id) => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bbdb4);
scene.fog = new THREE.FogExp2(0x9bbdb4, 0.0085);
const camera = new THREE.PerspectiveCamera(57, innerWidth / innerHeight, 0.1, 260);
const renderer = new THREE.WebGLRenderer({ canvas: $('world'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const hemi = new THREE.HemisphereLight(0xcbe8e6, 0x4d4839, 2.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe6c1, 3.1); sun.position.set(-32, 54, 25); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -52; sun.shadow.camera.right = 52; sun.shadow.camera.top = 52; sun.shadow.camera.bottom = -52; sun.shadow.bias = -0.00025; sun.shadow.normalBias = 0.025; scene.add(sun);
const fill = new THREE.DirectionalLight(0x8dd8dc, 1.05); fill.position.set(35, 18, -36); scene.add(fill);
const clock = new THREE.Clock();
const world = new THREE.Group(); scene.add(world);
const mats = {
  bark: new THREE.MeshStandardMaterial({ color: 0x51483a, roughness: 0.92 }),
  leaf1: new THREE.MeshStandardMaterial({ color: 0x315e4b, roughness: .88 }),
  leaf2: new THREE.MeshStandardMaterial({ color: 0x49785a, roughness: .84 }),
  leaf3: new THREE.MeshStandardMaterial({ color: 0x73936a, roughness: .78 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x797c70, roughness: .92 }),
  stoneLight: new THREE.MeshStandardMaterial({ color: 0xb5ab8e, roughness: .85 }),
  path: new THREE.MeshStandardMaterial({ color: 0x877b62, roughness: .98 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x66805c, roughness: 1 }),
  water: new THREE.MeshPhysicalMaterial({ color: 0x55bdb5, roughness: .16, metalness: .14, transmission: .1, transparent: true, opacity: .76, clearcoat: 1 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd8bd79, metalness: .68, roughness: .28 }),
  crystal: new THREE.MeshPhysicalMaterial({ color: 0x8af5df, emissive: 0x29bda8, emissiveIntensity: 2.3, roughness: .15, metalness: .12, transmission: .35, transparent: true, opacity: .9, clearcoat: 1 }),
  crystalBlue: new THREE.MeshStandardMaterial({ color: 0x7eb9ff, emissive: 0x3288ff, emissiveIntensity: 1.5, transparent: true, opacity: .8, roughness: .2 }),
};
const mat = (color, roughness=.8, extra={}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const mesh = (geo, material, parent=world, cast=true) => { const m = new THREE.Mesh(geo, material); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
const boxGeo = new THREE.BoxGeometry(1,1,1);
const v3 = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);

function terrainHeight(x,z) {
  const broad = Math.sin(x*.075 + z*.035)*.85 + Math.cos(z*.095-x*.035)*.58;
  const hills = Math.max(0, Math.sin((z+34)*.055))*Math.max(0, Math.cos(x*.06)) * 2.1;
  const flat = Math.exp(-(x*x+Math.pow(z+3,2))*.0015);
  return (broad + hills) * (1-flat*.78);
}
function createTerrain() {
  const n=160, size=190, positions=[], colors=[], indices=[];
  const c1=new THREE.Color(0x344c3e), c2=new THREE.Color(0x718365), c3=new THREE.Color(0xb2a47d);
  for(let iz=0;iz<=n;iz++) for(let ix=0;ix<=n;ix++) {
    const x=(ix/n-.5)*size, z=(iz/n-.5)*size, y=terrainHeight(x,z);
    positions.push(x,y,z);
    const t=THREE.MathUtils.clamp((y+.35)/3.2,0,1), col=c1.clone().lerp(c2,t).lerp(c3,Math.max(0,(y-2.2)*.1)); colors.push(col.r,col.g,col.b);
    if(ix<n&&iz<n){const a=iz*(n+1)+ix,b=a+n+1;indices.push(a,b,a+1,b,b+1,a+1);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
  const ground=mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1}),world,false);ground.receiveShadow=true;
  const pathMat=new THREE.MeshStandardMaterial({color:0x9b8968,roughness:1});
  for(let i=0;i<32;i++) {const z=7-i*1.35,x=Math.sin(i*.22)*1.0;const stone=mesh(new THREE.CylinderGeometry(.42+Math.sin(i)*.08,.48,.06,7),pathMat);stone.position.set(x,terrainHeight(x,z)+.035,z);stone.rotation.y=i*.4;}
}
createTerrain();

// Layered atmosphere dome and distant mountain silhouettes.
const skyGeo=new THREE.SphereGeometry(240,32,18);
const skyMat=new THREE.ShaderMaterial({ side:THREE.BackSide, uniforms:{top:{value:new THREE.Color(0x477f83)},horizon:{value:new THREE.Color(0xd5cba7)}}, vertexShader:'varying vec3 vWorld; void main(){vec4 w=modelMatrix*vec4(position,1.0);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}', fragmentShader:'uniform vec3 top;uniform vec3 horizon;varying vec3 vWorld;void main(){float h=normalize(vWorld).y;float t=smoothstep(-.05,.48,h);gl_FragColor=vec4(mix(horizon,top,t),1.0);}' });
scene.add(new THREE.Mesh(skyGeo,skyMat));
const mountainMat=[mat(0x66796e,1),mat(0x788476,1),mat(0x596d65,1)];
for(let i=0;i<34;i++){const a=i/34*Math.PI*2, r=83+(i%4)*6, h=15+(i*17%23), radius=13+(i%5)*2;const geo=new THREE.ConeGeometry(radius,h,7);const m=mesh(geo,mountainMat[i%3],world,false);m.position.set(Math.sin(a)*r,h*.32-1,Math.cos(a)*r-15);m.rotation.y=a*.3;}

// Wind-swept forest, modeled from layered organic forms rather than billboards.
const rng=(()=>{let s=270119;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};})();
function makePine(x,z,scale=1) {
  const y=terrainHeight(x,z),g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);world.add(g);
  const trunk=mesh(new THREE.CylinderGeometry(.16,.29,3.8,7),mats.bark,g);trunk.position.y=1.8;
  for(let j=0;j<4;j++){const h=2.1+j*.68,r=1.55-j*.25;const crown=mesh(new THREE.ConeGeometry(r,2.65-j*.18,8),[mats.leaf1,mats.leaf2,mats.leaf3][(j+Math.floor(x))%3<0?1:(j+Math.floor(x))%3],g);crown.position.set((rng()-.5)*.24,h,0);crown.rotation.y=rng()*Math.PI;}
}
function makeBroadleaf(x,z,scale=1){const y=terrainHeight(x,z),g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);world.add(g);const trunk=mesh(new THREE.CylinderGeometry(.17,.32,3.4,8),mats.bark,g);trunk.position.y=1.6;for(let i=0;i<7;i++){const r=.72+rng()*.52;const c=mesh(new THREE.IcosahedronGeometry(r,2),[mats.leaf1,mats.leaf2,mats.leaf3][i%3],g);c.position.set((rng()-.5)*2.1,2.8+rng()*1.6,(rng()-.5)*2.1);c.scale.y=.8+rng()*.5;}}
for(let i=0;i<105;i++) {const side=rng()<.5?-1:1,z=-61+rng()*112, x=side*(8+rng()*39);if(Math.abs(z+29)<10&&Math.abs(x)<20)continue;makePine(x,z,.68+rng()*.72);}
for(let i=0;i<28;i++){const x=(rng()-.5)*72,z=-58+rng()*95;if(Math.abs(x)<8)continue;makeBroadleaf(x,z,.6+rng()*.62);}

// Stream with a glinting ribbon and pebble banks.
const waterGeo=new THREE.BufferGeometry(), wp=[], wi=[];
for(let i=0;i<=80;i++){const z=22-i*1.25,x=9+Math.sin(i*.11)*2.7,y=terrainHeight(x,z)+.13;wp.push(x-.7,y,z,x+.7,y,z);if(i<80){const a=i*2;wi.push(a,a+2,a+1,a+1,a+2,a+3);}}
waterGeo.setAttribute('position',new THREE.Float32BufferAttribute(wp,3));waterGeo.setIndex(wi);waterGeo.computeVertexNormals();const stream=mesh(waterGeo,mats.water,world,false);stream.material.side=THREE.DoubleSide;
for(let i=0;i<65;i++){const z=18-rng()*96,x=9+Math.sin((22-z)/1.25*.11)*2.7+(rng()-.5)*2.8;const peb=mesh(new THREE.DodecahedronGeometry(.15+rng()*.3,0),i%3?mats.stone:mats.stoneLight);peb.position.set(x,terrainHeight(x,z)+.12,z);peb.scale.y=.55;}

// Ancient arch and sanctuary platform.
const shrine=new THREE.Group();shrine.position.set(0,terrainHeight(0,-38),-38);world.add(shrine);
const platform=mesh(new THREE.CylinderGeometry(5.2,5.7,.65,12),mat(0x6a7266,.78),shrine);platform.position.y=.2;
const ring=mesh(new THREE.TorusGeometry(3.75,.09,8,64),mats.gold,shrine);ring.rotation.x=Math.PI/2;ring.position.y=.59;
for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const rock=mesh(new THREE.DodecahedronGeometry(1.2,1),mats.stone,shrine);rock.position.set(Math.cos(a)*4.65,.55,Math.sin(a)*4.65);rock.scale.set(.9,1.8,.8);rock.rotation.z=(rng()-.5)*.15;}
const archL=mesh(new THREE.BoxGeometry(.55,4.2,.65),mats.stoneLight,shrine);archL.position.set(-2.2,2.4,-.8);archL.rotation.z=-.12;
const archR=mesh(new THREE.BoxGeometry(.55,4.2,.65),mats.stoneLight,shrine);archR.position.set(2.2,2.4,-.8);archR.rotation.z=.12;
const archTop=mesh(new THREE.BoxGeometry(4.5,.55,.72),mats.stoneLight,shrine);archTop.position.set(0,4.55,-.8);
for(let i=0;i<4;i++){const rune=mesh(new THREE.BoxGeometry(.07,.6,.035),mats.crystal,shrine,false);rune.position.set(-1.3+i*.85,2.8,-1.15);}
const runeLight=new THREE.PointLight(0x67f2cf,2.3,15);runeLight.position.set(0,3,-1);shrine.add(runeLight);

// Player adventurer with articulated limbs, layered clothes and travel gear.
const player=new THREE.Group();world.add(player);player.position.set(0,terrainHeight(0,8),8);
const model=new THREE.Group();player.add(model);
const skin=mat(0xc8916e,.68),cloth=mat(0x293d39,.82),cloakMat=mat(0x566d57,.8),leather=mat(0x795b3e,.7),dark=mat(0x252c2a,.8),bright=mat(0xc7a869,.36,{metalness:.5});
const torso=mesh(new THREE.CapsuleGeometry(.43,.75,5,9),cloth,model);torso.position.y=1.52;
const chest=mesh(new THREE.BoxGeometry(.72,.65,.14),cloakMat,model);chest.position.set(0,1.63,.02);
const belt=mesh(new THREE.CylinderGeometry(.43,.43,.12,10),leather,model);belt.position.y=1.18;
const head=mesh(new THREE.SphereGeometry(.31,16,12),skin,model);head.position.y=2.25;head.scale.set(.9,1.05,.9);
const hair=mesh(new THREE.SphereGeometry(.32,12,8),dark,model);hair.position.set(0,2.42,-.035);hair.scale.set(1,.55,1.02);
const scarf=mesh(new THREE.BoxGeometry(.75,.16,.68),mat(0xb77b4d),model);scarf.position.set(0,2.02,-.04);
const cape=mesh(new THREE.ConeGeometry(.65,1.38,4),cloakMat,model);cape.position.set(0,1.28,-.38);cape.rotation.x=-.14;cape.scale.z=.35;
const pack=mesh(new THREE.BoxGeometry(.44,.55,.28),leather,model);pack.position.set(0,1.58,-.38);
const shoulder=new THREE.Group();shoulder.position.set(.48,1.8,0);model.add(shoulder);const arm=mesh(new THREE.CapsuleGeometry(.14,.48,4,7),cloth,shoulder);arm.position.y=-.3;const hand=mesh(new THREE.SphereGeometry(.14,9,7),skin,shoulder);hand.position.y=-.65;
const shoulder2=new THREE.Group();shoulder2.position.set(-.48,1.8,0);model.add(shoulder2);const arm2=mesh(new THREE.CapsuleGeometry(.14,.48,4,7),cloth,shoulder2);arm2.position.y=-.3;const hand2=mesh(new THREE.SphereGeometry(.14,9,7),skin,shoulder2);hand2.position.y=-.65;
const legs=[];for(const x of [-.22,.22]){const pivot=new THREE.Group();pivot.position.set(x,1.0,0);model.add(pivot);const leg=mesh(new THREE.CapsuleGeometry(.18,.57,4,7),dark,pivot);leg.position.y=-.37;const boot=mesh(new THREE.BoxGeometry(.31,.18,.43),leather,pivot);boot.position.set(0,-.7,.08);legs.push(pivot);}
const swordGroup=new THREE.Group();swordGroup.position.set(.56,1.1,.12);model.add(swordGroup);const blade=mesh(new THREE.BoxGeometry(.1,.82,.055),bright,swordGroup);blade.position.y=.4;const grip=mesh(new THREE.CylinderGeometry(.055,.055,.32,7),leather,swordGroup);grip.position.y=-.14;const guard=mesh(new THREE.BoxGeometry(.36,.07,.08),mats.gold,swordGroup);guard.position.y=-.02;swordGroup.rotation.z=-.27;
const playerAura=new THREE.PointLight(0x70e2c6,0,6);playerAura.position.y=1.7;player.add(playerAura);

// Floating spectral adversaries with luminous cores and orbiting shards.
const enemies=[];
function makeEnemy(x,z,index){const g=new THREE.Group();g.position.set(x,terrainHeight(x,z),z);world.add(g);const shell=mat(0x394b59,.43,{metalness:.48,emissive:0x101c28});const glow=mat(0x81dfff,.24,{metalness:.1,emissive:0x287fc5,emissiveIntensity:1.9,transparent:true,opacity:.88});
 const body=mesh(new THREE.CapsuleGeometry(.42,.82,5,8),shell,g);body.position.y=1.15;const head=mesh(new THREE.IcosahedronGeometry(.36,1),shell,g);head.position.y=2.0;head.scale.set(.85,1.1,.7);const core=mesh(new THREE.OctahedronGeometry(.25,1),glow,g);core.position.set(0,1.45,.37);const eyeMat=new THREE.MeshBasicMaterial({color:0xb8f7ff});for(const s of [-1,1]){const eye=mesh(new THREE.SphereGeometry(.045,8,6),eyeMat,g,false);eye.position.set(s*.12,2.03,.3);}
 const limbs=[];for(const xx of [-.52,.52]){const l=mesh(new THREE.CapsuleGeometry(.13,.5,4,6),shell,g);l.position.set(xx,1.2,0);limbs.push(l);}
 for(let k=0;k<3;k++){const shard=mesh(new THREE.TetrahedronGeometry(.16,0),glow,g);shard.position.set(Math.cos(k*2.1)*.7,1.5+Math.sin(k*2.1)*.4,Math.sin(k*2.1)*.6);}
 const light=new THREE.PointLight(0x5bc8ff,1.6,6);light.position.y=1.7;g.add(light);enemies.push({group:g,hp:3,maxHp:3,alive:true,attack:1.2+index*.8,phase:index*.9,body,limbs,core});}

// Crystal remains unbound until the trial concludes — even a failed trial leaves a path forward.
let crystal=null, crystalActive=false, started=false, trialState='travel', trialTime=0, trialLength=27, obtained=false, awakened=false, health=100, kills=0, toastTimer=0, attackCooldown=0, dodgeTime=0, hurtCooldown=0, walkPhase=0, isMoving=false;
const crystalGroup=new THREE.Group();crystalGroup.position.set(0,terrainHeight(0,-38)+1.55,-38);world.add(crystalGroup);crystalGroup.visible=false;
const crystalCore=mesh(new THREE.OctahedronGeometry(.72,1),mats.crystal,crystalGroup,false);crystalCore.scale.set(.68,1.5,.68);
const crystalShard=mesh(new THREE.OctahedronGeometry(.36,0),mats.crystalBlue,crystalGroup,false);crystalShard.position.set(.8,-.25,.25);crystalShard.rotation.set(.4,.6,.3);
const crystalLight=new THREE.PointLight(0x5af2d6,4.5,17);crystalLight.position.y=.7;crystalGroup.add(crystalLight);
const crystalRing=mesh(new THREE.TorusGeometry(1.1,.022,6,48),mats.crystal,crystalGroup,false);crystalRing.rotation.x=Math.PI/2;
const motes=[];for(let i=0;i<48;i++){const m=mesh(new THREE.SphereGeometry(.035+rng()*.035,6,5),mat(i%2?0xa9ffe8:0xffe0a2,.2,{emissive:i%2?0x4bdfbb:0xc78740,emissiveIntensity:1.5}),world,false);m.visible=false;motes.push({mesh:m,a:rng()*Math.PI*2,r:1+rng()*3.5,s:.4+rng()*1.3,h:rng()*3});}
const particles=[];
function burst(position,color=0x9df5dc,count=20){for(let i=0;i<count;i++){const p=mesh(new THREE.SphereGeometry(.045+rng()*.04,6,5),new THREE.MeshBasicMaterial({color,transparent:true}),world,false);p.position.copy(position);const vel=new THREE.Vector3((rng()-.5)*5,rng()*5,(rng()-.5)*5);particles.push({mesh:p,vel,life:.65+rng()*.9,max:1});}}

let yaw=0, cameraPitch=.12, cameraDistance=7.6, cameraLookOffset=1.35;
const keys={};
window.addEventListener('keydown',e=>{keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyE')interact();if(e.code==='KeyF'||e.code==='Enter')attack();if(e.code==='Space')dodge();});
window.addEventListener('keyup',e=>keys[e.code]=false);
$('world').addEventListener('click',()=>{if(started && !isTouch) $('world').requestPointerLock?.(); else attack();});
let isTouch=matchMedia('(pointer:coarse)').matches;
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===$('world')){yaw-=e.movementX*.0028;cameraPitch=THREE.MathUtils.clamp(cameraPitch-e.movementY*.0015,-.05,.44);}});
$('start-button').addEventListener('click',()=>{started=true;$('intro-screen').classList.add('hidden');$('topbar').classList.remove('ui-hidden');$('hud-bottom').classList.remove('ui-hidden');$('world-label').classList.remove('ui-hidden');if(!isTouch)$('world').requestPointerLock?.();announce('A trilha antiga leva ao santuário.');});
$('return-button').addEventListener('click',()=>{$('fail-screen').classList.add('hidden');health=75;player.position.set(0,terrainHeight(0,-29),-29);trialState='crystal';spawnCrystal('A prova terminou. Ainda assim, algo respondeu ao seu chamado.');updateHealth();});
$('continue-button').addEventListener('click',()=>{$('story-screen').classList.add('hidden');$('continue-button').classList.add('hidden');});
for(const btn of document.querySelectorAll('[data-move]')){btn.addEventListener('pointerdown',e=>{e.preventDefault();keys['Touch'+btn.dataset.move]=true;});for(const ev of ['pointerup','pointercancel','pointerleave'])btn.addEventListener(ev,()=>keys['Touch'+btn.dataset.move]=false);}
$('mobile-dodge').addEventListener('pointerdown',e=>{e.preventDefault();dodge();});$('mobile-attack').addEventListener('pointerdown',e=>{e.preventDefault();attack();});$('mobile-interact').addEventListener('pointerdown',e=>{e.preventDefault();interact();});

function announce(text){const el=$('combat-toast');el.textContent=text;el.classList.add('show');toastTimer=3.0;}
function updateQuest(title,subtitle,progress){$('quest-title').textContent=title;$('quest-subtitle').textContent=subtitle;$('quest-progress').style.width=`${progress}%`;}
function updateHealth(){$('health-text').textContent=Math.ceil(health);$('health-bar').style.width=`${Math.max(0,health)}%`;}
function spawnCrystal(message){if(crystalActive)return;crystalActive=true;trialState='crystal';crystalGroup.visible=true;for(const p of motes)p.mesh.visible=true;burst(crystalGroup.position.clone(),0x9affdf,60);announce(message);updateQuest('A manifestação','Aproxime-se do cristal e pressione E.',100);}
function trialBegin(){if(trialState!=='travel')return;trialState='trial';trialTime=trialLength;kills=0;makeEnemy(-5,-28,0);makeEnemy(5,-33,1);makeEnemy(0,-21,2);updateQuest('Prova de sobrevivência','Resista à manifestação até o cristal surgir.',100);announce('A energia despertou. Sobreviva à prova!');}
function finishTrial(success){if(trialState!=='trial')return;trialState='crystal';if(success){announce('A prova foi superada. A energia toma forma!');spawnCrystal('Você sobreviveu. Um cristal se manifesta.');}else{$('fail-screen').classList.remove('hidden');announce('A prova falhou — mas a energia ainda responde.');}}
function nearestEnemy(){let best=null,dist=Infinity;for(const e of enemies)if(e.alive){const d=e.group.position.distanceTo(player.position);if(d<dist){dist=d;best=e;}}return {enemy:best,dist};}
function attack(){if(!started||attackCooldown>0||$('story-screen').classList.contains('hidden')===false)return;attackCooldown=.58;shoulder.rotation.x=-1.05;swordGroup.rotation.z=-1.25;setTimeout(()=>{shoulder.rotation.x=0;swordGroup.rotation.z=-.27;},210);const {enemy,dist}=nearestEnemy();if(enemy&&dist<3.6){enemy.hp--;enemy.group.position.add(new THREE.Vector3(Math.sin(yaw)*.65,0,-Math.cos(yaw)*.65));burst(enemy.group.position.clone().add(v3(0,1.45,0)),0x91eaff,11);enemy.group.scale.setScalar(.91);setTimeout(()=>enemy.group.scale.setScalar(1),100);if(enemy.hp<=0){enemy.alive=false;world.remove(enemy.group);kills++;burst(enemy.group.position.clone().add(v3(0,1,0)),0x74d9fa,23);announce('A sombra se desfez.');if(trialState==='trial'&&enemies.every(e=>!e.alive))finishTrial(true);}else announce('Golpe certeiro.');} }
function dodge(){if(!started||dodgeTime>0)return;dodgeTime=.58;hurtCooldown=.68;playerAura.intensity=2.4;setTimeout(()=>playerAura.intensity=awakened?1.3:0,400);burst(player.position.clone().add(v3(0,.7,0)),0xadebd8,8);}
function interact(){if(!started)return;if(trialState==='crystal'&&crystalActive&&!obtained&&player.position.distanceTo(crystalGroup.position)<5.2){obtained=true;crystalActive=false;crystalGroup.visible=false;for(const p of motes)p.mesh.visible=false;$('crystal-count').textContent='1';updateQuest('O sentido da ambição','Você encontrou um cristal. Descubra o que realmente deseja.',100);$('story-screen').classList.remove('hidden');$('story-kicker').textContent='O CRISTAL RESPONDE AO SEU TOQUE';$('story-title').textContent='O que move você?';$('story-copy').textContent='O cristal existe. Seu poder, não. A energia mostra duas faces da mesma pergunta — qual verdade você está disposto a assumir?';$('choice-list').innerHTML='';$('continue-button').classList.add('hidden');const options=[['Proteger quem não pode se defender','Minha força existe para que outros possam escolher.','guardião'],['Conquistar um lugar que ninguém possa tirar','Não aceitarei que decidam meu destino por mim.','soberano']];for(const [title,desc,kind]of options){const b=document.createElement('button');b.className='choice-button';b.innerHTML=`<strong>${title}</strong><span>${desc}</span>`;b.addEventListener('click',()=>awaken(kind));$('choice-list').appendChild(b);}burst(player.position.clone().add(v3(0,1.2,0)),0xa5ffdf,35);return;}
 if(obtained&&!awakened&&player.position.distanceTo(crystalGroup.position)<8){$('story-screen').classList.remove('hidden');return;}
 if(player.position.distanceTo(shrine.position)<8&&!crystalActive&&!obtained&&trialState==='travel'){announce('Siga pela trilha até o coração do santuário.');}}
function awaken(kind){awakened=true;$('choice-list').innerHTML='';$('story-kicker').textContent=kind==='guardião'?'DESPERTAR · JURAMENTO VERDE':'DESPERTAR · VONTADE DE FERRO';$('story-title').textContent=kind==='guardião'?'A força de proteger':'O poder de escolher';$('story-copy').textContent=kind==='guardião'?'O cristal se torna um guardião vivo. Sua ambição não desaparece: agora, ela tem um propósito que vai além de você. Uma aura verde envolve suas mãos.':'O cristal se torna uma lâmina de vontade. Sua ambição não pede desculpas — ela assume o preço e a responsabilidade de cada escolha. Fragmentos azuis orbitam você.';$('power-label').textContent=kind==='guardião'?'JURAMENTO VERDE':'VONTADE DE FERRO';playerAura.color.set(kind==='guardião'?0x71ffc0:0x72aaff);playerAura.intensity=2.4;playerAura.distance=10;burst(player.position.clone().add(v3(0,1,0)),kind==='guardião'?0x84ffb3:0x79aaff,58);announce(kind==='guardião'?'Poder desperto: a vida recupera seu vigor.':'Poder desperto: seus golpes alcançam mais longe.');$('continue-button').classList.remove('hidden');$('continue-button').onclick=()=>{$('story-screen').classList.add('hidden');$('continue-button').classList.add('hidden');};}

function receiveDamage(amount){if(hurtCooldown>0||dodgeTime>0||trialState!=='trial')return;health=Math.max(0,health-amount);hurtCooldown=.8;updateHealth();$('damage-flash').classList.add('hit');setTimeout(()=>$('damage-flash').classList.remove('hit'),160);announce('Você foi atingido.');if(health<=0)finishTrial(false);}
function updateEnemies(dt,t){for(const e of enemies){if(!e.alive)continue;e.phase+=dt*2;const p=e.group.position,dx=player.position.x-p.x,dz=player.position.z-p.z,dist=Math.hypot(dx,dz);e.group.position.y=terrainHeight(p.x,p.z)+Math.sin(e.phase)*.12;e.group.rotation.y=Math.atan2(dx,dz);e.body.position.y=1.15+Math.sin(e.phase*2)*.07;e.core.rotation.y=t*1.3;if(dist>1.65){p.x+=dx/dist*dt*.9;p.z+=dz/dist*dt*.9;}else{e.attack-=dt;if(e.attack<=0){e.attack=2.15;receiveDamage(11);}}for(let i=0;i<e.limbs.length;i++)e.limbs[i].rotation.x=Math.sin(e.phase+i*Math.PI)*.3;}}

const cameraTarget=v3();
function updatePlayer(dt,t){if(!started)return;const forward=keys.KeyW||keys.ArrowUp||keys.Touchforward,right=keys.KeyD||keys.ArrowRight||keys.Touchright,back=keys.KeyS||keys.ArrowDown||keys.Touchback,left=keys.KeyA||keys.ArrowLeft||keys.Touchleft;let mx=(right?1:0)-(left?1:0),mz=(forward?1:0)-(back?1:0);const moving=mx!==0||mz!==0;isMoving=moving;
 if(moving){const len=Math.hypot(mx,mz);mx/=len;mz/=len;const sx=Math.sin(yaw),cz=Math.cos(yaw);const vx=mx*Math.cos(yaw)+mz*Math.sin(yaw),vz=mx*Math.sin(yaw)-mz*Math.cos(yaw);const speed=dodgeTime>0?10:4.7;player.position.x+=vx*speed*dt;player.position.z+=vz*speed*dt;player.position.x=THREE.MathUtils.clamp(player.position.x,-48,48);player.position.z=THREE.MathUtils.clamp(player.position.z,-78,58);const targetRot=Math.atan2(vx,-vz);model.rotation.y=THREE.MathUtils.dampAngle?THREE.MathUtils.dampAngle(model.rotation.y,targetRot,12,dt):model.rotation.y+Math.atan2(Math.sin(targetRot-model.rotation.y),Math.cos(targetRot-model.rotation.y))*Math.min(1,dt*12);walkPhase+=dt*10*(dodgeTime>0?1.7:1);legs[0].rotation.x=Math.sin(walkPhase)*.58;legs[1].rotation.x=-Math.sin(walkPhase)*.58;shoulder.rotation.x=-Math.sin(walkPhase)*.28;shoulder2.rotation.x=Math.sin(walkPhase)*.28;cape.rotation.x=-.14+Math.sin(t*7)*.07;}else{legs[0].rotation.x*=.8;legs[1].rotation.x*=.8;shoulder.rotation.x*=.8;shoulder2.rotation.x*=.8;model.position.y=Math.sin(t*1.7)*.018;}
 player.position.y=terrainHeight(player.position.x,player.position.z);if(dodgeTime>0){player.position.x+=Math.sin(model.rotation.y)*dt*2.1;player.position.z-=Math.cos(model.rotation.y)*dt*2.1;}cameraTarget.set(player.position.x,player.position.y+cameraLookOffset,player.position.z);const dist=cameraDistance;const desired=v3(player.position.x+Math.sin(yaw)*dist,player.position.y+3.3+cameraPitch*5,player.position.z+Math.cos(yaw)*dist);camera.position.lerp(desired,1-Math.exp(-dt*5.2));camera.lookAt(cameraTarget);
 const d=player.position.distanceTo(shrine.position);if(trialState==='travel'){const progress=THREE.MathUtils.clamp((8-player.position.z)/46*100,5,90);$('quest-progress').style.width=`${progress}%`;if(d<17)trialBegin();}
 if(trialState==='trial'){trialTime-=dt;updateEnemies(dt,t);$('quest-subtitle').textContent=`Resista à manifestação · ${Math.max(0,Math.ceil(trialTime))} s`;if(trialTime<=0)finishTrial(true);}
 const nearCrystal=crystalActive&&!obtained&&player.position.distanceTo(crystalGroup.position)<5.2;const nearEnemy=nearestEnemy().dist<3.5;$('interaction').classList.toggle('show',nearCrystal);if(nearCrystal)$('interaction-text').textContent='Reivindicar o cristal';if(!nearCrystal)$('interaction').classList.remove('show');$('reticle').style.opacity=nearEnemy?'1':'0';
}

function updateEnvironment(dt,t){sun.position.x=-32+Math.sin(t*.035)*10;skyMat.uniforms?.top.value.setHSL(.49,.24,.42+Math.sin(t*.025)*.018);if(crystalActive){crystalGroup.position.y=terrainHeight(0,-38)+1.55+Math.sin(t*1.5)*.17;crystalCore.rotation.y=t*.45;crystalCore.rotation.z=Math.sin(t*.7)*.08;crystalShard.rotation.y=-t*.8;crystalRing.rotation.z=t*.4;for(const p of motes){p.a+=dt*p.s;p.mesh.position.set(crystalGroup.position.x+Math.cos(p.a)*p.r,crystalGroup.position.y+Math.sin(p.a*1.3)*.65+p.h,crystalGroup.position.z+Math.sin(p.a)*p.r);}}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;p.mesh.position.addScaledVector(p.vel,dt);p.vel.y-=5*dt;p.mesh.material.opacity=Math.max(0,p.life);p.mesh.scale.setScalar(Math.max(.05,p.life));if(p.life<=0){world.remove(p.mesh);particles.splice(i,1);}}
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('combat-toast').classList.remove('show');}
 attackCooldown=Math.max(0,attackCooldown-dt);dodgeTime=Math.max(0,dodgeTime-dt);hurtCooldown=Math.max(0,hurtCooldown-dt);
}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;updatePlayer(dt,t);updateEnvironment(dt,t);renderer.render(scene,camera);}
animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));});
