import * as THREE from 'three';

/** Decorative low-poly shoreline landmarks, shoreline trees and Lagos water traffic. */
export function decorateLagoon(scene:THREE.Scene) {
  const hull=new THREE.MeshStandardMaterial({color:0xf3e8cf,metalness:.12,roughness:.7});
  const shade=new THREE.MeshStandardMaterial({color:0x143c60,roughness:.7});
  const red=new THREE.MeshStandardMaterial({color:0xe59b4b,roughness:.8});
  const geometry=new THREE.BoxGeometry(1,1,1);
  function addBox(parent:THREE.Object3D,w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number){
    const mesh=new THREE.Mesh(geometry,m);mesh.scale.set(w,h,d);mesh.position.set(x,y,z);
    parent.add(mesh);return mesh;
  }
  // Bright, readable ferries across Lagos Lagoon, away from the drivable bridge.
  for(let i=0;i<16;i++){
    const x=(i*91%580)-290;
    const z=(i%2===0?1:-1)*(135+(i*27%100));
    const group=new THREE.Group();group.position.set(x,-2.9,z);
    group.rotation.y=(i*.97)%Math.PI;
    addBox(group,8,.85,2.5,i%4===0?red:hull,0,0,0);
    addBox(group,4,1.4,2.1,shade,-.35,1.05,0);
    addBox(group,1,.5,1,hull,3,.8,0);
    scene.add(group);
  }
  // Roadside reflection strips give the barriers and road an additional sense of scale.
  const reflect=new THREE.MeshBasicMaterial({color:0xf3ca53});
  const RX=115,RZ=75;
  const markers=new THREE.BoxGeometry(.14,.12,.4);
  for(let i=0;i<152;i++){
    const a=i*Math.PI*2/152,tx=-RX*Math.sin(a),tz=RZ*Math.cos(a);
    const l=Math.hypot(tx,tz),nx=tz/l,nz=-tx/l;
    for(const sign of [-1,1]){
      const m=new THREE.Mesh(markers,reflect);
      m.position.set(RX*Math.cos(a)+nx*14.25*sign,.82,RZ*Math.sin(a)+nz*14.25*sign);
      m.rotation.y=Math.atan2(tx,tz);scene.add(m);
    }
  }
}
