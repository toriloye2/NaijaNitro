import * as THREE from 'three';

// Original, fictional Lekki waterfront district. All decorative geometry stays off the race deck.
export function addLekkiWaterfront(scene: THREE.Scene) {
  const root = new THREE.Group(); root.name = 'LekkiWaterfront';
  const material = (color: number, roughness = .7, metalness = 0) => new THREE.MeshStandardMaterial({color, roughness, metalness});
  const sand=material(0xc4b89e), white=material(0xe5e1d5), stone=material(0x9eaaa9), glass=material(0x477c92,.22,.45), dark=material(0x344b51), green=material(0x39774b), bark=material(0x81694b);
  const box = new THREE.BoxGeometry(1,1,1);
  function block(parent: THREE.Object3D,m: THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number) {
    const mesh=new THREE.Mesh(box,m); mesh.position.set(x,y,z);mesh.scale.set(w,h,d); parent.add(mesh);return mesh;
  }
  // Reclaim a shoreline close enough to be visible from the bridge, but beyond its outer rail.
  block(root,sand,0,-3.05,156,310,.65,104);
  block(root,stone,0,-2.62,105,310,.5,3);
  block(root,white,0,-2.29,110,310,.13,7);
  block(root,dark,0,-2.31,123,310,.1,13);
  for(let i=0;i<38;i++) block(root,white,-148+i*8,-2.24,123,4,.04,.12);
  // Contemporary Lekki apartments: recessed glazing, balconies, rooftop terraces.
  for(let i=0;i<12;i++){
    const g=new THREE.Group();g.position.set(-137+i*25,-2.7,145+(i%2)*16);root.add(g);
    const floors=3+i%5,w=15+i%3*2,h=floors*3.2;
    block(g,i%3===0?stone:white,0,h/2,0,w,h,13);
    block(g,glass,0,h/2,-6.57,w*.78,h-.8,.12);
    for(let f=0;f<floors;f++){
      const y=f*3.2+2.85;
      block(g,white,0,y,-7.2,w+.65,.26,2.2);
      block(g,glass,0,y+.62,-8.24,w-.3,.95,.08);
      for(let c=0;c<4;c++)block(g,white,(c-1.5)*w/4,y-1.4,-6.7,.17,2.8,.22);
    }
    block(g,dark,0,h+.4,1,w*.6,.8,6);
    block(g,white,0,h+.1,0,w+.3,.2,13.4);
  }
  // Curved palm trunks and tapered leaf surfaces along the promenade.
  const trunkGeo=new THREE.CylinderGeometry(.17,.29,6.5,9);
  const leafGeo=new THREE.BufferGeometry();
  leafGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0, .4,.35,1.2, 0,-.7,3.4, -.4,.35,1.2, 0,.45,1.2],3));
  leafGeo.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);leafGeo.computeVertexNormals();green.side=THREE.DoubleSide;
  for(let i=0;i<25;i++){
    const g=new THREE.Group();g.position.set(-145+i*12,-2.25,110);root.add(g);
    const trunk=new THREE.Mesh(trunkGeo,bark);trunk.position.y=3.25;trunk.rotation.z=.055*Math.sin(i);g.add(trunk);
    for(let j=0;j<9;j++){const leaf=new THREE.Mesh(leafGeo,green);leaf.position.y=6.45;leaf.rotation.y=j*Math.PI*2/9+i;g.add(leaf);}
  }
  // Stylized distant cable-stayed bridge landmark, inspired by Lekki-Ikoyi Link Bridge.
  const tower=new THREE.Group();tower.position.set(-185,-3,160);root.add(tower);
  block(tower,stone,0,6,0,100,1.3,8);
  for(const z of [-3.2,3.2]){
    block(tower,white,0,18,z,2.4,36,2.4);
    for(const side of [-1,1]) for(let j=1;j<=6;j++){
      const a=new THREE.Vector3(0,34-j*.7,z),b=new THREE.Vector3(side*j*7,6.8,z);
      const d=b.clone().sub(a);const cable=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,d.length(),6),white);
      cable.position.copy(a).add(b).multiplyScalar(.5);cable.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());tower.add(cable);
    }
  }
  scene.add(root);
}
