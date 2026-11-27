// The PARKSIDE – postavy (low-poly, Three.js r128)
// Použití: PS.pavel(), PS.tereza(), PS.ashley(), PS.jackie(), PS.boban() -> THREE.Group
window.PS=(()=>{
const mats={};
const M=c=>mats[c]||(mats[c]=new THREE.MeshStandardMaterial({color:new THREE.Color(c).convertSRGBToLinear(),roughness:.8,metalness:0}));   // PBR (lineární barvy) – grafika podle Outpost Siege
function part(geo,color,x,y,z,parent,sx=1,sy=1,sz=1){
  const m=new THREE.Mesh(geo,M(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);
  m.castShadow=true;parent.add(m);return m;
}
const SPH=new THREE.SphereGeometry(1,20,14),BOX=new THREE.BoxGeometry(1,1,1),CYL=new THREE.CylinderGeometry(1,1,1,14),CONE=new THREE.ConeGeometry(1,1,10);

// ---------- PAVEL ----------
function pavel(mechanic=false){
  const p=new THREE.Group();
  const SKIN=mechanic?0x794c35:0xf0b89a,TEE=0x1b1b1b,OVR=mechanic?0x345e80:0x1f4d3a,OVD=mechanic?0x233d52:0x163a2b;
  // nohy (lacláče)
  part(CYL,OVD,-.17,.42,0,p,.15,.84,.15);part(CYL,OVD,.17,.42,0,p,.15,.84,.15);
  part(BOX,0x111111,-.17,.05,.05,p,.22,.1,.34);part(BOX,0x111111,.17,.05,.05,p,.22,.1,.34);
  // trup – zavalitější
  part(SPH,TEE,0,1.2,0,p,.42,.48,.32);
  part(SPH,OVR,0,.95,0,p,.43,.3,.33);
  part(BOX,OVR,0,1.22,.27,p,.42,.36,.06);
  part(BOX,0x0f0f0f,0,1.25,.305,p,.24,.16,.02);// kapsa
  part(BOX,OVR,-.16,1.48,.2,p,.06,.3,.06).rotation.x=.25;
  part(BOX,OVR,.16,1.48,.2,p,.06,.3,.06).rotation.x=.25;
  // ruce
  const armL=new THREE.Group();armL.position.set(-.45,1.45,0);p.add(armL);
  part(SPH,TEE,0,-.08,0,armL,.15,.18,.15);part(CYL,SKIN,0,-.38,0,armL,.1,.42,.1);part(SPH,SKIN,0,-.6,0,armL,.11,.11,.11);
  armL.rotation.z=-.15;
  const armR=new THREE.Group();armR.position.set(.45,1.45,0);p.add(armR);
  part(SPH,TEE,0,-.08,0,armR,.15,.18,.15);part(CYL,SKIN,0,-.38,0,armR,.1,.42,.1);part(SPH,SKIN,0,-.6,0,armR,.11,.11,.11);
  armR.rotation.x=-1.1;armR.rotation.z=.1;
  // aku vrtačka (zelená/černá, bez loga)
  const drill=new THREE.Group();drill.position.set(0,-.66,.05);armR.add(drill);
  part(BOX,0x1f5a3c,0,0,0,drill,.1,.24,.1);
  part(BOX,0x1f5a3c,0,.1,.12,drill,.12,.12,.3);
  part(BOX,0x151515,0,-.15,0,drill,.14,.08,.16);
  part(BOX,0xc8202a,0,-.12,.085,drill,.1,.025,.01);
  part(CYL,0x888888,0,.1,.32,drill,.03,.12,.03).rotation.x=Math.PI/2;
  drill.rotation.x=Math.PI/2;
  // hlava
  const head=new THREE.Group();head.position.y=1.92;p.add(head);
  part(SPH,SKIN,0,0,0,head,.27,.29,.27);
  part(SPH,SKIN,0,-.12,.04,head,.24,.15,.22);// tvářičky
  part(SPH,0x2a2a2a,-.09,.03,.24,head,.03,.035,.02);part(SPH,0x2a2a2a,.09,.03,.24,head,.03,.035,.02);
  part(SPH,mechanic?0x87523b:0xe7a28a,0,-.04,.27,head,.04,.035,.03);
  part(BOX,0xb86b5a,0,-.13,.24,head,.09,.015,.02);
  part(SPH,SKIN,-.27,0,0,head,.05,.07,.04);part(SPH,SKIN,.27,0,0,head,.05,.07,.04);
  // ježaté melírované vlasy
  part(SPH,mechanic?0x241c19:0x6b4a2e,0,.12,-.02,head,.28,.18,.28);
  for(let i=0;i<22;i++){
    const a=i/22*Math.PI*2,r=.05+Math.random()*.17;
    const s=part(CONE,i%3?0xc9a56b:0xe0c48a,Math.cos(a)*r,.27,Math.sin(a)*r*.9+.02,head,.07,.2+Math.random()*.08,.07);
    s.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);
  }
  p.userData={armR,head};
  return p;
}

// ---------- TEREZA ----------
function tereza(){
  const p=new THREE.Group();
  const SKIN=0xf3c6a8,TOP=0x8a5ad1,JEAN=0x3b5d8f,HAIR=0x5a3520;
  part(CYL,JEAN,-.12,.42,0,p,.11,.84,.11);part(CYL,JEAN,.12,.42,0,p,.11,.84,.11);
  part(BOX,0xffffff,-.12,.05,.05,p,.17,.1,.3);part(BOX,0xffffff,.12,.05,.05,p,.17,.1,.3);
  part(SPH,TOP,0,1.15,0,p,.3,.4,.22);
  const aL=new THREE.Group();aL.position.set(-.33,1.42,0);p.add(aL);
  part(CYL,TOP,0,-.18,0,aL,.08,.36,.08);part(CYL,SKIN,0,-.48,0,aL,.065,.26,.065);aL.rotation.z=-.2;
  const aR=new THREE.Group();aR.position.set(.33,1.42,0);p.add(aR);
  part(CYL,TOP,0,-.18,0,aR,.08,.36,.08);part(CYL,SKIN,0,-.48,0,aR,.065,.26,.065);aR.rotation.z=.2;
  part(SPH,0xd94f7a,0,-.65,.02,aR,.06,.06,.06);// pamlsek
  const head=new THREE.Group();head.position.y=1.8;p.add(head);
  part(SPH,SKIN,0,0,0,head,.22,.25,.22);
  part(SPH,0x2a2a2a,-.075,.03,.2,head,.028,.034,.02);part(SPH,0x2a2a2a,.075,.03,.2,head,.028,.034,.02);
  part(BOX,0xc4566a,0,-.1,.205,head,.07,.015,.02);
  // kudrny
  for(let i=0;i<60;i++){
    const th=Math.random()*Math.PI*2,ph=Math.random()*Math.PI*.62;
    let x=Math.sin(ph)*Math.cos(th)*.27,y=Math.cos(ph)*.27+.02,z=Math.sin(ph)*Math.sin(th)*.27;
    if(z>.12&&y<.18)continue;
    part(SPH,i%4?HAIR:0x6e4428,x,y,z-.02,head,.08,.08,.08);
  }
  for(let i=0;i<16;i++){const a=Math.PI*.15+i/16*Math.PI*.7;part(SPH,HAIR,Math.cos(a)*.26,-.15-Math.random()*.2,-Math.sin(a)*.15-.05,head,.08,.08,.08)}
  p.userData={armR:aR,head};
  return p;
}

// ---------- PES ----------
function dog(o){
  const d=new THREE.Group();
  const L=o.len,H=o.leg;
  const body=part(SPH,o.base,0,H+.22,0,d,.24,.22,L);
  if(o.patch)part(SPH,o.patch,.02,H+.34,-.05,d,.2,.13,L*.6);
  part(SPH,o.chest,0,H+.18,L*.75,d,.19,.2,.16);
  // nohy
  for(const [x,z] of [[-.12,L*.6],[.12,L*.6],[-.12,-L*.6],[.12,-L*.6]]){
    part(CYL,o.legC,x,H/2,z,d,.06,H,.06);part(SPH,o.paw,x,.04,z+.03,d,.07,.05,.09);
  }
  if(o.collar)part(new THREE.TorusGeometry(.13,.03,8,16),o.collar,0,H+.38,L*.82,d).rotation.x=Math.PI/2.4;
  // hlava
  const head=new THREE.Group();head.position.set(0,H+.48,L*.95);d.add(head);
  part(SPH,o.base,0,0,0,head,.19,.18,.18);
  part(SPH,o.muzzle,0,-.06,.16,head,.1,.08,o.snout);
  part(SPH,0x1a1a1a,0,-.03,.16+o.snout,head,.045,.035,.035);
  if(o.blaze)part(BOX,0xf6f2ea,0,.06,.16,head,.05,.18,.04).rotation.x=-.4;
  if(o.brows){part(SPH,0xb5651d,-.07,.08,.15,head,.03,.02,.02);part(SPH,0xb5651d,.07,.08,.15,head,.03,.02,.02)}
  part(SPH,o.eyeL,-.08,.04,.14,head,.03,.03,.02);part(SPH,o.eyeR,.08,.04,.14,head,.03,.03,.02);
  if(o.tongue)part(SPH,0xe8708a,0,-.13,.2,head,.04,.06,.025);
  for(const s of [-1,1]){
    const e=part(o.floppy?SPH:CONE,o.ear,s*.13,o.floppy?-.06:.15,0,head,o.floppy?.06:.07,o.floppy?.17:.14,o.floppy?.1:.05);
    e.rotation.z=o.floppy?s*.15:s*-.5;if(!o.floppy)e.rotation.x=-.2;
  }
  // ocas
  const tail=new THREE.Group();tail.position.set(0,H+.3,-L*.9);d.add(tail);
  const t=part(CONE,o.tail,0,o.tailLen/2,0,tail,.06,o.tailLen,.06);
  if(o.tailTip)part(SPH,o.tailTip,0,o.tailLen*.85,0,tail,.05,.08,.05);
  tail.rotation.x=-(o.tailUp||.9);
  d.userData={tail,head};
  return d;
}

const ashleyOpts=({len:.42,leg:.36,base:0x9aa3ad,patch:0x22262b,chest:0xf6f2ea,legC:0xf6f2ea,paw:0xffffff,muzzle:0xf6f2ea,snout:.12,
  eyeL:0x7ab8e6,eyeR:0x6b3b1f,ear:0x3a3f45,tail:0xb7bec6,tailTip:0xffffff,tongue:true,blaze:true});
const jackieOpts=({len:.4,leg:.36,base:0xd9965a,chest:0xf8f1e4,legC:0xf8f1e4,paw:0xffffff,muzzle:0xf8f1e4,snout:.12,
  eyeL:0x5a3218,eyeR:0x5a3218,ear:0xd08a4e,tail:0xe2a76c,tailTip:0xf8f1e4,blaze:true});
const bobanOpts=({len:.5,leg:.15,base:0x1d1a18,chest:0x1d1a18,legC:0xa85a22,paw:0xa85a22,muzzle:0xa85a22,snout:.16,
  eyeL:0x4a2810,eyeR:0x4a2810,ear:0x1d1a18,floppy:true,tail:0x1d1a18,tailUp:1.2,collar:0x2f6fd6,brows:true});


return {M,part,SPH,BOX,CYL,CONE,pavel,tereza,simon:()=>pavel(true),
  ashley:()=>dog(ashleyOpts),jackie:()=>dog(jackieOpts),boban:()=>dog(bobanOpts)};
})();
