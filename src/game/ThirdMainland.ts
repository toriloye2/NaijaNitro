import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { makeAsphaltMaterial, addRaceDecor } from './RoadSurface';
import { decorateLagoon } from './LagoonDecor';
import { addLagosStreetscape } from './LagosStreetscape';

const RX = 115, RZ = 75, WIDTH = 27;
const mat = (color: number, metalness = 0, roughness = .82) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });
function box(scene: THREE.Scene, width: number, height: number, depth: number,
  material: THREE.Material, x: number, y: number, z: number, yaw = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  m.position.set(x,y,z); m.rotation.y = yaw;
  m.castShadow = false; m.receiveShadow = true; scene.add(m);
  return m;
}
function billboard(scene: THREE.Scene, text: string, x: number, y: number, z: number, yaw: number) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#08734a'; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle = '#e5f4ee'; ctx.lineWidth = 15; ctx.strokeRect(10,10,1004,236);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 74px Arial'; ctx.fillText(text,512,125,990);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Mesh(new THREE.PlaneGeometry(16,4),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
  s.position.set(x,y,z); s.rotation.y = yaw; scene.add(s);
  return s;
}
function ellipse(a: number, offset = 0) {
  // This parameterization is intentionally the same as the physics race loop.
  const x = RX*Math.cos(a), z = RZ*Math.sin(a);
  const tangent = new THREE.Vector3(-RX*Math.sin(a),0,RZ*Math.cos(a)).normalize();
  const normal = new THREE.Vector3(tangent.z,0,-tangent.x);
  const yaw = Math.atan2(tangent.x,tangent.z);
  return {x:x+normal.x*offset,z:z+normal.z*offset,tangent,normal,yaw};
}
function ribbon(scene: THREE.Scene, offset: number, width: number, elevation: number, material: THREE.Material) {
  const vertices: number[] = [], uv: number[] = [], ids: number[] = [], segments = 256;
  for(let i=0;i<=segments;i++){
    const a = i/segments*Math.PI*2;
    for(const s of [-1,1]){
      const p=ellipse(a,offset+s*width*.5);
      vertices.push(p.x,elevation,p.z);
      uv.push(i/segments,s<0?0:1);
    }
    if(i<segments){const j=i*2;ids.push(j,j+1,j+2,j+1,j+3,j+2);}
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(ids); geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);
  material.side=THREE.DoubleSide; mesh.receiveShadow=true;scene.add(mesh);
  return mesh;
}

/**
 * Fictional, optimized racetrack evocative of Lagos Third Mainland Bridge.
 * This is an oval race loop, not a geographically accurate road model.
 */
