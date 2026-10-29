import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

// Reusable Nigerian streetscape meshes with layered architecture, storefronts,
// window frames, balconies, roof details and proper curved palm fronds.
// These are original game-ready assets; no third-party logos or licensed models.
const concrete = new THREE.MeshStandardMaterial({color:0xc5b6a4,roughness:.91});
const plaster = [0xe7d5b9,0xcba992,0xd5c7b4,0xaabbb5,0xd9cbb4].map(color=>new THREE.MeshStandardMaterial({color,roughness:.88}));
const glass = new THREE.MeshPhysicalMaterial({color:0x315a68,metalness:.34,roughness:.25,clearcoat:.25});
const dark = new THREE.MeshStandardMaterial({color:0x353b39,metalness:.25,roughness:.62});
const metal = new THREE.MeshStandardMaterial({color:0x8e9695,metalness:.65,roughness:.4});
const awnings = [0x117a66,0xf2c64c,0xce4934,0x356da0].map(color=>new THREE.MeshStandardMaterial({color,roughness:.87}));
const palmBark = new THREE.MeshStandardMaterial({color:0x766044,roughness:1});
const palmLeaf = new THREE.MeshStandardMaterial({color:0x276b3a,side:THREE.DoubleSide,roughness:1});
const boxGeo = new THREE.BoxGeometry(1,1,1);
function block(parent:THREE.Object3D,mat:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number) {
 const m=new THREE.Mesh(boxGeo,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function sign(parent:THREE.Object3D,label:string,w:number,h:number,y:number,z:number) {
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
 const ctx=canvas.getContext('2d');
 if(!ctx)return;
 ctx.fillStyle='#17644c';ctx.fillRect(0,0,512,128);
 ctx.fillStyle='#f7f0d9';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.font='bold 46px sans-serif';ctx.fillText(label,256,68,480);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
 mesh.position.set(0,y,z);parent.add(mesh);
}
function building(index:number, tall:boolean) {
 const g=new THREE.Group(), floors=tall?7+index%7:2+index%3;
 const width=tall?10+index%4*3:12+index%3*3;
 const depth=tall?11+index%3*2:10+index%4*2;
 const floorHeight=tall?3.5:3.1;
 const height=floors*floorHeight;
 block(g,plaster[index%plaster.length],0,height/2,0,width,height,depth);
 block(g,concrete,0,height+.15,0,width+.5,.3,depth+.5);
 // Columns, deep-set glazing and projecting slabs give real silhouette and parallax.
 for(let floor=0;floor<floors;floor++){
  const y=1.9+floor*floorHeight;
  for(let col=0;col<3;col++){
   const x=(col-1)*width*.29;
   block(g,dark,x,y,depth/2+.018,width*.18,1.48,.08);
   block(g,glass,x,y,depth/2+.074,width*.16,1.28,.035);
   block(g,metal,x,y,depth/2+.11,.065,1.38,.06);
   block(g,metal,x,y-.67,depth/2+.11,width*.18,.065,.06);
  }
  if(floor>0){
   block(g,concrete,0,y-1.02,depth/2+.48,width+.3,.15,1.07);
   block(g,metal,0,y-.38,depth/2+.96,width+.1,.07,.08);
   for(let col=0;col<6;col++)
    block(g,metal,(col-2.5)*width/6,y-.68,depth/2+.96,.045,.63,.07);
  }
 }
 // Roof tanks, service cabin, rooftop antennas, and parapet.
 block(g,concrete,0,height+.55,-depth*.25,2.9,.9,3);
 block(g,dark,width*.25,height+.7,0,1.55,1.3,1.55);
 block(g,metal,-width*.28,height+1.65,0,.08,3.3,.08);
 if(!tall){
  block(g,awnings[index%awnings.length],0,2.65,depth/2+1,width*.95,.14,2.6);
  for(let col=0;col<4;col++)block(g,metal,(col-1.5)*width*.24,1.35,depth/2+.1,.09,2.35,.12);
  sign(g,['MAMA T SHOP','LAGOS MART','SUYA SPOT','CITY STORES'][index%4],width*.76,1.05,3.4,depth/2+.2);
 }
 return g;
}
function palm(seed:number) {
 const group=new THREE.Group(),height=7+seed%4;
 const points=[new THREE.Vector3(0,0,0),new THREE.Vector3(.22,height*.4,0),new THREE.Vector3(.32,height*.78,.12),new THREE.Vector3(.12,height,0)];
 const trunk=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),10,.24,7,false),palmBark);
 trunk.castShadow=true;group.add(trunk);
 for(let f=0;f<9;f++){
  const angle=f*Math.PI*2/9;
  const points=[new THREE.Vector3(.12,height,0),new THREE.Vector3(Math.cos(angle)*1.3,height+.6,Math.sin(angle)*1.3),new THREE.Vector3(Math.cos(angle)*3,height-.8,Math.sin(angle)*3)];
  const frond=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),9,.13,4,false),palmLeaf);
  group.add(frond);
  for(let j=1;j<=5;j++){
   const t=j/6,p=new THREE.CatmullRomCurve3(points).getPoint(t);
   const leaf=new THREE.Mesh(new THREE.ConeGeometry(.42,1.65,3),palmLeaf);
   leaf.position.copy(p);leaf.rotation.z=Math.PI/2;
   leaf.rotation.y=angle;group.add(leaf);
  }
 }
 return group;
}
/** Populate distant shore locations; only a few detailed meshes are needed per silhouette. */
export function addLagosStreetscape(scene:THREE.Scene){
 const root=new THREE.Group();root.name='LagosStreetscape';
 for(let i=0;i<44;i++){
  const side=i%2===0?1:-1;
  const item=building(i,i%3===0);
  item.position.set((i*53%500)-250,-2.82,side*(265+(i*31%85)));
  item.rotation.y=side===1?Math.PI:0;
  root.add(item);
 }
 for(let i=0;i<36;i++){
  const tree=palm(i);tree.position.set((i*79%520)-260,-2.82,(i%2?1:-1)*(252+(i*13%30)));
  root.add(tree);
 }
 scene.add(root);
 return root;
}

/** Replace procedural fallback once the Blender-produced asset has loaded. */
export async function upgradeToBlenderStreetscape(scene: THREE.Scene): Promise<boolean> {
  try {
    const gltf = await new GLTFLoader().loadAsync('/environments/lagos_shore.glb');
    const replacement = gltf.scene;
    replacement.name = 'LagosBlenderStreetscape';
    replacement.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    const fallback = scene.getObjectByName('LagosStreetscape');
    if (fallback) scene.remove(fallback);
    scene.add(replacement);
    return true;
  } catch (error) {
    console.warn('Blender environment not available; retaining procedurally generated Lagos scenery.', error);
    return false;
  }
}
