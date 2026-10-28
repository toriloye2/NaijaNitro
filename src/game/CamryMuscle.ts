import * as THREE from 'three';

/**
 * Original game-ready procedural sedan inspired by the 2007–2011
 * Toyota Camry XV40 ("Camry Muscle" in Nigeria).
 * Modelled from user-provided front, rear and side photo references.
 * Front faces -Z. No photographs, official logos, or third-party models are embedded.
 */
export interface CarVisual {
  group: THREE.Group;
  wheels: THREE.Group[];
  brakeLights: THREE.Mesh[];
  paint: THREE.MeshPhysicalMaterial;
}

const v=(x:number,y:number,z:number)=>new THREE.Vector3(x,y,z);
const paintBase=new THREE.MeshPhysicalMaterial({color:0xd0d7df,metalness:.68,roughness:.25,clearcoat:.82,clearcoatRoughness:.16,side:THREE.DoubleSide});
const glass=new THREE.MeshPhysicalMaterial({color:0x203747,metalness:.25,roughness:.12,transparent:true,opacity:.89,side:THREE.DoubleSide});
const trim=new THREE.MeshStandardMaterial({color:0x111820,metalness:.26,roughness:.52,side:THREE.DoubleSide});
const chrome=new THREE.MeshStandardMaterial({color:0xc8d2d8,metalness:.92,roughness:.15,side:THREE.DoubleSide});
const grille=new THREE.MeshStandardMaterial({color:0x11171e,metalness:.15,roughness:.69,side:THREE.DoubleSide});
const rubber=new THREE.MeshStandardMaterial({color:0x121519,roughness:.96});
const lamp=new THREE.MeshPhysicalMaterial({color:0xe9f7ff,roughness:.09,metalness:.15,clearcoat:1,emissive:0x7aa5bb,emissiveIntensity:.22,side:THREE.DoubleSide});
const amber=new THREE.MeshPhysicalMaterial({color:0xffa63e,roughness:.18,emissive:0xa34b0c,emissiveIntensity:.33,side:THREE.DoubleSide});
const red=new THREE.MeshPhysicalMaterial({color:0xc91528,roughness:.2,clearcoat:.8,emissive:0x5f0910,emissiveIntensity:.24,side:THREE.DoubleSide});
const whiteReverse=new THREE.MeshPhysicalMaterial({color:0xf6f7ef,roughness:.15,emissive:0x7c8480,emissiveIntensity:.1,side:THREE.DoubleSide});
const detail=new THREE.MeshStandardMaterial({color:0x465159,metalness:.72,roughness:.3,side:THREE.DoubleSide});
const bodySections: [number,number,number,number][]=[
  [-2.52,.74,.54,.77],[-2.41,.91,.45,.94],[-2.20,1.02,.44,1.04],
  [-1.63,1.06,.44,1.12],[-.97,1.075,.43,1.17],
  [.55,1.08,.43,1.17],[1.38,1.073,.43,1.16],
  [2.17,1.045,.45,1.02],[2.46,.92,.52,.95],[2.53,.79,.61,.81]
];
function meshFaces(parent:THREE.Object3D,faces:THREE.Vector3[][],material:THREE.Material){
  const positions:number[]=[];
  for(const face of faces) for(let i=1;i+1<face.length;i++){
    positions.push(...face[0].toArray(),...face[i].toArray(),...face[i+1].toArray());
  }
  const geom=new THREE.BufferGeometry();
  geom.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geom.computeVertexNormals();
  const m=new THREE.Mesh(geom,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);
  return m;
}
function strip(parent:THREE.Object3D,points:THREE.Vector3[],material:THREE.Material,width=.02){
  const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
  const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(7,points.length*5),width,5,false),material);
  tube.castShadow=false;parent.add(tube);return tube;
}
function box(parent:THREE.Object3D,w:number,h:number,d:number,material:THREE.Material,x:number,y:number,z:number){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);m.castShadow=true;return m;
}
function cylinder(parent:THREE.Object3D,rad:number,depth:number,material:THREE.Material,x:number,y:number,z:number,segments=20){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad,depth,segments),material);
  m.rotation.z=Math.PI/2;m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;
}
function wheel(parent:THREE.Group,side:number,z:number){
  const g=new THREE.Group();g.position.set(side*1.02,.48,z);
  cylinder(g,.44,.27,rubber,side*.13,0,0,28);
  cylinder(g,.32,.282,chrome,side*.14,0,0,24);
  cylinder(g,.277,.295,detail,side*.15,0,0,24);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.31,.025,7,32),chrome);
  rim.rotation.y=Math.PI/2;rim.position.x=side*.30;g.add(rim);
  // Five tapered spoke pairs approximate the factory alloys in the references.
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    for(const shift of [-.17,.17]){
      const spoke=box(g,.045,.235,.042,chrome,side*.304,Math.cos(a+shift)*.145,Math.sin(a+shift)*.145);
      spoke.rotation.x=a+shift;
    }
  }
  cylinder(g,.078,.315,chrome,side*.17,0,0,16);
  parent.add(g);return g;
}
function createBody(g:THREE.Group,paint:THREE.MeshPhysicalMaterial){
  const faces:THREE.Vector3[][]=[];
  const b=bodySections;
  for(let i=0;i<b.length-1;i++){
    const [z1,w1,yb1,yt1]=b[i],[z2,w2,yb2,yt2]=b[i+1];
    faces.push([v(-w1,yb1,z1),v(-w2,yb2,z2),v(-w2,yt2,z2),v(-w1,yt1,z1)]);
    faces.push([v(w1,yb1,z1),v(w1,yt1,z1),v(w2,yt2,z2),v(w2,yb2,z2)]);
    faces.push([v(-w1,yt1,z1),v(-w2,yt2,z2),v(w2,yt2,z2),v(w1,yt1,z1)]);
  }
  faces.push([v(-b[0][1],b[0][2],b[0][0]),v(b[0][1],b[0][2],b[0][0]),v(b[0][1],b[0][3],b[0][0]),v(-b[0][1],b[0][3],b[0][0])]);
  faces.push([v(-.79,.61,2.53),v(-.79,.81,2.53),v(.79,.81,2.53),v(.79,.61,2.53)]);
  meshFaces(g,faces,paint);
  // Rounded hood creases and raised shoulder lines.
  for(const s of [-1,1]){
    strip(g,[v(s*.44,1.111,-2.17),v(s*.54,1.157,-1.67),v(s*.72,1.175,-1.03)],paint,.018);
    strip(g,[v(s*1.085,1.14,-.91),v(s*1.088,1.145,.15),v(s*1.079,1.13,1.39)],chrome,.009);
    strip(g,[v(s*.91,.88,-2.42),v(s*1.06,1.05,-2.16),v(s*1.079,1.13,-1.4)],paint,.024);
  }
}
function createCabin(g:THREE.Group,paint:THREE.MeshPhysicalMaterial){
  // Authentic three-box sedan profile: inclined windshield, long roof, C-pillar and trunk.
  const sections=[
    {z:-1.15,y:1.19,w:1.0},
    {z:-.54,y:1.86,w:.84},
    {z:.74,y:1.84,w:.84},
    {z:1.53,y:1.17,w:1.025}
  ];
  const panels:THREE.Vector3[][]=[];
  for(let i=0;i<sections.length-1;i++){
    const a=sections[i],b=sections[i+1];
    panels.push([v(-a.w,a.y,a.z),v(-b.w,b.y,b.z),v(b.w,b.y,b.z),v(a.w,a.y,a.z)]);
    for(const side of [-1,1])panels.push([v(side*a.w,1.17,a.z),v(side*a.w,a.y,a.z),v(side*b.w,b.y,b.z),v(side*b.w,1.17,b.z)]);
  }
  meshFaces(g,panels,paint);
  // Seamlessly blended top roof panel.
  meshFaces(g,[[v(-.84,1.86,-.54),v(-.84,1.84,.74),v(.84,1.84,.74),v(.84,1.86,-.54)]],paint);
  meshFaces(g,[[v(-.83,1.846,-.58),v(.83,1.846,-.58),v(.976,1.204,-1.125),v(-.976,1.204,-1.125)]],glass);
  meshFaces(g,[[v(-.81,1.843,.78),v(-.975,1.205,1.49),v(.975,1.205,1.49),v(.81,1.843,.78)]],glass);
  for(const s of [-1,1]){
    // Front and rear door windows divided by a black B-pillar.
    meshFaces(g,[[v(s*.993,1.21,-1.08),v(s*.845,1.802,-.53),v(s*.844,1.801,.035),v(s*1.006,1.208,.035)]],glass);
    meshFaces(g,[[v(s*.843,1.801,.09),v(s*.84,1.78,.7),v(s*.981,1.203,1.38),v(s*1.006,1.207,.09)]],glass);
    strip(g,[v(s*.842,1.825,-.54),v(s*.85,1.815,.68),v(s*1.013,1.215,1.41)],chrome,.017);
    strip(g,[v(s*1.023,1.213,-1.13),v(s*.863,1.868,-.54),v(s*.855,1.857,.73),v(s*1.025,1.21,1.5)],trim,.028);
    strip(g,[v(s*1.011,1.227,-1.12),v(s*1.009,1.22,.03),v(s*1.013,1.216,1.47)],chrome,.014);
    strip(g,[v(s*.851,1.808,.07),v(s*1.012,1.207,.075)],trim,.036);
    // Pronounced side door cuts and matching exterior handles.
    strip(g,[v(s*1.089,.59,-.16),v(s*1.092,.82,-.15),v(s*1.09,1.14,-.15)],trim,.008);
    strip(g,[v(s*1.083,.59,1.47),v(s*1.08,.82,1.47),v(s*1.079,1.14,1.47)],trim,.008);
    box(g,.12,.056,.29,chrome,s*1.1,1.035,-.49);
    box(g,.12,.056,.29,chrome,s*1.1,1.035,.85);
    // Body-coloured, offset side mirrors.
    box(g,.24,.19,.31,paint,s*1.11,1.2,-.91);
    box(g,.06,.11,.26,trim,s*1.24,1.18,-.92);
    // Black window weather stripping.
    strip(g,[v(s*.993,1.205,-1.08),v(s*1.009,1.205,.08),v(s*.99,1.203,1.39)],trim,.022);
  }
}
function createFront(g:THREE.Group,paint:THREE.MeshPhysicalMaterial){
  // Trapezoid mesh grille, thick chrome outline and real lens-like headlamp housings.
  const frame=[v(-.66,.73,-2.524),v(-.79,1.0,-2.47),v(0,1.056,-2.49),v(.79,1.0,-2.47),v(.66,.73,-2.524)];
  meshFaces(g,[[v(-.65,.76,-2.528),v(.65,.76,-2.528),v(.73,.984,-2.476),v(0,1.03,-2.495),v(-.73,.984,-2.476)]],grille);
  strip(g,frame,chrome,.042);
  // Fine grille mesh represented by 7 slim slats.
  for(let i=0;i<7;i++){
    const y=.765+i*.035;
    box(g,1.1-(i*.05),.009,.028,detail,0,y,-2.536+i*.006);
  }
  for(const side of [-1,1]){
    // Long swept-back headlight cluster in the upper bumper / fender.
    const shape=[v(side*.64,1.049,-2.455),v(side*1.01,1.073,-2.34),
      v(side*1.079,1.151,-1.96),v(side*.82,.96,-2.423)];
    meshFaces(g,[shape],trim);
    const inner=shape.map(p=>p.clone().add(v(-side*.018,.008,-.009)));
    meshFaces(g,[[inner[0],inner[1],inner[2],inner[3]]],lamp);
    // Headlight projector and orange outer corner marker.
    const projector=new THREE.Mesh(new THREE.SphereGeometry(.08,12,10),chrome);
    projector.scale.set(1,1,.32);projector.position.set(side*.83,1.031,-2.428);g.add(projector);
    meshFaces(g,[[v(side*1.023,1.087,-2.304),v(side*1.071,1.144,-2.033),v(side*.951,1.056,-2.31)]],amber);
    box(g,.36,.14,.055,grille,side*.76,.57,-2.48);
    box(g,.24,.10,.064,chrome,side*.77,.57,-2.508);
  }
  // Lower radiator intake, split fog-light panels, bumper lip and front plate.
  meshFaces(g,[[v(-.79,.49,-2.455),v(.79,.49,-2.455),v(.71,.69,-2.485),v(-.71,.69,-2.485)]],grille);
  strip(g,[v(-.79,.48,-2.46),v(0,.455,-2.52),v(.79,.48,-2.46)],paint,.047);
  box(g,.48,.15,.045,whiteReverse,0,.85,-2.54);
}
function createRear(g:THREE.Group,paint:THREE.MeshPhysicalMaterial,brakes:THREE.Mesh[]){
  // Continuous decklid, wide XV40-style horizontal tail lights.
  meshFaces(g,[[v(-.91,1.041,2.37),v(.91,1.041,2.37),v(.77,.944,2.53),v(-.77,.944,2.53)]],paint);
  strip(g,[v(-.87,1.035,2.39),v(0,1.055,2.49),v(.87,1.035,2.39)],chrome,.018);
  for(const s of [-1,1]){
    const p=[v(s*.42,1.087,2.47),v(s*1.005,1.076,2.34),v(s*.97,.86,2.49),v(s*.44,.87,2.525)];
    const light=meshFaces(g,[p],red);brakes.push(light);
    meshFaces(g,[[v(s*.43,1.012,2.532),v(s*.86,.995,2.48),v(s*.84,.939,2.5),v(s*.45,.946,2.534)]],whiteReverse);
    strip(g,[p[0],p[1],p[2],p[3],p[0]],trim,.016);
  }
  box(g,.88,.14,.05,chrome,0,.98,2.535);
  box(g,.52,.19,.055,whiteReverse,0,.78,2.55);
  box(g,.32,.16,.05,trim,0,.59,2.555);
  box(g,.15,.06,.09,detail,.72,.52,2.52);
}
export function createCamryMuscle():CarVisual{
  // Each race/garage model has its own independently customizable paint.
  const paint=paintBase.clone();
  const group=new THREE.Group(),wheels:THREE.Group[]=[],brakeLights:THREE.Mesh[]=[];
  createBody(group,paint);
  createCabin(group,paint);
  createFront(group,paint);
  createRear(group,paint,brakeLights);
  for(const s of [-1,1])for(const z of [-1.47,1.51])wheels.push(wheel(group,s,z));
  // Wheel arch lips emphasize the real model's wheelbase.
  for(const side of [-1,1])for(const z of [-1.47,1.51]){
    const arch=new THREE.Mesh(new THREE.TorusGeometry(.493,.031,6,24,Math.PI),paint);
    arch.rotation.y=Math.PI/2;arch.rotation.z=Math.PI;
    arch.position.set(side*1.085,.52,z);
    group.add(arch);
  }
  group.userData.model='Camry Muscle 2010, XV40-inspired';
  return {group,wheels,brakeLights,paint};
}
