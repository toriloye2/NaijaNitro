import * as THREE from 'three';

/**
 * Original procedural mesh inspired by the 2007–2011 Toyota Camry XV40,
 * popularly called the Camry "Muscle" in Nigeria.
 * No third-party car model, decals, photos, or licensed assets are included.
 * Car faces local -Z; units are approximate metres.
 */
export interface CarVisual {
  group: THREE.Group;
  wheels: THREE.Group[];
  brakeLights: THREE.Mesh[];
}

const paint = new THREE.MeshPhysicalMaterial({
  color: 0xd7dde4, metalness: 0.67, roughness: 0.31, clearcoat: 0.55, clearcoatRoughness: 0.19,
  flatShading: false,
});
const glass = new THREE.MeshPhysicalMaterial({
  color: 0x1b3342, metalness: 0.16, roughness: 0.16,
  transparent: true, opacity: 0.89, side: THREE.DoubleSide,
});
const chrome = new THREE.MeshStandardMaterial({ color: 0xcbd6da, metalness: .9, roughness: .2 });
const dark = new THREE.MeshStandardMaterial({ color: 0x161e25, metalness: .25, roughness: .67 });
const tireMat = new THREE.MeshStandardMaterial({ color: 0x121416, roughness: .97 });
const red = new THREE.MeshStandardMaterial({ color: 0xb51123, emissive: 0x4c040a, emissiveIntensity: .24 });
const redLit = new THREE.MeshStandardMaterial({ color: 0xff3240, emissive: 0xff1721, emissiveIntensity: .8 });
const white = new THREE.MeshStandardMaterial({ color: 0xe7f4ff, emissive: 0xc3e5ff, emissiveIntensity: .27 });
const amber = new THREE.MeshStandardMaterial({ color: 0xf4a849, emissive: 0xa94a08, emissiveIntensity: .25 });

function cube(parent: THREE.Object3D, size: [number, number, number], pos: [number, number, number],
              material: THREE.Material, radius = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...pos);
  if (radius) mesh.rotation.x = radius;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

type Section = [z: number, halfWidth: number, bottom: number, top: number];
function skin(parent: THREE.Object3D, sections: Section[], material: THREE.Material) {
  const vertices: number[] = [];
  const indices: number[] = [];
  sections.forEach(([z, w, bottom, top]) => {
    vertices.push(-w, bottom, z, w, bottom, z, -w, top, z, w, top, z);
  });
  for (let i = 0; i < sections.length - 1; i++) {
    const a = i * 4, b = a + 4;
    for (const [p, q, r, s] of [[a, a + 1, b + 1, b], [a + 2, b + 2, b + 3, a + 3],
      [a, b, b + 2, a + 2], [a + 1, a + 3, b + 3, b + 1]]) {
      indices.push(p, q, r, p, r, s);
    }
  }
  const end = (sections.length - 1) * 4;
  indices.push(0, 2, 3, 0, 3, 1, end, end + 1, end + 3, end, end + 3, end + 2);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}

function polygon(parent: THREE.Object3D, coords: THREE.Vector3[], material: THREE.Material) {
  const positions: number[] = [];
  for (let i = 1; i < coords.length - 1; i++) {
    positions.push(...coords[0].toArray(), ...coords[i].toArray(), ...coords[i + 1].toArray());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, material);
  parent.add(mesh);
  return mesh;
}

function wheel(parent: THREE.Group, x: number, z: number): THREE.Group {
  const group = new THREE.Group();
  group.position.set(x, .53, z);
  const rubber = new THREE.Mesh(new THREE.CylinderGeometry(.49, .49, .3, 24), tireMat);
  rubber.rotation.z = Math.PI / 2; rubber.castShadow = true; group.add(rubber);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .31, 18), chrome);
  hub.rotation.z = Math.PI / 2; group.add(hub);
  const face = x > 0 ? .18 : -.18;
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(.035, .39, .095), chrome);
    spoke.position.set(face, 0, 0);
    spoke.rotation.x = i * Math.PI * 2 / 5;
    group.add(spoke);
  }
  const middle = new THREE.Mesh(new THREE.SphereGeometry(.095, 10, 10), dark);
  middle.scale.set(.34, 1, 1); middle.position.x = face * 1.13; group.add(middle);
  parent.add(group);
  return group;
}

