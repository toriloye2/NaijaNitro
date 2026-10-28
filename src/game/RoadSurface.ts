import * as THREE from 'three';

/** Tileable procedurally drawn road texture; no downloads or external assets. */
export function makeAsphaltMaterial(){
  const c=document.createElement('canvas');c.width=c.height=256;
  const ctx=c.getContext('2d')!;
  ctx.fillStyle='#30343a';ctx.fillRect(0,0,256,256);
  let seed=129421;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<18000;i++){
    const v=Math.floor(44+rand()*38);
    ctx.fillStyle='rgba('+v+','+v+','+(v+3)+','+(.12+rand()*.24)+')';
    ctx.fillRect(rand()*256,rand()*256, .35+rand()*2.1, .35+rand()*2.1);
  }
  for(let i=0;i<85;i++){
    ctx.beginPath();ctx.strokeStyle='rgba(12,15,17,.12)';
    ctx.lineWidth=.3+rand()*.55;
    const x=rand()*256,y=rand()*256;
    ctx.moveTo(x,y);ctx.lineTo(x+rand()*8-4,y+rand()*17-8);ctx.stroke();
  }
  const map=new THREE.CanvasTexture(c);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(34,4);
  map.anisotropy=4;
  return new THREE.MeshStandardMaterial({map,color:0xc9d0d7,roughness:.93,metalness:.02,side:THREE.DoubleSide});
}

/** Better-looking lane-side arrows and start grid built from reusable meshes. */
export function addRaceDecor(scene:THREE.Scene){
  const RX=115,RZ=75;
  const white=new THREE.MeshBasicMaterial({color:0xf6f1e9});
  const cyan=new THREE.MeshBasicMaterial({color:0x41e5e2,transparent:true,opacity:.83});
  const geo=new THREE.BoxGeometry(.55,.02,3.1);
  for(let i=0;i<36;i++){
    const a=(i+.5)*Math.PI*2/36;
    const x=RX*Math.cos(a),z=RZ*Math.sin(a);
    const tangent=new THREE.Vector3(-RX*Math.sin(a),0,RZ*Math.cos(a)).normalize();
    const normal=new THREE.Vector3(tangent.z,0,-tangent.x);
    const yaw=Math.atan2(tangent.x,tangent.z);
    for(const lane of [-8.1,8.1]){
      const mesh=new THREE.Mesh(geo,i%3===0?cyan:white);
      mesh.position.set(x+normal.x*lane,.097,z+normal.z*lane);
      mesh.rotation.y=yaw;scene.add(mesh);
    }
  }
  // A bold checkered starting line at angle zero.
  const tile=new THREE.BoxGeometry(2.65,.026,1.65);
  const dark=new THREE.MeshBasicMaterial({color:0x242a30});
  for(let row=0;row<2;row++)for(let col=0;col<10;col++){
    const mesh=new THREE.Mesh(tile,(row+col)%2===0?white:dark);
    mesh.position.set(RX-.9+row*1.7,.105,-11.9+col*2.65);
    // At start, track heads along +Z, so checkerboard crosses lanes (Z width).
    // We rotate by 90 degrees in world space for cross-track grid.
    mesh.position.set(RX-12+col*2.65,.105,-1.0+row*1.65);
    scene.add(mesh);
  }
}
