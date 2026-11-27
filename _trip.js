// The PARKSIDE – dvorek v0.1
// Mapa podle plánku: 1 px plánku = 2,5 cm (plánek 1203×1373 px ≈ 30×34 m)
{
const S=1/40,OX=658,OY=738;
const X=p=>(p-OX)*S,Z=p=>(p-OY)*S;
const $=id=>document.getElementById(id);
const {M,BOX,SPH,CYL,CONE}=PS;
// ---------- grafika: lineární barvy + PBR materiály (podle Outpost Siege) ----------
const LIN=c=>(c&&c.isColor?c.clone():new THREE.Color(c)).convertSRGBToLinear();
function STDM(o={}){o=Object.assign({},o);if(o.color!==undefined)o.color=LIN(o.color);if(o.emissive!==undefined)o.emissive=LIN(o.emissive);if(o.map)o.map.encoding=THREE.sRGBEncoding;return new THREE.MeshStandardMaterial(Object.assign({roughness:.82,metalness:0},o))}
function BASM(o={}){o=Object.assign({},o);if(o.color!==undefined)o.color=LIN(o.color);if(o.map)o.map.encoding=THREE.sRGBEncoding;return new THREE.MeshBasicMaterial(o)}
{const _sc=THREE.InstancedMesh.prototype.setColorAt,_t=new THREE.Color();THREE.InstancedMesh.prototype.setColorAt=function(i,c){_sc.call(this,i,_t.copy(c).convertSRGBToLinear())}}

const canvas=$('c');
const R=new THREE.WebGLRenderer({canvas,antialias:true});
R.setPixelRatio(Math.min(devicePixelRatio,1.75));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xbfe6ff);
scene.fog=new THREE.Fog(0xbfe6ff,45,110);
const cam=new THREE.PerspectiveCamera(60,1,.25,900);
const hemi=new THREE.HemisphereLight(0xffffff,0x6a8f4a,.72);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1dc,.85);
sun.position.set(-14,28,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0006;
Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:90});sun.shadow.normalBias=.02;
scene.add(sun);scene.add(sun.target);

// ---------- pomocníci ----------
const solids=[],camMeshes=[];
let BUILD_INT=false,COL_IN=false;   // COL_IN: kolize se počítají s interiéry (jen hráč uvnitř)
const HG=new Map(),HGC=8;   // prostorová mřížka pro statické kolize domů ve městě (rychlé hledání)
function hsolid(x1,z1,x2,z2,top){const b={x1:Math.min(x1,x2),x2:Math.max(x1,x2),z1:Math.min(z1,z2),z2:Math.max(z1,z2),top,int:false};
  for(let i=Math.floor(b.x1/HGC);i<=Math.floor(b.x2/HGC);i++)for(let j=Math.floor(b.z1/HGC);j<=Math.floor(b.z2/HGC);j++){const k=i*4096+j;let a=HG.get(k);if(!a)HG.set(k,a=[]);a.push(b)}}
function hgAt(x,z){return HG.get(Math.floor(x/HGC)*4096+Math.floor(z/HGC))}
function solid(x1,z1,x2,z2,top){solids.push({x1:Math.min(x1,x2),x2:Math.max(x1,x2),z1:Math.min(z1,z2),z2:Math.max(z1,z2),top,int:BUILD_INT})}
function box(x1,z1,x2,z2,y0,y1,color,isSolid=true){
  const m=new THREE.Mesh(BOX,M(color));
  m.scale.set(Math.abs(x2-x1),y1-y0,Math.abs(z2-z1));
  m.position.set((x1+x2)/2,(y0+y1)/2,(z1+z2)/2);
  m.castShadow=true;m.receiveShadow=true;scene.add(m);
  if(isSolid&&y0<.5)solid(x1,z1,x2,z2,y1);
  if(y1-y0>1.4)camMeshes.push(m);
  return m;
}
const pbox=(a,b,c,d,y0,y1,col,s=true)=>box(X(a),Z(b),X(c),Z(d),y0,y1,col,s);
function plane(a,b,c,d,y,mat){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(X(c)-X(a),Z(d)-Z(b)),mat);
  m.rotation.x=-Math.PI/2;m.position.set((X(a)+X(c))/2,y,(Z(b)+Z(d))/2);m.receiveShadow=true;scene.add(m);return m;
}
function tex(draw,rx,ry){
  const c=document.createElement('canvas');c.width=c.height=128;draw(c.getContext('2d'));
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);return t;
}
const ridges=[];
const roofCan=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,128,128);
  for(let r=0;r<4;r++){g.fillStyle='rgba(0,0,0,.22)';g.fillRect(0,r*32+26,128,6);for(let k=0;k<4;k++){const x=k*32+(r%2)*16;g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x,r*32,3,32);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(x+3,r*32,10,24)}}return c})();
function roofMat(color,u,v){const t=new THREE.CanvasTexture(roofCan);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(Math.max(1,u/1.2),Math.max(1,v/1.2));
  return STDM({color,map:t})}
function gable(x1,z1,x2,z2,y,color,ov=.3){
  const w=x2-x1,d=z2-z1,alongZ=d>=w,ang=.5;
  const span=(alongZ?w:d)/2+ov,len=(alongZ?d:w)+ov*2,cx=(x1+x2)/2,cz=(z1+z2)/2,rise=Math.tan(ang)*span;
  ridges.push({alongZ,cx,cz,len:alongZ?d:w,y:y+rise+.04});
  for(const s of [-1,1]){
    const m=new THREE.Mesh(BOX,roofMat(color,alongZ?span/Math.cos(ang):len,alongZ?len:span/Math.cos(ang))),sw=span/Math.cos(ang);
    if(alongZ){m.scale.set(sw,.14,len);m.position.set(cx+s*span/2,y+rise/2,cz);m.rotation.z=-s*ang}
    else{m.scale.set(len,.14,sw);m.position.set(cx,y+rise/2,cz+s*span/2);m.rotation.x=s*ang}
    m.castShadow=true;scene.add(m);
  }
  // štíty
  const tri=new THREE.Shape();const hs=span-ov;
  tri.moveTo(-hs,0);tri.lineTo(hs,0);tri.lineTo(0,Math.tan(ang)*hs);tri.lineTo(-hs,0);
  const g=new THREE.ShapeGeometry(tri);
  for(const s of [-1,1]){
    const m=new THREE.Mesh(g,STDM({color:0xe9dfcc,side:THREE.DoubleSide}));
    if(alongZ){m.position.set(cx,y,cz+s*d/2)}else{m.rotation.y=Math.PI/2;m.position.set(cx+s*w/2,y,cz)}
    scene.add(m);
  }
}
function sign(text,x,y,z,rotY,w=2.2){
  const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');
  g.fillStyle='#1f4d3a';g.fillRect(0,0,512,128);g.strokeStyle='#e9dfcc';g.lineWidth=8;g.strokeRect(8,8,496,112);
  g.fillStyle='#fff';g.font='800 64px Rubik, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,256,68,475);
  const tex=new THREE.CanvasTexture(c),g2=new THREE.Group();g2.position.set(x,y,z);g2.rotation.y=rotY;scene.add(g2);
  const bd=new THREE.Mesh(BOX,M(0x1f4d3a));bd.scale.set(w+.06,w/4+.06,.04);bd.position.z=-.03;g2.add(bd);
  for(const s of [0,1]){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),BASM({map:tex}));m.position.z=s?-.055:.001;m.rotation.y=s*Math.PI;g2.add(m)}
}
function door(x,z,y0,w,h,rotY,color=0x5a3b26){
  const m=new THREE.Mesh(BOX,M(color));m.scale.set(w,h,.08);m.position.set(x,y0+h/2,z);m.rotation.y=rotY;scene.add(m);
  const k=new THREE.Mesh(SPH,M(0xd4b26a));k.scale.set(.05,.05,.05);
  k.position.set(x+Math.cos(rotY)*w*.35+Math.sin(rotY)*.06,y0+h*.48,z-Math.sin(rotY)*w*.35+Math.cos(rotY)*.06);scene.add(k);
}
function windowsAlong(xFace,zFrom,zTo,ys,rotY){
  for(let z=zFrom;z<zTo;z+=2.6)for(const y of ys){
    const m=new THREE.Mesh(BOX,M(0x5d86a8));m.scale.set(.06,1,1.1);m.position.set(xFace,y,z);scene.add(m);
    const f=new THREE.Mesh(BOX,M(0xffffff));f.scale.set(.05,1.12,1.22);f.position.set(xFace-.01*Math.sign(rotY||1),y,z);scene.add(f);
  }
}

// ---------- zem ----------
const grassTex=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#7cbf5a';g.fillRect(0,0,256,256);
  for(let i=0;i<60;i++){g.fillStyle=Math.random()<.5?'rgba(110,176,78,.35)':'rgba(140,204,102,.35)';g.beginPath();g.arc(Math.random()*256,Math.random()*256,10+Math.random()*30,0,7);g.fill()}
  for(let i=0;i<2600;i++){const x=Math.random()*256,y=Math.random()*256,l=3+Math.random()*5;g.strokeStyle=['#6aae4a','#8fd06a','#74b853','#9bd876'][i%4];g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+(Math.random()-.5)*2,y-l);g.stroke()}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(400,400);t.anisotropy=4;return t})();
const ground=new THREE.Mesh(new THREE.PlaneGeometry(1600,1600),STDM({map:grassTex}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

const pavTex=tex(g=>{g.fillStyle='#bdb6ab';g.fillRect(0,0,128,128);g.strokeStyle='#8f877c';g.lineWidth=3;g.strokeRect(0,0,128,128);
  g.beginPath();g.moveTo(64,0);g.lineTo(64,64);g.moveTo(0,64);g.lineTo(128,64);g.moveTo(32,64);g.lineTo(32,128);g.moveTo(96,64);g.lineTo(96,128);g.stroke()},(900-564)*S/1.2,(1410-1136)*S/1.2);
const deckTex=tex(g=>{g.fillStyle='#c9a172';g.fillRect(0,0,128,128);g.strokeStyle='#9c7650';g.lineWidth=3;for(let i=0;i<=128;i+=32){g.beginPath();g.moveTo(0,i);g.lineTo(128,i);g.stroke()}},(558-79)*S/1.3,(1420-1133)*S/1.3);
const walkTex=tex(g=>{g.fillStyle='#d3ccbf';g.fillRect(0,0,128,128);g.strokeStyle='#aaa293';g.lineWidth=2;g.strokeRect(0,0,128,128)},1,(1130-597)*S/1.4);

plane(564,1136,900,1410,.015,STDM({map:pavTex}));           // dlažba (dál je trávník k babičce)
{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#9b8a6e';g.fillRect(0,0,256,256);
 for(let i=0;i<70;i++){g.fillStyle=Math.random()<.5?'rgba(120,104,80,.35)':'rgba(170,152,120,.3)';g.beginPath();g.arc(Math.random()*256,Math.random()*256,8+Math.random()*26,0,7);g.fill()}
 for(let i=0;i<900;i++){g.fillStyle=['#7d6c52','#b5a384','#8c8c88','#6b5b44'][i%4];g.fillRect(Math.random()*256,Math.random()*256,1+Math.random()*3,1+Math.random()*2)}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set((1255-622)*S/3,(558-58)*S/3);
 plane(622,58,1255,558,.008,STDM({map:t}))}                   // u dílny žádný trávník – hlína
plane(79,1133,558,1420,.015,STDM({map:deckTex}));           // pergola – posezení
plane(765,597,903,1130,.02,STDM({map:walkTex}));            // chodník
plane(919,599,1158,780,.01,M(0x86c763));                                              // trávník u domečku
plane(923,797,1164,1125,.012,M(0x93d36c));                                            // cvičiště
plane(1183,526,1246,1393,.01,M(0xa89b86));                                            // pás u plotu
plane(560,300,760,558,.01,M(0xbdb6ab));                                               // plocha u venkovní dílny
// lajny cvičiště
for(const [a,b,c,d] of [[928,802,1159,808],[928,1114,1159,1120],[928,802,934,1120],[1153,802,1159,1120]])pbox(a,b,c,d,0,.03,0xffffff,false);
sign('CVIČIŠTĚ',X(1043),.9,Z(1128)+.15,0,1.6);
box(X(1043)-.04,Z(1128)+.1,X(1043)+.04,Z(1128)+.18,0,.7,0x5a3b26);

// ---------- okraj mapy (živý plot) ----------
const HED=0x3f7d3a,hy=1.7;
pbox(40,558,62,598,0,hy,HED);pbox(40,642,62,1440,0,hy,HED);   // západ (průchod ke dveřím Bytu 2 na Masarykovu)
pbox(1255,38,1275,526,0,hy,HED);         // východ nad plotem
pbox(1246,1390,1275,1430,0,hy,HED);      // východ jižní roh

// ---------- dům do U (přízemní) ----------
const HOUSE=0xf1e7d4,HH=3.2,ROOF=0x9a4a2c,WIN=0x5d86a8;
function winZ(x,z,face){const m=new THREE.Mesh(BOX,M(WIN));m.scale.set(1.1,1,.06);m.position.set(x,1.6,z+face*.03);scene.add(m)}
function winX(x,z,face,y=1.6){const m=new THREE.Mesh(BOX,M(WIN));m.scale.set(.06,1,1.1);m.position.set(x+face*.03,y,z);scene.add(m)}
// jižní křídlo po celé jižní straně
pbox(40,1425,1275,1640,0,HH,HOUSE);gable(X(40),Z(1425),X(1275),Z(1640),HH,ROOF);
for(let x=220;x<560;x+=110)winZ(X(x),Z(1425),-1);
door(X(113),Z(1425)-.05,0,1,2.15,Math.PI);
function winGrid(a,b,z,face,cols,rows,y,h){         // okno s příčkami (px a..b)
  const x1=X(a),x2=X(b),w=x2-x1,zz=z+face*.035;
  const g=new THREE.Mesh(BOX,M(WIN));g.scale.set(w,h,.05);g.position.set((x1+x2)/2,y,zz);scene.add(g);
  const fr=c=>{const m=new THREE.Mesh(BOX,M(0xffffff));return m};
  for(let i=0;i<=cols;i++){const m=fr();m.scale.set(.07,h+.07,.07);m.position.set(x1+w*i/cols,y,zz+face*.01);scene.add(m)}
  for(let j=0;j<=rows;j++){const m=fr();m.scale.set(w+.07,.07,.07);m.position.set((x1+x2)/2,y-h/2+h*j/rows,zz+face*.01);scene.add(m)}
}
// velké prosklené dveře + okna podle náčrtu
{const z=Z(1425)-.05,x1=X(950),x2=X(1030),w=x2-x1;
 const d=new THREE.Mesh(BOX,M(0x5a3b26));d.scale.set(w,2.4,.08);d.position.set((x1+x2)/2,1.2,z);scene.add(d);
 for(const s of [-1,1]){const gl=new THREE.Mesh(BOX,M(WIN));gl.scale.set(w/2-.2,1.3,.03);gl.position.set((x1+x2)/2+s*w/4,1.45,z-.04);scene.add(gl)}
 const k=new THREE.Mesh(SPH,M(0xd4b26a));k.scale.setScalar(.05);k.position.set((x1+x2)/2+.12,1.1,z-.07);scene.add(k)}
winGrid(870,940,Z(1425),-1,2,2,1.6,1.3);
winGrid(688,795,Z(1425),-1,3,2,1.6,1.3);
pbox(84,1355,142,1413,0,.12,0xcfc6b8,false);   // rohožka u vstupu
// západní křídlo (spojuje jih s byty)
pbox(62,558,552,1133,0,HH,HOUSE);gable(X(62),Z(558),X(552),Z(1133),HH,ROOF);   // protaženo na sever až do linie s byty   // protaženo o 3 m na sever
for(let x=120;x<540;x+=100)winZ(X(x),Z(558),-1);
// západní uzávěr dvorku (dům) s dveřmi a oknem
pbox(40,1133,100,1425,0,HH,HOUSE);gable(X(40),Z(1133),X(100),Z(1425),HH,ROOF,.15);
door(X(100)+.05,Z(1330),0,1,2.1,Math.PI/2);
const wallLamp={x:X(100)+.15,y:2.55,z:Z(1220)};box(X(100),Z(1220)-.12,X(100)+.12,Z(1220)+.12,2.4,2.7,0x2a2a2a,false);
{const m=new THREE.Mesh(BOX,M(WIN));m.scale.set(.06,1.2,1.5);m.position.set(X(100)+.03,1.6,Z(1220));scene.add(m)}

// ---------- zdi ----------
const WALL=0xd9cdb5,CAP=0xb8aa90;
function wall(a,b,c,d,h){pbox(a,b,c,d,0,h,WALL);pbox(a-3,b-3,c+3,d+3,h,h+.1,CAP,false)}
wall(40,38,372,58,2.4);wall(600,38,1275,58,2.4);   // severní hranice: zeď s bránou (příjezd aut)
wall(594,104,1172,134,2.2);
pbox(372,34,380,62,0,2.6,0x3a3a3a);pbox(592,34,600,62,0,2.6,0x3a3a3a);                 // brána
const gateG=new THREE.Group();scene.add(gateG);
for(const m of [pbox(380,45,592,51,.05,1.95,0x4a4f55,false),pbox(380,43,592,53,1.95,2.05,0x2a2d31,false)])gateG.add(m);for(let x=384;x<590;x+=12)gateG.add(pbox(x,43,x+3,53,0,2.05,0x2a2d31,false));
const GATE={open:false,t:0,s:{x1:X(380),x2:X(592),z1:Z(43),z2:Z(53),top:2,int:false}};solids.push(GATE.s);
function toggleGarage(){const G=window.__GAR;G.open=!G.open;const i=solids.indexOf(G.s);if(G.open){if(i>=0)solids.splice(i,1)}else if(i<0)solids.push(G.s);play('garage',.6);toast(G.open?'Garáž se otevírá.':'Garáž se zavírá.')}
function toggleGate(){GATE.open=!GATE.open;const i=solids.indexOf(GATE.s);if(GATE.open){if(i>=0)solids.splice(i,1)}else if(i<0)solids.push(GATE.s);play('gate',.6);toast(GATE.open?'Brána se otevírá – auta můžou projet.':'Brána se zavírá.')}
// sklad náhradních dílů ve zdi (západ vrakoviště) – bez schodů, nahoru se leze po žebříku
pbox(20,58,72,558,0,3.4,WALL);pbox(17,55,75,561,3.4,3.5,CAP,false);
{const TOR=new THREE.TorusGeometry(.17,.035,6,16),TYR=new THREE.TorusGeometry(.28,.11,6,14);
 for(let y=80;y<530;y+=78){pbox(72,y,74,y+62,1.5,3,0x2a2420,false);pbox(70,y,76,y+62,1.5,1.56,0x8a5a32,false);
   for(let k=0;k<3;k++){const t=new THREE.Mesh(k%2?TYR:TOR,M(k%2?0x2a2a2a:0x151515));t.rotation.y=Math.PI/2;t.position.set(X(74)+.04,k%2?1.85:2.45,Z(y+12+k*19));scene.add(t)}}
 const lad=new THREE.Group();lad.position.set(X(72)+.42,0,Z(332));lad.rotation.z=.2;scene.add(lad);
 for(const sz of [-.22,.22]){const m=new THREE.Mesh(BOX,M(0xc9c9c9));m.scale.set(.05,3.4,.05);m.position.set(0,1.7,sz);m.castShadow=true;lad.add(m)}
 for(let y=.3;y<3.3;y+=.3){const m=new THREE.Mesh(BOX,M(0xa8a8a8));m.scale.set(.04,.04,.44);m.position.set(0,y,0);lad.add(m)}}
wall(623,146,643,240,2);   // zkrácená – průchod na vrakoviště mezi zídkou a domem
wall(658,558,800,584,1.8);wall(852,558,1165,584,1.8);   // zeď až k domu   // zeď s brankou nad chodníkem
pbox(798,555,804,587,0,2,0x6b4a2e);pbox(848,555,854,587,0,2,0x6b4a2e);
{const g=new THREE.Group();g.position.set(X(851),0,Z(587));g.rotation.y=-1.4;scene.add(g);   // otevřené dřevěné vrátka
 for(let i=0;i<6;i++){const m=new THREE.Mesh(BOX,M(0x9c6b3e));m.scale.set(.15,1.6,.04);m.position.set(-.12-i*.19,.9,0);m.castShadow=true;g.add(m)}
 for(const y of [.4,1.4]){const m=new THREE.Mesh(BOX,M(0x7a5232));m.scale.set(1.2,.1,.05);m.position.set(-.6,y,.03);g.add(m)}}

// ---------- venkovní dílna (přístřešek + ponk) ----------
for(const [x,y] of [[656,160],[759,160],[656,291],[759,291]])pbox(x,y,x+6,y+6,0,2.4,0x6b4a2e);
{const r=pbox(645,150,775,305,2.4,2.52,0x2f5d4a,false);r.rotation.x=.08}
pbox(662,162,758,192,.86,.94,0x9c6b3e);
pbox(662,162,758,192,0,.86,0x7a5232);
pbox(670,170,690,182,.94,1.06,0x1f5a3c,false);
pbox(672,172,682,180,1.06,1.18,0x151515,false);
pbox(700,168,740,172,.94,.97,0xc0c0c0,false);
pbox(700,172,740,186,.94,.96,0x8a5a32,false);
pbox(735,215,741,245,0,.7,0x8a5a32,false);pbox(752,215,758,245,0,.7,0x8a5a32,false);   // koza ke kraji
pbox(732,226,762,234,.7,.78,0xd9b07a,false);

// ---------- Kutilova dílna ----------
pbox(787,151,1021,307,0,3,0x9c7a55);
gable(X(787),Z(151),X(1021),Z(307),3,0x5b3a26);
door(X(900),Z(307)+.05,0,2.6,2.3,0,0x4a3a2a);
sign('DÍLNA',X(900),2.65,Z(307)+.06,0,1.8);

// ---------- Byt kutila ----------
pbox(1028,150,1180,551,0,3.2,0xe6dcc8);
gable(X(1028),Z(150),X(1180),Z(551),3.2,0x9a4a2c);
const flatDoorZ=Z(380);
door(X(1028)-.05,flatDoorZ,0,1,2.1,-Math.PI/2);
winX(X(1028),Z(250),-1);

// ---------- byty 1 a 2 (přízemní) + vyvýšený chodník ----------
// One solid shell under the shared roof of both locked apartments.
pbox(552,558,658,1133,0,HH+.5,HOUSE);
{
  const x1=X(552),x2=X(658),z1=Z(558),z2=Z(1133),base=HH+.5;
  const slope=.27,top=x=>base+.12+(x2-x)*slope;
  const left=x1-.06,right=x2+.22;
  const roof=new THREE.Mesh(BOX,M(ROOF));
  roof.scale.set((right-left)*Math.hypot(1,slope),.12,z2-z1+.32);
  roof.position.set((left+right)/2,top((left+right)/2),(z1+z2)/2);
  roof.rotation.z=-Math.atan(slope);roof.castShadow=true;scene.add(roof);camMeshes.push(roof);
  const end=new THREE.Shape();
  end.moveTo(0,0);end.lineTo(x2-x1,0);end.lineTo(x2-x1,top(x2)-base);end.lineTo(0,top(x1)-base);end.closePath();
  const geometry=new THREE.ShapeGeometry(end);
  for(const z of [z1,z2]){
    const face=new THREE.Mesh(geometry,STDM({color:HOUSE,side:THREE.DoubleSide}));
    face.position.set(x1,base,z);scene.add(face);
  }
  box(x2-.05,z1,x2,z2,base,top(x2),HOUSE,false);
  box(x1,z1,x1+.05,z2,base,top(x1),HOUSE,false);
}
for(let z=Z(650);z<Z(1120);z+=2.4)if(Math.abs(z-Z(610))>.9&&Math.abs(z-Z(1090))>.9)winX(X(658),z,1,2.1);
door(X(658)+.05,Z(610),.5,1,2.1,Math.PI/2);
door(X(658)+.05,Z(1090),.5,1,2.1,Math.PI/2);
sign('BYT 2',X(658)+.06,2.95,Z(610),Math.PI/2,.9);
sign('BYT 1',X(658)+.06,2.95,Z(1090),Math.PI/2,.9);
pbox(665,584,750,1130,0,.5,0xc9c2b5);                     // vyvýšený chodník (+0,5 m), bez zábradlí
[[750,763,.375],[763,776,.25],[776,789,.125]].forEach(([a,b,t])=>pbox(a,590,b,632,0,t,0xb9b2a5));   // boční schody u branky
[[1130,1145,.375],[1145,1160,.25],[1160,1175,.125]].forEach(([a,b,t])=>pbox(665,a,750,b,0,t,0xb9b2a5));
// záhon s rajčaty podél chodníku
pbox(750,642,776,1120,0,.18,0x6b4a2f);
for(let y=656;y<1112;y+=26){
  const x=X(763),z=Z(y);
  box(x-.02,z-.02,x+.02,z+.02,0,1.15,0x8a6a3a,false);
  const m=new THREE.Mesh(SPH,M(y%52?0x4f9a3c:0x3f8a32));m.scale.set(.2,.36,.2);m.position.set(x,.52,z);m.castShadow=true;scene.add(m);
  for(let k=0;k<3;k++){const r=new THREE.Mesh(SPH,M(k?0xd8322a:0xe8603a));r.scale.setScalar(.06);r.position.set(x+(Math.random()-.5)*.32,.35+Math.random()*.45,z+(Math.random()-.5)*.3);scene.add(r)}
}

// ---------- malý červený domeček, dřevník, kompost ----------
pbox(1030,618,1123,745,0,2.1,0xb8322a);
gable(X(1030),Z(618),X(1123),Z(745),2.1,0x4a2a20,.2);
door(X(1030)-.05,Z(700),0,.8,1.7,-Math.PI/2,0x7a1f18);
for(const [x,y] of [[921,588],[1016,588],[921,646],[1016,646]])pbox(x,y,x+5,y+5,0,2,0x6b4a2e);
{const r=pbox(915,584,1028,656,2,2.1,0x5b3a26,false);r.rotation.x=-.06}
pbox(930,592,1010,632,0,1.5,0x8a5a32);
{const lg=new THREE.CylinderGeometry(.09,.09,.06,8);
 for(let x=934;x<1008;x+=8)for(let y=.12;y<1.45;y+=.19){const m=new THREE.Mesh(lg,M((x+y*10)%3<1?0xd1a46c:0xc08a52));m.rotation.x=Math.PI/2;m.position.set(X(x),y,Z(632)+.02);scene.add(m)}}
pbox(935,690,985,740,0,.95,0x7a5232);pbox(940,695,980,735,.95,.98,0x3d2a1a,false);   // kompost
for(let i=0;i<4;i++)pbox(933,690+i*13,987,693+i*13,.2,.9,0x5b3a26,false);
{const lg=new THREE.CylinderGeometry(.1,.1,1.2,8);                                  // hromada dřeva
 for(let r=0;r<3;r++)for(let i=0;i<4-r;i++){const m=new THREE.Mesh(lg,M(i%2?0xb3834f:0x9c6b3e));m.rotation.z=Math.PI/2;m.position.set(X(970),.1+r*.18,Z(752)+.12+i*.21+r*.1);m.castShadow=true;scene.add(m)}
 solid(X(945),Z(752),X(995),Z(778),.5)}

// ---------- plot k sousedům + dům sousedů ----------
pbox(1210,526,1218,1393,0,1.8,0xb07a4a);
for(let y=526;y<1393;y+=80)pbox(1206,y,1222,y+8,0,1.95,0x7a4f2c,false);
{const nx=X(1262);
 box(nx,Z(300),nx+8,Z(1100),0,3,0xe8d9c4,false);gable(nx,Z(300),nx+8,Z(1100),3,0x7a3a2a);
 for(let z=Z(360);z<Z(1080);z+=2.6)winX(nx,z,-1);
 box(nx,Z(1100),nx+8,Z(1420),0,6,0xefe3cf,false);gable(nx,Z(1100),nx+8,Z(1420),6,0x7a3a2a);
 for(let z=Z(1140);z<Z(1400);z+=2.4){winX(nx,z,-1);}
 box(nx-1.3,Z(1140),nx,Z(1390),3,3.15,0xbdb6ab,false);                       // balkon
 box(nx-1.32,Z(1140),nx-1.25,Z(1390),3.15,4.1,0x4a4a4a,false);
 box(nx-1.3,Z(1140)-.03,nx,Z(1140)+.03,3.15,4.1,0x4a4a4a,false);box(nx-1.3,Z(1390)-.03,nx,Z(1390)+.03,3.15,4.1,0x4a4a4a,false);
 door(nx-.05,Z(1265),3.15,1,2.1,-Math.PI/2,0xffffff);}

sign('BABIČKA',X(990),2.8,Z(1425)-.07,Math.PI,1.4);
door(X(62)-.05,Z(620),0,1,2.1,Math.PI/2,0x4a3a2a);door(X(80),Z(1640)+.05,0,1,2.1,0,0x5a3b26);   // hlavní dům – vstup z Krátké   // Byt 2 – zadní dveře ze skladů na Masarykovu
// ---------- za severní zdí (kulisa): patrový modrý dům s dřevěnou pergolou, bazén, garáž, příjezd, obytné buňky B1–B4 ----------
plane(60,-130,645,36,.012,M(0x8f8a82));                                                 // příjezd
{const BLUE=0x3f8fd8,WOOD=0x8a5a32;
 pbox(110,-278,300,-82,0,6,BLUE);const YEL=0xf2c94c;pbox(9,-278,110,-272,0,2.6,YEL);pbox(9,-272,15,-82,0,2.6,YEL);pbox(104,-272,110,-82,0,2.6,YEL);pbox(9,-278,110,-82,2.6,6,BLUE,false);pbox(6,-86,113,-80,2.55,2.75,0xd9a92c,false);   // žlutá garáž
 {const cg=new THREE.Group();cg.position.set(X(60),2.95,Z(-82)+.18);scene.add(cg);const k=(c,sx,sy,sz,x,y,z)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(sx,sy,sz);m.position.set(x,y,z);cg.add(m);return m};
  k(0x2a2a2a,.06,.25,.06,0,.1,-.12);k(0xf4f4f0,.2,.16,.36,0,0,.02);k(0x111111,.12,.1,.04,0,-.01,.21);cg.rotation.x=.35;const led=k(0xff2020,.03,.03,.02,.07,.05,.21);led.material=BASM({color:0xff2020});window.__camLed=led}   // bezpečnostní kamera nad garáží
 // v garáži haraburdí: pneumatiky, regál s kanystry, kolo, sekačka, krabice
 {const tg=new THREE.TorusGeometry(.3,.12,6,14);for(let k=0;k<6;k++){const t=new THREE.Mesh(tg,M(0x1a1a1a));t.rotation.x=Math.PI/2;t.position.set(X(30),.13+k*.24,Z(-250));scene.add(t)}solid(X(17),Z(-268),X(45),Z(-232),1.5);
  pbox(55,-268,100,-255,0,1.9,0x5a5f66);for(const y of [.4,1,1.6])for(let k=0;k<3;k++)pbox(58+k*14,-266,68+k*14,-257,y,y+.35,[0xc8202a,0x2e6b3a,0xd4a017][k],false);
  for(const [a,b,c] of [[20,-200,0xb08a5a],[22,-180,0xc9a172],[70,-215,0xb08a5a],[85,-140,0xc9a172]])pbox(a,b,a+16,b+14,0,.5,c);
  pbox(75,-180,98,-120,0,.55,0x2e6b3a);pbox(80,-185,93,-178,.55,1,0x222222,false);
  {const w1=new THREE.Mesh(new THREE.TorusGeometry(.33,.03,6,16),M(0x111111));w1.position.set(X(25),.36,Z(-150));w1.rotation.y=Math.PI/2;scene.add(w1);const w2=w1.clone();w2.position.z+=1;scene.add(w2);pbox(23,-152,27,-118,.36,.4,0xc8202a,false)}}
 pbox(15,-272,104,-82,0,.02,0x55585c,false);gable(X(9),Z(-278),X(300),Z(-82),6,0x3a3a3a,.35);
 const winWood=(x,z,y,alongZ)=>{if(alongZ){box(x-.06,z-.6,x+.04,z+.6,y-.65,y+.65,0x6b4226,false);box(x-.08,z-.5,x+.06,z+.5,y-.55,y+.55,0x9fd3ff,false)}else{box(x-.6,z-.04,x+.6,z+.06,y-.65,y+.65,0x6b4226,false);box(x-.5,z-.06,x+.5,z+.08,y-.55,y+.55,0x9fd3ff,false)}};
 for(const x of [150,240])for(const y of [1.5,4.3])winWood(X(x),Z(-82),y,false);winWood(X(60),Z(-82),4.3,false);
 for(const z of [-240,-170,-110])for(const y of [1.5,4.3])winWood(X(300),Z(z),y,true);
 const GAR={open:false,t:0,m:box(X(15),Z(-82)-.03,X(104),Z(-82)+.05,0,2.55,0x6b3a24,false)};GAR.s={x1:X(15),x2:X(104),z1:Z(-82)-.05,z2:Z(-82)+.07,top:2.6};solids.push(GAR.s);
 window.__GAR=GAR;
 for(const x of [300,352])for(const y of [-270,-200,-130,-90])pbox(x,y,x+6,y+6,0,5.6,WOOD);                  // pergola s balkonem k bazénu
 pbox(300,-278,358,-82,2.7,2.86,WOOD,false);for(let y=-278;y<-82;y+=14)pbox(354,y,358,y+3,2.86,3.8,WOOD,false);pbox(354,-278,358,-82,3.75,3.85,WOOD,false);
 const pr=pbox(300,-278,362,-82,5.6,5.66,0xcfe8ff,false);pr.material=STDM({color:0xcfe8ff,transparent:true,opacity:.35,depthWrite:false});
 // bazén se žlutými zdmi, delfíny a sluníčkem
 const dolph=(()=>{const c=document.createElement('canvas');c.width=512;c.height=128;const g=c.getContext('2d');g.fillStyle='#f2c94c';g.fillRect(0,0,512,128);
   for(const [x,y,f] of [[120,60,1],[200,48,-1],[400,64,1]]){g.save();g.translate(x,y);g.scale(f,1);g.fillStyle='#4f8fd6';g.beginPath();g.ellipse(0,0,34,12,-.3,0,7);g.fill();g.beginPath();g.moveTo(-30,8);g.lineTo(-48,-6);g.lineTo(-44,18);g.fill();g.beginPath();g.moveTo(0,-10);g.lineTo(8,-24);g.lineTo(12,-8);g.fill();g.restore()}
   g.fillStyle='#f7a823';g.beginPath();g.arc(300,64,22,0,7);g.fill();g.strokeStyle='#f7a823';g.lineWidth=5;for(let k=0;k<10;k++){const a=k/10*6.28;g.beginPath();g.moveTo(300+Math.cos(a)*28,64+Math.sin(a)*28);g.lineTo(300+Math.cos(a)*40,64+Math.sin(a)*40);g.stroke()}
   g.fillStyle='#222';g.fillRect(286,56,12,7);g.fillRect(302,56,12,7);return new THREE.CanvasTexture(c)})();
 plane(360,-312,580,-110,.02,M(0xe8d6a8));
 pbox(380,-292,552,-132,0,.15,0x2f7fd6,false);plane(386,-286,546,-138,.16,STDM({color:0x4cc0f2,emissive:0x0a3550}));
 for(const [a,b,c,d] of [[362,-312,370,-110],[362,-320,580,-312]]){const m=pbox(a,b,c,d,0,1.9,0xf2c94c);m.material=STDM({color:0xffffff,map:dolph})}
 // obytné buňky (kontejnery)
 const corr=(()=>{const c=document.createElement('canvas');c.width=64;c.height=8;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,64,8);for(let x=0;x<64;x+=8){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x,0,3,8)}return c})();
 const cont=(a,b,c,d,col,name)=>{const t=new THREE.CanvasTexture(corr);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(Math.max((c-a),(d-b))/40*2,1);
   const m=pbox(a,b,c,d,0,2.6,col);m.material=STDM({color:col,map:t});pbox(a-2,b-2,c+2,d+2,2.6,2.7,0x555555,false);
   const east=name==='B4',west=name==='B1',ry=east?Math.PI/2:west?-Math.PI/2:Math.PI;
   const x=east?X(c)+.04:west?X(a)-.04:X((a+c)/2),z=east||west?Z((b+d)/2):Z(b)-.04;
   door(x,z,0,.85,2,ry,0x545960);sign(name,x+Math.sin(ry)*.06,2.3,z+Math.cos(ry)*.06,ry,.7);
   (window.__cabins||=[]).push({key:name,x:x+Math.sin(ry)*.85,z:z+Math.cos(ry)*.85,ry})
 };
 cont(594,-116,714,30,0x9c3b2a,'B1');cont(733,-50,983,30,0x2f5f8a,'B2');cont(996,-177,1220,-79,0xe8e3d8,'B3');cont(1001,-60,1230,30,0x3f6b3a,'B4');
 for(const [x,y,h] of [[600,-250,7],[700,-220,6],[300,-330,8],[860,-170,6.5]]){const tk=new THREE.Mesh(CYL,M(0x5a3a22));tk.scale.set(.2,1.4,.2);tk.position.set(X(x),.7,Z(y));scene.add(tk);
   for(let k=0;k<3;k++){const c=new THREE.Mesh(CONE,M(0x2f5f35));const r=1.6-k*.4;c.scale.set(r,h*.45,r);c.position.set(X(x),1.2+k*h*.22+h*.22,Z(y));c.castShadow=true;scene.add(c)}}
}
// ---------- okolí: Masarykova (západ), Krátká (jih), křižovatka, domy kolem, auta, lampy ----------
const localRoads=[[-300,-5300,-90,6800],[-300,1760,2790,1950],[2600,-5300,2790,2340]];
function onLocalRoad(a,b,c,d){return localRoads.some(([left,top,right,bottom])=>
  a<right+20&&c>left-20&&b<bottom+20&&d>top-20)}
const BG=[];   // obdélníky okolí v px (stromy se jim vyhnou)
{const pk=a=>a[Math.floor(Math.random()*a.length)];const ASF=0x5d5f63,CHD=0xb9b4aa,LINE=0xf4f4f0,L=(a,b,c,d,y,col)=>{plane(a,b,c,d,y,M(col));BG.push([a,b,c,d]);(window.__RD=window.__RD||[]).push([a,b,c,d,col===ASF?'#5d5f63':col===CHD?'#b9b4aa':'#7a7d80'])};
 L(-300,-5300,-90,6800,.048,ASF);L(-90,-5300,-30,1700,.013,CHD);L(-90,2010,-30,6800,.013,CHD);L(-360,-5300,-300,6800,.013,CHD);          // Masarykova + chodníky
 L(-300,1760,2695,1950,.012,ASF);L(-30,1700,2540,1760,.013,CHD);L(-300,1950,2540,2010,.013,CHD);       // Krátká + chodníky
 L(2600,-5300,2790,2340,.0115,ASF);L(2540,-5300,2600,1700,.013,CHD);L(2790,-5300,2850,2340,.013,CHD);       // Jiráskova (východ) – na jih pokračuje Bří Mrštíků
 BG.push([86,-75,600,36]);L(-90,-75,86,36,.012,0x8f8a82);                                        // příjezd z Masarykovy k bráně
 for(let y=-5280;y<6780;y+=90)if(y<1740||y>1970)plane(-199,y,-191,y+45,.052,M(LINE));for(let y=-5280;y<2300;y+=90)if(Math.abs(y-1855)>110)plane(2691,y,2699,y+45,.014,M(LINE));
 for(let x=-60;x<2560;x+=90)plane(x,1851,x+45,1859,.014,M(LINE));
 for(let x=-290;x<-100;x+=26)plane(x,1700,x+13,1758,.014,M(LINE));                                     // přechod u křižovatky
 const ROOFS=[0xa0482c,0x8e3c26,0xb4553a,0x7a3a2a,0x3a3a3a],WALLS=[0xefe3cf,0xe8d9c4,0xf2e8c9,0xd8e2e8,0xf0d9b5,0xe9e0d6];
 const house=(a,b,c,d,h,face)=>{if(onLocalRoad(a,b,c,d))return;const wc=pk(WALLS);pbox(a,b,c,d,0,h,wc);gable(X(a),Z(b),X(c),Z(d),h,pk(ROOFS),.3);BG.push([a-20,b-20,c+20,d+20]);
   const along=face==='e'||face==='w';const n=Math.max(1,Math.floor((along?d-b:c-a)/110));
   for(let i=0;i<n;i++){const t=(i+.5)/n;for(const y of h>4?[1.5,4.3]:[1.5]){
     if(along){const x=face==='e'?X(c)+.03:X(a)-.03,z=Z(b+(d-b)*t);box(x-.04,z-.55,x+.04,z+.55,y-.55,y+.55,0x5d86a8,false)}
     else{const z=face==='s'?Z(d)+.03:Z(b)-.03,x=X(a+(c-a)*t);box(x-.55,z-.04,x+.55,z+.04,y-.55,y+.55,0x5d86a8,false)}}}};
 // domy přes Masarykovu (západ)
 for(const [b,d,h] of [[-420,-120,3.2],[-60,260,6],[300,620,3.2],[660,980,3.4],[1020,1330,6],[1370,1660,3.2]])house(-780,b,-420,d,h,'e');
 // domy přes Krátkou (jih)
 for(const [a,c,h] of [[20,110,3.2],[140,520,6],[580,900,3.2],[960,1300,3.4],[1360,1700,6]])house(a,2080,c,2400,h,'n');
 // domy za sousedy (východ) a za buňkami (sever)
 for(const [b,d,h] of [[-420,-80,3.2],[1460,1700,6]])house(1640,b,1960,d,h,'w');
 for(const [a,c,h] of [[600,980,3.2],[1040,1400,6]])house(a,-640,c,-340,h,'s');
 // zaparkovaná auta
 const car=(x,z,rot,col)=>{const g=new THREE.Group();g.position.set(X(x),0,Z(z));g.rotation.y=rot;scene.add(g);
   const b=(c,sx,sy,sz,px,py,pz)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(sx,sy,sz);m.position.set(px,py,pz);m.castShadow=true;g.add(m)};
   b(col,1.75,.6,4.2,0,.55,0);b(col,1.6,.5,2.2,0,1.08,-.2);b(0x9fc6e0,1.62,.36,2.0,0,1.1,-.2);
   for(const sx of [-.85,.85])for(const sz of [-1.35,1.35]){const w=new THREE.Mesh(CYL,M(0x1a1a1a));w.scale.set(.33,.24,.33);w.rotation.z=Math.PI/2;w.position.set(sx,.33,sz);g.add(w)}};
 L(240,1645,1290,1760,.034,ASF);
 const CARC=[0xc8202a,0x1f4f9a,0xe8e8e8,0x2a2a2a,0x8a8f96,0x2e6b3a];
 L(-470,-1500,-360,2900,.0112,ASF);for(let y=-1400;y<2850;y+=260)plane(-470,y,-360,y+6,.014,M(LINE));   // parkovací záliv u Masarykovy
 window.__parkSpots=[-1270,-750,-230,290,810,1330,1850,2370].map(y=>[-415,y+130,pk(CARC)]);
 // pouliční lampy
 for(const [x,y] of [[-60,600],[-60,1200],[200,1730],[800,1730],[1400,1730],[-330,1730]]){box(X(x)-.06,Z(y)-.06,X(x)+.06,Z(y)+.06,0,4.2,0x3a3a3a,false);
   const hd=new THREE.Mesh(BOX,M(0x3a3a3a));hd.scale.set(.5,.12,.25);hd.position.set(X(x),4.2,Z(y));scene.add(hd)}
 // značky ulic
 for(const [t,x,y,r] of [['Masarykova',-60,1680,Math.PI/2],['Krátká',-20,1730,0]]){box(X(x)-.03,Z(y)-.03,X(x)+.03,Z(y)+.03,0,2.4,0x777777,false);sign(t,X(x),2.5,Z(y),r,1.2)}
}
// strom na trávníku u babičky – koruna roste až k sousedům
{const tx=X(1100),tz=Z(1290),tr=new THREE.Mesh(CYL,M(0x5a3a22));tr.scale.set(.28,5,.28);tr.position.set(tx+.55,2.4,tz);tr.rotation.z=-.22;tr.castShadow=true;scene.add(tr);solid(tx-.3,tz-.3,tx+.3,tz+.3,4);
 for(const [dx,dy,dz,r] of [[1.3,5.2,0,2.1],[2.8,5,.6,1.9],[3.9,4.8,-.4,1.7],[.3,5.6,-.8,1.6],[2,6.3,0,1.8],[3.2,5.9,1.1,1.4],[.8,4.7,1.2,1.5]]){
   const c=new THREE.Mesh(SPH,M([0x4f9a3c,0x3f8a32,0x5fae48][Math.floor(Math.random()*3)]));c.scale.set(r,r*.85,r);c.position.set(tx+dx,dy,tz+dz);c.castShadow=true;scene.add(c)}}
// ---------- okolní bloky: řady domů podél Masarykovy, Krátké, Jiráskovy, Příční a Bří Mrštíků ----------
{const YARD=[-30,-700,1990,1710],hits=(r)=>onLocalRoad(...r)||[YARD,...BG].some(b=>r[0]<b[2]&&r[2]>b[0]&&r[1]<b[3]&&r[3]>b[1]);
 const HS=[],pk=a=>a[Math.floor(Math.random()*a.length)];
 const row=(x1,x2,y1,y2,face,along)=>{if(along==='y'){for(let y=y1;y<y2;){const L=300+Math.random()*120;const r=[x1,y,x2,Math.min(y2,y+L)];if(r[3]-r[1]>200&&!hits(r)){HS.push([...r,face]);BG.push([r[0]-15,r[1]-15,r[2]+15,r[3]+15])}y+=L+40+Math.random()*60}}
   else{for(let x=x1;x<x2;){const L=300+Math.random()*120;const r=[x,y1,Math.min(x2,x+L),y2];if(r[2]-r[0]>200&&!hits(r)){HS.push([...r,face]);BG.push([r[0]-15,r[1]-15,r[2]+15,r[3]+15])}x+=L+40+Math.random()*60}}};
 row(-780,-420,-5200,4500,'e','y');                       // západ od Masarykovy
 row(20,380,-2700,-760,'w','y');row(20,380,2080,4300,'w','y');                                 // východní strana Masarykovy
 row(2180,2540,-2700,1650,'e','y');                           // západní strana Jiráskovy
 row(-260,2540,2080,2400,'n','x');   // Krátká
 window.__HS=HS;const n=HS.length,body=new THREE.InstancedMesh(BOX,STDM({color:0xffffff}),n);
 const prism=(()=>{const sh=new THREE.Shape();sh.moveTo(-.5,0);sh.lineTo(.5,0);sh.lineTo(0,1);sh.lineTo(-.5,0);const g=new THREE.ExtrudeGeometry(sh,{depth:1,bevelEnabled:false});g.translate(0,0,-.5);return g})();
 const roof=new THREE.InstancedMesh(prism,STDM({color:0xffffff}),n);
 const wins=[];const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),sc=new THREE.Vector3(),cc=new THREE.Color(),UP=new THREE.Vector3(0,1,0);
 const WALLS=[0xf6c6a8,0xbfe0f2,0xf2e28a,0xc8e6b0,0xf2b8c6,0xd8c8f0,0xffd08a,0xefe3cf,0xf2e8c9,0xa8d8c8,0xf0d9b5,0xe9e0d6,0xf3e2c0,0xdfe6d8],ROOFS=[0xa0482c,0x8e3c26,0xb4553a,0x7a3a2a,0x3a3a3a,0x9a4a2c];
 HS.forEach(([a,b,c,d,face],i)=>{const h=Math.random()<.35?6:3.2,x=(X(a)+X(c))/2,z=(Z(b)+Z(d))/2,w=X(c)-X(a),dd=Z(d)-Z(b);
   m4.compose(v.set(x,h/2,z),q.identity(),sc.set(w,h,dd));body.setMatrixAt(i,m4);body.setColorAt(i,cc.setHex(pk(WALLS)));solid(X(a),Z(b),X(c),Z(d),h);
   const alongZ=dd>w,span=(alongZ?w:dd)+.5,len=(alongZ?dd:w)+.5;q.setFromAxisAngle(UP,alongZ?Math.PI/2:0);m4.compose(v.set(x,h,z),q,sc.set(span,span*.45,len));roof.setMatrixAt(i,m4);roof.setColorAt(i,cc.setHex(pk(ROOFS)));
   const fx=face==='e'?X(c)+.03:face==='w'?X(a)-.03:x,fz=face==='s'?Z(d)+.03:face==='n'?Z(b)-.03:z,ln=face==='e'||face==='w'?dd:w,k=Math.max(1,Math.floor(ln/2.6));
   for(let j=0;j<k;j++){const t=(j+.5)/k-.5;for(const y of h>4?[1.5,4.4]:[1.5]){const px=face==='e'||face==='w'?fx:x+t*w,pz=face==='n'||face==='s'?fz:z+t*dd;
     m4.compose(v.set(px,y,pz),q.identity(),sc.set(face==='e'||face==='w'?.08:1.1,1.1,face==='e'||face==='w'?1.1:.08));wins.push(m4.clone())}}});
 body.castShadow=body.receiveShadow=true;roof.castShadow=true;scene.add(body,roof);
 const wi=new THREE.InstancedMesh(BOX,STDM({color:0x5d86a8}),wins.length);wins.forEach((m,i)=>wi.setMatrixAt(i,m));scene.add(wi);window.__winMats=[wi.material];
 // pouliční lampy a stromy podél ulic
 const lp=[];for(let y=-5100;y<6700;y+=700){if(Math.abs(y)>300)lp.push([-60,y]);if(y<2000)lp.push([2570,y])}for(let x=200;x<2500;x+=700)lp.push([x,1730]);
 {const J=[[-21.3,27.8],[50.9,27.8],[-21.3,127],[50.9,.7],[50.9,40]];for(let i=lp.length-1;i>=0;i--)if(J.some(([jx,jz])=>Math.hypot(X(lp[i][0])-jx,Z(lp[i][1])-jz)<6))lp.splice(i,1)}
 const li=new THREE.InstancedMesh(BOX,M(0x3a3a3a),lp.length);lp.forEach(([x,y],i)=>{m4.compose(v.set(X(x),2.1,Z(y)),q.identity(),sc.set(.12,4.2,.12));li.setMatrixAt(i,m4)});scene.add(li);
 for(const [x,y] of lp)solid(X(x)-.08,Z(y)-.08,X(x)+.08,Z(y)+.08,4);
}
// ---------- KLOBOUKY U BRNA: silnice podle satelitu (Google Maps otočené o 90°), domy, náměstí, zámek, kostely, obchody, hřiště, sklepy ----------
// převod ze satelitu: gx = −21,3 + (sy − 440)·0,361 ; gz = 27,8 + (1225 − sx)·0,361 (metry, sever hry = východ satelitu)
const SPHLO=new THREE.SphereGeometry(1,8,6);
const SEG=[],ROUTES={},LANDS=[];   // úseky silnic, trasy pro provoz, rezervované plochy (x1,z1,x2,z2)
const TOWN={x1:-150,x2:215,z1:-345,z2:475};
{const ASF=0x5d5f63,CHD=0xb9b4aa,LINE=0xf4f4f0,W=7;
 const flat=(x,z,w,l,rot,y,col)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,l),M(col));m.rotation.x=-Math.PI/2;m.rotation.z=rot;m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);return m};
 const road=(name,pts,w=W)=>{ROUTES[name]=pts;for(let i=0;i<pts.length-1;i++){const [ax,az]=pts[i],[bx,bz]=pts[i+1],dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz),r=Math.atan2(dx,dz);
     flat((ax+bx)/2,(az+bz)/2,w+3.4,L,r,.03,CHD);flat((ax+bx)/2,(az+bz)/2,w,L,r,.06,ASF);
     for(let t=2;t<L-2;t+=4.5)DASH.push([ax+dx*t/L,az+dz*t/L,r]);
     SEG.push({a:[ax,az],b:[bx,bz],w})}
   for(const [x,z] of pts)JUN.push([x,z])};
 const DASH=[],JUN=[];
 const JUN0=0;
 road('masN',[[-21.3,-150],[-32.1,-252],[-37.5,-344]]);
 road('masS',[[-21.3,150],[-17.7,168],[0.4,235.4],[-10.5,267.9],[-50.2,361.7],[-64.6,474]]);
 road('jirN',[[50.9,-150],[50.9,-344]]);
 road('brm',[[50.9,40],[65.3,109],[68.9,253.4],[72.5,397.8],[75,474]]);
 road('pric',[[-147.7,-252],[-32.1,-252],[50.9,-252],[115.9,-252],[180.9,-252],[213,-252]]);
 road('top',[[-129.6,-344],[-126,-252],[-111.6,-107.6],[-118.8,.7],[-111.6,109],[-115.2,246.2],[-97.1,343.7],[-89.9,474]]);
 road('brn',[[-21.3,127],[-89.9,130.7],[-111.6,109]]);
 road('zam',[[0.4,235.4],[68.9,253.4]]);
 road('wur',[[50.9,.7],[108.7,-35.4],[162.8,-89.5],[209.7,-114.8]]);
 road('plo',[[108.7,-35.4],[115.9,-252]]);
 road('bri',[[180.9,307.6],[159.2,181.2],[159.2,36.8],[162.8,-89.5]]);
 road('pri',[[68.9,253.4],[159.2,314.8],[180.9,307.6],[213,300]]);
 {const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),sc=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0),X90=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
  const pg=new THREE.PlaneGeometry(1,1);const di=new THREE.InstancedMesh(pg,M(LINE),DASH.length);DASH.forEach(([x,z,r],i)=>{q.setFromAxisAngle(UP,r).multiply(X90);m4.compose(v.set(x,.09,z),q,sc.set(.18,2,1));di.setMatrixAt(i,m4)});scene.add(di);
  for(const [rad,col,y] of [[W/2+1.7,CHD,.029],[W/2,ASF,.059]]){const ci=new THREE.InstancedMesh(new THREE.CircleGeometry(1,16),M(col),JUN.length);JUN.forEach(([x,z],i)=>{m4.compose(v.set(x,y,z),X90,sc.set(rad,rad,1));ci.setMatrixAt(i,m4)});ci.receiveShadow=true;scene.add(ci)}}
 // lokální ulice kolem dvorku do registru úseků (pro domy, chodce a policii)
 SEG.push({a:[-21.3,-151],b:[-21.3,151],w:5.3,loc:1},{a:[-21.3,27.8],b:[50.9,27.8],w:4.8,loc:1},{a:[50.9,-151],b:[50.9,40],w:4.8,loc:1});
 ROUTES.masLoc=[[-21.3,-150],[-21.3,150]];ROUTES.jirLoc=[[50.9,-150],[50.9,40]];ROUTES.kra=[[-21.3,27.8],[50.9,27.8]];
 const sdist=(x,z,g)=>{const [ax,az]=g.a,[bx,bz]=g.b,dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));return Math.hypot(x-ax-dx*t,z-az-dz*t)};
 window.__sdist=sdist;
 const land=(x1,z1,x2,z2,name)=>{LANDS.push([x1,z1,x2,z2,name])};
 const LOCAL=[-28,-156,58,156];   // naše ulice – tam jsou domy z řad (detailnější)
 // ---- dominanty ----
 const bx=(x1,z1,x2,z2,h,col,roof,sol=true)=>{const m=new THREE.Mesh(BOX,M(col));m.scale.set(x2-x1,h,z2-z1);m.position.set((x1+x2)/2,h/2,(z1+z2)/2);m.castShadow=m.receiveShadow=true;scene.add(m);if(sol)solid(x1,z1,x2,z2,h);if(roof)gable(x1,z1,x2,z2,h,roof,.3);return m};
 const tag=(t,x,y,z,ry,w)=>sign(t,x,y,z,ry,w);
 // náměstí Míru
 flat(-6,195,30,44,0,.075,0x7e776b);land(-21,173,9,217,'nám. Míru');
 {const FX0=3,FZ0=198;const f=new THREE.Mesh(CYL,M(0x9a9ea4));f.scale.set(2.2,.6,2.2);f.position.set(FX0,.3,FZ0);scene.add(f);const w=new THREE.Mesh(CYL,STDM({color:0x4cc0f2,emissive:0x0a3550}));w.scale.set(1.9,.62,1.9);w.position.set(FX0,.32,FZ0);scene.add(w);solid(FX0-2.2,FZ0-2.2,FX0+2.2,FZ0+2.2,.6);
  const col=new THREE.Mesh(CYL,M(0xd8d2c4));col.scale.set(.35,6,.35);col.position.set(FX0,3.6,FZ0);scene.add(col);const st=new THREE.Mesh(SPH,M(0xd4a017));st.scale.setScalar(.5);st.position.set(FX0,6.9,FZ0);scene.add(st)}
 for(const [x,z] of [[8,180],[8,212],[-16,214],[-19,186],[8,196]]){const t=new THREE.Mesh(CYL,M(0x5a3a22));t.scale.set(.18,2.4,.18);t.position.set(x,1.2,z);scene.add(t);const c=new THREE.Mesh(SPH,M(0x4f9a3c));c.scale.set(1.8,1.6,1.8);c.position.set(x,3.4,z);c.castShadow=true;scene.add(c);solid(x-.2,z-.2,x+.2,z+.2,3)}
 for(const [x,z] of [[4,186],[4,210],[-14,206]]){bx(x-1,z-.25,x+1,z+.25,.45,0x8a5a32,0,false)}
 // zámek s muzeem (U), kostel u náměstí
 bx(-72,196,-30,206,9,0xf0d48a,0xa0482c);bx(-72,206,-62,236,9,0xf0d48a,0xa0482c);bx(-40,206,-30,236,9,0xf0d48a,0xa0482c);land(-74,194,-28,238,'zámek');
 flat(-51,221,20,28,0,.075,0xd9cfae);tag('ZÁMEK · MĚSTSKÉ MUZEUM',-51,6.5,206.06,0,6);
 const church=(x,z,name)=>{const first=scene.children.length;bx(x-5,z-11,x+5,z+11,9,0xf3efe4,0x8e3c26);bx(x-2.5,z-15,x+2.5,z-10,22,0xf3efe4,0);const sp=new THREE.Mesh(CONE,M(0x2f5f35));sp.scale.set(2.6,8,2.6);sp.position.set(x,26,z-12.5);sp.castShadow=true;scene.add(sp);
   const cr=new THREE.Mesh(BOX,M(0xd4a017));cr.scale.set(.15,1.6,.15);cr.position.set(x,30.8,z-12.5);scene.add(cr);const cl=new THREE.Mesh(CYL,M(0xffffff));cl.scale.set(1,.1,1);cl.rotation.x=Math.PI/2;cl.position.set(x,18,z-10);scene.add(cl);
   land(x-7,z-17,x+7,z+13,name);tag(name,x,6,z+11.06,0,4);for(const o of scene.children.slice(first))o.position.y+=2;for(let k=0;k<10;k++){box(x-9+k*.3,z-18+k*.3,x+9-k*.3,z+16-k*.45,0,(k+1)*.2,0x76854f)};return [x,z-12.5]};
 const BELLS=[church(-38,160,'KOSTEL'),church(-140,-35,'EVANGELICKÝ KOSTEL')];window.__bells=BELLS;
 // obchody (dá se nakoupit – E u dveří)
 const shop=(x1,z1,x2,z2,h,col,name,face)=>{bx(x1,z1,x2,z2,h,col,name==='SUPERMARKET BENAPOL'?0x986247:0x6b6f75);land(x1-3,z1-3,x2+3,z2+3,name);const fx=face==='w'?x1-.06:face==='e'?x2+.06:(x1+x2)/2,fz=face==='n'?z1-.06:face==='s'?z2+.06:(z1+z2)/2,ry=face==='w'?-Math.PI/2:face==='e'?Math.PI/2:face==='n'?Math.PI:0;
   if(name!=='SUPERMARKET BENAPOL')tag(name,fx,h-1,fz,ry,Math.min(7,Math.max(3,name.length*.32)));door(fx,fz,0,1.6,2.2,ry,0x3a3a3a);return {x:fx+Math.sin(ry)*1.3,z:fz+Math.cos(ry)*1.3}};
 window.__shops={simonHome:shop(22,248,33,257,3.6,0xd5bd9b,'SIMON · GARÁŽ','n'),trafika:shop(-12,98,-7,102,2.8,0xc99466,'TRAFIKA','w'),vecerka:shop(-12,45,-3,54,4,0xdfcb90,'VEČERKA','w'),pekarna:shop(-53,112,-43,123,5,0xf2e2c4,'PEKAŘSTVÍ KŘÍŽKOVI','s'),benapol:shop(12,202,24,220,6,0xe6af99,'SUPERMARKET BENAPOL','w'),coop:shop(57,-215,75,-190,5,0xf4f0e6,'COOP JEDNOTA','w'),lidl:shop(712,14,736,46,6,0xf2f2f2,'LIDL','w')};
 {const lg=new THREE.Mesh(BOX,BASM({color:0x0050aa}));lg.scale.set(.1,2.2,2.2);lg.position.set(711.9,4.2,30);scene.add(lg);const ly=new THREE.Mesh(BOX,BASM({color:0xffe600}));ly.scale.set(.12,1.5,1.5);ly.position.set(711.85,4.2,30);scene.add(ly)}
 flat(704,30,14,30,0,.07,0x55585c);   // parkoviště u Lidlu (Hustopeče)
 // HUSTOPEČE (zkušební mini-město): Lidl, 2 domy, silnice, zastávka – jezdí se sem autobusem od našeho domu
 flat(690,30,8,80,0,.06,0x5d5f63);flat(735,64,90,8,0,.061,0x5d5f63);flat(724,30,72,76,0,.008,0x6fa05a);
 bx(740,52,750,60,6,0xf6c6a8,0xa0482c);bx(752,4,762,12,3.4,0xbfe0f2,0x8e3c26);
 // Náměstí Míru podle fotografií: čekárna, veřejná budova a průčelí obchodu.
 function squarePart(x,y,z,w,h,d,col){const m=new THREE.Mesh(BOX,M(col));m.scale.set(w,h,d);m.position.set(x,y,z);scene.add(m);return m}
 for(const z of [204,207,210,213,216,219]){
   squarePart(11.92,3.9,z,.12,1.45,1.75,0xf7ece2);squarePart(11.83,3.9,z,.07,1.18,1.43,0x7993a1);
 }
 const fascia=document.createElement('canvas');fascia.width=1024;fascia.height=80;
 const fc=fascia.getContext('2d');fc.font='bold 70px Arial';fc.fillStyle='#a22f29';fc.textAlign='center';fc.fillText('SUPERMARKET  BENAPOL',512,70,1000);
 const lettering=new THREE.Mesh(new THREE.PlaneGeometry(16.8,.86),BASM({map:new THREE.CanvasTexture(fascia),transparent:true,depthWrite:false}));
 lettering.rotation.y=-Math.PI/2;lettering.position.set(11.8,5.48,211);scene.add(lettering);
 for(const side of [-1,1]){
   const roof=squarePart(11,2.64,211+side*.63,2.2,.13,1.46,0x973a2c);roof.rotation.x=side*.38;
   squarePart(10.05,1.26,211+side*1.25,.09,2.45,.09,0xd6cfc3);
   for(const z of [204,207,215,218])squarePart(11.75,.73,z+side*.49,.08,.32,.92,0xa6322d)
 }
 tag('POTRAVINY',9.88,2.53,211,-Math.PI/2,1.7);
 squarePart(11.84,2.89,211,.17,.12,18,0xebe0cd);
 for(const z of [204,207,215,218])squarePart(11.83,1.45,z,.1,1.5,2.1,0x78949e);
 const schoolStart=scene.children.length;bx(12,173,23,196,7,0xe4d9a6);land(10,171,25,198,'ZŠ Klobouky u Brna');squarePart(17.5,7.06,184.5,11.5,.20,23.55,0x585751);
 for(const z of [175,178,181,184,187,190,193])for(const y of [1.4,3.6,5.8])squarePart(11.92,y,z,.1,1.25,1.7,0x8199a7);
  tag('ZÁKLADNÍ ŠKOLA KLOBOUKY U BRNA',11.82,4.55,184.5,-Math.PI/2,9);
 for(const o of scene.children.slice(schoolStart))o.position.y+=.9;box(11.85,172.8,23.2,196.2,0,.9,0xbba879);
 for(let k=0;k<6;k++)box(9.5+k*.38,181,12.2,188,0,.15*(k+1),0xbab5a8);
 squarePart(11.78,1.9,184.5,.28,2.3,2.6,0x465866);squarePart(11.35,3.18,184.5,1.45,.17,3.6,0x78786f);
 // Long concrete eave, glazed waiting room and open boarding side.
 squarePart(-13.45,3.16,177,5.1,.19,19.3,0xa9a59c);
 squarePart(-11.45,1.17,176.4,.2,2.35,4.6,0xb5afa3);
 for(const z of [171.6,179.6,183.7]){
   squarePart(-11.62,1.52,z,.075,2.97,.075,0x373c3d);
   squarePart(-12.03,1.19,z,.42,.62,.055,0x374756);
   squarePart(-12.03,1.19,z-.04,.34,.48,.016,0xf1ead7)
 }
 for(const z of [171.5,177.3,183.2]){
   squarePart(-12.12,.84,z,.075,.27,2.8,0x764e35);
   squarePart(-12.32,.52,z,.48,.10,2.8,0x825438);
   for(const dz of [-.9,.9])squarePart(-12.3,.26,z+dz,.10,.5,.11,0x525455)
 }
 sign('109   BRNO',-15.88,2.71,170,-Math.PI/2,1.8);
 for(const z of [168.4,186.8,209.5]){
   squarePart(-15.45,2.05,z,.085,4.1,.085,0x777e80);
   const head=new THREE.Mesh(new THREE.CylinderGeometry(.29,.10,.31,12),M(0xdedfd2));head.position.set(-15.45,4.19,z);scene.add(head)
 }
 for(const z of [172,176,180,184]){bx(-14.6,z-.08,-14.45,z+.08,3,0x343941);bx(-11.55,z-.08,-11.4,z+.08,3,0x343941)}
 for(const z of [174,178,182]){const pane=squarePart(-11.55,1.45,z,.06,2.8,3.8,0x778f96);pane.material=STDM({color:0x8199a4,transparent:true,opacity:.48});solid(-11.6,z-1.9,-11.5,z+1.9,2.8)}

 const paving=document.createElement('canvas');paving.width=paving.height=128;const pc=paving.getContext('2d');
 pc.fillStyle='#686969';pc.fillRect(0,0,128,128);
 // Interlocking fans of granite setts, repeated at the scale of paving stones.
 for(let row=-1;row<=3;row++)for(let col=-2;col<=3;col++){
   const cx=col*64+(row%2)*32,cy=row*32;
   for(let ring=0;ring<6;ring++){
     const inner=ring*6,outer=inner+5.5,count=2+ring*2;
     for(let k=0;k<count;k++){
       const a=-Math.PI+(k+.05)*Math.PI/count,b=-Math.PI+(k+.95)*Math.PI/count;
       const tone=147+((ring*11+k*7)%29);pc.fillStyle='rgb('+tone+','+(tone-2)+','+(tone-5)+')';
       pc.beginPath();pc.arc(cx,cy,outer,a,b);pc.arc(cx,cy,inner,b,a,true);pc.closePath();pc.fill()
     }
   }
 }
 const paveTex=new THREE.CanvasTexture(paving);paveTex.wrapS=paveTex.wrapT=THREE.RepeatWrapping;paveTex.repeat.set(9,13);
 flat(-6,195,30,44,0,.081,0xffffff).material=STDM({map:paveTex});
 // Cobbled bays and pollarded trees along the shop-side approach.
 window.__squareBays=[];
 for(const z of [180,187,194,201,208]){
   const x=6.5;
   if(SEG.some(seg=>sdist(x,z,seg)<seg.w/2+3))continue;
   flat(x,z,5.8,3.0,0,.096,0xb2b0aa);
   flat(x,z-1.5,5.8,.12,0,.105,0xd6d1c8);
   if(z===187||z===201){window.__squareBays.push([x,z,Math.PI/2]);continue}
   const grate=new THREE.Mesh(CYL,M(0x5a605a));grate.scale.set(.72,.055,.72);grate.position.set(x,.12,z);scene.add(grate);
   bx(x-.1,z-.1,x+.1,z+.1,2.65,0x76664f);
   for(const [dx,dy,dz,r] of [[0,3.6,0,1.55],[-.65,3.23,0,1.05],[.63,3.35,.18,1.04],[.12,4.22,-.35,1.08]]){
     const leaves=new THREE.Mesh(SPHLO,M(dy>3.5?0x608340:0x496937));leaves.scale.set(r,r*.86,r);leaves.position.set(x+dx,dy,z+dz);leaves.castShadow=true;scene.add(leaves)
   }
 }
 for(const side of [-1,1])for(let j=0;j<9;j++){
 const x=side<0?650-(j%3)*8:777+(j%3)*6,z=-14+j*11;
 bx(x,z,x+6.4,z+7,4+j%3,[0xc9b590,0xe2d5c1,0xdabd9f][j%3],0xa25d43);
 for(let k=0;k<3;k++)bx(x+.5+k*2,z-.08,x+1.3+k*2,z,1.7,0x798e9b,0,false)}
 // Hustopeče: Brněnská, parkoviště před prodejnou a sportoviště za ní.
 flat(705,30,19,39,0,.078,0x737578);
 for(const side of [-1,1])for(let i=0;i<8;i++){
   const z=13+i*4.6;flat(704+side*5,z,5,.12,0,.092,0xf4efe2);
   if(i%3===1){const car=new THREE.Mesh(BOX,M([0x324963,0xd8dbd8,0x924936][(Math.floor(i/3)+side+1)%3]));car.scale.set(3.4,1.05,1.65);car.position.set(704+side*5,.6,z+2);scene.add(car)}
 }
 for(let z=-5;z<67;z+=8)flat(690,z,.14,3,0,.088,0xf1ead7);
 for(let k=0;k<7;k++)flat(686.8+k,54,.55,3,0,.09,0xf5f5ec);
 bx(672,21,683,44,4.5,0xe4dac6,0x975d48);tag('POLIKLINIKA',683.05,3,33,Math.PI/2,3);
 bx(742,29,759,48,4.2,0xd8d9d3,0x8a9094);tag('KRYTÝ BAZÉN',750,3,48.05,0,4);
 flat(751,18,17,12,0,.08,0xd5c9b0);flat(751,18,14,9,0,.1,0x55bdd4);
 tag('LETNÍ KOUPALIŠTĚ',750,2,23,0,4);
 // Prosklený vstup pod markýzou s červenou hranou a sloupy.
 for(const z of [22,25,28,32,35,38]){const glass=new THREE.Mesh(BOX,M(0x69929e));glass.scale.set(.14,2.7,2.6);glass.position.set(711.86,1.62,z);scene.add(glass)}
 for(const z of [21,38])bx(708.8,z-.11,709.1,z+.11,3.65,0xd7dadd);
 const canopy=new THREE.Mesh(BOX,M(0xb71920));canopy.scale.set(3.4,.24,19);canopy.position.set(710.4,3.7,29.5);scene.add(canopy);
 tag('LIDL',708.66,3.7,30,-Math.PI/2,2.3);
 window.__shops.vlcek=shop(177,-283,191,-274,4.5,0xe6dbbe,'MILOŠ VLČEK · STAVEBNINY','s');
 for(let i=0;i<4;i++){
   const x=174+i*4,z=-268;const pile=new THREE.Mesh(new THREE.ConeGeometry(1.65,1.5,12),M([0xdfc58e,0xc4a373,0x989996,0x777d80][i]));
   pile.position.set(x,.75,z);scene.add(pile);solid(x-1.3,z-1.3,x+1.3,z+1.3,1);
   tag(['PÍSEK JEMNÝ','PÍSEK ZDICÍ','ŠTĚRK','DRŤ'][i],x,.55,z+1.5,0,1.8)
 }
 for(let i=0;i<5;i++)for(let j=0;j<3;j++){const timber=new THREE.Mesh(BOX,M(j%2?0xb98b55:0xa47747));timber.position.set(193+i*.28,.14+j*.29,-272);timber.scale.set(.26,.26,3.4);scene.add(timber)}
 solid(192.85,-273.7,194.3,-270.3,.85);
 {const c=document.createElement('canvas');c.width=512;c.height=110;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,512,110);g.fillStyle='#111';g.font='800 56px Rubik, sans-serif';g.textAlign='center';g.fillText('HUSTOPEČE',256,74);const m=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.5),BASM({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));m.position.set(694.6,2.4,4);m.rotation.y=Math.PI/2;scene.add(m);const pp=new THREE.Mesh(BOX,M(0x8a8f96));pp.scale.set(.08,2.6,.08);pp.position.set(694.6,1.3,4);scene.add(pp)}
 // fotbalové hřiště s brankami
 flat(168,335,36,58,0,.07,0x4f9a3c);flat(168,335,.15,58,0,.09,0xffffff);flat(168,335,36,.15,0,.09,0xffffff);land(148,304,188,366,'hřiště');
 for(const s of [-1,1]){const z=335+s*28;bx(164.4,z-.1,164.6,z+.1,2.4,0xffffff,0,false);bx(171.4,z-.1,171.6,z+.1,2.4,0xffffff,0,false);bx(164.4,z-.1,171.6,z+.1,2.5,0xffffff,0,false)}
 // hospoda U Zámku a pošta na náměstí, park u zámku, benzínka u Lidlu
 bx(12,156,26,167,6,0xf0d9b5,0x8e3c26);land(10,154,28,169,'hospoda');tag('HOSPODA U ZÁMKU',11.94,4.6,161.5,-Math.PI/2,4);door(11.94,161.5,0,1.3,2.2,-Math.PI/2,0x6b4226);window.__pubDoor=[10.6,161.5];
 for(const z of [179,189]){bx(10.5,z-.6,12,z+.6,.75,0x7a5232,0,false)}
 bx(14,222,26,234,5.5,0xf2c94c,0x3a3a3a);land(11,221,29,236,'pošta');tag('POŠTA',13.94,4.2,228,-Math.PI/2,2.4);door(13.94,228,0,1.2,2.2,-Math.PI/2,0x3a3a3a);
 flat(-53,251,46,22,0,.072,0x5c9a45);land(-77,240,-29,263,'park');for(let k=0;k<8;k++){const x=-72+k*6,z=k%2?244:258;const t=new THREE.Mesh(CYL,M(0x5a3a22));t.scale.set(.2,2.6,.2);t.position.set(x,1.3,z);scene.add(t);const c=new THREE.Mesh(SPHLO,M(0x3f8a3a));c.scale.set(2,1.8,2);c.position.set(x,3.6,z);c.castShadow=true;scene.add(c);solid(x-.2,z-.2,x+.2,z+.2,3)}
 flat(-53,251,40,1.6,0,.075,0xc9b896);for(const x of [-66,-56,-46,-36]){bx(x-1,249.2,x+1,249.7,.45,0x8a5a32,0,false)}
 bx(190,230,208,246,.2,0xb8bcc0,0,false);for(const [x,z] of [[191,231],[207,231],[191,245],[207,245]])bx(x-.2,z-.2,x+.2,z+.2,4.6,0xd8dde2,0);
 {const roof=new THREE.Mesh(BOX,M(0xc8202a));roof.scale.set(20,.5,18);roof.position.set(199,4.8,238);roof.castShadow=true;scene.add(roof)}
 for(const z of [234,242]){bx(198,z-.5,200,z+.5,1.6,0x1f4f9a);}tag('BENZÍNA',199,4.3,228.9,Math.PI,3);land(186,226,212,250,'benzínka');window.__pumps=[[199,234],[199,242]];
 bx(191,248,199,255,3,0xddddce,0x954442);tag('POKLADNA',195,2.2,247.94,Math.PI,2.8);land(190,247,201,256,'pokladna benzínky');
 // cedule s názvy ulic
 {const st=(t,x,z,ry)=>{const p0=new THREE.Mesh(BOX,M(0x8a8f96));p0.scale.set(.08,2.6,.08);p0.position.set(x,1.3,z);scene.add(p0);const c=document.createElement('canvas');c.width=512;c.height=110;const g=c.getContext('2d');g.fillStyle='#ffffff';g.fillRect(0,0,512,110);g.strokeStyle='#c8202a';g.lineWidth=12;g.strokeRect(6,6,500,98);g.fillStyle='#111';g.font='800 54px Rubik, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,256,58,470);
   const m=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.34),BASM({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));m.position.set(x,2.45,z);m.rotation.y=ry;scene.add(m)};
  st('MASARYKOVA',-26,-146,Math.PI/2);st('MASARYKOVA',-16.5,158,0);st('JIRÁSKOVA',46,-146,Math.PI/2);st('BRATŘÍ MRŠTÍKŮ',55.5,44,0);st('PŘÍČNÍ',-26,-247,0);st('BRNĚNSKÁ',-27,133,Math.PI/2);st('KRÁTKÁ',-16.5,32.5,0);st('NÁMĚSTÍ MÍRU',-12,174,0)}
 // policejní stanice (při zatčení tě odvezou sem)
 bx(14,148,30,162,7,0xe8ecef,0x3a4a5a);land(11,145,33,165,'policie');tag('POLICIE',13.94,5.5,155,-Math.PI/2,3);door(13.94,155,0,1.4,2.2,-Math.PI/2,0x1f4f9a);flat(9,155,6,10,0,.07,0x6a6d70);
 // vinné sklepy (u Příční), škola, odtahovka
 for(let k=0;k<5;k++){const x=150+k*9;bx(x,-300,x+6,-292,3,0xf4efe6,0x8e3c26);door(x+3,-291.94,0,1.2,1.9,0,0x6b4226)}land(146,-304,198,-288,'sklepy');
 tag('VINNÉ SKLEPY',172,3.6,-291.9,0,4);
 bx(-150,-246,-130,-214,9,0xf2e8c9,0x3a3a3a);land(-152,-248,-128,-212,'škola');tag('ZÁKLADNÍ ŠKOLA',-129.94,7,-230,Math.PI/2,5);
 flat(120,-150,26,22,0,.07,0x7a7d80);bx(122,-161,132,-155,3.5,0xd0d4d8,0x55585c);land(105,-162,135,-138,'odtahovka');tag('ODTAHOVÁ SLUŽBA',127,3,-154.94,0,4);
 // ---- domy podél silnic (instancovaně, natočené k silnici) ----
 const FEN=[],PARKC=[];const HSR=[],hitHouse=(x,z,rr)=>HSR.some(h=>Math.hypot(h[0]-x,h[1]-z)<h[2]+rr);
 const inRect=(x,z,r,R)=>x>R[0]-r&&x<R[2]+r&&z>R[1]-r&&z<R[3]+r;
 for(const g of SEG){if(g.loc)continue;const [ax,az]=g.a,[bx2,bz]=g.b,dx=bx2-ax,dz=bz-az,L=Math.hypot(dx,dz),ux=dx/L,uz=dz/L,nx=uz,nz=-ux;
   for(const side of [-1,1])for(let t=7;t<L-7;t+=11+Math.random()*4){const w=7+Math.random()*3,d=7+Math.random()*3,off=g.w/2+1.7+1.2+d/2;
     const cx=ax+ux*t+nx*side*off,cz=az+uz*t+nz*side*off,rr=Math.max(w,d)*.55;
     if(cx<TOWN.x1+4||cx>TOWN.x2-4||cz<TOWN.z1+4||cz>TOWN.z2-4)continue;
     if(inRect(cx,cz,rr,LOCAL)||LANDS.some(R=>inRect(cx,cz,rr,R))||hitHouse(cx,cz,rr))continue;
     if(SEG.some(o=>sdist(cx,cz,o)<o.w/2+Math.hypot(w,d)/2+.5))continue;
     if(JUN.some(([jx,jz])=>Math.hypot(cx-jx,cz-jz)<rr+9))continue;
     HSR.push([cx,cz,rr,w,d,Math.atan2(ux,uz)+(side>0?Math.PI:0),Math.random()<.3?6:3.4]);
     {const fo=g.w/2+1.7+.3;FEN.push([ax+ux*t+nx*side*fo,az+uz*t+nz*side*fo,Math.atan2(ux,uz),w+1.2]);
      const pt=t+(w/2+1.5)*(Math.random()<.5?1:-1);PARKC.push([ax+ux*pt+nx*side*(g.w/2-.7),az+uz*pt+nz*side*(g.w/2-.7),Math.atan2(ux,uz)+(side<0?Math.PI:0)])}}}
 // ploty s brankou podél chodníku, auta na příjezdech
 {const fm=[],q0=new THREE.Quaternion(),m0=new THREE.Matrix4(),v0=new THREE.Vector3(),s0=new THREE.Vector3(),U=new THREE.Vector3(0,1,0);
  for(const [x,z,r,L] of FEN){q0.setFromAxisAngle(U,r);const fx=Math.sin(r),fz=Math.cos(r);for(const [a,b] of [[-L/2,-.7],[.7,L/2]]){const c=(a+b)/2,len=b-a;m0.compose(v0.set(x+fx*c,.55,z+fz*c),q0,s0.set(.06,1.1,len));fm.push(m0.clone());m0.compose(v0.set(x+fx*c,.9,z+fz*c),q0,s0.set(.08,.08,len));fm.push(m0.clone())}}
  const fi=new THREE.InstancedMesh(BOX,STDM({color:0x7a5232}),fm.length);fm.forEach((m,i)=>fi.setMatrixAt(i,m));fi.castShadow=true;scene.add(fi)}
 window.__townPark=PARKC.filter(([x,z])=>!HSR.some(h=>Math.hypot(h[0]-x,h[1]-z)<h[2]+2.4)&&!JUN.some(([jx,jz])=>Math.hypot(x-jx,z-jz)<10)&&!LANDS.some(R=>inRect(x,z,2.5,R))).filter((_,i)=>i%2===0).slice(0,36);
 const n=HSR.length,body=new THREE.InstancedMesh(BOX,STDM({color:0xffffff}),n);
 const prism=(()=>{const sh=new THREE.Shape();sh.moveTo(-.5,0);sh.lineTo(.5,0);sh.lineTo(0,1);sh.lineTo(-.5,0);const g=new THREE.ExtrudeGeometry(sh,{depth:1,bevelEnabled:false});g.translate(0,0,-.5);return g})();
 const roof=new THREE.InstancedMesh(prism,STDM({color:0xffffff}),n),win=[];
 const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3(),sc=new THREE.Vector3(),cc=new THREE.Color(),UP=new THREE.Vector3(0,1,0);
 const WALLS=[0xf6c6a8,0xbfe0f2,0xf2e28a,0xc8e6b0,0xf2b8c6,0xd8c8f0,0xffd08a,0xefe3cf,0xf2e8c9,0xa8d8c8,0xf0d9b5,0xe9e0d6,0xf3e2c0,0xdfe6d8,0xf2c94c,0xcfe0c8],ROOFS=[0xa0482c,0x8e3c26,0xb4553a,0x7a3a2a,0x3a3a3a,0x9a4a2c];
 HSR.forEach(([x,z,rr,w,d,ry,h],i)=>{q.setFromAxisAngle(UP,ry);m4.compose(v.set(x,h/2,z),q,sc.set(w,h,d));body.setMatrixAt(i,m4);body.setColorAt(i,cc.setHex(WALLS[i%WALLS.length]));
   const q2=new THREE.Quaternion().setFromAxisAngle(UP,ry+Math.PI/2);m4.compose(v.set(x,h,z),q2,sc.set(d+.5,(d+.5)*.45,w+.5));roof.setMatrixAt(i,m4);roof.setColorAt(i,cc.setHex(ROOFS[i%ROOFS.length]));
   const fx=Math.sin(ry),fz=Math.cos(ry),rx=Math.cos(ry),rz=-Math.sin(ry);
   for(const t of [-.28,.28])for(const y of h>4?[1.5,4.4]:[1.5]){m4.compose(v.set(x+fx*(d/2+.03)+rx*t*w,y,z+fz*(d/2+.03)+rz*t*w),q,sc.set(1.1,1.1,.08));win.push(m4.clone())}
   {const n=Math.max(1,Math.ceil(w/1.6)),m=Math.max(1,Math.ceil(d/1.6)),cw=w/n,cd=d/m,c=Math.abs(Math.cos(ry)),s2=Math.abs(Math.sin(ry)),hx=(cw*c+cd*s2)/2,hz=(cw*s2+cd*c)/2;   // přesná kolize natočeného domu (mřížka malých boxů)
    for(let i=0;i<n;i++)for(let j=0;j<m;j++){const lx=(i+.5)*cw-w/2,lz=(j+.5)*cd-d/2,px=x+lx*Math.cos(ry)+lz*Math.sin(ry),pz=z-lx*Math.sin(ry)+lz*Math.cos(ry);hsolid(px-hx,pz-hz,px+hx,pz+hz,h)}}});
 body.castShadow=body.receiveShadow=true;roof.castShadow=true;scene.add(body,roof);
 const wi=new THREE.InstancedMesh(BOX,STDM({color:0x5d86a8}),win.length);win.forEach((m,i)=>wi.setMatrixAt(i,m));scene.add(wi);
 window.__THS=HSR;for(const [cx,cz,,w,d,ry,h] of HSR)ridges.push({cx,cz,y:h+1.2,len:d,alongZ:true,ux:Math.sin(ry),uz:Math.cos(ry)});
 // lampy podél nových silnic
 const lp=[];for(const g of SEG){if(g.loc)continue;const [ax,az]=g.a,[bx2,bz]=g.b,L=Math.hypot(bx2-ax,bz-az),nx=(bz-az)/L,nz=-(bx2-ax)/L;for(let t=10;t<L;t+=28)lp.push([ax+(bx2-ax)*t/L+nx*(g.w/2+1.2),az+(bz-az)*t/L+nz*(g.w/2+1.2)])}
 const li=new THREE.InstancedMesh(BOX,M(0x3a3a3a),lp.length);lp.forEach(([x,z],i)=>{m4.compose(v.set(x,2.1,z),q.identity(),sc.set(.12,4.2,.12));li.setMatrixAt(i,m4)});scene.add(li);
 const lh=new THREE.InstancedMesh(new THREE.SphereGeometry(.28,10,8),BASM({color:0x555555}),lp.length);lp.forEach(([x,z],i)=>{m4.compose(v.set(x,4.25,z),q.identity(),sc.set(1,.7,1));lh.setMatrixAt(i,m4)});scene.add(lh);window.__lampHeads=lh.material;
 // za městem: pole a vinohrady (okraj světa)
 const ring=[[-420,-700,TOWN.x1,800],[TOWN.x2,-700,520,800],[TOWN.x1,-700,TOWN.x2,TOWN.z1],[TOWN.x1,TOWN.z2,TOWN.x2,800]];
 const FIELD=[0xc9b46a,0x9fbf5a,0xb8a05a,0x7fae4a,0xd8c27a];const fl=[];for(const [a,b,c,d] of ring)for(let x=a;x<c;x+=60)for(let z=b;z<d;z+=60)fl.push([x+30,z+30]);
 {const X90=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2),fm=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),STDM({color:0xffffff}),fl.length);
  fl.forEach(([x,z],i)=>{m4.compose(v.set(x,.009,z),X90,sc.set(58,58,1));fm.setMatrixAt(i,m4);fm.setColorAt(i,cc.setHex(FIELD[i%FIELD.length]))});fm.receiveShadow=true;scene.add(fm)}
 const vr=[];for(let k=0;k<400;k++){const x=TOWN.x2+10+Math.random()*120,z=-300+Math.floor(Math.random()*24)*25+Math.random()*2;vr.push([x,z])}
 for(let k=0;k<300;k++){const x=TOWN.x1+20+Math.random()*(TOWN.x2-TOWN.x1-40),z=TOWN.z2+10+Math.floor(Math.random()*8)*6;vr.push([x,z])}
 const vi=new THREE.InstancedMesh(BOX,M(0x3f7d3a),vr.length);vr.forEach(([x,z],i)=>{m4.compose(v.set(x,.6,z),q.identity(),sc.set(3,1.2,.5));vi.setMatrixAt(i,m4)});scene.add(vi);
}
// ---------- svařování za Bytem 2 (u zdi u dílny): Pavel tu svařuje stůl, když nemá co dělat ----------
pbox(688,505,732,530,.78,.84,0x5a5f66);for(const [x,y] of [[689,506],[729,506],[689,527],[729,527]])pbox(x,y,x+3,y+3,0,.78,0x3a3d42,false);solid(X(688),Z(505),X(732),Z(530),.84);
for(const [a,b,c,d] of [[694,510,726,512],[694,523,726,525],[694,510,696,525],[724,510,726,525]])pbox(a,b,c,d,.84,.88,0x8a8e94,false);   // rám stolu, co se svařuje
pbox(740,512,752,528,0,.55,0x1f4f9a);pbox(741,513,751,527,.55,.6,0xc8202a,false);                                          // svářečka
const WELD={L:new THREE.PointLight(0x9fd8ff,0,6,2),sp:[],on:0,t:0};WELD.L.position.set(X(710),1.05,Z(517));scene.add(WELD.L);
for(let i=0;i<14;i++){const m=new THREE.Mesh(SPH,BASM({color:0xffb347}));m.scale.setScalar(.018);m.visible=false;scene.add(m);WELD.sp.push({m,v:new THREE.Vector3(),life:0})}
function weldFx(on,dt){WELD.active=!!on;WELD.L.intensity=on?1.2+Math.random()*1.4:0;
  for(const s of WELD.sp){if(s.life<=0&&on&&Math.random()<dt*25){s.life=.35+Math.random()*.3;s.m.position.set(X(710)+(Math.random()-.5)*.1,.9,Z(517)+(Math.random()-.5)*.1);s.v.set((Math.random()-.5)*2.4,1+Math.random()*1.6,(Math.random()-.5)*2.4)}
    if(s.life>0){s.life-=dt;s.v.y-=9*dt;s.m.position.addScaledVector(s.v,dt);if(s.m.position.y<.02){s.m.position.y=.02;s.v.set(0,0,0)}}s.m.visible=s.life>0}}
function pavelIdle(o,dt,t){const hr=DAY.t*24;
  if(hr<8||hr>=21||inside&&false){step(o,0,0,0,dt);weldFx(false,dt);return}
  const sx=X(710),sz=Z(490);
  if(!goTo(o,sx,sz,o.speed*.8,dt,.3)){weldFx(false,dt);return}
  o.head=0;o.obj.rotation.y=0;WELD.t-=dt;if(WELD.t<=0){WELD.on=!WELD.on;WELD.t=WELD.on?3+Math.random()*3:1+Math.random()*1.5}
  armR.rotation.x=WELD.on?-1.2+Math.sin(t*20)*.05:-.4;weldFx(!!WELD.on,dt);if(WELD.on&&!inside)play('welding',distVol(o,.4),3500)}
// ---------- auta: parkoviště na vrakovišti + Simonův černý Golf před garáží ----------
function mkCar(px,py,rot,col,golf){const g=new THREE.Group();g.position.set(X(px),0,Z(py));g.rotation.y=rot;scene.add(g);
  const b=(c,sx,sy,sz,x,y,z)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
  for(const sx of [-1,1]){b(col,.22,.14,.21,sx*.92,1.03,.68);b(0x343a3d,.05,.38,.1,sx*.81,1.13,-.14);b(0xababaa,.035,.055,.16,sx*.89,.81,.12)}
  b(col,1.76,.62,golf?4.1:4.4,0,.55,0);b(col,1.6,.52,golf?2.3:2.1,0,1.1,golf?-.35:-.1);b(0x2a3640,1.62,.38,golf?2.15:1.95,0,1.12,golf?-.35:-.1);
  for(const sx of [-.62,.62]){b(0xffe7aa,.32,.12,.04,sx,.66,golf?2.06:2.21);b(0xb51e24,.3,.12,.04,sx,.7,golf?-2.06:-2.21)}
  if(golf){b(0xd8dde2,.2,.2,.02,0,.62,2.07);b(0x111111,1.7,.08,.06,0,.32,2.06)}
  g.userData.wheels=[];for(const sx of [-.86,.86])for(const sz of golf?[-1.3,1.3]:[-1.4,1.4]){const w=new THREE.Mesh(CYL,M(0x1a1a1a));w.scale.set(.32,.22,.32);w.rotation.z=Math.PI/2;w.position.set(sx,.32,sz);g.add(w);g.userData.wheels.push(w)}
  return g}
function carBox(g,on){const r=g.rotation.y,c=Math.abs(Math.cos(r)),sn=Math.abs(Math.sin(r)),width=g.userData.halfWidth||.9,length=g.userData.halfLength||2.1,hx=width*c+length*sn,hz=width*sn+length*c;
  if(!g.userData.s){g.userData.s={top:1.4}}Object.assign(g.userData.s,{x1:g.position.x-hx,x2:g.position.x+hx,z1:g.position.z-hz,z2:g.position.z+hz});
  const i=solids.indexOf(g.userData.s);if(on&&i<0)solids.push(g.userData.s);if(!on&&i>=0)solids.splice(i,1)}
const VEH=[];   // všechna auta: {g,kind:'simon'|'golf'|'parked'|'traffic'|'police',name}
for(const [x,y,c] of [[150,230,0x8a8f96],[225,230,0xe8e8e8]]){const g=mkCar(x,y,0,c);carBox(g,true);VEH.push({g,kind:'own',name:'auto z našeho placu'})}
function clearParking(x,z,r){
  const co=Math.abs(Math.cos(r)),si=Math.abs(Math.sin(r)),hx=1.05*co+2.35*si,hz=1.05*si+2.35*co;
  const overlaps=b=>b.top>.32&&b.x1<x+hx&&b.x2>x-hx&&b.z1<z+hz&&b.z2>z-hz;
  if(solids.some(overlaps))return false;
  for(const dx of [-hx,0,hx])for(const dz of [-hz,0,hz])if((hgAt(x+dx,z+dz)||[]).some(overlaps))return false;
  if(window.__THS.some(([cx,cz,,w,d])=>Math.hypot(x-cx,z-cz)<Math.hypot(w,d)/2+2.8))return false;return !window.__HS.some(([a,b,c,d])=>X(a)<x+hx&&X(c)>x-hx&&Z(b)<z+hz&&Z(d)>z-hz)
}
for(const [x,y,c] of window.__parkSpots){if(!clearParking(X(x),Z(y),Math.PI))continue;const g=mkCar(x,y,Math.PI,c);carBox(g,true);VEH.push({g,kind:'parked',name:'zaparkované auto'})}
{const CC=[0xd0d4d8,0x1f4f9a,0x2a2a2a,0xb51e24,0xe8e8e8,0x2e6b3a,0x8a8f96,0xf2f2f2,0x6b4226];for(const [x,z,r] of [...window.__squareBays,...(window.__townPark||[])]){if(!clearParking(x,z,r))continue;const g=mkCar(658,738,r,CC[Math.floor(Math.random()*CC.length)],Math.random()<.4);g.position.set(x,0,z);carBox(g,true);VEH.push({g,kind:'parked',name:pick(['Škoda Octavia','Škoda Fabia','VW Golf','VW Passat','Dacia Duster','Škoda Felicia'])})}}
const familyCars=['Mustang · táta','Toyota · máma','Voyager · náklad'].map((name,i)=>{
 const px=420+i*210,py=1707,col=[0x9dd4ec,0xf68323,0x86898c][i],g=mkCar(px,py,Math.PI/4,col,i===1);
 const trim=(c,w,h,d,x,y,z)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(w,h,d);m.position.set(x,y,z);g.add(m)};
 if(i===0){trim(col,1.68,.14,1.5,0,.91,1.36);trim(0x32383c,1.65,.14,.1,0,1,-1.9);for(const side of [-1,1])for(let j=0;j<3;j++)trim(0xc93438,.08,.24,.05,side*(.45+.14*j),.68,-2.22)}
 if(i===2){trim(col,1.75,.9,3,0,1.15,-.48);trim(0x465761,1.77,.43,2.5,0,1.27,-.55);trim(0x986846,.36,.15,.04,.65,.56,-2.22)}
 carBox(g,true);const c={g,name,kind:'own'};VEH.push(c);
 const line=box(X(px-96)-.035,Z(py)-2.05,X(px-96)+.035,Z(py)+2.05,.037,.042,0xe6e0d4,false);line.rotation.y=Math.PI/4;return c
});
for(const [x,z,rot] of [[188,233,0],[188,240,0],[205,251,Math.PI/4],[-64,239,Math.PI/2],[-53,239,Math.PI/2],[-42,239,Math.PI/2],[675,53,.15],[681,53,.15]]){
 const g=mkCar(OX+x/S,OY+z/S,rot,[0x8e4b46,0xc3c5bd,0x485973][Math.abs(Math.round(x))%3]);carBox(g,true);VEH.push({g,kind:'parked',name:'Zaparkované auto'})}
const golf=mkCar(580,300,0,0x121212,true);carBox(golf,true);VEH.push({g:golf,kind:'golf',name:'Simonův Golf'});
// ---------- pergola přes celý dvorek (až k Bytu 1) + posezení ----------
for(const x of [104,330,546])for(const y of [1140,1415])pbox(x,y-3,x+6,y+3,0,2.9,0x7a5232);
for(const y of [1140,1415])pbox(100,y-5,552,y+5,2.9,3.05,0x6b4a2e,false);
pbox(100,1275,552,1283,2.9,3.05,0x6b4a2e,false);
{const z1=Z(1133),z2=Z(1425),x1=X(100),x2=X(552),yW=3.45,yE=3.0,len=Math.hypot(x2-x1,yW-yE),ang=Math.atan2(yW-yE,x2-x1);
 const roof=new THREE.Mesh(BOX,STDM({color:0xcfe8ff,transparent:true,opacity:.28,depthWrite:false}));   // průhledný polykarbonát, spád od zadní stěny k dlažbě
 roof.scale.set(len+.3,.03,z2-z1+.3);roof.position.set((x1+x2)/2,(yW+yE)/2+.08,(z1+z2)/2);roof.rotation.z=-ang;scene.add(roof);
 for(let z=z1;z<=z2+.01;z+=(z2-z1)/5){const r=new THREE.Mesh(BOX,M(0x6b4a2e));r.scale.set(len,.1,.08);r.position.set((x1+x2)/2,(yW+yE)/2,z);r.rotation.z=-ang;r.castShadow=true;scene.add(r)}
 pbox(96,1133,104,1425,2.9,yW,0x6b4a2e,false)}
pbox(288,1300,362,1336,.72,.78,0x8a5a32);pbox(320,1312,330,1324,0,.72,0x6b4a2e,false);
pbox(288,1280,362,1292,0,.45,0x6b4a2e);pbox(288,1344,362,1356,0,.45,0x6b4a2e);

// ---------- mámina zahrádka (u schodů k Bytu 1) ----------
const GZ=[562,1140,656,1236];
pbox(GZ[0],GZ[1],GZ[2],GZ[3],0,.25,0x6b4a2f);
pbox(GZ[0]-4,GZ[1]-4,GZ[2]+4,GZ[1]+1,0,.3,0x8a5a32,false);pbox(GZ[0]-4,GZ[3]-1,GZ[2]+4,GZ[3]+4,0,.3,0x8a5a32,false);
pbox(GZ[0]-4,GZ[1]-4,GZ[0]+1,GZ[3]+4,0,.3,0x8a5a32,false);pbox(GZ[2]-1,GZ[1]-4,GZ[2]+4,GZ[3]+4,0,.3,0x8a5a32,false);
for(let i=0;i<12;i++){
  const m=new THREE.Mesh(SPH,M(i%3?0x4f9a3c:0x3f8a32));const s=.17+Math.random()*.1;m.scale.set(s,s*1.2,s);
  m.position.set(X(578+(i%3)*24),.36,Z(1153+Math.floor(i/3)*22));m.castShadow=true;scene.add(m);
  if(i%2){const f=new THREE.Mesh(SPH,M([0xe8505b,0xf2c14e,0xffffff][i%3]));f.scale.set(.07,.07,.07);f.position.set(m.position.x,.6,m.position.z);scene.add(f)}
}
const holes=[];// díry od Ashley
function addHole(){if(holes.length>6)return;const m=new THREE.Mesh(new THREE.CircleGeometry(.18,12),M(0x3d2a1a));m.rotation.x=-Math.PI/2;
  m.position.set(X(636+Math.random()*14),.256,Z(1150+Math.random()*80));scene.add(m);holes.push(m)}

// ---------- prolézací tunel na cvičišti ----------
{const t=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,3.2,18,1,true),STDM({color:0x2f7fd6,side:THREE.DoubleSide}));
 t.rotation.x=Math.PI/2;t.position.set(X(1135),.38,Z(870));t.castShadow=true;scene.add(t);
 for(let i=-3;i<=3;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(.385,.025,6,20),M(0xf2c14e));r.position.set(X(1135),.38,Z(870)+i*.5);scene.add(r)}}

// ---------- vrakoviště autodílů (šedá zem) ----------
plane(62,58,622,805,.008,STDM({color:0x8e8c86}));
const CHROME=0xd8dde2,BUMPC=[CHROME,CHROME,0x1d1d1d,0xb51e24,0x1f4f9a,0xe8e3d8,0x2e6b3a,0x1d1d1d,CHROME,0xd4a017];
const _p=new THREE.Vector3(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new THREE.Vector3(),_c=new THREE.Color();
const IL={};
const pm=(x,y,z,rx,ry,rz)=>new THREE.Matrix4().compose(_p.set(x,y,z),_q.setFromEuler(_e.set(rx,ry,rz)),_s.set(1,1,1));
function put(key,P,lx,ly,lz,lrx,lry,lrz,sx,sy,sz,col){
  const lm=new THREE.Matrix4().compose(_p.set(lx,ly,lz),_q.setFromEuler(_e.set(lrx,lry,lrz)),_s.set(sx,sy,sz));
  (IL[key]=IL[key]||[]).push([P.clone().multiply(lm),col]);
}
function flush(key,geo,mat){const a=IL[key];if(!a)return;const im=new THREE.InstancedMesh(geo,mat,a.length);
  a.forEach(([m,c],i)=>{im.setMatrixAt(i,m);if(c!=null)im.setColorAt(i,_c.set(c))});im.castShadow=true;im.receiveShadow=true;scene.add(im)}
const rnd=(a,b)=>a+Math.random()*(b-a);
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function bumper(x,y,z,ry,col){const P=pm(x,y,z,0,ry,0);
  put('b',P,0,0,0,0,0,0,1.6,.22,.16,col);put('b',P,-.93,0,-.12,0,.6,0,.36,.22,.16,col);put('b',P,.93,0,-.12,0,-.6,0,.36,.22,.16,col);
  put('k',P,0,-.1,0,0,0,0,1.5,.05,.17,0x111111);put('k',P,0,0,.09,0,0,0,.36,.12,.02,0x222222)}
// stohy nárazníků: 4 sloupce × 8 řad
for(let c=0;c<2;c++)for(let r=0;r<2;r++){
  const cx=187+c*91,cy=492+r*68,n=6+Math.floor(Math.random()*3),ry=rnd(-.08,.08)+(Math.random()<.5?Math.PI:0);
  for(let i=0;i<n;i++)bumper(X(cx)+rnd(-.05,.05),.11+i*.17,Z(cy)+rnd(-.04,.04),ry+rnd(-.06,.06),pick(BUMPC));
  solid(X(cx-38),Z(cy-14),X(cx+38),Z(cy+14),.2+n*.17);
}
// dveře od aut: 3 řady po 50
const DOORC=[0x1d1d1d,0xb51e24,0x1f4f9a,0xe8e3d8,0x2e6b3a,0x7a7f86,0xd4a017,0x5b2a6e];
for(const [rx,ry] of [[376,462],[468,474]]){for(let i=0;i<10;i++){
  const c=pick(DOORC),P=pm(X(rx)+rnd(-.03,.03),0,Z(ry)+i*.12,.13,rnd(-.05,.05),0);
  put('d',P,0,.36,0,0,0,0,1.1,.62,.07,c);put('d',P,0,1.1,0,0,0,0,1.02,.05,.07,c);put('d',P,-.5,.88,0,0,0,0,.05,.45,.07,c);put('d',P,.5,.88,0,0,0,0,.05,.45,.07,c);
  put('g',P,0,.88,0,0,0,0,.96,.42,.03,null);put('c',P,.34,.5,.05,0,0,0,.16,.04,.03,CHROME)}
  solid(X(rx-24),Z(ry-4),X(rx+24),Z(ry)+10*.12+.2,1.3)}
// stojany se skly: 8 stojanů po 15 tabulích
for(let k=0;k<1;k++){const x=X(167),z=Z(382),P=pm(x,0,z,0,0,0);
  for(const sx of [-1,1])for(const sz of [-.7,.7])put('w',P,sx*.25,.6,sz,0,0,-sx*.35,.08,1.3,.08,0x6b4a2e);
  put('w',P,0,1.2,0,0,0,0,.08,.08,1.6,0x6b4a2e);
  for(let i=0;i<8;i++){const sd=i%2?1:-1,o=.12+Math.floor(i/2)*.035;put('g',P,sd*o,.55,0,0,0,sd*.32,.02,.9,1.5,null)}
  solid(x-.55,z-.85,x+.55,z+.85,1.3)}
// paletové regály s V8 motory (120 ks)
function rack(x1,z1,bays,alongX,levels){
  const len=bays,dx=alongX?1:0,dz=alongX?0:1,px=alongX?0:1,pz=alongX?1:0;
  for(let b=0;b<=bays;b++)for(const d of [0,1]){const P=pm(x1+dx*b+px*d,1.4,z1+dz*b+pz*d,0,0,0);put('u',P,0,0,0,0,0,0,.08,2.8,.08,0x1f4f9a)}
  for(const lv of [1,2])for(const d of [0,1]){const P=pm(x1+dx*len/2+px*d,lv-.05,z1+dz*len/2+pz*d,0,0,0);put('u',P,0,0,0,0,0,0,alongX?len:.08,.1,alongX?.08:len,0xe8742a)}
  for(let b=0;b<bays;b++)for(let lv=0;lv<levels;lv++)engine(x1+dx*(b+.5)+px*.5,lv?lv+.02:0,z1+dz*(b+.5)+pz*.5,rnd(-.15,.15));
  solid(Math.min(x1,x1+dx*len+px),Math.min(z1,z1+dz*len+pz),Math.max(x1,x1+dx*len+px),Math.max(z1,z1+dz*len+pz),3)}
const COVC=[0xe8603a,0xb51e24,CHROME,0x1f4f9a,0x1d1d1d,0xd4a017];
function engine(x,y,z,ry){const P=pm(x,y,z,0,ry,0),cv=pick(COVC);
  put('p',P,0,.06,0,0,0,0,.9,.12,.9,0xb08a5a);put('e',P,0,.33,0,0,0,0,.5,.42,.7,0x4a4f55);
  put('e',P,-.26,.55,0,0,0,.5,.2,.22,.68,0x4a4f55);put('e',P,.26,.55,0,0,0,-.5,.2,.22,.68,0x4a4f55);
  put('e',P,-.34,.67,0,0,0,.5,.13,.07,.62,cv);put('e',P,.34,.67,0,0,0,-.5,.13,.07,.62,cv);
  put('f',P,0,.76,0,0,0,0,.22,.09,.22,CHROME);put('f',P,0,.36,.38,Math.PI/2,0,0,.12,.05,.12,0x222222)}
rack(X(270),Z(185),4,false,2);
const WHITE=STDM({color:0xffffff}),glassMat=STDM({color:0x9fd3ff,transparent:true,opacity:.45});
for(const k of ['b','k','d','c','w','u','p','e'])flush(k,BOX,WHITE);
flush('f',CYL,WHITE);flush('g',BOX,glassMat);

// ---------- INTERIÉR DÍLNY (samostatná scéna, mimo dvorek) ----------
const IX=70,IZ=0,IW=7,ID=5.5,IH=2.8;let roomL=null;let GARref=null;            // dílna (menší)
const FX=100,FZ=0,FW=9,FD=6.5,FH=2.7;let FLK=null;
// interiéry (každý je samostatná scéna daleko od dvorku): cx,cz střed, w×d×h rozměry, f = síla okolního světla
const RM={shop:{cx:IX,cz:IZ,w:IW,d:ID,h:IH,f:.3},flat:{cx:FX,cz:FZ,w:FW,d:FD,h:FH,f:.06},
  byt2:{cx:130,cz:0,w:13,d:3.8,h:2.6,f:.55,L:.7,top:1},byt1:{cx:160,cz:0,w:10,d:6,h:2.6,f:.6,L:.75,top:1},hdum:{cx:190,cz:-3.65,w:18,d:12.7,h:2.7,f:.6,L:.7,top:1},sklad:{cx:220,cz:0,w:11,d:3.4,h:2.3,f:.5,L:.65,top:1},sklep:{cx:245,cz:0,w:9,d:4.2,h:2.4,f:.35,L:.55,top:1},domek:{cx:262,cz:0,w:3.6,d:3,h:2.2,f:.08,L:.06,top:1},pekarna:{cx:275,cz:0,w:7,d:5,h:2.8,f:.7,L:.8,top:1},lidl:{cx:300,cz:0,w:16,d:12,h:3.6,f:.85,L:1,top:1},hospoda:{cx:330,cz:0,w:10,d:7,h:2.8,f:.55,L:.7,top:1}};          // Pavlův byt (tma, elektrika v procesu)
RM.simonHome={cx:645,cz:0,w:12,d:9,h:3.3,f:.85,L:1,top:1};RM.fuelShop={cx:659,cz:0,w:8,d:7,h:3,f:.85,L:1,top:1};
const mallStores=['Hornbach','Action','Albert','Bauhaus','Alza','Datart','Elkov'];
for(const [i,n] of mallStores.slice(1).entries())RM[n]={cx:550+i*14,cz:0,w:10,d:8,h:3.4,f:.85,L:1,top:1};
RM.mall={cx:502,cz:0,w:30,d:16,h:4,f:.85,L:1,top:1};RM.granny={cx:535,cz:0,w:7,d:6,h:2.8,f:.85,L:1,top:1};RM.hornbach={cx:470,cz:0,w:14,d:10,h:4,f:.85,L:1,top:1};RM.benapol={cx:355,cz:0,w:12,d:10,h:3.4,f:.8,L:1,top:1};RM.vlcek={cx:380,cz:0,w:14,d:10,h:4,f:.8,L:1,top:1};
for(const [i,c] of window.__cabins.entries())RM[c.key]={cx:410+i*12,cz:0,w:5.5,d:6.5,h:2.8,f:.5,L:.55,top:1};
const shopLights=[];let flash=null;
function jeepSeat(x,z,ry){                      // sedačka z Jeepu Cherokee KJ 2.8 CRD (2007): tmavě šedá látka, světlejší střed
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);
  const sb=(c,sx,sy,sz,px,py,pz,rx=0)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(sx,sy,sz);m.position.set(px,py,pz);m.rotation.x=rx;m.castShadow=true;g.add(m)};
  const D=0x3f4247,L=0x5d6066,K=0x1c1c1c;
  sb(K,.5,.26,.5,0,.13,0);sb(D,.56,.14,.56,0,.33,.02);sb(L,.3,.02,.42,0,.41,.04);sb(K,.06,.16,.5,-.3,.3,.02);
  sb(D,.54,.78,.14,0,.78,-.27,-.16);sb(L,.3,.6,.02,0,.76,-.19,-.16);
  sb(D,.3,.2,.12,0,1.3,-.38,-.16);sb(0x888888,.02,.1,.02,-.08,1.17,-.36);sb(0x888888,.02,.1,.02,.08,1.17,-.36);
  return g}
function buildInterior(){
 // ===== dílna =====
 {const x1=IX-IW/2,x2=IX+IW/2,z1=IZ-ID/2,z2=IZ+ID/2,WALLC=0xefede6;
  box(x1,z1,x2,z2,0,.012,0x8c8b87,false);
  box(x1-.2,z1-.2,x2+.2,z1,0,IH,WALLC);box(x1-.2,z2,x2+.2,z2+.2,0,IH,WALLC);box(x1-.2,z1,x1,z2,0,IH,WALLC);box(x2,z1,x2+.2,z2,0,IH,WALLC);
  box(x1-.2,z1-.2,x2+.2,z2+.2,IH,IH+.1,0x3e3428,false);
  const L=new THREE.PointLight(0xffd9a8,.55,12,1.6);L.position.set(IX,IH-.4,IZ);scene.add(L);shopLights.push(L);
  const t=new THREE.Mesh(BOX,BASM({color:0xcfc8b8}));t.scale.set(1.2,.05,.1);t.position.set(IX,IH-.04,IZ);scene.add(t);
  door(IX-2,z2-.05,0,1.2,2.2,Math.PI,0x4a3a2a);sign('DÍLNA',IX-2,2.45,z2-.08,Math.PI,1.3);
  // sprejové grafity (černý sprej, schválně blbá gramatika)
  const graf=(txt,x,y,z,ry,w,sz=72,rot=0)=>{const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d');g.translate(512,256);g.rotate(rot);
    const lines=txt.split('|');g.font='900 '+sz*2+'px "Comic Sans MS",cursive';g.textAlign='center';g.textBaseline='middle';
    lines.forEach((ln,i)=>{const yy=(i-(lines.length-1)/2)*sz*2.1;g.fillStyle='rgba(15,15,15,.25)';for(let k=0;k<8;k++)g.fillText(ln,(Math.random()-.5)*10,yy+(Math.random()-.5)*10);g.fillStyle='#111';g.fillText(ln,0,yy);
      for(let k=0;k<6;k++){const dx=(Math.random()-.5)*g.measureText(ln).width;g.fillRect(dx,yy+sz*.7,4+Math.random()*4,20+Math.random()*60)}});
    for(let k=0;k<900;k++){g.fillStyle='rgba(15,15,15,'+Math.random()*.35+')';g.fillRect((Math.random()-.5)*1000,(Math.random()-.5)*480,2,2)}
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w/2),BASM({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));m.position.set(x,y,z);m.rotation.y=ry;scene.add(m)};
  graf('GUCCY PYCO',IX-1.65,2.28,z1+.018,0,2.1,78,-.09);
  graf('DYZL NEUMÍRÁ',x2-.015,2.4,IZ+.45,-Math.PI/2,1.7,60,.06);
  graf('PONK JE MUJ',IX-2.1,.64,z2-.016,Math.PI,1.8,64,-.08);
  graf('NEŠAHEJ NA ŠRÓBI',IX+.35,.76,z1+.016,0,2.1,58,.04);
  graf('WC SMRDÍ|↓',IX-.35,1.75,z1+.012,0,2.2,80);
  graf('SERU NA TO',IX+2.1,1.5,z1+.012,0,1.6,70,-.08);
  graf('PIVO = PALIVO',IX+2.4,2.25,z1+.012,0,1.3,60,.05);
  graf('40',IX-2.1,1.2,z1+.012,0,1,110,-.1);
  graf('KDO SEBRAL|BITY?!',IX+2.85,.85,z1+.012,0,1.2,60,.06);
  graf('← JEPIÁK',x2-.012,2.25,IZ-1.6,-Math.PI/2,1.5,70,.04);
  graf('BOBAN JE|ZLODĚJ',x2-.012,.8,IZ+2.1,-Math.PI/2,1.3,60,-.05);
  graf('ELEKTRIKA V PROCESU|OD 2019',x2-.012,.62,IZ+1.0,-Math.PI/2,1.4,46);
  graf('KDIŽ TO NEJDE KLADIVEM|VEM VĚTŠÍ KLADIVO',IX+2.1,1.9,z2-.012,Math.PI,2.3,52,.04);
  graf('NESAHEJ MI NA|VRTAČKU KOKOTE',IX+2.2,1.0,z2-.012,Math.PI,2,52,-.05);
  graf('ZAVÍREJ DVEŘE|TY VOLE ↓',IX-3.05,1.6,z2-.012,Math.PI,1.1,50,.08);
  graf('PARKSIDE > MAKITA',IX-.9,2.55,z2-.012,Math.PI,1.6,50,-.03);
  graf('DO PRDELE|S TÍM',IX+1.1,2.35,z1+.012,0,1.1,55,-.12);
  // zásobníky na drobnosti (zelené a černé) nad sedačkami
  for(let r=0;r<3;r++)for(let k=0;k<12;k++){const col=k<7?0x2e6b3a:0x1a1a1a,xx=IX-1.9+k*.27,yy=2.1+r*.2;box(xx,z1,xx+.24,z1+.14,yy,yy+.16,col,false);box(xx+.02,z1+.1,xx+.22,z1+.15,yy,yy+.06,col,false)}
  // stěna s nářadím (západ)
  const osbTex=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#c79e63';g.fillRect(0,0,256,256);
    g.fillStyle='#d2ad74';g.fillRect(0,0,256,256);const cols=['#c39a60','#dcbb85','#b88d55','#e6c891','#ad8450'];for(let i=0;i<2600;i++){g.save();g.translate(Math.random()*256,Math.random()*256);g.rotate(Math.random()*3.14);g.globalAlpha=.5;g.fillStyle=cols[i%5];g.fillRect(-4,-1.5,3+Math.random()*8,2+Math.random()*2.5);g.restore()}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,2);return t})();
  const osbMat=STDM({map:osbTex});const SILM=BASM({color:0x2b2118});
  for(const [za,zb] of [[z1+.25,IZ-.05],[IZ+.05,z2-.45]]){const m=new THREE.Mesh(BOX,osbMat);m.scale.set(.03,1.75,zb-za);m.position.set(x1+.02,1.77,(za+zb)/2);m.receiveShadow=true;scene.add(m)}
  TOOLS.forEach((tl,i)=>{const y=2.45-Math.floor(i/12)*.43,z=z1+.36+(i%12)*.39;
    {const sil=buildTool(tl[0]);sil.traverse(m=>{if(m.isMesh){m.material=SILM;m.castShadow=false}});sil.scale.set(.03,1.2,1.2);sil.position.set(x1+.042,y,z);scene.add(sil)}   // namalovaný obrys tvaru nářadí
    for(const dz of [-.08,.16]){const hk=new THREE.Mesh(CYL,M(0x9a9ea4));hk.scale.set(.008,.09,.008);hk.rotation.z=Math.PI/2;hk.position.set(x1+.08,y+.12,z+dz);scene.add(hk)}
    const g=buildTool(tl[0]);g.position.set(x1+.13,y,z);g.scale.setScalar(1.1);scene.add(g);(window.__wallTools=window.__wallTools||{})[tl[0]]=g});
  for(let i=0;i<14;i++){const g=new THREE.Group();g.position.set(x1+.08,1.18,z1+.5+i*.32);scene.add(g);      // šroubováky, klíče, kleště
    const hc=[0xc8202a,0x1f5a3c,0xf2c14e,0x1f4f9a][i%4];
    if(i%3===0){const h=new THREE.Mesh(CYL,M(hc));h.scale.set(.02,.1,.02);h.position.y=.05;g.add(h);const sh=new THREE.Mesh(CYL,M(0xc0c4c8));sh.scale.set(.006,.12,.006);sh.position.y=-.06;g.add(sh)}
    else if(i%3===1){const w=new THREE.Mesh(BOX,M(0xc0c4c8));w.scale.set(.01,.2,.03);g.add(w)}
    else{for(const sd of [-1,1]){const p=new THREE.Mesh(BOX,M(hc));p.scale.set(.012,.14,.02);p.position.z=sd*.015;p.rotation.x=sd*.15;g.add(p)}}}
  // 3 sedačky z Jeepu Cherokee pod nářadím
  for(const dx of [-.88,-.3,.28])jeepSeat(IX+dx,z1+.55,0);   // 3 sedačky spojené vedle sebe
  solid(IX-1.2,z1+.23,IX+.62,z1+.88,.42);
  // stůl 1 vzadu uprostřed
  box(IX+1-1,z2-.8,IX+1+1.3,z2-.05,.86,.94,0x9c6b3e);box(IX+1-1,z2-.8,IX+1+1.3,z2-.05,0,.86,0x7a5232);
  box(IX+1+.9,z2-.55,IX+1+1.2,z2-.25,.94,1.1,0x2f5d8a,false);
  for(let i=0;i<5;i++)box(IX+1-.85+i*.3,z2-.4,IX+1-.7+i*.3,z2-.2,.94,.98+Math.random()*.08,[0x1f5a3c,0xc8202a,0xf2c14e,0x555a60][i%4],false);
  // stůl 2 (východ) se zesilovačem
  box(x2-.8,IZ-1.7,x2-.05,IZ+.5,.86,.94,0x9c6b3e);box(x2-.8,IZ-1.7,x2-.05,IZ+.5,0,.86,0x7a5232);
  box(x2-.7,IZ-.9,x2-.15,IZ-.4,.94,1.08,0xc0c4c8,false);
  for(const dz of [-.8,-.5]){const kn=new THREE.Mesh(CYL,M(0x222222));kn.scale.set(.03,.02,.03);kn.rotation.z=Math.PI/2;kn.position.set(x2-.71,1.01,IZ+dz);scene.add(kn)}
  // repráky v každém rohu + elektrovedení po stropě
  const cr=[[x1+.25,z1+.25],[x2-.25,z1+.25],[x1+.25,z2-.25],[x2-.25,z2-.25]];
  for(const [cx,cz] of cr){const g=new THREE.Group();g.position.set(cx,IH-.23,cz);g.lookAt(IX,1.2,IZ);scene.add(g);
    const k=new THREE.Mesh(BOX,M(0x161616));k.scale.set(.3,.42,.26);g.add(k);
    const w=new THREE.Mesh(CYL,M(0x333333));w.scale.set(.1,.02,.1);w.rotation.x=Math.PI/2;w.position.set(0,-.06,.14);g.add(w);
    const tw=new THREE.Mesh(CYL,M(0x777777));tw.scale.set(.035,.02,.035);tw.rotation.x=Math.PI/2;tw.position.set(0,.12,.14);g.add(tw)}
  const cab=(ax,az,bx,bz)=>box(Math.min(ax,bx)-.015,Math.min(az,bz)-.015,Math.max(ax,bx)+.015,Math.max(az,bz)+.015,IH-.08,IH-.05,0x111111,false);
  cab(x1+.12,z1+.12,x2-.12,z1+.12);cab(x1+.12,z2-.12,x2-.12,z2-.12);cab(x1+.12,z1+.12,x1+.12,z2-.12);cab(x2-.12,z1+.12,x2-.12,z2-.12);
  box(x2-.08,IZ-.7,x2-.05,IZ-.67,1.08,IH-.08,0x111111,false);box(x2-.12,IZ-.8,x2-.02,IZ-.55,IH-.4,IH-.15,0x777777,false);  // svod ke stolu + krabice
  // SPZ: jižní stěna u dveří a východní stěna
  function plate(txt,kind){const c=document.createElement('canvas');c.width=520;c.height=112;const g=c.getContext('2d');
   if(kind==='cz'){g.fillStyle='#fff';g.fillRect(0,0,520,112);g.fillStyle='#1f4f9a';g.fillRect(0,0,60,112);g.fillStyle='#f2c14e';g.font='700 34px Rubik,sans-serif';g.textAlign='center';g.fillText('CZ',30,96);
    g.beginPath();g.arc(30,40,16,0,7);g.strokeStyle='#f2c14e';g.lineWidth=4;g.stroke();g.fillStyle='#111';g.font='800 76px Rubik,sans-serif';g.fillText(txt,295,84)}
   else{const bg={nv:'#e8eef5',tx:'#fff',oh:'#f2e6b8',ca:'#fff',fl:'#fff'}[kind];g.fillStyle=bg;g.fillRect(0,0,520,112);
    g.fillStyle=kind==='ca'?'#b51e24':'#1f4f9a';g.font='700 26px Rubik,sans-serif';g.textAlign='center';g.fillText({nv:'NEVADA',tx:'TEXAS',oh:'OHIO',ca:'California',fl:'FLORIDA'}[kind],260,30);
    g.fillStyle=kind==='ca'?'#1f2f6a':'#111';g.font='800 64px Rubik,sans-serif';g.fillText(txt,260,96)}
   g.strokeStyle='#111';g.lineWidth=6;g.strokeRect(3,3,514,106);return new THREE.CanvasTexture(c)}
  sign('Zaměstnanec měsíce',IX-.52,2.53,z2-.07,Math.PI,1.35);
  box(IX-.85,z2-.09,IX-.19,z2-.04,1.57,2.31,0x814f2c,false);
  const portrait=new THREE.Mesh(new THREE.PlaneGeometry(.59,.67),BASM({color:0xf1e3cb}));
  portrait.position.set(IX-.52,1.94,z2-.10);portrait.rotation.y=Math.PI;scene.add(portrait);
  const photo=new Image();photo.onload=()=>{
    const c=document.createElement('canvas');c.width=440;c.height=500;
    const scale=Math.max(c.width/photo.width,c.height/photo.height);
    c.getContext('2d').drawImage(photo,(c.width-photo.width*scale)/2,(c.height-photo.height*scale)/2,photo.width*scale,photo.height*scale);
    portrait.material.map=new THREE.CanvasTexture(c);portrait.material.color.set(0xffffff);portrait.material.needsUpdate=true;
  };
  try{photo.src=window.SIMON_PHOTO||localStorage.getItem('simonPortrait')||'downloaded/simon.png'}catch{photo.src=window.SIMON_PHOTO||'downloaded/simon.png'}   // SIMON_PHOTO = fotka zabalená ve hře (simon-foto.js)
  $('portraitFile').onchange=e=>{
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{photo.src=reader.result;try{localStorage.setItem('simonPortrait',reader.result)}catch{}};
    reader.readAsDataURL(file);
  };
  sign('Simon Konečný',IX-.52,1.46,z2-.07,Math.PI,.9);
  sign('JISTIČE',x2-.04,1.82,IZ+1.22,-Math.PI/2,.85);
  const PL=[['BEZ STK','cz'],['TO DA','cz'],['OLEJ KAM','cz'],['BUBU 1','cz'],['VRR NIC','cz'],['V8 POWER','nv'],['BIG RAM','tx'],['MOPAR 1','oh'],['NO BRAKE','ca'],['HEMI 392','fl']];
  PL.push(...['GUCCY 07','STK NENI','2T SMRAD','KDE JE 10','BOB HAF','PONK 01','OLEJ TECE','FURT VRZ','VRUT 08','BEZ KOLA','PILA 210','KARBEC'].map(n=>[n,'cz']));PL.forEach(([tx,k],i)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.52,.112),BASM({map:plate(tx,k)}));
   m.scale.setScalar(.8);
   if(i<5){m.position.set(IX-.52,1.28-i*.13,z2-.04);m.rotation.y=Math.PI}                    // české SPZ ve sloupci pod Simonem
   else if(i>=10){m.position.set(IX-2.85+(i-10)%6*.52,2.65-Math.floor((i-10)/6)*.15,z2-.05);m.rotation.y=Math.PI}else{const k=i-5;m.position.set(x2-.04,1.62+Math.floor(k/3)*.16,IZ-1.35+(k%3)*.5);m.rotation.y=-Math.PI/2}   // 5 amerických nad stolem 2
   m.rotation.z=(Math.random()-.5)*.08;scene.add(m)});

  // ===== vyšperkování: okno, regály, kufry, bordel, kabely =====
  {const W=new THREE.Mesh(BOX,BASM({color:0xbfe6ff}));W.scale.set(1.2,.75,.03);W.position.set(IX+1+.15,1.75,z2-.02);scene.add(W);   // okno u stolu 1
   for(const [sx,sy,px,py] of [[1.3,.07,0,.41],[1.3,.07,0,-.41],[.07,.85,-.62,0],[.07,.85,.62,0],[.05,.75,0,0],[1.2,.05,0,0]]){const f=new THREE.Mesh(BOX,M(0xe9e4da));f.scale.set(sx,sy,.06);f.position.set(IX+1+.15+px,1.75+py,z2-.04);scene.add(f)}
   box(IX+1-.55,z2-.02,IX+1+.85,z2-.3,1.33,1.37,0xe9e4da,false)}
  const rnd2=(a,b)=>a+Math.random()*(b-a),pk=a=>a[Math.floor(Math.random()*a.length)];
  // kovový regál (východ, sever) s bednami a kufry
  {const rx1=x2-.55,rz1=z1+.05,rz2=z1+1.05;
   for(const [px,pz] of [[rx1,rz1],[x2-.05,rz1],[rx1,rz2],[x2-.05,rz2]])box(px-.025,pz-.025,px+.025,pz+.025,0,2.3,0x6b6f75,false);
   for(const y of [.05,.6,1.15,1.7,2.25]){box(rx1,rz1,x2-.05,rz2,y,y+.03,0x8a8e94,false);
     for(let k=0;k<3;k++){const c=pk([0x1f5a3c,0x1f5a3c,0x3b3f45,0x1f4f9a,0xc8202a,0x9c6b3e]);const zz=rz1+.12+k*.31;box(rx1+.06,zz,x2-.1,zz+.26,y+.03,y+.03+rnd2(.18,.42),c,false)}}
   solid(rx1,rz1,x2,rz2,2.3)}
  // nástěnná police nad stolem 1
  box(IX-1,z1+.02,IX-.65,z1+.3,1.9,1.93,0x9c6b3e,false);box(IX+.95,z1+.02,IX+1.3,z1+.3,1.9,1.93,0x9c6b3e,false);
  for(let k=0;k<4;k++){const c=pk([0xd4a017,0xc8202a,0x1f4f9a,0xe9e4da]);const xx=IX-.98+(k%2)*.16+(k>1?1.95:0);const cn=new THREE.Mesh(CYL,M(c));cn.scale.set(.06,.14,.06);cn.position.set(xx,2.0,z1+.16);scene.add(cn)}
  // šuplíkový vozík (červený) u stolu 2
  box(x2-.8,IZ+.75,x2-.2,IZ+1.3,0,.95,0xb51e24);for(let k=0;k<5;k++)box(x2-.81,IZ+.8,x2-.79,IZ+1.25,.12+k*.17,.15+k*.17,0xc0c4c8,false);
  // stoh kufrů s nářadím (PARKSIDE)
  for(let k=0;k<4;k++){const perf=k===2,y0=k*.16;box(IX-2.2,z1+.15,IX-1.6,z1+.5,y0,y0+.15,perf?0x3b3f45:0x1f5a3c);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(.36,.09),BASM({map:LBL[perf?1:0],transparent:true}));m.position.set(IX-1.9,y0+.075,z1+.51);m.rotation.y=0;scene.add(m)}
  solid(IX-2.2,z1+.15,IX-1.6,z1+.5,.64);
  // bordel na zemi: odřezky, piliny, krabice, kbelík, plechovky, hadry, šroubky
  for(let k=0;k<4;k++){const m=new THREE.Mesh(BOX,M(pk([0xd9b07a,0xc49a6c,0xb08a5a])));m.scale.set(rnd2(.08,.5),.03,rnd2(.05,.1));m.position.set(rnd2(IX-1.6,IX+1.4),.03,rnd2(IZ-.9,IZ+1.6));m.rotation.y=rnd2(0,3.14);m.castShadow=true;scene.add(m)}
  for(let k=0;k<2;k++){const m=new THREE.Mesh(new THREE.CircleGeometry(rnd2(.15,.35),10),M(0xcfb58a));m.rotation.x=-Math.PI/2;m.position.set(rnd2(IX-1.5,IX+1.5),.016,rnd2(IZ-1.6,IZ+1));scene.add(m)}
  for(let k=0;k<8;k++){const m=new THREE.Mesh(CYL,M(0x9a9ea4));m.scale.set(.008,.03,.008);m.rotation.z=1.57;m.position.set(rnd2(IX-1.2,IX+1.2),.02,rnd2(z1+.9,z1+1.6));scene.add(m)}
  box(x1+.15,z2-.9,x1+.65,z2-.4,0,.4,0xa07a4a);box(x1+.2,z2-.85,x1+.6,z2-.45,.4,.7,0xb08a5a);solid(x1+.15,z2-.9,x1+.65,z2-.4,.7);   // krabice
  {const kb=new THREE.Mesh(CYL,M(0x1f4f9a));kb.scale.set(.17,.32,.17);kb.position.set(IX+.6,.16,z2-.6);kb.castShadow=true;scene.add(kb)}
  for(let k=0;k<4;k++){const cn=new THREE.Mesh(CYL,M(pk([0xd4a017,0xc8202a,0x777777])));cn.scale.set(.07,.16,.07);cn.position.set(IX-1.6+k*.18,.08,z1+1.05);scene.add(cn)}
  box(IX-.2,IZ+.9,IX+.25,IZ+1.15,0,.01,0x8a2222,false);
  // kabely: zásuvky na stěnách, kabely po zemi, prodlužky, kabely k reprákům
  const cord=(pts,col,y=.015,th=.025)=>{for(let k=0;k<pts.length-1;k++){const [ax,az]=pts[k],[bx,bz]=pts[k+1],L=Math.hypot(bx-ax,bz-az),m=new THREE.Mesh(BOX,M(col));
    m.scale.set(th,th,L);m.position.set((ax+bx)/2,y,(az+bz)/2);m.rotation.y=Math.atan2(bx-ax,bz-az);scene.add(m)}};
  for(const [sx,sz,ry] of [[x1+.02,IZ+1.7,Math.PI/2],[IX-1.5,z1+.02,0],[x2-.02,IZ+.2,-Math.PI/2],[IX+.9,z2-.02,Math.PI]]){const so=new THREE.Mesh(BOX,M(0xe9e4da));so.scale.set(.12,.12,.03);so.position.set(sx,.35,sz);so.rotation.y=ry;scene.add(so)}
  cord([[x1+.05,IZ+1.7],[x1+.6,IZ+1.6],[IX-1.2,IZ+1.2],[IX-.4,IZ+.2],[IX+.3,z1+.9]],0xe8742a);
  cord([[IX-1.5,z1+.05],[IX-1.3,z1+.6],[IX-.5,z1+.85]],0x111111);
  cord([[x2-.05,IZ+.2],[x2-.6,IZ+.1],[IX+1.2,IZ+.7],[IX+.4,IZ+1.6],[IX-.3,IZ+2]],0x111111);
  cord([[IX+.9,z2-.05],[IX+.6,z2-.5],[IX-.6,IZ+.6],[x1+.9,IZ-1.5]],0xe8742a);
  cord([[x1+.4,z2-.4],[x1+.5,IZ+.9],[IX-1.8,IZ-.2],[IX-.9,z1+1.4]],0x2a2a2a);
  for(const [cx,cz] of [[IX-.8,IZ+1.5],[IX+1.4,IZ-1.2]]){const r=new THREE.Mesh(new THREE.TorusGeometry(.16,.03,6,16),M(0xe8742a));r.rotation.x=Math.PI/2;r.position.set(cx,.03,cz);scene.add(r);
    const r2=new THREE.Mesh(new THREE.TorusGeometry(.11,.03,6,16),M(0xe8742a));r2.rotation.x=Math.PI/2;r2.position.set(cx+.04,.07,cz);scene.add(r2)}
  {const rl=new THREE.Mesh(CYL,M(0x1a1a1a));rl.scale.set(.2,.12,.2);rl.rotation.z=Math.PI/2;rl.position.set(IX-1.9,.22,IZ+1.9);scene.add(rl);
   const rr=new THREE.Mesh(new THREE.TorusGeometry(.17,.05,8,18),M(0xe8742a));rr.rotation.y=Math.PI/2;rr.position.set(IX-1.9,.22,IZ+1.9);scene.add(rr)}
  for(const [cx,cz] of [[x1+.25,z1+.25],[x2-.25,z1+.25],[x1+.25,z2-.25],[x2-.25,z2-.25]])box(cx-.012,cz-.012,cx+.012,cz+.012,.05,IH-.6,0x111111,false);  // svody k reprákům
  for(const z of [z1+.6,IZ,z2-.6])cord([[x1+.05,z],[x2-.05,z]],0x222222,IH-.03,.02);                      // kabely po stropě
  cord([[x2-.12,z1+.12],[x2-.12,IZ-.6]],0x111111,IH-.1,.02);

  // elektro: rozvaděč s jističi pod cedulí JISTIČE + trubky ke stropu
  box(x2-.12,IZ+.95,x2-.02,IZ+1.5,1.05,1.62,0xb8bcc0);
  for(let k=0;k<6;k++)box(x2-.135,IZ+1.0+k*.08,x2-.12,IZ+1.06+k*.08,1.3,1.42,k===4?0xc8202a:0x222222,false);
  {const led=new THREE.Mesh(SPH,BASM({color:0x3ee060}));led.scale.setScalar(.015);led.position.set(x2-.14,1.52,IZ+1.42);scene.add(led)}
  for(const dz of [1.05,1.22,1.4])box(x2-.07,IZ+dz-.012,x2-.045,IZ+dz+.012,1.62,IH-.05,0x8a8e94,false);
  cord([[x2-.06,IZ+1.22],[x2-.06,IZ+2.2]],0x111111,1.1,.02);
  // nábytek pod nářadím (západ): skříňka s dvířky a šuplíková komoda
  box(x1+.05,z1+1.0,x1+.62,z1+2.1,0,.92,0x7a5232);box(x1+.05,z1+2.2,x1+.62,z1+2.9,0,.95,0x6b4a2e);
  for(const zz of [z1+1.55])box(x1+.62,zz-.005,x1+.635,zz+.005,.1,.85,0x3e2a1a,false);
  for(const zz of [z1+1.45,z1+1.65]){const h=new THREE.Mesh(SPH,M(0xc0c4c8));h.scale.setScalar(.025);h.position.set(x1+.64,.6,zz);scene.add(h)}
  for(let k=0;k<4;k++){box(x1+.62,z1+2.25,x1+.635,z1+2.85,.12+k*.22,.13+k*.22,0x3e2a1a,false);box(x1+.635,z1+2.5,x1+.65,z1+2.6,.24+k*.22,.27+k*.22,0xc0c4c8,false)}
  box(x1+.05,z1+1.0,x1+.62,z1+2.9,.92,.96,0x9c6b3e,false);
  for(let k=0;k<5;k++)box(x1+.15,z1+1.1+k*.32,x1+.35,z1+1.3+k*.32,.96,.98+Math.random()*.12,[0x1f5a3c,0xd4a017,0xc8202a,0x555a60,0x3b3f45][k],false);
  solid(x1+.05,z1+1.0,x1+.62,z1+2.9,.95);
  for(let i=0;i<4;i++){const tr=new THREE.Mesh(new THREE.TorusGeometry(.28,.11,8,18),M(0x1a1a1a));tr.rotation.x=Math.PI/2;tr.position.set(x2-.45,.11+i*.22,z1+.45+.9);scene.add(tr)}
  solid(x2-.85,z1+.95,x2-.05,z1+1.75,.9);
 }
 // ===== Pavlův byt: tma, rozdělaná elektrika =====
 {const x1=FX-FW/2,x2=FX+FW/2,z1=FZ-FD/2,z2=FZ+FD/2,W=0x7d7d78;
  box(x1,z1,x2,z2,0,.012,0x4e4a44,false);
  box(x1-.2,z1-.2,x2+.2,z1,0,FH,W);box(x1-.2,z2,x2+.2,z2+.2,0,FH,W);box(x1-.2,z1,x1,z2,0,FH,W);box(x2,z1,x2+.2,z2,0,FH,W);
  box(x1-.2,z1-.2,x2+.2,z2+.2,FH,FH+.1,0x2a2a2a,false);
  door(FX+1.8,z2-.05,0,1,2.1,Math.PI,0x4a3a2a);
  for(const [wx,wz] of [[FX-1,FZ-.5],[FX+1,FZ+.6],[FX-.2,FZ+1.2]]){box(wx-.01,wz-.01,wx+.01,wz+.01,FH-.7-Math.random()*.4,FH,0x111111,false);
    const e=new THREE.Mesh(SPH,M(0xc8202a));e.scale.setScalar(.025);e.position.set(wx,FH-.75,wz);scene.add(e)}
  const fb=new THREE.Mesh(BOX,M(0xb0b0aa));fb.scale.set(.06,.5,.4);fb.position.set(x1+.03,1.5,FZ-1.2);scene.add(fb);
  const led=new THREE.Mesh(SPH,BASM({color:0xff2a2a}));led.scale.setScalar(.02);led.position.set(x1+.07,1.65,FZ-1.1);scene.add(led);
  box(x2-2.1,z1+.1,x2-.1,z1+1.1,0,.25,0x6a7a8a);                         // matrace na zemi
  {const w=new THREE.Mesh(CYL,M(0x111111));w.scale.set(.006,.45,.006);w.position.set(FX+.6,FH-.22,FZ-.4);scene.add(w);
   const bulbM=BASM({color:0x3a3428});const bb=new THREE.Mesh(new THREE.SphereGeometry(.06,10,8),bulbM);bb.position.set(FX+.6,FH-.48,FZ-.4);scene.add(bb);
   const L=new THREE.PointLight(0xffd59a,0,7,2);L.position.copy(bb.position);scene.add(L);FLK={L,bb,bulbM,on:0,t:0}}
  box(FX-.4,z1+.1,FX+.4,z1+.5,0,.6,0x9c6b3e);box(FX+.5,z1+.1,FX+1.1,z1+.6,0,.45,0x9c6b3e);   // krabice
  {const r=new THREE.Mesh(CYL,M(0xe8742a));r.scale.set(.25,.2,.25);r.rotation.x=Math.PI/2;r.position.set(x1+.6,.25,z2-.8);scene.add(r);solid(x1+.35,z2-1.05,x1+.85,z2-.55,.5)}
  for(const dx of [-.25,.25])box(x2-.5+dx-.02,z2-1.6,x2-.5+dx+.02,z2-1.56,0,2.2,0xc0c4c8,false);  // žebřík
  for(let k=0;k<6;k++)box(x2-.77,z2-1.6,x2-.23,z2-1.56,.3+k*.33,.33+k*.33,0xc0c4c8,false);
  flash=new THREE.SpotLight(0xfff1d0,0,14,.42,.55,1.2);scene.add(flash);scene.add(flash.target);
 }
}

// ---------- další interiéry: Byt 2 (prádelna → sklady → ven na Masarykovu), Byt 1, hlavní dům (prázdný), sklad dílů nad zdí ----------
const PARTS=[['volant','Volant'],['sedacka','Sedačka'],['naraznik','Nárazník'],['sklo','Čelní sklo'],['zrcatko','Zrcátko'],['svetlo','Světlomet'],
  ['kolo','Kolo'],['dvere','Dveře'],['vyfuk','Výfuk'],['baterie','Autobaterie'],['radio','Autorádio'],['kapota','Kapota']];
function partMesh(id){const g=new THREE.Group(),b=(c,sx,sy,sz,x,y,z,mat)=>{const m=new THREE.Mesh(BOX,mat||M(c));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
  if(id==='volant'){const t=new THREE.Mesh(new THREE.TorusGeometry(.18,.03,6,18),M(0x151515));g.add(t);b(0x222222,.3,.04,.03,0,0,0)}
  if(id==='sedacka'){b(0x3f4247,.5,.12,.5,0,0,0);b(0x3f4247,.5,.55,.12,0,.3,-.22)}
  if(id==='naraznik')b(0xd8dde2,1.6,.2,.14,0,0,0);
  if(id==='sklo')b(0,1.3,.7,.03,0,0,0,STDM({color:0x9fd3ff,transparent:true,opacity:.55}));
  if(id==='zrcatko'){b(0x1d1d1d,.22,.14,.08,0,0,0);b(0xcfe8ff,.18,.1,.01,0,0,.045)}
  if(id==='svetlo'){b(0x2a2a2a,.36,.18,.16,0,0,0);b(0xffe7aa,.3,.14,.01,0,0,.085)}
  if(id==='kolo'){const t=new THREE.Mesh(new THREE.TorusGeometry(.26,.11,8,16),M(0x1a1a1a));g.add(t);const r=new THREE.Mesh(CYL,M(0xb8bcc2));r.scale.set(.17,.06,.17);r.rotation.x=Math.PI/2;g.add(r)}
  if(id==='dvere'){b(0xb51e24,1,.6,.07,0,0,0);b(0,.9,.4,.03,0,.48,0,STDM({color:0x9fd3ff,transparent:true,opacity:.5}))}
  if(id==='vyfuk'){const r=new THREE.Mesh(CYL,M(0x8a8e94));r.scale.set(.05,1.2,.05);r.rotation.z=Math.PI/2;g.add(r);b(0x6a6e74,.4,.16,.2,.2,0,0)}
  if(id==='baterie'){b(0x1d1d1d,.3,.22,.18,0,0,0);b(0xc8202a,.04,.04,.04,-.1,.13,0);b(0x222222,.04,.04,.04,.1,.13,0)}
  if(id==='radio'){b(0x1d1d1d,.2,.06,.18,0,0,0);b(0x3ad0ff,.12,.025,.01,0,.005,.09)}
  if(id==='kapota')b(0x1f4f9a,1.4,.05,1.1,0,0,0);
  return g}
let carry=null;                                   // {id,name,g,who}
function takePart(id){const pr=PARTS.find(x=>x[0]===id);dropCarry(true);const g=partMesh(id);g.traverse(o=>o.layers.enableAll());const p=P();g.position.set(0,1.05,.42);g.scale.setScalar(.7);p.obj.add(g);carry={id,name:pr[1],g,who:p};play('crate',.5);toast('Neseš: '+pr[1]+'. B = položit, v autě/u auta se hodí.')}
function dropCarry(silent){if(!carry)return;carry.who.obj.remove(carry.g);if(!silent){const p=P();const g=carry.g;g.position.set(p.x+Math.sin(p.head)*.7,.12,p.z+Math.cos(p.head)*.7);g.scale.setScalar(1);g.rotation.y=p.head;scene.add(g);onGround.push({kind:'part',id:carry.id,name:carry.name,g,x:g.position.x,z:g.position.z,room});toast('Položeno: '+carry.name+'.')}carry=null}
const onGround=[];                                // nářadí a díly položené na zemi
function dropHeld(){if(DRV.on)return;const p=P();
  if(canTool(p)&&holder===p&&tool.id&&tool.held){const id=tool.id,name=(TOOLS.find(t=>t[0]===id)||[0,id])[1];const g=buildTool(id);g.rotation.set(Math.PI/2,0,p.head);g.position.set(p.x+Math.sin(p.head)*.7,groundAt(p.x,p.z,p.y)+.06,p.z+Math.cos(p.head)*.7);scene.add(g);
    onGround.push({kind:'tool',id,name,g,x:g.position.x,z:g.position.z,room});equip(null);play('kick',.3);toast('Odhozeno na zem: '+name+'. E = zvednout.');return}
  if(carry){dropCarry();return}toast('Nic v ruce.')}
function pickGround(g){const i=onGround.indexOf(g);if(i<0)return;
  if(g.kind==='tool'){if(!canTool(P())){toast('Nářadí berou Pavel a Simon.');return}if(tool.id&&tool.held)dropHeld();onGround.splice(i,1);scene.remove(g.g);equip(g.id);toast('V ruce: '+g.name)}
  else{onGround.splice(i,1);scene.remove(g.g);const pr=g.id;takePart(pr)}}
function buildRooms(){
 const BLUE=0xdfe8ee;
 const shell=(R0,wall,floor)=>{const x1=R0.cx-R0.w/2,x2=R0.cx+R0.w/2,z1=R0.cz-R0.d/2,z2=R0.cz+R0.d/2;box(x1,z1,x2,z2,0,.012,floor,false);
   box(x1-.2,z1-.2,x2+.2,z1,0,R0.h,wall);box(x1-.2,z2,x2+.2,z2+.2,0,R0.h,wall);box(x1-.2,z1,x1,z2,0,R0.h,wall);box(x2,z1,x2+.2,z2,0,R0.h,wall);if(!R0.top)box(x1-.2,z1-.2,x2+.2,z2+.2,R0.h,R0.h+.1,0xf4f1ea,false);return [x1,x2,z1,z2]};
 const lamp=()=>{};   // místnosti jsou bez stropu (pohled shora) – světlo dává roomL
 roomL=new THREE.PointLight(0xfff0d8,0,0,0);scene.add(roomL);
 shell(RM.mall,0xeae2cd,0xbebcc0);
 for(const [i,n] of mallStores.entries()){
   const x=490+i*4;box(x-1.85,-7.9,x+1.85,-6,0,2.8,[0xd66824,0x2362aa,0x287555,0xbd3933,0x82a443,0x2c4669,0xb38637][i]);sign(n,x,2.12,-5.96,0,3.4);
   box(x-1.6,-5.6,x+1.6,-5.05,0,.88,0x9f8871)
 }
 for(const [i,n] of mallStores.slice(1).entries()){
   const r=RM[n];shell(r,0xdedcce,0xb5b2a7);sign(n,r.cx,2.55,-3.91,0,3.2);
   for(const side of [-1,1]){const x=r.cx+side*3.8;for(const level of [.5,1.2,1.9]){
     box(x-.48,-2,x+.48,2,level,level+.08,0x666c72,false);
     for(let j=0;j<4;j++)box(x-.29,-1.85+j,x+.29,-1.3+j,level+.08,level+.38,[0xe7c579,0xb77158,0x6d8a94,0x859a72][(j+i)%4],false)
   }solid(x-.5,-2,x+.5,2,2)}
 }
 shell(RM.simonHome,0xd2c8b9,0xa59a89);box(641,-4,643,-2.8,0,.52,0x827554);box(641,-4,643,-2.8,.52,.62,0xb3c7ce,false);sign('SIMON · GARÁŽ',648,2.3,-4.4,0,2.6);
 shell(RM.fuelShop,0xe4ded2,0xb5aaa1);box(657,-2.3,661,-1.6,0,.95,0xb63835);box(658.2,-2.1,658.7,-1.75,.95,1.3,0x303c41,false);sign('POKLADNA',659,2,-3.4,0,2.3);
 shell(RM.granny,0xf1dfba,0xb69c81);box(533,-2.7,536,-1.8,0,.88,0x957557);sign('U BABIČKY',535,2.1,-2.9,0,2.2);box(536,-2.93,537,-2.15,0,.94,0xd9d2bf);for(const x of [536.25,536.73])for(const z of [-2.72,-2.38]){const ring=new THREE.Mesh(CYL,M(0x292c2e));ring.scale.set(.13,.015,.13);ring.position.set(x,.96,z);scene.add(ring)}
 const pot=new THREE.Mesh(CYL,M(0xb35236));pot.scale.set(.18,.21,.18);pot.position.set(536.25,1.07,-2.38);scene.add(pot);box(535.4,-2.8,535.9,-2.42,.89,.94,0x95784c,false);
 box(532,-.1,533.1,2.05,0,.46,0x806248);box(532,-.1,533.1,2.05,.46,.59,0xe5dfd3,false);box(532.04,.49,533.06,2,.59,.67,0x907da6,false);
 const grandmaModel=person(0xe8c4a6,0x806e9b,0x635448,0xc4c4ba);grandmaModel.position.set(536.2,0,-1.65);grandmaModel.rotation.y=Math.PI;scene.add(grandmaModel);window.__grannyInside=grandmaModel;
 // ===== Byt 2: prádelna (východ) → sklady (západ) → dveře na Masarykovu =====
 for(const [i,cabin] of window.__cabins.entries()){
   const r=RM[cabin.key],[x1,x2,z1,z2]=shell(r,0x77776a,0x585043);
   door(r.cx,z2-.05,0,.95,2.1,Math.PI,0x525656);
   for(const side of [-1,1]){
     const x=r.cx+side*1.7;
     for(const h of [.43,1.6]){
       box(x-.48,-2.65,x+.48,-.45,h,h+.09,0x454a46);
       box(x-.45,-2.6,x+.45,-.5,h+.09,h+.22,0x887c5e,false);
       box(x-.43,-2.58,x+.43,-2.18,h+.22,h+.3,0x9e9882,false)
     }
     for(const dx of [-.48,.48])for(const z of [-2.65,-.45])box(x+dx-.025,z-.03,x+dx+.025,z+.03,0,2,0x444744,false)
   }
   for(let j=0;j<18;j++){const a=j*2.4+i,x=r.cx+Math.cos(a)*(1+j%3*.4),z=.7+Math.sin(a)*1.3;
     const junk=new THREE.Mesh(j%3?BOX:CYL,M([0x77805b,0xada48b,0x83694a][j%3]));junk.scale.set(.12,.07,.19);junk.rotation.y=a;junk.position.set(x,.09,z);scene.add(junk)}
   const man=person(0xdcb597,[0x454650,0x595342,0x54606a,0x674e41][i],0x323640,0x483729);
   for(const leg of legPivots(man)){leg.rotation.x=-Math.PI/2}
   man.position.set(r.cx-1.68,-.18,-.61);scene.add(man);cabin.resident=man;
 }
 for(const key of ['benapol','vlcek','hornbach']){
   const r=RM[key],industrial=key!=='benapol',[x1,x2,z1,z2]=shell(r,industrial?0xd5d2c7:0xf0dec9,industrial?0x969996:0xdac9af);
   door(r.cx,z2-.05,0,1.5,2.2,Math.PI,0x515a61);
   for(let i=0;i<3;i++){
     const z=-3+i*2.7;
     for(const side of [-1,1]){
       const x=side<0?x1+.7:x2-.7,wood=industrial?0x47637a:0x98633d;
       for(const end of [-1,1])box(x-.35,z+end*.94-.04,x+.35,z+end*.94+.04,0,2,wood,false);
       solid(x-.4,z-1,x+.4,z+1,2);
       for(const h of [.45,1.05,1.65]){
         box(x-.4,z-1,x+.4,z+1,h,h+.06,industrial?0xce7c28:wood,false);
         for(let j=0;j<5;j++){const col=(industrial?[0x7890a1,0xd89534,0x747e81]:[0x519641,0x84482b,0xf3ddbd])[i];
           const item=new THREE.Mesh(industrial||i===1?BOX:SPH,M(col));item.scale.set(.21,.17,.19);item.position.set(x,h+.22,z-.74+j*.36);scene.add(item)}
       }
     }
   }
 }
 {const r=RM.vlcek;box(r.cx-1.4,-4.05,r.cx+1.4,-3.55,0,.9,0x75543c);
  const seller=person(0xe2b792,0x26527c,0x323334,0x6b503d);seller.position.set(r.cx,0,-4.46);scene.add(seller);
  sign('PRODEJ NÁŘADÍ',r.cx,2.28,-4.85,0,2.2);
  sign('FESTA',r.cx+r.w/2-1.15,2.32,2.4,-Math.PI/2,1.8);for(const [id,z] of [['hammer_festa',2],['tape_festa',2.8]]){const display=buildTool(id);display.position.set(r.cx+r.w/2-1.13,1.32,z);display.scale.setScalar(1.3);scene.add(display)}}
 sign('HORNBACH',RM.hornbach.cx,2.6,-4.88,0,4);
 {const R0=RM.byt2,[x1,x2,z1,z2]=shell(R0,0xe9e4da,0x9a948a),px=x2-3.5;
  box(px-.1,z1,px+.1,R0.cz-.55,0,R0.h,0xe9e4da);box(px-.1,R0.cz+.55,px+.1,z2,0,R0.h,0xe9e4da);box(px-.1,R0.cz-.55,px+.1,R0.cz+.55,2.1,R0.h,0xe9e4da,false);
  door(x2-.05,R0.cz+.9,0,.9,2.05,-Math.PI/2,0x6b4a2e);door(x1+.05,R0.cz,0,.9,2.05,Math.PI/2,0x4a3a2a);door(x2-1.4,z2-.05,0,.9,2.05,Math.PI,0x7a3a2a);
  // prádelna: 2 pračky, sušička, koš, sušák s prádlem, dřez
  for(const [k,c] of [[0,0xf4f4f0],[1,0xf4f4f0],[2,0xdcdcdc]]){const x=px+.5+k*.68;box(x-.3,z1+.05,x+.3,z1+.65,0,.85,c);const d=new THREE.Mesh(CYL,M(0x4a5560));d.scale.set(.2,.02,.2);d.rotation.x=Math.PI/2;d.position.set(x,.45,z1+.66);scene.add(d)}
  box(x2-.75,z1+.1,x2-.15,z1+.55,.8,.9,0xd8d8d8);box(x2-.7,z1+.15,x2-.2,z1+.5,0,.8,0xbdbdbd);
  {const k=new THREE.Mesh(CYL,M(0x4f8fd6));k.scale.set(.25,.35,.25);k.position.set(px+.6,.18,R0.cz+.9);scene.add(k)}
  for(const dx of [-.5,.5])box(px+1.9+dx-.02,R0.cz+.3,px+1.9+dx+.02,R0.cz+1.4,0,1.1,0xc0c4c8,false);
  for(let k=0;k<5;k++)box(px+1.4,R0.cz+.4+k*.22,px+2.4,R0.cz+.42+k*.22,1.1,1.12,0xc0c4c8,false);
  [0xc8202a,0xf2c14e,0x4f8fd6,0xffffff,0x2e6b3a].forEach((c,k)=>box(px+1.5+k*.17,R0.cz+.5,px+1.64+k*.17,R0.cz+1.3,.75,1.1,c,false));
  // sklady: kovové regály s krabicemi po obou stěnách
  for(let x=x1+.6;x<px-1;x+=2.1)for(const zz of [z1+.05,z2-.6]){for(const sx of [0,1.8])box(x+sx-.03,zz,x+sx+.03,zz+.55,0,2.2,0x1f4f9a,false);
    for(const y of [.05,.75,1.45,2.1])box(x,zz,x+1.8,zz+.55,y,y+.05,0xe8742a,false);solid(x,zz,x+1.8,zz+.55,2.2);
    for(const y of [.1,.8,1.5])for(let k=0;k<3;k++)if(Math.random()<.85)box(x+.1+k*.58,zz+.05,x+.5+k*.58,zz+.5,y,y+.3+Math.random()*.2,pick([0xc9a172,0xb08a5a,0xd9b07a,0x8a8e94,0x2e6b3a]),false)}
  lamp(px+1.7,R0.cz,R0.h);lamp(x1+3,R0.cz,R0.h);lamp(x1+7,R0.cz,R0.h);
  sign('PRÁDELNA',px+1.75,2.25,z1+.03,0,1.1);sign('SKLADY',px-.12,2.3,R0.cz,-Math.PI/2,.9)}
 // ===== Byt 1 (Tereza a Milan): koupelna, ložnice, kuchyň a obývák s pelíšky pro Ashley a Jackie =====
 {const R0=RM.byt1,x1=R0.cx-R0.w/2,z1=R0.cz-R0.d/2,h=R0.h,W=0xf2ece0,X0=m=>x1+m,Z0=m=>z1+m;
  const B=(a,b,c,d,y0,y1,col,sol)=>box(X0(a),Z0(b),X0(c),Z0(d),y0,y1,col,!!sol);
  const wallX=(mx,za,zb,gaps=[])=>{let a=za;for(const [g1,g2] of gaps.concat([[zb,zb]])){if(g1>a)B(mx-.06,a,mx+.06,g1,0,h,W,1);a=g2}};
  const wallZ=(mz,xa,xb,gaps=[])=>{let a=xa;for(const [g1,g2] of gaps.concat([[xb,xb]])){if(g1>a)B(a,mz-.06,g1,mz+.06,0,h,W,1);a=g2}};
  B(0,0,10,6,0,.012,0xb58a5a);B(0,0,2.6,2.4,0,.014,0xcfd8dc);B(0,3.4,4.4,6,0,.013,0xa87d52);B(7.4,3.9,9.2,5.5,0,.016,0x7a5fa8);   // podlahy, dlažba, koberec
  B(-.2,-.2,0,6.2,0,h,W,1);B(10,-.2,10.2,6.2,0,h,W,1);B(0,-.2,10,0,0,h,W,1);B(0,6,10,6.2,0,h,W,1);                                    // obvod
  door(X0(10)-.05,Z0(3),0,.9,2.05,-Math.PI/2,0x6b4a2e);sign('DOMOV',X0(9.94),2.25,Z0(3),-Math.PI/2,1);
  wallX(2.6,0,2.4,[[.8,1.8]]);wallZ(2.4,0,2.6);wallZ(3.4,0,4.4,[[3.2,4.2]]);wallX(4.4,3.4,6);
  // koupelna: sprcha, umyvadlo, WC, pračka
  B(.1,.1,1,1,0,.08,0xffffff);B(.1,.1,.14,1,.08,2,0xcfe8ff);B(1.2,.05,1.8,.45,.75,.85,0xffffff,1);B(1.25,.05,1.75,.1,1.1,1.7,0xcfe8ff);
  B(2.05,.1,2.45,.55,0,.42,0xffffff,1);B(.1,1.5,.7,2.3,0,.85,0xf4f4f0,1);
  // ložnice: manželská postel, skříň, noční stolky
  B(.1,4.0,2.1,5.9,0,.42,0x8a5a32,1);B(.12,4.02,2.08,5.88,.42,.58,0xf4f4f0);B(.15,4.05,.5,4.95,.58,.7,0xffffff);B(.15,5.0,.5,5.85,.58,.7,0xffffff);B(.6,4.02,2.08,5.88,.58,.63,0xc2378e);
  B(2.15,4.0,2.5,4.35,0,.5,0x6b4a2e,1);B(2.15,5.55,2.5,5.9,0,.5,0x6b4a2e,1);B(2.6,5.4,4.3,5.95,0,2,0x9c6b3e,1);
  // kuchyň: linka, sporák, dřez, lednice, stůl se židlemi (bez kolize)
  B(3,.05,6.2,.65,0,.9,0xf4f4f0,1);B(3,.05,6.2,.65,.9,.94,0x5a4a3a);B(3.8,.15,4.4,.55,.94,.96,0x222222);B(5.1,.15,5.7,.55,.9,.95,0xb8bcc2);B(6.25,.05,6.9,.7,0,1.85,0xe8e8e8,1);
  B(3.6,1.6,4.8,2.4,.72,.76,0x9c6b3e);for(const [a,b] of [[3.65,1.65],[4.7,1.65],[3.65,2.3],[4.7,2.3]])B(a,b,a+.05,b+.05,0,.72,0x6b4a2e);
  for(const [a,b] of [[3.3,1.8],[4.9,1.8]])B(a,b,a+.4,b+.4,0,.46,0x8a5a32);
  // obývák: gauč, TV, konferenční stolek
  B(6.6,3.8,7.2,5.6,0,.45,0x5a6a7a,1);B(6.6,3.8,6.8,5.6,.45,.9,0x5a6a7a);B(9.55,3.9,9.95,5.5,0,.5,0x3a3a3a,1);B(9.72,4.0,9.78,5.4,.5,1.2,0x111111);B(7.9,4.3,8.8,5.1,.38,.42,0x9c6b3e);
  // psí kout: dva pelíšky, misky, vodítka, poličky s poháry z agility
  for(const [x,c] of [[7.4,0x1f4f9a],[8.4,0xd9965a]]){const pl=new THREE.Mesh(CYL,M(c));pl.scale.set(.42,.14,.42);pl.position.set(X0(x),.07,Z0(.9));scene.add(pl);const in_=new THREE.Mesh(CYL,M(0xf4efe6));in_.scale.set(.32,.15,.32);in_.position.set(X0(x),.09,Z0(.9));scene.add(in_)}
  for(const x of [7.1,7.4,8.1,8.4]){const b=new THREE.Mesh(CYL,M(x<8?0xc8202a:0x2e6b3a));b.scale.set(.09,.05,.09);b.position.set(X0(x),.03,Z0(1.6));scene.add(b)}
  for(const [x,c] of [[7.3,0xc8202a],[7.6,0x1f4f9a]])B(x,.04,x+.03,.08,1.1,1.6,c);
  B(8.7,.05,9.9,.35,1.35,1.4,0x6b4a2e);for(let k=0;k<4;k++){const cup=new THREE.Mesh(CYL,M(k%2?0xd4a017:0xc0c4c8));cup.scale.set(.06,.16,.06);cup.position.set(X0(8.85+k*.3),1.48,Z0(.2));scene.add(cup)}
  // Milanův kout u dveří: koš na dřevo, holínky
  B(9.3,1.1,9.9,1.7,0,.5,0x8a5a32,1);for(let k=0;k<4;k++){const lg=new THREE.Mesh(CYL,M(k%2?0xb3834f:0x9c6b3e));lg.scale.set(.07,.5,.07);lg.rotation.z=Math.PI/2;lg.position.set(X0(9.6),.55+(k>1?.12:0),Z0(1.25+(k%2)*.3));scene.add(lg)}
  B(9.5,2.2,9.62,2.38,0,.35,0x2e3a2e);B(9.68,2.2,9.8,2.38,0,.35,0x2e3a2e);

 }
 // ===== hlavní dům podle Milanova nákresu: jižní křídlo 18 × 5,4 m + vstupní část pod pergolou 1,5 × 7,3 m =====
 // Pravidla: obvodové zdi jsou plné (dveře ven jsou jen kulisa, ven se jde přes E), průchody mezi místnostmi 1 m,
 // pevný je jen nábytek u zdí; stoly, židle a postele ve vstupní části jsou bez kolize, aby nikde nešlo zaseknout.
 {const x1=181,z1=-2.7,h=2.7,W=0xf4efe6,F=0xc9a172,X0=m=>x1+m,Z0=m=>z1+m,CZ=-7.3;
  const B=(a,b,c,d,y0,y1,col,sol)=>box(X0(a),Z0(b),X0(c),Z0(d),y0,y1,col,!!sol);
  const wallX=(mx,za,zb,gaps=[])=>{let a=za;for(const [g1,g2] of gaps.concat([[zb,zb]])){if(g1>a)B(mx-.06,a,mx+.06,g1,0,h,W,1);if(g2<zb&&g2>g1)B(mx-.06,g1,mx+.06,g2,2.1,h,W);a=g2}};
  const wallZ=(mz,xa,xb,gaps=[])=>{let a=xa;for(const [g1,g2] of gaps.concat([[xb,xb]])){if(g1>a)B(a,mz-.06,g1,mz+.06,0,h,W,1);if(g2<xb&&g2>g1)B(g1,mz-.06,g2,mz+.06,2.1,h,W);a=g2}};
  // podlahy a strop
  B(0,0,18,5.4,0,.012,F);B(0,CZ,1.5,0,0,.012,F);B(7,0,8.9,3.3,0,.014,0xcfd8dc);
  // obvod – plný
  B(-.2,CZ-.2,0,5.6,0,h,W,1);B(18,-.2,18.2,5.6,0,h,W,1);B(0,5.4,18,5.6,0,h,W,1);B(1.5,-.2,18,0,0,h,W,1);B(-.2,CZ-.2,1.7,CZ,0,h,W,1);B(1.5,CZ,1.7,0,0,h,W,1);
  // dveře ven (kulisa): z dvorku (sever), pod pergolou (vstupní část, východ), z ulice (jih)
  door(X0(2.45),Z0(0)+.05,0,.9,2.05,0,0x5a3b26);door(X0(1.5)-.05,Z0(CZ+4.9),0,.9,2.05,-Math.PI/2,0x5a3b26);door(X0(.9),Z0(5.4)-.05,0,.9,2.05,Math.PI,0x5a3b26);
  // příčky (průchody 1 m)
  wallX(1.85,0,5.4,[[.12,1.12],[2.6,3.6],[4.2,5.2]]);wallZ(1.95,0,1.85);wallZ(4,0,1.85);
  wallZ(1.95,1.85,7,[[2.5,4.5]]);wallX(7,0,5.4,[[.6,1.6],[2.3,3.2],[4,5]]);wallZ(2.2,7,8.9);wallZ(3.3,7,8.9);wallX(8.9,0,5.4,[[3.4,4.1]]);
  wallZ(0,0,1.5,[[.25,1.25]]);wallZ(CZ+2.6,0,1.5,[[.25,1.25]]);wallZ(CZ+5.3,0,1.5,[[.25,1.25]]);   // vstupní část: byt / byt / ložnice
  // Pavel (pokoj): postel u západní stěny
  B(.08,1.22,1.78,1.88,0,.4,0x8a5a32,1);B(.1,1.24,1.76,1.86,.4,.55,0xf4f4f0);B(.12,1.27,.45,1.84,.55,.66,0xffffff);B(.6,1.24,1.76,1.86,.55,.6,0x1f5a3c);
  // kancelář: stůl s PC u západní stěny, knihovna u jižní stěny
  B(.08,2.15,.7,3.45,.74,.78,0x6b4a2e,1);B(.1,2.5,.15,3.2,.8,1.2,0x111111);B(.16,2.55,.17,3.15,.84,1.16,0x3a7bd5);B(.9,2.6,1.3,3.0,0,.48,0x222222);B(1.25,2.6,1.3,3,.48,1.05,0x222222);
  B(.08,3.6,1.3,3.94,0,1.9,0x9c6b3e,1);for(const y of [.5,1,1.5])B(.12,3.58,1.26,3.6,y,y+.3,pick([0xc8202a,0x1f4f9a,0xf2c14e]));
  // vstup z ulice: botník, věšák
  B(.08,4.2,.5,5.2,0,.5,0x8a5a32,1);for(let k=0;k<4;k++)B(.06,4.3+k*.25,.12,4.33+k*.25,1.6,1.65,0x777777);
  // kuchyň: linka podél severní stěny, lednice, jídelní stůl (bez kolize)
  B(2.9,.05,6.2,.65,0,.9,0xf4f4f0,1);B(2.9,.05,6.2,.65,.9,.94,0x5a4a3a);B(4,.15,4.6,.55,.94,.96,0x222222);B(5.3,.15,5.9,.55,.9,.95,0xb8bcc2);B(2.9,.05,6.2,.4,1.5,2.1,0xf4f4f0);
  B(6.25,.05,6.9,.7,0,1.85,0xe8e8e8,1);B(4.2,1.05,5.2,1.65,.72,.76,0x9c6b3e);for(const [a,b] of [[4.25,1.1],[5.12,1.1],[4.25,1.57],[5.12,1.57]])B(a,b,a+.05,b+.05,0,.72,0x6b4a2e);
  // obývák: TV u příčky, gauč, kulatý stůl a 2 židle u okna (bez kolize)
  B(5,2.05,6.6,2.45,0,.5,0x3a3a3a,1);B(5.1,2.22,6.5,2.28,.5,1.25,0x111111);
  B(4.8,3.45,6.7,4.05,0,.45,0x5a6a7a,1);B(4.8,3.85,6.7,4.05,.45,.9,0x5a6a7a);
  {const t=new THREE.Mesh(CYL,M(0x9c6b3e));t.scale.set(.45,.04,.45);t.position.set(X0(3.4),.74,Z0(4.8));scene.add(t);B(3.37,4.77,3.43,4.83,0,.72,0x6b4a2e)}
  for(const cx of [2.6,4.2]){B(cx-.2,4.6,cx+.2,5,0,.46,0x8a5a32);B(cx-.2,4.95,cx+.2,5,.46,.95,0x8a5a32)}
  // WC s vanou, prádelna, ložnice
  B(7.15,.1,7.55,.55,0,.42,0xffffff,1);B(7.15,.06,7.55,.18,.42,.8,0xffffff);B(8.2,.1,8.84,2.1,0,.55,0xffffff,1);B(8.26,.18,8.78,2.02,.5,.56,0x9fd3ff);
  B(8.25,2.35,8.84,2.95,0,.85,0xf4f4f0);{const d=new THREE.Mesh(CYL,M(0x4a5560));d.scale.set(.2,.02,.2);d.rotation.z=Math.PI/2;d.position.set(X0(8.24),.45,Z0(2.65));scene.add(d)}
  B(7.85,4.25,8.84,5.34,0,.4,0x8a5a32,1);B(7.87,4.27,8.82,5.32,.4,.56,0xf4f4f0);B(7.9,5.05,8.8,5.3,.56,.68,0xffffff);B(7.87,4.27,8.82,4.9,.56,.61,0x7a5fa8);
  // vstupní část: byt, byt, ložnice (postele bez kolize)
  for(const z0 of [CZ+.2,CZ+2.9])B(.06,z0,.6,z0+1.9,0,.45,0x8a5a32);B(.06,CZ+5.5,.65,-.15,0,.5,0x8a5a32);B(.08,CZ+5.52,.63,-.17,.5,.62,0xf4f4f0);
  for(const [x,z] of [[1,1],[4.5,1],[4.5,4],[8,1.2],[8,4.4],[.9,3],[.9,4.7],[12,2.7],[16,2.7],[.75,-1],[.75,-3.5],[.75,-6]])lamp(X0(x),Z0(z),h);
  sign('KUCHYŇ',X0(4.4),2.35,Z0(.42),0,1.1);
  // Pavlovi rodiče: máma vaří u sporáku, táta sedí na gauči u TV
  {const mom=person(0xf0c8a8,0xb5506a,0x3a3a5a,0x8a5a3a);window.__momKitchen=mom;mom.position.set(X0(4.3),0,Z0(.95));mom.rotation.y=Math.PI;scene.add(mom);{const ap=new THREE.Mesh(BOX,M(0xf2f2f2));ap.scale.set(.42,.5,.04);ap.position.set(0,.75,.17);mom.add(ap)}
   const pot=new THREE.Mesh(CYL,M(0x9a9ea4));pot.scale.set(.16,.14,.16);pot.position.set(X0(4.3),1.03,Z0(.35));scene.add(pot);
   const dad=person(0xe8b896,0x5a6a3a,0x2f3e5a,0x9a9a9a);dad.position.set(X0(5.75),-.38,Z0(3.62));dad.rotation.y=Math.PI;scene.add(dad);
   window.__parents={mom,dad};
   B(5.18,2.2,6.42,2.24,.55,1.2,0x2a5a8a)}   // obraz v TV
 }
 // ===== sklad dílů nad zdí: nahoře po žebříku =====
 {const R0=RM.sklad,[x1,x2,z1,z2]=shell(R0,0xb8aa90,0x8a6a48);
  box(x2-1.3,R0.cz-.45,x2-.5,R0.cz+.45,0,.02,0x1a1410,false);                 // otvor se žebříkem
  for(const dz of [-.3,.3])box(x2-.95,R0.cz+dz-.02,x2-.9,R0.cz+dz+.02,0,1,0xc9c9c9,false);
  PARTS.forEach(([id,name],i)=>{const north=i<6,k=i%6,x=x1+.9+k*1.6,zz=north?z1+.05:z2-.65;
    box(x-.75,zz,x+.75,zz+.6,.02,.08,0x6b4a2e,false);box(x-.75,zz,x+.75,zz+.6,1.05,1.1,0x6b4a2e,false);solid(x-.75,zz,x+.75,zz+.6,1.1);
    for(const y of [.35,1.4]){const g=partMesh(id);g.position.set(x,y,zz+.3);g.scale.setScalar(id==='naraznik'||id==='kapota'||id==='sklo'||id==='vyfuk'?.75:1);if(!north)g.rotation.y=Math.PI;scene.add(g)}
    sign(name,x,1.95,north?z1+.03:z2-.03,north?0:Math.PI,.9);
    spots.push({in:'sklad',x,z:north?zz+1.05:zz-.45,r:.8,get label(){return carry&&carry.id===id?'Vrátit: '+name:'Vzít: '+name},who:-1,act:()=>{if(carry&&carry.id===id){dropCarry(true);play('crate',.4);toast('Vráceno do regálu.')}else takePart(id)}})});
  lamp(x1+3,R0.cz,R0.h);lamp(x1+8,R0.cz,R0.h)}
}
// ---------- pohyb a kolize ----------
const STEP=.32;
function blocked(x,z,y,r,st=STEP){for(const b of solids)if(b.int===COL_IN&&b.top>y+st&&x>b.x1-r&&x<b.x2+r&&z>b.z1-r&&z<b.z2+r)return true;
  if(!COL_IN&&HG.size){const r2=Math.min(r,HGC);for(const dx of [-r2,0,r2])for(const dz of [-r2,0,r2]){const a=hgAt(x+dx,z+dz);if(a)for(const b of a)if(b.top>y+st&&x>b.x1-r&&x<b.x2+r&&z>b.z1-r&&z<b.z2+r)return true}}return false}
function groundAt(x,z,y,st=STEP){let h=0;for(const b of solids)if(b.int===COL_IN&&b.top<=y+st&&b.top>h&&x>b.x1&&x<b.x2&&z>b.z1&&z<b.z2)h=b.top;return h}
function agent(obj,x,z,o){
  scene.add(obj);obj.traverse(m=>{if(m.isMesh)m.castShadow=true});
  return Object.assign({obj,x,z,y:0,head:0,moving:0,phase:0,r:.3,speed:3,tx:x,tz:z,wait:0,mode:'idle',timer:0},o);
}
function step(a,dx,dz,spd,dt){
  COL_IN=!!(inside&&a===P());stepIn(a,dx,dz,spd,dt);COL_IN=inside}
function stepIn(a,dx,dz,spd,dt){
  const len=Math.hypot(dx,dz);
  if(len>.01){
    dx/=len;dz/=len;
    const nx=a.x+dx*spd*dt,nz=a.z+dz*spd*dt,rc=a.reach||0,st=a.stepH||STEP;
    if(!blocked(nx,a.z,a.y,a.r,st)&&!(rc&&blocked(nx+dx*rc,a.z,a.y,.08,st)))a.x=nx;
    if(!blocked(a.x,nz,a.y,a.r,st)&&!(rc&&blocked(a.x,nz+dz*rc,a.y,.08,st)))a.z=nz;
    let d=Math.atan2(dx,dz)-a.head;d=Math.atan2(Math.sin(d),Math.cos(d));const nh=a.head+d*Math.min(1,dt*14);
    if(!rc||!blocked(a.x+Math.sin(nh)*rc,a.z+Math.cos(nh)*rc,a.y,.08,st)||blocked(a.x+Math.sin(a.head)*rc,a.z+Math.cos(a.head)*rc,a.y,.08,st))a.head=nh;
    if(!(inside&&a===P())){if(a.x>600){a.x=Math.max(668,Math.min(772,a.x));a.z=Math.max(-12,Math.min(72,a.z))}else{a.x=Math.max(TOWN.x1,Math.min(TOWN.x2,a.x));a.z=Math.max(TOWN.z1,Math.min(TOWN.z2,a.z))}if(a.dog&&a!==ctrl&&!a.leash){a.x=Math.max(X(64),Math.min(X(1252),a.x));a.z=Math.max(Z(62),Math.min(Z(1420),a.z))}}
    a.moving=Math.min(1,a.moving+dt*6);a.phase+=dt*spd*3.2;
  }else a.moving=Math.max(0,a.moving-dt*6);
  const st=a.stepH||STEP;let g=groundAt(a.x,a.z,a.y,st),pitch=0;
  if(a.dog){const sx=Math.sin(a.head)*a.reach*.8,sz=Math.cos(a.head)*a.reach*.8,gF=groundAt(a.x+sx,a.z+sz,a.y,st),gB=groundAt(a.x-sx,a.z-sz,a.y,st);
    g=Math.max(g,(gF+gB)/2);pitch=Math.max(-.5,Math.min(.5,-Math.atan2(gF-gB,a.reach*1.6)))}
  else if(a.reach){const sx=Math.sin(a.head)*a.reach*.8,sz=Math.cos(a.head)*a.reach*.8;g=Math.max(g,groundAt(a.x+sx,a.z+sz,a.y),groundAt(a.x-sx,a.z-sz,a.y))}
  a.vy=a.vy||0;
  if(a.dog&&g>a.y+.06&&a.vy<=0)a.vy=Math.sqrt(2*22*(g-a.y+.15));            // pes vyskočí na schod / chodník
  if(a.vy>0||a.y>g+.001){a.vy-=22*dt;a.y+=a.vy*dt;if(a.y<=g){a.y=g;a.vy=0}}
  else{a.y=g;a.vy=0}
  a.obj.position.set(a.x,a.y+(a.vy?0:Math.abs(Math.sin(a.phase))*.07*a.moving),a.z);
  a.obj.rotation.y=a.head;
  a.obj.rotation.z=Math.sin(a.phase)*.05*a.moving;
  if(a.dog)a.obj.rotation.x=a.vy?Math.max(-.5,Math.min(.5,-a.vy*.08)):pitch;
}
function goTo(a,tx,tz,spd,dt,stop=.4){
  const dx=tx-a.x,dz=tz-a.z,d=Math.hypot(dx,dz);
  if(d>stop)step(a,dx,dz,Math.min(spd,d*4),dt);else step(a,0,0,0,dt);
  return d<=stop;
}

// ---------- postavy ----------
const human=s=>{const g=s();g.scale.setScalar(.82);return g};
const dogS=(s,k)=>{const g=s();g.scale.setScalar(k);return g};
const pavel=agent(human(PS.pavel),X(900),Z(470),{name:'Pavel',speed:3.2,r:.32,reach:.38});
const tereza=agent(human(PS.tereza),X(1040),Z(960),{name:'Tereza',speed:3.4,r:.28,reach:.3});
const ashley=agent(dogS(PS.ashley,.85),X(1000),Z(1000),{speed:5,r:.2,reach:.48,dog:1,stepH:.62});
const jackie=agent(dogS(PS.jackie,.85),X(1080),Z(1000),{speed:5,r:.2,reach:.48,dog:1,stepH:.62});
const boban=agent(dogS(PS.boban,.85),X(940),Z(480),{speed:4.6,r:.2,reach:.5,dog:1,stepH:.45,mode:'follow',bark:3,barking:0,gardenT:30,muted:0,sockCD:0,angry:0,fitT:140,stealT:80,kickCD:0,dazed:0,fly:null,annoyT:0});
const carX=X(418),carZ=Z(275),workZ=carZ+2.55;
let patrol=null;
let station=0,stationWait=0;
const simon=agent(human(PS.simon),carX+2.25,workZ,{name:'Simon',speed:3.3,r:.3,reach:.32});
const carMeshes=[],wheels=[];const carPart=(x,y,z,w,h,d,color)=>{const m=box(carX+x-w/2,carZ+z-d/2,carX+x+w/2,carZ+z+d/2,y-h/2,y+h/2,color,false);carMeshes.push(m);return m};
carPart(0,.59,0,1.74,.45,3.85,0x18567a);
carPart(0,1.13,-.32,1.48,.61,1.68,0x5a8496);
carPart(0,1.46,-.32,1.54,.09,1.75,0x18567a);
for(const side of [-1,1]){
  carPart(side*.63,.68,1.94,.35,.15,.06,0xffe7aa);
  for(const axle of [-1.17,1.17]){
    const wheel=new THREE.Mesh(CYL,M(0x202124));
    wheel.rotation.z=Math.PI/2;wheel.scale.set(.34,.22,.34);
    wheel.position.set(carX+side*.86,.35,carZ+axle);scene.add(wheel);wheels.push(wheel);
  }
}
const carSolid={x1:carX-.94,x2:carX+.94,z1:carZ-1.94,z2:carZ+1.94,top:.85};solids.push(carSolid);
const hood=carPart(0,1.24,.87,1.63,.09,1.14,0x24759c);
hood.rotation.x=-1;
const engineBlock=carPart(0,.94,1.47,.74,.28,.58,0x656969);
const intake=carPart(0,1.1,1.47,.58,.12,.42,0xe15d2a);
intake.visible=false;
const carG=new THREE.Group();carG.position.set(carX,0,carZ);scene.add(carG);
for(const m of carMeshes.concat(wheels)){m.position.x-=carX;m.position.z-=carZ;carG.add(m)}
carG.userData.s=carSolid;carG.userData.wheels=wheels;const SIMCAR={g:carG,kind:'simon',name:'Simonovo auto'};VEH.push(SIMCAR);
// bod v okolí auta (dx doprava, dz dopředu) – auto se dá odjet, úkoly jdou s ním
const ca=(dx,dz)=>({get x(){const r=carG.rotation.y;return carG.position.x+dx*Math.cos(r)+dz*Math.sin(r)},get z(){const r=carG.rotation.y;return carG.position.z-dx*Math.sin(r)+dz*Math.cos(r)}});
// Pavlova modrá Babetta 210 parkuje u svářečky pod Bytem 2.
const babetta=(()=> {
  const g=new THREE.Group(), blue=0x2076bd, chrome=0xbac2c5;
  function part(x,y,z,w,h,l,color,tilt=0){
    const mesh=new THREE.Mesh(BOX,M(color));mesh.scale.set(w,h,l);mesh.position.set(x,y,z);mesh.rotation.x=tilt;g.add(mesh);
  }
  for(const z of [-.62,.62]){
    const tire=new THREE.Mesh(new THREE.TorusGeometry(.25,.055,8,24),M(0x222222));
    tire.rotation.y=Math.PI/2;tire.position.set(0,.31,z);g.add(tire);
    for(let i=0;i<8;i++){const spoke=new THREE.Mesh(BOX,M(chrome));spoke.scale.set(.02,.49,.014);spoke.rotation.x=i*Math.PI/8;tire.parent.add(spoke);spoke.position.copy(tire.position)}
    part(0,.63,z,.15,.05,.48,blue);
  }
  part(0,.39,-.12,.13,.1,.95,blue);part(0,.56,.18,.14,.58,.13,blue,.67);
  part(0,.65,-.35,.13,.55,.12,blue,-.3);part(0,.83,-.37,.26,.11,.51,0x292422);
  part(0,.76,.19,.21,.18,.41,blue,.35);part(0,.4,-.1,.28,.24,.25,0x777978);
  part(.16,.26,-.4,.07,.07,.62,chrome);part(0,.73,.52,.09,.86,.08,chrome,-.23);
  part(0,1.12,.42,.58,.05,.06,chrome);part(0,.97,.57,.16,.14,.13,0xffedb3);
  // Face the yard. Leave a walking lane beside the moped and a clear runway.
  const parking=[];
  for(const planZ of [390,415,440,465])for(const planX of [960,840,930,870,900]){
    const x=X(planX),z=Z(planZ);
    const approach=[-1,1].some(side=>!blocked(x+side*.7,z,0,.35));
    if(approach&&[-1,-.5,0,.5,1,1.5,2,2.5,3].every(d=>!blocked(x,z+d,0,.35,.55)))parking.push([x,z]);
  }
  const [homeX,homeZ]=parking[0]||[X(900),Z(415)];
  g.position.set(homeX,0,homeZ);g.rotation.y=0;g.userData.halfWidth=.3;g.userData.halfLength=.94;
  scene.add(g);carBox(g,true);const bike={kind:'babetta',name:'Pavlova Babetta 210',g,speedMul:.55,homeX,homeZ,range:bikeRange()};VEH.push(bike);return bike;
})();
function bikeRange(){return 1400+Math.random()*1800}
function serviceBike(){
  const b=babetta,g=b.g;
  if(!b.fault){const n=Math.random();b.fault=n<.55?'plug':n<.9?'carb':'engine';saveGame(true)}
  function finish(){b.range=bikeRange();b.fault=null;saveGame(true);toast('Babeta zase jede.')}
  if(b.fault==='plug'){miniStart('Očistit a dotáhnout svíčku',3,finish);return}
  if(Math.hypot(g.position.x-b.homeX,g.position.z-b.homeZ)>4){openList('Porucha Babety',[{name:'Odvézt Babetu před dílnu',sub:b.fault==='carb'?'Zanesený karburátor':'Generálka motoru',fn:()=>{g.position.set(b.homeX,0,b.homeZ);g.rotation.y=0;carBox(g,true);saveGame(true);toast('Babeta čeká před dílnou.')}}]);return}
  if(b.fault==='carb'){miniStart('Vyčistit karburátor před dílnou',4,finish,'stroke');return}
  if(b.fault==='engine'){miniStart('Vymontovat motor',3,()=>{b.fault='bench';saveGame(true);toast('Motor je na ponku uvnitř dílny. Generálku udělá Pavel.')});return}
  if(b.fault==='bench'){toast('Motor čeká na ponku uvnitř dílny.');return}
  miniStart('Namontovat opravený motor',3,finish)
}
function bikeAllowed(){return P()===pavel||(P()===simon&&DAY.n%3===0)}
const DRV={on:false,v:0,who:null};
function carAABB(){carBox(carG,!DRV.on||DRV.car!==SIMCAR)}
const carPt=(g,dx,dz)=>{const r=g.rotation.y;return {x:g.position.x+dx*Math.cos(r)+dz*Math.sin(r),z:g.position.z-dx*Math.sin(r)+dz*Math.cos(r)}};
// hledanost i peníze má každá postava zvlášť (Pavel, Tereza, Simon)
const charState=()=>{let h=null;try{h=people[act]}catch(_){}if(!h)return CHS0;return h.cs||(h.cs={lvl:0,calm:0,cool:0,money:5000,energy:100})};const CHS0={lvl:0,calm:0,cool:0,money:5000,energy:100};
const WANT={get lvl(){return charState().lvl},set lvl(v){charState().lvl=v},get calm(){return charState().calm},set calm(v){charState().calm=v},get cool(){return charState().cool},set cool(v){charState().cool=v}};
function addWanted(n,why){const was=WANT.lvl;WANT.lvl=Math.min(5,WANT.lvl+n);WANT.calm=0;if(WANT.lvl>was&&why)toast(why+' Hledanost: '+'★'.repeat(WANT.lvl))}
function enterCar(car=SIMCAR,rideOnly=false){
  if(car===redRide&&P()!==simon){toast('Tuhle laděnou Babetu si nechává Simon.');return}if(car.familyTrip){toast('Táta právě jede do stavebnin.');return}
  if(((car.kind==='parked'&&(car.locked??=VEH.indexOf(car)%3!==0))||['police','tractor'].includes(car.kind)||car.kind==='golf'&&P()!==simon)&&!charState().crowbar){toast('Zamčeno. Páčidlo leží na bedně na dvoře u náhradních dílů.');return}
  if(car===babetta){
    if(!bikeAllowed()){toast(P()===simon?'Pavel dnes Babetu potřebuje sám.':'Babeta patří Pavlovi.');return}
    if(!rideOnly&&car.fuel<100&&charState().fuelCans>0){
      openList('Babetta 210 · nádrž '+Math.ceil(car.fuel)+' %',[
        {name:'Dolít benzín z kanystru',sub:'Naplní nádrž · spotřebuje 1 kanystr',fn:()=>{
          const owner=charState();if(!(owner.fuelCans>0)||car.fuel>=100)return;
          owner.fuelCans--;car.fuel=100;car.lowWarn=0;hudEco();saveGame(true);toast('Babeta má plnou nádrž. Zbývající kanystry: '+owner.fuelCans)
        }},
        {name:car.range<=0?'Opravit Babetu':'Nasednout',off:car.fuel<=0&&car.range>0,fn:()=>enterCar(car,true)}
      ]);return
    }
    if(car.range<=0){serviceBike();return}
    if(car.fuel<=0){toast('Nádrž je prázdná. Dojeď autem na BENZINA v Kloboukách a vystup u stojanu pro plný kanystr.');return}
  }
  if(car.kind==='wreck'){toast('Tohle auto je na šrot.');return}
  if(car.kind==='golf'&&SIM.state!=='work'){toast('Simon je s Golfem pryč.');return}
  if(car.kind==='golf'&&P()!==simon){play('glass_break',.6);play('car_alarm',.4);toast('Ukradl jsi Simonovi Golf! Simon: „Pavle, ty vole, to je moje auto!“')}
  if(car.kind==='parked'){play('glass_break',.7);play('car_alarm',.5);addWanted(1,'Rozbil jsi okýnko a ukradl auto!');car.kind='stolen'}
  if(car.kind==='traffic'){ejectDriver(car);addWanted(2,'Vyhodil jsi řidiče a ujíždíš s jeho autem!');car.kind='stolen'}
  if(car.kind==='police'){addWanted(2,'Ukradl jsi policejní auto!');car.kind='stolenPolice'}
  if(car.kind==='abandoned')car.kind='stolen';
  if(car.kind==='tractor'){addWanted(1,'Ukradl jsi traktor! Farmář za tebou běží s vidlema.');car.kind='stolen'}
  if(carry)dropCarry();DRV.on=true;DRV.v=0;DRV.car=car;DRV.who=P();DRV.who.obj.visible=car===babetta;carBox(car.g,false);
  if(car===babetta){toast('Babetta 210 · W/S plyn a brzda, A/D řízení, E sesednout.');return}
  play('car_door',.6);toast('Řídíš! W/S plyn a brzda, A/D zatáčení, mezerník ruční brzda, Y rádio, H troubení, E vystoupit.')}
function exitCar(){const w=DRV.who,g=DRV.car.g;let ok=null;for(const [dx,dz] of [[-1.7,0],[1.7,0],[0,-3],[0,3]]){const pt=carPt(g,dx,dz);if(!blocked(pt.x,pt.z,0,.35)){ok=pt;break}}
  if(!ok){toast('Tady se vystoupit nedá – popojeď.');return}
  w.x=ok.x;w.z=ok.z;w.y=0;w.vy=0;w.obj.visible=true;DRV.on=false;DRV.v=0;carBox(g,true);DRV.car=null;DRV.radio=null;play('car_door',.6);if(SFX.engine_idle)SFX.engine_idle.pause()}
function driveTick(dt,f,s){
  const g=DRV.car.g,hb=!!keys.Space;
  if(DRV.car===babetta&&(babetta.range<=0||babetta.fuel<=0)){DRV.v=0;return}
  const boost=P()===simon && g===golf && keys.KeyU && f>0 ? 1.65 : 1;
  DRV.v+=f*(f>0?8*boost:7)*dt;if(!f)DRV.v*=Math.max(0,1-dt*1.2);if(f&&Math.sign(f)!==Math.sign(DRV.v)&&Math.abs(DRV.v)>.3)DRV.v*=Math.max(0,1-dt*5);
  if(hb){DRV.v*=Math.max(0,1-dt*1.8);if(Math.abs(DRV.v)>5&&s)play('tires',.55,2500)}
  DRV.v=Math.max(-5,Math.min(19*boost*(DRV.car.speedMul||1)*(DRV.car===TRAK.c?.45:1),DRV.v));
  const grip=Math.min(1,Math.abs(DRV.v)/3)*(hb?2.3:1.5)*(1-Math.min(.45,Math.abs(DRV.v)/45));
  const turn=-s*grip*Math.sign(DRV.v||1);const nr=g.rotation.y+turn*dt;
  DRV.slip=(DRV.slip||0)+((hb&&s?-s*.5:0)-(DRV.slip||0))*Math.min(1,dt*3);                 // smyk: karoserie se natočí víc, než kam auto jede
  const mv=nr-DRV.slip*.35,nx=g.position.x+Math.sin(mv)*DRV.v*dt,nz=g.position.z+Math.cos(mv)*DRV.v*dt;
  const bike=DRV.car===babetta;
  const hit=(bike?[-.65,0,.65]:[-1.5,0,1.5]).some(k=>blocked(nx+Math.sin(nr)*k,nz+Math.cos(nr)*k,0,bike?.25:.9,.55));
  if(hit){let other=null,od=3.4;for(const o of VEH){if(o===DRV.car||!o.g.visible)continue;const d=Math.hypot(o.g.position.x-nx,o.g.position.z-nz);if(d<od){od=d;other=o}}
    if(other&&Math.abs(DRV.v)>1.5){const sp=Math.abs(DRV.v),dir=Math.sign(DRV.v),kx=Math.sin(nr)*dir,kz=Math.cos(nr)*dir;   // náraz do auta: odhodí ho, poškodí obě
      other.kx=(other.kx||0)+kx*sp*.75;other.kz=(other.kz||0)+kz*sp*.75;other.spin=(Math.random()-.5)*sp*.25;other.stun=3;play('crash',.7,600);damageCar(other,sp*7);
      if(other.kind==='traffic'&&sp>4){ejectDriver(other);other.kind='abandoned';other.name='opuštěné auto';other.stun=0;addWanted(1,'Řidič vyskočil z auta, utíká a volá policii!')}
      else if(other.kind==='parked'&&sp>5&&WANT.lvl<1)addWanted(1,'Nabourals do zaparkovaného auta – spustil se alarm!');if(other.kind==='police')addWanted(1,'Nabourals policejní auto!');
      if(Math.abs(DRV.v)>4)damageCar(DRV.car,sp*4);DRV.v*=-.15;if(!DRV.on)return}
    else{if(Math.abs(DRV.v)>4){play('crash',.6,1200);damageCar(DRV.car,Math.abs(DRV.v)*6)}DRV.v*=-.25;if(!DRV.on)return}}else{g.rotation.y=nr;g.position.x=Math.max(TOWN.x1,Math.min(TOWN.x2,nx));g.position.z=Math.max(TOWN.z1,Math.min(TOWN.z2,nz))}
  for(const w of g.userData.wheels||[])w.rotation.x+=DRV.v*dt/.34;
  const w=DRV.who;w.x=g.position.x;w.z=g.position.z;w.head=g.rotation.y;w.moving=Math.abs(DRV.v)>.5?1:0;w.obj.position.set(w.x,0,w.z);
  if(bike){w.obj.rotation.y=w.head;DRV.car.range-=(hit?0:Math.abs(DRV.v)*dt);if(DRV.car.range<=0){DRV.v=0;toast('Babeta chcípla. Sesedni a oprav ji přes E.');return}}
  {const e=SFX.engine_idle;if(e&&!e.dead&&audioOn){if(e.paused){const r=e.play();if(r&&r.catch)r.catch(()=>{})}e.playbackRate=Math.min(2.4,.8+Math.abs(DRV.v)/9)}}if(f>0&&Math.abs(DRV.v)<3)play('engine_rev',.35,6000)}
// poškození: kouř od 50 %, při 100 % vrak (hoří, nedá se řídit). Ráno se Golf opraví.
const SMOKE=[];{for(let i=0;i<40;i++){const m=new THREE.Mesh(SPH,BASM({color:0x555555,transparent:true,opacity:.5,depthWrite:false}));m.visible=false;scene.add(m);SMOKE.push({m,life:0})}}
function damageCar(car,n){if(car===babetta){car.range=Math.max(0,car.range-n);if(!car.range){if(DRV.car===car)DRV.v=0;toast('Babeta potřebuje opravit.')}return}car.dmg=Math.min(100,(car.dmg||0)+n);if(car.dmg>=50&&!car.smoke){car.smoke=1;toast('Auto kouří! Ještě pár nárazů a je na šrot.')}if(car.dmg>=100&&car.kind!=='wreck')wreckCar(car)}
function wreckCar(car){const g=car.g;const simons=(car.kind==='golf'||car.kind==='simon')&&P()!==simon;if(simons)afterGameTime(()=>addWanted(2,'Simon zavolal policajty, že mu Pavel rozsekal auto!'),1500);if(DRV.on&&DRV.car===car){const w=DRV.who;exitCar();if(DRV.on){w.obj.visible=true;DRV.on=false;DRV.car=null;carBox(g,true)}}
  car.prevKind=car.kind;car.kind='wreck';car.fire=1;g.userData.orig=g.userData.orig||[];g.traverse(m=>{if(m.isMesh&&!m.userData.burn){g.userData.orig.push([m,m.material]);m.material=STDM({color:new THREE.Color(m.material.color||0x222222).multiplyScalar(.25)})}});
  play('crash',.8);toast(car===VEH.find(v=>v.g===golf)?'Simonův Golf je na šrot! Simon dnes půjde domů pěšky.':'Auto je na šrot!')}
function repairCar(car){const g=car.g;for(const [m,mat] of g.userData.orig||[])m.material=mat;g.userData.orig=[];car.dmg=0;car.smoke=0;car.fire=0;if(car.kind==='wreck')car.kind=car.prevKind||'parked'}
function smokeTick(dt,t){for(const c of VEH){if(!c.smoke||!c.g.visible)continue;if(Math.random()<dt*(c.fire?18:7)){const s=SMOKE.find(q=>q.life<=0);if(s){s.life=1.6;const pt=carPt(c.g,0,1.4);s.m.position.set(pt.x+(Math.random()-.5)*.4,1.1,pt.z+(Math.random()-.5)*.4);s.m.scale.setScalar(.25);
      s.m.material.color.setHex(c.fire&&Math.random()<.5?0xff7a1a:c.fire?0x222222:0x777777);s.m.visible=true}}}
  for(const s of SMOKE){if(s.life<=0)continue;s.life-=dt;s.m.position.y+=dt*1.4;s.m.scale.multiplyScalar(1+dt*.9);s.m.material.opacity=Math.max(0,s.life/1.6)*.55;if(s.life<=0)s.m.visible=false}}
// ---------- provoz na ulicích, krádeže, policie ----------
// silniční graf z tras ROUTES (křižovatky = sdílené body; bod uprostřed jiného úseku ho rozdělí)
const GN=[],GA=[];
{const key=(x,z)=>{for(let i=0;i<GN.length;i++)if(Math.hypot(GN[i][0]-x,GN[i][1]-z)<2.5)return i;GN.push([x,z]);GA.push([]);return GN.length-1};
 const lines=Object.values(ROUTES).map(r=>r.map(([x,z])=>[x,z]));
 // vlož do tras body jiných tras, které leží uvnitř jejich úseků
 const all=[].concat(...lines);
 for(const L of lines)for(let i=0;i<L.length-1;i++){const [ax,az]=L[i],[bx,bz]=L[i+1],dx=bx-ax,dz=bz-az,ll=dx*dx+dz*dz;const ins=[];
   for(const [x,z] of all){const t=((x-ax)*dx+(z-az)*dz)/ll;if(t<=.01||t>=.99)continue;if(Math.hypot(x-ax-dx*t,z-az-dz*t)<2.5)ins.push([t,x,z])}
   if(ins.length){ins.sort((p,q)=>p[0]-q[0]);L.splice(i+1,0,...ins.map(([t,x,z])=>[ax+dx*t,az+dz*t]));i+=ins.length}}
 const link=(i,j)=>{if(i!==j&&!GA[i].includes(j)){GA[i].push(j);GA[j].push(i)}};
 for(const L of lines)for(let i=0;i<L.length-1;i++)link(key(...L[i]),key(...L[i+1]));
 window.__GN=GN;window.__GA=GA}
const nodeDist=(i,j)=>Math.hypot(GN[i][0]-GN[j][0],GN[i][1]-GN[j][1]);
function nearNode(x,z){let b=0,bd=1e9;for(let i=0;i<GN.length;i++){const d=Math.hypot(GN[i][0]-x,GN[i][1]-z);if(d<bd){bd=d;b=i}}return b}
function roadPath(a,b){const D=new Array(GN.length).fill(1e9),prev=new Array(GN.length).fill(-1),done=new Array(GN.length).fill(false);D[a]=0;
  for(;;){let u=-1;for(let i=0;i<GN.length;i++)if(!done[i]&&D[i]<1e9&&(u<0||D[i]<D[u]))u=i;if(u<0||u===b)break;done[u]=true;for(const v of GA[u]){const nd=D[u]+nodeDist(u,v);if(nd<D[v]){D[v]=nd;prev[v]=u}}}
  const path=[];let c=b;while(c>=0&&c!==a){path.unshift(GN[c]);c=prev[c]}return path}
const TRAF=[];const TCOL=[0xd0d4d8,0x1f4f9a,0x2a2a2a,0xb51e24,0xe8e8e8,0x2e6b3a,0xd4a017,0x6b4226,0x8a8f96,0xf2f2f2];
function carDecal(g,text,bg,fg,y,len){const c=document.createElement('canvas');c.width=512;c.height=64;const x=c.getContext('2d');x.fillStyle=bg;x.fillRect(0,0,512,64);x.fillStyle=fg;x.font='800 42px Rubik, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,34,490);
  const t=new THREE.CanvasTexture(c);for(const sx of [-1,1]){const m=new THREE.Mesh(new THREE.PlaneGeometry(len,len/8),BASM({map:t}));m.position.set(sx*.895,y,0);m.rotation.y=sx*Math.PI/2;g.add(m)}}
function policeLook(g,state){const b=(c,sx,sy,sz,x,y,z)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(sx,sy,sz);m.position.set(x,y,z);g.add(m);return m};
  if(state){b(0x1f4f9a,1.79,.1,4.42,0,.48,0);b(0xc8ff2e,1.79,.1,4.42,0,.62,0);carDecal(g,'POLICIE',' #1f4f9a'.trim(),'#ffffff',.78,2.4)}
  else{b(0x1f4f9a,1.79,.09,4.42,0,.5,0);b(0xffd21f,1.79,.09,4.42,0,.6,0);carDecal(g,'MĚSTSKÁ POLICIE','#ffffff','#1f4f9a',.75,2.8)}
  for(const sx of [-.3,.3]){const m=new THREE.Mesh(BOX,BASM({color:sx<0?0x2050ff:0xff2020}));m.material.color.multiplyScalar(4);m.scale.set(.5,.12,.25);m.position.set(sx*1.1,1.42,-.2);g.add(m);(g.userData.bar=g.userData.bar||[]).push(m)}}
// auto na grafu: jede z uzlu a do uzlu b, pravým pruhem; na křižovatce si vybere další směr
function placeOnGraph(c,dt=0){const [ax,az]=GN[c.a],[bx,bz]=GN[c.b],dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz)||1,fx=dx/L,fz=dz/L,off=1.8;
  const x=ax+dx*c.t-fz*off,z=az+dz*c.t+fx*off;c.g.position.set(x,0,z);const want=Math.atan2(dx,dz);let dr=want-c.g.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));c.g.rotation.y+=dt?dr*Math.min(1,dt*5):dr}
function nextNode(c){const opts=GA[c.b].filter(j=>j!==c.a);return opts.length?opts[Math.floor(Math.random()*opts.length)]:c.a}
function spawnTraffic(_li,_k,col,police,state){const g=mkCar(0,0,0,col,false);const c={g,kind:police?'police':'traffic',name:police?(state?'policejní auto':'auto městské policie'):'auto',v:0,max:police?(state?17:14):8.5+Math.random()*3,state:!!state};
  if(police){policeLook(g,state);c.drv=null}
  let tries=0;do{c.a=Math.floor(Math.random()*GN.length);tries++}while(tries<50&&(!GA[c.a].length||Math.hypot(GN[c.a][0]+4,GN[c.a][1])<60));
  c.b=GA[c.a][Math.floor(Math.random()*GA[c.a].length)];c.t=Math.random();placeOnGraph(c);VEH.push(c);TRAF.push(c);return c}
for(let i=0;i<26;i++)spawnTraffic(0,0,TCOL[i%TCOL.length],false);
const PATROL=spawnTraffic(0,0,0xf7f7f7,true,false);PATROL.max=8;PATROL.patrol=1;for(const m of PATROL.g.userData.bar||[])m.visible=false;   // městská policie hlídkuje i bez hvězd
const cops=[];
function ejectDriver(car){const d=agent(person(0xf0c0a0,pick([0x3a5a8a,0x8a3a3a,0x2b2b2b]),0x2f3e5a,0x2a1d14),car.g.position.x,car.g.position.z,{speed:4,r:.3});d.obj.scale.setScalar(.82);
  const p=carPt(car.g,-1.8,0);d.x=p.x;d.z=p.z;d.flee=6;peds.push(d);const i=TRAF.indexOf(car);if(i>=0)TRAF.splice(i,1)}
const peds=[];
function trafficTick(dt){COL_IN=false;trafficTickIn(dt);COL_IN=inside}
function knockTick(dt){for(const o of VEH){if(!o.kx&&!o.kz)continue;if(DRV.on&&DRV.car===o){o.kx=o.kz=0;continue}const g=o.g;carBox(g,false);
  const nx=g.position.x+o.kx*dt,nz=g.position.z+o.kz*dt;if(!blocked(nx,nz,0,.9,.55)){g.position.x=nx;g.position.z=nz;g.rotation.y+=(o.spin||0)*dt}else{o.kx*=-.3;o.kz*=-.3;if(Math.hypot(o.kx,o.kz)>3)play('crash',.4,500)}
  const f=Math.max(0,1-dt*2.2);o.kx*=f;o.kz*=f;if(o.spin)o.spin*=f;if(Math.hypot(o.kx,o.kz)<.15){o.kx=o.kz=0;o.spin=0}carBox(g,o.kind!=='wreck'||true)}}
function trafficTickIn(dt){
  knockTick(dt);
  for(const c of TRAF){if(DRV.on&&DRV.car===c)continue;if(c.a===undefined)continue;if(c.stun>0){c.stun-=dt;c.v=0;if(c.stun<=0){c.offX=c.g.position.x;c.offZ=c.g.position.z;c.offT=1.5;if(Math.random()<.5&&Math.hypot(P().x-c.g.position.x,P().z-c.g.position.z)<25)toast(pick(['Řidič: „Ty vole, kam čumíš?!“','Řidič troubí a ukazuje ti prostředníček.','Řidič: „To zaplatíš, ty magore!“']));play('horn',.5,2000)}continue}const len=nodeDist(c.a,c.b)||1;
    const fx=Math.sin(c.g.rotation.y),fz=Math.cos(c.g.rotation.y);let block=false;
    const chk=(x,z,rr)=>{const dx=x-c.g.position.x,dz=z-c.g.position.z,ahead=dx*fx+dz*fz,side=Math.abs(dx*fz-dz*fx);return ahead>0&&ahead<rr&&side<1.6};
    const p=P();if(!inside&&chk(p.x,p.z,7))block=true;
    for(const o of VEH){if(o===c||!o.g.visible)continue;if(chk(o.g.position.x,o.g.position.z,7.5)){block=true;break}}
    if(!block&&BUS.g){const bx=BUS.g.position.x,bz=BUS.g.position.z,dx=bx-c.g.position.x,dz=bz-c.g.position.z,ah=dx*fx+dz*fz,sd=Math.abs(dx*fz-dz*fx);if(ah>0&&ah<12&&sd<2.6)block=true}
    if(!block)for(const o of (window.__PEDS||[]))if(chk(o.x,o.z,5)){block=true;break}
    const corner=(1-c.t)*len<7?.5:1;c.v+=((block?0:c.max*corner)-c.v)*Math.min(1,dt*(block?4:1.2));
    if(block&&c.v<.5&&!c.honk){c.honk=1;if(Math.hypot(p.x-c.g.position.x,p.z-c.g.position.z)<20)play('horn',.45,3000)}if(!block)c.honk=0;
    c.t+=c.v*dt/len;if(c.t>=1){const n=nextNode(c);c.a=c.b;c.b=n;c.t=0}placeOnGraph(c,dt);if(c.offT>0){c.offT-=dt;const k=Math.max(0,c.offT/1.5);c.g.position.x+=(c.offX-c.g.position.x)*k;c.g.position.z+=(c.offZ-c.g.position.z)*k}for(const w of c.g.userData.wheels)w.rotation.x+=c.v*dt/.32;carBox(c.g,true)}
  for(let i=peds.length-1;i>=0;i--){const d=peds[i],p=P();d.flee-=dt;const ax=d.x-p.x,az=d.z-p.z,dd=Math.hypot(ax,az)||1;step(d,ax/dd,az/dd,d.speed,dt);if(d.flee<=0){scene.remove(d.obj);peds.splice(i,1)}}
}
// policie: městská (bílá Octavia, modro-žlutý pruh) od 1★, státní od 3★, vrtulník při 5★
function spawnCop(state){const p=P(),far=[];for(let i=0;i<GN.length;i++){const d=Math.hypot(GN[i][0]-p.x,GN[i][1]-p.z);if(d>70&&d<220)far.push(i)}const k=far.length?pick(far):0;
  const c=spawnTraffic(0,0,state?0xe9ecef:0xf7f7f7,true,state);TRAF.splice(TRAF.indexOf(c),1);c.g.position.set(GN[k][0],0,GN[k][1]);c.node=k;c.path=[];c.v=0;c.repath=0;cops.push(c)}
const HELI={g:null,a:0};
{const g=new THREE.Group(),b=(c,sx,sy,sz,x,y,z)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
 b(0x1f4f9a,1.8,1.6,4,0,0,0);b(0x2a3640,1.6,.9,1.2,0,.2,1.7);b(0x1f4f9a,.4,.4,4,0,.2,-3.6);b(0xc8ff2e,1.82,.25,4.02,0,-.3,0);
 const rot=b(0x222222,9,.06,.4,0,1,0);const rot2=b(0x222222,.4,.06,9,0,1,0);g.userData.rot=[rot,rot2];
 const beam=new THREE.Mesh(new THREE.ConeGeometry(4,26,16,1,true),BASM({color:0xfff6c8,transparent:true,opacity:.13,depthWrite:false}));beam.position.y=-13;g.add(beam);
 g.visible=false;scene.add(g);HELI.g=g}
const BUST={t:0};
function copsTick(dt,t){COL_IN=false;copsTickIn(dt,t);COL_IN=inside;
  if(DRV.on&&!inside){SPEED.cd-=dt;if(SPEED.cd<=0&&Math.abs(DRV.v)>13&&WANT.lvl<1){for(const c of VEH){if(c.kind!=='police'||!c.g.visible||c===DRV.car)continue;if(Math.hypot(c.g.position.x-DRV.car.g.position.x,c.g.position.z-DRV.car.g.position.z)<22){SPEED.cd=20;addWanted(1,'Rychlá jízda kolem policie! Městská tě zastavuje.');break}}}}}
const SPEED={cd:0};
function copsTickIn(dt,t){const p=P(),pos=DRV.on?DRV.car.g.position:{x:p.x,z:p.z};
  const nCity=Math.min(2,WANT.lvl),nState=Math.max(0,WANT.lvl-2);
  if(!inside){while(cops.filter(c=>!c.state).length<nCity)spawnCop(false);while(cops.filter(c=>c.state).length<nState)spawnCop(true)}
  for(const st of [false,true]){const L=cops.filter(c=>c.state===st),n=st?nState:nCity;for(let k=n;k<L.length;k++){const c=L[k];scene.remove(c.g);carBox(c.g,false);VEH.splice(VEH.indexOf(c),1);cops.splice(cops.indexOf(c),1)}}
  const inYard=!inside&&pos.x<60&&!outsideYard(pos);if(inYard&&WANT.lvl>0)WANT.calm=0;   // na dvorek policie nejede – čeká na ulici, bez sirén
  const tgtPos=inYard?{x:X(486),z:Z(-10)}:pos;let nearest=1e9;
  if(WANT.lvl===0&&cops.length){for(const c of cops){scene.remove(c.g);carBox(c.g,false);VEH.splice(VEH.indexOf(c),1)}cops.length=0}
  // vrtulník
  HELI.g.visible=WANT.lvl>=5&&!inside;if(HELI.g.visible){HELI.a+=dt*.5;const hx=pos.x+Math.sin(HELI.a)*14,hz=pos.z+Math.cos(HELI.a)*14;HELI.g.position.x+=(hx-HELI.g.position.x)*Math.min(1,dt*.8);HELI.g.position.z+=(hz-HELI.g.position.z)*Math.min(1,dt*.8);HELI.g.position.y=26;HELI.g.rotation.y=HELI.a+Math.PI/2;for(const r of HELI.g.userData.rot)r.rotation.y+=dt*25}
  let near=HELI.g.visible;
  for(const c of cops){if(DRV.on&&DRV.car===c)continue;for(const [k,m] of (c.g.userData.bar||[]).entries())m.visible=Math.floor(t*6+k)%2===0;
    const d=Math.hypot(pos.x-c.g.position.x,pos.z-c.g.position.z),dT=Math.hypot(tgtPos.x-c.g.position.x,tgtPos.z-c.g.position.z);nearest=Math.min(nearest,d);if(d<45&&!inYard)near=true;
    let tx,tz;if(dT<28){tx=tgtPos.x;tz=tgtPos.z}else{c.repath-=dt;if(c.repath<=0||!c.path.length){c.repath=2;c.path=roadPath(nearNode(c.g.position.x,c.g.position.z),nearNode(tgtPos.x,tgtPos.z))}if(c.path.length){[tx,tz]=c.path[0];if(Math.hypot(tx-c.g.position.x,tz-c.g.position.z)<4)c.path.shift()}else{tx=tgtPos.x;tz=tgtPos.z}}
    const dx=tx-c.g.position.x,dz=tz-c.g.position.z,want=Math.atan2(dx,dz);let dr=want-c.g.rotation.y;dr=Math.atan2(Math.sin(dr),Math.cos(dr));c.g.rotation.y+=dr*Math.min(1,dt*3);
    const vT=dT<(inYard?4:6)?0:c.max*(Math.abs(dr)>1?.45:1);c.v+=(vT-c.v)*Math.min(1,dt*1.5);const nx=c.g.position.x+Math.sin(c.g.rotation.y)*c.v*dt,nz=c.g.position.z+Math.cos(c.g.rotation.y)*c.v*dt;
    carBox(c.g,false);if(!blocked(nx,nz,0,1,.55)){c.g.position.x=nx;c.g.position.z=nz;c.stuck=0}else{c.v*=.5;c.stuck=(c.stuck||0)+dt;if(c.stuck>3){const k=nearNode(c.g.position.x,c.g.position.z);c.g.position.set(GN[k][0],0,GN[k][1]);c.stuck=0;c.path=[]}}carBox(c.g,true);
    for(const w of c.g.userData.wheels)w.rotation.x+=c.v*dt/.32}
  // zatčení: policie je u tebe a ty stojíš / jdeš pěšky
  const close=!inYard&&cops.some(c=>Math.hypot(pos.x-c.g.position.x,pos.z-c.g.position.z)<(DRV.on?6:3.5));
  if(close&&(!DRV.on||Math.abs(DRV.v)<1.2)){BUST.t+=dt;if(BUST.t>2.5)busted()}else BUST.t=Math.max(0,BUST.t-dt);
  if(WANT.lvl>0){if(near||inYard)WANT.calm=0;else{WANT.calm+=dt*(inYard?2:1);if(WANT.calm>18){WANT.lvl--;WANT.calm=0;toast(WANT.lvl?'Policie tě trochu ztratila. Hledanost: '+'★'.repeat(WANT.lvl):'Policie tě ztratila. Čistý štít.')}}}
  const sir=SFX.siren;if(sir&&!sir.dead){const on=cops.length>0&&!inYard&&!inside&&nearest<32&&audioOn;if(on&&sir.paused){const r=sir.play();if(r&&r.catch)r.catch(()=>{})}if(!on&&!sir.paused)sir.pause()}
  const hud=$('wanted');if(hud){const txt=WANT.lvl?'★'.repeat(WANT.lvl)+'☆'.repeat(5-WANT.lvl):'';if(hud.textContent!==txt)hud.textContent=txt;hud.classList.toggle('on',WANT.lvl>0)}
}
// radar jako v GTA (vlevo dole) – při jízdě a při hledanosti; sever podle směru jízdy
const rdr=$('radar'),rg=rdr.getContext('2d');
function drawRadar(t){const pq=P(),on=started&&!inside;/* radar jako v GTA všude venku */rdr.classList.toggle('on',on);$('mm').style.visibility=on?'hidden':'';if(!on)return;
  const W=rdr.width,C=W/2,p=P(),px=DRV.on?DRV.car.g.position.x:p.x,pz=DRV.on?DRV.car.g.position.z:p.z,hd=DRV.on?DRV.car.g.rotation.y:p.head,K=1.8;
  rg.save();rg.clearRect(0,0,W,W);rg.beginPath();rg.arc(C,C,C,0,7);rg.clip();rg.fillStyle='#6fa95a';rg.fillRect(0,0,W,W);
  rg.translate(C,C);rg.rotate(hd+Math.PI);rg.scale(K,K);rg.translate(-px,-pz);
  const R=(a,b,c,d,col)=>{rg.fillStyle=col;rg.fillRect(X(a),Z(b),(c-a)/40,(d-b)/40)};
  for(const [a,b,c,d,col] of window.__RD||[])R(a,b,c,d,col);
  for(const [a,b,c,d] of window.__HS||[])R(a,b,c,d,'#e9d8b8');
  rg.lineCap='round';for(const g of SEG){if(g.loc)continue;rg.strokeStyle='#4a4d52';rg.lineWidth=g.w+2;rg.beginPath();rg.moveTo(g.a[0],g.a[1]);rg.lineTo(g.b[0],g.b[1]);rg.stroke()}
  rg.fillStyle='#e9d8b8';for(const h of window.__THS||[]){rg.fillRect(h[0]-h[2],h[1]-h[2],h[2]*2,h[2]*2)}
  for(const L of LANDS){rg.fillStyle=L[4]==='hřiště'?'#3f8a3a':'#d9c7a0';rg.fillRect(L[0],L[1],L[2]-L[0],L[3]-L[1])}
  for(const [a,b,c,d,col] of mapRects)R(a,b,c,d,col);
  for(const c of VEH){if(!c.g.visible||(DRV.on&&DRV.car===c))continue;rg.fillStyle=c.kind==='police'?(Math.floor(t*4)%2?'#2050ff':'#ff2020'):c.kind==='traffic'?'#ffffff':'#8a8f96';rg.beginPath();rg.arc(c.g.position.x,c.g.position.z,c.kind==='police'?2.4:1.6,0,7);rg.fill()}
  if(thief.obj.visible){rg.fillStyle='#e02020';rg.beginPath();rg.arc(thief.x,thief.z,1.6,0,7);rg.fill()}
  if(WPT.on){rg.fillStyle='#3aa0ff';rg.beginPath();rg.arc(WPT.x,WPT.z,3,0,7);rg.fill()}if(ECO.job){const tg=ECO.job.stage==='to'?ECO.job.to:ECO.job.at;rg.fillStyle='#ffd23a';rg.beginPath();rg.arc(tg.x,tg.z,3,0,7);rg.fill()}
  rg.restore();
  if(WPT.on){const dx=WPT.x-px,dz=WPT.z-pz,d=Math.hypot(dx,dz);if(d*K>C-10){const a=Math.atan2(dx,dz)-hd;rg.save();rg.translate(C+Math.sin(-a+Math.PI)*0,C);rg.rotate(Math.PI-a);rg.fillStyle='#3aa0ff';rg.beginPath();rg.moveTo(0,C-6);rg.lineTo(7,C-18);rg.lineTo(-7,C-18);rg.fill();rg.restore()}}
  rg.save();rg.translate(C,C);rg.fillStyle='#fff';rg.strokeStyle='#000';rg.lineWidth=2;rg.beginPath();rg.moveTo(0,-11);rg.lineTo(8,9);rg.lineTo(0,4);rg.lineTo(-8,9);rg.closePath();rg.fill();rg.stroke();rg.restore();
  if(WANT.lvl>0){rg.save();rg.globalAlpha=.25+.15*Math.sin(t*6);rg.fillStyle=Math.floor(t*3)%2?'#2050ff':'#ff2020';rg.beginPath();rg.arc(C,C,C,0,7);rg.lineWidth=14;rg.strokeStyle=rg.fillStyle;rg.stroke();rg.restore()}}
const FINES=[0,1000,3000,6000,12000,20000];
function busted(){BUST.t=0;const full=FINES[WANT.lvl]||1000,fine=Math.min(full,Math.max(0,ECO.money));let took=null;if(fine<full){const own=[...ECO.owned];if(own.length){took=own[Math.floor(Math.random()*own.length)];ECO.owned.delete(took);refreshWall();if(tool.id===took)equip(null)}}fade(()=>{if(DRV.on){const c=DRV.car,w=DRV.who;w.obj.visible=true;DRV.on=false;DRV.car=null;DRV.radio=null;DRV.v=0;if(SFX.engine_idle)SFX.engine_idle.pause();
    if(c.kind==='golf'||c.kind==='simon'||c.kind==='own'){c.g.position.set(124,0,-146);c.g.rotation.y=0;c.g.visible=false;IMP.car=c;afterGameTime(()=>{c.g.visible=true;carBox(c.g,true)},400)}else{c.g.visible=false;const i=VEH.indexOf(c);if(i>=0)VEH.splice(i,1)}}
  money(-fine);const p=P();p.x=10.2;p.z=155;p.y=0;p.vy=0;p.head=-Math.PI/2;camT.set(p.x,1.35,p.z);
  WANT.lvl=0;for(const c of cops){scene.remove(c.g);carBox(c.g,false);VEH.splice(VEH.indexOf(c),1)}cops.length=0;toast('ZATČEN! Pokuta '+fmtK(fine)+(took?' a na zbytek ti zabavili nářadí ('+(TOOLS.find(t=>t[0]===took)||[0,took])[1]+')':'')+'. Pustili tě z policejní stanice u náměstí'+(IMP.car?', auto odtáhli na odtahovku (výplata 1 500 Kč)':'')+'. Hledanost zrušena.')})}
const RADIO=[['hifi','Rádio Kotel'],['shop','Rock Dílna FM'],['yard','Dvorek FM'],['boban','Haf Haf Rádio'],['night','Noční jízda']];
const jobs=['Odpoj sání','Vyndej motor','Namontuj upravený motor','Seřiď motor'];
let job=0,working=0;
function workOnCar(){
  if(job===jobs.length||working>0)return;
  working=1.5;simon.head=Math.PI;play(job===3?'drill':'screw',.65);
}
function mechanicTick(dt,t){
  if(ECO.rep)return;   // Simon právě opravuje vrak na dvorku
  const W=ca(0,2.55),near=Math.hypot(simon.x-W.x,simon.z-W.z)<1.25;
  if(P()!==simon&&!simon.asleep&&SIM.state==='work'&&goHome(simon,dt)){}
  else if(P()!==simon&&!simon.asleep&&SIM.state==='work'){
    patrol=patrol||[ca(0,2.55),ca(2.25,2.75),ca(2.25,-.8),ca(2.25,2.75)];const pt=patrol[station],x=pt.x,z=pt.z;
    if(DRV.on&&DRV.car===SIMCAR&&DRV.who!==simon){step(simon,0,0,0,dt)}else
    if(goTo(simon,x,z,1.65,dt,.18)){
      simon.head=station===0?Math.PI:-Math.PI/2;
      stationWait+=dt;
      if(stationWait>(station===0?3:station===2?2:.15)){station=(station+1)%patrol.length;stationWait=0}
    }
  }
  const busy=near&&job<jobs.length&&(P()!==simon||working>0);
  simon.obj.userData.armR.rotation.x=busy?-1.15+.2*Math.sin(t*10):(holder===simon&&tool.held?-1.1:-.35);
  if(working<=0)return;
  if(!near){working=0;return}
  working=Math.max(0,working-dt);
  if(working===0){
    job++;engineBlock.visible=job!==2;intake.visible=job>=3;
    if(job===jobs.length){hood.rotation.x=0;hood.position.set(0,.87,1.35);toast('Auto je hotové – teď se dá řídit (F u auta).')}
    toast(jobs[job]||'Auto je hotové!');
  }
}

// ---------- úkoly: Pavel vyrábí překážky pro psy, Simon má vlastní zakázky (nezávislé na ostatních) ----------
const SAW=['handsaw','circsaw','jigsaw'],DRILL=['drill','hammerdrill','screwdriver'],SCREW=['screwdriver','drill'],HAM=['hammer','wrench'],PLANE=['plane'];
const obst={};
function buildObstacle(kind){
  const g=new THREE.Group();scene.add(g);const b=(c,sx,sy,sz,x,y,z)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;g.add(m)};
  if(kind==='jump'){g.position.set(X(1000),0,Z(880));for(const sx of [-.7,.7]){for(let k=0;k<5;k++)b(k%2?0xffffff:0xc8202a,.08,.2,.08,sx,.1+k*.2,0)}b(0xf2c14e,1.5,.05,.05,0,.62,0)}
  if(kind==='slalom'){g.position.set(X(1100),0,Z(830));for(let k=0;k<6;k++){b(k%2?0xffffff:0x1f4f9a,.05,1,.05,0,.5,k*.8);b(0x222222,.16,.04,.16,0,.02,k*.8)}}
  if(kind==='beam'){g.position.set(X(990),0,Z(1050));b(0x9c6b3e,3,.08,.3,0,.6,0);for(const sx of [-1.1,1.1])b(0x7a5232,.1,.6,.3,sx,.3,0);
    for(const sd of [-1,1]){const r=new THREE.Mesh(BOX,M(0xb08a5a));r.scale.set(1.4,.06,.3);r.position.set(sd*2.1,.3,0);r.rotation.z=sd*.42;r.castShadow=true;g.add(r)}}
  obst[kind]=g;
}
const wood={x:X(970),z:Z(764)},bench={x:X(710),z:Z(205)},field={x:X(1040),z:Z(960)};
const TASKS={
 pavel:[
  {l:'Vezmi prkna z hromady dřeva u kompostu',at:wood,t:1.2,s:'crate'},
  {l:'Na ponku ve venkovní dílně uřízni prkna na laťku (pila)',at:bench,t:2.2,s:'handsaw',tool:SAW},
  {l:'Vyvrtej díry do stojanů laťky (vrtačka)',at:bench,t:2,s:'drill',tool:DRILL},
  {l:'Sešroubuj stojany (šroubovák nebo vrtačka)',at:bench,t:1.8,s:'screw',tool:SCREW},
  {l:'Odnes laťku na cvičiště a postav ji',at:field,t:1.5,s:'crate',done:()=>buildObstacle('jump')},
  {l:'Vezmi další dřevo na slalomové tyče',at:wood,t:1.2,s:'crate'},
  {l:'Uřízni 6 tyčí na ponku (pila)',at:bench,t:2.2,s:'circularsaw',tool:SAW},
  {l:'Zatluč slalomové tyče na cvičišti (kladivo)',at:field,t:2.4,s:'hammer',tool:HAM,done:()=>buildObstacle('slalom')},
  {l:'Vezmi dlouhé prkno na kladinu',at:wood,t:1.2,s:'crate'},
  {l:'Vyhobluj prkno na ponku (hoblík)',at:bench,t:2.4,s:'plane',tool:PLANE},
  {l:'Sešroubuj nohy kladiny (šroubovák nebo vrtačka)',at:bench,t:2,s:'screw',tool:SCREW},
  {l:'Postav kladinu na cvičišti',at:field,t:1.6,s:'crate',done:()=>buildObstacle('beam')}],
 tereza:[
  {l:'Ashley: sedni! (nech ji chvíli sedět)',at:field,t:3,dog:'ashley',an:'sit'},
  {l:'Jackie: lehni! (nesmí se hned zvednout)',at:field,t:3.5,dog:'jackie',an:'down'},
  {l:'Přivolání Ashley z dálky',at:field,t:4,dog:'ashley',an:'recall'},
  {l:'Jackie: zůstaň, a pak ke mně',at:field,t:4.5,dog:'jackie',an:'recall'},
  {l:'Ashley přes skokovou laťku',at:{x:X(1000)+1.6,z:Z(880)},t:5,dog:'ashley',an:'jump',need:'jump'},
  {l:'Jackie přes skokovou laťku',at:{x:X(1000)+1.6,z:Z(880)},t:5,dog:'jackie',an:'jump',need:'jump'},
  {l:'Ashley slalomem mezi tyčemi',at:{x:X(1100)+1.4,z:Z(830)+2},t:6,dog:'ashley',an:'slalom',need:'slalom'},
  {l:'Jackie slalomem (pomaleji, ať netrefuje tyče)',at:{x:X(1100)+1.4,z:Z(830)+2},t:6,dog:'jackie',an:'slalom',need:'slalom'},
  {l:'Ashley po kladině',at:{x:X(990),z:Z(1050)+1.3},t:6,dog:'ashley',an:'beam',need:'beam'},
  {l:'Jackie po kladině – finále',at:{x:X(990),z:Z(1050)+1.3},t:6,dog:'jackie',an:'beam',need:'beam'}],
 simon:[
  {l:'Vyměň přední levé kolo',at:ca(-1.25,1.17),t:2,s:'screw'},
  {l:'Vyměň zadní levé kolo',at:ca(-1.25,-1.17),t:2,s:'screw'},
  {l:'Vyměň obě pravá kola',at:ca(1.25,0),t:2.6,s:'hammerdrill'},
  {l:'Přines nový nárazník ze stohu na vrakovišti',at:{x:X(232),z:Z(526)},t:1.4,s:'crate'},
  {l:'Namontuj nárazník na předek auta',at:ca(0,2.4),t:2.2,s:'screw',done:()=>{const m=new THREE.Mesh(BOX,M(0xd8dde2));m.scale.set(1.8,.2,.16);m.position.set(0,.45,2.02);m.castShadow=true;carG.add(m)}},
  {l:'Vyměň olej (lehni si k autu)',at:ca(1.2,1),t:2.6,s:'click'},
  {l:'Vyleštěni karoserie',at:ca(-1.25,0),t:2.8,s:'click'},
  {l:'Zkušební start motoru',at:ca(-1.25,-.3),t:1.5,s:'hammerdrill'}]};
const TI={pavel:0,simon:0,tereza:0};let tWork=0;
function curTask(){
  const p=P(),who=p===pavel?'pavel':p===simon?'simon':p===tereza?'tereza':null;
  if(!who||inside||ctrl)return null;if(who==='simon'&&job<jobs.length)return null;
  const t=TASKS[who][TI[who]];if(t&&t.need&&!obst[t.need])return null;if(t&&t.dog){const d=t.dog==='ashley'?ashley:jackie;if(d.atHome)return null}return t?{who,t}:null;
}
function startTask(){
  const ct=curTask();if(!ct||tWork>0)return;const t=ct.t;
  if(t.tool&&!(tool.held&&tool.id&&holder===P()&&t.tool.includes(tool.id.replace('_p','')))){toast('Na tohle potřebuješ v ruce: '+t.tool.map(i=>TOOLS.find(x=>x[0]===i)[1]).join(' / ')+'. Nářadí je v dílně.');return}
  tWork=t.t;tWho=ct.who;if(t.dog){const d=t.dog==='ashley'?ashley:jackie;d.train={an:t.an,u:0,at:t.at};play('bark_collie',.5)}
}
let tWho=null;
function endTrain(){for(const d of [ashley,jackie])if(d.train){d.train=null;d.y=groundAt(d.x,d.z,0,.62);d.vy=0;d.tx=d.x;d.tz=d.z;d.mode='wander'}}
// animace tréninku – pes nejdřív doběhne na start, pak jede přesně po trati (bez kolizí)
function kin(d,x,y,z,hd,dt,run){d.x=x;d.z=z;d.y=y;d.vy=0;d.head=hd;d.moving=run?1:0;d.phase+=dt*(run?14:0);d.obj.position.set(x,y+(run&&y<.05?Math.abs(Math.sin(d.phase))*.07:0),z);d.obj.rotation.set(0,hd,0)}
function trainTick(d,dt,t){
  const tr=d.train,T=tereza;tr.u+=dt;const tri=(u,per)=>{const f=(u/per)%2;return f<1?f:2-f};
  if(tr.an==='sit'||tr.an==='down'){const fx=T.x+Math.sin(T.head)*1,fz=T.z+Math.cos(T.head)*1;
    if(!tr.ok){if(goTo(d,fx,fz,d.speed,dt,.25))tr.ok=1;return}
    const hd=Math.atan2(T.x-d.x,T.z-d.z);kin(d,d.x,tr.an==='down'?-.08:0,d.z,hd,dt,0);d.obj.rotation.x=tr.an==='sit'?-.45:0;return}
  if(tr.an==='recall'){const ax=T.x+Math.sin(T.head)*7,az=T.z+Math.cos(T.head)*7;
    if(tr.u<1.8||!tr.out){if(goTo(d,ax,az,d.speed,dt,.4))tr.out=1;if(tr.u<1.8)return}
    if(!tr.out)return;if(!tr.call){tr.call=1;play('bark_collie',.45)}goTo(d,T.x+Math.sin(T.head)*.8,T.z+Math.cos(T.head)*.8,d.speed*1.3,dt,.3);return}
  let x0,z0,pos;
  if(tr.an==='jump'){x0=X(1000);z0=Z(880);pos=u=>{const k=tri(u,1.6),z=z0-2.6+k*5.2,dz=z-z0;return[x0,Math.abs(dz)<.75?.85*(1-(dz/.75)**2):0,z]}}
  if(tr.an==='slalom'){x0=X(1100);z0=Z(830);pos=u=>{const k=tri(u,2.6),z=z0-1+k*6;return[x0+.42*Math.cos(Math.PI*(z-z0)/.8),0,z]}}
  if(tr.an==='beam'){x0=X(990);z0=Z(1050);pos=u=>{const k=tri(u,3),x=x0-2.9+k*5.8,dx=Math.abs(x-x0);return[x,dx<1.5?.66:Math.max(0,.66*(2.85-dx)/1.35),z0]}}
  if(!tr.ok){const s=pos(0);if(goTo(d,s[0],s[2],d.speed,dt,.3)){tr.ok=1;tr.u=0}return}
  const a=pos(tr.u),b=pos(tr.u+.05);kin(d,a[0],a[1],a[2],Math.atan2(b[0]-a[0],b[2]-a[2]),dt,1);
  if(tr.an==='jump'&&a[1]>.6&&!tr.j){tr.j=1;play('bark_collie',.35,900)}if(a[1]<.1)tr.j=0;
}
function taskTick(dt){
  if(tWork<=0)return;
  const ct=curTask();if(!ct||ct.who!==tWho){tWork=0;endTrain();return}
  const p=P(),t=ct.t;
  if(Math.hypot(p.x-t.at.x,p.z-t.at.z)>(t.dog?3:1.8)){tWork=0;endTrain();toast(t.dog?'Trénink přerušen – pes utekl.':'Práce přerušena.');return}
  if(t.s)play(t.s,.55,700);tWork-=dt;
  if(tool.held&&ct.who==='pavel'){armR.rotation.z=.1+Math.sin(tWork*30)*.1}
  if(tWork<=0){tWork=0;endTrain();if(t.done)t.done();TI[ct.who]++;const n=TASKS[ct.who][TI[ct.who]];
    toast(n?(t.dog?'Hodná holka! ':'Hotovo! ')+'Další: '+n.l:ct.who==='pavel'?'Všechny překážky jsou hotové! Psi mají cvičiště.':ct.who==='tereza'?'Ashley a Jackie zvládly celý parkur. Mistryně agility!':'Simon má zakázku hotovou. Auto je jak nové.')}
}

const people=[pavel,tereza,simon];
const ORDER=[0,2,1];
ashley.name='Ashley';jackie.name='Jackie';boban.name='Boban';                       // přepínání Q: Pavel → Simon → Tereza
let act=0,ctrl=null,nkA=null,guest=null;const P=()=>guest||ctrl||people[act];

// ---------- vstup ----------
let viewFirst=null;let paused=false;
const keys={};
addEventListener('keydown',e=>{
  if(e.code==='Escape'&&started&&listOpen()){e.preventDefault();closeList();return}
  if(e.code==='Escape'&&started&&BIG.style.display!=='none'){e.preventDefault();toggleBigMap();return}
  if(e.code==='Escape'&&started){e.preventDefault();if(!e.repeat)pauseGame(!paused);return}
  if(paused)return;
  if(e.code==='KeyI'&&started&&!DRV.on&&!ctrl&&!listOpen()){if(guest){guest=null;toast('Zpátky u hlavní postavy.');return}
    const locals=inside?room==='flat'?[lubos]:room==='vlcek'?[lubos,dadOut]:room==='hdum'?[window.__parents.mom,window.__parents.dad]:room==='granny'?[window.__grannyInside]:[]:[dadOut,yardMom,babicka,milan,smerda,lubos,MAIL.courier,thief,...PEDS];
    const near=locals.map(a=>{if(a.obj)return a;return {obj:a,x:a.position.x,y:0,z:a.position.z,head:a.rotation.y,r:.28,speed:2,moving:0,phase:0}}).filter(a=>a.obj.visible&&Math.hypot(a.x-P().x,a.z-P().z)<2.6).sort((a,b)=>Math.hypot(a.x-P().x,a.z-P().z)-Math.hypot(b.x-P().x,b.z-P().z));guest=near[0]||null;toast(guest?'WASD · chůze, I · vrátit se':'Přijď blíž k postavě.');return}
  if(guest&&!['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code))return;
  if(e.code==='ArrowUp'&&started&&!MINI.on){e.preventDefault();if(!e.repeat&&!listOpen())phoneHome();return}
  if(e.code==='Space'&&started&&!inside&&!DRV.on&&!ctrl&&!MINI.on&&!e.repeat&&Math.abs(P().vy||0)<.01){P().vy=5.4}
  if(MINI.on&&(e.code==='Space'||e.code==='KeyE')){e.preventDefault();keys[e.code]=true;if(!e.repeat)miniHit();return}
  if(listOpen()&&(e.code==='KeyE'||e.code==='KeyK')){closeList();return}
  keys[e.code]=true;
  if(e.code==='KeyE'){if($('tools').classList.contains('on'))closeTools();else use()}
  if(e.code==='KeyK'&&started&&!e.repeat)showJobs();
  if(e.code==='KeyL'&&started&&!e.repeat&&!DRV.on&&!inside)toggleLeash();
  if(e.code==='KeyO'&&started&&!e.repeat){setQuality((GFX.q+2)%3);toast('Grafika: '+['nízká (rychlá)','střední','vysoká'][GFX.q]+' · O přepíná')}
  if(e.code==='KeyV'&&started&&!e.repeat&&!DRV.on){viewFirst=!(viewFirst??inside);toast(viewFirst?'Pohled z první osoby':'Pohled ze třetí osoby')}
  if(e.code==='KeyV'&&started&&!e.repeat&&DRV.on&&['stolen','stolenPolice'].includes(DRV.car.kind)){if(Math.hypot(DRV.car.g.position.x-golf.position.x,DRV.car.g.position.z-golf.position.z)<10&&SIM.state==='work')sellToSimon();else toast('Kradené auto prodáš Simonovi – přijeď s ním před garáž (V).')}
  
  if(e.code==='KeyP'&&!e.repeat&&started&&!inside&&!DRV.on){
 const dog=[boban,jackie,ashley].filter(a=>a.obj.visible&&Math.hypot(a.x-P().x,a.z-P().z)<2).sort((a,b)=>Math.hypot(a.x-P().x,a.z-P().z)-Math.hypot(b.x-P().x,b.z-P().z))[0];const cs=charState();
 if(!dog)toast('Přijď blíž ke psovi.');else if(!(cs.treats>0))toast('Pamlsky koupíš v Lidlu.');else{cs.treats--;dog.petted=true;dog.angry=0;play('chew',.4);saveGame(true);toast(dog.name+' dostal pamlsek a vrtí ocasem.')}
 }
 if(e.code==='KeyT')sockOn();
  if(e.code==='KeyB'&&started&&!e.repeat)dropHeld();
  if(e.code==='KeyY'&&started&&DRV.on&&!e.repeat){const i=RADIO.findIndex(r=>r[0]===DRV.radio);const n=RADIO[(i+1)%(RADIO.length+1)];play('radio',.4);DRV.radio=n?n[0]:null;toast(n?'Rádio: '+n[1]:'Rádio vypnuto')}
  if(e.code==='KeyH'&&started&&DRV.on&&!e.repeat)play('horn',.6);
  if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&sitting){standUp();toast('Vstal jsi.')}
  if(e.code==='KeyJ'&&started){DAY.t=night>.5?.3:.735;toast(night>.5?'Přeskočeno na ráno.':'Přeskočeno na večer (17:38).')}
  if(e.code==='KeyF'&&started&&!e.repeat&&!listOpen()){
    if(DRV.on){exitCar();return}
    if(cur?.car){enterCar(cur.car);return}
    if(P()===pavel&&lubos.obj.visible&&Math.hypot(P().x-lubos.x,P().z-lubos.z)<2&&(room==='flat'||!inside&&Math.hypot(lubos.x-X(900),lubos.z-Z(307))<3)){
      hardware.kickedDay=DAY.n;lubos.obj.visible=false;pavel.obj.userData.kick=.35;play('kick',.5);saveGame(true);toast('Luboš: Au, nemlať mě! Dneska už mě tu neuvidíš.');return}
    if(cur&&cur.jackie)shooJackie();else kickBoban()}
  if(e.code==='KeyG')useTool();
  if(e.code==='KeyN'&&started){MUS.on=!MUS.on;toast(MUS.on?'Hudba zapnutá':'Hudba vypnutá')}
  if(e.code==='KeyM'&&started&&!e.repeat)toggleBigMap();
  if(e.code==='KeyR'&&started){const p=P();if(inside)unstuck(p);else{p.x=X(900);p.z=Z(470);p.y=0;p.vy=0}toast('Postava vrácena.')}
  if(e.code==='KeyQ'||e.code==='Tab'){e.preventDefault();swap()}
  if(e.code==='KeyX')xSwitch();
});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
let yaw=.6,pitch=.38,dist=5.5,drag=null;
let lastLook=-9;
const locked=()=>document.pointerLockElement===canvas;
canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&started&&!locked()){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(_){}}
  drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
document.addEventListener('mousemove',e=>{if(MINI.on&&MINI.mode==='stroke'){const sg=Math.sign(e.movementX);if(sg&&sg!==MINI.lastSign&&Math.abs(e.movementX)>4){MINI.lastSign=sg;MINI.prog+=.04*workMul();MINI.hits=Math.floor(MINI.prog*MINI.need);if(MINI.prog>=1){MINI.on=false;$('mini').classList.remove('on');const cb=MINI.cb;MINI.cb=null;cb&&cb(0)}}return}if(!locked())return;yaw-=e.movementX*.0025;pitch=Math.max(.05,Math.min(1.2,pitch+e.movementY*.002));lastLook=elapsed});
document.addEventListener('pointerlockchange',()=>{$('lockhint').classList.toggle('on',started&&!locked()&&matchMedia('(pointer:fine)').matches)});
canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId||locked())return;lastLook=elapsed;
  yaw-=(e.clientX-drag.x)*.006;pitch=Math.max(.08,Math.min(1.25,pitch+(e.clientY-drag.y)*.004));drag.x=e.clientX;drag.y=e.clientY});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(3,Math.min(10,dist+e.deltaY*.005))},{passive:false});
// joystick
const joy=$('joy'),knob=$('knob');let jx=0,jz=0,jid=null;
function joyMove(e){const r=joy.getBoundingClientRect();let dx=(e.clientX-r.left-r.width/2)/(r.width/2),dy=(e.clientY-r.top-r.height/2)/(r.height/2);
  const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l}jx=dx;jz=dy;knob.style.transform=`translate(${dx*38}px,${dy*38}px)`}
joy.addEventListener('pointerdown',e=>{jid=e.pointerId;joy.setPointerCapture(jid);joyMove(e)});
joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)joyMove(e)});
const joyEnd=()=>{jid=null;jx=jz=0;knob.style.transform=''};
joy.addEventListener('pointerup',joyEnd);joy.addEventListener('pointercancel',joyEnd);
const tapAction=()=>guest?undefined:cur?.car?enterCar(cur.car):use();$('buse').addEventListener('click',tapAction);$('prompt').addEventListener('click',tapAction);
$('bswitch').addEventListener('click',swap);
$('bx').addEventListener('click',()=>xSwitch());

function nextActor(){
  const k=ORDER.indexOf(act);
  for(let n=1;n<ORDER.length;n++){const i=ORDER[(k+n)%ORDER.length];if(!people[i].asleep)return i}
  return act;
}
// ---------- hraní za zvířata: z Terezy klávesou X na Ashley, pak na Nikíska (když je poblíž) ----------
function setCtrl(a){
  const old=ctrl;
  if(old===nkA&&nkA){NK.state='off';NK.t=20;nikisek.visible=false}
  if(old===ashley){ashley.mode='wander';ashley.tx=ashley.x;ashley.tz=ashley.z}
  if(a==='nk'){
    if(!nkA)nkA=agent(nikisek,0,0,{name:'Nikísek',speed:3.8,r:.18,reach:.32,dog:1,stepH:.62});
    nkA.x=nikisek.position.x;nkA.z=nikisek.position.z;nkA.y=nikisek.position.y;nkA.vy=0;nkA.head=nikisek.rotation.y;
    NK.state='ctrl';nikisek.visible=true;a=nkA;
  }
  ctrl=a||null;cur=null;play('click',.5);
  $('who').textContent=P().name;camT.set(P().x,P().y+1,P().z);
  toast(ctrl?'Hraješ za '+P().name+'. X = další / zpět na Terezu.':'Hraješ zase za Terezu.');
}
function xSwitch(){
  if(!started||paused)return;
  if(inside){toast('Za zvířata se dá hrát jen venku.');return}
  if(!ctrl){
    if(people[act]!==tereza){toast('Za zvířata se přepínáš z Terezy (X).');return}
    if(!ashley.obj.visible){toast('Ashley už spí doma.');return}
    setCtrl(ashley);return}
  if(ctrl===ashley&&nikisek.visible&&NK.state!=='chase'&&Math.hypot(nikisek.position.x-ashley.x,nikisek.position.z-ashley.z)<10){setCtrl('nk');return}
  if(ctrl===ashley)toast('Nikísek není poblíž.');
  setCtrl(null);
}
function animalAction(){
  const p=P();
  if(ctrl===ashley){
    let best=null,bd=1.3;for(const c of crumbs){const d=Math.hypot(c.x-p.x,c.z-p.z);if(d<bd){bd=d;best=c}}
    if(best){scene.remove(best.m);crumbs.splice(crumbs.indexOf(best),1);STATS.eaten++;play('chew',.6);toast('Mňam! Ashley sežrala '+best.name+'.');ashley.obj.userData.head.rotation.x=.5;afterGameTime(()=>ashley.obj.userData.head.rotation.x=0,700)}
    else{play('bark_collie',.6,600);toast('Haf!')}
    return}
  play('meow',.6,600);
  if(Math.hypot(boban.x-p.x,boban.z-p.z)<2&&boban.obj.visible&&!boban.fly){boban.dazed=1.8;toast('Nikísek dal Bobanovi packou. Boban je v šoku.')}
  else toast('Mňau.');
}
function swap(){
  if(!started||paused)return;
  if(DRV.on){toast('Nejdřív vystup z auta (E).');return}
  if(!UNL){toast('Simon a Tereza se odemknou, až Pavel v dílně vyzkouší nářadí (G).');return}
  if(ctrl)setCtrl(null);
  if(inside||$('fade').classList.contains('on')){toast('Postavu můžeš přepnout venku.');return}
  act=nextActor();cur=null;play('click',.5);
  $('who').textContent=P().name;$('bswitch').textContent='↻ '+people[nextActor()].name;
  camT.set(P().x,P().y+1.35,P().z);toast('Hraješ za '+P().name);
}


// ---------- zvuky (soubory v sfx/) ----------
let audioOn=false;
const SFX={};
const effects=new Set();
function snd(n,v,loop=false){const a=new Audio('sfx/'+n+'.mp3');a.volume=v;a.loop=loop;a.preload='auto';a.addEventListener('error',()=>{a.dead=true});SFX[n]=a}
snd('steps_grass',.55,true);snd('steps_paving',.55,true);snd('ambient',.3,true);
['bark_boban','bark_collie','drill','handsaw','circularsaw','screw','hammer','dig','door','click','grinder','jigsaw','hammerdrill','plane','tape','meow','cats','whine','chew','mmmf','kick','crate','growl','seat'].forEach(n=>snd(n,.75));
snd('night',.3,true);
for(const n of ['car_alarm','radio','gate','garage','engine_rev','tires','spray','car_door','glass_break','horn','crash'])snd(n,.6);snd('siren',.45,true);snd('engine_idle',.35,true);snd('welding',.5);   // nové zvuky 2026-11-27
const lastPlay={};
function play(n,v,gap=0){
  const a=SFX[n];if(!audioOn||!a||a.dead)return;
  const now=performance.now();if(gap&&now-(lastPlay[n]||0)<gap)return;lastPlay[n]=now;
  try{const c=a.cloneNode();c.volume=Math.max(0,Math.min(1,v==null?a.volume:v));effects.add(c);c.onended=()=>effects.delete(c);const p=c.play();if(p&&p.catch)p.catch(()=>effects.delete(c))}catch(_){}
}
const distVol=(a,max=.85,range=18)=>{const p=P();return Math.max(0,1-Math.hypot(a.x-p.x,a.z-p.z)/range)*max};
function onHard(a){
  if(a.y>.3)return true;
  const px=a.x/S+OX,py=a.z/S+OY,inR=(x1,y1,x2,y2)=>px>x1&&px<x2&&py>y1&&py<y2;
  return inR(564,1136,1170,1410)||inR(79,1133,558,1420)||inR(765,597,903,1130)||inR(560,447,760,555)||inR(653,257,765,397)||inR(1183,526,1246,1393);
}
function stepsSound(p,run){
  const g=SFX.steps_grass,h=SFX.steps_paving;
  if(!audioOn)return;
  const want=p.moving>.5?(onHard(p)?h:g):null;
  for(const a of [g,h]){
    if(a.dead)continue;
    if(a===want){a.playbackRate=run?1.45:1;if(a.paused){const r=a.play();if(r&&r.catch)r.catch(()=>{})}}
    else if(!a.paused)a.pause();
  }
}
function setAudio(on){
  audioOn=on;
  const amb=SFX.ambient;
  if(on){for(const a of [amb,SFX.night])if(!a.dead){const r=a.play();if(r&&r.catch)r.catch(()=>{})}}
  else for(const k in SFX)SFX[k].pause();
  if(MUS.ctx){if(on)MUS.ctx.resume();else MUS.ctx.suspend()}
}


// ---------- goofy hudba (generovaná v prohlížeči, mění se podle situace) ----------
const MUS={ctx:null,on:true,mood:'yard',pending:null,next:0,stepI:0,mi:5};
const MOODS={
  yard: {bpm:112,root:67,scale:[0,2,4,7,9],bass:[0,7,5,7],lead:'triangle',density:.5,goof:.15,whistle:.4,swing:.14,oompah:1,block:1},
  work: {bpm:124,root:62,scale:[0,2,3,5,7,10],bass:[0,0,3,5],lead:'square',density:.62,goof:.22,whistle:.2,swing:.06,oompah:0,block:1},
  train:{bpm:140,root:69,scale:[0,2,4,5,7,9],bass:[0,5,7,5],lead:'triangle',density:.7,goof:.1,whistle:.5,swing:.1,oompah:1,block:0},
  boban:{bpm:162,root:58,scale:[0,1,4,5,7,8,10],bass:[0,1,0,-1],lead:'square',density:.85,goof:.45,whistle:.65,swing:0,oompah:1,block:1,tuba:1},
  shop: {bpm:142,root:52,scale:[0,3,5,7,10],bass:[0,0,3,5],lead:'square',density:.5,goof:.12,whistle:0,swing:0,oompah:0,block:0,tuba:1,rock:1},
  dark: {bpm:70,root:50,scale:[0,1,3,6,7],bass:[0,0,1,0],lead:'sine',density:.18,goof:.05,whistle:0,swing:.1,oompah:0,block:0},
  hifi: {bpm:100,root:57,scale:[0,3,5,7,10],bass:[0,0,10,7],lead:'square',density:.55,goof:.25,whistle:.3,swing:.18,oompah:0,block:1,tuba:1},
  night:{bpm:88,root:62,scale:[0,2,4,7,9],bass:[0,0,5,7],lead:'sine',density:.32,goof:.1,whistle:.12,swing:.2,oompah:1,block:0},
  calm: {bpm:84,root:60,scale:[0,4,7,11,14],bass:[0,0,9,7],lead:'sine',density:.35,goof:.04,whistle:0,swing:.22,oompah:0,block:0}
};
const mtof=m=>440*Math.pow(2,(m-69)/12);
function musInit(){
  if(MUS.ctx)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  const c=new C();MUS.ctx=c;MUS.master=c.createGain();MUS.master.gain.value=.15;MUS.master.connect(c.destination);
  const b=c.createBuffer(1,c.sampleRate*.3,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;MUS.noise=b;
  MUS.next=c.currentTime+.1;
}
function tone(t,f,dur,type,vol,glide=0,lp=0){
  const c=MUS.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);
  if(glide)o.frequency.exponentialRampToValueAtTime(f*glide,t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  let n=o;if(lp){const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=lp;o.connect(fl);n=fl}
  n.connect(g);g.connect(MUS.master);o.start(t);o.stop(t+dur+.05);
}
function noise(t,dur,vol,hp){const c=MUS.ctx,s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
  s.buffer=MUS.noise;f.type='highpass';f.frequency.value=hp;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);
  s.connect(f);f.connect(g);g.connect(MUS.master);s.start(t);s.stop(t+dur+.02)}
function kick(t){const c=MUS.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);
  g.gain.setValueAtTime(.8,t);g.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(g);g.connect(MUS.master);o.start(t);o.stop(t+.2)}
function musTick(){
  if(!MUS.ctx||!audioOn||!MUS.on)return;
  const c=MUS.ctx;if(c.state==='suspended'){c.resume();return}
  if(MUS.next<c.currentTime-.5)MUS.next=c.currentTime+.05;
  while(MUS.next<c.currentTime+.15){
    const i=MUS.stepI%16,bar=Math.floor(MUS.stepI/16);
    if(i===0&&MUS.pending){MUS.mood=MUS.pending;MUS.pending=null}
    const m=MOODS[MUS.mood],sp=60/m.bpm/4,t=MUS.next+((i%2)?sp*m.swing:0);
    if(i%4===0)kick(t);
    if(i===4||i===12)noise(t,.12,.3,1800);
    if(i%2===1&&Math.random()<.5)noise(t,.03,.1,7000);
    if(m.block&&(i===3||i===11||i===14))tone(t,1300+Math.random()*400,.05,'sine',.22);
    const bn=m.root-24+m.bass[Math.floor(i/4)];
    if(i%4===0)tone(t,mtof(bn),sp*1.8,m.tuba?'sawtooth':'triangle',m.tuba?.35:.5,m.tuba&&Math.random()<.3?.9:0,m.tuba?600:0);
    if(m.rock&&i%4===0){tone(t,mtof(bn+24),sp*1.6,'sawtooth',.12,0,1100);tone(t,mtof(bn+31),sp*1.6,'sawtooth',.1,0,1100)}
    if(i%4===2&&m.oompah)tone(t,mtof(bn+19),sp*.9,'triangle',.18);
    if(Math.random()<m.density&&(i%2===0||Math.random()<.35)){
      MUS.mi=Math.max(0,Math.min(m.scale.length*2-1,MUS.mi+Math.floor(Math.random()*3)-1));
      const n=m.root+Math.floor(MUS.mi/m.scale.length)*12+m.scale[MUS.mi%m.scale.length];
      const gl=Math.random()<m.goof?(Math.random()<.5?1.5:.66):0;
      tone(t,mtof(n),sp*(Math.random()<.3?2.5:1.2),m.lead,m.lead==='square'?.12:.22,gl);
    }
    if(i===14&&bar%2===1&&Math.random()<m.whistle)tone(t,650,sp*2.6,'sine',.16,2.3);
    MUS.next+=sp;MUS.stepI++;
  }
}
function setMood(m){if(m!==MUS.mood&&([m,MUS.mood].some(v=>v==='shop'||v==='hifi'))){MUS.mood=m;MUS.stepI=0;MUS.pending=null;return}if(m!==MUS.mood)MUS.pending=m;else MUS.pending=null}
function pickMood(p){
  if(DRV.on&&DRV.radio)return DRV.radio;
  const px=p.x/S+OX,py=p.z/S+OY;
  if(room==='flat'&&!ECO.elec)return 'dark';
  if(inside&&MUS.hifi)return 'hifi';
  if(room==='shop')return 'shop';
  if(inside)return 'calm';
  if(boban.muted>0)return 'calm';
  if(boban.angry>0||boban.mode==='steal'||boban.fly||(jackie.mode==='chase'&&Math.hypot(jackie.x-p.x,jackie.z-p.z)<8))return 'boban';
  if(act===0&&px>630&&px<1030&&py>240&&py<560)return 'work';
  if(act===1&&px>915&&px<1170&&py>790&&py<1130)return 'train';
  if(night>.6)return 'night';
  return 'yard';
}

// ---------- interakce ----------
const spots=[
  {get x(){return ca(0,2.55).x},get z(){return ca(0,2.55).z},r:1.5,get label(){return jobs[job]||'Hotové auto'},who:2,act:()=>job===jobs.length?toast('Tuning dokončen.'):workOnCar()},
  {x:X(486),z:Z(53)+1.4,r:2.4,get label(){return GATE.open?'Zavřít bránu':'Otevřít bránu'},who:-1,act:()=>toggleGate()},
  {x:X(486),z:Z(43)-1.4,r:2.4,get label(){return GATE.open?'Zavřít bránu':'Otevřít bránu'},who:-1,act:()=>toggleGate()},
  {x:X(60),z:Z(-82)+1.3,r:2,get label(){return window.__GAR.open?'Zavřít garáž':'Otevřít garáž'},who:-1,act:()=>toggleGarage()},
  {x:X(60),z:Z(-82)-1.3,r:1.6,get label(){return window.__GAR.open?'Zavřít garáž':'Otevřít garáž'},who:-1,act:()=>toggleGarage()},
  {x:X(900),z:Z(307)+.9,r:1.8,label:'Vstoupit do dílny',who:-1,snd:'door',act:()=>enterShop()},
  {in:1,x:IX-.52,z:IZ+ID/2-.45,r:.77,label:'Vložit fotku zaměstnance měsíce',who:-1,act:()=>$('portraitFile').click()},
  {in:1,x:IX-2,z:IZ+ID/2-.8,r:1.1,label:'Odejít na dvorek',who:-1,snd:'door',act:()=>exitRoom()},
  {in:1,x:IX-IW/2+1.3,z:IZ-.3,r:1.5,label:'Vybrat nářadí ze stěny',who:-1,act:()=>openTools()},
  {in:1,x:IX+1+.15,z:IZ+ID/2-1.3,r:1.1,label:'Pracovat u stolu 1',who:0,snd:'drill',msg:'Stůl 1: minihry (řezání, vrtání, šroubování) přijdou v další verzi.'},
  {in:1,x:IX-.88,z:IZ-ID/2+1.2,r:.48,label:'Sednout si (Jeep Cherokee)',who:-1,act:()=>sitSeat(0)},
  {in:1,x:IX-.3,z:IZ-ID/2+1.2,r:.48,label:'Sednout si (Jeep Cherokee)',who:-1,act:()=>sitSeat(1)},
  {in:1,x:IX+.28,z:IZ-ID/2+1.2,r:.48,label:'Sednout si (Jeep Cherokee)',who:-1,act:()=>sitSeat(2)},
  {in:1,x:IX+IW/2-1.3,z:IZ-.65,r:1,label:'Pustit hifi (repráky v rozích)',who:-1,act:()=>{MUS.hifi=!MUS.hifi;play('click');toast(MUS.hifi?'Hifi jede ze všech čtyř rohů.':'Hifi vypnuté.')}},
  {in:1,x:IX-.75,z:IZ+ID/2-.8,r:1.2,label:'Prohlédnout SPZ',who:-1,msg:'Sbírka SPZ: české i z Ameriky. „BUBU 1“ je nejcennější.'},
  {in:2,x:FX+1.8,z:FZ+FD/2-.8,r:1.1,label:'Odejít na dvorek',who:-1,snd:'door',act:()=>exitRoom()},
  {in:2,x:FX-FW/2+.7,z:FZ-1.2,r:1.1,get label(){return ECO.elec?'Rozvodnice (hotovo)':ECO.mat_elec?'Opravit elektriku':'Rozvodnice'},who:-1,snd:'click',act:()=>{if(ECO.elec){toast('Jističe drží. Pavel je elektrikář roku.');return}if(!ECO.mat_elec){toast('Jističe vyhozené, dráty trčí ze zdi. Potřebuješ kabely a jističe z Elkovu (1 200 Kč).');return}if(P()!==pavel){toast('Elektriku dělá Pavel.');return}
    miniStart('Zapojuješ elektriku – opatrně!',6,(miss)=>{if(miss>3){energy(-15);toast('Prásk! Kopla tě elektrika. Zkus to znovu.');return}ECO.elec=1;RM.flat.L=.9;toast('Světlo svítí! Pavlův byt má konečně elektriku.')},'hold')}},
  {in:2,x:FX+FW/2-1.1,z:FZ-FD/2+1.4,r:1.2,label:'Matrace – vyspat se (Pavel)',who:-1,act:()=>sleepHere(pavel,'na matraci'),get msg(){return ECO.elec?'Matrace na zemi. Světlo už je, teď by to chtělo postel.':'Matrace na zemi. Zatím se spí tady, dokud nebude světlo.'}},
  {x:X(609),z:Z(1250),r:2.2,label:'Mámina zahrádka',who:-1,msg:'Mámina zahrádka. Boban ji očůrává a Ashley ji vykopává.'},
  {x:X(1028)-.7,z:flatDoorZ,r:1.3,label:'Vstoupit do Pavlova bytu (nesvítí – elektrika v procesu)',who:-1,snd:'door',act:()=>enterFlat()},
  {x:X(113),z:Z(1384),r:1.5,label:'Vstoupit do hlavního domu',who:-1,snd:'door',act:()=>enterRoom('hdum','Hlavní dům – kuchyň.')},
  {x:X(990),z:Z(1425)-.8,r:1.6,label:'Babička',who:-1,snd:'door',act:()=>enterRoom('granny')},
  {x:X(80),z:Z(1640)+.8,r:1.2,label:'Vstoupit do hlavního domu (z ulice)',who:-1,snd:'door',act:()=>enterRoom('hdumStreet','Hlavní dům – vstup z ulice.')},
  {x:X(72)+.9,z:Z(332),r:1.4,label:'Vylézt po žebříku do skladu dílů',who:-1,snd:'click',act:()=>enterRoom('sklad','Sklad dílů. Vyber si díl (E) – volanty, sedačky, nárazníky, skla, zrcátka…')},
  {x:X(100)+.8,z:Z(1330),r:1.4,label:'Vstoupit do hlavního domu',who:-1,snd:'door',act:()=>enterRoom('hdumPerg','Hlavní dům – vstupní část pod pergolou.')},
  {x:X(658)+.6,z:Z(610),r:1.1,label:'Vstoupit do Bytu 2',who:-1,snd:'door',act:()=>enterRoom('byt2','Byt 2 – prádelna. Dál jsou sklady a na konci dveře na Masarykovu.')},
  {x:X(62)-.7,z:Z(620),r:1.3,label:'Vstoupit do skladů (Byt 2)',who:-1,snd:'door',act:()=>enterRoom('street','Sklady Bytu 2. Prádelna je na druhém konci.')},
  {in:'byt2',x:RM.byt2.cx+RM.byt2.w/2-.6,z:RM.byt2.cz+.9,r:1.1,label:'Odejít na dvorek',who:-1,snd:'door',act:()=>exitRoom()},
  {in:'byt2',x:RM.byt2.cx-RM.byt2.w/2+.6,z:RM.byt2.cz,r:1.1,label:'Vyjít na Masarykovu',who:-1,snd:'door',act:()=>exitRoom('street')},
  {in:'byt2',x:RM.byt2.cx+RM.byt2.w/2-1.4,z:RM.byt2.cz+RM.byt2.d/2-.6,r:.9,label:'Dveře k Ukrajincům',who:-1,snd:'click',msg:'Zamčeno. Tady bydlí Ukrajinci – tam se nechodí.'},
  {in:'byt2',x:RM.byt2.cx+RM.byt2.w/2-2.5,z:RM.byt2.cz-1.1,r:1,label:'Pračky',who:-1,snd:'click',msg:'Pračka zrovna ždímá. Celý barák se třese.'},
  {in:'byt1',x:RM.byt1.cx+RM.byt1.w/2-.6,z:RM.byt1.cz,r:1.1,label:'Odejít na dvorek',who:-1,snd:'door',act:()=>exitRoom()},
  {in:'byt1',x:160-5+2.8,z:-3+4.9,r:1.1,label:'Postel – vyspat se (Tereza)',who:-1,act:()=>sleepHere(tereza,'v posteli')},
  {in:'byt1',x:160-5+8.9,z:-3+4.7,r:1,label:'Televize',who:-1,snd:'click',msg:'V televizi běží záznam z agility závodů. Ashley štěká na obrazovku.'},
  {in:'byt1',x:160-5+7.9,z:-3+1.7,r:1.1,label:'Pelíšky psů',who:-1,msg:'Pelíšky Ashley a Jackie. V Ashleyině je schovaná ukradená ponožka.'},
  {in:'byt1',x:160-5+9.2,z:-3+.9,r:.9,label:'Poháry z agility',who:-1,msg:'Poháry z agility. Většinu vyhrála Ashley, jeden Jackie za nejhezčí účes.'},
  {in:'byt1',x:160-5+4.6,z:-3+1.1,r:1.2,label:'Kuchyň',who:-1,msg:'Kuchyň. Na lince leží pamlsky – Ashley o nich ví.'},
  {in:'byt1',x:160-5+2.2,z:-3+1.3,r:1,label:'Koupelna',who:-1,msg:'Koupelna se sprchou. Psí ručníky všude.'},
  {in:'byt1',x:160-5+9,z:-3+1.9,r:.9,label:'Milanův koš na dřevo',who:-1,msg:'Milanův koš na dřevo. Večer z něj nosí do hlavního domu.'},
  {in:'hdum',x:181+2.45,z:-2.7+.9,r:1,label:'Odejít na dvorek',who:-1,snd:'door',act:()=>exitRoom()},
  {in:'hdum',x:181+1.15,z:-2.7-7.3+4.9,r:1,label:'Vyjít pod pergolu',who:-1,snd:'door',act:()=>exitRoom('pergola')},
  {in:'hdum',x:181+1.1,z:2.7-.55,r:1,label:'Vyjít na ulici (Krátká)',who:-1,snd:'door',act:()=>exitRoom('kratka')},
  {in:'hdum',x:181+4.4,z:-2.7+1.6,r:1.3,get hidden(){return !window.__momKitchen.visible},label:'Máma u sporáku',who:-1,act:()=>{if(ECO.momFood!==DAY.n){ECO.momFood=DAY.n;energy(40);toast('Máma: Tady máš guláš. Ty boty od oleje si příště zuj venku!')}else toast(pick(['Máma: Zavři dveře, topíme ven!','Máma: Kdo mi zase nechal šroubky ve dřezu?!']))}},
  {in:'hdum',x:181+5.2,z:-2.7+3,r:1.2,label:'Táta · placené úkoly',get hidden(){return !window.__parents.dad.visible},who:0,act:()=>{if(hardware.dadGiftDay!==DAY.n){hardware.dadGiftDay=DAY.n;if(Math.random()<.4){const n=50+50*Math.floor(Math.random()*5);money(n,'Táta: Tady máš '+n+' korun na benzín.')}saveGame(true)}showJobs('Táta')}},
  {in:'hdum',x:181+1,z:-2.7+.6,r:.9,label:'Pavlův pokoj',who:-1,msg:'Pavlův pokoj v hlavním domě. Pořád tu má postel z dětství.'},
  {in:'hdum',x:181+1.2,z:-2.7+3,r:1.2,label:'Počítač · Lidl e-shop',who:0,act:officeShop},
  {in:'hdum',x:181+7.6,z:-2.7+1.2,r:.9,label:'WC a vana',who:-1,msg:'Koupelna s vanou. Zabráno.'},
  {in:'hdum',x:181+7.7,z:-2.7+2.75,r:.8,label:'Pračka',who:-1,snd:'click',msg:'Pračka. Zase v ní je Bobanova deka.'},
  {in:'hdum',x:181+7.45,z:-2.7+4.5,r:.9,label:'Ložnice',who:-1,msg:'Ložnice. Tady se nesahá na nic.'},
  {in:'sklad',x:RM.sklad.cx+RM.sklad.w/2-.9,z:RM.sklad.cz,r:.9,label:'Slézt po žebříku',who:-1,snd:'click',act:()=>exitRoom()},
  {x:X(658)+.6,z:Z(1090),r:1.1,label:'Vstoupit do Bytu 1',who:-1,snd:'door',act:()=>enterRoom('byt1')},
  {x:X(1030)-.6,z:Z(700),r:1.2,label:'Vlézt do červeného domečku',who:-1,snd:'door',act:()=>enterRoom('domek','Tma, pavučiny a rozbité okno. Něco tu šustí.')},
  {in:'domek',x:RM.domek.cx+RM.domek.w/2-.5,z:RM.domek.cz,r:.8,label:'Vylézt ven',who:-1,snd:'door',act:()=>exitRoom()},
  {in:'domek',x:RM.domek.cx-RM.domek.w/2+.7,z:RM.domek.cz-RM.domek.d/2+.6,r:.9,label:'Pavouk!',who:-1,act:()=>{play('click',.5);toast(pick(['Fuj! Pavouk velký jak dlaň. Utekl za prkno.','Pavouk se na tebe dívá osmi očima. Ty na něj dvěma.','Sáhl jsi do pavučiny. Celý den ji budeš cítit na obličeji.']))}},
  {in:'domek',x:RM.domek.cx-.9,z:RM.domek.cz+.9,r:.7,get label(){return ECO.treasure?'Prázdná skrýš':'Uvolněné prkno v podlaze'},who:-1,act:()=>{if(ECO.treasure){toast('Tady už nic není.');return}ECO.treasure=true;play('crate',.6);money(1500,'Pod prknem byla plechovka od sušenek. Uvnitř 1 500 Kč v mincích a stará fotka. Kdo to tu schoval?')}},
  {in:'domek',x:RM.domek.cx,z:RM.domek.cz-RM.domek.d/2+.6,r:.8,label:'Rozbité okno',who:-1,msg:'Rozbité okno. Na zemi střepy – dávej bacha, kam šlapeš.'}
];
let cur=null;
function nearest(){
  const p=P();let best=null,bd=1e9;
  {const ct=curTask();if(ct){const d=Math.hypot(ct.t.at.x-p.x,ct.t.at.z-p.z);if(d<1.6){best={task:true,label:ct.t.l};bd=d}}}
  if(ctrl){if(ctrl===ashley){let nb=null,nd=1.3;for(const c of crumbs){const d=Math.hypot(c.x-p.x,c.z-p.z);if(d<nd){nd=d;nb=c}}return {animal:true,label:nb?'Sežrat '+nb.name:'Štěknout'}}return {animal:true,label:Math.hypot(boban.x-p.x,boban.z-p.z)<2?'Dát Bobanovi packou':'Mňouknout'}}
  const db=Math.hypot(boban.x-p.x,boban.z-p.z);
  if(db<1.6&&!boban.fly&&boban.obj.visible){best={boban:true,label:boban.mode==='steal'?'Vzít Bobanovi nářadí':'Odkopnout Bobana (F) · T = ponožka'};bd=db}
  if(!inside&&(ashley.mode==='eat'||ashley.mode==='sniff')){const da=Math.hypot(ashley.x-p.x,ashley.z-p.z);if(da<1.6&&da<bd){best={ashley:true,label:'Ashley, pusť to!'};bd=da}}
  if(DRV.on&&atPump(DRV.car))return {label:'Stojan · tankovat / kanystr / vystoupit'};
  if(DRV.on)return {label:DRV.car===babetta?'Sesednout z Babety':'Vystoupit z auta'};
  for(const g of onGround){if((g.room||0)!==(room||0))continue;const d=Math.hypot(g.x-p.x,g.z-p.z);if(d<1.2&&d<bd){best={ground:g,label:'Zvednout: '+g.name};bd=d}}
  const nearBus=!inside&&BUS.wait>0&&Math.hypot(BUS.g.position.x-p.x,BUS.g.position.z-p.z)<7.5;
  if(!inside&&!ctrl&&!best&&!nearBus){let nc=null,nd=2.8;for(const c of VEH){if(!c.g.visible)continue;const d=Math.hypot(c.g.position.x-p.x,c.g.position.z-p.z);if(d<nd){nd=d;nc=c}}
    if(nc){const L=familyCars.includes(nc)?nc.name+' · nastoupit':{babetta:!bikeAllowed()?'Pavlova Babetta 210':babetta.fuel<100&&charState().fuelCans>0?'Babeta · dolít benzín / nasednout':babetta.fuel<=0?'Babeta · prázdná nádrž':babetta.range<=0?'Opravit Babetu 210':'Nasednout na modrou Babetu 210',own:'Nastoupit do auta (z našeho placu)',simon:carry?'Položit '+(carry&&carry.name)+' k autu':'Nastoupit do auta',golf:P()===simon?'Nastoupit do Golfu':'Ukrást Simonovi Golf',wreck:'Vrak',parked:'Ukrást auto (rozbít okýnko)',traffic:'Vyhodit řidiče a ukrást auto',police:'Ukrást policejní auto',stolen:'Nastoupit do auta',stolenPolice:'Nastoupit do policejního auta',tractor:'Ukrást traktor John Deere',abandoned:'Nastoupit do opuštěného auta'}[nc.kind];
      best=nc.kind==='simon'&&carry?{carry:true,label:L}:{car:nc,label:L};bd=nd}}
  if(thief.obj.visible&&!inside&&['go','steal','back'].includes(TH.state)){const dt2=Math.hypot(thief.x-p.x,thief.z-p.z);if(dt2<1.9&&dt2<bd){best={thief:true,label:'Vyhnat zloděje!'};bd=dt2}}
  if(milan.obj.visible&&!inside){const dm=Math.hypot(milan.x-p.x,milan.z-p.z);if(dm<1.6&&dm<bd){best={milan:true,label:'Pozdravit Milana'};bd=dm}}
  if(jackie.mode==='cuddle'){const dj=Math.hypot(jackie.x-p.x,jackie.z-p.z);if(dj<1.6&&dj<bd){best={jackie:true,label:'Pomazlit Jackie (E) · F = odehnat'};bd=dj}}
  if(!inside&&!ctrl&&!DRV.on){for(const a of PEDS){if(a.hit>0)continue;const d=Math.hypot(a.x-p.x,a.z-p.z);if(d<1.5&&d<bd){bd=d;best={ped:a,label:'Mluvit s člověkem'}}}}
  if(!inside){for(const h of people){if(h===p||!h.obj.visible||h.asleep)continue;
    const d=Math.hypot(h.x-p.x,h.z-p.z);if(d<1.65&&d<bd){bd=d;best={lender:h,label:h.name+' · půjčky'}}}}
  const rid=room==='shop'?1:room==='flat'?2:(room||0);
  for(const s of spots){if((s.in||0)!==rid||s.hidden)continue;const d=Math.hypot(s.x-p.x,s.z-p.z);if(d<s.r&&d<bd){bd=d;best=s}}
  return best;
}
const bobanLines=['Boban odběhl… a už je zase zpátky.','Boban tě ignoruje a štěká ještě víc.','Nejde to. Boban je tu doma.','Boban si lehl na záda. Prohrál jsi.'];
// ================= EKONOMIKA, OBCHODY, ZAKÁZKY, ŽIVOT VE MĚSTĚ (Claude) =================
const ECO={get money(){return charState().money},set money(v){charState().money=v},get energy(){return charState().energy},set energy(v){charState().energy=v},buff:0,owned:new Set(['hammer','handsaw','screwdriver','tape','welder']),built:new Set(),babFood:-1,job:null,offers:[],offerDay:-1};
const fmtK=n=>Math.round(n).toLocaleString('cs-CZ').replace(/\s/g,' ')+' Kč';
function hudEco(){const m=$('money'),e=$('energy');if(m){const t=fmtK(ECO.money);if(m.textContent!==t)m.textContent=t;m.classList.toggle('neg',ECO.money<0)}
  if(e){const t='⚡ '+Math.round(ECO.energy)+(charState().fuelCans?' · ⛽ '+charState().fuelCans+'× kanystr':'')+(ECO.buff>0?' ✦':'')+(DRV.on&&DRV.car&&DRV.car.fuel!=null?' · ⛽ '+Math.round(DRV.car.fuel)+' %':'');if(e.textContent!==t)e.textContent=t;e.classList.toggle('low',ECO.energy<25)}}
function money(n,why){ECO.money+=n;{const cs=charState();if(n>0)cs.earn=(cs.earn||0)+n;else cs.spend=(cs.spend||0)-n}hudEco();const f=$('moneyfx');if(f){f.textContent=(n>0?'+':'−')+fmtK(Math.abs(n));f.className='moneyfx on '+(n>0?'plus':'minus');clearTimeout(f._t);f._t=setTimeout(()=>f.className='moneyfx',1600)}if(why)toast(why)}
function energy(n){ECO.energy=Math.max(0,Math.min(100,ECO.energy+n));hudEco()}
const workMul=()=>(ECO.buff>0?1.5:1)*(ECO.energy<20?.6:1)*((charState().drunkUntil||0)>DAY.n+DAY.t?.7:1);
// ---------- UI: obchod / seznam (sdílí vzhled s nářadím) ----------
function openLoans(lender){
  const borrower=charState(), wallet=lender.cs||(lender.cs={...CHS0});
  const debts=borrower.debts||(borrower.debts={}), key=lender.name, owed=debts[key]||0;
  function transfer(amount){
    if(amount>0&&(amount>wallet.money||owed+amount>2000)||amount<0&&(-amount>borrower.money||-amount>owed))return;
    wallet.money-=amount;money(amount);debts[key]=owed+amount;saveGame(true);
    toast(lender.name+' · zbývající dluh '+fmtK(debts[key]));
  }
  const pay=Math.min(owed,borrower.money);
  openList('Půjčky · '+key,[...[500,1000].map(n=>({name:'Půjčit si '+fmtK(n),off:wallet.money<n||owed+n>2000,fn:()=>transfer(n)})),
    {name:'Splatit '+fmtK(pay),off:pay<=0,fn:()=>transfer(-pay)}],'Dluh '+fmtK(owed)+' / 2 000 Kč · V peněžence '+fmtK(borrower.money));
}
function openList(title,rows,foot){const box=$('shopui');$('shoptitle').textContent=title;const g=$('shopgrid');g.innerHTML='';
  for(const r of rows){const b=document.createElement('button');b.type='button';b.innerHTML='<b>'+r.name+'</b><span>'+(r.sub||'')+'</span>'+(r.price!=null?'<i>'+fmtK(r.price)+'</i>':'');b.disabled=!!r.off;b.onclick=()=>{r.fn();if(r.close!==false)closeList();else openList(title,typeof rows.refresh==='function'?rows.refresh():rows,foot)};g.appendChild(b)}
  $('shopfoot').textContent=foot||('Máš '+fmtK(ECO.money)+' · energie '+Math.round(ECO.energy));box.classList.add('on');if(document.pointerLockElement)document.exitPointerLock()}
function closeList(){$('shopui').classList.remove('on');relock()}
const listOpen=()=>$('shopui').classList.contains('on');
function buy(price,fn){if(P()===tereza&&ECO.tz&&ECO.tz.day===DAY.n&&!ECO.tz.shop&&!inside&&Math.hypot(P().x-66,P().z+202)<14&&ECO.money>=price){ECO.tz.shop=1;setTimeout(()=>money(250,'Nákup hotový (+250 Kč).'),50)}
  if(ECO.money<price){toast('Na to nemáš. Chybí ti '+fmtK(price-ECO.money)+'.');play('click',.3);return false}money(-price);play('coin',.5);fn();return true}
const eat=(n,buff,msg)=>()=>{energy(n);if(buff)ECO.buff=Math.max(ECO.buff,buff);toast(msg)};
const FOOD={
  pekarna:[['Koláč s tvarohem',29,'+25 ⚡',eat(25,0,'Koláč od Křížků. Pořád nejlepší v Kloboukách.')],['Rohlík',4,'+5 ⚡',eat(5,0,'Suchý rohlík. Klasika.')],['Chleba se škvarkama',45,'+35 ⚡',eat(35,0,'Škvarky, cibule, sůl. Jsi zase člověk.')],['Kafe s sebou',35,'2 min práce rychleji',eat(5,120,'Kafe! Práce půjde rychleji.')],['Buchty pro babičku',60,'babička bude ráda',()=>{ECO.babGift=1;toast('Buchty nes babičce – dá ti za ně zakázku navíc.')}]],
  coop:[['Pivo',22,'+10 ⚡  (PIVO = PALIVO)',()=>{energy(10);charState().drunkUntil=DAY.n+DAY.t+.035;saveGame(true);toast('Pivo = palivo.')}],['Párky a hořčice',59,'+30 ⚡',eat(30,0,'Párky jak od mámy.')],['Energy drink',29,'3 min práce rychleji',eat(10,180,'Srdce buší, ruce makaj.')],['Granule pro psy',149,'psi tě budou milovat',()=>{for(const d of [ashley,jackie,boban])d.petted=true;toast('Ashley, Jackie i Boban se na tebe teď dívají jako na boha.')}],['Bageta',49,'+20 ⚡',eat(20,0,'Bageta z COOPu. Ujde.')]]};
// Lidl: PARKSIDE akční týden – každý den jiná akce
// dílna začíná se 4 základními nástroji (kladivo, ruční pila, šroubovák, metr) – zbytek se kupuje v Lidlu a objeví se na stěně v dílně
const LPRICE={drill:899,hammerdrill:1299,jigsaw:999,circsaw:1499,grinder:799,plane:699,clamp:199,level:249,glue:299,multimeter:399,solder:349,wrench:449};
const LIDL=[];for(const [id,name] of [['drill','Aku vrtačka'],['hammerdrill','Příklepová vrtačka'],['jigsaw','Přímočará pila'],['circsaw','Kotoučová pila'],['grinder','Úhlová bruska'],['plane','Hoblík'],['clamp','Svěrka'],['level','Vodováha'],['glue','Tavná pistole'],['multimeter','Multimetr'],['solder','Pájka'],['wrench','Křížový klíč'],
  ['drill_p','Aku vrtačka PERFORMANCE'],['hammerdrill_p','Příklepová vrtačka PERFORMANCE'],['screwdriver_p','Aku šroubovák PERFORMANCE'],['jigsaw_p','Přímočará pila PERFORMANCE'],['circsaw_p','Kotoučová pila PERFORMANCE'],['grinder_p','Úhlová bruska PERFORMANCE']])
  LIDL.push(['PARKSIDE '+name,id.endsWith('_p')?Math.round((LPRICE[id.replace('_p','')]||999)*1.6/10)*10-1:LPRICE[id],id]);
LIDL.push(['PARKSIDE kompresor PKO 24',2999,'compressor']);
function refreshWall(){const W=window.__wallTools||{};for(const k in W)W[k].visible=ECO.owned.has(k)}
const lidlDeal=()=>LIDL[DAY.n%LIDL.length];
const lidlGroceries=[['rice','Rýže',39],['pasta','Těstoviny',29],['juice','Džus',45],['coffee','Káva',139],['milk','Mléko',25],['butter','Máslo',53],['bread','Chléb',39],['salami','Salám',69],['eggs','Vejce',65],['cheese','Sýr',49],['egg','Kinder vajíčko',35],['dogTreats','Psí pamlsky · 6 ks',59],['pizza','Mražená pizza',79],['chips','Chipsy',39],['banana','Banány',35],['kofola','Kofola',36]];
function basket(){return charState().lidlBasket??=[]}
function shopLidl(food=false){
 const stock=food?lidlGroceries.map(([id,name,price])=>[name,price,id]):LIDL;
 openList(food?'Lidl · potraviny a drogerie':'Lidl · nářadí',stock.map(([name,price,id])=>{
 if(!food&&id===lidlDeal()[2])price=Math.round(price*.7);
 return {name,price,sub:'Přidat do košíku',off:!food&&(ECO.owned.has(id)||basket().some(o=>o.id===id)),fn:()=>{basket().push({name,price,id,food});saveGame(true);toast('V košíku: '+name+'. Zaplať u pokladny.')}}}))
}
function settleBasket(stolen){
 const items=basket().splice(0);for(const {food,id,name,price} of items){if(food)receiveGoods([id,name,price,id==='dogTreats'?6:1]);else ECO.owned.add(id)}
 refreshWall();if(stolen)addWanted(2,'Odešel jsi bez placení. Ostraha volá policii!');saveGame(true)
}
function checkout(){const total=basket().reduce((v,o)=>v+o.price,0);openList('Lidl · pokladna',[{name:'Zaplatit za '+basket().length+' položek',price:total,off:!total,fn:()=>buy(total,()=>{settleBasket(false);toast('Zaplaceno. Účtenku máš v tašce.')})},{name:'Vrátit zboží do regálu',off:!total,fn:()=>{basket().length=0;saveGame(true)}}])}
// Benapol: materiál na stavby na dvorku
const BUILDS={fence:{name:'Plot u trávníku',price:3500,mat:'plotovky, sloupky, beton',e:35},coop:{name:'Kurník pro slepice',price:2800,mat:'OSB, latě, pletivo',e:30},perg:{name:'Pergola na trávníku',price:6200,mat:'KVH hranoly, kotvy, šrouby',e:45}};
function shopMaterials(){openList('Miloš Vlček · stavebniny',[].concat(Object.entries(BUILDS).map(([k,b])=>({name:b.name,sub:ECO.built.has(k)?'postaveno':ECO['mat_'+k]?'materiál na dvorku – postav (E u kolíků)':b.mat,price:b.price,off:ECO.built.has(k)||ECO['mat_'+k],fn:()=>buy(b.price,()=>{ECO['mat_'+k]=1;ECO.placing=k;toast('Materiál je na dvorku. Jdi na dvorek a vyber místo – zelený obrys před Pavlem – a zmáčkni E. Pak stav.')})})).concat([{name:'Pytel cementu',sub:'25 kg',price:159,fn:()=>buy(159,()=>{hardware.cement=(hardware.cement||0)+1;saveGame(true)})}])))}
function shopFood(k,title){const rows=FOOD[k].map(([n,p,sub,fn])=>({name:n,sub,price:p,fn:()=>buy(p,fn)}));if(k==='coop'&&ECO.eggs>0)rows.unshift({name:'Prodat vejce ('+ECO.eggs+' ks)',sub:'domácí, od Pavlových slepic',price:ECO.eggs*6,fn:()=>{const v=ECO.eggs*6;ECO.eggs=0;money(v,'Prodavačka: „Domácí vajíčka? Beru všechny.“')}});openList(title,rows)}
// Simonův tuning: lak, kola, spoiler, výfuk, motor – na auto, které stojí před garáží
function tuneCar(){let best=null,bd=12;for(const c of VEH){if(!c.g.visible||c.kind==='wreck'||c.kind==='police')continue;const d=Math.hypot(c.g.position.x-golf.position.x,c.g.position.z-golf.position.z);if(c.g!==golf&&d<bd){bd=d;best=c}}return best||VEH.find(v=>v.g===golf)}
const PAINT=[0xb51e24,0x1f4f9a,0xd4a017,0x2e6b3a,0x121212,0xf2f2f2,0xff7a1a,0x7a2fa0];
function shopTuning(){const c=tuneCar();if(!c){toast('Simon: „Přistav mi auto před garáž.“');return}const T=c.tune=c.tune||{};
  const paint=()=>{const col=PAINT[(T.paint=(T.paint||0)+1)%PAINT.length];const base=c.g.children[0].material.color.getHex();c.g.traverse(o=>{if(o.isMesh&&o.material&&o.material.color&&o.material.color.getHex()===base)o.material=M(col)});toast('Simon to přestříkal. Voní to ředidlem.')};
  openList('SIMONŮV TUNING · '+c.name,[
   {name:'Lakování',sub:'nová barva (každé další = další barva)',price:2500,fn:()=>buy(2500,paint)},
   {name:'Kola + chromy',sub:T.wheels?'hotovo':'větší, lesklá kola',price:3000,off:T.wheels,fn:()=>buy(3000,()=>{T.wheels=1;for(const w of c.g.userData.wheels){w.material=M(0xd8dde2);w.scale.set(.36,.26,.36)}toast('Kola jak z katalogu.')})},
   {name:'Spoiler',sub:T.spoiler?'hotovo':'křídlo na kufr',price:1500,off:T.spoiler,fn:()=>buy(1500,()=>{T.spoiler=1;const b=(sx,sy,sz,x,y,z)=>{const m=new THREE.Mesh(BOX,M(0x161616));m.scale.set(sx,sy,sz);m.position.set(x,y,z);c.g.add(m)};b(1.7,.06,.4,0,1.25,-2.05);b(.08,.35,.12,-.6,1.05,-2.05);b(.08,.35,.12,.6,1.05,-2.05);toast('Spoiler: +0 km/h, +100 % respekt.')})},
   {name:'Sportovní výfuk',sub:T.exhaust?'hotovo':'hlasitější, lepší',price:1200,off:T.exhaust,fn:()=>buy(1200,()=>{T.exhaust=1;const m=new THREE.Mesh(CYL,M(0xc0c4c8));m.scale.set(.09,.35,.09);m.rotation.x=Math.PI/2;m.position.set(.55,.35,-2.25);c.g.add(m);toast('Prdí to jak traktor. Krása.')})},
   {name:'Motor (chip + turbo)',sub:T.engine?'hotovo':'+30 % max. rychlost',price:5000,off:T.engine,fn:()=>buy(5000,()=>{T.engine=1;c.speedMul=1.3;toast('Simon: „Teď to jede jak blázen. Na policajty pozor.“')})}])}
// prodej kradeného auta Simonovi (3–8 tisíc podle auta, minus poškození)
function carValue(c){if(c.value==null)c.value=3000+Math.round(Math.random()*5)*1000;return Math.max(800,Math.round(c.value*(1-(c.dmg||0)/130)/100)*100)}
function sellToSimon(){const c=DRV.car;const v=carValue(c);const g=c.g;exitCar();if(DRV.on)return;toast('Simon obchází auto a prohlíží ho. Pomoz mu najít vady (E/mezerník v zelené)!');
  miniStart('Simon prohlíží auto – '+c.name,4,(miss)=>{const pay=Math.max(500,Math.round(v*(1+(miss===0?.15:-.08*miss))/100)*100);g.visible=false;carBox(g,false);const i=VEH.indexOf(c);if(i>=0)VEH.splice(i,1);money(pay,'Simon: „'+(miss===0?'Pěkná kára, beru a přidám.':miss>2?'Je to šrot, dám míň.':'Beru, rozeberu na díly.')+'“ Dostal jsi '+fmtK(pay)+'.');STATS.sold=(STATS.sold||0)+1;ECO.soldTotal=(ECO.soldTotal||0)+1})}
// ---------- minihra: trefuj zelenou zónu (E nebo mezerník) ----------
const MINI={on:false,hits:0,need:3,x:0,dir:1,zone:[.4,.6],cb:null,miss:0,spd:1};
function miniStart(title,need,cb,mode){$('tablePlan').hidden=true;Object.assign(MINI,{on:true,hits:0,need,x:0,dir:1,cb,miss:0,spd:.9/workMul(),mode:mode||'tap',prog:0,lastSign:0,missT:0});miniZone();$('minititle').textContent=title;$('mini').querySelector('small').textContent=MINI.mode==='hold'?'Drž E / mezerník a udržuj ručičku v zelené (pusť = jede zpátky)':MINI.mode==='stroke'?'Šmrdlej myší doleva-doprava (brusné tahy)':'Mačkej E nebo mezerník, když je ručička v zelené';$('mini').classList.add('on');miniDraw()}
function miniZone(){const w=Math.max(.1,.22-MINI.hits*.03)*(ECO.buff>0?1.3:1),c=.2+Math.random()*.6;MINI.zone=[c-w/2,c+w/2]}
function miniDraw(){$('mininee').style.left=(MINI.x*100)+'%';const z=$('minizone');z.style.left=(MINI.zone[0]*100)+'%';z.style.width=((MINI.zone[1]-MINI.zone[0])*100)+'%';$('minicnt').textContent=MINI.hits+' / '+MINI.need+(MINI.miss?'  · vedle: '+MINI.miss:'')}
function miniHit(){if(MINI.mode==='hold'||MINI.mode==='stroke')return;if(MINI.x>=MINI.zone[0]&&MINI.x<=MINI.zone[1]){MINI.hits++;play('screw',.5);if(MINI.hits>=MINI.need){MINI.on=false;$('mini').classList.remove('on');const cb=MINI.cb;MINI.cb=null;cb&&cb(MINI.miss);return}miniZone()}else{MINI.miss++;play('click',.4)}miniDraw()}
function miniTick(dt){if(!MINI.on)return;
  if(MINI.mode==='hold'){const held=keys.KeyE||keys.Space;MINI.x=Math.max(0,Math.min(1,MINI.x+(held?1:-1)*dt*.55*workMul()));
    const zc=.5+Math.sin(performance.now()/900)*.3,w=.16*(ECO.buff>0?1.3:1);MINI.zone=[zc-w/2,zc+w/2];if(MINI.x>=MINI.zone[0]&&MINI.x<=MINI.zone[1])MINI.prog+=dt*.25*workMul();else{MINI.prog=Math.max(0,MINI.prog-dt*.05);MINI.missT+=dt;if(MINI.missT>1.5){MINI.missT=0;MINI.miss++}}
    MINI.hits=Math.floor(MINI.prog*MINI.need);if(MINI.prog>=1){MINI.on=false;$('mini').classList.remove('on');const cb=MINI.cb;MINI.cb=null;cb&&cb(MINI.miss);return}miniDraw();return}
  if(MINI.mode==='stroke'){MINI.x=Math.min(1,MINI.prog);miniDraw();return}MINI.x+=MINI.dir*dt*MINI.spd*(1+MINI.hits*.25);if(MINI.x>1){MINI.x=1;MINI.dir=-1}if(MINI.x<0){MINI.x=0;MINI.dir=1}miniDraw()}
// ---------- stavby na dvorku (z materiálu z Benapolu) ----------
const BSITES={};
{const yardFree=(x,z,r)=>{for(let a=0;a<8;a++){const px=x+Math.cos(a*.785)*r,pz=z+Math.sin(a*.785)*r;if(blocked(px,pz,0,.3))return false}return !blocked(x,z,0,.3)};
 const cand=[];for(let x=X(925);x<X(1235);x+=.5)for(let z=Z(1150);z<Z(1395);z+=.5)if(yardFree(x,z,1.9)&&Math.hypot(x-X(990),z-Z(1425))>3.2)cand.push([x,z]);
 const pickFar=(used)=>{let best=null,bd=-1;for(const c of cand){const d=Math.min(...used.map(u=>Math.hypot(u[0]-c[0],u[1]-c[1])),99);const sd=Math.min(...spots.filter(s=>!s.in).map(s=>{try{return Math.hypot(s.x-c[0],s.z-c[1])}catch(_){return 99}}));if(sd<2.2)continue;if(d>bd){bd=d;best=c}}return best};
 const used=[];for(const k of Object.keys(BUILDS)){const c=pickFar(used.length?used:[[X(990),Z(1425)]]);if(!c)continue;used.push(c);
   const g=new THREE.Group();g.position.set(c[0],0,c[1]);g.visible=false;scene.add(g);for(const [dx,dz] of [[-1.3,-1.3],[1.3,-1.3],[-1.3,1.3],[1.3,1.3]]){const m=new THREE.Mesh(BOX,M(0xe8742a));m.scale.set(.06,.5,.06);m.position.set(dx,.25,dz);g.add(m)}
   const pile=new THREE.Mesh(BOX,M(0xb08a5a));pile.scale.set(1.2,.35,.6);pile.position.set(0,.17,0);g.add(pile);
   BSITES[k]={x:c[0],z:c[1],g,show(){g.visible=true}};
   spots.push({get x(){return BSITES[k].x},get z(){return BSITES[k].z+1.6},r:1.6,get label(){return ECO['mat_'+k]&&!ECO.built.has(k)?'Postavit: '+BUILDS[k].name:''},who:-1,get hidden(){return !(ECO['mat_'+k]&&!ECO.built.has(k))},act:()=>buildIt(k)})}
 window.__BSITES=BSITES}
const BSIZE={fence:[3.2,.5],coop:[1.9,1.5],perg:[3.2,3.2]};
const GHOST=(()=>{const g=new THREE.Mesh(new THREE.BoxGeometry(1,.06,1),BASM({color:0x40ff60,transparent:true,opacity:.45,depthWrite:false}));g.visible=false;scene.add(g);return g})();
function ghostTick(){const k=ECO.placing;if(!k||inside||DRV.on||P()!==pavel){GHOST.visible=false;return}const p=P(),[w,d]=BSIZE[k],x=p.x+Math.sin(p.head)*2.6,z=p.z+Math.cos(p.head)*2.6;
  GHOST.scale.set(w,1,d);GHOST.position.set(x,.05,z);GHOST.visible=true;let ok=x<60&&!outsideYard({x,z});if(ok)for(const dx of [-w/2,0,w/2])for(const dz of [-d/2,0,d/2])if(blocked(x+dx,z+dz,0,.15)){ok=false;break}
  GHOST.material.color.copy(LIN(ok?0x40ff60:0xff4040));GHOST.userData.ok=ok;GHOST.userData.x=x;GHOST.userData.z=z}
function placeBuild(){const k=ECO.placing;if(!GHOST.userData.ok){toast('Tady stavět nejde – vyber volné místo na dvorku.');return}const S0=BSITES[k];S0.x=GHOST.userData.x;S0.z=GHOST.userData.z;S0.g.position.set(S0.x,0,S0.z);S0.show();ECO.placing=null;GHOST.visible=false;buildIt(k)}
function buildIt(k,instant){if(!ECO['mat_'+k]||ECO.built.has(k))return;if(!instant&&P()!==pavel){toast('Stavět umí Pavel.');return}const b=BUILDS[k];if(!instant&&ECO.energy<b.e*.5){toast('Na stavění nemáš sílu. Najez se (pekárna, COOP, babička).');return}
  (instant?(f=>f()):(f=>miniStart('Stavíš: '+b.name,5,f)))(()=>{if(!instant)energy(-b.e);ECO.built.add(k);BSITES[k].g.visible=true;const S0=BSITES[k],g=S0.g;g.clear();const bx=(c,sx,sy,sz,x,y,z)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;g.add(m)};
    if(k==='fence'){for(let i=-2;i<=2;i++)bx(0x8a5a32,.1,1.1,.1,i*.7,.55,0);bx(0x9a6a3a,3,.12,.06,0,.85,0);bx(0x9a6a3a,3,.12,.06,0,.35,0);solid(S0.x-1.5,S0.z-.1,S0.x+1.5,S0.z+.1,1.1)}
    if(k==='coop'){bx(0xb08a5a,1.6,1.1,1.2,0,.75,0);bx(0x8e3c26,1.8,.08,1.4,0,1.35,0);bx(0x3a2a1a,.4,.4,.02,0,.55,.61);for(const [x,z] of [[-.6,-.4],[.6,-.4],[-.6,.4],[.6,.4]])bx(0x6b4226,.08,.2,.08,x,.1,z);solid(S0.x-.8,S0.z-.6,S0.x+.8,S0.z+.6,1.4);
      window.__hens=[];for(let i=0;i<3;i++){const h=new THREE.Group();const b=new THREE.Mesh(SPH,M(i?0xf4efe6:0x8a4a2a));b.scale.set(.18,.16,.22);b.position.y=.2;h.add(b);const hd=new THREE.Mesh(SPH,M(i?0xf4efe6:0x8a4a2a));hd.scale.setScalar(.08);hd.position.set(0,.36,.18);h.add(hd);const cb=new THREE.Mesh(BOX,M(0xc8202a));cb.scale.set(.03,.06,.06);cb.position.set(0,.45,.18);h.add(cb);const bk=new THREE.Mesh(CONE,M(0xe8a020));bk.scale.set(.03,.06,.03);bk.rotation.x=Math.PI/2;bk.position.set(0,.35,.27);h.add(bk);h.position.set(-.8+i*.5,0,1.4);g.add(h);window.__hens.push({h,t:Math.random()*3,tx:0,tz:1.4})}}
    if(k==='perg'){for(const [x,z] of [[-1.4,-1.4],[1.4,-1.4],[-1.4,1.4],[1.4,1.4]])bx(0x7a5232,.14,2.5,.14,x,1.25,z);bx(0x6b4a2e,3.1,.14,.14,0,2.5,-1.4);bx(0x6b4a2e,3.1,.14,.14,0,2.5,1.4);for(let i=-3;i<=3;i++)bx(0x6b4a2e,.1,.1,3.1,i*.45,2.62,0);
      for(const [x,z] of [[-1.4,-1.4],[1.4,-1.4],[-1.4,1.4],[1.4,1.4]])solid(S0.x+x-.08,S0.z+z-.08,S0.x+x+.08,S0.z+z+.08,2.5);bx(0x8a5a32,1.2,.7,.7,0,.35,0)}
    STATS.built=(STATS.built||0)+1;if(!instant)toast('Hotovo: '+b.name+'. Pavel je na sebe hrdý (a hledá pivo).')})}
// ---------- zakázky: od babičky, Ukrajinců (Byt 2) a lidí z města ----------
const JOBT=[
 {t:'mow',name:'posekat trávu',from:['babička','soused z Kloboukù'.replace('ù','ů'),'paní z náměstí'],pay:[400,700],need:4,e:15},
 {t:'wood',name:'naštípat dřevo',from:['babička','Ukrajinci z Bytu 2','děda od kostela'],pay:[350,650],need:4,e:18},
 {t:'fence',name:'spravit plot',from:['soused z Kloboukù'.replace('ù','ů'),'paní z náměstí','babička'],pay:[600,1000],need:5,e:20},
 {t:'repair',name:'opravit auto',from:['Ukrajinci z Bytu 2','soused z Kloboukù'.replace('ù','ů'),'chlap od sklepů'],pay:[900,1600],need:5,e:20},
 {t:'move',name:'převézt věci autem',from:['Ukrajinci z Bytu 2','paní z náměstí','soused z Kloboukù'.replace('ù','ů')],pay:[700,1200],need:0,e:8},
 {t:'dog',name:'vyvenčit psa',from:['paní z náměstí','babička','soused z Kloboukù'.replace('ù','ů')],pay:[300,500],need:0,e:6}];
const JMARK=(()=>{const g=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(1.2,.12,8,24),BASM({color:0xffd23a}));ring.rotation.x=Math.PI/2;ring.position.y=.15;g.add(ring);
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,30,16,1,true),BASM({color:0xffd23a,transparent:true,opacity:.18,depthWrite:false}));beam.position.y=15;g.add(beam);g.visible=false;scene.add(g);return g})();
function housePt(){const H=window.__THS,h=H[Math.floor(Math.random()*H.length)],ry=h[5];return {x:h[0]+Math.sin(ry)*(h[4]/2+1.6),z:h[1]+Math.cos(ry)*(h[4]/2+1.6)}}
function makeOffers(){ECO.offers=[];ECO.offerDay=DAY.n;
  const grandma=JOBT[0].from[0],neighbor=JOBT[3].from[0],town=JOBT[0].from[1];
  const givers=[grandma,neighbor,'Táta',town];if(ECO.babGift)givers.push(grandma);ECO.babGift=0;
  for(const from of givers){const T=from==='Táta'?pick([{...JOBT[1],name:'Naštípat tátovi dřevo na zimu'},{...JOBT[2],name:'Opravit tátovi vrátka'},{...JOBT[3],name:'Dát do pořádku tátovo auto'},{...JOBT[4],name:'Odvézt tátovy bedny'},{...JOBT[5],name:'Vzít psa na procházku za tátu'}]):pick(JOBT.filter(j=>j.from.includes(from)));
  let at=from==='Táta'?{x:X(900),z:Z(395)}:from==='babička'?{x:X(990),z:Z(1425)-2.2}:from.startsWith('Ukrajinci')?{x:X(658)+2.2,z:Z(610)}:housePt();
  const pay=Math.round((T.pay[0]+Math.random()*(T.pay[1]-T.pay[0]))/50)*50;ECO.offers.push({...T,from,at,pay,to:T.t==='move'||T.t==='dog'?housePt():null})}}
function terezaJobs(){const T=ECO.tz=ECO.tz&&ECO.tz.day===DAY.n?ECO.tz:{day:DAY.n,walk:0,shop:0,clean:0};
  openList('TEREZA – DNEŠNÍ ÚKOLY',[
   {name:'Vyvenčit Ashley a Jackie',sub:T.walk?'hotovo':'L u psů = vodítko, dojdi s nimi na náměstí',price:null,off:!!T.walk,fn:()=>toast('Vezmi psy na vodítko (L) a dojdi s nimi na náměstí Míru.')},
   {name:'Nakoupit v COOPu',sub:T.shop?'hotovo':'kup cokoli v COOPu',price:null,off:!!T.shop,fn:()=>toast('Dojdi do COOPu (Jiráskova/Příční) a něco kup.')},
   {name:'Uklidit Byt 1',sub:T.clean?'hotovo':'v Bytě 1 u kuchyně – drhnutí myší',price:null,off:!!T.clean,fn:()=>toast('Jdi do Bytu 1 a u kuchyně zmáčkni E.')}],'Za každý úkol 250 Kč')}
function terezaTick(){if(P()!==tereza)return;const T=ECO.tz;if(!T||T.day!==DAY.n)return;const p=P();
  if(!T.walk&&(ashley.leash||jackie.leash)&&Math.hypot(p.x+6,p.z-195)<22){T.walk=1;money(250,'Psi vyvenčení až na náměstí! (+250 Kč)')}}
function showJobs(giver){if(!giver&&P()===tereza){terezaJobs();return}if(ECO.offerDay!==DAY.n)makeOffers();const rows=[];
  if(ECO.job&&(!giver||ECO.job.from===giver))rows.push({name:'▶ '+ECO.job.name+' ('+ECO.job.from+')',sub:'aktivní · '+(ECO.job.stage==='to'?'jeď na druhé místo':'jdi na žlutý kruh')+' · zrušit',price:ECO.job.pay,fn:()=>{ECO.job=null;JMARK.visible=false;toast('Zakázka zrušena.')}});
  for(const o of ECO.offers.filter(o=>!giver||o.from===giver))rows.push({name:o.name,sub:'od: '+o.from+(o.t==='move'?' · potřebuješ auto':''),price:o.pay,off:!!ECO.job,fn:()=>{ECO.job={...o,stage:'at'};ECO.offers.splice(ECO.offers.indexOf(o),1);markJob();toast('Zakázka: '+o.name+' pro '+o.from+'. Žlutý kruh je na mapě i v radaru.')}});
  if(!rows.length)rows.push({name:'Dneska nic',sub:'zkus to zítra',off:true,fn:()=>{}});
  openList('ZAKÁZKY (K)',rows,'Máš '+fmtK(ECO.money)+' · nářadí: '+ECO.owned.size+' ks (+'+Math.max(0,ECO.owned.size-5)*5+' % k výdělku)')}
function markJob(){const j=ECO.job;if(!j){JMARK.visible=false;return}const t=j.stage==='to'?j.to:j.at;JMARK.position.set(t.x,0,t.z);JMARK.visible=true}
let jobDog=null;
function jobTick(dt,t){const j=ECO.job;if(!j||inside)return;JMARK.children[0].rotation.z+=dt;const tg=j.stage==='to'?j.to:j.at,p=P(),pos=DRV.on?DRV.car.g.position:p;
  if(Math.hypot(pos.x-tg.x,pos.z-tg.z)>(DRV.on?3.5:1.6)||MINI.on)return;
  const pay=Math.round(j.pay*(1+Math.max(0,ECO.owned.size-5)*.05)/10)*10;
  const done=(miss)=>{const bonus=miss===0&&j.need?Math.round(pay*.15/10)*10:0;energy(-j.e);money(pay+bonus,'Hotovo: '+j.name+'. '+j.from+' platí '+fmtK(pay)+(bonus?' + dýško '+fmtK(bonus)+' za čistou práci':'')+'.');ECO.job=null;JMARK.visible=false;STATS.jobs=(STATS.jobs||0)+1;ECO.jobsTotal=(ECO.jobsTotal||0)+1;if(jobDog){scene.remove(jobDog.obj);jobDog=null}};
  if(j.t==='move'){if(!DRV.on){if(j.stage==='at'&&!j.warn){j.warn=1;toast('Na stěhování potřebuješ auto. (Simon ti půjčí Golf? Nebo si nějaké „půjč“.)')}return}
    if(j.stage==='at'){j.stage='to';markJob();toast('Naloženo. Odvez to na druhé místo (žlutý kruh).');play('crate',.5)}else{play('crate',.5);done(0)}return}
  if(j.t==='dog'){if(DRV.on)return;if(j.stage==='at'){j.stage='to';markJob();jobDog=agent(dogS(PS.jackie,.7),p.x+1,p.z,{speed:4.6,r:.2,reach:.4,dog:1});jobDog.obj.traverse(o=>{if(o.isMesh)o.material=o.material.clone()});toast('Pes je tvůj. Vyvenči ho ke žlutému kruhu.')}
    else done(0);return}
  if(DRV.on)return;if(ECO.energy<j.e*.5){if(!j.tired){j.tired=1;toast('Nemáš sílu. Dej si něco k jídlu (pekárna Křížkovi, COOP, babička).')}return}
  const names={mow:'Sekáš trávu',wood:'Štípeš dřevo',fence:'Spravuješ plot',repair:'Opravuješ auto'};
  miniStart(names[j.t]+' – '+j.from,j.need,done)}
function jobDogTick(dt){if(!jobDog)return;const p=P(),d=Math.hypot(jobDog.x-p.x,jobDog.z-p.z);if(d>1.6)goTo(jobDog,p.x,p.z,jobDog.speed*(d>6?1.3:1),dt,1.2);else step(jobDog,0,0,0,dt)}
// ---------- babička: ráno zametá, v poledne nese jídlo, večer volá psy ----------
const babicka=agent(person(0xf0c8a8,0x8a4a6a,0x5a4a6a,0xdcdcdc),X(990),Z(1425)-1,{name:'Babička',speed:1.6,r:.28,reach:.3});babicka.obj.scale.setScalar(.9);babicka.obj.visible=false;
{const ap=new THREE.Mesh(BOX,M(0xf2e8d8));ap.scale.set(.42,.5,.04);ap.position.set(0,.75,.17);babicka.obj.add(ap)}
const BAB={call:0,said:-1};const BAB_HOME={x:X(990),z:Z(1425)-.9};
const grannyRounds=[
  {hour:9,target:'shop'}, {hour:13.5,target:'tereza'}, {hour:15.5,target:'shop'}
];
// Find a walkable path through the yard, including the return trip.
function grannyPath(tx,tz){const previous=COL_IN;COL_IN=false;try{return grannyOutdoorPath(tx,tz)}finally{COL_IN=previous}}
function grannyOutdoorPath(tx,tz){
  const x0=babicka.x,z0=babicka.z,cell=.5,queue=[[0,0,null]],seen=new Set(['0,0']);
  for(let i=0;i<queue.length;i++){
    const node=queue[i],[ix,iz]=node,x=x0+ix*cell,z=z0+iz*cell;
    if(Math.hypot(tx-x,tz-z)<.65){
      const path=[];for(let n=node;n[2];n=n[2])path.push([x0+n[0]*cell,z0+n[1]*cell]);return path.reverse()
    }
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=ix+dx,nz=iz+dz,key=nx+','+nz,wx=x0+nx*cell,wz=z0+nz*cell;
      if(seen.has(key)||wx<X(350)||wx>X(1200)||wz<Z(295)||wz>Z(1430))continue;
      seen.add(key);if(!blocked(wx,wz,0,.32,.3))queue.push([nx,nz,node])
    }
  }
  return null
}
function grannyVisit(dt,hr){
  const slot=grannyRounds.findIndex(v=>hr>=v.hour&&hr<v.hour+1.5);
  let visit=BAB.visit;
  if(!visit){
    if(slot<0||BAB.roundKey===DAY.n*3+slot)return false;
    const target=grannyRounds[slot].target;
    BAB.roundKey=DAY.n*3+slot;
    if(!babicka.obj.visible){babicka.x=BAB_HOME.x;babicka.z=BAB_HOME.z;babicka.y=0;babicka.vy=0}
    const pos=target==='shop'?[X(870),Z(370)]:[X(1000),Z(965)];
    const path=grannyPath(...pos);if(!path)return false;
    babicka.obj.visible=true;BAB.call=0;visit=BAB.visit={target,path,watch:9,said:false,back:false,slot}
  }
  if(!visit.back&&(slot!==visit.slot||visit.watch<=0)){
    visit.back=true;visit.path=grannyPath(BAB_HOME.x,BAB_HOME.z)||[[BAB_HOME.x,BAB_HOME.z]]
  }
  if(visit.path.length){const [x,z]=visit.path[0];if(goTo(babicka,x,z,2,dt,.16))visit.path.shift();return true}
  if(visit.back){BAB.visit=null;return false}
  visit.watch-=dt;
  const shop=visit.target==='shop',atDoor=shop&&P()===pavel&&room==='shop',person=shop?pavel:tereza;
  const nearby=!inside&&Math.hypot(person.x-babicka.x,person.z-babicka.z)<7;
  const x=atDoor||shop&&!nearby?X(900):person.x,z=atDoor||shop&&!nearby?Z(307):person.z;
  step(babicka,0,0,0,dt);babicka.obj.rotation.y=Math.atan2(x-babicka.x,z-babicka.z);
  const audible=atDoor||!inside&&Math.hypot(P().x-babicka.x,P().z-babicka.z)<7;
  const working=P()===pavel&&(useT>0||tWork>0||MINI.on);
  if(!visit.said&&audible&&(shop?(working||visit.watch<2):(nearby&&visit.watch<6))){
    visit.said=true;
    toast(shop?(working?pick(['Babička: „Pavle, vždyť si tím svěrákem odřeš ten lak!“','Babička: „Pavlíku, děda si pod ty šroubky vždycky dával víčko od okurek.“']):'Babička od dveří: „Já se jenom dívám. Až skončíš, zhasni tu.“'):'Babička: „Terezko, ta Ashley kouká víc na tvoji kapsu než na překážku.“')
  }
  return true
}
function babTick(dt,t){const hr=DAY.t*24;if(grannyVisit(dt,hr))return;const out=(hr>=8.5&&hr<10.5)||(hr>=12&&hr<13)||(hr>=18.3&&hr<19);
  if(!out){if(babicka.obj.visible){if(goTo(babicka,BAB_HOME.x,BAB_HOME.z,babicka.speed,dt,.35))babicka.obj.visible=false}BAB.call=0;return}
  if(!babicka.obj.visible){babicka.x=BAB_HOME.x;babicka.z=BAB_HOME.z;babicka.y=groundAt(babicka.x,babicka.z,5);babicka.vy=0;babicka.obj.visible=true;play('door',distVol(babicka,.4))}
  const slot=hr<11?'sweep':hr<13?'food':'call';
  if(slot==='sweep'){if(!babicka.tg||goTo(babicka,babicka.tg.x,babicka.tg.z,babicka.speed,dt,.3)){babicka.tg={x:BAB_HOME.x+(Math.random()-.5)*4,z:BAB_HOME.z-1-Math.random()*3}}}
  else if(slot==='food'){goTo(babicka,BAB_HOME.x,BAB_HOME.z-2,babicka.speed,dt,.3);if(BAB.said!==DAY.n*10+1){BAB.said=DAY.n*10+1;if(!inside)toast(pick(['Babička: Pavle, řízky stydnou!','Babička: Jestli máš hlad, stav se pro talíř.','Babička: Dneska je svíčková, pojď jíst!']))}}
  else{goTo(babicka,BAB_HOME.x,BAB_HOME.z-2.5,babicka.speed,dt,.3);BAB.call=1;if(BAB.said!==DAY.n*10+2){BAB.said=DAY.n*10+2;if(!inside)toast('Babička: „Ashley! Jackie! Bobane! Pojďte papat!“');play('bark_collie',.3)}}}
spots.push({get x(){return babicka.x},get z(){return babicka.z},r:1.5,get label(){return babicka.obj.visible?(DAY.t*24>=12&&DAY.t*24<13&&ECO.babFood!==DAY.n?'Vzít si jídlo od babičky':'Babička – zakázky'):''},get hidden(){return !babicka.obj.visible||inside},who:-1,
  act:()=>{const hr=DAY.t*24;if(hr>=12&&hr<13&&ECO.babFood!==DAY.n){ECO.babFood=DAY.n;energy(50);toast('Babička: „Jez, ať nejsi tak hubenej.“ (+50 ⚡)')}else showJobs(JOBT[0].from[0])}});
// ---------- Ukrajinci z Bytu 2: ráno do práce (autobus u COOPu), večer zpátky ----------
const UKR=[0,1].map(i=>{const a=agent(person(0xe8c0a0,i?0x2f5f8a:0xd65a1f,0x2b3446,i?0x3a2a1a:0x6b4a2a),X(658)+1,Z(610),{name:'Soused z Bytu 2',speed:3,r:.3,reach:.3});a.obj.visible=false;a.st='home';
  const v=new THREE.Mesh(BOX,M(0xe8ff3a));v.scale.set(.46,.4,.3);v.position.set(0,.95,0);a.obj.add(v);return a});
const UKR_PATH=[[X(658)+1.2,Z(610)],[3,-3.2],[4.2,-3.2],[4.2,-5],[2.4,-5],[2.4,-6.2],[-3.6,-6.2],[-3.9,-7.1],[-3.9,-15.8],[X(486),Z(95)],[X(486),Z(0)],[X(-60),Z(0)],[X(-60),-140],[-19.4,-158]];
function ukrTick(dt){const hr=DAY.t*24;UKR.forEach((u,i)=>{const leave=6.4+i*.12,back=18+i*.15;
  if(u.st==='home'&&hr>=leave&&hr<leave+.5){u.st='out';u.wi=0;u.x=UKR_PATH[0][0];u.z=UKR_PATH[0][1];u.y=groundAt(u.x,u.z,5);u.vy=0;u.obj.visible=true;play('door',distVol(u,.35))}
  if(u.st==='away'&&hr>=back&&hr<back+.5){u.st='in';u.wi=UKR_PATH.length-1;u.x=UKR_PATH[u.wi][0];u.z=UKR_PATH[u.wi][1];u.y=groundAt(u.x,u.z,5);u.vy=0;u.obj.visible=true}
  if(u.st==='out'||u.st==='in'){const out=u.st==='out',[tx,tz]=UKR_PATH[u.wi];if(u.wi>=8&&u.wi<=10){if(!GATE.open){toggleGate();u.gate=1}}
    {const d=Math.hypot(tx-u.x,tz-u.z);if(d<(u.ld??1e9)-.05){u.ld=d;u.stk=0}else if((u.stk=(u.stk||0)+dt)>2.5){u.x=tx;u.z=tz;u.y=groundAt(tx,tz,5);u.stk=0}}
    if(goTo(u,tx,tz,u.speed,dt,.45)){u.ld=1e9;u.wi+=out?1:-1;if(u.gate&&(out?u.wi===12:u.wi===7)){if(GATE.open)toggleGate();u.gate=0}
      if(u.wi<0||u.wi>=UKR_PATH.length){u.obj.visible=false;u.st=out?'away':'home'}}}})}
spots.push({get x(){const u=UKR.find(u=>u.obj.visible);return u?u.x:0},get z(){const u=UKR.find(u=>u.obj.visible);return u?u.z:-999},r:1.6,label:'Sousedi z Bytu 2 – zakázky',get hidden(){return !UKR.some(u=>u.obj.visible)||inside},who:-1,act:()=>showJobs(JOBT[3].from[0])});
// ---------- autobus 109 Brno – Klobouky – Čejč ----------
const BUS={g:null,path:[],i:0,t:0,wait:0,dir:1,v:0};
{const r=[[-129.6,-344],[-126,-252],[-111.6,-107.6],[-118.8,.7],[-111.6,109],[-89.9,130.7],[-21.3,127],[-21.3,150],[-17.7,168],[0.4,235.4],[68.9,253.4],[65.3,109],[50.9,40],[50.9,-150],[50.9,-252],[50.9,-344]];
 BUS.path=r;BUS.stops=[[-125,-232,'Klobouky u Brna, škola'],[-18,170,'Klobouky u Brna, nám.'],[50.9,-205,'Klobouky u Brna, samoobsluha']];
 const g=new THREE.Group(),b=(c,sx,sy,sz,x,y,z)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
 b(0xf2f2f2,2.5,2.6,11.5,0,1.65,0);b(0x2a3640,2.52,1,10.6,0,2.2,.2);b(0x1f4f9a,2.54,.35,11.52,0,.75,0);b(0x2a3640,2.3,1.2,.06,0,2.1,5.76);
 const tx=document.createElement('canvas');tx.width=256;tx.height=64;const c2=tx.getContext('2d');c2.fillStyle='#111';c2.fillRect(0,0,256,64);c2.fillStyle='#ffb020';c2.font='700 34px monospace';c2.textAlign='center';c2.fillText('109 BRNO',128,44);
 const ds=new THREE.Mesh(new THREE.PlaneGeometry(2,.5),BASM({map:new THREE.CanvasTexture(tx)}));ds.name='destination';ds.position.set(0,2.95,5.78);g.add(ds);
 g.userData.wheels=[];for(const sx of [-1.15,1.15])for(const sz of [-3.6,3.8]){const w=new THREE.Mesh(CYL,M(0x1a1a1a));w.scale.set(.5,.3,.5);w.rotation.z=Math.PI/2;w.position.set(sx,.5,sz);g.add(w);g.userData.wheels.push(w)}
 scene.add(g);BUS.g=g;BUS.s={top:3};
 // zastávky: označník + přístřešek
 for(const [x,z,n] of BUS.stops){if(z===170)continue;const p=new THREE.Mesh(BOX,M(0x8a8f96));p.scale.set(.08,2.6,.08);let best=null,bd=1e9;for(const s2 of SEG){const d=window.__sdist(x,z,s2);if(d<bd){bd=d;best=s2}}
   const [ax,az]=best.a,[bx2,bz]=best.b,L=Math.hypot(bx2-ax,bz-az),nx=(bz-az)/L,nz=-(bx2-ax)/L,sx=x+nx*(best.w/2+1.4),sz=z+nz*(best.w/2+1.4);p.position.set(sx,1.3,sz);scene.add(p);sign('ZASTÁVKA 109',sx,2.5,sz,Math.atan2(nx,nz),1.4);
   const roof=new THREE.Mesh(BOX,STDM({color:0xcfe8ff,transparent:true,opacity:.5}));roof.scale.set(3,.08,1.4);roof.position.set(sx+nx*.9,2.4,sz+nz*.9);roof.rotation.y=Math.atan2(nx,nz);scene.add(roof)}}
function busMinute(){return (DAY.t*1440)%60}
function busTick(dt){
  const B=BUS,g=B.g,minute=busMinute();
  const stopped=minute<15;
  const angle=stopped?0:(minute-15)/45*Math.PI*2;const z=170+Math.sin(angle)*8;
  const x=-18.9-1.8*(1-Math.cos(angle));g.position.set(x,0,z);g.rotation.y=Math.atan2(-1.8*Math.sin(angle),8*Math.cos(angle));B.wait=stopped?1:0;B.v=stopped?0:4;
  for(const w of g.userData.wheels)w.rotation.x+=B.v*dt/.5;
  const c=Math.abs(Math.cos(g.rotation.y)),sn=Math.abs(Math.sin(g.rotation.y)),hx=1.25*c+5.75*sn,hz=1.25*sn+5.75*c;Object.assign(B.s,{x1:x-hx,x2:x+hx,z1:z-hz,z2:z+hz});if(!solids.includes(B.s))solids.push(B.s)}
// ---------- traktor John Deere po polích za městem ----------
const TRAK={c:null,path:[[TOWN.x1-25,TOWN.z1-25],[TOWN.x2+25,TOWN.z1-25],[TOWN.x2+25,TOWN.z2+25],[TOWN.x1-25,TOWN.z2+25]],i:0,t:Math.random()};
{const g=new THREE.Group(),b=(c,sx,sy,sz,x,y,z)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
 b(0x367c2b,1.4,1,2.6,0,1.1,.4);b(0x367c2b,1.5,1.6,1.4,0,1.9,-.6);b(0x2a3640,1.52,.9,1.3,0,2.1,-.6);b(0xffde00,1.42,.12,2.62,0,1.55,.4);b(0x222222,.12,.9,.12,.4,2.1,1.2);
 g.userData.wheels=[];for(const [sx,sz,r] of [[-.9,-.8,.85],[.9,-.8,.85],[-.8,1.2,.5],[.8,1.2,.5]]){const w=new THREE.Mesh(CYL,M(0x1a1a1a));w.scale.set(r,.4,r);w.rotation.z=Math.PI/2;w.position.set(sx,r,sz);g.add(w);g.userData.wheels.push(w);const hub=new THREE.Mesh(CYL,M(0xffde00));hub.scale.set(r*.5,.42,r*.5);hub.rotation.z=Math.PI/2;hub.position.set(sx,r,sz);g.add(hub)}
 scene.add(g);TRAK.c={g,kind:'tractor',name:'traktor John Deere'};VEH.push(TRAK.c)}
function trakTick(dt){const c=TRAK.c;if(c.kind!=='tractor'||(DRV.on&&DRV.car===c))return;const a=TRAK.path[TRAK.i],b=TRAK.path[(TRAK.i+1)%4],L=Math.hypot(b[0]-a[0],b[1]-a[1]);TRAK.t+=dt*3.2/L;if(TRAK.t>=1){TRAK.t=0;TRAK.i=(TRAK.i+1)%4}
  c.g.position.set(a[0]+(b[0]-a[0])*TRAK.t,0,a[1]+(b[1]-a[1])*TRAK.t);c.g.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);for(const w of c.g.userData.wheels)w.rotation.x+=dt*3}
// ---------- chodci po chodnících ----------
const PEDS=[];window.__PEDS=PEDS;
function legPivots(g){const legs=g.children.filter(m=>m.isMesh&&m.geometry===CYL&&Math.abs(m.position.y-.42)<.01);const feet=g.children.filter(m=>m.isMesh&&m.geometry===BOX&&Math.abs(m.position.y-.05)<.01);const out=[];
  for(const l of legs){const pv=new THREE.Group();pv.position.set(l.position.x,.84,0);g.add(pv);g.remove(l);l.position.set(0,-.42,0);pv.add(l);const f=feet.find(f=>Math.abs(f.position.x-l.position.x)<.01);if(f){g.remove(f);f.position.set(0,-.79,.05);pv.add(f)}out.push(pv)}g.userData.legs=out;return out}
{const segs=SEG.filter(g=>!g.loc&&Math.hypot(g.b[0]-g.a[0],g.b[1]-g.a[1])>30);const TOPS=[0x3a5a8a,0x8a3a3a,0x2b2b2b,0xd4a017,0x2e6b3a,0x6b4a8a,0xe8e8e8,0xb55a2a];
 for(let i=0;i<18;i++){const g=i<10?segs[(i*7)%segs.length]:{a:[-21.3,-46],b:[-21.3,6],w:8},side=i%2?1:-1;const a=agent(person(0xf0c0a0-(i%3)*0x0a0a0a,TOPS[i%TOPS.length],0x2f3e5a,[0x2a1d14,0x6b4a2a,0xdcdcdc,0x111111][i%4]),0,0,{speed:1.2+Math.random()*.6,r:.28});
   legPivots(a.obj);a.seg=g;a.side=side;a.t=Math.random();a.dir=Math.random()<.5?1:-1;PEDS.push(a)}
 // lidi, co postávají a povídají (náměstí, obchody, zastávka)
 const spotsP=[[-15.5,-31],[-15.3,-28],[-15.5,-20],[-15.3,-16],[-15.5,-12],[-16,195.6],[-14.6,201],[-13.8,201.8],[4,186.8],[5,187.6],[window.__shops.pekarna.x-1.2,window.__shops.pekarna.z+.5],[window.__shops.coop.x-1.4,window.__shops.coop.z],[window.__shops.lidl.x-2,window.__shops.lidl.z+1],[window.__shops.lidl.x-2.6,window.__shops.lidl.z-.6],[-125,-229]];
 spotsP.forEach(([x,z],i)=>{const a=agent(person(0xf0c0a0-(i%3)*0x0a0a0a,TOPS[(i+3)%TOPS.length],0x2f3e5a,[0x6b4a2a,0xdcdcdc,0x111111,0x2a1d14][i%4]),x,z,{speed:0,r:.28});a.idle=1;a.buyer=i===0;a.obj.position.set(x,0,z);a.head=Math.random()*6;a.obj.rotation.y=a.head;a.ph=Math.random()*6;PEDS.push(a)})}
function pedTick(dt){for(const a of PEDS){if(a.idle&&!(a.hit>0)){a.ph+=dt;const u=a.obj.userData;if(u.arms)u.arms[1].rotation.x=-.4+Math.sin(a.ph*3)*.35*(Math.sin(a.ph*.4)>0?1:0);if(u.head)u.head.rotation.y=Math.sin(a.ph*.7)*.5;a.x=a.obj.position.x;a.z=a.obj.position.z;
    if(DRV.on&&Math.abs(DRV.v)>5){const cg=DRV.car.g.position;if(Math.hypot(cg.x-a.x,cg.z-a.z)<1.6){a.hit=4;play('crash',.4,800);addWanted(1,'Srazil jsi chodce! Je v pořádku, ale nadává a volá policii.')}}continue}
  if(a.hit>0){a.hit-=dt;a.obj.rotation.z=Math.min(1.5,a.obj.rotation.z+dt*6);if(a.hit<=0){a.obj.rotation.z=0}continue}
  if(a.talk>0){a.talk-=dt;continue}
  const g=a.seg,[ax,az]=g.a,[bx,bz]=g.b,L=Math.hypot(bx-ax,bz-az),fx=(bx-ax)/L,fz=(bz-az)/L,off=(g.w/2+.85)*a.side;const nt=a.t+a.dir*a.speed*dt/L,nxp=ax+(bx-ax)*nt-fz*off,nzp=az+(bz-az)*nt+fx*off;if(blocked(nxp+fx*a.dir*.4,nzp+fz*a.dir*.4,0,.25)){a.dir*=-1}else a.t=nt;if(a.t>1||a.t<0){a.dir*=-1;a.t=Math.max(0,Math.min(1,a.t))}
  a.x=ax+(bx-ax)*a.t-fz*off;a.z=az+(bz-az)*a.t+fx*off;a.head=Math.atan2(fx*a.dir,fz*a.dir);a.moving=1;a.phase=(a.phase||0)+dt*a.speed*6;a.obj.position.set(a.x,Math.abs(Math.sin(a.phase))*.06,a.z);a.obj.rotation.y=a.head;
  const u=a.obj.userData;if(u.legs)u.legs.forEach((l,k)=>l.rotation.x=Math.sin(a.phase*.6+k*Math.PI)*.55);if(u.arms)u.arms.forEach((l,k)=>l.rotation.x=Math.sin(a.phase*.6+k*Math.PI+Math.PI)*.45);
  if(DRV.on&&Math.abs(DRV.v)>5){const cg=DRV.car.g.position;if(Math.hypot(cg.x-a.x,cg.z-a.z)<1.6){a.hit=4;play('crash',.4,800);addWanted(1,'Srazil jsi chodce! Je v pořádku, ale nadává a volá policii.')}}}}
// ---------- fotbalový míč na hřišti ----------
const BALL={m:null,vx:0,vz:0,x:168,z:335,y:.22,vy:0};
{const m=new THREE.Mesh(new THREE.SphereGeometry(.22,14,10),M(0xffffff));m.castShadow=true;scene.add(m);BALL.m=m;for(let i=0;i<5;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(.07,6,4),M(0x111111));d.position.set(Math.cos(i*1.26)*.18,Math.sin(i*1.9)*.12,Math.sin(i*1.26)*.18);m.add(d)}}
function ballTick(dt){const B=BALL,p=P(),pos=DRV.on?DRV.car.g.position:p;const d=Math.hypot(B.x-pos.x,B.z-pos.z);
  if(d<(DRV.on?1.9:.75)&&!inside){const sp=DRV.on?Math.abs(DRV.v):(p.moving?6:2),ang=Math.atan2(B.x-pos.x,B.z-pos.z);B.vx=Math.sin(ang)*sp*1.6;B.vz=Math.cos(ang)*sp*1.6;B.vy=sp*.6;play('kick',.4,250)}
  B.x+=B.vx*dt;B.z+=B.vz*dt;B.vy-=dt*14;B.y+=B.vy*dt;if(B.y<.22){B.y=.22;B.vy=Math.abs(B.vy)>1.5?-B.vy*.45:0}const fr=B.y<=.23?1.4:.2;B.vx*=Math.max(0,1-dt*fr);B.vz*=Math.max(0,1-dt*fr);
  if(B.x<150.5||B.x>185.5){B.vx*=-.6;B.x=Math.max(150.5,Math.min(185.5,B.x))}
  for(const s of [-1,1]){const gz=335+s*28;if(B.x>164.6&&B.x<171.4&&(s<0?B.z<gz:B.z>gz)&&B.y<2.4){toast('GÓÓÓL! Klobouky vedou!');play('kick',.6);B.x=168;B.z=335;B.vx=B.vz=0;STATS.goals=(STATS.goals||0)+1}}
  if(B.z<306||B.z>364){B.vz*=-.6;B.z=Math.max(306,Math.min(364,B.z))}
  B.m.position.set(B.x,B.y,B.z);B.m.rotation.x+=B.vz*dt/.22;B.m.rotation.z-=B.vx*dt/.22}
// ---------- kostelní zvony (poledne, večer) ----------
let BELLAC=null;function bells(n){if(!audioOn)return;const p=P();const d=Math.min(...window.__bells.map(([x,z])=>Math.hypot(x-p.x,z-p.z)));const vol=Math.max(.04,Math.min(.5,30/(d+20)))*(inside?.35:1);
  try{BELLAC=BELLAC||new (window.AudioContext||window.webkitAudioContext)();const ac=BELLAC;for(let k=0;k<n;k++){const t0=ac.currentTime+k*1.6;for(const [f,g] of [[392,1],[784,.35],[1176,.18],[466,.25]]){const o=ac.createOscillator(),gn=ac.createGain();o.type='sine';o.frequency.value=f;gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(vol*g,t0+.01);gn.gain.exponentialRampToValueAtTime(.0001,t0+3.2);o.connect(gn).connect(ac.destination);o.start(t0);o.stop(t0+3.3)}}}catch(_){}}
// ---------- rádio: moderátoři (titulky) ----------
const RADIOLINES={hifi:['Rádio Kotel, hrajeme nahlas, protože jinak to nemá smysl.','Pozdravy do Kloboouk, hlavně klukům z dílny na Krátké!','Dopravní info: u Lidlu zase někdo parkuje přes dvě místa.'],shop:['Rock Dílna FM – kytary, vrtačky a žádné kecy.','Volal posluchač: PARKSIDE nebo Makita? Odpověď znáte.','Další song věnujeme všem, co dneska svařujou za Bytem 2.'],
 yard:['Dvorek FM, rádio pro všechny psy na Krátké.','Babička vzkazuje: kdo snědl buchty, ať se přizná.','Počasí: nad Kloboukama jasno, nad dílnou kouř.'],boban:['Haf Haf Rádio! HAF.','Boban dnes ukradl tři ponožky. Rekord týdne.','Vrrrr… haf. Konec zpráv.'],night:['Noční jízda. Okýnko dolů, hlasitost nahoru.','Městská policie dnes v noci hlídkuje u náměstí. Jen tak, pro info.','Jedeme dál, Klobouky spí, my ne.']};
let radioSay=12;function radioTick(dt){if(!DRV.on||!DRV.radio)return;radioSay-=dt;if(radioSay<=0){radioSay=35+Math.random()*25;const L=RADIOLINES[DRV.radio];if(L){const n=RADIO.find(r=>r[0]===DRV.radio);toast('📻 '+(n?n[1]:'Rádio')+' – moderátor: „'+L[Math.floor(Math.random()*L.length)]+'“')}}}
// ---------- obchody: vstup (E u dveří), odtahovka ----------
for(const [k,title] of [['pekarna','PEKAŘSTVÍ KŘÍŽKOVI'],['coop','COOP JEDNOTA'],['lidl','LIDL'],['benapol','BENAPOL'],['vlcek','Stavebniny Miloš Vlček']]){const S0=window.__shops[k];
  spots.push({x:S0.x,z:S0.z,r:2.2,label:(k!=='coop'?'Vejít: ':'Nakoupit: ')+title,who:-1,snd:'door',act:()=>k==='lidl'?enterRoom('lidl','LIDL. Pípání pokladen a vůně pečiva.'):k==='pekarna'?enterRoom('pekarna','Pekařství Křížkovi. Voní to koláčema.'):(k==='benapol'||k==='vlcek')?enterRoom(k,title):shopFood(k,title)})}
spots.push({in:'pekarna',x:RM.pekarna.cx,z:RM.pekarna.cz-.1,r:1.3,label:'Koupit u pultu',who:-1,act:()=>shopFood('pekarna','PEKAŘSTVÍ KŘÍŽKOVI')},{in:'pekarna',x:RM.pekarna.cx,z:RM.pekarna.cz+RM.pekarna.d/2-.4,r:.9,label:'Odejít',who:-1,snd:'door',act:()=>exitRoom()},
  {in:'lidl',x:RM.lidl.cx+RM.lidl.w/2-2,z:RM.lidl.cz+.6,r:1.8,label:'PARKSIDE nářadí',who:-1,act:()=>shopLidl()},{in:'lidl',x:RM.lidl.cx-RM.lidl.w/2+2.8,z:RM.lidl.cz+RM.lidl.d/2-2.2,r:1.6,label:'Pokladna · zaplatit košík',who:-1,act:checkout},{in:'lidl',x:RM.lidl.cx,z:RM.lidl.cz+RM.lidl.d/2-.4,r:1,label:'Odejít',who:-1,snd:'door',act:()=>exitRoom()});
const IMP={car:null};
spots.push({x:-16,z:170,r:3.4,get label(){return busMinute()<15?'109 Brno · nákupní centrum (25 Kč)':'109 Brno · příjezd každou celou hodinu'},who:-1,get hidden(){return inside||DRV.on},act:()=>{
  if(busMinute()>=15){toast('Linka 109 přijede v celou a čeká 15 herních minut.');return}
  if(!$('fade').classList.contains('on'))buy(25,()=>enterRoom('mall','Brno · nákupní centrum. Linka 109 staví u hlavního vstupu.'))
}});
for(const [i,items] of [
  [['woodGlue','Lepidlo na dřevo',89,1],['mountGlue','Montážní lepidlo',149,1]],
  [['boards','Hoblovaná prkna',290,1],['bits','Sada vrtáků',179,1]],
  [['screws','Vruty · 20 ks',49,20],['bolts','Šrouby a matice · 8 ks',69,8]]
].entries())for(const side of [-1,1])spots.push({in:'hornbach',x:RM.hornbach.cx+side*5.45,z:-3+i*2.7,r:1.4,label:items[0][1]+' · regál',who:-1,act:()=>openList('HORNBACH',items.map(([id,name,price,count])=>({name,price,fn:()=>buy(price,()=>{hardware[id]=(hardware[id]||0)+count;saveGame(true);toast(name+' přidáno do skladu.')})})))});
spots.push({in:'hornbach',x:RM.hornbach.cx,z:4.5,r:1.3,label:'Zpět do obchodní pasáže',who:-1,act:()=>enterRoom('mall')});

spots.push({x:127,z:-152,r:3,get label(){return IMP.car?'Vyplatit auto z odtahovky ('+fmtK(1500)+')':'Odtahová služba'},who:-1,act:()=>{if(!IMP.car){toast('Odtahovka: „Nic tu od vás nemáme.“');return}buy(1500,()=>{const c=IMP.car;IMP.car=null;c.g.position.set(118,0,-146);c.g.visible=true;carBox(c.g,true);toast('Auto je venku. Příště parkuj líp.')})}});
spots.push({get x(){return golf.position.x},get z(){return golf.position.z+2.6},r:2,label:'Simonův tuning',who:-1,get hidden(){return SIM.state!=='work'},act:()=>shopTuning()});
// ---------- buňky B1–B4: dají se otevřít, občas uvnitř spí zloděj ----------
for(const c of window.__cabins){
  const r=RM[c.key];
  spots.push({x:c.x,z:c.z,r:1.5,label:'Vejít do buňky '+c.key,who:-1,act:()=>enterRoom(c.key,'Uvnitř páchne zatuchlá matrace a staré pivo.')},
    {in:c.key,x:r.cx,z:r.d/2-.45,r:1.2,label:'Vyjít ven',who:-1,act:()=>exitRoom()},
    {in:c.key,x:r.cx-1.5,z:-.2,r:1.35,label:'Promluvit se zlodějem',get hidden(){return !c.resident.visible},who:-1,msg:'„Zavři za sebou. Co tu chceš?“'})
}
// ---------- kočky ve městě: dají se pohladit ----------
const TCATS=[[0x8a5a2a,0x5a3a1a,0xf0e0c8,0x8ad23a],[0xf2f2f2,0xd8d8d8,0xffffff,0x3aa0d2],[0x161616,0x0b0b0b,0xf2f2f2,0xc8d23a],[0xd47a2a,0xa85a1a,0xf4d8b0,0x8ad23a],[0x86898d,0x5a5d61,0xd8d8d8,0xd8a53a]].map((c,i)=>{const g=cat(...c);
  const pts=[[-4,182],[-14,214],[...(()=>{const h=window.__THS[(i*67)%window.__THS.length];return [h[0]+Math.sin(h[5])*(h[4]/2+1),h[1]+Math.cos(h[5])*(h[4]/2+1)]})()],[64,248],[-10,128]];const [x,z]=pts[i];g.position.set(x,0,z);g.rotation.y=Math.random()*6;g.visible=true;return {g,x,z,hx:x,hz:z,t:Math.random()*5,purr:0}});
for(const c of TCATS)scene.remove(c.g);TCATS.length=0;   // cizí kočky pryč – na dvorku jsou jen naše (Nikíšek, Mája)
function tcatTick(dt,t){const hr=DAY.t*24;for(const c of TCATS){if(c.yard){c.g.visible=hr>=8&&hr<19;if(!c.g.visible)continue}if(c.purr>0){c.purr-=dt;c.g.userData.tail&&(c.g.userData.tail.rotation.z=Math.sin(t*8)*.5);continue}c.t-=dt;if(c.t<=0){c.t=4+Math.random()*6;c.tx=c.hx+(Math.random()-.5)*6;c.tz=c.hz+(Math.random()-.5)*6}
  if(c.tx!=null){const dx=c.tx-c.x,dz=c.tz-c.z,d=Math.hypot(dx,dz);if(d>.2){c.x+=dx/d*dt*.8;c.z+=dz/d*dt*.8;c.g.rotation.y=Math.atan2(dx,dz)}c.g.position.set(c.x,0,c.z)}}}
for(const c of TCATS)spots.push({get x(){return c.x},get z(){return c.z},r:1.2,label:'Pohladit kočku',get hidden(){return inside||!c.g.visible},who:-1,act:()=>{c.purr=4;c.tx=null;play('meow',.5);STATS.pets++;toast(pick(['Kočka přede jak traktor.','Kočka se ti otřela o nohu a odešla, jako by se nic nestalo.','Mňau. Ještě. Za uchem.','Kočka tě pohladila ocasem. Jsi vyvolený.']))}});
spots.push({x:171,z:-290.6,r:1.6,label:'Vejít do vinného sklepa',who:-1,snd:'door',act:()=>enterRoom('sklep','Vinný sklep. Chladno, tma a voní to sudama.')},
 {in:'sklep',x:RM.sklep.cx,z:RM.sklep.cz+RM.sklep.d/2-.5,r:.9,label:'Odejít ze sklepa',who:-1,snd:'door',act:()=>exitRoom()},
 {in:'sklep',x:RM.sklep.cx,z:RM.sklep.cz+.75,r:1,label:'Ochutnat víno (zdarma)',who:-1,act:()=>{if(ECO.taste===DAY.n){toast('Sklepník: „Dneska už stačilo, Pavle.“');return}ECO.taste=DAY.n;energy(10);toast(pick(['Ryzlink vlašský. Kyselý jak tchyně, ale dobrý.','Frankovka z Kloboučských svahů. Hřeje.','Müller Thurgau. Pije se to samo.']))}},
 {in:'sklep',x:RM.sklep.cx+RM.sklep.w/2-.7,z:RM.sklep.cz,r:1,label:'Koupit láhev vína (180 Kč)',who:-1,act:()=>buy(180,()=>{ECO.babGift=1;toast('Láhev Frankovky. Babička ji ocení – zítra má pro tebe zakázku navíc.')})});
// ---------- trh na náměstí ----------
{const g=new THREE.Group();g.position.set(-16,0,198);g.rotation.y=Math.PI/2;scene.add(g);const b=(c,sx,sy,sz,x,y,z)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
 b(0x8a5a32,2.6,.08,1,0,.9,0);for(const [x,z] of [[-1.2,-.45],[1.2,-.45],[-1.2,.45],[1.2,.45]])b(0x6b4226,.08,2.3,.08,x,1.15,z);
 for(let k=0;k<6;k++)b(k%2?0xffffff:0xc8202a,.45,.06,1.3,-1.1+k*.44,2.32,0);
 for(const [x,c] of [[-.9,0xc8202a],[-.3,0x6aa832],[.3,0xf2a33a],[.9,0x8a3a5a]]){b(0xb08a5a,.5,.18,.6,x,1.03,0);for(let k=0;k<5;k++){const f=new THREE.Mesh(SPH,M(c));f.scale.setScalar(.07);f.position.set(x-.15+Math.random()*.3,1.16,-.2+Math.random()*.4);g.add(f)}}
 sign('TRH · OVOCE A ZELENINA',-16,2.6,198,Math.PI/2,2);solid(-16.5,196.7,-15.5,199.3,1)}
spots.push({x:-14.6,z:198,r:1.6,label:'Trh: nakoupit',who:-1,act:()=>openList('TRH NA NÁMĚSTÍ',[['Jablka (kg)',35,'+15 ⚡'],['Med od včelaře',120,'+20 ⚡, 2 min rychleji'],['Domácí klobása',89,'+35 ⚡'],['Burčák',60,'+10 ⚡ a dobrá nálada']].map(([n,pr,sub])=>({name:n,sub,price:pr,fn:()=>buy(pr,()=>{energy(n.startsWith('Domácí')?35:n.startsWith('Med')?20:n.startsWith('Jablka')?15:10);if(n.startsWith('Med'))ECO.buff=Math.max(ECO.buff,120);toast('Trhovkyně: „Děkuju, přijďte zas!“')})})))});
// ---------- panel „Dění na ulici“ (venku za areálem) ----------
function streetRows(pp){const r=[],hr=DAY.t*24;const near=(x,z)=>Math.hypot(x-pp.x,z-pp.z);
  const place=(x,z)=>{let best='Klobouky',bd=1e9;for(const L of LANDS){const d=near((L[0]+L[2])/2,(L[1]+L[3])/2);if(d<bd){bd=d;best=L[4]}}return bd<60?'u: '+best:'ve městě'};
  {const S0=STORY[ECO.story||0];if(S0)r.push('Mise · '+S0.t)}
  r.push('Ty · '+place(pp.x,pp.z)+(DRV.on?' · v autě':''));r.push('Počasí · '+WX.kind);
  if(WANT.lvl)r.push('Policie · '+cops.length+' aut'+(HELI.g.visible?' + vrtulník':'')+' · '+'★'.repeat(WANT.lvl));else r.push('Policie · klid');
  {const B=BUS;r.push('Autobus 109 · '+(B.wait>0?'stojí na zastávce':'jede')+' ('+Math.round(near(B.g.position.x,B.g.position.z))+' m)')}
  const walking=PEDS.filter(a=>!(a.hit>0)).length;r.push('Lidi venku · '+walking+(PEDS.some(a=>a.hit>0)?' · někdo leží na zemi!':''));
  r.push('Provoz · '+TRAF.filter(c=>c.kind==='traffic').length+' aut');
  {const [n,pr]=lidlDeal();r.push('Lidl akce dne · '+n.replace('PARKSIDE ','')+' '+fmtK(Math.round(pr*.7)))}
  if(ECO.job)r.push('Zakázka · '+ECO.job.name+' ('+Math.round(near((ECO.job.stage==='to'?ECO.job.to:ECO.job.at).x,(ECO.job.stage==='to'?ECO.job.to:ECO.job.at).z))+' m)');
  if(TRAK.c.kind==='tractor')r.push('Traktor John Deere · na poli');
  if(hr>=11.9&&hr<12.2||hr>=17.9&&hr<18.2)r.push('Kostel · zvoní zvony');
  const cat=TCATS.find(c=>near(c.x,c.z)<30);if(cat)r.push('Kočka · kousek od tebe');
  return r}
// ---------- ukládání (automaticky každý den + tlačítko v pauze) ----------
function saveGame(auto){const d={v:1,hardware,grannyRound:BAB.roundKey,serviceVersion:1,fault:babetta.fault,mail:MAIL.state,bikeParking:2,bike:[babetta.g.position.x,babetta.g.position.z,babetta.g.rotation.y,babetta.range,babetta.fuel??80],day:DAY.n,t:DAY.t,chars:people.map(h=>h.cs||null),owned:[...ECO.owned],built:[...ECO.built],mats:Object.keys(BUILDS).filter(k=>ECO['mat_'+k]),sites:Object.fromEntries(Object.entries(BSITES).map(([k,b])=>[k,[b.x,b.z]])),eggs:ECO.eggs||0,treasure:!!ECO.treasure,story:ECO.story||0,soldTotal:ECO.soldTotal||0,repairTotal:ECO.repairTotal||0,thiefTotal:ECO.thiefTotal||0,dartsWin:ECO.dartsWin||0,jobsTotal:ECO.jobsTotal||0,benchTotal:ECO.benchTotal||0,elec:!!ECO.elec,mat_elec:!!ECO.mat_elec,broken:[...ECO.broken]};
  try{localStorage.setItem('pk_save',JSON.stringify(d));if(!auto)toast('Hra uložena.')}catch(e){toast('Uložení se nepovedlo.')}}
function loadGame(){let d=null;try{d=JSON.parse(localStorage.getItem('pk_save')||'null')}catch(_){}if(!d||d.v!==1)return false;
  if(Array.isArray(d.bike)&&d.bike.length===5&&d.bike.every(Number.isFinite)){const [x,z,r,range,fuel]=d.bike;if(d.bikeParking===2){babetta.g.position.set(x,0,z);babetta.g.rotation.y=r}babetta.range=d.serviceVersion?range:range>0?bikeRange():0;babetta.fault=d.fault||null;babetta.fuel=fuel;carBox(babetta.g,true)}
  Object.assign(hardware,d.hardware||{});BAB.roundKey=d.grannyRound;Object.assign(MAIL.state,d.mail||{donated:d.day||0});DAY.n=d.day||0;people.forEach((h,i)=>{if(d.chars&&d.chars[i])h.cs=d.chars[i]});for(const k of d.owned||[])ECO.owned.add(k);refreshWall();ECO.eggs=d.eggs||0;ECO.treasure=d.treasure;ECO.story=d.story||0;ECO.soldTotal=d.soldTotal||0;ECO.repairTotal=d.repairTotal||0;ECO.thiefTotal=d.thiefTotal||0;ECO.dartsWin=d.dartsWin||0;ECO.jobsTotal=d.jobsTotal||0;ECO.benchTotal=d.benchTotal||0;ECO.mat_elec=d.mat_elec;if(d.elec){ECO.elec=1;RM.flat.L=.9}for(const b of d.broken||[])ECO.broken.add(b);
  for(const k of d.mats||[])ECO['mat_'+k]=1;for(const k of d.built||[]){const s0=d.sites&&d.sites[k];if(s0&&BSITES[k]){BSITES[k].x=s0[0];BSITES[k].z=s0[1];BSITES[k].g.position.set(s0[0],0,s0[1])}ECO['mat_'+k]=1;ECO.built.delete(k);buildIt(k,true)}return true}
// hospoda: vstup, pivo, šipky
spots.push({get x(){return window.__pubDoor[0]},get z(){return window.__pubDoor[1]},r:1.8,label:'Vejít do hospody U Zámku',who:-1,snd:'door',act:()=>enterRoom('hospoda','Hospoda U Zámku. Kouř, Gambrinus a štamgasti, co tu sedí od rána.')},
 {in:'hospoda',x:RM.hospoda.cx,z:RM.hospoda.cz+RM.hospoda.d/2-.4,r:.9,label:'Odejít',who:-1,snd:'door',act:()=>exitRoom()},
 {in:'hospoda',x:RM.hospoda.cx-RM.hospoda.w/2+2.4,z:RM.hospoda.cz-RM.hospoda.d/2+2.3,r:1.2,label:'Výčep',who:-1,act:()=>openList('HOSPODA U ZÁMKU',[['Pivo 10°',39,'+10 ⚡',10],['Pivo 12°',49,'+12 ⚡',12],['Utopenec',55,'+20 ⚡',20],['Topinka s česnekem',65,'+25 ⚡',25],['Fernet',45,'+5 ⚡, odvaha',5]].map(([n,pr,sub,en])=>({name:n,sub,price:pr,fn:()=>buy(pr,()=>{energy(en);if(n.startsWith('Pivo')||n==='Fernet')charState().drunkUntil=DAY.n+DAY.t+.035;toast(pick(['Hospodský: „Na zdraví!“','Štamgast: „Ty jsi od Parksidu, ne? Ty dílnu nikdy nedoděláte.“','Štamgast: „Za mých časů se svařovalo kyslíkem!“']))})})))},
 {in:'hospoda',x:RM.hospoda.cx+RM.hospoda.w/2-1,z:RM.hospoda.cz+.1,r:1.1,label:'Šipky (sázka 50 Kč)',who:-1,act:()=>{if(ECO.money<50){toast('Na sázku nemáš.');return}money(-50);miniStart('Šipky – trefuj střed',3,(miss)=>{if(miss===0){ECO.dartsWin=(ECO.dartsWin||0)+1;money(200,'Tři do středu! Štamgasti platí 200 Kč a koukají jak puk.')}else if(miss<3){money(80,'Slušný. Vyhrál jsi 80 Kč.')}else toast('Vedle jak jedle. Štamgasti se smějou.')})}});
// benzínka: zastav u stojanu v autě
for(const [x,z] of window.__pumps){
  const can=new THREE.Group();
  function piece(dx,y,dz,w,h,l,color){
    const mesh=new THREE.Mesh(BOX,M(color));mesh.position.set(dx,y,dz);mesh.scale.set(w,h,l);can.add(mesh)
  }
  piece(0,.24,0,.39,.47,.21,0xb82322);piece(-.11,.51,0,.045,.1,.065,0xa92121);
  piece(.05,.51,0,.045,.1,.065,0xa92121);piece(-.03,.565,0,.21,.04,.065,0xa92121);
  piece(.14,.5,0,.09,.07,.09,0x252525);can.position.set(x-1.35,0,z);scene.add(can);
  spots.push({x:x-1.8,z,r:2,label:'Benzín a olej pro Babetu',who:-1,act:()=>pumpMenu(nearPumpBike()?babetta:null)})
}
function nearPumpBike(){return window.__pumps.some(([x,z])=>Math.hypot(x-babetta.g.position.x,z-babetta.g.position.z)<5)}
function atPump(car){return Math.abs(DRV.v)<1&&window.__pumps.some(([x,z])=>Math.hypot(x-car.g.position.x,z-car.g.position.z)<5)}
function pumpMenu(car){
  const bike=car===babetta,rows=[];
  function reserve(){const cs=charState();cs.fuelCans=(cs.fuelCans||0)+1}
  function purchase(price,fill,can){const cs=charState();if(cs.pumpBill){toast('Nejdřív zaplať předchozí tankování u kasy.');return}if(price>ECO.money){toast('Na tankování nemáš dost peněz.');return}cs.pumpBill=price;{
    if(fill){car.fuel=100;car.lowWarn=0}
    if(can)reserve();hudEco();saveGame(true);toast('U pokladny benzínky zaplať '+price+' Kč.')
  }}
  if(car){const missing=100-(car.fuel??80),cost=Math.ceil(missing*(bike?2.1:19));
    rows.push({name:bike?'Přimíchat 2T olej a natankovat Babetu':'Natankovat auto',price:cost,off:missing<=0,fn:()=>purchase(cost,true,false)});
    if(bike&&missing>0)rows.push({name:'Natankovat směs + vzít rezervní kanystr',price:cost+210,fn:()=>purchase(cost+210,true,true)})
  }
  rows.push({name:'Namíchat benzín s 2T olejem do kanystru',sub:'5 l směsi pro Babetu',price:210,fn:()=>purchase(210,false,true)});
  if(DRV.on)rows.push({name:'Vystoupit u stojanu',fn:exitCar});
  openList('BENZINA · stojan',rows)
}
function fuelTick(dt){if(!DRV.on||!DRV.car)return;const c=DRV.car;if(c.fuel==null)c.fuel=40+Math.random()*50;c.fuel=Math.max(0,c.fuel-Math.abs(DRV.v)*dt*.035);
  if(c===babetta&&c.fuel<=0){if(DRV.v)toast('Babeta je bez benzínu. Sesedni a dojeď pro kanystr na BENZINA.');DRV.v=0}if(c.fuel<=0&&Math.abs(DRV.v)>2)DRV.v*=.9;if(c.fuel<12&&!c.lowWarn){c.lowWarn=1;toast('Dochází benzín! Benzínka BENZINA je v Kloboukách.')}
}
// ---------- slepice a vejce (z kurníku) ----------
const EGGS=new THREE.Group();scene.add(EGGS);let eggDay=-1;
function henTick(dt){if(!window.__hens||!ECO.built.has('coop'))return;for(const H of window.__hens){H.t-=dt;if(H.t<=0){H.t=1+Math.random()*3;H.tx=(Math.random()-.5)*3;H.tz=.9+Math.random()*1.6}const p=H.h.position,dx=H.tx-p.x,dz=H.tz-p.z,d=Math.hypot(dx,dz);if(d>.05){p.x+=dx/d*dt*.6;p.z+=dz/d*dt*.6;H.h.rotation.y=Math.atan2(dx,dz)}H.h.children[1].position.y=.36+Math.max(0,Math.sin(performance.now()/120+H.tx))*.04}
  if(eggDay!==DAY.n&&DAY.t*24>=7){eggDay=DAY.n;const B=BSITES.coop;EGGS.clear();const n=2+Math.floor(Math.random()*3);for(let i=0;i<n;i++){const e=new THREE.Mesh(SPH,M(0xf4ead8));e.scale.set(.05,.065,.05);e.position.set(B.x+(Math.random()-.5)*1.2,.06,B.z+.9+Math.random()*.5);EGGS.add(e)}}}
spots.push({get x(){return BSITES.coop?BSITES.coop.x:0},get z(){return BSITES.coop?BSITES.coop.z+1.2:-999},r:1.4,get label(){return 'Sebrat vejce ('+EGGS.children.length+')'},get hidden(){return inside||!ECO.built.has('coop')||!EGGS.children.length},who:-1,
  act:()=>{const n=EGGS.children.length;ECO.eggs=(ECO.eggs||0)+n;EGGS.clear();play('click',.4);toast('Sebral jsi '+n+' vajec. Máš '+ECO.eggs+' ks – prodáš je v COOPu (nebo babičce).')}});
// ---------- psi na vodítku (L): Pavel nebo Tereza je vezme na procházku i do města ----------
const LEASH=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(18),3)),new THREE.LineBasicMaterial({color:0xc8202a}));LEASH.frustumCulled=false;scene.add(LEASH);
function leashFollow(d,dt){const p=leashOwner||P(),dd=Math.hypot(d.x-p.x,d.z-p.z);d.obj.visible=true;if(dd>5){d.x=p.x-Math.sin(p.head||0)*1.2+(d===ashley?-.5:.5);d.z=p.z-Math.cos(p.head||0)*1.2;d.y=p.y||0;d.vy=0}if(dd>1.4)goTo(d,p.x+(d===ashley?-.6:d===jackie?.6:0),p.z-.4,d.speed*(dd>4?1.4:1),dt,1);else step(d,0,0,0,dt);
  if(d===boban&&!inside&&(d.robCD=(d.robCD||0)-dt)<=0){for(const a of PEDS){if(a.hit>0)continue;if(Math.hypot(a.x-d.x,a.z-d.z)<1.3){d.robCD=25;const it=pick(['mobil','rohlík','klobásu','rukavici','klíče','svačinu']);toast('Boban vytrhl kolemjdoucímu z ruky '+it+'! Chlap nadává: „Ty čokle jeden!“');play('bark_boban',.6);if(it==='mobil'||it==='klíče')ECO.bobanLoot=(ECO.bobanLoot||0)+1;break}}}}
let leashOwner=null;
function toggleLeash(){const p=P();if(p!==pavel&&p!==tereza){toast('Na procházku psy berou Pavel nebo Tereza.');return}
  const dogs=[ashley,jackie,boban];const on=dogs.filter(d=>d.leash);if(on.length){for(const d of on){d.leash=false;d.mode=d===boban?'follow':'wander'}leashOwner=null;toast('Psi jsou z vodítka.');return}
  const near=dogs.filter(d=>d.obj.visible&&Math.hypot(d.x-p.x,d.z-p.z)<3);if(!near.length){toast('Žádný pes u tebe není (do 3 m).');return}const hr=DAY.t*24;if(hr>=19||hr<7){toast('Večer už psi ven nejdou.');return}
  for(const d of near.slice(0,2)){d.leash=true;d.atHome=false}leashOwner=p;toast('Na vodítku: '+near.slice(0,2).map(d=>d===ashley?'Ashley':d===jackie?'Jackie':'Boban').join(' a ')+'. L = pustit. Ven přes bránu.')}
function leashTick(){const dogs=[ashley,jackie,boban].filter(d=>d.leash);LEASH.visible=dogs.length>0&&!inside;if(!LEASH.visible)return;const p=leashOwner||P(),a=LEASH.geometry.attributes.position;
  const hr=DAY.t*24;if(hr>=19&&!outsideYard(p)){for(const d of dogs)d.leash=false;return}
  dogs.forEach((d,i)=>{a.setXYZ(i*2,p.x,(p.y||0)+.95,p.z);a.setXYZ(i*2+1,d.x,(d.y||0)+.38,d.z)});for(let i=dogs.length*2;i<6;i++)a.setXYZ(i,p.x,(p.y||0)+.95,p.z);a.needsUpdate=true}
// ---------- zloděj ve městě: okrade chodce a utíká – chyť ho (E) ----------
const TTH={a:null,t:0,cd:90};
function townThiefTick(dt){if(inside)return;const p=P(),hr=DAY.t*24;
  if(!TTH.a){TTH.car=null;TTH.mug=false;if(!outsideYard(p)&&p.x<60)return;TTH.cd-=dt*((hr>=22||hr<5)?2:1);if(TTH.cd>0)return;const v=PEDS.filter(a=>!a.idle&&!(a.hit>0)&&Math.hypot(a.x-p.x,a.z-p.z)<45&&Math.hypot(a.x-p.x,a.z-p.z)>12);if(!v.length)return;const vic=pick(v);
    TTH.a=agent(person(0xe0b48c,0x2b2b2b,0x2b3446,0x111111),vic.x+1,vic.z,{speed:4.4,r:.3});TTH.t=30;TTH.cd=(hr>=22||hr<5)?35+Math.random()*40:150+Math.random()*120;const near=VEH.filter(c=>c.kind==='parked'&&Math.hypot(c.g.position.x-vic.x,c.g.position.z-vic.z)<28);
    if(near.length&&Math.random()<.55){TTH.car=pick(near);toast('Někdo se plíží k zaparkovanému autu. Můžeš ho chytit.')}
    else if((hr>=22||hr<5)&&!DRV.on){TTH.mug=true;toast('Ze tmy se k tobě blíží kapsář.')}
    else toast('Zloděj vytrhl kolemjdoucí kabelku a utíká! Chyť ho (E).');play('bark_collie',.2);return}
  const a=TTH.a;TTH.t-=dt;const dx=a.x-p.x,dz=a.z-p.z,d=Math.hypot(dx,dz)||1;if(TTH.car&&TTH.car.kind==='parked'){
    const car=TTH.car,pos=car.g.position;if(goTo(a,pos.x+1.2,pos.z,2.6,dt,.7)){
      let best=null,dist=Infinity;for(let i=0;i<GN.length;i++)for(const j of GA[i]){const [x,z]=GN[i],[u,v]=GN[j],sx=u-x,sz=v-z,t=Math.max(0,Math.min(1,((pos.x-x)*sx+(pos.z-z)*sz)/(sx*sx+sz*sz||1))),dd=Math.hypot(pos.x-x-t*sx,pos.z-z-t*sz);if(dd<dist){dist=dd;best={a:i,b:j,t}}}
      if(best){carBox(car.g,false);Object.assign(car,best,{kind:'traffic',v:2,max:12,offX:pos.x,offZ:pos.z,offT:1.5});TRAF.push(car);play('car_alarm',.4);toast('Zloděj odjíždí ukradeným autem.')}
      scene.remove(a.obj);TTH.a=null;return
    }
  }else if(TTH.mug&&!DRV.on){if(d<1.2){TTH.mug=false;const loss=Math.min(ECO.money,40+Math.floor(Math.random()*100));money(-loss,'Kapsář ti sebral '+loss+' Kč!');saveGame(true)}else goTo(a,p.x,p.z,2.7,dt,.8)}
  else step(a,dx/d,dz/d,d<10?a.speed:a.speed*.6,dt);
  if(TTH.t<=0||d>80){scene.remove(a.obj);TTH.a=null;if(d<80)toast('Zloděj ti zmizel v uličkách.')}}
spots.push({get x(){return TTH.a?TTH.a.x:0},get z(){return TTH.a?TTH.a.z:-999},r:1.6,label:'Chytit zloděje!',get hidden(){return !TTH.a||inside},who:-1,act:()=>{scene.remove(TTH.a.obj);TTH.a=null;play('kick',.5);ECO.thiefTotal=(ECO.thiefTotal||0)+1;money(300,'Chytil jsi zloděje a vrátil kabelku. Paní ti dala 300 Kč odměnu!')}});
// ---------- dílna: pracovní stůl se zakázkami (svařování / šroubování / broušení) a opravy nářadí ----------
ECO.broken=new Set();
const hardware={screws:0,bolts:0,boards:0,lubosDay:-1};
const depot=window.__shops.vlcek;
const lubos=agent(person(0xe1ae86,0xcf892c,0x29343b,0x493121),depot.x+2,depot.z,{name:'Luboš'});lubos.obj.position.set(lubos.x,0,lubos.z);
for(const side of [-1,1]){const brow=new THREE.Mesh(BOX,M(0x462c22));brow.scale.set(.12,.033,.04);brow.position.set(side*.083,.04,.168);brow.rotation.z=side*.38;lubos.obj.userData.head.add(brow)}
const lubosRoute=[[depot.x,depot.z],...roadPath(nearNode(depot.x,depot.z),nearNode(X(-60),Z(0))),[X(-60),Z(0)],[X(486),Z(0)],[X(486),Z(100)],[X(520),Z(380)],[X(900),Z(380)],[X(1028)-.9,flatDoorZ]];
const lubosLengths=lubosRoute.slice(1).map(([x,z],i)=>Math.hypot(x-lubosRoute[i][0],z-lubosRoute[i][1]));
const lubosDistance=lubosLengths.reduce((a,b)=>a+b,0);
const feeds=[];
function cornerFeeds(name,cx,cz,w,d,angle,height){
  const c=Math.cos(angle),s=Math.sin(angle);
  for(const side of [-1,1])for(const end of [1,-1]){
    const x=cx+side*(w/2+.12)*c+end*(d/2+.24)*s,z=cz-side*(w/2+.12)*s+end*(d/2+.24)*c;
    const dx=-side*c+.48*end*s,dz=side*s+.48*end*c;
    feeds.push({name:name+' · '+(side<0?'levý':'pravý')+' '+(end>0?'přední':'zadní'),x,z,y:height-.35,dx,dz})
  }
}
for(const [name,a,b,c,d] of [['Dílna',787,151,1021,307],['Pavlův byt',1028,150,1180,551],['Hlavní dům',40,1425,1275,1640],['Dům u zahrady',62,558,552,1133],['Byty',552,558,658,1133],['Simonův dům',OX+22/S,OY+248/S,OX+33/S,OY+257/S]]){
  cornerFeeds(name,(X(a)+X(c))/2,(Z(b)+Z(d))/2,X(c)-X(a),Z(d)-Z(b),0,3)
}
for(const [name,x,z,dx,dz] of [['Dvůr · brána',490,65,0,1],['Dvůr · ponk',756,170,-.3,1],['Dvůr · pergola',545,1410,0,-1],['Dvůr · cvičiště',1170,1115,-.7,-1],['Bazén',565,-260,-.4,1]]){
  feeds.push({name,x:X(x),z:Z(z),y:2.7,dx,dz});pbox(x-2,z-2,x+2,z+2,0,2.8,0x62686e,false)
}

for(const lens of [false,true]){
  const mesh=new THREE.InstancedMesh(BOX,M(lens?0x182632:0xeae8dd),feeds.length),o=new THREE.Object3D();
  feeds.forEach((f,i)=>{o.position.set(f.x+(lens?.16*f.dx:0),f.y,f.z+(lens?.16*f.dz:0));o.rotation.y=Math.atan2(f.dx,f.dz);o.scale.set(lens?.13:.21,lens?.1:.16,lens?.05:.32);o.updateMatrix();mesh.setMatrixAt(i,o.matrix)});scene.add(mesh)
}
const feedCam=new THREE.PerspectiveCamera(80,16/9,.05,350);
function feedFrame(i,dest){
  const f=feeds[i];feedCam.position.set(f.x,f.y,f.z);feedCam.lookAt(f.x+4*f.dx,.65,f.z+4*f.dz);
  const target=R.getRenderTarget();R.setRenderTarget(null);R.render(scene,feedCam);
  dest.getContext('2d').drawImage(canvas,0,0,dest.width,dest.height);R.setRenderTarget(target)
}
function cameraTV(){
  const panel=$('cameraTV'),sel=$('cameraSelect');
  if(!sel.options.length)feeds.forEach((f,i)=>sel.add(new Option(f.name,i)));
  const record=hardware.evidence,button=$('cameraCatch');
  let still=panel.querySelector('img');if(!still){still=document.createElement('img');still.alt='Záznam od dveří dílny';button.before(still)}
  still.hidden=!record?.photo;if(record?.photo)still.src=record.photo;
  button.hidden=!record;
  if(record){button.textContent='Den '+record.day+' · záznam u dílny · usvědčit Luboše';button.onclick=()=>{
    ECO.owned.add(record.id);hardware.evidence=null;refreshWall();saveGame(true);button.hidden=true;panel.close();toast('Luboš vrátil '+TOOLS.find(t=>t[0]===record.id)[1]+'.')
  }}
  if(document.pointerLockElement)document.exitPointerLock();panel.showModal()
}
spots.push({in:'hdum',x:181+6.3,z:-2.7+2.6,r:.95,label:'Televize · bezpečnostní kamery',who:-1,act:cameraTV});
function workshopTheft(hr){
  if(hr<16.5||hr>=16.75||hardware.evidence)return false;
  if(hardware.theftDay!==DAY.n){hardware.theftDay=DAY.n;hardware.attempt=Math.random()<.35;saveGame(true)}
  if(!hardware.attempt)return false;
  lubos.x=X(900);lubos.z=Z(307)+.85;lubos.obj.visible=true;lubos.obj.position.set(lubos.x,0,lubos.z);lubos.obj.rotation.y=Math.PI;
  lubos.obj.traverse(o=>o.layers.set(0));lubos.obj.userData.arms[0].rotation.x=-1;
  if(hr>=16.6){hardware.attempt=false;const available=[...ECO.owned].filter(id=>id!==tool.id&&id!=='welder'&&TOOLS.some(t=>t[0]===id));
    if(available.length){const id=pick(available);ECO.owned.delete(id);hardware.evidence={id,day:DAY.n};
      const still=document.createElement('canvas');still.width=320;still.height=180;feedFrame(0,still);
      try{hardware.evidence.photo=still.toDataURL('image/jpeg',.65)}catch(e){/* Local file textures can restrict image export. */}
      refreshWall();saveGame(true)}
  }
  return true
}
function lubosTick(){
  const hr=DAY.t*24,onRoad=hr>=8&&hr<10||hr>=17&&hr<19,atFlat=hr>=10&&hr<17;
  if(hardware.kickedDay===DAY.n){lubos.obj.visible=false;return}if(workshopTheft(hr))return;
  if(atFlat&&hardware.visitNotice!==DAY.n&&P()===pavel){hardware.visitNotice=DAY.n;toast('Luboš: Pavle, jsem u tebe v bytě. Brousím trámy do pěti.')}
  const t=DAY.t*DAY.len;
  lubos.obj.visible=onRoad?!inside:inside&&room===(atFlat?'flat':'vlcek');if(!lubos.obj.visible)return;
  if(onRoad){
    let d=(hr<10?hr-8:19-hr)*lubosDistance/2,i=0;
    while(i<lubosLengths.length-1&&d>lubosLengths[i])d-=lubosLengths[i++];
    const [x,z]=lubosRoute[i],[tx,tz]=lubosRoute[i+1],u=d/(lubosLengths[i]||1);
    lubos.x=x+(tx-x)*u;lubos.z=z+(tz-z)*u;lubos.obj.rotation.y=Math.atan2(tx-x,tz-z)+(hr>=15?Math.PI:0)
  }else{
    lubos.x=atFlat?FX+2.4:RM.vlcek.cx+2.3;lubos.z=atFlat?FZ-1.85:-2.3+Math.sin(t*.35)*.65;lubos.obj.rotation.y=atFlat?Math.PI:1.5;
    if(!atFlat&&hardware.lubosDay!==DAY.n&&Math.floor(t)%19===0){
      hardware.lubosDay=DAY.n;if(Math.random()<.35){toast('Luboš se rozhlédl a schoval si balíček vrutů z regálu do kapsy.');hardware.missingPacks=(hardware.missingPacks||0)+1}
    }
  }
  lubos.obj.traverse(o=>o.layers.set(onRoad?0:2));lubos.obj.position.set(lubos.x,onRoad?.035*Math.abs(Math.sin(t*6)):0,lubos.z);
  lubos.obj.userData.arms[0].rotation.x=atFlat?-.95+.28*Math.sin(t*15):-.5+.35*Math.sin(t*5);
}
spots.push({in:2,x:FX+2.4,z:FZ-1.85,r:1.2,label:'Luboš · broušení trámů · F vyhodit',get hidden(){return !lubos.obj.visible||hardware.kickedDay===DAY.n||DAY.t*24<10||DAY.t*24>=17},who:-1,msg:'Luboš: Ještě tenhle trám a můžeš ho natřít.'});
const shelfGoods=[
  [['Rajčata',32,15],['Mrkev',18,12],['Paprika',24,14]],
  [['Mléčná čokoláda',39,20],['Hořká čokoláda',45,22]],
  [['Kinder vajíčko',35,16],['Nutella',99,35]]
];
const supplies=[
  [['screws','Vruty do dřeva · 20 ks',49,20],['bolts','Šrouby M8 s maticemi · 8 ks',69,8],['bits','Sada vrtáků',179,1],['anchors','Hmoždinky 8 mm',65,20],['washers','Podložky M8',29,20],['hinges','Panty na vrátka',119,2]],
  [['woodGlue','Disperzní lepidlo na dřevo',89,1],['mountGlue','Montážní lepidlo',149,1],['boards','Sada prken na stůl',290,1],['sand','Písek 25 kg',69,1],['gravel','Štěrk 25 kg',85,1],['beams','Smrkové trámy',490,2]]
];
function shoppingShelf(key,i){
  if(key==='benapol'){openList('BENAPOL · potraviny',shelfGoods[i].map(([name,price,n])=>({name,price,sub:name==='Kinder vajíčko'?'Do kapsy · můžeš darovat Milanovi':'+'+n+' energie',fn:()=>buy(price,()=>{if(name==='Kinder vajíčko'){charState().egg=(charState().egg||0)+1;saveGame(true);toast('Kinder vajíčko máš v kapse.');return}energy(n);toast(name+' · doplněna energie.');saveGame(true)})})));return}
  if(i===2){const katalog=LIDL.map(([name,price,id],i)=>[id+'_festa',name.replace('PARKSIDE','FESTA'),(DAY.n+i)%4===0?Math.round(price*.82):price]);openList('FESTA · pouze ve stavebninách',[...katalog,['hammer_festa','Kladivo',219],['tape_festa','Metr 5 m',119]].map(([id,name,price])=>({name,price,off:ECO.owned.has(id),fn:()=>buy(price,()=>{ECO.owned.add(id);refreshWall();saveGame(true)})})));return}
  openList('Miloš Vlček · regál',supplies[i].map(([id,name,price,n])=>({name,price,sub:'Ve skladu: '+(hardware[id]||0),fn:()=>buy(price,()=>{hardware[id]=(hardware[id]||0)+n;saveGame(true);toast(name+' přidáno do skladu.')})})))
}
for(const key of ['benapol','vlcek']){
  const r=RM[key],labels=key==='benapol'?['Zelenina','Čokolády','Kinder a Nutella']:['Šrouby, vruty a vrtáky','Lepidla a dřevo','Nářadí FESTA'];
  labels.forEach((label,i)=>{for(const side of (key==='vlcek'&&i===2?[1]:[-1,1]))spots.push({in:key,x:r.cx+side*(r.w/2-1.55),z:-3+i*2.7,r:1.32,label,who:-1,act:()=>shoppingShelf(key,i)})});
  spots.push({in:key,x:r.cx,z:r.d/2-.45,r:1.25,label:'Vyjít ven',who:-1,act:()=>exitRoom()})
}
spots.push({in:'vlcek',x:RM.vlcek.cx,z:-3.05,r:1.6,label:'Miloš · nářadí a materiál',who:-1,act:()=>openList('Miloš Vlček',[{name:'Nářadí FESTA',close:false,fn:()=>afterGameTime(()=>shoppingShelf('vlcek',2),50)},{name:'Stavební materiál',fn:()=>afterGameTime(shopMaterials,50)}])});
function benchJobs(){if(babetta.fault==='bench'&&P()===pavel){miniStart('Generálka motoru Babety na ponku',6,()=>{babetta.fault='install';saveGame(true);toast('Hotovo. Namontuj motor do Babety před dílnou.')});return}const J=[['Svařit stojan na kola pro souseda','welder','hold',450,'Svářečka (je za Bytem 2)'],['Přišroubovat police do sklepa','screwdriver','tap',300,'Šroubovák'],['Zbrousit rez z vrat','grinder','stroke',380,'Úhlová bruska (Lidl)'],['Svařit zábradlí','welder','hold',700,'Svářečka (je za Bytem 2)'],['Smontovat skříňku','drill','tap',350,'Aku vrtačka (Lidl)']];
  const rows=J.map(([n,tl,mode,pay,need])=>{const candidates=[tl,tl+'_festa',tl+'_p',tl+'_p_festa'].filter(id=>ECO.owned.has(id));tl=candidates.find(id=>!ECO.broken.has(id))||candidates[0];const has=!!tl,br=ECO.broken.has(tl);return {name:n,sub:!has?'potřebuješ: '+need:br?'nářadí je rozbité – oprav ho':({hold:'svařování – drž linku',tap:'šroubování – rytmus',stroke:'broušení – tahy myší'})[mode],price:pay,off:!has||br,fn:()=>{if(P()!==pavel&&P()!==simon){toast('V dílně pracují Pavel a Simon.');return}
    miniStart(n,mode==='tap'?5:4,(miss)=>{const got=Math.round(pay*(1+Math.max(0,ECO.owned.size-5)*.05)*(miss===0?1.15:miss>3?.7:1)/10)*10;energy(-12);money(got,'Hotovo: '+n+'. '+fmtK(got)+'.');STATS.jobs=(STATS.jobs||0)+1;ECO.benchTotal=(ECO.benchTotal||0)+1;if(Math.random()<.12){ECO.broken.add(tl);toast((TOOLS.find(t=>t[0]===tl)||[0,tl])[1]+' se rozbilo! Oprav ho u stolu.')}},mode)}}});
  rows.unshift({name:'Vyrobit stůl podle výkresu',sub:'1 sada prken, 8 vrutů, 4 šrouby M8 · Miloš Vlček',price:850,off:hardware.boards<1||hardware.screws<8||hardware.bolts<4,fn:()=>{
    miniStart('Montáž stolu · 120 × 60 × 75 cm',5,()=>{hardware.boards--;hardware.screws-=8;hardware.bolts-=4;money(850,'Stůl je hotový a předaný. +850 Kč');saveGame(true)});
    $('tablePlan').hidden=false
  }});
  for(const tl of ECO.broken)rows.unshift({name:'Opravit: '+((TOOLS.find(t=>t[0]===tl)||[0,tl])[1]),sub:'náhradní díly 150 Kč + práce',price:150,fn:()=>buy(150,()=>miniStart('Opravuješ nářadí',4,()=>{ECO.broken.delete(tl);toast('Opraveno, jede jak nové.')}))});
  openList('PRACOVNÍ STŮL – ZAKÁZKY Z DÍLNY',rows)}
spots.push({in:1,x:IX+1.2,z:IZ-.3,r:1.1,label:'Pracovní stůl – zakázky',who:-1,act:()=>benchJobs()});
// ---------- hlavní příběh: Pavel dodělá dílnu a vydělá ----------
const STORY=[
 {t:'Udělej první zakázku (K = seznam zakázek).',ok:()=>(ECO.jobsTotal||0)>=1,pay:500,msg:'Dobrý začátek! Babička je na tebe pyšná.'},
 {t:'Kup si v Lidlu první nové PARKSIDE nářadí.',ok:()=>ECO.owned.size>5,pay:300,msg:'Nové nářadí visí v dílně na stěně.'},
 {t:'Kup v Elkovu elektro a oprav elektriku v Pavlově bytě.',ok:()=>!!ECO.elec,pay:1000,tool:'multimeter',msg:'Konečně světlo! Simon ti daroval multimetr.'},
 {t:'Postav něco na dvorku (Vlček → plot, kurník nebo pergola).',ok:()=>ECO.built.size>=1,pay:800,msg:'Táta: „No vida, něco umíš.“'},
 {t:'Udělej 3 zakázky z dílny u pracovního stolu.',ok:()=>(ECO.benchTotal||0)>=3,pay:1200,tool:'grinder',msg:'Dílna začíná vydělávat. Dostal jsi úhlovou brusku!'},
 {t:'Prodej Simonovi kradené auto (přijeď před jeho auto, V).',ok:()=>(ECO.soldTotal||0)>=1,pay:600,msg:'Simon: „S tebou se dá obchodovat.“'},
 {t:'Nech Simona opravit rozbité auto (přivez vrak na dvorek).',ok:()=>(ECO.repairTotal||0)>=1,pay:800,msg:'Simon to dal dohromady. Jede to!'},
 {t:'Chyť zloděje ve městě.',ok:()=>(ECO.thiefTotal||0)>=1,pay:700,msg:'Městská policie ti poděkovala.'},
 {t:'Kup si v Lidlu 3 další PARKSIDE nářadí.',ok:()=>ECO.owned.size>=9,pay:1000,tool:'hammerdrill',msg:'Dílna je vybavená jako nikdy. Bonus: příklepová vrtačka!'},
 {t:'Postav na dvorku plot, kurník i pergolu.',ok:()=>ECO.built.size>=3,pay:2000,msg:'Dvorek je k nepoznání. Babička peče na oslavu.'},
 {t:'Vyhraj v hospodě v šipkách (3 do středu).',ok:()=>(ECO.dartsWin||0)>=1,pay:300,msg:'Štamgasti tě berou mezi sebe.'},
 {t:'Našetři 20 000 Kč (Pavel) na dodělání dílny.',ok:()=>(pavel.cs?pavel.cs.money:0)>=20000,pay:0,msg:'DÍLNA PARKSIDE je hotová! Pavel je šéf.'}];
function storyTick(){const i=ECO.story||0;if(i>=STORY.length)return;const S0=STORY[i];if(S0.ok()){ECO.story=i+1;if(S0.pay)money(S0.pay);if(S0.tool){ECO.owned.add(S0.tool);refreshWall()}toast('★ Mise splněna: '+S0.msg+(S0.pay?' (+'+fmtK(S0.pay)+')':''),6);play('coin',.6);
  const n=STORY[ECO.story];if(n)afterGameTime(()=>toast('Další mise: '+n.t,6),4000)}}
spots.push({in:'byt1',x:160-5+4.4,z:-3+1.6,r:1.2,get label(){return P()===tereza&&ECO.tz&&ECO.tz.day===DAY.n&&!ECO.tz.clean?'Uklidit kuchyň':'Kuchyňská linka'},who:-1,act:()=>{if(!(P()===tereza&&ECO.tz&&ECO.tz.day===DAY.n&&!ECO.tz.clean)){toast('Na lince je hrnek od kafe a psí miska.');return}miniStart('Drhneš kuchyň',4,()=>{ECO.tz.clean=1;energy(-8);money(250,'Byt 1 se leskne. (+250 Kč)')},'stroke')}});
// ---------- zvuky města (ptáci, vzdálený provoz, déšť) – WebAudio, bez souborů ----------
const AMB={ac:null,noise:null,g:null,bird:3};
function ambTick(dt){if(!audioOn||!started){if(AMB.g)AMB.g.gain.value=0;return}
  try{if(!AMB.ac){AMB.ac=BELLAC||(BELLAC=new (window.AudioContext||window.webkitAudioContext)());const ac=AMB.ac,len=ac.sampleRate*2,buf=ac.createBuffer(1,len,ac.sampleRate),d=buf.getChannelData(0);let b=0;for(let i=0;i<len;i++){b=(b+.02*(Math.random()*2-1))/1.02;d[i]=b*3}
     const src=ac.createBufferSource();src.buffer=buf;src.loop=true;const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=420;const g=ac.createGain();g.gain.value=0;src.connect(f).connect(g).connect(ac.destination);src.start();AMB.g=g;AMB.f=f}
   const p=P(),town=!inside&&(outsideYard(p)||p.x>=60),rain=RAIN.visible;const target=inside?0:(town?.05+Math.min(.06,TRAF.length*.003):.012)+(rain?.09:0);AMB.g.gain.value+=(target-AMB.g.gain.value)*Math.min(1,dt*2);AMB.f.frequency.value=rain?2400:420;
   AMB.bird-=dt;const hr=DAY.t*24;if(AMB.bird<=0){AMB.bird=2+Math.random()*6;if(!inside&&!rain&&hr>5&&hr<20){const ac=AMB.ac,t0=ac.currentTime;for(let k=0;k<2+Math.floor(Math.random()*4);k++){const o=ac.createOscillator(),g=ac.createGain(),t1=t0+k*.13,f0=2200+Math.random()*1800;o.frequency.setValueAtTime(f0,t1);o.frequency.exponentialRampToValueAtTime(f0*1.4,t1+.08);g.gain.setValueAtTime(0,t1);g.gain.linearRampToValueAtTime(.025,t1+.01);g.gain.exponentialRampToValueAtTime(.0001,t1+.1);o.connect(g).connect(ac.destination);o.start(t1);o.stop(t1+.12)}}}}catch(_){}}
// ---------- Simon opravuje rozbitá auta na dvorku ----------
function wreckInYard(){for(const c of VEH){if(!c.g.visible||c===DRV.car)continue;if((c.kind==='wreck'||(c.dmg||0)>25)&&c.g.position.x<60&&!outsideYard(c.g.position))return c}return null}
function simonRepairTick(dt){const c=wreckInYard();if(!c||SIM.state!=='work'||simon===P()){if(ECO.rep)ECO.rep=null;return}
  if(!ECO.rep||ECO.rep.c!==c){ECO.rep={c,t:0,said:0};if(!inside)toast('Simon: „Co to je za vrak? Dej mi chvilku, opravím to.“')}
  const R=ECO.rep,tx=c.g.position.x+1.6,tz=c.g.position.z;if(Math.hypot(simon.x-tx,simon.z-tz)>1.2){goTo(simon,tx,tz,simon.speed,dt,1);return}
  R.t+=dt;if(Math.floor(R.t*2)%2===0&&(R.k=(R.k||0)+dt)>.5){R.k=0;play('screw',distVol(simon,.35))}
  if(R.t>12){repairCar(c);ECO.repairTotal=(ECO.repairTotal||0)+1;ECO.rep=null;if(c.kind==='stolen'||c.kind==='stolenPolice'||c.kind==='abandoned')c.value=Math.round(carValue(c)*1.2);toast('Simon: „Hotovo, jede to jak nový.“ Auto je opravené.')}}
spots.push({get x(){const c=wreckInYard();return c?c.g.position.x:0},get z(){const c=wreckInYard();return c?c.g.position.z+2.2:-999},r:2,label:'Opravit auto sám',get hidden(){return inside||DRV.on||!wreckInYard()||(P()!==pavel&&P()!==simon)},who:-1,
  act:()=>{const c=wreckInYard();if(!c)return;miniStart('Opravuješ auto',5,()=>{repairCar(c);ECO.repairTotal=(ECO.repairTotal||0)+1;energy(-15);toast('Auto je opravené.')})}});
// ---------- autobus do Hustopečí (Lidl) – zastávka před naším domem (zkušebně) ----------
{const stop=(x,z,t)=>{const p0=new THREE.Mesh(BOX,M(0x8a8f96));p0.scale.set(.08,2.6,.08);p0.position.set(x,1.3,z);scene.add(p0);sign(t,x,2.5,z,Math.PI/2,1.6);const r=new THREE.Mesh(BOX,STDM({color:0xcfe8ff,transparent:true,opacity:.5}));r.scale.set(1.4,.08,3);r.position.set(x+.8,2.4,z);scene.add(r)};
 stop(-16.6,-25,'BUS → HUSTOPEČE');stop(695.6,25,'BUS → KLOBOUKY')}
const husBus=BUS.g.clone(true);scene.add(husBus);husBus.visible=false;
const husDisplay=husBus.getObjectByName('destination');
if(husDisplay){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const c=canvas.getContext('2d');c.fillStyle='#111';c.fillRect(0,0,256,64);c.fillStyle='#ffc040';c.font='bold 37px monospace';c.fillText('HUSTOPEČE',20,46);husDisplay.material=BASM({map:new THREE.CanvasTexture(canvas)})}
function husPhase(){const minute=DAY.t*1440;return minute-(minute>=950?960:840)}
function husBoard(){return husPhase()>=0&&husPhase()<20}
let busTransfer=false;
function husTick(){
  const remote=P().x>600,phase=husPhase();husBus.visible=remote||(phase>=-10&&phase<30);
  if(!husBus.visible)return;
  husBus.rotation.y=remote?Math.PI:0;
  if(remote)husBus.position.set(692,0,25);
  else husBus.position.set(-18.7,0,-25+(phase<0?phase:Math.max(0,phase-20))*3);
  husDisplay.material=remote?returnDisplay:outboundDisplay;
}
const outboundDisplay=husDisplay.material;
const returnCanvas=document.createElement('canvas');returnCanvas.width=256;returnCanvas.height=64;
const returnText=returnCanvas.getContext('2d');returnText.fillStyle='#111';returnText.fillRect(0,0,256,64);returnText.fillStyle='#ffc040';returnText.font='bold 36px monospace';returnText.fillText('KLOBOUKY',22,46);
const returnDisplay=BASM({map:new THREE.CanvasTexture(returnCanvas)});
function busLanding(remote){
  const x=remote?696:-15.8,z=remote?27:-25;
  for(const offset of [0,1,-1,2,-2,3,-3,4,-4]){
    for(const side of [0,.7,-.7,1.4,-1.4]){
      if([[0,0],[.65,0],[-.65,0],[0,.65],[0,-.65]].every(([dx,dz])=>!blocked(x+side+dx,z+offset+dz,0,.4,.35)))return {x:x+side,z:z+offset}
    }
  }
  return null
}
function busRide(to){
  if(busTransfer)return;
  const remote=to==='hus';
  if(remote&&!husBoard()){toast('Hustopeče: příjezd 14:00 a 16:00, autobus čeká 20 herních minut.');return}
  if(ECO.money<25){toast('Na jízdenku (25 Kč) nemáš.');return}
  const pt=busLanding(remote);if(!pt){toast('Výstup je zablokovaný. Zkus to za chvíli.');return}
  busTransfer=true;money(-25);play('door',.5);fade(()=>{
    const p=P();p.x=pt.x;p.z=pt.z;p.y=groundAt(pt.x,pt.z,0);p.vy=0;p.head=Math.PI/2;p.obj.position.set(p.x,p.y,p.z);
    yaw=p.head+Math.PI;camT.set(p.x,1.35,p.z);DAY.t=Math.min(.999,DAY.t+25/1440);husTick();busTransfer=false;
    toast(remote?'Hustopeče. Vystupuješ u parkoviště Lidlu.':'Jsi zpátky v Kloboukách před domem.')
  })
}
spots.push({x:-15.8,z:-25,r:3,get label(){return husBoard()?'Nastoupit · Hustopeče (25 Kč)':'Jízdní řád · Hustopeče 14:00 a 16:00'},get hidden(){return inside||DRV.on},who:-1,act:()=>busRide('hus')},
 {x:696,z:26,r:3,label:'Autobus zpátky do Klobouk (25 Kč)',get hidden(){return inside||DRV.on},who:-1,act:()=>busRide('klo')});
// ---------- mluvení s lidmi na ulici (hlas doplníme později) ----------
const TALK=['„Dobrý den, mladej. Ty jsi od těch z Krátké, ne?“','„Lidl? Ten je v Hustopečích, jezdí tam autobus.“','„Zase prší… nebo neprší? Já už nevím.“','„Ten Simon s tím Golfem, to je kapitola sama pro sebe.“','„Na náměstí je dneska trh, mají dobrý med.“','„V hospodě U Zámku točí dobrý dvanáctky.“','„Neviděl jste tu malýho psa? Nějakej mi sebral rohlík!“','„Pozor na městskou, dneska stojí u kostela.“','„Ty sklepy u Příční, tam se pije nejlíp.“','„Pracujete? Já bych potřeboval posekat trávu…“'];
function talkPed(a){a.talk=4;a.obj.rotation.y=Math.atan2(P().x-a.x,P().z-a.z);play('click',.25);toast('Kolemjdoucí: '+pick(TALK));if(Math.random()<.25&&!ECO.job){if(ECO.offerDay!==DAY.n)makeOffers();toast('Kolemjdoucí má pro tebe práci – mrkni na zakázky (K).',5)}}
// ---------- spaní: každá postava ve svém pokoji (Pavel na matraci, Tereza v Bytě 1, Simon v hlavním domě) ----------
function sleepHere(who,where){const p=P();if(p!==who){toast('Tady spí '+(who===pavel?'Pavel':who===tereza?'Tereza':'Simon')+'.');return}const hr=DAY.t*24,rain=WX.kind==='déšť'||WX.kind==='mlha';
  if(!(hr>=19||hr<6||rain)){toast('Teď se ještě spát nechce. Spát můžeš večer, v noci nebo když prší.');return}
  fade(()=>{energy(100);if(hr>=19||hr<6){DAY.t=.9999;toast('Vyspal ses '+where+'. Dobré ráno!')}else{DAY.t=Math.min(.95,DAY.t+3/24);WX.kind='jasno';WX.next=DAY.t*24+DAY.n*24+4;WX.k=0;RAIN.visible=false;toast('Prospal jsi déšť '+where+'. Venku už je hezky.')}})}
spots.push({in:'hdum',x:181+5.7,z:-2.7+4.6,r:1,label:'Gauč – vyspat se (Simon)',who:-1,act:()=>sleepHere(simon,'na gauči u rodičů')});
// ---------- velká mapa (M) s waypointem: klikni na mapu = cíl, klik na cíl = smazat ----------
const WPT={on:false,x:0,z:0};
const WPM=(()=>{const g=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(1.4,.14,8,24),BASM({color:0x3aa0ff}));ring.rotation.x=Math.PI/2;ring.position.y=.2;g.add(ring);const beam=new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,40,12,1,true),BASM({color:0x3aa0ff,transparent:true,opacity:.22,depthWrite:false}));beam.position.y=20;g.add(beam);g.visible=false;scene.add(g);return g})();
const BIG=(()=>{const c=document.createElement('canvas');c.id='bigmap';c.width=900;c.height=900;Object.assign(c.style,{position:'fixed',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(88vmin,900px)',height:'min(88vmin,900px)',borderRadius:'18px',boxShadow:'0 10px 40px #000a',zIndex:30,display:'none',cursor:'crosshair',background:'#6fa95a'});document.body.appendChild(c);return c})();
const BMV={x1:TOWN.x1-10,z1:TOWN.z1-10,s:900/Math.max(TOWN.x2-TOWN.x1+20,TOWN.z2-TOWN.z1+20)};
function toggleBigMap(){const on=BIG.style.display==='none';BIG.style.display=on?'block':'none';if(on){if(document.pointerLockElement)document.exitPointerLock();drawBigMap()}else relock()}
function drawBigMap(){const g=BIG.getContext('2d'),S=BMV.s;g.setTransform(1,0,0,1,0,0);g.fillStyle='#6fa95a';g.fillRect(0,0,900,900);g.setTransform(S,0,0,S,-BMV.x1*S,-BMV.z1*S);
  for(const [a,b,c,d,col] of window.__RD||[]){g.fillStyle=col;g.fillRect(X(a),Z(b),(c-a)/40,(d-b)/40)}
  g.lineCap='round';for(const s0 of SEG){g.strokeStyle='#4a4d52';g.lineWidth=s0.w+1.5;g.beginPath();g.moveTo(s0.a[0],s0.a[1]);g.lineTo(s0.b[0],s0.b[1]);g.stroke()}
  g.fillStyle='#e9d8b8';for(const h of window.__THS||[])g.fillRect(h[0]-h[2],h[1]-h[2],h[2]*2,h[2]*2);for(const [a,b,c,d] of window.__HS||[])g.fillRect(X(a),Z(b),(c-a)/40,(d-b)/40);
  for(const [a,b,c,d,col] of mapRects){g.fillStyle=col;g.fillRect(X(a),Z(b),(c-a)/40,(d-b)/40)}
  g.font='bold 7px Rubik, sans-serif';g.textAlign='center';for(const L of LANDS){g.fillStyle=L[4]==='hřiště'?'#3f8a3a':'#d9c7a0';g.fillRect(L[0],L[1],L[2]-L[0],L[3]-L[1]);g.fillStyle='#1d2b22';g.fillText(L[4].toUpperCase(),(L[0]+L[2])/2,(L[1]+L[3])/2+2)}
  g.fillStyle='#1f4d3a';g.fillText('DOMOV',0,-2);
  if(ECO.job){const tg=ECO.job.stage==='to'?ECO.job.to:ECO.job.at;g.fillStyle='#ffd23a';g.beginPath();g.arc(tg.x,tg.z,3,0,7);g.fill()}
  if(WPT.on){g.fillStyle='#3aa0ff';g.strokeStyle='#fff';g.lineWidth=1;g.beginPath();g.arc(WPT.x,WPT.z,3.2,0,7);g.fill();g.stroke()}
  const p=DRV.on?DRV.car.g.position:P(),hd=DRV.on?DRV.car.g.rotation.y:P().head;g.save();g.translate(p.x,p.z);g.rotate(-hd);g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=.8;g.beginPath();g.moveTo(0,5);g.lineTo(3.5,-3.5);g.lineTo(0,-1.5);g.lineTo(-3.5,-3.5);g.closePath();g.fill();g.stroke();g.restore();
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#000a';g.fillRect(0,860,900,40);g.fillStyle='#fff';g.font='bold 18px Rubik, sans-serif';g.textAlign='center';g.fillText('Klobouky u Brna · klik = waypoint · klik na waypoint = smazat · M = zavřít',450,886)}
BIG.addEventListener('click',e=>{const r=BIG.getBoundingClientRect(),mx=(e.clientX-r.left)/r.width*900,my=(e.clientY-r.top)/r.height*900,x=mx/BMV.s+BMV.x1,z=my/BMV.s+BMV.z1;
  if(WPT.on&&Math.hypot(WPT.x-x,WPT.z-z)<8){WPT.on=false;WPM.visible=false;toast('Waypoint smazán.')}else{WPT.on=true;WPT.x=x;WPT.z=z;WPM.position.set(x,0,z);WPM.visible=true;toast('Waypoint nastaven – modrý sloup a tečka v radaru.')}drawBigMap()});
function wpTick(dt){if(BIG.style.display!=='none'&&(WPT._t=(WPT._t||0)+dt)>.5){WPT._t=0;drawBigMap()}if(!WPT.on)return;WPM.children[0].rotation.z+=dt;WPM.visible=!inside;const p=DRV.on?DRV.car.g.position:P();if(Math.hypot(p.x-WPT.x,p.z-WPT.z)<4){WPT.on=false;WPM.visible=false;toast('Jsi v cíli.')}}
// ---------- Milan si občas přes den dojde do Benapolu (pak i do večerky pro kinder vajíčka) ----------
const MOUT={st:'home',day:-1,path:[],i:0,t:0,hr:11+Math.random()*5};
function milanOutTick(dt){const hr=DAY.t*24;
  if(MOUT.st==='home'){if(ML.state!=='home'||MOUT.day===DAY.n||hr<MOUT.hr||hr>18.5)return;MOUT.day=DAY.n;MOUT.hr=10+Math.random()*7;
    const S0=window.__shops.benapol,yard=[[X(682)+1,Z(1090)],[3,-3.2],[4.2,-5],[2.4,-6.2],[-3.6,-6.2],[-3.9,-15.8],[X(486),Z(95)],[X(486),Z(0)],[X(-60),Z(0)]];
    MOUT.path=yard.concat(roadPath(nearNode(X(-60),Z(0)),nearNode(S0.x,S0.z)).map(([x,z])=>[x+2,z+2]),[[S0.x,S0.z]]);MOUT.i=0;MOUT.st='out';milan.x=yard[0][0];milan.z=yard[0][1];milan.y=groundAt(milan.x,milan.z,5);milan.vy=0;milan.obj.visible=true;
    YARDCTX=true;toast('Milan: „Skočím do Benapolu, něco potřebuju.“');YARDCTX=false;return}
  if(MOUT.st==='shop'){MOUT.t-=dt;if(MOUT.t<=0){MOUT.st='back';MOUT.i=MOUT.path.length-1;milan.obj.visible=true}return}
  const back=MOUT.st==='back',[tx,tz]=MOUT.path[MOUT.i];if(MOUT.i>=5&&MOUT.i<=8&&!GATE.open){toggleGate();MOUT.gate=1}
  const d=Math.hypot(tx-milan.x,tz-milan.z);if(d<(MOUT.ld??1e9)-.05){MOUT.ld=d;MOUT.stk=0}else if((MOUT.stk=(MOUT.stk||0)+dt)>2.5){milan.x=tx;milan.z=tz;milan.y=groundAt(tx,tz,5);MOUT.stk=0}
  if(goTo(milan,tx,tz,milan.speed||3,dt,.6)){MOUT.ld=1e9;MOUT.i+=back?-1:1;if(MOUT.gate&&(back?MOUT.i<5:MOUT.i>9)){if(GATE.open)toggleGate();MOUT.gate=0}
    if(!back&&MOUT.i>=MOUT.path.length){MOUT.st='shop';MOUT.t=25;milan.obj.visible=false}
    if(back&&MOUT.i<0){MOUT.st='home';milan.obj.visible=false;YARDCTX=true;toast('Milan se vrátil z Benapolu s taškou potravin.');YARDCTX=false}}}
// ---------- počasí: střídá se jasno / zataženo / déšť / mlha ----------
const WX={kind:'jasno',next:0,k:0};
const RAIN=(()=>{const n=2200,pos=new Float32Array(n*6);for(let i=0;i<n;i++){const x=(Math.random()-.5)*60,y=Math.random()*25,z=(Math.random()-.5)*60;pos.set([x,y,z,x+.05,y-.7,z],i*6)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));const m=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x9fb4c8,transparent:true,opacity:.5}));m.frustumCulled=false;m.visible=false;scene.add(m);return m})();
function weatherTick(dt){const hr=DAY.t*24+DAY.n*24;if(hr>=WX.next){const r=Math.random();WX.kind=r<.45?'jasno':r<.7?'zataženo':r<.88?'déšť':'mlha';WX.next=hr+2+Math.random()*4;if(!inside&&started&&WX.kind!=='jasno')toast(WX.kind==='déšť'?'Začíná pršet.':WX.kind==='mlha'?'Padá mlha.':'Zatahuje se.')}
  const tk=WX.kind==='jasno'?0:WX.kind==='zataženo'?.6:WX.kind==='déšť'?1:.8;WX.k+=(tk-WX.k)*Math.min(1,dt*.3);
  sun.intensity*=1-WX.k*.65;hemi.intensity*=1-WX.k*.2;
  const fog=WX.kind==='mlha'?1:WX.kind==='déšť'?.5:0;WX.f=(WX.f||0)+(fog-(WX.f||0))*Math.min(1,dt*.3);scene.fog.near=120-WX.f*105;scene.fog.far=520-WX.f*440;
  RAIN.visible=WX.kind==='déšť'&&!inside&&WX.k>.5;if(RAIN.visible){RAIN.position.set(cam.position.x,cam.position.y-8,cam.position.z);RAIN.position.y-=(performance.now()/40)%7}}
// ---------- hlavní smyčka ekonomiky ----------
let ecoMin=-1;
function ecoTick(dt,t){miniTick(dt);milanOutTick(dt);wpTick(dt);if(!inside){YARDCTX=true;simonRepairTick(dt);YARDCTX=false}ambTick(dt);terezaTick();if(started&&(ECO._st=(ECO._st||0)+dt)>1){ECO._st=0;storyTick()}leashTick();townThiefTick(dt);ghostTick();fuelTick(dt);weatherTick(dt);henTick(dt);{const gc=inside?0xcfc6b8:0x6a8f4a;if(hemi.groundColor.getHex()!==gc)hemi.groundColor.setHex(gc)}
  if(inside&&room==='hdum'&&window.__parents){const {mom,dad}=window.__parents,tt=performance.now()/1000;mom.userData.arms[1].rotation.x=-1.1+Math.sin(tt*5)*.35;mom.userData.arms[1].rotation.z=Math.cos(tt*5)*.25;mom.userData.head.rotation.x=.25;dad.userData.head.rotation.y=Math.sin(tt*.3)*.15;dad.userData.arms[0].rotation.x=-.9;dad.userData.arms[1].rotation.x=-.9+Math.sin(tt*.8)*.05}if(ECO.buff>0)ECO.buff=Math.max(0,ECO.buff-dt);
  const m=Math.floor(DAY.t*1440);if(m!==ecoMin){if(ecoMin>=0&&!DRV.on&&started){const p=P();if(p===pavel||p===simon)energy(-.06)}ecoMin=m}
  if(!inside){jobTick(dt,t);jobDogTick(dt);busTick(dt);trakTick(dt);pedTick(dt);ballTick(dt);tcatTick(dt,t)}YARDCTX=true;babTick(dt,t);ukrTick(dt);YARDCTX=false;radioTick(dt);
  if(DRV.on&&DRV.car&&['stolen','stolenPolice'].includes(DRV.car.kind)){const d=Math.hypot(DRV.car.g.position.x-golf.position.x,DRV.car.g.position.z-golf.position.z);if(d<9&&Math.abs(DRV.v)<1&&!ECO.sellHint){ECO.sellHint=1;toast('Simon: „Co to máš za káru? Dám ti za ni '+fmtK(carValue(DRV.car))+'.“ (G = prodat)')}if(d>14)ECO.sellHint=0}
  hudEco()}
function use(){
  if(!started||guest)return;
  {const c0=nearest();if(c0&&c0.ped){talkPed(c0.ped);return}}
  if(ECO.placing&&!inside&&!DRV.on&&P()===pavel&&GHOST.visible){placeBuild();return}
  if(DRV.on){if(atPump(DRV.car))pumpMenu(DRV.car);else exitCar();return}
  if(ctrl){animalAction();return}
  if(!cur)return;
  if(cur.task){startTask();return}
  if(cur.lender){openLoans(cur.lender);return}
  if(cur.car){toast('F · nastoupit');return}
  if(cur.ground){pickGround(cur.ground);return}
  if(cur.carry){toast(carry.name+' položen k autu – Simon ho namontuje.');dropCarry();return}
  if(cur.ashley){toast(pick(['Ashley to spolkla dřív, než jsi stihl cokoli udělat.','Ashley se na tebe podívala a polkla.','Pozdě. Je to v Ashley.']));return}
  if(cur.thief){chaseThief(pick(['Vyhnal jsi ho. Utekl přes zeď s prázdnou.','Zloděj se lekl a zdrhá zpátky do buněk.','Ani nestihl nic vzít.']));return}
  if(cur.milan&&charState().egg){openList('Milan',[{name:'Darovat Kinder vajíčko',fn:()=>{charState().egg--;saveGame(true);toast('Milan: Kinder! Díky, Pavle. Schovám si ho po práci.')}},{name:'Pozdravit',fn:()=>toast(pick(milanLines))}]);return}
  if(cur.milan){toast(milanLines[Math.floor(Math.random()*milanLines.length)]);return}
  if(cur.jackie){jackie.petted=true;STATS.pets++;jackie.timer=3.5;play('bark_collie',.35);toast(['Jackie je v sedmém nebi.','Jackie se ti opřela o nohy a nechce pustit.','Drbání za uchem: splněno.','Jackie ti olízla ruku. Celou.'][Math.floor(Math.random()*4)]);return}
  if(cur.boban){if(boban.mode==='steal')giveBack('Máš to zpátky. Boban je uražený.');else kickBoban();return}
  if(cur.who>=0&&cur.who!==act){toast('Přepni na postavu '+people[cur.who].name+'.');return}
  if(sitting){standUp();toast('Vstal jsi.');return}
  if(cur.snd)play(cur.snd);
  if(cur.act){cur.act();return}
  toast(cur.msg);
}
let toastT=0;
let YARDCTX=false;   // oznámení z dvorku (kočky, babička, psi…) jen když je hráč u domu
function farFromHome(){if(inside)return ['hospoda','lidl','pekarna','sklep'].includes(room);const p=DRV.on&&DRV.car?DRV.car.g.position:P();return (p.x>=60||outsideYard(p))&&Math.hypot(p.x+4.3,p.z+18)>28}
function toast(t,dur){if(YARDCTX&&farFromHome())return;const el=$('toast');el.textContent=t;el.classList.add('on');toastT=dur||Math.max(2.8,t.length/22)}


// ---------- věci na zemi, které Ashley pořád žere ----------
const crumbs=[],SNACKS=['rohlík','ponožku','šroubek','kus listí','Bobanův pamlsek','žvýkačku','kus kompostu','zbytek párku','klacík','něco, co radši nechceš vědět'];
const crumbAreas=[[580,1150,1160,1400],[930,810,1150,1110],[770,610,900,1120],[925,760,1150,785],[110,1150,540,1400],[460,420,610,640]];
function spawnCrumb(){if(crumbs.length>=9)return;const a=pick(crumbAreas),x=X(rnd(a[0],a[2])),z=Z(rnd(a[1],a[3]));if(blocked(x,z,0,.2))return;
  const m=new THREE.Mesh(SPH,M(pick([0xd9a55a,0x8a5a32,0xf4f4f0,0x6b8f3a,0xc8202a,0xb08a5a])));m.scale.set(.07,.04,.09);m.position.set(x,groundAt(x,z,0)+.03,z);scene.add(m);
  crumbs.push({x,z,m,name:pick(SNACKS)})}
for(let i=0;i<6;i++)spawnCrumb();
let crumbT=5;
function ashleySnack(d,dt,t){                    // vrací true, pokud Ashley zrovna jde žrát nebo žere
  if(d.mode==='eat'){d.timer-=dt;step(d,0,0,0,dt);const h=d.obj.userData.head;h.rotation.x=.55+Math.sin(t*18)*.14;
    if(d.timer<=0){h.rotation.x=0;d.mode='wander';d.tx=d.x;d.tz=d.z;
      if(d.food&&Math.hypot(d.x-P().x,d.z-P().z)<7&&Math.random()<.6)toast('Ashley sežrala '+d.food+'.');d.food=null}
    return true}
  if(d.mode==='sniff'){const c=d.crumb;if(!crumbs.includes(c)){d.mode='wander';return false}
    if(goTo(d,c.x,c.z,d.speed*.75,dt,.45)){scene.remove(c.m);crumbs.splice(crumbs.indexOf(c),1);d.mode='eat';d.timer=2.4;d.food=c.name;STATS.eaten++;play('chew',distVol(d,.6),1500)}
    else d.obj.userData.head.rotation.x=.35;
    return true}
  // čenichá pořád: když je něco blízko, jde po tom
  if(crumbs.length&&d.mode!=='cat'&&!d.vy){
    let best=null,bd=act===1?3:7;for(const c of crumbs){const dd=Math.hypot(c.x-d.x,c.z-d.z);if(dd<bd){bd=dd;best=c}}
    if(best&&Math.random()<dt*(act===1?.15:.35)){d.mode='sniff';d.crumb=best;d.wait=0;return true}}
  return false;
}


// ---------- psi večer zalézají domů (19:00–7:00) ----------
const HOME={x:X(990),z:Z(1425)-.7};
const homeOf=d=>d===boban?{x:X(113),z:Z(1425)-.8}:{x:X(658)+.8,z:Z(1090)};   // Jackie a Ashley do Bytu 1, Boban do hlavního domu
function dogHome(d,dt){
  const hr=DAY.t*24,nt=hr>=19||hr<7;
  if(d.atHome){if(!nt){const H=homeOf(d);d.atHome=false;d.obj.visible=true;d.x=H.x;d.z=H.z;d.y=groundAt(H.x,H.z,5);d.vy=0;d.mode=d===boban?'follow':'wander';d.tx=d.x;d.tz=d.z}else return true}
  if(nt&&!d.fly&&d.mode!=='steal'&&!(d===boban&&inside)){
    if(d.mode==='cuddle'||d.mode==='eat'||d.mode==='sniff'||d.mode==='cat'){d.mode='wander';d.obj.userData.head.rotation.set(0,0,0)}
    const H=homeOf(d);if(goTo(d,H.x,H.z,d.speed*.8,dt,.45)){d.atHome=true;d.obj.visible=false;if(!inside&&Math.hypot(d.x-P().x,d.z-P().z)<14)play('door',.4,800)}
    return true}
  return false;
}

// ---------- AI psů ----------
const gardenPt=()=>({x:X(666+Math.random()*5),z:Z(1180+Math.random()*50)});
const trainPt=()=>({x:X(940+Math.random()*205),z:Z(815+Math.random()*290)});
function dogAI(d,side,dt,t){
  if(d===ctrl)return;
  if(d.leash){leashFollow(d,dt);return}
  if(d.train){trainTick(d,dt,t);return}
  if(dogHome(d,dt))return;
  if(BAB.call&&babicka.obj.visible&&!inside){goTo(d,babicka.x+(d===ashley?-.8:d===jackie?.8:0),babicka.z-.9,d.speed,dt,.5);return}
  if(d.mode==='play')d.mode='wander';
  if(inside&&d.mode==='cuddle'){d.mode='wander';d.obj.userData.head.rotation.set(0,0,0)}
  if(!d.vy&&Math.random()<dt*(d===jackie?.06:.03))d.vy=3.4;
  if(d.mode==='cat'){if(MJ.run){goTo(d,maja.position.x,maja.position.z,d.speed*1.25,dt,.3);if(Math.random()<dt*.8)play('bark_collie',distVol(d,.6),700);return}d.mode='wander'}
  if(d===ashley&&!inside&&ashleySnack(d,dt,t))return;
  if(d===ashley&&P()!==tereza&&!tereza.asleep&&!tereza.sleepPath){
    d.mode='play';goTo(d,tereza.x+Math.sin(t*1.3)*1.3,tereza.z+Math.cos(t*1.3)*1.3,3.2,dt,.2);return
  }
  if(d===jackie){
    d.cudT=(d.cudT??30)-dt;
    if(d.mode!=='cuddle'&&d.cudT<=0&&!inside&&!ctrl){d.mode='cuddle';d.timer=8;d.petted=false;d.whined=false}
    if(d.mode==='cuddle'){
      const p=P(),tx=p.x+Math.sin(p.head)*.75,tz=p.z+Math.cos(p.head)*.75;
      const at=goTo(d,tx,tz,d.speed,dt,.35);
      const hd=d.obj.userData.head;
      if(at&&!d.whined){d.whined=true;play('whine',distVol(d,.6))}
      if(at){d.head=Math.atan2(p.x-d.x,p.z-d.z);d.obj.rotation.y=d.head;hd.rotation.z=Math.sin(t*6)*.3;hd.rotation.x=-.2}
      d.obj.userData.tail.rotation.z=Math.sin(t*20)*.6;
      d.timer-=dt*(at?1:.3);
      if(d.timer<=0){d.mode='wander';d.tx=d.x;d.tz=d.z;hd.rotation.set(0,0,0);d.cudT=d.petted?50+Math.random()*30:30+Math.random()*20;
        if(!d.petted&&Math.hypot(p.x-d.x,p.z-d.z)<6)toast('Jackie odešla uraženě. Chtěla se mazlit.')}
      return;
    }
  }
  d.barkT=(d.barkT??(6+Math.random()*10))-dt;
  if(d.barkT<=0){d.barkT=20+Math.random()*25;if(d.mode==='chase'||act===1||Math.random()<.4)play('bark_collie',distVol(d,.6))}
  if(act===1&&!inside){
    const p=tereza,ox=Math.cos(p.head)*side*.9,oz=-Math.sin(p.head)*side*.9;
    const bx=p.x-Math.sin(p.head)*.7+ox,bz=p.z-Math.cos(p.head)*.7+oz;
    d.mode='follow';goTo(d,bx,bz,d.speed,dt,.35);return;
  }
  if(d.mode==='follow'){d.mode='wander';d.wait=0}
  if(d.wait>0){d.wait-=dt;step(d,0,0,0,dt);
    if(d.mode==='dig'){d.obj.rotation.x=Math.sin(t*20)*.12;if(Math.random()<dt*.6)addHole()}
    return}
  d.obj.rotation.x=0;
  if(goTo(d,d.tx,d.tz,d.mode==='chase'?d.speed*1.1:d.speed*.42,dt)){
    if(d.mode==='dig'){d.wait=4;d.head=-Math.PI/2;play('dig',distVol(d,.7,14));return}
    if(d.mode==='tun1'){d.mode='tun2';d.tx=X(1135);d.tz=Z(955);return}
    if(d.mode==='tun2'){d.mode='wander';d.wait=1;return}
    const r=Math.random();
    if(d===ashley&&r<.12){const g=gardenPt();d.tx=g.x;d.tz=g.z;d.mode='dig'}
    else if(d===jackie&&r<.08){d.mode='chase';d.tx=boban.x;d.tz=boban.z;d.wait=0}
    else if(r<.25){d.mode='tun1';d.tx=X(1135);d.tz=Z(785)}
    else{const p=trainPt();d.tx=p.x;d.tz=p.z;d.mode='wander';d.wait=3+Math.random()*6}
  }
  if(d.mode==='chase'){d.tx=boban.x;d.tz=boban.z;if(Math.random()<dt*.35)d.mode='wander'}
}
const yardMom=agent(person(0xf0c8a8,0xb5506a,0x3a3a5a,0x8a5a3a),X(113),Z(1425)-1,{speed:1.8,r:.26,reach:.25});yardMom.obj.visible=false;
const kibble=new THREE.Group();scene.add(kibble);
for(let i=0;i<12;i++){const pellet=new THREE.Mesh(SPH,M(0x885635));pellet.scale.set(.035,.025,.032);pellet.position.set(Math.cos(i*2.4)*.12,.03,Math.sin(i*2.4)*.12);kibble.add(pellet)}
kibble.visible=false;
const momVisit={slot:-1,called:false,fed:false,scolded:false};
function momTick(dt){
  const hr=DAY.t*24,slot=hr>=9&&hr<10?0:hr>=16&&hr<17?1:-1;
  window.__momKitchen.visible=slot<0;kibble.visible=false;
  if(slot<0){yardMom.obj.visible=false;return}
  const key=DAY.n*2+slot;
  if(momVisit.slot!==key){Object.assign(momVisit,{slot:key,called:false,fed:false,scolded:false});yardMom.x=X(113);yardMom.z=Z(1425)-1;yardMom.y=0;yardMom.vy=0}
  yardMom.obj.visible=true;
  goTo(yardMom,X(164),Z(1355),1.8,dt,.35);
  kibble.visible=!inside&&!momVisit.fed;kibble.position.set(yardMom.x+.55,0,yardMom.z);const audible=!inside&&Math.hypot(P().x-yardMom.x,P().z-yardMom.z)<14;
  if(audible&&Math.hypot(P().x-yardMom.x,P().z-yardMom.z)<8&&P()===pavel){yardMom.head=Math.atan2(P().x-yardMom.x,P().z-yardMom.z);yardMom.obj.rotation.y=yardMom.head}
  if(!momVisit.scolded&&audible&&P()===pavel){momVisit.scolded=true;toast(pick(['Máma: Kdo nechal mokré prádlo v pračce?!','Máma: Ten šedý Voyager zase zabral dvě místa!','Máma: Pavle, Boban má v misce piliny!','Máma: Pavle! Proč má ten kýbl ucho zase otočený ke zdi?!','Máma: Pavle, kdo postavil hrábě zubama k sousedům?!']))}
  else if(!momVisit.called&&audible){momVisit.called=true;toast('Máma: Bobánku, pojď k paničce pro granulky!')}
}
function feedBoban(dt,t){
  if(!yardMom.obj.visible||inside||boban.fly||boban.atHome||boban.leash||boban.mode==='steal'||momVisit.fed)return false;
  if(goTo(boban,yardMom.x+.55,yardMom.z,boban.speed,dt,.55)){
    boban.treatTime=(boban.treatTime||0)+dt;boban.obj.userData.tail.rotation.z=Math.sin(t*32)*1.1;boban.obj.userData.head.rotation.x=.42;
    if(boban.treatTime>3){boban.treatTime=0;boban.obj.userData.head.rotation.x=0;momVisit.fed=true;boban.angry=0;if(Math.hypot(P().x-yardMom.x,P().z-yardMom.z)<14)toast('Boban zhltnul máminy granule a radostí vrtí celým zadkem.')}
  }return true
}
function bobanAI(dt,t){momTick(dt);if(feedBoban(dt,t))return;
  if(boban.leash&&boban!==ctrl){leashFollow(boban,dt);return}
  const b=boban,p=P();
  b.kickCD=Math.max(0,b.kickCD-dt);
  // let po odkopnutí
  if(b.fly){
    const f=b.fly;f.t+=dt;const k=Math.min(1,f.t/f.dur);
    b.x=f.x0+(f.x1-f.x0)*k;b.z=f.z0+(f.z1-f.z0)*k;b.y=f.y0+(f.y1-f.y0)*k+4*f.h*k*(1-k);
    b.obj.position.set(b.x,b.y,b.z);b.obj.rotation.x+=dt*14;b.obj.rotation.z=Math.sin(t*20)*.4;
    if(k>=1){b.fly=null;b.y=f.y1;b.vy=0;b.obj.rotation.set(0,b.head,0);b.dazed=2.5;b.mode='follow';boing(220,.5,.35)}
    b.obj.userData.tail.rotation.z=Math.sin(t*30)*.8;return;
  }
  if(dogHome(b,dt)){b.barking=0;return}
  if(b.dazed>0){b.dazed-=dt;step(b,0,0,0,dt);b.obj.rotation.z=Math.sin(t*9)*.25;b.obj.userData.head.rotation.y=Math.sin(t*7)*.5;
    if(b.dazed<=0)b.obj.userData.head.rotation.y=0;return}
  // krádež nářadí
  b.stealT-=dt;
  if(b.mode==='follow'&&b.stealT<=0&&p===holder&&Math.hypot(p.x-b.x,p.z-b.z)<2.5&&tool.held){
    b.mode='steal';b.timer=22;STATS.steals++;tool.held=false;handTool.visible=false;mouthTool.visible=true;
    toast('Boban ti ukradl '+toolName().toLowerCase()+'! Chyť ho (E) nebo ho odkopni (F).');play('growl',distVol(b,.7));
  }
  b.hideT=(b.hideT??(70+Math.random()*60))-dt;
  if(b.mode==='follow'&&b.hideT<=0&&!inside&&!b.muted){b.mode='hide';b.timer=0;if(Math.hypot(p.x-b.x,p.z-b.z)<12)toast('Boban nemá co dělat – jde se schovat do hlavního domu.')}
  if(b.mode==='hide'){const H=homeOf(b);
    if(b.obj.visible){if(goTo(b,H.x,H.z,b.speed,dt,.5)){b.obj.visible=false;b.timer=15+Math.random()*20;if(!inside&&Math.hypot(p.x-b.x,p.z-b.z)<14)play('door',.35,800)}}
    else{b.timer-=dt;if(b.timer<=0){b.obj.visible=true;b.mode='follow';b.hideT=80+Math.random()*80}}
    return}
  b.gardenT-=dt;
  if(b.mode==='follow'&&b.gardenT<=0&&!inside){b.mode='garden';const g=gardenPt();b.tx=g.x;b.tz=g.z}
  if(inside){const o=OUT[room]||OUT.shop;goTo(b,o[0]+Math.sin(o[2])*.4,o[1]+Math.cos(o[2])*.4,b.speed,dt,.3)}
  else if(b.mode==='steal'){
    b.timer-=dt;
    const ax=b.x-p.x,az=b.z-p.z,dd=Math.hypot(ax,az)||1,zz=Math.sin(t*3)*.9;
    if(dd<7)step(b,ax/dd-az/dd*zz,az/dd+ax/dd*zz,b.speed*1.15,dt);else step(b,Math.sin(t*1.7),Math.cos(t*1.3),b.speed*.5,dt);
    if(b.timer<=0)giveBack('Boban nářadí pustil a odešel. Přinesl ho zpátky… celé oslintané.');
  }else if(b.mode==='garden'){
    if(goTo(b,b.tx,b.tz,b.speed,dt)){b.mode='pee';b.timer=3}
  }else if(b.mode==='pee'){
    step(b,0,0,0,dt);b.obj.rotation.z=.12;b.timer-=dt;
    if(b.timer<=0){b.obj.rotation.z=0;b.mode='follow';b.gardenT=50+Math.random()*40;
      if(Math.hypot(p.x-b.x,p.z-b.z)<10)toast('Boban zase očůral máminu zahrádku.')}
  }else{
    // otrava: leze přímo pod nohy, před hráče
    b.underT=(b.underT??12)-dt;if(b.underT<-7)b.underT=12+Math.random()*10;     // každých 30–50 s na 6 s pod nohy
    const under=b.underT<0&&p.moving>.3;
    if(under)goTo(b,p.x+Math.sin(p.head)*.75,p.z+Math.cos(p.head)*.75,b.speed*1.1,dt,.2);
    else{const ang=t*.4,dx=p.x+Math.sin(ang)*2.2,dz=p.z+Math.cos(ang)*2.2;if(Math.hypot(b.x-p.x,b.z-p.z)>3.2||!b.idleOK)goTo(b,dx,dz,b.speed*.8,dt,.6);else step(b,0,0,0,dt);b.idleOK=Math.hypot(b.x-p.x,b.z-p.z)<3}
  }
  // ponožka, záchvaty, štěkání (méně často)
  if(b.muted>0){b.muted-=dt;if(b.muted<=0){b.muted=0;sock.visible=false;b.sockCD=20;b.angry=5;b.bark=0;toast('Boban si sundal ponožku.')}}
  b.sockCD=Math.max(0,b.sockCD-dt);b.angry=Math.max(0,b.angry-dt);
  b.fitT-=dt;if(b.fitT<=0){b.fitT=200+Math.random()*100;if(!b.muted){b.angry=5;toast('Boban dostal záchvat štěkání!')}}
  b.bark-=dt;
  if(b.bark<=0){b.barking=.5;b.bark=b.muted?4+Math.random()*4:b.angry>0?.7+Math.random()*.7:2+Math.random()*2.6;if(!b.muted)play('bark_boban',distVol(b,.5),b.angry>0?500:1500);else play('mmmf',distVol(b,.5),2500)}
  if(b.barking>0){b.barking-=dt;b.obj.userData.head.rotation.x=-.3+Math.sin(t*28)*.18}
  else b.obj.userData.head.rotation.x=0;
  b.obj.userData.tail.rotation.z=Math.sin(t*16)*.5;
}
function momSees(a,height){
  if(inside||!yardMom.obj.visible||(a!==P()&&!a.obj.visible))return false;
  const dx=a.x-yardMom.x,dz=a.z-yardMom.z,d=Math.hypot(dx,dz);
  if(d>16||dx*Math.sin(yardMom.head)+dz*Math.cos(yardMom.head)<.15*d)return false;
  for(let n=1;n<Math.ceil(d/.12);n++){const u=n/Math.ceil(d/.12);
    if(blocked(yardMom.x+dx*u,yardMom.z+dz*u,(yardMom.y+1.48)*(1-u)+(a.y+height)*u,.03,0))return false}
  return true
}
function kickBoban(){
  if(!started||ctrl)return;
  const b=boban,p=P();
  if(b.fly||b.kickCD>0)return;
  if(Math.hypot(b.x-p.x,b.z-p.z)>1.6){toast('Boban je moc daleko.');return}
  let dx=b.x-p.x,dz=b.z-p.z,l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;dx=dx*.4+Math.sin(p.head)*.6;dz=dz*.4+Math.cos(p.head)*.6;l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  let dist=21,x1=b.x,z1=b.z;
  for(;dist>.5;dist-=.5){x1=b.x+dx*dist;z1=b.z+dz*dist;let ok=!blocked(x1,z1,0,.35,.2);
    for(let k=1;k<=Math.ceil(dist/.6)&&ok;k++){if(blocked(b.x+dx*dist*k/Math.ceil(dist/.6),b.z+dz*dist*k/Math.ceil(dist/.6),1.6,.1))ok=false}
    if(ok)break}
  const y1=groundAt(x1,z1,2);
  b.fly={t:0,dur:.35+dist*.09,x0:b.x,z0:b.z,y0:b.y,x1,z1,y1,h:1.8+dist*.36};b.kickCD=1.2;
  const witnessed=p===pavel&&momSees(p,1)&&momSees(b,.32);
  p.obj.userData.kick=.35;
  play('kick',.7);STATS.kicks++;
  if(b.mode==='steal')giveBack('Odkopnuto! Nářadí je zpátky v ruce.');
  else toast(['Boban letí!','Bobanova letová škola.','Boban: krátký let, dlouhý štěk.','Boban přistál a je zmatený.'][Math.floor(Math.random()*4)]); 
  if(witnessed){momVisit.scolded=true;momVisit.called=true;const fine=Math.min(ECO.money,50+Math.floor(Math.random()*4)*50);
    if(fine>0)money(-fine);else energy(-8);toast('Máma: Cholera jasna, Paweł! Zostaw mojego psa w spokoju!'+(fine>0?' Máma ti vzala '+fine+' Kč.':''));saveGame(true)}
}
function shooJackie(){const d=jackie;if(d.mode!=='cuddle')return;d.mode='wander';const p=P();
  d.tx=d.x+(d.x-p.x)*4;d.tz=d.z+(d.z-p.z)*4;d.wait=0;d.obj.userData.head.rotation.set(0,0,0);d.cudT=60+Math.random()*30;d.petted=false;
  toast(pick(['Jackie odešla se svěšenýma ušima.','„Jdi si lehnout, Jackie.“ Šla. Uraženě.','Jackie se otočila a odkráčela. Drama.']))}
function giveBack(msg){boban.mode='follow';boban.stealT=90+Math.random()*60;mouthTool.visible=false;tool.held=!!tool.id;handTool.visible=!!tool.id;toast(msg)}
function boing(f,glide,vol){if(!MUS.ctx||!audioOn)return;tone(MUS.ctx.currentTime+.01,f,.35,'sine',vol,glide)}

// ---------- tenisková ponožka na Bobanovu hubu ----------
const sock=new THREE.Group();
{const r1=new THREE.Mesh(new THREE.TorusGeometry(.1,.045,8,18),M(0xf6f6f0));r1.position.set(0,-.06,.2);
 const r2=new THREE.Mesh(new THREE.TorusGeometry(.1,.02,6,18),M(0xc8202a));r2.position.set(0,-.06,.25);
 const r3=new THREE.Mesh(new THREE.TorusGeometry(.1,.02,6,18),M(0x1f4f9a));r3.position.set(0,-.06,.15);
 const end=new THREE.Mesh(BOX,M(0xf6f6f0));end.scale.set(.06,.2,.05);end.position.set(.11,-.15,.2);end.rotation.z=.5;
 sock.add(r1,r2,r3,end);sock.visible=false;boban.obj.userData.head.add(sock)}
function sockOn(){
  if(!started||ctrl)return;
  const p=P();
  if(Math.hypot(boban.x-p.x,boban.z-p.z)>2.2){toast('Musíš být u Bobana.');return}
  if(boban.muted>0){toast('Boban už ponožku má.');return}
  if(boban.sockCD>0){toast('Ponožka ještě smrdí a schne – '+Math.ceil(boban.sockCD)+' s.');return}
  boban.muted=120;boban.angry=0;sock.visible=true;STATS.socks++;play('click');toast('Tenisková ponožka na hubu. Dvě minuty klidu!');
}
$('bsock').addEventListener('click',sockOn);
$('bkick').addEventListener('click',()=>{if(cur&&cur.jackie)shooJackie();else kickBoban()});


// ---------- kočky: Nikísek (střechy) a Mája (občas proběhne) – mainské mývalí ----------
function cat(base,dark,chest,eye){
  const g=new THREE.Group();
  const pp=(par,geo,c,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(geo,M(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;par.add(m);return m};
  pp(g,SPH,base,0,.32,0,.17,.16,.34);
  for(const z of [-.16,0,.16])pp(g,SPH,dark,0,.45,z,.11,.04,.05);
  pp(g,SPH,chest,0,.31,.25,.16,.18,.13);                      // hříva na hrudi
  for(const [x,z] of [[-.09,.2],[.09,.2],[-.09,-.2],[.09,-.2]]){pp(g,CYL,base,x,.12,z,.045,.24,.045);pp(g,SPH,chest,x,.02,z+.02,.05,.03,.06)}
  const head=new THREE.Group();head.position.set(0,.5,.33);g.add(head);
  pp(head,SPH,base,0,0,0,.14,.13,.13);pp(head,SPH,chest,0,-.05,.1,.08,.06,.06);pp(head,SPH,0xd88a8a,0,-.02,.15,.02,.015,.015);
  pp(head,SPH,eye,-.055,.03,.11,.025,.03,.015);pp(head,SPH,eye,.055,.03,.11,.025,.03,.015);
  pp(head,SPH,0x111111,-.055,.03,.122,.008,.025,.006);pp(head,SPH,0x111111,.055,.03,.122,.008,.025,.006);
  for(const s of [-1,1]){const e=pp(head,CONE,base,s*.08,.14,0,.05,.12,.035);e.rotation.z=-s*.25;const t=pp(head,CONE,dark,s*.1,.23,0,.012,.07,.012);t.rotation.z=-s*.3}
  const tail=new THREE.Group();tail.position.set(0,.38,-.32);g.add(tail);
  for(let i=0;i<5;i++)pp(tail,SPH,i%2?dark:base,0,i*.07,-i*.06,.085,.085,.085);
  tail.rotation.x=-.5;
  g.userData={head,tail};g.visible=false;scene.add(g);return g;
}
const nikisek=cat(0x161616,0x0b0b0b,0x1f1f1f,0xc8d23a);   // úplně černý
const maja=cat(0x86898d,0x6b6e72,0x9a9da1,0xd8a53a);      // šedá
const NK={state:'off',t:15,ridge:null,s:0,dir:1,sat:false,timer:0};
function nikisekAI(dt,time){
  const p=P();
  if(NK.state==='off'){NK.t-=dt;if(NK.t<=0){
    const local=ridges.filter(r=>r.len>4.5&&Math.hypot(r.cx-P().x,r.cz-P().z)<85);const big=local.length&&Math.random()<.65?local:ridges.filter(r=>r.len>4.5);NK.ridge=big[Math.floor(Math.random()*big.length)];
    NK.dir=Math.random()<.5?1:-1;NK.s=-NK.dir*(NK.ridge.len/2-.3);NK.state='walk';NK.sat=false;nikisek.visible=true;
    const r=NK.ridge;play('meow',inside?0:Math.max(0,1-Math.hypot(r.cx-p.x,r.cz-p.z)/20)*.6);if(!inside&&Math.hypot(r.cx-p.x,r.cz-p.z)<16&&night<.5)toast('Po střeše se prochází Nikísek.')}
    return}
  if(NK.state==='chase'||NK.state==='ctrl'){if(NK.state==='ctrl')nikisek.userData.tail.rotation.z=Math.sin(time*3)*.4;return}
  const r=NK.ridge;
  if(NK.state==='walk'){
    NK.s+=NK.dir*1.75*dt;
    if(!NK.sat&&Math.abs(NK.s)<.4){NK.state='sit';NK.timer=6;NK.sat=true}
    if(Math.abs(NK.s)>r.len/2-.2){nikisek.visible=false;NK.state='off';NK.t=night>.5?6+Math.random()*8:9+Math.random()*15}
  }else if(NK.state==='sit'){NK.timer-=dt;nikisek.userData.head.rotation.y=Math.sin(time*1.1)*.7;if(NK.timer<=0){NK.state='walk';nikisek.userData.head.rotation.y=0}}
  nikisek.position.set(r.cx+(r.ux??(r.alongZ?0:1))*NK.s,r.y+(NK.state==='walk'?Math.abs(Math.sin(time*12))*.10:0),r.cz+(r.uz??(r.alongZ?1:0))*NK.s);
  nikisek.rotation.y=r.alongZ?(NK.dir>0?0:Math.PI):(NK.dir>0?Math.PI/2:-Math.PI/2);
  nikisek.userData.tail.rotation.z=Math.sin(time*2)*.35;
}
const MJ={t:45,run:false,a:null,b:null,k:0};
const candidateCatPaths=[[[690,850],[735,1060]],[[380,680],[535,720]],[[960,1045],[1100,970]],[[580,1300],[1160,1260]],[[90,320],[540,330]],[[930,1000],[1160,880]],[[350,80],[1150,80]],[[790,480],[1010,520]]];
const majaPaths=candidateCatPaths.filter(([a,b])=>{
  const dx=X(b[0])-X(a[0]),dz=Z(b[1])-Z(a[1]);
  const samples=Math.ceil(Math.hypot(dx,dz)/.15);
  for(let i=0;i<=samples;i++)if(blocked(X(a[0])+dx*i/samples,Z(a[1])+dz*i/samples,0,.22,.12))return false;
  return true;
});
function majaAI(dt,time){
  if(!majaPaths.length)return;
  if(!MJ.run){MJ.t-=dt;if(MJ.t<=0){
    const pth=majaPaths[Math.floor(Math.random()*majaPaths.length)],rev=Math.random()<.5;
    MJ.a=rev?pth[1]:pth[0];MJ.b=rev?pth[0]:pth[1];if(Math.random()<.6){if(Math.random()<.5)MJ.a=[990,1405];else MJ.b=[990,1405]}MJ.k=0;MJ.run=true;maja.visible=true;   // Mája bydlí u babičky
    const p=P(),dd=Math.hypot(X(MJ.a[0])-p.x,Z(MJ.a[1])-p.z);
    MJ.chase=night>.5&&NK.state==='off'&&Math.random()<.75;if(MJ.chase){NK.state='chase';nikisek.visible=true}
    play('cats',inside?0:Math.max(0,1-dd/22)*.7);
    if(!inside&&dd<22)toast(MJ.chase?'Nikísek a Mája se honí po dvorku!':'Proběhla Mája!');
    for(const d of [ashley,jackie])if(d.obj.visible&&d.mode!=='cuddle'&&Math.random()<.4){d.mode='cat';d.wait=0}
    if(!boban.muted&&boban.obj.visible)boban.angry=Math.max(boban.angry,5)}
    if(!MJ.run)return}
  const ax=X(MJ.a[0]),az=Z(MJ.a[1]),bx=X(MJ.b[0]),bz=Z(MJ.b[1]),L=Math.hypot(bx-ax,bz-az);
  MJ.k+=dt*6.5/L;const k=Math.min(1,MJ.k);
  const mx=ax+(bx-ax)*k,mz=az+(bz-az)*k;
  maja.position.set(mx,groundAt(mx,mz,0,.12)+Math.abs(Math.sin(time*16))*.08,mz);maja.rotation.y=Math.atan2(bx-ax,bz-az);
  if(MJ.chase){const k2=Math.max(0,k-1.4/L);nikisek.position.set(ax+(bx-ax)*k2,Math.abs(Math.sin(time*16+1))*.08,az+(bz-az)*k2);nikisek.rotation.y=maja.rotation.y;nikisek.userData.tail.rotation.z=Math.sin(time*9)*.4}
  if(MJ.k>=1){MJ.run=false;maja.visible=false;MJ.t=night>.5?16+Math.random()*20:70+Math.random()*60;if(MJ.chase){MJ.chase=false;nikisek.visible=false;NK.state='off';NK.t=8}for(const d of [ashley,jackie])if(d.mode==='cat'){d.mode='wander';d.tx=d.x;d.tz=d.z}}
}


// ---------- nářadí (výběr v dílně) ----------
const TOOLS=[['drill','Aku vrtačka','drill'],['hammerdrill','Příklepová vrtačka','hammerdrill'],['screwdriver','Aku šroubovák','screw'],['handsaw','Ruční pila','handsaw'],
  ['jigsaw','Přímočará pila','jigsaw'],['circsaw','Kotoučová pila','circularsaw'],['grinder','Úhlová bruska','grinder'],['hammer','Kladivo','hammer'],
  ['plane','Hoblík','plane'],['clamp','Svěrka','click'],['tape','Svinovací metr','tape'],['level','Vodováha','click'],
  ['glue','Tavná pistole','click'],['multimeter','Multimetr','click'],['solder','Pájka','click'],['wrench','Křížový klíč','hammer'],
  ['drill_p','Aku vrtačka PERFORMANCE','drill'],['hammerdrill_p','Příklepová vrtačka PERFORMANCE','hammerdrill'],['screwdriver_p','Aku šroubovák PERFORMANCE','screw'],
  ['jigsaw_p','Přímočará pila PERFORMANCE','jigsaw'],['circsaw_p','Kotoučová pila PERFORMANCE','circularsaw'],['grinder_p','Úhlová bruska PERFORMANCE','grinder']];
TOOLS.push(['compressor','Kompresor PKO 24','click']);
TOOLS.push(['hammer_festa','FESTA kladivo','hammer'],['tape_festa','FESTA svinovací metr','tape']);
for(const [name,,id] of LIDL)TOOLS.push([id+'_festa',name.replace('PARKSIDE','FESTA'),TOOLS.find(t=>t[0]===id)[2]]);
function labelTex(perf,brand='PARKSIDE'){const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');
  g.fillStyle='#fff';g.font='800 '+(perf?30:38)+'px Rubik, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(brand,128,perf?22:34);
  if(perf){g.fillStyle='#f08a2a';g.font='800 22px Rubik, sans-serif';g.fillText('PERFORMANCE',128,48)}
  const t=new THREE.CanvasTexture(c);return t}
const LBL=[labelTex(false),labelTex(true),labelTex(false,'FESTA'),labelTex(true,'FESTA')];
const POWER=['drill','hammerdrill','screwdriver','jigsaw','circsaw','grinder','glue'];
const tool={id:null,held:false};
const toolName=()=>tool.id?TOOLS.find(t=>t[0]===tool.id)[1]:'nic';
function buildTool(id0){
  const perf=id0.includes('_p'),id=id0.replace('_p','').replace('_festa','');
  const g=new THREE.Group(),GR=id0.endsWith('_festa')?0xf0a620:perf?0x3b3f45:0x1f5a3c,BK=0x151515,RD=perf?0xe8742a:0xc8202a,SI=0xc0c4c8,WD=0x9c6b3e,YE=0xf2c14e;
  const b=(c,sx,sy,sz,x,y,z,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(BOX,M(c));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;g.add(m);return m};
  const c=(col,r,h,x,y,z,rx=0,ry=0,rz=0)=>{const m=new THREE.Mesh(CYL,M(col));m.scale.set(r,h,r);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);g.add(m);return m};
  const cy=(col,r,h,x,y,z,rx=0,ry=0,rz=0,seg)=>{const m=new THREE.Mesh(seg?new THREE.CylinderGeometry(1,1,1,seg):CYL,M(col));m.scale.set(r,h,r);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;g.add(m);return m};
  const sp=(col,sx,sy,sz,x,y,z)=>{const m=new THREE.Mesh(SPH,M(col));m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
  const H=Math.PI/2,GY=0x8a8e94;
  // aku nářadí: tělo motoru (válec), zaoblená záď, převodovka, spojka, sklíčidlo, rukojeť s gumou, spoušť, patka, baterie
  const gun=(len,r,chuckL,big)=>{cy(GR,r,len,0,.1,len/2-.02,H);sp(GR,r*1.02,r*1.02,r*.8,0,.1,-.02);
    cy(BK,r*.86,.045,0,.1,len-.005,H);cy(GY,r*.9,.03,0,.1,len+.03,H);for(let k=0;k<8;k++)b(BK,.006,.012,.03,Math.cos(k*.785)*r*.9,.1+Math.sin(k*.785)*r*.9,len+.03);
    cy(BK,r*.62,chuckL,0,.1,len+.045+chuckL/2,H,0,0,10);cy(SI,.008,.05,0,.1,len+.07+chuckL,H);
    b(GR,.062,.19,.075,0,-.03,.03,.18);b(BK,.066,.15,.03,0,-.03,-.012,.18);b(RD,.022,.045,.028,0,.035,.085,.18);b(BK,.012,.03,.02,.034,.07,.07);
    b(GR,.09,.03,.15,0,-.135,.02);b(BK,.1,.075,.15,0,-.19,.02);b(GR,.1,.012,.15,0,-.15,.02);for(let k=0;k<3;k++)b(0x2a2a2a,.102,.006,.152,0,-.21+k*.02,.02);
    if(big){cy(BK,.025,.2,.11,.06,len*.75,0,0,H);sp(BK,.03,.03,.03,.21,.06,len*.75)}};
  switch(id){
    case 'drill':gun(.2,.052,.07);break;
    case 'hammerdrill':gun(.3,.062,.09,true);b(GR,.03,.04,.2,0,.17,.12);break;
    case 'screwdriver':gun(.15,.045,.05);b(GY,.05,.05,.02,0,.1,.19);break;
    case 'handsaw':b(WD,.04,.17,.13,0,.01,-.02);b(0xf4efe6,.042,.07,.06,0,.01,-.02);b(WD,.04,.04,.13,0,.1,-.02);
      {const bl=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,1,3),M(SI));bl.scale.set(.012,.62,.16);bl.rotation.set(H,0,0);bl.position.set(0,.03,.38);g.add(bl)}
      b(SI,.012,.13,.6,0,.03,.37);break;
    case 'jigsaw':cy(GR,.05,.24,0,.13,.08,H);sp(GR,.05,.05,.04,0,.13,-.04);b(GR,.035,.14,.03,0,.24,-.03);b(GR,.035,.03,.18,0,.31,.05);b(GR,.035,.12,.03,0,.25,.13);
      b(BK,.06,.06,.12,0,.06,.1);b(SI,.13,.02,.3,0,.02,.08);b(SI,.008,.15,.022,0,-.05,.19);b(RD,.02,.03,.02,0,.28,.0);break;
    case 'circsaw':cy(GR,.06,.16,.1,.17,.02,0,0,H);sp(GR,.05,.05,.05,.18,.17,.02);
      cy(GR,.17,.06,.02,.13,.1,0,0,H,24);cy(SI,.15,.012,-.02,.1,.1,0,0,H,32);cy(BK,.02,.03,-.03,.1,.1,0,0,H);
      b(GR,.04,.04,.2,.03,.29,.06);b(GR,.04,.12,.04,.03,.24,-.03);b(BK,.04,.1,.04,.03,.24,.15);b(SI,.16,.015,.36,.03,-.005,.1);b(RD,.02,.025,.03,.03,.27,0);break;
    case 'grinder':cy(GR,.048,.3,0,.05,.12,H);sp(GR,.05,.05,.05,0,.05,-.03);cy(BK,.04,.06,0,.05,.29,H);
      cy(GY,.045,.06,0,.0,.3,0);cy(SI,.115,.008,0,-.04,.3,0,0,0,28);{const gd=cy(GY,.12,.03,0,-.025,.27,0,0,0,20);gd.scale.set(.12,.03,.12)}
      cy(BK,.018,.14,.1,.06,.27,0,0,H);b(BK,.02,.02,.08,0,.1,.06);b(RD,.03,.015,.06,0,.1,.0);break;
    case 'hammer':cy(WD,.02,.33,0,.05,0,0,0,0,10);cy(BK,.026,.13,0,-.06,0,0,0,0,10);
      cy(0x555a60,.03,.1,0,.24,.05,H,0,0,12);b(0x555a60,.04,.05,.06,0,.24,-.02);b(0x555a60,.035,.035,.09,0,.24,-.08,.4);b(0x555a60,.035,.035,.08,0,.27,-.12,.9);break;
    case 'plane':b(SI,.08,.03,.3,0,.0,.1);b(0x2f5f8a,.07,.06,.24,0,.045,.1);sp(WD,.03,.035,.03,0,.07,.24);b(WD,.03,.09,.06,0,.1,-.01,-.4);b(SI,.06,.015,.06,0,.09,.12,.6);break;
    case 'clamp':b(GY,.02,.03,.34,0,.15,.08);b(0xe8742a,.035,.12,.04,0,.08,-.06);b(0xe8742a,.035,.12,.04,0,.08,.18);cy(BK,.025,.12,0,-.02,.18,0,0,0,8);b(0xe8742a,.04,.08,.03,0,.03,-.06);break;
    case 'tape':cy(YE,.055,.045,0,.03,.03,0,0,H,20);cy(BK,.035,.047,0,.03,.03,0,0,H,16);b(YE,.045,.03,.03,0,-.02,.07);b(0xf4efe6,.03,.005,.1,0,-.025,.13);b(GY,.012,.04,.005,0,.0,.035);break;
    case 'level':b(YE,.03,.06,.6,0,.05,.22);b(GY,.032,.012,.6,0,.08,.22);for(const z of [.0,.22,.44]){cy(0x6fd36f,.012,.04,0,.05,z,0,0,H);b(BK,.034,.03,.06,0,.05,z)}break;
    case 'glue':b(0x1f4f9a,.05,.14,.07,0,-.01,0,.15);cy(0x1f4f9a,.04,.18,0,.08,.08,H);cy(SI,.012,.06,0,.08,.2,H);b(BK,.02,.04,.02,0,.03,.045);cy(0xffffff,.015,.14,0,.08,-.08,H);break;
    case 'multimeter':b(YE,.09,.16,.035,0,.05,.02);b(BK,.075,.14,.036,0,.05,.021);b(0x8fb08f,.06,.04,.038,0,.1,.021);cy(GY,.022,.01,0,.03,.04,H);b(RD,.008,.12,.008,.035,-.08,.04);b(BK,.008,.12,.008,-.035,-.08,.04);break;
    case 'solder':cy(0x1f4f9a,.018,.14,0,0,.02,H);cy(BK,.022,.05,0,0,-.06,H);cy(SI,.008,.08,0,0,.13,H);cy(SI,.004,.04,0,0,.19,H);break;
    case 'compressor':cy(GR,.12,.34,0,.04,0,H);b(BK,.15,.1,.16,0,.2,0);for(const side of [-1,1])cy(BK,.055,.026,side*.12,-.08,-.09,0,0,H);break;
    case 'wrench':b(SI,.02,.02,.34,0,.05,.06);b(BK,.024,.024,.16,0,.05,-.03);b(SI,.025,.08,.06,0,.09,.25);b(SI,.025,.03,.05,0,.14,.27);cy(GY,.012,.03,0,.07,.22,0,0,H);break;
  }
  if(id==='handsaw')for(let k=0;k<14;k++){const tth=new THREE.Mesh(BOX,M(0x9a9ea4));tth.scale.set(.011,.02,.02);tth.position.set(0,-.035,.1+k*.04);tth.rotation.x=.7;g.add(tth)}
  if(id==='circsaw')for(let k=0;k<16;k++){const tth=new THREE.Mesh(BOX,M(0xd0d4d8));tth.scale.set(.012,.02,.02);const a=k/16*Math.PI*2;tth.position.set(-.02,.1+Math.sin(a)*.155,.1+Math.cos(a)*.155);tth.rotation.x=-a;g.add(tth)}
  if(POWER.includes(id)){                                     // detaily + nápis PARKSIDE na obou bocích
    const LB={drill:[.15,.1,.08,.054],hammerdrill:[.22,.1,.13,.064],screwdriver:[.12,.1,.06,.047],jigsaw:[.18,.13,.08,.052],circsaw:[.14,.17,.02,.062],grinder:[.2,.05,.12,.05]}[id]||[.18,.1,.1,.06],lw=LB[0],ly=LB[1],lz=LB[2],hw=LB[3];
    for(const sd of [-1,1]){const m=new THREE.Mesh(new THREE.PlaneGeometry(lw,lw/4),BASM({map:LBL[(id0.endsWith('_festa')?2:0)+(perf?1:0)],transparent:true}));m.position.set(sd*hw,ly,lz);m.rotation.y=sd*Math.PI/2;g.add(m)}
    if(['drill','hammerdrill','screwdriver'].includes(id))for(let k=0;k<3;k++){const l=new THREE.Mesh(SPH,M(0x3ee060));l.scale.setScalar(.008);l.position.set(.02*(k-1),-.17,.096);g.add(l)}
  }
  return g;
}
const armR=pavel.obj.userData.armR;
armR.children[armR.children.length-1].visible=false;            // původní vrtačka z modelu
const handTool=new THREE.Group();handTool.position.set(0,-.66,.05);handTool.rotation.x=Math.PI/2;armR.add(handTool);
let holder=pavel;const holdArm=()=>holder.obj.userData.armR;const canTool=q=>q===pavel||q===simon;
const mouthTool=new THREE.Group();mouthTool.position.set(0,-.12,.42);mouthTool.rotation.set(0,Math.PI/2,Math.PI/2);mouthTool.scale.setScalar(1.7);mouthTool.visible=false;boban.obj.userData.head.add(mouthTool);
function equip(id){if(id&&canTool(P())&&holder!==P()){holdArm().rotation.x=-.05;holder=P();holdArm().add(handTool)}tool.id=id;tool.held=!!id;for(const g of [handTool,mouthTool]){while(g.children.length)g.remove(g.children[0]);if(id)g.add(buildTool(id))}
  handTool.visible=!!id;holdArm().rotation.x=id?-1.1:-.05}
equip(null);
const _n0=scene.children.length;BUILD_INT=true;box(FX+1.3,FZ-2.65,FX+3.45,FZ-2.38,.78,1.01,0xb48758,false);for(const x of [FX+1.55,FX+3.1])box(x,FZ-2.68,x+.12,FZ-2.34,0,.78,0x74533b,false);buildInterior();buildRooms();buildCellar();buildShed();buildShops();buildPub();for(const k in RM){const R0=RM[k];if(!R0.top)continue;const c=box(R0.cx-R0.w/2-.2,R0.cz-R0.d/2-.2,R0.cx+R0.w/2+.2,R0.cz+R0.d/2+.2,R0.h,R0.h+.06,k==='domek'?0x3a2a20:k==='sklep'?0x6a4a32:0xf2efe8,false);c.receiveShadow=false};BUILD_INT=false;
if(window.__camLed)setInterval(()=>{window.__camLed.visible=!window.__camLed.visible},700);
for(let i=camMeshes.length-1;i>=0;i--)if(camMeshes[i].position.x>115)camMeshes.splice(i,1);   // byty, hlavní dům, sklad: kamera shora přes zdi
const interiorG=new THREE.Group();
for(const o of scene.children.slice(_n0))interiorG.add(o);/* uvnitř je pohled z první osoby – zdi, překlady i stropy zůstávají celé */scene.add(interiorG);interiorG.visible=false;interiorG.traverse(o=>o.layers.set(2));
for(const L of [sun,hemi])L.layers.enable(2);   // interiéry jsou vidět jen uvnitř (jinak by z ulice svítily v dálce)
let useT=0;
function useTool(){if(!started||P()!==holder||!canTool(P()))return;if(!tool.id){toast('Nemáš nic v ruce – nářadí si vezmeš v dílně.');return}if(!tool.held){toast('Nářadí má Boban!');return}
  const t=TOOLS.find(x=>x[0]===tool.id);play(t[2],.6,350);useT=.4;if(!UNL)unlockOthers()}


// ---------- přepínání scény: dvorek <-> dílna ----------
let inside=false,room=null,sitting=false;
function unstuck(p){if(!blocked(p.x,p.z,p.y,p.r))return;for(let r=.3;r<2.6;r+=.2)for(let k=0;k<16;k++){const a=k/16*Math.PI*2,x=p.x+Math.sin(a)*r,z=p.z+Math.cos(a)*r;if(!blocked(x,z,0,p.r)){p.x=x;p.z=z;p.y=groundAt(x,z,0);p.vy=0;return}}}
function standUp(){sitting=false;const p=P();if(room==='shop')p.z=IZ-ID/2+1.3;unstuck(p);p.obj.position.set(p.x,p.y,p.z)}
const delayed=[];
function afterGameTime(fn,ms){delayed.push({fn,left:ms/1000})}
function fade(fn){const f=$('fade');f.classList.add('on');afterGameTime(()=>{fn();afterGameTime(()=>f.classList.remove('on'),60)},260)}
// ---------- vinný sklep (Klobouky, sklepy u Příční): sudy, stůl, ochutnávka ----------
function buildCellar(){const R0=RM.sklep,x1=R0.cx-R0.w/2,x2=R0.cx+R0.w/2,z1=R0.cz-R0.d/2,z2=R0.cz+R0.d/2,BR=0x9a6a48,h=R0.h;
 box(x1,z1,x2,z2,0,.012,0x6b5a48,false);box(x1-.25,z1-.25,x2+.25,z1,0,h,BR);box(x1-.25,z2,x2+.25,z2+.25,0,h,BR);box(x1-.25,z1,x1,z2,0,h,BR);box(x2,z1,x2+.25,z2,0,h,BR);
 for(let x=x1+.4;x<x2-.3;x+=.9)box(x,z1,x+.06,z2,h-.1,h,0x5a3a22,false);   // trámy
 door(R0.cx,z2-.05,0,1,2.05,Math.PI,0x6b4226);
 // sudy po obou stranách (ležící)
 for(const zz of [z1+.55,z2-.55])for(let x=x1+.7;x<x2-.6;x+=1.15){if(zz>R0.cz&&Math.abs(x-R0.cx)<1)continue;const b=new THREE.Mesh(CYL,M(0x8a5a2a));b.scale.set(.48,.9,.48);b.rotation.x=Math.PI/2;b.position.set(x,.5,zz);scene.add(b);
   for(const dz of [-.3,.3]){const r=new THREE.Mesh(CYL,M(0x3a3a3a));r.scale.set(.5,.05,.5);r.rotation.x=Math.PI/2;r.position.set(x,.5,zz+dz);scene.add(r)}box(x-.4,zz-.45,x+.4,zz+.45,0,.2,0x4a3a2a,false);solid(x-.5,zz-.45,x+.5,zz+.45,1)}
 // stůl, lavice, lahve, sklenky, mřížka s lahvemi
 box(R0.cx-1,R0.cz-.35,R0.cx+1,R0.cz+.35,.72,.78,0x7a5232);for(const [dx,dz] of [[-.9,-.3],[.9,-.3],[-.9,.3],[.9,.3]])box(R0.cx+dx-.04,R0.cz+dz-.04,R0.cx+dx+.04,R0.cz+dz+.04,0,.72,0x5a3a22,false);solid(R0.cx-1,R0.cz-.35,R0.cx+1,R0.cz+.35,.78);
 for(const s2 of [-1,1])box(R0.cx-1,R0.cz+s2*.6-.12,R0.cx+1,R0.cz+s2*.6+.12,.4,.46,0x7a5232,false);
 for(let k=0;k<4;k++){const b=new THREE.Mesh(CYL,M(k%2?0x2e5a2a:0x5a1a2a));b.scale.set(.04,.3,.04);b.position.set(R0.cx-.6+k*.4,.93,R0.cz-.1);scene.add(b);const g=new THREE.Mesh(CYL,STDM({color:0xdff2ff,transparent:true,opacity:.5}));g.scale.set(.035,.1,.035);g.position.set(R0.cx-.5+k*.4,.83,R0.cz+.15);scene.add(g)}
 for(let r=0;r<4;r++)for(let c=0;c<8;c++){const b=new THREE.Mesh(CYL,M((r+c)%3?0x2e5a2a:0x5a1a2a));b.scale.set(.04,.14,.04);b.rotation.z=Math.PI/2;b.position.set(x2-.15,.3+r*.25,z1+.6+c*.15);scene.add(b)}
 sign('SKLEP U ŠKVOREŇÁKŮ',R0.cx,1.9,z1+.03,0,1.6)}
// ---------- červený domeček: tma, pavouci, pavučiny, rozbité okno a střepy ----------
function buildShed(){const R0=RM.domek,x1=R0.cx-R0.w/2,x2=R0.cx+R0.w/2,z1=R0.cz-R0.d/2,z2=R0.cz+R0.d/2,h=R0.h,W=0x7a2a22;
 box(x1,z1,x2,z2,0,.012,0x3a2f25,false);box(x1-.15,z2,x2+.15,z2+.15,0,h,W);box(x1-.15,z1,x1,z2,0,h,W);box(x2,z1,x2+.15,z2,0,h,W);
 // severní stěna s rozbitým oknem
 const wx=R0.cx;box(x1-.15,z1-.15,wx-.5,z1,0,h,W);box(wx+.5,z1-.15,x2+.15,z1,0,h,W);box(wx-.5,z1-.15,wx+.5,z1,0,1,W);box(wx-.5,z1-.15,wx+.5,z1,1.8,h,W);
 box(wx-.52,z1-.13,wx+.52,z1-.02,.98,1.02,0x5a3a22,false);box(wx-.52,z1-.13,wx+.52,z1-.02,1.78,1.82,0x5a3a22,false);box(wx-.03,z1-.13,wx+.03,z1-.02,1,1.8,0x5a3a22,false);
 const glass=STDM({color:0xbfe2ff,transparent:true,opacity:.45,roughness:.1,side:THREE.DoubleSide});
 for(const [x,y,sx,sy,rz] of [[-.35,1.15,.22,.3,.4],[-.2,1.65,.25,.22,-.6],[.32,1.12,.2,.35,.9],[.38,1.6,.18,.28,-.3],[.12,1.7,.12,.18,.2]]){const g=new THREE.Mesh(new THREE.CircleGeometry(.5,3),glass);g.scale.set(sx,sy,1);g.position.set(wx+x,y,z1-.07);g.rotation.z=rz;scene.add(g)}
 for(let k=0;k<14;k++){const g=new THREE.Mesh(new THREE.CircleGeometry(.06+Math.random()*.07,3),glass);g.rotation.x=-Math.PI/2;g.rotation.z=Math.random()*6;g.position.set(wx+(Math.random()-.5)*1.4,.02,z1+.2+Math.random()*.9);scene.add(g)}
 {const beam=new THREE.Mesh(new THREE.PlaneGeometry(1,2.4),BASM({color:0x9fb8d8,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));beam.position.set(wx,.9,z1+.9);beam.rotation.x=-.75;scene.add(beam);
  const L=new THREE.PointLight(0x8fb0ff,.55,4.5,2);L.position.set(wx,1.4,z1+.4);scene.add(L)}
 // harampádí
 box(x1+.1,z2-.7,x1+.8,z2-.1,0,.55,0x6b4a2e);box(x1+.15,z2-.65,x1+.75,z2-.15,.55,.9,0x8a6a4a);box(x2-.9,z1+.1,x2-.3,z1+.6,0,.45,0x5a5f66);
 {const ch=box(x1+1.1,z2-.9,x1+1.55,z2-.45,.42,.46,0x6b4226,false);for(const [dx,dz] of [[0,0],[.4,0],[0,.4],[.4,.4]])box(x1+1.1+dx,z2-.9+dz,x1+1.15+dx,z2-.85+dz,0,.42,0x5a3a22,false)}
 {const w1=new THREE.Mesh(new THREE.TorusGeometry(.3,.03,6,16),M(0x2a2a2a));w1.position.set(x2-.2,.33,z2-.8);w1.rotation.y=Math.PI/2;scene.add(w1);const w2=w1.clone();w2.position.z-=.9;scene.add(w2);box(x2-.22,z2-1.75,x2-.18,z2-.8,.33,.37,0x8a3a2a,false)}
 // pavučiny v rozích
 const web=BASM({color:0xffffff,transparent:true,opacity:.07,side:THREE.DoubleSide,depthWrite:false});
 for(const [x,z,ry] of [[x1+.25,z1+.25,Math.PI/4],[x2-.25,z1+.25,-Math.PI/4],[x1+.25,z2-.25,3*Math.PI/4],[x2-.25,z2-.25,-3*Math.PI/4]]){const w=new THREE.Mesh(new THREE.CircleGeometry(.2,8),web);w.position.set(x,h-.3,z);w.rotation.y=ry;scene.add(w);
   for(let k=0;k<4;k++){const ln=new THREE.Mesh(BOX,web);ln.scale.set(.008,.008,.6);ln.position.set(x,h-.3,z);ln.rotation.set(0,ry,k*.78);scene.add(ln)}}
 // pavouci
 const sp=(x,y,z,s0)=>{const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(s0);const b=new THREE.Mesh(SPH,M(0x111111));b.scale.set(.06,.045,.08);g.add(b);const hd=new THREE.Mesh(SPH,M(0x1a1a1a));hd.scale.setScalar(.035);hd.position.z=.08;g.add(hd);
   for(const sx of [-1,1])for(let k=0;k<4;k++){const l=new THREE.Mesh(BOX,M(0x111111));l.scale.set(.12,.008,.008);l.position.set(sx*.07,0,.04-k*.03);l.rotation.z=sx*.5;l.rotation.y=(k-1.5)*.35*sx;g.add(l)}scene.add(g);return g};
 sp(x1+.06,1.6,z1+.5,1.4).rotation.z=Math.PI/2;sp(x2-.4,h-.2,z2-.3,1.1);sp(x1+.4,.02,z2-1,1.6);sp(wx+.7,1.4,z1+.02,1).rotation.x=Math.PI/2;sp(x2-.06,.9,R0.cz,1.3).rotation.z=-Math.PI/2;
 door(x2-.05,R0.cz,0,.8,1.9,-Math.PI/2,0x4a2a1a)}
// ---------- interiéry obchodů: Pekařství Křížkovi a Lidl ----------
function buildShops(){
 {const R0=RM.pekarna,x1=R0.cx-R0.w/2,x2=R0.cx+R0.w/2,z1=R0.cz-R0.d/2,z2=R0.cz+R0.d/2,h=R0.h,W=0xf4ead6;
  box(x1,z1,x2,z2,0,.012,0xc9a77a,false);box(x1-.15,z1-.15,x2+.15,z1,0,h,W);box(x1-.15,z2,x2+.15,z2+.15,0,h,W);box(x1-.15,z1,x1,z2,0,h,W);box(x2,z1,x2+.15,z2,0,h,W);
  door(R0.cx,z2-.05,0,1,2.1,Math.PI,0x8a5a32);
  box(x1+.5,R0.cz-.9,x2-.5,R0.cz-.4,0,1,0x8a5a32);box(x1+.5,R0.cz-.9,x2-.5,R0.cz-.85,1,1.35,0xdff2ff,false);   // pult s vitrínou
  for(let k=0;k<10;k++){const b=new THREE.Mesh(SPH,M([0xc48a3a,0xd9a24a,0xb06a2a][k%3]));b.scale.set(.18,.1,.12);b.position.set(x1+.8+k*.55,1.08,R0.cz-.65);scene.add(b)}
  for(const y of [.6,1.2,1.8])box(x1+.3,z1+.05,x2-.3,z1+.45,y,y+.05,0x6b4226,false);
  for(const y of [.6,1.2,1.8])for(let k=0;k<12;k++){const b=new THREE.Mesh(SPH,M(k%2?0xa8642a:0xc8883a));b.scale.set(.2,.12,.14);b.position.set(x1+.6+k*.5,y+.14,z1+.25);scene.add(b)}
  const baker=person(0xf0c8a8,0xffffff,0x3a3a3a,0x6b4a2a);baker.position.set(R0.cx,0,z1+.9);scene.add(baker);{const cap=new THREE.Mesh(CYL,M(0xffffff));cap.scale.set(.2,.2,.2);cap.position.set(0,2.15,0);baker.add(cap)}
  sign('PEKAŘSTVÍ KŘÍŽKOVI',R0.cx,2.3,z1+.05,0,2.2);box(x2-1.2,z2-1.3,x2-.4,z2-.5,0,.75,0x6b4226)}
 {const R0=RM.lidl,x1=R0.cx-R0.w/2,x2=R0.cx+R0.w/2,z1=R0.cz-R0.d/2,z2=R0.cz+R0.d/2,h=R0.h,W=0xf2f2f2;
  box(x1,z1,x2,z2,0,.012,0xd8d8d0,false);box(x1-.15,z1-.15,x2+.15,z1,0,h,W);box(x1-.15,z2,x2+.15,z2+.15,0,h,W);box(x1-.15,z1,x1,z2,0,h,W);box(x2,z1,x2+.15,z2,0,h,W);
  door(R0.cx,z2-.05,0,1.6,2.2,Math.PI,0x8a8f96);
  const COLS=[0xc8202a,0x1f4f9a,0xf2c14e,0x2e6b3a,0xffffff,0xe8742a,0x8a3a5a];
  for(let a=0;a<4;a++){const ax=x1+2.2+a*2.6;box(ax-.35,z1+1.5,ax+.35,z2-4,0,1.8,0xbfc4c8);for(const y of [.5,1,1.5])for(let k=0;k<12;k++){const zz=z1+1.7+k*.55;if(zz>z2-4.2)break;for(const sd of [-1,1]){const b=new THREE.Mesh(BOX,M(COLS[(a*7+k+y*3)%COLS.length]));b.scale.set(.12,.32,.4);b.position.set(ax+sd*.42,y+.16,zz);scene.add(b)}}}
  // PARKSIDE stojan (modro-žlutý) s krabicemi nářadí
  {const px=x2-2,pz=R0.cz-1;box(px-1.2,pz-1.2,px+1.2,pz+1.2,0,.9,0x0050aa);box(px-1.2,pz-1.2,px+1.2,pz+1.2,.9,.95,0xffe600,false);for(let k=0;k<8;k++){const b=new THREE.Mesh(BOX,M(k%2?0x2a6e3a:0x1d1d1d));b.scale.set(.5,.35,.4);b.position.set(px-.9+(k%4)*.6,1.12,pz-.5+Math.floor(k/4)*.9);scene.add(b)}
   sign('PARKSIDE · AKCE TÝDNE',px,2.6,pz,0,2.4)}
  // pokladny
  for(const k of [0,1]){const cx=x1+2+k*3;box(cx-.4,z2-3,cx+.4,z2-1.4,0,.95,0x3a3d42);const cs=person(0xf0c0a0,0x0050aa,0x2b2b2b,[0x6b4a2a,0x2a1d14][k]);cs.position.set(cx-.8,0,z2-2.2);cs.rotation.y=Math.PI/2;scene.add(cs)}
  sign('LIDL',R0.cx,3.1,z1+.05,0,2)}}
// ---------- hospoda U Zámku: výčep, stoly, šipky, štamgasti ----------
function buildPub(){const R0=RM.hospoda,x1=R0.cx-R0.w/2,x2=R0.cx+R0.w/2,z1=R0.cz-R0.d/2,z2=R0.cz+R0.d/2,h=R0.h,W=0xd9c4a0;
 box(x1,z1,x2,z2,0,.012,0x7a5232,false);box(x1-.15,z1-.15,x2+.15,z1,0,h,W);box(x1-.15,z2,x2+.15,z2+.15,0,h,W);box(x1-.15,z1,x1,z2,0,h,W);box(x2,z1,x2+.15,z2,0,h,W);
 box(x1,z1,x2,z1+.02,0,1.1,0x6b4226,false);door(R0.cx,z2-.05,0,1,2.1,Math.PI,0x6b4226);
 box(x1+.3,z1+1,x1+4.5,z1+1.6,0,1.05,0x5a3a22);box(x1+.3,z1+1,x1+4.5,z1+1.6,1.05,1.12,0x3a2a1a,false);   // výčep
 for(let k=0;k<3;k++){const t=new THREE.Mesh(CYL,M(0xd8dde2));t.scale.set(.04,.35,.04);t.position.set(x1+1.2+k*.5,1.3,z1+1.3);scene.add(t)}
 for(let k=0;k<12;k++){const b=new THREE.Mesh(CYL,M([0x2e5a2a,0x7a3a1a,0xd8b020][k%3]));b.scale.set(.05,.15,.05);b.position.set(x1+.5+k*.33,1.75,z1+.12);scene.add(b)}box(x1+.3,z1+.02,x1+4.5,z1+.25,1.6,1.65,0x5a3a22,false);
 for(const [cx,cz] of [[x2-2.6,R0.cz-1.2],[x2-2.6,R0.cz+1.4],[R0.cx-.5,R0.cz+1.6]]){const t=new THREE.Mesh(BOX,M(0x8a5a32));t.scale.set(1.4,.06,.9);t.position.set(cx,.75,cz);scene.add(t);solid(cx-.7,cz-.45,cx+.7,cz+.45,.78);
   for(const sz of [-1,1]){box(cx-.7,cz+sz*.7-.15,cx+.7,cz+sz*.7+.15,.42,.46,0x6b4226,false)}
   const pv=new THREE.Mesh(CYL,M(0xe8b030));pv.scale.set(.05,.12,.05);pv.position.set(cx+.2,.84,cz);scene.add(pv)}
 // šipky
 {const d=new THREE.Mesh(CYL,M(0x222222));d.scale.set(.25,.03,.25);d.rotation.z=Math.PI/2;d.position.set(x2-.05,1.6,R0.cz+.1);scene.add(d);const r=new THREE.Mesh(CYL,M(0xc8202a));r.scale.set(.15,.035,.15);r.rotation.z=Math.PI/2;r.position.set(x2-.06,1.6,R0.cz+.1);scene.add(r);const bl=new THREE.Mesh(CYL,M(0x2e8a3a));bl.scale.set(.04,.04,.04);bl.rotation.z=Math.PI/2;bl.position.set(x2-.07,1.6,R0.cz+.1);scene.add(bl)}
 // štamgasti a hospodský
 for(const [x,z,ry,c] of [[x2-2.9,R0.cz-1.9,0,0x3a5a8a],[x2-2.3,R0.cz-.5,Math.PI,0x6b4a2a],[R0.cx-.9,R0.cz+2.3,Math.PI,0x8a3a3a]]){const g=person(0xf0c0a0,c,0x2f3e5a,0x9a9a9a);g.position.set(x,-.38,z);g.rotation.y=ry;scene.add(g)}
 {const g=person(0xe8b896,0xffffff,0x2b2b2b,0x2a1d14);g.position.set(x1+2,0,z1+.55);scene.add(g)}
 sign('HOSPODA U ZÁMKU',R0.cx,2.3,z1+.05,0,2.2)}
function goRoom(r,x,z,h=Math.PI){fade(()=>{inside=true;room=r;interiorG.visible=true;COL_IN=true;cam.layers.set(2);ray.layers.set(2);for(const q of people)q.obj.traverse(o=>o.layers.enable(2));const p=P();p.x=x;p.z=z;p.y=0;p.vy=0;p.head=h;yaw=h+Math.PI;pitch=.32;camT.set(p.x,1.35,p.z);
  if(boban.mode==='steal')giveBack('Boban zůstal venku a nářadí pustil u dveří.');
  boban.fly=null;boban.mode='door';$('mm').style.display='none'})}
function enterShop(){goRoom('shop',IX-2,IZ+ID/2-.9);afterGameTime(()=>toast('Dílna. Psi musí zůstat venku.'),300)}
function enterFlat(){goRoom('flat',FX+1.8,FZ+FD/2-.9);if(ECO.elec){afterGameTime(()=>toast('Pavlův byt. Konečně tu svítí – elektriku dodělal Pavel sám.'),300);return}afterGameTime(()=>toast('Proč nesvítí světlo? Pavel v bytě předělává elektriku: jističe jsou vyhozené, dráty trčí ze zdi a světla ještě nejsou zapojená. Svítí jen baterka a jedna utržená žárovka bliká.',7),300)}
function exitRoom(to){const was=room;if(was==='lidl'&&basket().length)settleBasket(true);fade(()=>{inside=false;room=null;sitting=false;interiorG.visible=false;COL_IN=false;cam.layers.set(0);ray.layers.set(0);const p=P();const o=OUT[to||was]||OUT.shop;
  p.x=o[0];p.z=o[1];p.head=o[2];yaw=o[2]+Math.PI;
  p.y=groundAt(p.x,p.z,5);p.vy=0;pitch=.38;camT.set(p.x,1.35,p.z);boban.mode='follow';$('mm').style.display='';MUS.hifi=false})}
const exitShop=exitRoom;
// kam se vyjde ven z místnosti: [x, z, směr pohledu]
const OUT={shop:[X(900),Z(307)+1.3,0],flat:[X(1028)-.9,flatDoorZ,-Math.PI/2],byt2:[X(658)+.9,Z(610),Math.PI/2],byt1:[X(658)+.9,Z(1090),Math.PI/2],
  street:[X(20),Z(620),-Math.PI/2],sklep:[171,-290.3,0],hospoda:[10.6,161.5,-Math.PI/2],pekarna:[-48,124.8,0],lidl:[710.3,30,-Math.PI/2],domek:[X(1030)-1.3,Z(700),-Math.PI/2],hdum:[X(113),Z(1425)-1,Math.PI],pergola:[X(100)+.9,Z(1330),Math.PI/2],kratka:[X(80),Z(1640)+1,0],sklad:[X(72)+.9,Z(332),Math.PI/2]};
const ENTRY={byt2:['byt2',RM.byt2.cx+RM.byt2.w/2-.8,.9,-Math.PI/2],byt1:['byt1',RM.byt1.cx+RM.byt1.w/2-.8,0,-Math.PI/2],
  hdum:['hdum',181+2.45,-2.7+1.05,0],hdumPerg:['hdum',181+.75,-2.7-7.3+4.0,Math.PI],hdumStreet:['hdum',181+1.1,2.7-.7,Math.PI],
  sklad:['sklad',RM.sklad.cx+RM.sklad.w/2-.9,0,-Math.PI/2],street:['byt2',RM.byt2.cx-RM.byt2.w/2+.8,0,Math.PI/2],sklep:['sklep',RM.sklep.cx,RM.sklep.cz+RM.sklep.d/2-.8,Math.PI],domek:['domek',RM.domek.cx+RM.domek.w/2-.6,RM.domek.cz,-Math.PI/2],pekarna:['pekarna',RM.pekarna.cx,RM.pekarna.cz+RM.pekarna.d/2-.7,Math.PI],lidl:['lidl',RM.lidl.cx,RM.lidl.cz+RM.lidl.d/2-.8,Math.PI],hospoda:['hospoda',RM.hospoda.cx,RM.hospoda.cz+RM.hospoda.d/2-.8,Math.PI]};
for(const k of ['benapol','vlcek']){
  const r=RM[k],outside=window.__shops[k];ENTRY[k]=[k,r.cx,r.cz+r.d/2-.9,Math.PI];OUT[k]=[outside.x,outside.z,k==='vlcek'?0:-Math.PI/2];
}
for(const c of window.__cabins){const r=RM[c.key];ENTRY[c.key]=[c.key,r.cx,r.d/2-.9,Math.PI];OUT[c.key]=[c.x,c.z,c.ry]} 
ENTRY.simonHome=['simonHome',645,3.4,Math.PI];OUT.simonHome=[window.__shops.simonHome.x,window.__shops.simonHome.z,-Math.PI/2];ENTRY.fuelShop=['fuelShop',659,2.55,Math.PI];OUT.fuelShop=[195,247,0];
for(const n of mallStores.slice(1))ENTRY[n]=[n,RM[n].cx,2.9,Math.PI];
ENTRY.mall=['mall',502,6.5,Math.PI];OUT.mall=[-15.8,170,Math.PI/2];ENTRY.granny=['granny',535,2.1,Math.PI];OUT.granny=[X(990),Z(1425)-1,Math.PI];ENTRY.hornbach=['hornbach',RM.hornbach.cx,4,Math.PI];OUT.hornbach=[-15.8,170,Math.PI/2];
function enterRoom(k,msg){const E=ENTRY[k];goRoom(E[0],E[1],E[2],E[3]);if(msg)afterGameTime(()=>toast(msg),300)}
const SEATS=[-.88,-.3,.28];
function sitSeat(k){const p=P();sitting=true;p.x=IX+SEATS[k];p.z=IZ-ID/2+.55;p.head=0;p.obj.position.set(p.x,-.08,p.z);play('seat',.6);
  toast('Sedíš v sedačce z Jeepu Cherokee. Vstaneš pohybem nebo Shiftem.')}
function openTools(){if(!canTool(P())){toast('Nářadí si berou Pavel a Simon.');return}
  const grid=$('toolgrid');grid.textContent='';
  {const b=document.createElement('button');b.type='button';b.textContent='Prázdné ruce';if(!tool.id)b.classList.add('cur');
   b.addEventListener('click',()=>{if(boban.mode==='steal')giveBack('Boban to nářadí zahodil.');equip(null);closeTools();toast('Nářadí odloženo.')});grid.appendChild(b)}
  for(const [id,name] of TOOLS.filter(t=>ECO.owned.has(t[0]))){const b=document.createElement('button');b.type='button';b.textContent=name;if(id===tool.id)b.classList.add('cur');
    b.addEventListener('click',()=>{if(boban.mode==='steal')giveBack('Vzal sis jiné nářadí. Boban to ukradené zahodil.');equip(id);closeTools();play(TOOLS.find(t=>t[0]===id)[2],.5);toast('V ruce: '+name+' · G nebo klik = použít')});grid.appendChild(b)}
  $('tools').classList.add('on');if(document.pointerLockElement)document.exitPointerLock()}
function relock(){drag=null;for(const k in keys)keys[k]=false;if(!started||!matchMedia('(pointer:fine)').matches)return;const go=()=>{if(document.pointerLockElement)return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{$('lockhint').classList.add('on')})}catch(_){}};go();setTimeout(go,180)}
function closeTools(){$('tools').classList.remove('on');relock()}
$('toolclose').addEventListener('click',closeTools);
canvas.addEventListener('mousedown',e=>{if(locked()&&e.button===0)useTool()});


// ---------- den a noc (1 den = 8 minut) ----------
const DAY={t:.33,len:480,n:0};let REALDT=0;   // den (24 h) = 8 minut skutečného času, nezávisle na FPS
const STATS={kicks:0,pets:0,eaten:0,steals:0,wood:0,socks:0,chased:0,stolen:0};let night=0;
const skyDay=new THREE.Color(0xbfe6ff),skyNight=new THREE.Color(0x0c1430),skySet=new THREE.Color(0xf2a36b),skyC=new THREE.Color();
const SKY={top:{value:new THREE.Color(0x4f9ae0)},hor:{value:new THREE.Color(0xd6ecff)},sunDir:{value:new THREE.Vector3(0,1,0)},sunCol:{value:new THREE.Color(0xfff0c2)},night:{value:0}};
const skyDome=new THREE.Mesh(new THREE.SphereGeometry(800,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:SKY,
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 top,hor,sunCol,sunDir;uniform float night;varying vec3 vD;void main(){vec3 d=normalize(vD);float h=clamp(d.y,0.0,1.0);vec3 c=mix(hor,top,pow(h,0.55));float s=max(dot(d,normalize(sunDir)),0.0);c+=sunCol*(smoothstep(0.9993,0.9997,s)*1.6+pow(s,18.0)*0.45+pow(s,4.0)*0.12)*(1.0-night);c=mix(c,c*vec3(0.92,0.95,1.05),0.3);gl_FragColor=vec4(pow(max(c,vec3(0.0)),vec3(2.2)),1.0);}'}));
skyDome.renderOrder=-10;scene.add(skyDome);scene.fog.near=120;scene.fog.far=520;
const topDay=new THREE.Color(0x4f9ae0),topNight=new THREE.Color(0x070d24),horDay=new THREE.Color(0xd6ecff),horNight=new THREE.Color(0x1a2448),horSet=new THREE.Color(0xf6a065);
const stars=(()=>{const n=600,pos=new Float32Array(n*3);for(let i=0;i<n;i++){const th=Math.random()*Math.PI*2,ph=Math.random()*Math.PI*.45;
  pos[i*3]=Math.cos(th)*Math.sin(ph)*95;pos[i*3+1]=Math.cos(ph)*95;pos[i*3+2]=Math.sin(th)*Math.sin(ph)*95}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const m=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:.7,transparent:true,opacity:0,fog:false}));scene.add(m);return m})();
const lamps=[[668,1252],[908,880]].map(([x,y])=>{          // sloupové lampy jen u zahrádky a na chodníku
  box(X(x)-.06,Z(y)-.06,X(x)+.06,Z(y)+.06,0,3,0x2a2a2a);
  const bulb=new THREE.Mesh(SPH,BASM({color:0x555555}));bulb.scale.setScalar(.16);bulb.position.set(X(x),3.05,Z(y));scene.add(bulb);
  const light=new THREE.PointLight(0xffd27a,0,16,1.6);light.position.set(X(x),2.9,Z(y));scene.add(light);return {bulb,light}});
{const bulb=new THREE.Mesh(SPH,BASM({color:0x555555}));bulb.scale.setScalar(.12);bulb.position.set(wallLamp.x+.08,wallLamp.y,wallLamp.z);scene.add(bulb);
 const light=new THREE.PointLight(0xffd27a,0,12,1.6);light.position.set(wallLamp.x+.4,wallLamp.y,wallLamp.z);scene.add(light);lamps.push({bulb,light})}
// světla na domech (nad dveřmi)
for(const [x,y,z] of [[X(900)+1.7,2.45,Z(307)+.14],[X(1028)-.14,2.35,flatDoorZ-.8],[X(658)+.14,2.7,Z(610)-.8],[X(658)+.14,2.7,Z(1090)-.8],[X(990)+1.4,2.55,Z(1425)-.14],[X(113)+.8,2.45,Z(1425)-.14]]){
  const hs=new THREE.Mesh(BOX,M(0x2a2a2a));hs.scale.set(.16,.2,.16);hs.position.set(x,y+.05,z);scene.add(hs);
  const bulb=new THREE.Mesh(SPH,BASM({color:0x555555}));bulb.scale.setScalar(.09);bulb.position.set(x,y-.08,z);scene.add(bulb);
  const light=new THREE.PointLight(0xffd27a,0,9,1.8);light.position.set(x,y-.2,z);scene.add(light);lamps.push({bulb,light})}
const winMat=M(0x5d86a8);
const MAIL={state:{orders:[],donated:0},courier:agent(person(0xe4b694,0x2460aa,0x182f51,0x382419),-15.4,-34,{speed:2,r:.28,reach:.3})};
MAIL.courier.obj.visible=false;
const parcel=new THREE.Mesh(BOX,M(0xb58249));parcel.scale.set(.42,.28,.32);parcel.position.set(0,.9,.28);MAIL.courier.obj.add(parcel);
function officeShop(){const orders=MAIL.state.orders;
  openList('Lidl e-shop · Pavel',LIDL.map(([name,price,id])=>{
    const pending=orders.some(o=>o.id===id),owned=ECO.owned.has(id);
    const total=Math.round(price*.72)+149;return {name,price:total,off:pending||owned,sub:owned?'V dílně':orders.some(o=>o.id===id&&o.atPost)?'K vyzvednutí na poště':pending?'Čeká na doručení':'Zboží '+Math.round(price*.72)+' Kč + doprava 149 Kč',fn:()=>buy(total,()=>{
      orders.push({id,due:DAY.n+DAY.t+.08+Math.random()*.1});saveGame(true);toast('Zaplaceno. Pošťák přijde k zastávce před domem.')
    })}}))}
function mailTick(dt){
  const state=MAIL.state,c=MAIL.courier;
  if(DAY.n>=state.donated+2){const wallet=pavel.cs||(pavel.cs={...CHS0});wallet.money+=500;state.donated=DAY.n;hudEco();toast('Pavlovi přišel donate 500 Kč.');saveGame(true)}
  if(!state.orders.some(o=>!o.atPost&&o.due<=DAY.n+DAY.t)){c.obj.visible=false;c.ready=false;c.travel=0;return}
  if(!c.obj.visible){c.x=-15.4;c.z=-34;c.y=0;c.vy=0;c.obj.visible=true;toast('Pošťák nese Pavlovi zásilku k zastávce před domem.')}
  if(!c.ready)c.ready=goTo(c,-15.4,-25,1.8,dt,.45);
    c.travel=(c.travel||0)+dt;
  if(c.travel>=35){for(const o of state.orders)if(o.due<=DAY.n+DAY.t)o.atPost=true;
    c.travel=0;c.ready=false;c.obj.visible=false;saveGame(true);toast('Pošťák Pavla nezastihl. Zásilka čeká na poště na náměstí Míru.')}
}
function deliverParcel(atPost=false){
  const now=DAY.n+DAY.t,items=MAIL.state.orders.filter(o=>o.due<=now&&!!o.atPost===atPost);
  if(!items.length){toast('Na poště pro Pavla zatím nic není.');return}
  for(const item of items){if(item.goods)receiveGoods(item.goods,people[item.recipient]);else ECO.owned.add(item.id)}
  MAIL.state.orders=MAIL.state.orders.filter(o=>!items.includes(o));
  refreshWall();saveGame(true);toast('Pošťák doručil do dílny: '+items.map(o=>o.name||LIDL.find(i=>i[2]===o.id)?.[0]||o.id).join(', '))
}
spots.push({get x(){return MAIL.courier.x},get z(){return MAIL.courier.z},r:2,label:'Pošťák · převzít Lidl zásilku',who:0,get hidden(){return inside||!MAIL.courier.obj.visible},act:()=>deliverParcel(false)});
spots.push({x:12.7,z:228,r:1.8,label:'Pošta · vyzvednout uloženou zásilku',who:0,act:()=>deliverParcel(true)});
const merchants={
 Hornbach:[['boards','Hoblovaná prkna',290,1],['bits','Sada vrtáků',179,1],['mountGlue','Montážní lepidlo',149,1]],
 Action:[['tapeRoll','Textilní páska',59,1],['batteries','Baterie AA',79,4]],
 Albert:[['egg','Kinder vajíčko',35,1],['banana','Banány',32,1],['kofola','Kofola',39,1]],
 Bauhaus:[['boards','Smrkové desky',275,1],['bolts','Šrouby M8',65,8],['paint','Barva na vrata',349,1]],
 Alza:[['charger','USB-C nabíječka',499,1],['headphones','Sluchátka',690,1]],
 Datart:[['kettle','Rychlovarná konvice',549,1],['radio','Přenosné rádio',899,1]],
 Elkov:[['electricKit','Elektroinstalace do Pavlova bytu',1200,1],['cable','Kabel CYKY 3×2,5',890,1],['breaker','Jistič B16',165,1],['socket','Zásuvka s rámečkem',125,1]]
};
const kiosk=[['chew','Žvýkací tabák',149,1],['cigs','Cigarety',159,1]];
const cornerGoods=[...merchants.Albert,['pizza','Mražená pizza',85,1],['chips','Chipsy',49,1],...kiosk,['beer','Lahvové pivo',28,1]];
function receiveGoods([id,name,price,qty],recipient){
 const cs=recipient?(recipient.cs||={...CHS0}):charState();
 if(id==='dogTreats'){cs.treats=(cs.treats||0)+qty}
 else if(lidlGroceries.some(i=>i[0]===id)&&!cornerGoods.some(i=>i[0]===id)){(cs.groceries??=[]).push(['food:12',name])}
 else if(id.startsWith('food:')||id.startsWith('coop:')||id.startsWith('pekarna:')){(cs.groceries??=[]).push([id,name])}
 else if(['egg','chew','cigs','beer','pizza','chips','banana','kofola'].includes(id)){cs[id]=(cs[id]||0)+qty}
 else if(id==='electricKit')ECO.mat_elec=1;
 else hardware[id]=(hardware[id]||0)+qty
}
function counter(name,items){openList(name,items.map(item=>({name:item[1],price:item[2],off:item[0]==='chew'&&P()!==pavel&&P()!==simon,
 fn:()=>buy(item[2],()=>{receiveGoods(item);saveGame(true);toast(item[1]+' · převzato.')})})))}
Object.keys(merchants).forEach((name,i)=>spots.push({in:'mall',x:490+i*4,z:-4.25,r:1.8,label:name,who:-1,act:()=>enterRoom(name==='Hornbach'?'hornbach':name)}));
for(const n of mallStores.slice(1)){
 const r=RM[n];for(const side of [-1,1])spots.push({in:n,x:r.cx+side*2.95,z:0,r:2.2,label:n+' · vybrat zboží',who:-1,act:()=>counter(n,merchants[n])});
 spots.push({in:n,x:r.cx,z:3.55,r:1.25,label:'Zpět do pasáže',who:-1,act:()=>goRoom('mall',490+mallStores.indexOf(n)*4,-3.4,0)})
}
spots.push({in:'mall',x:502,z:7.35,r:1.35,label:'Linka 109 · Klobouky, náměstí',who:-1,act:()=>exitRoom()},
 {x:X(990),z:Z(1425)-.45,r:1,label:'Vejít k babičce',who:-1,act:()=>enterRoom('granny')},
 {in:'granny',x:535,z:2.65,r:1,label:'Vyjít na dvůr',who:-1,act:()=>exitRoom()},
 {in:'granny',x:534,z:-1.1,r:1.3,label:'Babiččin stůl · úkoly',who:0,act:()=>{toast(pick(['Babička: Přitáhni tu poličku, naklání se mi hrníčky.','Babička: Potom se stav na buchtu.','Babička: Máš ještě v dílně ten můj metr?']));showJobs('babička')}});
pbox(550,377,592,398,0,.52,0x8c7050);const pry=pbox(553,383,586,386,.53,.61,0xbc482e,false);pbox(582,381,588,387,.53,.64,0x606970,false);
spots.push({x:X(570),z:Z(412),r:1.65,label:'Vzít páčidlo z bedny na dvoře',who:-1,get hidden(){return !!charState().crowbar},act:()=>{charState().crowbar=true;saveGame(true);toast('Páčidlo máš u sebe.')}});
for(const [key,n,list] of [['trafika','Trafika',kiosk],['vecerka','Večerka',cornerGoods]]){const a=window.__shops[key];spots.push({x:a.x,z:a.z,r:2,label:n,who:-1,act:()=>counter(n,list)})}
const contacts={
 '601':['Máma','Pavle, koukni, jestli má Bobánek vodu.','Až půjdeš domů, dones granule.'],
 '602':['Táta','Mám pro tebe práci. Stav se, až pojedeš kolem.','Ulož prkna do sucha, v noci sprchne.'],
 '603':['Babička','Buchty už chladnou na stole.','Zastav se, potřebuju přidržet poličku.'],
 '604':['Simon','Jsem u auta. Přijď mi přidržet kapotu.','Na dílně je další zakázka.'],
 '605':['Milan','Nosím dřevo, co potřebuješ?','Kinder? Tak to se za mnou stav!'],
 '606':['Tereza','Jdu dát prádlo do pračky.','Vodítka najdeš u dveří.']};
function phonePage(title,rows){
 const ui=$('phone');ui.querySelector('h3').textContent=title;const list=ui.querySelector('section');list.replaceChildren();
 for(const [text,fn] of rows){const b=document.createElement('button');b.textContent=text;b.disabled=!fn;b.onclick=fn;list.appendChild(b)}
 if(!ui.open){for(const k in keys)keys[k]=false;if(document.pointerLockElement)document.exitPointerLock();ui.showModal()}
}
function phoneHome(){phonePage('Aplikace',[['Kontakty a vytáčení',phoneContacts],['SMS',phoneMessages],['Prohlížeč · obchody',()=>phonePage('E-shopy',['Lidl',...Object.keys(merchants),...Object.keys(otherShops)].map(n=>[n,()=>phoneShop(n)]))],['V kapse',pockets]])}
function phoneContacts(){phonePage('Kontakty',Object.entries(contacts).map(([n,c])=>[c[0]+' · '+n,()=>callNumber(n)]));
 const field=document.createElement('input');field.type='tel';field.placeholder='Vytočit číslo';const b=document.createElement('button');b.textContent='Volat';b.onclick=()=>callNumber(field.value.trim());$('phone').querySelector('section').append(field,b)}
function callNumber(n){const c=contacts[n];phonePage(c?c[0]:'Neznámé číslo',[[c?pick(c.slice(1)):'Číslo není dostupné.',null],['Zavěsit',phoneContacts]])}
function phoneMessages(){phonePage('SMS',Object.entries(contacts).map(([n,c])=>[c[0],()=>thread(n)]))}
function thread(n){const cs=charState(),c=contacts[n],history=(cs.sms??={})[n]??=[];phonePage(c[0],history.map(t=>[t,null]).concat([['Napsat: Co děláš?',()=>{history.push('Já: Co děláš?',c[0]+': '+pick(c.slice(1)));if(history.length>16)history.splice(0,2);saveGame(true);thread(n)}]]))}
const otherShops={
 'Večerka':cornerGoods,'Trafika':kiosk,
 'Benapol':shelfGoods.flat().map(([n,p,e])=>[n==='Kinder vajíčko'?'egg':'food:'+e,n,p,1]),
 'COOP':FOOD.coop.map(([n,p],i)=>['coop:'+i,n,p,1]),
 'Pekařství Křížkovi':FOOD.pekarna.map(([n,p],i)=>['pekarna:'+i,n,p,1])};
function phoneShop(name){
 
 const stock=name==='Lidl'?LIDL.map(([n,p,id])=>[id,n,p,1]):merchants[name]||otherShops[name];
 phonePage(name+' · doprava 149 Kč',stock.map(item=>{const [id,n,p]=item,net=Math.round(p*.72),total=net+149;
 const taken=id==='chew'&&P()===tereza||name==='Lidl'&&(ECO.owned.has(id)||MAIL.state.orders.some(o=>o.id===id));
 return [n+' · '+net+' + 149 = '+total+' Kč',taken?null:()=>buy(total,()=>{MAIL.state.orders.push({id,name:n,recipient:act,goods:name==='Lidl'?undefined:item,due:DAY.n+DAY.t+.12});saveGame(true);phonePage('Objednáno',[['Pošťák přiveze: '+n,null],['Pokračovat v nákupu',()=>phoneShop(name)]])})]}))}
function pockets(){const cs=charState();const rows=cornerGoods.filter(([id])=>cs[id]>0).map(([id,n])=>[n+' × '+cs[id],()=>{cs[id]--;if(id==='beer')cs.drunkUntil=DAY.n+DAY.t+.035;energy(id==='chew'?(Math.random()<.25?-8:12):id==='cigs'?-3:8);saveGame(true);pockets()}]);for(const [i,[id,n]] of (cs.groceries||[]).entries())rows.push([n,()=>{cs.groceries.splice(i,1);const [k,v]=id.split(':');if(k==='food')energy(Number(v));else FOOD[k][Number(v)][3]();saveGame(true);pockets()}]);phonePage('V kapse',rows.length?rows:[['Prázdno',null]])}
$('phoneHome').onclick=phoneHome;
const dadOut=agent(person(0xe8b896,0x5a6a3a,0x2f3e5a,0x9a9a9a),X(420),Z(1658),{speed:1.7});
const smerda=agent(person(0xc0a18c,0x736753,0x413e40,0x5e554c),-15,172,{speed:1.3});
const bottle=new THREE.Mesh(CYL,M(0x3b643b));bottle.scale.set(.07,.28,.07);bottle.position.set(.32,.88,.19);smerda.obj.add(bottle);
const dadHome=[X(420),Z(1707)],dadShop=[depot.x+2,depot.z+1],dadA=nearNode(...dadHome),dadB=nearNode(...dadShop);
const dadRoute=[dadHome,GN[dadA],...roadPath(dadA,dadB),dadShop];
function onRoute(points,u){
 const lengths=points.slice(1).map(([x,z],i)=>Math.hypot(x-points[i][0],z-points[i][1]));let d=u*lengths.reduce((a,b)=>a+b,0),i=0;
 while(i<lengths.length-1&&d>lengths[i])d-=lengths[i++];const [x,z]=points[i],[tx,tz]=points[i+1],f=d/(lengths[i]||1);return [x+(tx-x)*f,z+(tz-z)*f,Math.atan2(tx-x,tz-z)]
}
const dadQuest=spots.find(s=>s.in==='hdum'&&s.label==='Táta · placené úkoly');
for(const zone of [0,'vlcek'])spots.push({in:zone,get x(){return dadOut.x},get z(){return dadOut.z},r:1.55,label:'Táta · promluvit',who:0,get hidden(){return !dadOut.obj.visible||dadOut.zone!==zone},act:()=>{toast(pick(['Táta: Kdo naposledy zavíral Voyager?','Táta: Ty trámy skládej na proklady.','Táta: Jestli pojedeš kolem stavebnin, vezmi podložky.']));dadQuest.act()}});
spots.push({get x(){return smerda.x},get z(){return smerda.z},r:1.6,label:'Šmerda · promluvit',who:-1,act:()=>toast(pick(['Šmerda schovává láhev: Vždyť je skoro poledne.','Šmerda je po drogách mimo a odpoví až napodruhé.','Šmerda: Hele, kolikátýho vůbec je?']))});
let carDay=-1;
function familyTick(dt){
 const hr=DAY.t*24,trip=hr>=7&&hr<9,atStore=hr>=7.5&&hr<8.5,out=hr>=9&&hr<19,dadCar=familyCars[0];
 window.__parents.dad.visible=!trip&&!out;window.__grannyInside.visible=!babicka.obj.visible;if(window.__grannyInside.visible)window.__grannyInside.userData.arms[0].rotation.x=-.9+.24*Math.sin(DAY.t*2600);
 if(DRV.car!==dadCar&&(trip||dadCar.familyTrip)){
   const [x,z,r]=onRoute(dadRoute,hr<7.5&&trip?(hr-7)*2:atStore?1:trip?(9-hr)*2:0);
   carBox(dadCar.g,false);dadCar.g.position.set(x,0,z);dadCar.g.rotation.y=trip?r+(hr>=8.5?Math.PI:0):Math.PI/4;carBox(dadCar.g,true);dadCar.familyTrip=trip
 }
 dadOut.zone=atStore?'vlcek':0;dadOut.obj.visible=atStore?inside&&room==='vlcek':out&&!inside;
 if(atStore&&guest!==dadOut){dadOut.x=RM.vlcek.cx+.7;dadOut.z=-2.4;dadOut.obj.position.set(dadOut.x,0,dadOut.z);if(inside&&room==='vlcek'&&hardware.dadLine!==DAY.n&&hr<8&&hardware.kickedDay!==DAY.n){hardware.dadLine=DAY.n;toast('Táta: Co ty moje děcka tady zas nabrali?')}}
 else if(out&&guest!==dadOut){const yard=hr>=12&&hr<13;if(yard!==dadOut.yard){dadOut.yard=yard;dadOut.x=X(yard?200:420);dadOut.z=Z(yard?1360:1664)}goTo(dadOut,X((yard?260:510)+80*Math.sin(hr*3)),Z(yard?1355:1664),1.5,dt,.3)}
 dadOut.obj.traverse(o=>o.layers.set(atStore?2:0));
 if(carDay!==DAY.n&&DRV.car!==SIMCAR){carDay=DAY.n;const i=DAY.n%4;SIMCAR.name=['Octavia kombi','Červený hatchback','Stříbrný sedan','Zelený kombík'][i];for(const m of [carMeshes[0],carMeshes[2],hood])m.material=M([0x939baf,0xbb4338,0xb9c4c5,0x3b6d59][i]);carMeshes[1].scale.z=[2.5,1.5,1.85,2.3][i];carMeshes[2].scale.z=carMeshes[1].scale.z}
 const place=hr<9?[-15.6,172]:hr<15?[-15.4,47]:hr<20?[-14,101]:[-16,191];
 if(guest!==smerda){smerda.x=place[0]+Math.sin(hr)*.4;smerda.z=place[1];smerda.obj.position.set(smerda.x,0,smerda.z);smerda.obj.rotation.z=.08*Math.sin(hr*130);smerda.obj.userData.arms[1].rotation.x=-.7+.55*Math.sin(hr*90)}
}
spots.push({in:'byt2',x:RM.byt2.cx+RM.byt2.w/2-1.4,z:RM.byt2.cz+1.4,r:1.4,label:'Vyprat a pověsit prádlo',who:1,act:()=>{if(hardware.washDay===DAY.n){toast('Dnešní prádlo už visí.');return}miniStart('Tereza · vyprat a pověsit prádlo',5,()=>{hardware.washDay=DAY.n;money(180,'Prádlo visí. +180 Kč');saveGame(true)},'tap')}});
spots.push({x:carX+1.1,z:workZ,r:1.4,label:'Společná oprava se Simonem',who:-1,act:()=>{
 if(![pavel,simon].includes(P())||SIM.state!=='work'){toast('Pavel se Simonem pracují společně přes den.');return}
 const partner=P()===pavel?simon:pavel;if(Math.hypot(partner.x-carX,partner.z-workZ)>6){toast('Přiveď k autu i druhého parťáka.');return}
 const cs=charState();if(cs.chew>0)toast(P()===pavel?'Simon: Pavle, nabijem?':'Pavel: Simo, nabijem?');openList(SIMCAR.name,[{name:'Přidržet motor a dotáhnout držáky',fn:()=>miniStart('Společná oprava motoru',5,()=>{money(350,'Držáky sedí. Za společnou opravu +350 Kč.');saveGame(true)},'tap')},{name:P()===pavel?'Simo, nabijem?':'Pavle, nabijem?',off:!(cs.chew>0),fn:()=>{cs.chew--;const n=Math.random()<.25?-8:12;energy(n);const other=partner.cs||(partner.cs={...CHS0});other.energy=Math.max(0,Math.min(100,other.energy+n));toast((P()===pavel?'Simo':'Pavle')+', nabijem? '+(n>0?'Jde nám to líp.':'Dneska nám to nesedlo.'));saveGame(true)}}])}});
spots.push({get x(){return familyCars[2].g.position.x+1.15},get z(){return familyCars[2].g.position.z-1.8},r:1.25,label:'Voyager · nákladový prostor',who:-1,act:()=>{const pos=familyCars[2].g.position,store=Math.hypot(pos.x-depot.x,pos.z-depot.z)<18,home=Math.hypot(pos.x-X(900),pos.z-Z(307))<18||Math.hypot(pos.x-X(740),pos.z-Z(1707))<18;
 if(hardware.cargo&&home){receiveGoods(hardware.cargo);hardware.cargo=null;money(240,'Materiál vyložený doma. +240 Kč');saveGame(true)}
 else if(store&&!hardware.cargo){openList('Naložit Voyager',[['boards','Prkna',290,1],['sand','Písek',69,1],['gravel','Štěrk',85,1]].map(it=>({name:it[1],price:it[2],fn:()=>buy(it[2],()=>{hardware.cargo=it;saveGame(true);toast('Naloženo. Vylož náklad u domu nebo dílny.')})})))}
 else toast(hardware.cargo?'Naloženo: '+hardware.cargo[1]+'. Vylož doma.':'Vzadu chybí sedačky. Ve stavebninách sem naložíš materiál.') }});
const helmet=new THREE.Group();for(const [w,h,d,x,y,z,c] of [[.44,.25,.37,0,.13,0,0x353c43],[.4,.39,.09,0,-.02,.19,0x3f494d],[.29,.105,.02,0,.04,.246,0x254f54]]){
 const m=new THREE.Mesh(BOX,M(c));m.scale.set(w,h,d);m.position.set(x,y,z);helmet.add(m)}
pavel.obj.userData.head.add(helmet);helmet.traverse(o=>o.layers.enable(2));helmet.visible=false;
function mopedProp(x,z,col,wheels,indoor){
 const g=new THREE.Group();scene.add(g);g.position.set(x,0,z);
 function beam(ax,ay,bx,by,col,width=.08){const m=new THREE.Mesh(BOX,M(col));m.scale.set(width,Math.hypot(bx-ax,by-ay),width);m.position.set(0,(ay+by)/2,(ax+bx)/2);m.rotation.x=Math.atan2(bx-ax,by-ay);g.add(m)}
 beam(-.66,.31,-.18,.76,col);beam(-.18,.76,.35,.42,col);beam(.35,.42,.55,.93,col);beam(.55,.93,.66,.31,0x888c89);beam(.49,.91,.47,1.12,0xa5a9a9);beam(-.38,.85,-.02,.85,0x312d2e,.17);
 if(wheels)for(const k of [-.66,.66]){const m=new THREE.Mesh(new THREE.TorusGeometry(.28,.055,8,20),M(0x252626));m.rotation.y=Math.PI/2;m.position.set(0,.32,k);g.add(m)}
 if(indoor)g.traverse(o=>o.layers.set(2));return g
}
const wreck207=mopedProp(X(1020),Z(460),0xa89656,false,false);wreck207.rotation.z=.36;wreck207.position.y=-.17;
const simonBike=mopedProp(648,-2.9,0xc22e31,true,true),cycle=mopedProp(649,-1,0x37685f,true,true);cycle.scale.setScalar(.9);
for(const [g,c] of [[simonBike,0xb93d30],[wreck207,0x807867]]){const tank=new THREE.Mesh(BOX,M(c));tank.scale.set(.23,.18,.52);tank.position.set(0,.74,.14);tank.layers.mask=g.children[0].layers.mask;g.add(tank)}
const redStreet=mopedProp(24,245,0xc22e31,true,false);redStreet.visible=false;redStreet.userData.wheels=[];redStreet.userData.halfWidth=.35;redStreet.userData.halfLength=.85;
const redRide={g:redStreet,kind:'own',name:'Simonova laděná Babeta',speedMul:1.2};VEH.push(redRide);
const sleepers=[[pavel,'flat',FX+FW/2-1.1,FZ-FD/2+1.25,.27],[tereza,'byt1',157.8,1.85,.57],[simon,'simonHome',642,-3.5,.67]].map(([actor,r,x,z,y])=>{const model=actor.obj.clone(true);model.traverse(m=>m.layers.set(2));model.position.set(x,y,z-.65);model.rotation.x=Math.PI/2;model.visible=false;scene.add(model);return {actor,r,model}});
spots.push({in:'lidl',x:RM.lidl.cx-1,z:RM.lidl.cz+1,r:1.6,label:'Regál · potraviny a pamlsky',who:-1,act:()=>shopLidl(true)},
 {x:X(1005),z:Z(458),r:1.2,label:'Babetta 207 · srovnat rám',who:0,act:()=>miniStart('Srovnat rám dvěstěsedmičky',3,()=>toast('Rám sedí. Chybí obě kola i motor, tahle už nepojede.'),'tap')},
 {x:195,z:247,r:1.7,label:'Benzínka · vejít ke kase',who:-1,act:()=>enterRoom('fuelShop')},
 {in:'fuelShop',x:659,z:-.9,r:1.5,label:'Kasa · zaplatit tankování',who:-1,act:()=>{const cs=charState();openList('Benzínka · kasa',[{name:'Zaplatit palivo a kanystry',price:cs.pumpBill||0,off:!cs.pumpBill,fn:()=>buy(cs.pumpBill,()=>{cs.pumpBill=0;cs.fuelAlarm=false;saveGame(true);toast('Zaplaceno. Šťastnou cestu!')})}])}},
 {in:'fuelShop',x:659,z:3,r:1,label:'Vyjít na benzínku',who:-1,act:()=>exitRoom()},
 {x:window.__shops.simonHome.x,z:window.__shops.simonHome.z,r:2,label:'Simonův dům a garáž',who:-1,act:()=>enterRoom('simonHome')},
 {in:'simonHome',x:645,z:4,r:1.2,label:'Vyjít před Simonův dům',who:-1,act:()=>exitRoom()},
 {in:'simonHome',x:648,z:-2,r:1.3,label:'Vyjet na laděné Babetě',who:2,act:()=>{if(redStreet.visible){toast('Červená Babeta už je venku.');return}exitRoom();afterGameTime(()=>{redStreet.position.set(24,0,245);redStreet.visible=true;simonBike.visible=false;enterCar(redRide)},360)}},
 {in:'domek',x:RM.domek.cx,z:RM.domek.cz,r:2,label:'Prohledat harampádí',who:-1,act:()=>{if(hardware.lootDay===DAY.n){toast('Dnes už tu nic dalšího není.');return}hardware.lootDay=DAY.n;const n=Math.random();if(n<.3)money(45,'Ve škvíře bylo 45 Kč.');else if(n<.6&&!ECO.owned.has('drill')){ECO.owned.add('drill');ECO.broken.add('drill');refreshWall();toast('Našel jsi rozbitou vrtačku.')}else if(n<.85){hardware.screws+=6;toast('Šest použitelných vrutů.')}else toast('Jen pavučiny.');saveGame(true)}});
function extraLife(dt){const hr=DAY.t*24;
 if(!inside&&started&&!guest){extraLife.comment=(extraLife.comment??20)-dt;if(extraLife.comment<=0){extraLife.comment=35+Math.random()*35;const n=PEDS.find(a=>a.obj.visible&&Math.hypot(a.x-P().x,a.z-P().z)<5);if(n){n.talk=3;toast(pick(['Soused: Ten Golf zase slyším až u nás v kuchyni!','Sousedka: Pavle, tu vrtačku slyší celá Krátká.','Soused: Až pojedeš pro prkna, vezmi mi taky dvě.']))}}}
 const account=charState();if(account.pumpBill&&!inside&&!account.fuelAlarm&&Math.hypot(P().x-199,P().z-239)>28){account.fuelAlarm=true;addWanted(1,'Benzínka hlásí odjezd bez zaplacení.');saveGame(true)}

 helmet.visible=P()===pavel?(MINI.on&&MINI.mode==='hold'&&$('minititle').textContent.toLowerCase().includes('svař')||tool.id==='welder'&&useT>0):WELD.active&&hr>=8&&hr<21&&!pavel.asleep;
 for(const {model,r,actor} of sleepers)model.visible=inside&&room===r&&actor.asleep&&actor!==P();
 if(hardware.simonTheftDay!==DAY.n&&hr>=20){hardware.simonTheftDay=DAY.n;if(Math.random()<.2){hardware.stolenCycleUntil=DAY.n+2;if(inside&&room==='simonHome')toast('Simon: Zmizelo mi z garáže kolo!')}saveGame(true)}
 cycle.visible=!(hardware.stolenCycleUntil>DAY.n);
}
function dayTick(dt){if(started){extraLife(dt);familyTick(dt);husTick();mailTick(dt);lubosTick()}
  const prevT=DAY.t;DAY.t=(DAY.t+(REALDT||dt)/DAY.len)%1;if(DAY.t<prevT)DAY.n++;
  const hrNow=DAY.t*24,hrPrev=prevT*24;
  if(started&&DAY.t<prevT){endDay();return}
  if((hrPrev<12&&hrNow>=12)||(hrPrev<18&&hrNow>=18))bells(hrNow<13?2:6);
  if(hrPrev<22&&hrNow>=22){ML.trips=0;if(!inside)toast('22:00 – všichni jdou spát.')}
  if(!inside){if(hrPrev<19&&hrNow>=19)toast('Psi zalézají domů. Venku začínají řádit kočky.');if(hrPrev<7&&hrNow>=7)toast('Ráno. Psi jsou zase venku.')}
  const a=(DAY.t-.25)*Math.PI*2,h=Math.sin(a),day=Math.max(0,Math.min(1,(h+.08)/.3));
  night=1-day;
  const inF=inside&&RM[room]?RM[room].f:1;if(roomL){const R0=RM[room];roomL.intensity=R0&&R0.L?R0.L:0;if(R0)roomL.position.set(R0.cx,R0.h-.3,R0.cz)}
  sun.intensity=GFX.sun*day*(inside?0:1);hemi.intensity=(GFX.hemiN+GFX.hemiD*day)*inF;GFX.envK=(.12+.88*day)*(inside?.35:1);
  if(FLK&&ECO.elec){FLK.L.intensity=room==='flat'?1.3:0;if(FLK.bulbM&&FLK.bulbM.emissive)FLK.bulbM.emissive.setRGB(1,.85,.5)}
  else if(FLK){if(room==='flat'){FLK.t-=dt;if(FLK.t<=0){FLK.on=FLK.on?0:1;FLK.t=FLK.on?.03+Math.random()*(Math.random()<.15?.6:.08):.05+Math.random()*(Math.random()<.3?2.5:.25);if(FLK.on)play('click',.12,120)}
    FLK.L.intensity=FLK.on?1.6:0;FLK.bulbM.color.setHex(FLK.on?0xfff1c8:0x3a3428);FLK.bb.position.x=FX+.6+Math.sin(performance.now()/700)*.03}else FLK.L.intensity=0}
  if(flash){flash.intensity=room==='flat'&&!ECO.elec?2.2:0;if(room==='flat'){const p=P();flash.position.set(p.x+Math.sin(p.head)*.2,1.45,p.z+Math.cos(p.head)*.2);flash.target.position.set(p.x+Math.sin(p.head)*4,.6,p.z+Math.cos(p.head)*4)}}
  SFX.ambient.volume=.3*day*(inside?0:1);SFX.night.volume=.32*night*(inside?0:1);
  {const f=inside?{x:0,z:0}:P();const fx=Math.round(f.x),fz=Math.round(f.z);sun.position.set(fx-Math.cos(a)*30,Math.max(4,h*30),fz+12);sun.target.position.set(fx,0,fz)}
  const set=Math.max(0,1-Math.abs(h)/.28);
  skyC.copy(skyNight).lerp(skyDay,day).lerp(skySet,set*.5);
  SKY.top.value.copy(topNight).lerp(topDay,day);SKY.hor.value.copy(horNight).lerp(horDay,day).lerp(horSet,set*.6);
  SKY.sunDir.value.set(-Math.cos(a),h,.4);SKY.night.value=Math.min(1,night*1.2);SKY.sunCol.value.setRGB(1,.92-set*.25,.75-set*.4);
  sun.color.setRGB(1,.95-set*.2,.86-set*.35);
  scene.background.copy(SKY.hor.value).convertSRGBToLinear();scene.fog.color.copy(SKY.hor.value).convertSRGBToLinear();
  stars.material.opacity=Math.max(0,night-.3);
  winMat.emissive.setRGB(1,.78,.35).multiplyScalar(night*.85*(inside?.25:1));
  if(window.__lampHeads)window.__lampHeads.color.setRGB(.25+night*5,.22+night*3.6,.18+night*1.6);
  for(const l of lamps){l.light.intensity=night*1.3;l.bulb.material.color.setRGB(.33+.67*night,.33+.5*night,.33*(1-night)+.4*night)}
  const mins=Math.floor(DAY.t*1440),hh=String(Math.floor(mins/60)).padStart(2,'0'),mm2=String(mins%60).padStart(2,'0');
  const ct=(night>.5?'noc ':'den ')+hh+':'+mm2;if($('clock').textContent!==ct)$('clock').textContent=ct;
  ecoTick(dt,performance.now()/1000);
}

// ---------- Milan: v noci nosí z dřevníku bedny dřeva do hlavního domu ----------
function person(skin,top,legs,hair){
  const g=new THREE.Group(),pp=(par,geo,c,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(geo,M(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;par.add(m);return m};
  pp(g,CYL,legs,-.13,.42,0,.11,.84,.11);pp(g,CYL,legs,.13,.42,0,.11,.84,.11);pp(g,BOX,0x222222,-.13,.05,.05,.17,.1,.3);pp(g,BOX,0x222222,.13,.05,.05,.17,.1,.3);
  pp(g,SPH,top,0,1.15,0,.33,.42,.24);pp(g,SPH,top,0,1.52,-.05,.2,.12,.16);   // mikina s kapucí
  const arms=[];for(const sx of [-1,1]){const a=new THREE.Group();a.position.set(sx*.36,1.42,0);g.add(a);pp(a,CYL,top,0,-.2,0,.085,.4,.085);pp(a,SPH,skin,0,-.45,0,.08,.08,.08);arms.push(a)}
  const head=new THREE.Group();head.position.y=1.85;g.add(head);
  pp(head,SPH,skin,0,0,0,.24,.26,.24);pp(head,SPH,hair,0,.1,-.02,.25,.17,.25);
  pp(head,SPH,0x2a2a2a,-.08,.03,.22,.028,.034,.02);pp(head,SPH,0x2a2a2a,.08,.03,.22,.028,.034,.02);
  g.userData={head,arms};return g;
}
const milan=agent(person(0xf0c0a0,0x2b2b2b,0x2f3e5a,0x2a1d14),X(682),Z(1090),{name:'Milan',speed:2.4,r:.3,reach:.3});
milan.obj.scale.setScalar(.82);milan.obj.visible=false;
const crate=new THREE.Group();crate.position.set(0,1.02,.42);crate.visible=false;milan.obj.add(crate);
{const b=new THREE.Mesh(BOX,M(0x9c6b3e));b.scale.set(.62,.28,.42);crate.add(b);
 const lg=new THREE.CylinderGeometry(.06,.06,.55,7);for(let i=0;i<6;i++){const m=new THREE.Mesh(lg,M(i%2?0xc08a52:0xb3834f));m.rotation.z=Math.PI/2;m.position.set(0,.17+Math.floor(i/3)*.1,-.12+(i%3)*.12);crate.add(m)}}
const WP={door:[682,1090],up:[707,1118],down:[707,1192],dl:[830,1205],cs:[834,1100],cn:[834,705],lawn:[912,684],wood:[968,668],hs:[905,1330],pg1:[600,1385],pg2:[240,1385],house:[128,1395]};
const route=(...k)=>k.map(n=>[X(WP[n][0]),Z(WP[n][1])]);
const thief=agent(person(0xe0b48c,0x3a3d42,0x2b3446,0x3a3d42),X(486),Z(75),{name:'Zloděj z buněk',speed:3,r:.3,reach:.3});
thief.obj.scale.setScalar(.82);thief.obj.visible=false;
const TH={state:'off',day:-1,hr:9+Math.random()*11,path:[],wi:0,t:0,loot:null,stuck:0,ld:0};
const THT=[{p:[[486,75],[520,150],[520,380],[650,380],[900,335]],w:'do dílny',l:['aku vrtačka PARKSIDE','úhlová bruska','kufr s bity','prodlužka']},
           {p:[[486,75],[350,170],[350,420],[232,526]],w:'na vrakoviště',l:['nárazník','volant','sada kol','světlomet']},
           {p:[[486,75],[470,180],[470,290]],w:'k Simonovu autu',l:['autobaterie','zrcátko','klíče od auta']}];
function thiefGo(path,state,spd){TH.path=path.map(([a,b])=>[X(a),Z(b)]);TH.wi=0;TH.state=state;thief.speed=spd;TH.stuck=0;TH.ld=1e9}
function chaseThief(msg){if(!['go','steal','back'].includes(TH.state))return;STATS.chased++;TH.loot=null;thiefGo([[thief.x/S+OX,thief.z/S+OY],[486,75]],'flee',5.2);play('kick',.4);toast(msg)}
function doorsTick(dt){GATE.t+=((GATE.open?1:0)-GATE.t)*Math.min(1,dt*1.6);gateG.position.set(-GATE.t*5.4,0,-.45*Math.min(1,GATE.t*6));
  const G=window.__GAR;G.t+=((G.open?1:0)-G.t)*Math.min(1,dt*1.8);G.m.position.y=1.275+G.t*2.3;G.m.scale.y=2.55*(1-G.t*.85)}
const SIM={state:'work',path:[],wi:0,gp:[],gi:0,gateMine:false,t:0};
const GOLF_OUT=[[580,300],[486,200],[486,95],[486,-18],[430,-20],[-60,-20],[-180,-20],[-195,65],[-195,600],[-195,2150],...[[ -21.3,150],[-17.7,164],[-8.5,168],[-7.3,187],[-4,201],[2,220],[3,235],[26,242],[27,245]].map(([x,z])=>[OX+x/S,OY+z/S])];
function simGarage(open){const G=window.__GAR;if(open!==G.open)toggleGarage()}
function simGate(open){if(open&&!GATE.open){toggleGate();SIM.gateMine=true}if(!open&&SIM.gateMine&&GATE.open){toggleGate();SIM.gateMine=false}}
const outsideYard=o=>o.x<60&&(o.x<X(62)||o.x>X(1255)||o.z<Z(58)||o.z>Z(1425));
function homePath(o){const px=o.x/S+OX,py=o.z/S+OY,P0=[],G=[[486,0],[486,95]];
  if(py>1425)P0.push([px,1730],[-60,1730],[-60,0]);else if(px<62)P0.push([-60,py],[-60,0]);else if(px>1255)P0.push([px,1730],[-60,1730],[-60,0]);else P0.push([px,0]);
  return P0.concat(G).map(([a,b])=>[X(a),Z(b)])}
let gateBy=null;
function goHome(o,dt){                                   // vrací true, dokud je postava na cestě zpátky do areálu
  if(!o.hp){if(!outsideYard(o))return false;o.hp=homePath(o);o.hi=0;o.ht=0;o.hd=1e9}
  const [tx,tz]=o.hp[o.hi],d=Math.hypot(tx-o.x,tz-o.z);if(d<o.hd-.05){o.hd=d;o.ht=0}else if((o.ht+=dt)>3){o.x=tx;o.z=tz}
  if(o.hi>=o.hp.length-2&&!GATE.open){toggleGate();gateBy=o}
  if(goTo(o,tx,tz,o.speed,dt,.45)){o.hi++;o.hd=1e9;o.ht=0;if(o.hi>=o.hp.length){o.hp=null;if(gateBy===o&&GATE.open){toggleGate();gateBy=null}return false}}
  return true}
function simonTick(dt){const hr=DAY.t*24;
  if(SIM.state==='work'){if(hr>=21&&hr<23.9&&P()!==simon&&!(DRV.on&&DRV.who===simon)){const gv=VEH.find(v=>v.g===golf);if(gv&&gv.kind==='wreck'){SIM.state='walkAway';SIM.path=[[486,160],[486,80],[486,10],[-60,-20],[-60,2150]].map(([a,b])=>[X(a),Z(b)]);SIM.wi=0;simGate(true);return}
      SIM.state='walkOut';SIM.path=[[530,300]].map(([a,b])=>[X(a),Z(b)]);SIM.wi=0;simGate(true);if(Math.hypot(golf.position.x-X(580),golf.position.z-Z(300))>1){carBox(golf,false);golf.position.set(X(580),0,Z(300));golf.rotation.y=0;carBox(golf,true)}
      if(!inside&&Math.hypot(simon.x-P().x,simon.z-P().z)<25)toast('Simon končí – jde k černému Golfu a odjíždí domů.')}return}
  if(SIM.state==='walkAway'){const [tx,tz]=SIM.path[SIM.wi];SIM.t+=dt;if(goTo(simon,tx,tz,simon.speed,dt,.45)||SIM.t>10){SIM.wi++;SIM.t=0;if(SIM.wi===4)simGate(false);if(SIM.wi>=SIM.path.length){simon.obj.visible=false;simon.asleep=true;SIM.state='away'}}return}
  if(SIM.state==='walkOut'||SIM.state==='walkIn'){const [tx,tz]=SIM.path[SIM.wi];SIM.t+=dt;
    if(goTo(simon,tx,tz,simon.speed,dt,.45)||SIM.t>8){SIM.wi++;SIM.t=0;if(SIM.wi>=SIM.path.length){
      if(SIM.state==='walkOut'){simon.obj.visible=false;simon.asleep=true;SIM.state='driveOut';SIM.gp=GOLF_OUT;SIM.gi=1;carBox(golf,false);play('door',distVol(simon,.6))}
      else{SIM.state='work';simGate(false)}}}
    return}
  if(SIM.state==='driveOut'||SIM.state==='driveIn'){const [tx,tz]=SIM.gp[SIM.gi],gx=X(tx),gz=Z(tz),dx=gx-golf.position.x,dz=gz-golf.position.z,d=Math.hypot(dx,dz),sp=7*dt;
    const rot=Math.atan2(dx,dz),advance=Math.min(d,sp),nx=golf.position.x+Math.sin(rot)*advance,nz=golf.position.z+Math.cos(rot)*advance;
    const oldLayer=COL_IN;COL_IN=false;
    let wall;
    try{wall=[-1.45,0,1.45].some(k=>blocked(nx+Math.sin(rot)*k,nz+Math.cos(rot)*k,0,.88,.55))}
    finally{COL_IN=oldLayer}
    if(wall)return;
    golf.rotation.y=rot;golf.position.x=nx;golf.position.z=nz;if(d<=sp)SIM.gi++;
    if(SIM.gi>=SIM.gp.length){if(SIM.state==='driveOut'){golf.visible=true;carBox(golf,true);SIM.state='away';simGate(false)}
      else{golf.rotation.y=0;carBox(golf,true);simon.obj.visible=true;simon.asleep=false;simon.x=X(530);simon.z=Z(300);simon.y=0;SIM.state='walkIn';SIM.path=[[480,330]].map(([a,b])=>[X(a),Z(b)]);SIM.wi=0;simGate(true);play('door',distVol(simon,.6))}}
    return}
  if(SIM.state==='away'&&hr>=7&&hr<21){{const gv=VEH.find(v=>v.g===golf);if(gv&&gv.kind==='wreck')repairCar(gv)}SIM.state='driveIn';carBox(golf,false);simGate(true);golf.visible=true;const p0=GOLF_OUT[GOLF_OUT.length-1];golf.position.set(X(p0[0]),0,Z(p0[1]));SIM.gp=[...GOLF_OUT].reverse();SIM.gi=1;
    if(!inside)toast('Simon přijel černým Golfem do práce.')}
}
function thiefTick(dt){
  const hr=DAY.t*24,p=P();
  window.__cabins.forEach((c,i)=>{c.resident.visible=TH.state==='off'||i!==TH.day%window.__cabins.length});
  if(TH.state==='selling'){TH.t-=dt;thief.obj.rotation.y=Math.atan2(TH.buyer.x-thief.x,TH.buyer.z-thief.z);if(TH.t<=0){STATS.stolen++;if(!inside&&Math.hypot(p.x-thief.x,p.z-thief.z)<16)toast('Zloděj prodal na ulici: '+TH.loot+'.');TH.loot=null;TH.state='off';thief.obj.visible=false}return}
  if(TH.state==='off'){if(GATE.open&&DAY.n!==TH.day&&hr>=TH.hr&&hr<21){TH.day=DAY.n;TH.hr=9+Math.random()*11;TH.tg=pick(THT);
      thief.x=X(486);thief.z=Z(0);thief.y=0;thief.obj.visible=true;thiefGo(TH.tg.p,'go',2.6);
      if(!inside)toast('Někdo z buněk vešel otevřenou bránou a jde '+TH.tg.w+'! Vyžeň ho (E).');play('bark_boban',distVol(boban,.7))}return}
  if(TH.state==='steal'){TH.t-=dt;step(thief,0,0,0,dt);for(const a of thief.obj.userData.arms)a.rotation.x=-1+Math.sin(TH.t*14)*.4;play('click',distVol(thief,.4),500);
    if(TH.t<=0){TH.loot=pick(TH.tg.l);thiefGo([...TH.tg.p].reverse(),'back',3.6)}}
  else if(TH.state==='over'){TH.t-=dt;thief.y+=dt*2.4;thief.obj.position.y=thief.y;if(TH.t<=0){thief.obj.visible=false;TH.state='off';thief.y=0;
      if(TH.loot){STATS.stolen++;if(!inside)toast('Zloděj zmizel za zdí i s: '+TH.loot+'.')}TH.loot=null}}
  else{const [tx,tz]=TH.path[TH.wi],d=Math.hypot(tx-thief.x,tz-thief.z);
    if(!GATE.open&&Math.abs(thief.x-X(486))<2.4&&Math.abs(thief.z-Z(38))<1.8)return;
    if(d<TH.ld-.05){TH.ld=d;TH.stuck=0}else if((TH.stuck+=dt)>2.5){TH.stuck=0;TH.ld=1e9}
    if(goTo(thief,tx,tz,thief.speed,dt,.4)){TH.wi++;TH.ld=1e9;TH.stuck=0;if(TH.wi>=TH.path.length){
      if(TH.state==='street'){TH.state='selling';TH.t=3;TH.buyer.talk=4}
      else if(TH.state==='back'&&TH.loot){TH.buyer=PEDS.find(a=>a.buyer);const end=TH.buyer;
        thiefGo([[486,75],[486,0],[-60,0],[end.x/S+OX,end.z/S+OY]],'street',3.3)}
      else if(TH.state==='go'){TH.state='steal';TH.t=4}else if(TH.state==='flee'){thiefGo([[486,0]],'leave',2.8)}else{TH.state='off';thief.obj.visible=false}}}
    for(const a of thief.obj.userData.arms)a.rotation.x=(TH.loot?-1.1:0)+Math.sin(thief.phase)*.5*thief.moving}
  if(['go','steal','back'].includes(TH.state)&&!boban.muted&&!boban.fly&&Math.hypot(boban.x-thief.x,boban.z-thief.z)<1.4){chaseThief('Boban zloděje vyštěkal! Utekl s prázdnou.');play('bark_boban',.6)}
}
const ML={state:'home',t:25,trips:0,path:[],wi:0};
const milanLines=['Milan: „Čau. Nemám čas, nosím dřevo.“','Milan: „Ten Boban mi zase sežral rukavici.“','Milan: „Ještě dvě bedny a jdu spát. Možná.“','Milan: „Kdo zase nechal otevřenou branku?“'];
function milanAI(dt){
  if(MOUT.st!=='home')return;
  const p=P();
  if(ML.state==='home'){const hr=DAY.t*24;if(hr>=17.8&&hr<19&&ML.day!==DAY.n){ML.day=DAY.n;
    {milan.x=X(682);milan.z=Z(1090);milan.y=.5;milan.vy=0;milan.obj.visible=true;crate.visible=false;
      ML.trips=2+(Math.random()<.5?1:0);ML.path=route('up','down','dl','cs','cn','lawn','wood');ML.wi=0;ML.state='walk';ML.next='load';
      play('door',distVol(milan,.6));if(!inside&&Math.hypot(milan.x-p.x,milan.z-p.z)<20)toast('Je kolem šesté. Z Bytu 1 vyšel Milan pro dřevo.')}
    }
    return}
  if(ML.state==='inside'){ML.t-=dt;if(ML.t<=0){milan.obj.visible=true;milan.x=X(128);milan.z=Z(1395);play('door',distVol(milan,.6));
    if(ML.trips>0){ML.path=route('pg2','pg1','hs','dl','cs','cn','lawn','wood');ML.next='load'}else{ML.path=route('pg2','pg1','dl','down','up','door');ML.next='home'}
    ML.wi=0;ML.state='walk'}return}
  if(ML.state==='load'){ML.t-=dt;step(milan,0,0,0,dt);milan.head=Math.atan2(X(968)-milan.x,Z(640)-milan.z);
    if(ML.t<=0){crate.visible=true;play('crate',distVol(milan,.6));ML.path=route('lawn','cn','cs','dl','hs','pg1','pg2','house');ML.wi=0;ML.state='walk';ML.next='inside'}}
  else if(ML.state==='walk'){
    const [tx,tz]=ML.path[ML.wi];
    if(goTo(milan,tx,tz,milan.speed,dt,.35)){ML.wi++;if(ML.wi>=ML.path.length){
      if(ML.next==='load'){ML.state='load';ML.t=2.5}
      else if(ML.next==='inside'){play('crate',distVol(milan,.5));STATS.wood++;ML.state='inside';ML.t=4;ML.trips--;milan.obj.visible=false;crate.visible=false;play('door',distVol(milan,.6))}
      else{ML.state='home';ML.t=night>.5?70+Math.random()*50:160+Math.random()*120;milan.obj.visible=false;play('door',distVol(milan,.6))}}}
  }
  const carry=crate.visible?-1.25:0;for(const a of milan.obj.userData.arms)a.rotation.x=carry+(carry?0:Math.sin(milan.phase)*.4*milan.moving);
}


// ---------- konec dne ve 23:00 ----------
function endDay(){
  started=false;if(document.pointerLockElement)document.exitPointerLock();
  for(const k of ['steps_grass','steps_paving'])if(SFX[k]&&!SFX[k].paused)SFX[k].pause();
  $('edTitle').textContent='Konec dne '+DAY.n;
  const rows=[['Boban odkopnut',STATS.kicks],['Ponožek na Bobanovu hubu',STATS.socks],['Nářadí ukradeno Bobanem',STATS.steals],
    ['Jackie pomazlena',STATS.pets],['Věcí, co Ashley sežrala',STATS.eaten],['Beden dřeva od Milana',STATS.wood],['Zlodějů vyhnáno',STATS.chased],['Ukradeno zlodějem',STATS.stolen]];
  rows.push(['Zakázek hotovo',STATS.jobs||0],['Prodaných aut Simonovi',STATS.sold||0]);
  for(const h of people){const cs=h.cs;if(!cs)continue;rows.push([h.name+' – vydělal / utratil',fmtK(cs.earn||0)+' / '+fmtK(cs.spend||0)],[h.name+' – má u sebe',fmtK(cs.money)]);cs.earn=0;cs.spend=0}
  const ul=$('edList');ul.textContent='';
  for(const [k,v] of rows){const li=document.createElement('li');const a=document.createElement('span');a.textContent=k;const b=document.createElement('b');b.textContent=v;li.append(a,b);ul.appendChild(li)}
  $('endday').classList.add('on');
}
$('edNext').addEventListener('click',()=>{
  if(ctrl)setCtrl(null);
  DAY.t=7/24;for(const k in STATS)STATS[k]=0;try{saveGame(true)}catch(_){}
  for(const q of people){q.asleep=false;q.obj.visible=true;q.sleepPath=null}tereza.x=X(1040);tereza.z=Z(960);tereza.y=0;
  if(inside){inside=false;room=null;sitting=false;interiorG.visible=false;COL_IN=false;cam.layers.set(0);ray.layers.set(0);$("mm").style.display=""}
  const p=P();p.x=X(900);p.z=Z(470);p.y=0;p.vy=0;p.head=0;yaw=Math.PI;camT.set(p.x,1.35,p.z);
  {const gv=VEH.find(v=>v.g===golf);if(gv&&gv.kind==='wreck'){repairCar(gv);carBox(golf,false);golf.position.set(X(580),0,Z(300));golf.rotation.y=0;carBox(golf,true)}}
  if(SIM.state!=='work'){SIM.state='work';golf.visible=true;golf.position.set(X(580),0,Z(300));golf.rotation.y=0;carBox(golf,true);const w=ca(2.25,2.55);simon.x=w.x;simon.z=w.z;simon.y=0;simGate(false)}
  for(const d of [ashley,jackie,boban]){const H=homeOf(d);d.atHome=false;d.obj.visible=true;d.x=H.x+(Math.random()-.5)*.3;d.z=H.z;d.y=groundAt(H.x,H.z,5);d.vy=0;d.mode=d===boban?'follow':'wander';d.tx=d.x;d.tz=d.z}
  $('endday').classList.remove('on');started=true;play('click');toast('Den '+(DAY.n+1)+'. Dobré ráno!');
  if(matchMedia('(pointer:fine)').matches){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(_){}}
});

// ---------- minimapa ----------
const mm=$('mm'),mg=mm.getContext('2d'),MS=mm.width/1218;
const mapRects=[[622,58,1255,558,'#9b8a6e'],[100,1133,558,1420,'#c9a172'],[564,1136,900,1410,'#bdb6ab'],[765,597,903,1130,'#d3ccbf'],[923,797,1164,1125,'#a8e07f'],
  [62,58,622,805,'#8e8c86'],[1183,526,1246,1393,'#a89b86'],[552,558,658,1133,'#efe6d6'],[62,558,552,1133,'#efe6d6'],[40,1133,100,1425,'#efe6d6'],[40,1425,1275,1640,'#efe6d6'],
  [665,584,750,1130,'#9e978a'],[750,642,776,1120,'#c0392b'],[787,151,1021,307,'#9c7a55'],[1028,150,1180,551,'#e6dcc8'],[653,157,765,297,'#2f5d4a'],
  [1030,618,1123,745,'#b8322a'],[915,584,1028,656,'#8a5a32'],[935,690,985,740,'#3d2a1a'],[562,1140,656,1236,'#6b4a2f'],
  [594,104,1172,134,'#d9cdb5'],[40,38,372,58,'#d9cdb5'],[600,38,1275,58,'#d9cdb5'],[372,40,600,56,'#4a4f55'],[20,58,72,558,'#b8aa90'],[623,146,643,240,'#d9cdb5'],[658,558,800,584,'#d9cdb5'],[852,558,1165,584,'#d9cdb5'],[1128,806,1142,934,'#2f7fd6'],
  [270,185,310,345,'#1f4f9a'],[149,478,316,574,'#c8ccd0'],[352,458,493,532,'#5a5f66'],[145,349,189,416,'#9fd3ff']];
const mmBase=document.createElement('canvas');mmBase.width=mm.width;mmBase.height=mm.height;
{const g=mmBase.getContext('2d');g.fillStyle='#7cbf5a';g.fillRect(0,0,mm.width,mm.height);
  for(const [a,b,c,d,col] of mapRects){g.fillStyle=col;g.fillRect((a-50)*MS,(b-50)*MS,(c-a)*MS,(d-b)*MS)}
  g.strokeStyle='#7a0f1a';g.lineWidth=3;g.strokeRect((57-50)*MS,(52-50)*MS,(1260-57)*MS,(1425-52)*MS)}
const toMM=a=>[(a.x/S+OX-50)*MS,(a.z/S+OY-50)*MS];
function drawMM(){
  mg.drawImage(mmBase,0,0);
  for(const [a,c,r] of [[ashley,'#9aa3ad',4],[jackie,'#d9965a',4],[boban,'#111',4]].filter(a=>a[0].obj.visible).concat(people.filter(q=>q!==P()&&q.obj.visible).map(q=>[q,'#fff',5])).concat(milan.obj.visible?[[milan,'#3b6fd6',4]]:[]).concat(nikisek.visible?[[{x:nikisek.position.x,z:nikisek.position.z},'#e08a2a',3]]:[],maja.visible?[[{x:maja.position.x,z:maja.position.z},'#cfcfcf',3]]:[])){
    const [x,y]=toMM(a);mg.fillStyle=c;mg.beginPath();mg.arc(x,y,r,0,7);mg.fill();if(a===simon){mg.font='bold 12px sans-serif';mg.strokeStyle='#171a17';mg.lineWidth=3;mg.strokeText('Simon',x+7,y+4);mg.fillStyle='#ffd575';mg.fillText('Simon',x+7,y+4)}}
  if(thief.obj.visible){const [tx,ty]=toMM(thief);mg.fillStyle='#e02020';mg.beginPath();mg.arc(tx,ty,5,0,7);mg.fill();mg.strokeStyle='#fff';mg.lineWidth=2;mg.stroke()}
  const p=P(),[x,y]=toMM(p);
  mg.save();mg.translate(x,y);mg.rotate(-p.head+Math.PI);mg.fillStyle='#ff3b3b';mg.strokeStyle='#fff';mg.lineWidth=2;
  mg.beginPath();mg.moveTo(0,-9);mg.lineTo(6,6);mg.lineTo(-6,6);mg.closePath();mg.fill();mg.stroke();mg.restore();
}

// ---------- příroda: tráva, kytky, živý plot, stromy za plotem, mraky ----------
{const notGrass=mapRects.filter(r=>!['#a8e07f'].includes(r[4])).concat([[560,300,760,558],[919,599,1158,780],[100,1133,560,1425],[40,1425,1275,1640]]);
 const ok=(px,py)=>!window.__RD.some(r=>px>=r[0]&&px<=r[2]&&py>=r[1]&&py<=r[3])&&!notGrass.some(r=>px>r[0]-6&&px<r[2]+6&&py>r[1]-6&&py<r[3]+6)&&!(px>918&&px<1168&&py>792&&py<1130)&&!blocked(X(px),Z(py),0,.15);
 const tuft=new THREE.ConeGeometry(.05,.28,4);tuft.translate(0,.14,0);
 const tm=[],fl=[];const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),v3=new THREE.Vector3(),sc=new THREE.Vector3();
 for(let i=0;i<9000&&tm.length<1800;i++){const px=62+Math.random()*1190,py=58+Math.random()*1370;if(!ok(px,py))continue;
   for(let k=0;k<3;k++){const s=.6+Math.random()*.8;m4.compose(v3.set(X(px)+(Math.random()-.5)*.14,0,Z(py)+(Math.random()-.5)*.14),q.setFromEuler(e.set((Math.random()-.5)*.5,Math.random()*3,(Math.random()-.5)*.5)),sc.set(s,s,s));tm.push(m4.clone())}
   if(Math.random()<.12)fl.push([X(px)+.1,Z(py)])}
 const gi=new THREE.InstancedMesh(tuft,STDM({color:0xffffff}),tm.length);const cc=new THREE.Color();
 tm.forEach((m,i)=>{gi.setMatrixAt(i,m);gi.setColorAt(i,cc.setHex([0x5fa544,0x6db54e,0x7fc35c,0x4f9a3c][i%4]))});scene.add(gi);
 const fi=new THREE.InstancedMesh(SPHLO,STDM({color:0xffffff}),fl.length);
 fl.forEach(([x,z],i)=>{m4.compose(v3.set(x,.2,z),q.identity(),sc.set(.05,.04,.05));fi.setMatrixAt(i,m4);fi.setColorAt(i,cc.setHex([0xffffff,0xf2c14e,0xe8505b,0xb48ae0][i%4]))});scene.add(fi);
 // lístky na živém plotu
 const hb=[];const hedge=[[40,558,62,598],[40,642,62,1440],[1255,38,1275,526],[1246,1390,1275,1430]];
 for(const [a,b,c,d] of hedge){const x1=X(a),x2=X(c),z1=Z(b),z2=Z(d),len=Math.max(x2-x1,z2-z1);for(let t=0;t<len;t+=.45){const al=x2-x1>z2-z1;
   for(const y of [1.55,1.05,.55]){const s=.28+Math.random()*.12;m4.compose(v3.set(al?x1+t:(x1+x2)/2+(Math.random()-.5)*.3,y+(Math.random()-.5)*.15,al?(z1+z2)/2+(Math.random()-.5)*.3:z1+t),q.identity(),sc.set(s,s*.85,s));hb.push(m4.clone())}}}
 const hi=new THREE.InstancedMesh(SPHLO,STDM({color:0xffffff}),hb.length);hb.forEach((m,i)=>{hi.setMatrixAt(i,m);hi.setColorAt(i,cc.setHex([0x3f7d3a,0x4a8a40,0x36703a][i%3]))});hi.castShadow=true;scene.add(hi);
 // stromy za plotem (hloubka scény)
 const tr=[],cr=[];
 const treeOk=(x,z)=>!(x>X(-40)&&x<X(1600)&&z>Z(-380)&&z<Z(1680))&&!BG.some(r=>x>X(r[0])&&x<X(r[2])&&z>Z(r[1])&&z<Z(r[3]))&&!SEG.some(g=>window.__sdist(x,z,g)<g.w/2+3.5)&&!LANDS.some(R=>x>R[0]-2&&x<R[2]+2&&z>R[1]-2&&z<R[3]+2)&&!window.__THS.some(h=>Math.hypot(h[0]-x,h[1]-z)<h[2]+3)&&!(window.__HS||[]).some(r=>x>X(r[0])-3&&x<X(r[2])+3&&z>Z(r[1])-3&&z<Z(r[3])+3)&&!blocked(x,z,0,2.8);
 for(let i=0;i<420;i++){let x,z,tries=0;do{x=TOWN.x1+Math.random()*(TOWN.x2-TOWN.x1);z=TOWN.z1+Math.random()*(TOWN.z2-TOWN.z1);tries++}while(!treeOk(x,z)&&tries<40);if(tries>=40)continue;
   const h=2+Math.random()*2.5,r=1.4+Math.random()*1.4;m4.compose(v3.set(x,h/2,z),q.identity(),sc.set(.35,h,.35));tr.push(m4.clone());
   for(let k=0;k<3;k++){const rr=r*(1-k*.22);m4.compose(v3.set(x+(Math.random()-.5)*.6,h+rr*.6+k*rr*.7,z+(Math.random()-.5)*.6),q.identity(),sc.set(rr,rr*.9,rr));cr.push(m4.clone())}}
 const ti=new THREE.InstancedMesh(CYL,M(0x6b4a2e),tr.length);tr.forEach((m,i)=>ti.setMatrixAt(i,m));ti.castShadow=true;scene.add(ti);
 const ci=new THREE.InstancedMesh(SPHLO,STDM({color:0xffffff}),cr.length);cr.forEach((m,i)=>{ci.setMatrixAt(i,m);ci.setColorAt(i,cc.setHex([0x4f9a3c,0x3f8a32,0x5fae48,0x2f7a30][i%4]))});ci.castShadow=true;scene.add(ci);
}
const clouds=[];{const cm=STDM({color:0xffffff,emissive:0x8a96a6,fog:false});
 for(let i=0;i<9;i++){const g=new THREE.Group();for(let k=0;k<5;k++){const m=new THREE.Mesh(SPH,cm);const s=2.5+Math.random()*2.5;m.scale.set(s*1.4,s*.7,s);m.position.set(k*2.6-5+Math.random(),Math.random()*1.2,(Math.random()-.5)*2.5);g.add(m)}
  g.position.set((Math.random()-.5)*160,38+Math.random()*12,(Math.random()-.5)*160);g.userData.v=.4+Math.random()*.5;scene.add(g);clouds.push(g)}}
function cloudTick(dt){for(const c of clouds){c.position.x+=c.userData.v*dt;if(c.position.x>90)c.position.x=-90;c.visible=!inside}}

// ---------- smyčka ----------
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);try{GFX.resize&&GFX.resize()}catch(_){}cam.aspect=w/h;cam.fov=w<h?72:60;cam.updateProjectionMatrix()}
addEventListener('resize',resize);resize();
let started=false;
$('go').addEventListener('click',()=>{started=true;$('pauseButton').hidden=false;musInit();setAudio(true);play('click');$('ov').classList.add('hide');$('bswitch').textContent='↻ '+people[nextActor()].name;
  if(matchMedia('(pointer:fine)').matches){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>$('lockhint').classList.add('on'))}catch(_){$('lockhint').classList.add('on')}}});
const ray=new THREE.Raycaster(),camT=new THREE.Vector3(X(900),1.35,Z(470)),camDir=new THREE.Vector3();let camD=dist;

// ---------- post-processing: HDR → bloom → ACES → sRGB → vinětace (vlastní, bez addonů, three r128) ----------
const GFX={on:true,q:2,bloom:.22,thr:1.05,exp:.85,sun:3.0,hemiN:.08,hemiD:.42,envK:1,resize:null};
// (IBL přes PMREM v r128/SwiftShader dává černou scénu – místo něj hemisférické světlo)
{const gl2=R.capabilities.isWebGL2,HT=gl2?THREE.HalfFloatType:THREE.UnsignedByteType;
 const mk=(w,h,ms)=>{const o={type:HT,format:THREE.RGBAFormat,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:!!ms,stencilBuffer:false};const t=ms&&gl2&&THREE.WebGLMultisampleRenderTarget?new THREE.WebGLMultisampleRenderTarget(w,h,o):new THREE.WebGLRenderTarget(w,h,o);if(t.samples!==undefined&&ms)t.samples=4;return t};
 let W=2,H=2,rtM=mk(2,2,true),rA=mk(2,2),rB=mk(2,2);
 const qs=new THREE.Scene(),qc=new THREE.OrthographicCamera(-1,1,1,-1,0,1),quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2));quad.frustumCulled=false;qs.add(quad);
 const VS='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
 const bright=new THREE.ShaderMaterial({uniforms:{t:{value:null},thr:{value:1}},vertexShader:VS,depthTest:false,depthWrite:false,fragmentShader:'uniform sampler2D t;uniform float thr;varying vec2 vUv;void main(){vec3 c=texture2D(t,vUv).rgb;float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(thr,thr*1.6,l),1.);}'});
 const blur=new THREE.ShaderMaterial({uniforms:{t:{value:null},dir:{value:new THREE.Vector2()}},vertexShader:VS,depthTest:false,depthWrite:false,fragmentShader:'uniform sampler2D t;uniform vec2 dir;varying vec2 vUv;void main(){vec3 c=texture2D(t,vUv).rgb*0.2270;c+=(texture2D(t,vUv+dir*1.3846).rgb+texture2D(t,vUv-dir*1.3846).rgb)*0.3162;c+=(texture2D(t,vUv+dir*3.2308).rgb+texture2D(t,vUv-dir*3.2308).rgb)*0.0703;gl_FragColor=vec4(c,1.);}'});
 const comp=new THREE.ShaderMaterial({uniforms:{t:{value:null},b:{value:null},bs:{value:.5},ex:{value:1}},vertexShader:VS,depthTest:false,depthWrite:false,fragmentShader:
  'uniform sampler2D t,b;uniform float bs,ex;varying vec2 vUv;vec3 aces(vec3 x){const float a=2.51,b2=0.03,c=2.43,d=0.59,e=0.14;return clamp((x*(a*x+b2))/(x*(c*x+d)+e),0.,1.);}'+
  'vec3 srgb(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-0.055,step(0.0031308,c));}'+
  'void main(){vec3 c=texture2D(t,vUv).rgb+texture2D(b,vUv).rgb*bs;c=aces(c*ex);c=srgb(c);float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,1.18);c=mix(c,c*c*(3.-2.*c),.25);vec2 q=vUv-.5;c*=1.-dot(q,q)*.55;gl_FragColor=vec4(c,1.);}'});
 const pass=(mat,target)=>{quad.material=mat;R.setRenderTarget(target);R.render(qs,qc)};
 GFX.resize=()=>{const pr=R.getPixelRatio();W=Math.max(2,Math.floor(innerWidth*pr));H=Math.max(2,Math.floor(innerHeight*pr));rtM.setSize(W,H);rA.setSize(W>>2,H>>2);rB.setSize(W>>2,H>>2)};GFX.resize();
 const ENVM=[];let envT=0;
 window.renderFrame=function(){const exposure=GFX.exp*(inside?1:1-.17*Math.max(0,1-Math.abs(DAY.t*24-11)/2));
   if(!GFX.on){R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=exposure;R.setRenderTarget(null);R.render(scene,cam);return}
   R.outputEncoding=THREE.LinearEncoding;R.toneMapping=THREE.NoToneMapping;
   if((envT-=1)<=0){envT=30;scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.isMeshStandardMaterial&&!o.material.userData.envR){o.material.userData.envR=1;ENVM.push(o.material)}})}
   for(const m of ENVM)m.envMapIntensity=GFX.envK*.9;
   R.setRenderTarget(rtM);R.clear();R.render(scene,cam);
   bright.uniforms.t.value=rtM.texture;bright.uniforms.thr.value=GFX.thr;pass(bright,rA);
   for(let k=0;k<3;k++){blur.uniforms.t.value=rA.texture;blur.uniforms.dir.value.set((1+k)/(W>>2),0);pass(blur,rB);blur.uniforms.t.value=rB.texture;blur.uniforms.dir.value.set(0,(1+k)/(H>>2));pass(blur,rA)}
   comp.uniforms.t.value=rtM.texture;comp.uniforms.b.value=rA.texture;comp.uniforms.bs.value=GFX.bloom;comp.uniforms.ex.value=exposure;pass(comp,null)}}
function setQuality(q){GFX.q=q;GFX.on=q>0;R.shadowMap.enabled=true;sun.castShadow=q>0;const ms=q===2?2048:1024;if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
  R.setPixelRatio(q===2?Math.min(devicePixelRatio,1.75):1);resize();scene.traverse(o=>{if(o.material&&o.material.isMaterial)o.material.needsUpdate=true});try{localStorage.setItem('pk_q',q)}catch(_){}}
try{const q=+localStorage.getItem('pk_q');if(localStorage.getItem('pk_q')!==null&&q!==2)setQuality(q)}catch(_){}
const FADED=[],_fv=new THREE.Vector3(),_fr=new THREE.Raycaster();let fadeK=0;
const clock=new THREE.Clock(),tgt=new THREE.Vector3(),v=new THREE.Vector3(),haf=$('haf'),heart=$('heart');

// ---------- úvodní obrazovka: výběr postavy (začíná se Pavlem, ostatní se odemknou po něm) ----------
let UNL=false;try{UNL=localStorage.getItem('parksideUnlocked')==='1'}catch(_){}
function unlockOthers(){if(UNL)return;UNL=true;try{localStorage.setItem('parksideUnlocked','1')}catch(_){};toast('Odemčeno: Simon a Tereza! Přepínáš klávesou Q.')}
const SEL=[
 {n:'Pavel',r:'kutil · hratelný',play:0,d:'Kutil s dílnou na dvorku. Vybírá nářadí PARKSIDE i PERFORMANCE, vrtá, řeže a pořád vymýšlí něco ze dřeva.',mk:()=>human(PS.pavel)},
 {n:'Simon',r:'mechanik · hratelný',play:2,d:'Mechanik z vrakoviště a zaměstnanec měsíce. Opravuje a tunuje auto s otevřenou kapotou – vyndat motor, namontovat, doladit.',mk:()=>human(PS.simon)},
 {n:'Tereza',r:'trenérka psů · hratelná',play:1,d:'Kudrnatá trenérka psů. Na cvičišti trénuje Ashley a Jackie. Klávesou X hraješ i za Ashley a za Nikíska.',mk:()=>human(PS.tereza)},
 {n:'Ashley',r:'border kolie',d:'Blue merle border kolie s různobarevnýma očima. Pořád něco sbírá ze země a žere, hrabe v máminé zahrádce. Hratelná přes Terezu (X).',mk:()=>{const g=PS.ashley();g.scale.setScalar(.85);return g}},
 {n:'Jackie',r:'border kolie',d:'Zlatá border kolie s bílou lysinkou. Pořád se chce mazlit – pomazlíš ji přes E, odeženeš přes F.',mk:()=>{const g=PS.jackie();g.scale.setScalar(.85);return g}},
 {n:'Boban',r:'jezevčík · otrava',d:'Otrava celé hry. Štěká, leze pod nohy, krade Pavlovi nářadí a čůrá máminu zahrádku. Jde odkopnout (F) nebo mu dát ponožku na hubu (T).',mk:()=>{const g=PS.boban();g.scale.setScalar(.85);return g}},
 {n:'Milan',r:'soused z Bytu 1',d:'Kolem šesté večer vyjde z Bytu 1 a nosí bedny dřeva z dřevníku do hlavního domu.',mk:()=>{const g=person(0xf0c0a0,0x2b2b2b,0x2f3e5a,0x2a1d14);g.scale.setScalar(.82);return g}},
 {n:'Nikísek',r:'černý mainský mývalí kocour',d:'Chodí po střechách, v noci se honí s Májou. Přes Terezu a Ashley za něj jde hrát, když je poblíž.',mk:()=>{const g=cat(0x161616,0x0b0b0b,0x1f1f1f,0xc8d23a);scene.remove(g);g.visible=true;return g}},
 {n:'Mája',r:'šedá mainská mývalí kočka',d:'Občas proběhne dvorem. Psi ji honí a Boban u toho vyvádí.',mk:()=>{const g=cat(0x86898d,0x6b6e72,0x9a9da1,0xd8a53a);scene.remove(g);g.visible=true;return g}}
];
const selCanvas=$('selc'),selR=new THREE.WebGLRenderer({canvas:selCanvas,antialias:true,alpha:true});selR.setPixelRatio(Math.min(devicePixelRatio,1.25));selR.outputEncoding=THREE.sRGBEncoding;selR.toneMapping=THREE.ACESFilmicToneMapping;selR.toneMappingExposure=1.25;selR.shadowMap.enabled=true;
const selScene=new THREE.Scene(),selCam=new THREE.PerspectiveCamera(36,1,.1,100);
selScene.background=new THREE.Color(0x9fd3f0);selScene.fog=new THREE.Fog(0x9fd3f0,12,34);
selScene.add(new THREE.HemisphereLight(0xffffff,0x4a7a3a,.85));
{const d=new THREE.DirectionalLight(0xfff4e0,.8);d.position.set(4,8,6);d.castShadow=true;d.shadow.mapSize.set(1024,1024);Object.assign(d.shadow.camera,{left:-8,right:8,top:6,bottom:-6});selScene.add(d)}
{const gr=new THREE.Mesh(new THREE.CircleGeometry(13,48),M(0x7cbf5a));gr.rotation.x=-Math.PI/2;gr.receiveShadow=true;selScene.add(gr);
 for(let i=-7;i<=7;i++){const pl=new THREE.Mesh(BOX,M(0xb07a4a));pl.scale.set(.8,1.8,.08);pl.position.set(i*.9,.9,-2.6);selScene.add(pl)}}
SEL.forEach((c,i)=>{c.x=(i-(SEL.length-1)/2)*1.25;c.o=c.mk();c.o.position.set(c.x,0,0);c.o.rotation.y=-.2;c.o.traverse(m=>{if(m.isMesh)m.castShadow=true});selScene.add(c.o);c.big=c.play!==undefined||c.n==='Milan'});
let selI=0;
const cardsEl=$('selcards');
SEL.forEach((c,i)=>{const b=document.createElement('button');b.type='button';const nb=document.createElement('b');nb.textContent=c.n;const sm=document.createElement('small');sm.textContent=c.r;b.append(nb,sm);
  b.addEventListener('click',()=>pickSel(i));cardsEl.appendChild(b);c.btn=b});
function pickSel(i){selI=i;const c=SEL[i];SEL.forEach((x,j)=>x.btn.setAttribute('aria-pressed',j===i));
  $('selname').textContent=c.n;$('seldesc').textContent=c.d;const go=$('go');
  if(c.play===undefined){go.disabled=true;go.textContent='Tahle postava se hrát nedá'}
  else if(c.play!==0&&!UNL){go.disabled=true;go.textContent='Odemkne se po Pavlovi (vyzkoušej nářadí v dílně)'}
  else{go.disabled=false;go.textContent='Hrát za '+({Pavel:'Pavla',Simon:'Simona',Tereza:'Terezu'}[c.n])}
  SEL.forEach(x=>x.btn.classList.toggle('locked',x.play!==undefined&&x.play!==0&&!UNL))}
pickSel(0);
$('go').addEventListener('click',()=>{const c=SEL[selI];if(c.play===undefined)return;act=c.play;$('who').textContent=P().name;$('bswitch').textContent='↻ '+people[nextActor()].name;camT.set(P().x,P().y+1.35,P().z);selRun=false},true);
let selRun=true,selLook=new THREE.Vector3(0,.8,0);const selT0=performance.now();
function selTick(){
  if(!selRun)return;
  const w=selCanvas.clientWidth,h=selCanvas.clientHeight;if(w&&(selCanvas.width!==Math.round(w*selR.getPixelRatio())))selR.setSize(w,h,false);
  selCam.aspect=w/(h||1);if(w>=h)selCam.setViewOffset(w,h,-Math.min(w*.42,460)*.55,0,w,h);else selCam.setViewOffset(w,h,0,h*.24,w,h);selCam.updateProjectionMatrix();
  const t=(performance.now()-selT0)/1000,c=SEL[selI];
  SEL.forEach((x,j)=>{x.o.rotation.y=j===selI?-.2+Math.sin(t*.8)*.5:-.2;x.o.position.y=j===selI?Math.abs(Math.sin(t*3))*.04:0;if(x.o.userData.tail)x.o.userData.tail.rotation.z=Math.sin(t*10+j)*.5});
  selLook.lerp(new THREE.Vector3(c.x,c.big?1:.45,0),.08);
  const d=w<h?6.5:(c.big?4.6:3.4);selCam.position.set(selLook.x+.6,selLook.y+.6,d);selCam.lookAt(selLook.x,selLook.y-.1,0);
  selR.render(selScene,selCam);requestAnimationFrame(selTick);
}
selTick();

function objective(){
  if(ctrl===ashley)return 'Ashley: najdi a sežer všechno, co leží na zemi (E u věci). X = Nikísek / zpět na Terezu.';
  if(ctrl&&ctrl===nkA)return 'Nikísek: dej Bobanovi packou (E u něj) a nenech se chytit psy. X = zpět na Terezu.';
  if(P()===tereza&&!inside&&!ctrl){const n=TASKS.tereza[TI.tereza];if(!n)return 'Tereza: parkur hotový, psi jsou mistři. X = hrát za Ashley.';if(n.need&&!obst[n.need])return 'Tereza: další trénink až bude na cvičišti '+({jump:'skoková laťka',slalom:'slalom',beam:'kladina'}[n.need])+'. Zatím si hraj s Ashley (X).';}
  {const ct=curTask();if(ct)return ({pavel:'Pavel: ',simon:'Simon: ',tereza:'Tereza: '}[ct.who])+ct.t.l+(tWork>0?' – '+Math.round((1-tWork/ct.t.t)*100)+' %':' (E na místě)')}
  if(P()===pavel&&TI.pavel>=TASKS.pavel.length)return 'Pavel: překážky jsou hotové. Můžeš kutit v dílně nebo zkoušet nářadí.';
  if(P()===simon&&TI.simon>=TASKS.simon.length)return 'Simon: zakázka hotová. Auto je jak nové.';
  if(P()===simon)return jobs[job]?'Simon: u auta na vrakovišti stiskni E – '+jobs[job]+'.':'Simon: tuning dokončen, auto je připravené.';
  if(P()===tereza)return 'Tereza: na cvičišti trénuj Ashley a Jackie (E). X = hrát za Ashley.';
  if(room==='shop')return P().name+': u stěny vyber nářadí (E) a vyzkoušej ho (G nebo klik).';
  return 'Pavel: zajdi do dílny pro nářadí. Q = přepnout na Simona.';
}
function pauseGame(on){
  if(paused===on)return;
  paused=on;for(const key in keys)keys[key]=false;
  jx=jz=0;drag=null;
  $('pause').hidden=!on;
  if(on){
    $('objective').textContent=objective();closeTools();
    if(locked())document.exitPointerLock();
    for(const sound of effects)sound.pause();effects.clear();
    for(const sound of Object.values(SFX))if(sound.loop)sound.pause();
    if(MUS.ctx)MUS.ctx.suspend();
    $('resume').focus();
  }else{
    if(matchMedia('(pointer:fine)').matches&&!locked()){try{canvas.requestPointerLock()?.catch(()=>{})}catch{}}
    clock.getDelta();if(audioOn)setAudio(true);
    if(MUS.ctx&&audioOn)MUS.ctx.resume();
  }
}
$('pauseButton').onclick=()=>{if(started)pauseGame(true)};
$('resume').onclick=()=>pauseGame(false);
let hadLock=false;
document.addEventListener('pointerlockchange',()=>{
  if(hadLock&&!locked()&&started&&!paused&&!$('tools').classList.contains('on')&&!listOpen()&&BIG.style.display==='none')pauseGame(true);
  hadLock=locked();
});
function activity(q){
  if(q.asleep||q.atHome)return 'spí';
  if(q===simon&&working>0)return jobs[job];
  if(q===P())return sitting?'sedí':useT>0?'používá nářadí':q.moving>.15?'jde':'stojí';
  if(q.sleepPath)return 'jde spát';
  if(q===simon)return job===jobs.length?'má hotovo':Math.hypot(q.x-ca(0,2.55).x,q.z-ca(0,2.55).z)<1.25?'pracuje na autě':'obchází auto';
  if(q===tereza&&ashley.mode==='play')return 'hraje si s Ashley';
  if(q===ashley&&q.mode==='play')return 'hraje si s Terezou';
  const states={steal:'krade nářadí',eat:'žere',dig:'hrabe',cuddle:'chce pohladit',chase:'běží za hráčem',sniff:'čmuchá',follow:'doprovází hráče',cat:'honí kočku',door:'čeká u dveří'};
  return states[q.mode]||(q.moving>.15?'jde':'odpočívá');
}
let elapsed=0,lastBoard=-1;
function tick(){
  if(paused){requestAnimationFrame(tick);return}

  const rawDt=clock.getDelta(),dt=Math.min(rawDt,.05),t=(elapsed+=dt);REALDT=Math.min(rawDt,.5);
  // hráč
  for(let i=delayed.length-1;i>=0;i--){const entry=delayed[i];entry.left-=dt;if(entry.left<=0){delayed.splice(i,1);entry.fn()}}
  let f=0,s=0;
  if(started){
    if(keys.KeyW)f+=1;if(keys.KeyS||keys.ArrowDown)f-=1;
    if(keys.KeyD||keys.ArrowRight)s+=1;if(keys.KeyA||keys.ArrowLeft)s-=1;
    f-=jz;s+=jx;
  }
  const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=-fz,rz=fx;
  const run=keys.ShiftLeft||keys.ShiftRight||Math.hypot(jx,jz)>.9;
  const p=P();
  if(sitting){if(f||s)standUp();else{f=0;s=0}}
  let slow=p.inPool?.56:1;if((charState().drunkUntil||0)>DAY.n+DAY.t){slow=.6;if(f)s+=.38*Math.sin(t*2.4)}
  if(boban.obj.visible&&!boban.fly&&boban.dazed<=0&&(boban.underT??1)<0&&(f||s)){const bx=boban.x-p.x,bz=boban.z-p.z,bd=Math.hypot(bx,bz);
    if(bd<.8&&(bx*(fx*f+rx*s)+bz*(fz*f+rz*s))>0){slow=Math.min(slow,.4);boban.annoyT-=dt;if(boban.annoyT<=0){boban.annoyT=12;toast('Boban ti leze pod nohy!')}}}
  if(DRV.on)driveTick(dt,f,s);else step(p,fx*f+rx*s,fz*f+rz*s,(guest?(p.speed||2.4):p.speed)*(run?1.7:1)*slow,dt);
  const guestPose=guest&&[p.x,p.y,p.z,p.head];
  const swimming=!inside&&!DRV.on&&p.x>X(386)&&p.x<X(546)&&p.z>Z(-286)&&p.z<Z(-138)&&p.y<.16;
  if(swimming&&!p.inPool){play('click',.25);toast('Žbluňk! Jsi v bazénu. Ke kraji doplaveš pomocí WASD.')}p.inPool=swimming;
  if(swimming)p.obj.position.y=-.48;
  if(sitting)p.obj.position.y=-.12;
  if(useT>0){useT-=dt;holdArm().rotation.z=.1+Math.sin(useT*40)*.08}
  if(pavel.obj.userData.kick>0){pavel.obj.userData.kick-=dt;pavel.obj.rotation.x=-Math.sin(pavel.obj.userData.kick*9)*.25}
  if(p===pavel)weldFx(false,dt);
  if(!ctrl&&!DRV.on)stepsSound(p,run);else for(const k of ['steps_grass','steps_paving'])if(SFX[k]&&!SFX[k].paused)SFX[k].pause();
  YARDCTX=true;const hrN=DAY.t*24,sleepy=hrN>=22||hrN<6;
  if(ctrl&&(sleepy||hrN>=19&&ctrl===ashley)){setCtrl(null);toast('Večer – zvířata jdou domů, hraješ zase za Terezu.')}
  for(const o of [pavel,tereza]){
  if(o===p)continue;
  if(!o.asleep&&goHome(o,dt)){}
  else if(o.asleep){if(!sleepy){o.asleep=false;o.obj.visible=true}}
  else if(sleepy){                                   // Tereza spí v Bytě 1, Pavel ve svém nedodělaném bytě
    if(!o.sleepPath){o.sleepPath=o===tereza?route('dl','down','up','door'):[[X(900),Z(475)],[X(1028)-.7,flatDoorZ]];o.sleepI=0;o.sleepT=0}
    o.sleepT+=dt;const [sx,sz]=o.sleepPath[o.sleepI];
    if(goTo(o,sx,sz,o.speed,dt,.4)||o.sleepT>12){o.sleepI++;o.sleepT=0;if(o.sleepI>=o.sleepPath.length){o.asleep=true;o.obj.visible=false;o.sleepPath=null;if(!inside)play('door',distVol(o,.5))}}}
  else if(o===tereza){goTo(o,X(1040)+Math.sin(t*.35)*1.8,Z(960)+Math.cos(t*.35)*1.8,1.1,dt,.15)}
  else if(o===pavel)pavelIdle(o,dt,t);
  else step(o,0,0,0,dt);
  o.obj.userData.head.rotation.y=Math.sin(t*.6)*.3;
  }
  mechanicTick(dt,t);taskTick(dt);
  dogAI(ashley,-1,dt,t);dogAI(jackie,1,dt,t);bobanAI(dt,t);
  nikisekAI(dt,t);majaAI(dt,t);YARDCTX=false;dayTick(dt);cloudTick(dt);YARDCTX=true;milanAI(dt);thiefTick(dt);doorsTick(dt);simonTick(dt);YARDCTX=false;trafficTick(dt);copsTick(dt,t);drawRadar(t);smokeTick(dt,t);
  crumbT-=dt;if(crumbT<=0){crumbT=4+Math.random()*4;spawnCrumb()}
  setMood(pickMood(p));musTick();
  const nearB=started&&Math.hypot(boban.x-p.x,boban.z-p.z)<2.2;
  $('bsock').classList.toggle('on',nearB&&!boban.muted);
  const nearJ=jackie.mode==='cuddle'&&Math.hypot(jackie.x-p.x,jackie.z-p.z)<1.6;
  $('bkick').classList.toggle('on',(nearB&&!boban.fly||nearJ)&&matchMedia('(pointer:coarse)').matches);$('bkick').textContent=cur&&cur.jackie?'Odehnat':'Kopnout';
  const mt=$('mute');mt.classList.toggle('on',boban.muted>0);if(boban.muted>0)mt.textContent='Boban ztlumen: '+Math.ceil(boban.muted)+' s';
  const ht=boban.mode==='steal'?'MÁ TVOJE NÁŘADÍ!':boban.dazed>0?'✶ ✶ ✶':boban.muted>0?'mmmf…':'HAF!';if(haf.textContent!==ht)haf.textContent=ht;
  for(const d of [ashley,jackie])d.obj.userData.tail.rotation.z=Math.sin(t*(d.moving?14:8))*.5;
  // interakce
  {const ob=started?objective():'';const tb=$('taskbar');if(tb.textContent!==ob)tb.textContent=ob;tb.classList.toggle('on',!!ob);
   const showX=started&&!inside&&(people[act]===tereza||!!ctrl);$('bx').classList.toggle('on',showX);$('bx').textContent=ctrl===ashley?'X Nikísek/Tereza':ctrl?'X Tereza':'X Ashley'}
  if(guest&&guestPose){[p.x,p.y,p.z,p.head]=guestPose;p.obj.position.set(p.x,p.y,p.z);p.obj.rotation.y=p.head}
  cur=started&&!guest?nearest():null;
  $('prompt').classList.toggle('on',!!cur);
  if(cur)$('prompt').querySelector('kbd').textContent=cur.car?'F':'E';
  if(cur)$('ptext').textContent=cur.label+(cur.who>=0&&cur.who!==act?' (jen '+people[cur.who].name+')':'');
  if(toastT>0){toastT-=dt;if(toastT<=0)$('toast').classList.remove('on')}
  // kamera
  // kamera se sama srovná za postavu, když jdeš dopředu a nehýbeš myší
  if(f>.1&&t-lastLook>1.2){let d=(p.head+Math.PI)-yaw;d=Math.atan2(Math.sin(d),Math.cos(d));yaw+=d*Math.min(1,dt*1.6)}
  skyDome.position.copy(cam.position);
  camT.lerp(tgt.set(p.x,p.y+(ctrl?.7:1.35),p.z),Math.min(1,dt*10));
  camDir.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
  const FP=(viewFirst??inside)&&!ctrl&&!guest&&!DRV.on,TOPV=false;
  if(DRV.on){const ep=Math.max(pitch,.32);camDir.set(Math.sin(yaw)*Math.cos(ep),Math.sin(ep),Math.cos(yaw)*Math.cos(ep))}
  const dmax=DRV.on?Math.max(dist,9.5):inside||ctrl?Math.min(dist,3.6):dist;
  ray.set(camT,camDir);ray.far=dmax;
  const hit=ray.intersectObjects(camMeshes,false)[0];
  const cd=hit?Math.max(.6,hit.distance-.45):dmax;
  camD+=(cd-camD)*Math.min(1,dt*(cd<camD?20:4));
  cam.position.copy(camT).addScaledVector(camDir,camD);
  if(cam.position.y<.4)cam.position.y=.4;
  if(FP){const fpP=(pitch-.45)*1.6;cam.position.set(p.x,p.y+(p.dog?.55:1.62),p.z);_fv.set(-Math.sin(yaw)*Math.cos(fpP),-Math.sin(fpP),-Math.cos(yaw)*Math.cos(fpP));if(cam.near!==.05){cam.near=.05;cam.updateProjectionMatrix()}}
  else if(cam.near!==.25){cam.near=.25;cam.updateProjectionMatrix()}
  if(p.obj&&!DRV.on)p.obj.visible=!FP;
  if(inside&&RM[room]&&!FP){const R0=RM[room],cx=R0.cx,cz=R0.cz,hw=R0.w/2-.35,hd=R0.d/2-.35;
    cam.position.x=Math.max(cx-hw,Math.min(cx+hw,cam.position.x));cam.position.z=Math.max(cz-hd,Math.min(cz+hd,cam.position.z));
    if(!R0.top)cam.position.y=Math.min(cam.position.y,R0.h-.3)}
  if(FP)cam.lookAt(cam.position.x+_fv.x,cam.position.y+_fv.y,cam.position.z+_fv.z);else cam.lookAt(camT);
  // v místnostech: stěny mezi kamerou a postavou zprůhlední (místo pohledu shora)
  for(const m of FADED)m.material=m.userData._mat;FADED.length=0;
  if(TOPV){_fv.copy(cam.position).sub(camT);const L=_fv.length();_fv.normalize();_fr.set(camT,_fv);_fr.far=L;_fr.layers.set(2);
    for(const h of _fr.intersectObject(interiorG,true)){const m=h.object;if(!m.isMesh||m.scale.y<1.2)continue;if(!m.userData._mat){m.userData._mat=m.material;m.userData._fm=m.material.clone();m.userData._fm.transparent=true;m.userData._fm.opacity=.18;m.userData._fm.depthWrite=false}
      m.material=m.userData._fm;FADED.push(m)}}
  if($('cameraTV').open&&(!feedFrame.next||performance.now()>feedFrame.next)){feedFrame.next=performance.now()+180;feedFrame(+$('cameraSelect').value,$('cameraPicture'))}
  renderFrame();
  // bublina HAF
  v.set(boban.x,boban.y+.95,boban.z).project(cam);
  const on=(boban.barking>0||boban.dazed>0)&&v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1;
  haf.classList.toggle('on',on);
  if(on){haf.style.left=(v.x*.5+.5)*innerWidth+'px';haf.style.top=(-v.y*.5+.5)*innerHeight+'px'}
  // srdíčka nad Jackie
  v.set(jackie.x,jackie.y+.95,jackie.z).project(cam);
  const hon=jackie.mode==='cuddle'&&v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1&&Math.hypot(jackie.x-p.x,jackie.z-p.z)<10;
  heart.classList.toggle('on',hon);heart.classList.toggle('big',!!jackie.petted&&jackie.mode==='cuddle');
  if(hon){heart.style.left=(v.x*.5+.5)*innerWidth+'px';heart.style.top=(-v.y*.5+.5)*innerHeight+'px'}
  if(started&&t-lastBoard>.25){
    lastBoard=t;$('board').hidden=false;
    const pp=DRV.on?DRV.car.g.position:p,outT=!inside&&(pp.x>=60||outsideYard(pp));const bt=outT?'Dění na ulici':'Dění na dvorku';if($('boardT').textContent!==bt)$('boardT').textContent=bt;
    if(outT){$('activities').textContent=streetRows(pp).join('\n')}else{
    const actors=[pavel,tereza,simon,ashley,jackie,boban];
    const names=['Pavel','Tereza','Simon','Ashley','Jackie','Boban'];
    const rows=actors.map((q,i)=>names[i]+' · '+activity(q));
    if(milan.obj.visible)rows.push('Milan · '+(crate.visible?'nese dřevo':ML.state==='load'?'nakládá dřevo':'jde pro dřevo'));
    if(nikisek.visible)rows.push('Nikišek · '+(NK.state==='sit'?'sedí na střeše':NK.state==='chase'?'honí Máju':'chodí po střeše'));
    if(maja.visible)rows.push('Mája · běží po dvorku');
    $('activities').textContent=rows.join('\n');}
  }else if(!started)$('board').hidden=true;
  drawMM();
  requestAnimationFrame(tick);
}
try{refreshWall();if(loadGame())setTimeout(()=>toast('Načtena uložená hra (den '+DAY.n+').'),1500)}catch(e){console.warn(e)}
$('saveBtn').onclick=()=>saveGame(false);
$('shopclose').onclick=e=>{e.stopPropagation();closeList()};
window.latestTest=()=>{
const check=(v,n)=>{if(!v)throw Error(n)};
try{
shopLidl(true);const moneyBefore=ECO.money;$('shopgrid').children[11].click();check(basket().length===1&&ECO.money===moneyBefore,'basket');checkout();$('shopgrid').firstChild.click();check(charState().treats===6&&ECO.money===moneyBefore-59,'cashier');
shopLidl(true);$('shopgrid').firstChild.click();settleBasket(true);check(WANT.lvl>0,'wanted');
const place=[pavel,boban,yardMom];for(const a of place){a.x=100;a.z=100;a.y=0;a.obj.visible=true}yardMom.z=97;yardMom.head=0;boban.z=100.6;boban.kickCD=0;boban.fly=null;const old=ECO.money;kickBoban();check(ECO.money<old,'witness');
pumpMenu(null);$('shopgrid').firstChild.click();check(charState().pumpBill===210,'fuel bill');spots.find(a=>a.in==='fuelShop'&&a.label.includes('Kasa')).act();$('shopgrid').firstChild.click();check(!charState().pumpBill,'fuel cashier');
check(feeds.length<50,'private cameras');check(sleepers.length===3,'sleepers');extraLife(.01);DAY.t=22/24;simGate(true);SIM.state='driveOut';SIM.gp=GOLF_OUT;SIM.gi=1;carBox(golf,false);
 for(let i=0;i<1800&&SIM.state==='driveOut';i++){const x=golf.position.x,z=golf.position.z,idx=SIM.gi;simonTick(.075);if(Math.hypot(x-golf.position.x,z-golf.position.z)<.00001&&SIM.gi===idx)break}
 document.documentElement.dataset.route=SIM.state+' '+SIM.gi+' '+golf.position.x+' '+golf.position.z;
 document.documentElement.dataset.test='passed'
}catch(e){document.documentElement.dataset.test=String(e)}
}


tick();
}
