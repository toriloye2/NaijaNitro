import * as THREE from 'three';
/** Visible nitro recharge collectibles on the racing line. */
const RX=115,RZ=75;
interface Pickup { mesh:THREE.Group; angle:number; lane:number; cooldown:number; }
export class NitroPickups {
  private items: Pickup[]=[];
  private time=0;
  constructor(private scene:THREE.Scene){
    const neon=new THREE.MeshBasicMaterial({color:0x3de7ff,transparent:true,opacity:.88});
    const inner=new THREE.MeshBasicMaterial({color:0xf4feff,transparent:true,opacity:.95});
    for(const [angle,lane] of [[.65,0],[2.05,4.3],[3.65,-4.3],[5.25,0]]){
      const group=new THREE.Group();
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.1,.17,6,22),neon);
      ring.rotation.y=.15;group.add(ring);
      const bolt=new THREE.Mesh(new THREE.OctahedronGeometry(.47),inner);
      bolt.scale.set(.7,1.5,.7);group.add(bolt);
      this.scene.add(group);
      this.items.push({mesh:group,angle,lane,cooldown:0});
    }
    this.reset();
  }
  reset(){this.time=0;for(const p of this.items){p.cooldown=0;p.mesh.visible=true;}}
  update(dt:number,car:THREE.Vector3):number {
    this.time+=dt;let restored=0;
    for(const p of this.items){
      if(p.cooldown>0){p.cooldown-=dt;p.mesh.visible=p.cooldown<=0;}
      const tx=-RX*Math.sin(p.angle),tz=RZ*Math.cos(p.angle),l=Math.hypot(tx,tz);
      const x=RX*Math.cos(p.angle)+tz/l*p.lane;
      const z=RZ*Math.sin(p.angle)-tx/l*p.lane;
      p.mesh.position.set(x,1.95+Math.sin(this.time*3+p.angle)*.3,z);
      p.mesh.rotation.y+=dt*1.6;
      if(p.cooldown<=0 && (car.x-x)**2+(car.z-z)**2<11.5){
        restored+=25;p.cooldown=18;p.mesh.visible=false;
      }
    }
    return restored;
  }
}
