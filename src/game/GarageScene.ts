import * as THREE from 'three';
import { createCamryMuscle, type CarVisual } from './CamryMuscle';

/**
 * Original Nigeria-inspired 3D garage for Naija Nitro.
 * The car is a procedural XV40-inspired sedan, not an official Toyota asset.
 * No downloaded assets, third-party branding, or protected game UI elements.
 */
const GREEN = 0x29e69a;
const CYAN = 0x2bbce8;
const metal = (color: number, metalness = .55, roughness = .38) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });
const matte = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: .83 });

function cube(parent: THREE.Object3D, width: number, height: number, depth: number, material: THREE.Material,
  x: number, y: number, z: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function sign(parent: THREE.Object3D, lines: string[], width: number, height: number, x: number, y: number, z: number,
  accent = '#47f4b1') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.fillStyle = '#101e28';
  ctx.fillRect(0,0,1024,256);
  ctx.fillStyle = accent;
  ctx.fillRect(0,0,19,256);
  ctx.fillStyle = '#e8faf4';
  ctx.font = 'bold 102px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(lines[0], 512, lines.length > 1 ? 115 : 162);
  if (lines[1]) {
    ctx.fillStyle = accent;
    ctx.font = 'bold 44px Arial';
    ctx.fillText(lines[1], 512, 190);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width,height),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
  mesh.position.set(x,y,z);
  parent.add(mesh);
  return tex;
}

function floorMaterial() {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  ctx.fillStyle = '#18252d'; ctx.fillRect(0,0,512,512);
  for (let j=0;j<8;j++) for (let i=0;i<8;i++) {
    ctx.fillStyle = (i+j)%2 ? '#202d35' : '#18252d';
    ctx.fillRect(i*64+1,j*64+1,62,62);
    ctx.fillStyle = '#344852';
    ctx.fillRect(i*64, j*64, 1.5, 64);
    ctx.fillRect(i*64, j*64, 64, 1.5);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 4);
  return new THREE.MeshStandardMaterial({ map: texture, metalness:.45, roughness:.36 });
}