export function createCamryMuscle(): CarVisual {
  const group = new THREE.Group();
  const wheels: THREE.Group[] = [];
  const brakeLights: THREE.Mesh[] = [];
  // XV40-inspired rounded long-body sedan with distinct hood, rear deck and four-door cabin.
  skin(group, [
    [-2.47, .95, .42, .91], [-2.33, 1.07, .40, 1.02],
    [-1.25, 1.12, .39, 1.19], [.95, 1.12, .39, 1.19],
    [2.16, 1.09, .41, 1.09], [2.48, .98, .43, .92],
  ], paint);
  // Front and rear bumpers, hood crease and rocker panels.
  cube(group, [1.86,.15,.17],[0,.5,-2.46], paint);
  cube(group, [1.88,.16,.18],[0,.53,2.46], paint);
  for (const x of [-1.04,1.04]) {
    cube(group,[.1,.15,3.2],[x,.48,0],dark);
    cube(group,[.075,.027,2.85],[x*.95,1.21,-.05],chrome);
  }

  // Cabin profile and roof. Black windows fit within the painted frame.
  skin(group, [[-1.18,.97,1.17,1.23],[-.55,.89,1.19,1.88],
    [.79,.86,1.18,1.87],[1.48,.98,1.16,1.25]], paint);
  cube(group,[1.7,.065,1.15],[0,1.88,.12],paint);

  // Sloped windshield, rear glass and side glass with A/B/C pillars.
  polygon(group, [
    new THREE.Vector3(-.87,1.85,-.56), new THREE.Vector3(.87,1.85,-.56),
    new THREE.Vector3(1,1.26,-1.14),new THREE.Vector3(-1,1.26,-1.14),
  ], glass);
  polygon(group, [
    new THREE.Vector3(-.87,1.83,.82),new THREE.Vector3(-.97,1.25,1.46),
    new THREE.Vector3(.97,1.25,1.46),new THREE.Vector3(.87,1.83,.82),
  ], glass);
  for (const side of [-1,1]) {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(side*x,y,z);
    polygon(group,[v(.945,1.23,-1.01),v(.9,1.78,-.5),v(.88,1.78,.08),v(.99,1.22,.08)],glass);
    polygon(group,[v(.88,1.78,.18),v(.86,1.77,.7),v(.98,1.23,1.38),v(.99,1.22,.18)],glass);
    cube(group,[.075,.59,.065],[side*.94,1.5,.13],dark);
    cube(group,[.33,.16,.25],[side*1.08,1.24,-.78],paint);
    cube(group,[.14,.025,.25],[side*1.115,1.12,-.23],chrome);
    cube(group,[.14,.025,.24],[side*1.115,1.12,.86],chrome);
    cube(group,[.02,.35,.012],[side*1.13,.97,.15],dark);
    wheels.push(wheel(group,side*1.13,-1.52));
    wheels.push(wheel(group,side*1.13,1.51));
  }

  // Signature wide front grille with horizontal chrome bars and separated headlights.
  cube(group,[1.16,.35,.052],[0,.88,-2.476],dark);
  for (let i = 0; i < 3; i++) cube(group,[1.05,.025,.06],[0,.75+i*.10,-2.52],chrome);
  cube(group,[.12,.055,.065],[0,.98,-2.53],chrome);
  for (const side of [-1,1]) {
    const light = cube(group,[.57,.18,.07],[side*.81,1.02,-2.455],white);
    light.rotation.y = side*.15;
    cube(group,[.22,.115,.075],[side*1.03,1.01,-2.46],amber);
    cube(group,[.33,.12,.06],[side*.88,.58,-2.49],dark);
    const tail = cube(group,[.58,.22,.075],[side*.79,1.04,2.46],red);
    brakeLights.push(tail);
    cube(group,[.16,.075,.086],[side*.48,1.0,2.495],white);
  }
  cube(group,[.78,.2,.045],[0,.85,2.492],chrome);
  cube(group,[.43,.15,.05],[0,.56,2.508],dark);
  cube(group,[.2,.065,.06],[.78,.43,2.47],dark);
  // Number plates and rear boot crease.
  cube(group,[.48,.125,.03],[0,.85,-2.528],white);
  cube(group,[.48,.125,.03],[0,.85,2.52],white);
  cube(group,[1.9,.023,.05],[0,1.12,2.35],chrome);
  group.userData.model = '2010 Toyota Camry XV40-inspired Muscle';
  group.userData.materials = { red, redLit };
  return { group, wheels, brakeLights };
}