export function createThirdMainland(scene: THREE.Scene,world:RAPIER.World) {
  const asphalt=makeAsphaltMaterial(),lane=mat(0xe3e8e3),edge=mat(0xf2c948),
    concrete=mat(0xc3c8c6),darkConcrete=mat(0x8c9a9c),steel=mat(0x718b94,.25),
    sea=mat(0x1c829d,.18,.4);
  scene.background=new THREE.Color(0x8dbcd0);
  scene.fog=new THREE.FogExp2(0x8dbcd0,.0017);
  scene.add(new THREE.HemisphereLight(0xf3fcff,0x4f7781,2.1));
  const sun=new THREE.DirectionalLight(0xffefd0,2.0);
  sun.position.set(-85,145,70);scene.add(sun);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),sea);
  water.rotation.x=-Math.PI/2;water.position.y=-3.4;scene.add(water);
  // Shoreline strips on distant mainland with layered skyline rather than towers in the lagoon.
  const landMat=mat(0x71876d);
  box(scene,630,.55,260,landMat,0,-3.1,335);
  box(scene,560,.55,225,landMat,0,-3.1,-335);
  const roadBase=ribbon(scene,0,WIDTH+2,-.22,concrete);
  roadBase.receiveShadow=true;
  ribbon(scene,0,WIDTH,.04,asphalt);
  for(const offset of [-11.4,11.4]) ribbon(scene,offset,.2,.082,edge);
  for(const offset of [-4.55,4.55]) {
    // Dashed lane markings, following exact road curvature.
    for(let i=0;i<105;i++){
      const a=(i+.1)/105*Math.PI*2;
      const p=ellipse(a,offset);
      box(scene,.16,.025,3.2,lane,p.x,.092,p.z,p.yaw);
    }
  }
  // Actual physical deck, not an invisible infinite plane.
  const body=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,-.20,0));
  // Thin fixed strips approximate the curved driving surface.
  for(let i=0;i<256;i++){
    const a=(i+.5)/256*Math.PI*2,p=ellipse(a);
    world.createCollider(RAPIER.ColliderDesc.cuboid(WIDTH*.5,.23,2.25)
      .setTranslation(p.x,0,p.z)
      .setRotation({x:0,y:Math.sin(p.yaw*.5),z:0,w:Math.cos(p.yaw*.5)})
      .setFriction(1.25),body);
  }
  const lightMetal=mat(0xd4dedd,.6,.38);
  for(let i=0;i<128;i++){
    const a=i/128*Math.PI*2;
    for(const side of [-1,1]){
      const p=ellipse(a,side*(WIDTH/2+.9));
      const rail=box(scene,.42,1.12,4.9,concrete,p.x,.44,p.z,p.yaw);
      rail.receiveShadow=true;
      const rb=world.createRigidBody(RAPIER.RigidBodyDesc.fixed()
        .setTranslation(p.x,.48,p.z)
        .setRotation({x:0,y:Math.sin(p.yaw*.5),z:0,w:Math.cos(p.yaw*.5)}));
      world.createCollider(RAPIER.ColliderDesc.cuboid(.32,.7,2.55).setFriction(.35),rb);
      if(i%2===0){
        const bar=ellipse(a,side*(WIDTH/2+1.15));
        box(scene,.12,.11,9.65,steel,bar.x,1.18,bar.z,p.yaw);
      }
    }
    if(i%6===0){
      const p=ellipse(a,-(WIDTH/2+2.8));
      box(scene,.26,7.5,.26,lightMetal,p.x,3.5,p.z);
      const arm=box(scene,.14,.14,3.2,lightMetal,p.x,7.05,p.z,p.yaw);
      arm.position.x+=p.normal.x*1.4;arm.position.z+=p.normal.z*1.4;
      box(scene,1.25,.22,.58,mat(0xf2f7dd),p.x+p.normal.x*2.7,6.94,p.z+p.normal.z*2.7);
    }
    // Repeating bridge pylons spaced above water, plus cross beams beneath the road.
    if(i%4===0){
      const p=ellipse(a);
      for(const side of [-8.6,8.6]){
        box(scene,2.2,3.25,2.3,darkConcrete,p.x+p.normal.x*side,-1.78,p.z+p.normal.z*side,p.yaw);
      }
      box(scene,21,.5,2.8,concrete,p.x,-.45,p.z,p.yaw);
    }
  }
  // Detailed Nigerian storefronts, balconies, window geometry and vegetation.
  addLagosStreetscape(scene);
  const signage=[
    {a:.12,text:'THIRD MAINLAND BRIDGE'},
    {a:2.05,text:'LAGOS ISLAND'},
    {a:4.16,text:'WELCOME TO LAGOS'}
  ];
  addRaceDecor(scene);
  decorateLagoon(scene);
  for(const s of signage){
    const p=ellipse(s.a,0);
    for(const offset of [-10.5,10.5]){
      box(scene,.25,6.5,.25,steel,p.x+p.normal.x*offset,3.4,p.z+p.normal.z*offset);
    }
    const board=billboard(scene,s.text,p.x,6.1,p.z,p.yaw);
    board.position.addScaledVector(p.tangent,-1);
  }
  return { raceRadii: [RX,RZ] as const };
}