export class GarageScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(46, 1, .1, 130);
  private readonly camry: CarVisual;
  private readonly pivot = new THREE.Group();
  private readonly textures: THREE.Texture[] = [];
  private readonly animatedLights: THREE.PointLight[] = [];
  private spin = 0;
  private readonly stage: THREE.Group;
  private readonly materials: THREE.Material[] = [];

  constructor() {
    this.scene.background = new THREE.Color(0x09131d);
    this.scene.fog = new THREE.Fog(0x0b1822, 18, 60);
    this.scene.add(new THREE.HemisphereLight(0xafd9e6, 0x151d24, 2.4));
    const key = new THREE.SpotLight(0xe6f4ff, 190, 42, Math.PI/4, .63, 1.2);
    key.position.set(1, 11, -7);
    key.target.position.set(2, 0, 0);
    key.castShadow = false;
    this.scene.add(key, key.target);
    const rim = new THREE.SpotLight(0x2bebb0, 130, 32, Math.PI/4, .65, 1.2);
    rim.position.set(9, 6, 5);
    rim.target.position.set(2,1,0);
    this.scene.add(rim, rim.target);
    const cool = new THREE.PointLight(0x34bdff, 75, 18, 1.8);
    cool.position.set(-3,4,3);
    this.scene.add(cool);
    this.animatedLights.push(cool);

    const wall = matte(0x14242e), column = metal(0x30424d, .72), frame = metal(0x192d36, .72),
      cabinet = metal(0x293b44, .47), green = new THREE.MeshBasicMaterial({ color:GREEN }),
      cyan = new THREE.MeshBasicMaterial({ color:CYAN }),
      white = new THREE.MeshBasicMaterial({ color:0xdbffef }),
      warm = new THREE.MeshBasicMaterial({ color:0xbce4f4 });

    const room = new THREE.Group();
    this.scene.add(room);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(70,70), floorMaterial());
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.085; floor.receiveShadow=true;
    room.add(floor);
    cube(room,45,11,.3,wall,0,5.4,12.4);
    cube(room,.25,11,28,wall,-17,5.4,0);
    cube(room,.25,11,28,wall,20,5.4,0);

    // Nigerian tricolour bands on the garage back wall, with bright green racing accents.
    cube(room,36,.18,.06,green,1.5,7.65,12.16);
    cube(room,36,.075,.06,white,1.5,7.47,12.16);
    cube(room,36,.18,.06,green,1.5,7.27,12.16);

    // Distinctive workshop bays, support beams and overhead LED bars.
    for (let i=0;i<7;i++) {
      const x=-15+i*5.5;
      cube(room,.5,11,.75,column,x,5.4,12.0);
      cube(room,3.6,.12,1.0,i%2?green:cyan,x,9.65,3.5);
      cube(room,.14,8,.24,frame,x,4,11.8);
    }
    for (let i=0;i<6;i++) {
      const z=-9+i*4.3;
      cube(room,32,.16,.18,frame,0,10.3,z);
      cube(room,7,.08,.15,i%2?green:warm,0,9.82,z);
    }

    this.textures.push(sign(room,['NAIJA NITRO','LAGOS RACING DIVISION'],16.2,4.1,3.1,6.7,12.06));
    this.textures.push(sign(room,['STREET TO TRACK','NAIJA BUILT. RACE READY.'],6.4,1.6,-10.5,3.4,12.05,'#3fbfea'));
    this.textures.push(sign(room,['CAMRY MUSCLE','LAGOS EDITION'],6.4,1.6,15.5,3.4,12.05));

    // A metal inspection podium with illuminated rings, car itself is raised only slightly.
    this.stage = new THREE.Group(); this.stage.position.set(2.25,.05,-.1);
    this.scene.add(this.stage);
    const disk = new THREE.Mesh(new THREE.CylinderGeometry(5.7,5.9,.23,64),metal(0x21333d,.55,.32));
    disk.position.y = .01; disk.receiveShadow=true;
    this.stage.add(disk);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(5.35,.045,8,96),green);
    ring.rotation.x=Math.PI/2;ring.position.y=.17;this.stage.add(ring);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.7,.028,8,96),cyan);
    ring2.rotation.x=Math.PI/2;ring2.position.y=.175;this.stage.add(ring2);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(5.1,64),
      new THREE.MeshBasicMaterial({ color:0x20a885,transparent:true,opacity:.075,depthWrite:false }));
    glow.rotation.x=-Math.PI/2;glow.position.y=.176;this.stage.add(glow);

    this.camry = createCamryMuscle();
    this.pivot.add(this.camry.group);
    this.camry.group.position.y=.2;
    this.camry.group.rotation.y = .28;
    this.stage.add(this.pivot);

    // Garage benches, tyres, lockers and wide floor markings.
    const tire = matte(0x101317);
    for(let i=0;i<4;i++) {
      const x = -11.8 + i*2.0;
      cube(room,1.75,2.1,1.0,cabinet,x,1.05,8.0);
      cube(room,1.5,.12,.8,frame,x,2.2,8);
      cube(room,.7,.065,.65,i%2?cyan:green,x,2.32,8);
      for(let j=0;j<2;j++) {
        const wheel=new THREE.Mesh(new THREE.TorusGeometry(.58,.24,8,16),tire);
        wheel.position.set(x, .8+j*.9,6.2);wheel.rotation.y=Math.PI/2;
        room.add(wheel);
      }
    }
    for(let i=0;i<7;i++){
      const z=-9+i*2.5;
      const stripe=cube(room,.07,.012,1.35,i%2?green:white,-13,.004,z);
      stripe.rotation.y=-.34;
    }

    // Neon wall graphics and garage exit signage.
    cube(room,4.2,.11,.15,cyan,14.5,7.0,11.9);
    cube(room,4.2,.11,.15,green,14.5,6.65,11.9);
    cube(room,4.2,.11,.15,cyan,14.5,6.3,11.9);
    this.camera.position.set(10.4,4.35,-11.6);
    this.camera.lookAt(2.25,1.4,0);
    this.materials.push(...[wall,column,frame,cabinet,green,cyan,white,warm,tire]);
  }

  setPaint(color:number) {this.camry.paint.color.setHex(color);}
  rotateCar(direction:number) {this.spin += direction * Math.PI/4;}
  update(dt:number,time:number) {
    this.spin += dt*.13;
    this.pivot.rotation.y = THREE.MathUtils.damp(this.pivot.rotation.y,this.spin,2.6,dt);
    this.camry.group.position.y=.21+Math.sin(time*.65)*.015;
    for(const [index,light] of this.animatedLights.entries()) {
      light.intensity = 75 + Math.sin(time*.75+index)*10;
    }
  }
  resize(width:number,height:number) {
    this.camera.aspect = Math.max(1,width) / Math.max(1,height);
    this.camera.fov = width < 700 ? 58 : 46;
    this.camera.updateProjectionMatrix();
  }
  dispose() {
    // The car model shares several immutable materials with the race car;
    // dispose scene geometries/textures, not shared car materials.
    const geometries = new Set<THREE.BufferGeometry>();
    this.scene.traverse(o => {
      if(o instanceof THREE.Mesh) geometries.add(o.geometry);
    });
    for (const geometry of geometries) geometry.dispose();
    for(const texture of this.textures) texture.dispose();
    for(const material of this.materials) material.dispose();
  }
}
