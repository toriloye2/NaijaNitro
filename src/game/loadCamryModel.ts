import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { CarVisual } from './CamryMuscle';

/** Load optimized original GLB, with named mesh groups for paint and wheels. */
export async function loadCamryModel(): Promise<CarVisual> {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync('/vehicles/camry_muscle_xv40.glb');
  const group = gltf.scene;
  const bodyMeshes: THREE.Mesh[] = [];
  const brakeLights: THREE.Mesh[] = [];
  const paint = new THREE.MeshPhysicalMaterial({
    color: 0xcdd4de, metalness: .68, roughness: .24,
    clearcoat: .78, clearcoatRoughness: .15, side: THREE.DoubleSide,
  });
  const wheelBuckets = new Map<string, THREE.Object3D[]>();
  group.traverse(obj => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    if (obj.name.startsWith('BodyPaint_')) bodyMeshes.push(obj);
    if (obj.name.startsWith('TailRed_')) brakeLights.push(obj);
    const match = obj.name.match(/^(Wheel_(?:Front|Rear)_[LR])_/);
    if (match) {
      const bucket = wheelBuckets.get(match[1]) ?? [];
      bucket.push(obj);
      wheelBuckets.set(match[1], bucket);
    }
  });
  if (!bodyMeshes.length || wheelBuckets.size !== 4) {
    throw new Error('Camry GLB is missing required named meshes');
  }
  for (const mesh of bodyMeshes) mesh.material = paint;
  // Retain groups at the actual wheel center, without changing the visual pose.
  const wheels: THREE.Group[] = [];
  for (const [key, meshes] of wheelBuckets) {
    const wheel = new THREE.Group();
    wheel.name = key;
    const front = key.includes('Front');
    const right = key.endsWith('_R');
    wheel.position.set(right ? 1.07 : -1.07, .48, front ? -1.49 : 1.53);
    group.add(wheel);
    group.updateMatrixWorld(true);
    for (const mesh of meshes) wheel.attach(mesh);
    wheels.push(wheel);
  }
  return { group, wheels, brakeLights, paint };
}
