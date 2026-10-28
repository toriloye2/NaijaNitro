import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

/** Lightweight kinematic arcade opponents with physical Rapier hitboxes. */
const RX = 115, RZ = 75, TWO_PI = Math.PI * 2;
const palette = [0xff4c66, 0x348fff, 0xffc33b, 0x933bfc, 0xff7d2d, 0xe4e9ed, 0x29c3a5];
const bodyMat = (color: number) => new THREE.MeshPhysicalMaterial({ color, metalness: .44, roughness: .39, clearcoat: .4 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x172d43, roughness: .18, metalness: .35 });
const rubberMat = new THREE.MeshStandardMaterial({ color: 0x161a20, roughness: .96 });
const lightMat = new THREE.MeshBasicMaterial({ color: 0xf7eecf });
const tailMat = new THREE.MeshBasicMaterial({ color: 0xf43d53 });

function opponentCar(color: number) {
  const group = new THREE.Group();
  const paint = bodyMat(color);
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.15,.65,4.2),paint);
  body.position.y = .83;group.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.85,.62,2.2),glassMat);
  cabin.position.set(0,1.4,.2);group.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.65,.085,1.45),paint);
  roof.position.set(0,1.74,.2);group.add(roof);
  const fender = new THREE.Mesh(new THREE.BoxGeometry(2.17,.20,.15),paint);
  fender.position.set(0,.59,-2.1);group.add(fender);
  const bumper = fender.clone();bumper.position.z = 2.1;group.add(bumper);
  const wheelGeo = new THREE.CylinderGeometry(.47,.47,.3,10);
  for (const x of [-1.08,1.08]) for (const z of [-1.3,1.3]) {
    const wheel = new THREE.Mesh(wheelGeo,rubberMat);
    wheel.rotation.z=Math.PI/2;wheel.position.set(x,.48,z);group.add(wheel);
  }
  for(const x of [-.8,.8]){
    const h = new THREE.Mesh(new THREE.BoxGeometry(.45,.12,.05),lightMat);
    h.position.set(x,1,-2.13);group.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(.46,.14,.05),tailMat);
    t.position.set(x,1,2.13);group.add(t);
  }
  return group;
}
interface Rival {
  mesh: THREE.Group;
  body: RAPIER.RigidBody;
  /** Unwrapped angle: negative before starting line, grows forward with distance. */
  angle: number;
  lane: number;
  baseSpeed: number;
  color: number;
}

/** Arc-distance is measured in unwrapped radians so lap ranking never wraps incorrectly. */
export class RaceOpponents {
  private rivals: Rival[]=[];
  private elapsed = 0;
  constructor(private scene: THREE.Scene, private world: RAPIER.World) {
    for(let i=0;i<7;i++){
      const mesh=opponentCar(palette[i]);
      this.scene.add(mesh);
      const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(RX,1.05,-10-i*4));
      this.world.createCollider(RAPIER.ColliderDesc.cuboid(1.05,.52,2.05).setFriction(.75),body);
      this.rivals.push({mesh,body,angle:0,lane:0,baseSpeed:0,color:palette[i]});
    }
    this.reset();
  }
  private pose(r:Rival, next:boolean) {
    const a=r.angle%TWO_PI;
    const sin=Math.sin(a),cos=Math.cos(a);
    const tx=-RX*sin,tz=RZ*cos;
    const length=Math.hypot(tx,tz);
    const nx=tz/length,nz=-tx/length;
    const x=RX*cos+nx*r.lane;
    const z=RZ*sin+nz*r.lane;
    // Meshes face -Z in local space.
    const yaw=Math.atan2(-tx,-tz);
    r.mesh.position.set(x,.05,z);
    r.mesh.rotation.y=yaw;
    if(next){
      r.body.setNextKinematicTranslation({x,y:1.05,z});
      r.body.setNextKinematicRotation({x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)});
    }else{
      r.body.setTranslation({x,y:1.05,z},true);
      r.body.setRotation({x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)},true);
    }
  }
  reset(){
    this.elapsed=0;
    this.rivals.forEach((r,i)=>{
      r.angle=-.14-i*.09;
      r.lane=[-5.1,0,5.1,-5.1,0,5.1,0][i];
      r.baseSpeed=40.5+i*2.55;
      this.pose(r,false);
    });
  }
  update(dt:number,playerDistance:number){
    this.elapsed+=dt;
    for(let i=0;i<this.rivals.length;i++){
      const r=this.rivals[i];
      const tangentLen=Math.hypot(RX*Math.sin(r.angle),RZ*Math.cos(r.angle));
      const gap=playerDistance-r.angle;
      const catchUp=THREE.MathUtils.clamp(gap*.8,-5,5);
      const speed=r.baseSpeed+catchUp+Math.sin(this.elapsed*.43+i*1.43)*1.3;
      r.angle+=speed/Math.max(30,tangentLen)*dt;
      // Mild lane swerves make rivals more interesting without teleporting.
      const original=[-5.1,0,5.1,-5.1,0,5.1,0][i];
      r.lane=original+Math.sin(this.elapsed*.42+i*2.1)*.7;
      this.pose(r,true);
    }
  }
  placement(playerDistance:number){
    return 1+this.rivals.filter(r=>r.angle>playerDistance).length;
  }
  leadingDistance(){return Math.max(...this.rivals.map(r=>r.angle));}
}
