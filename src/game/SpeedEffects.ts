import * as THREE from 'three';

/**
 * Lightweight, fully procedural racing VFX.
 * All visual effects are generated at runtime, with no external image assets.
 */
export class SpeedEffects {
  private windGeometry: THREE.BufferGeometry;
  private windPositions: Float32Array;
  private wind: THREE.LineSegments;
  private windMaterial: THREE.LineBasicMaterial;
  private particles: { x: number; y: number; z: number; length: number; factor: number }[] = [];
  private flames: { group: THREE.Group; outer: THREE.MeshBasicMaterial; inner: THREE.MeshBasicMaterial }[] = [];
  private glow: THREE.Sprite[] = [];
  private glowTexture: THREE.CanvasTexture;
  private light: THREE.PointLight;
  private intensity = 0;
  private readonly count = 52;
  constructor(private scene: THREE.Scene, private camera: THREE.Camera, private car: THREE.Group) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot initialize nitro glow texture');
    const gradient = ctx.createRadialGradient(64, 64, 1, 64, 64, 62);
    gradient.addColorStop(0, 'rgba(235,255,255,1)');
    gradient.addColorStop(.19, 'rgba(63,244,255,.92)');
    gradient.addColorStop(.48, 'rgba(19,111,255,.48)');
    gradient.addColorStop(1, 'rgba(7,34,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    this.glowTexture = new THREE.CanvasTexture(canvas);

    // Twin blue nitro exhaust flames, located behind the rear bumper (+Z).
    for (const side of [-1, 1]) {
      const group = new THREE.Group();
      group.position.set(side * .74, .56, 2.58);
      const outer = new THREE.MeshBasicMaterial({
        color: 0x188dff, transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      });
      const inner = new THREE.MeshBasicMaterial({
        color: 0xc2faff, transparent: true, opacity: 0, depthWrite: false,
        blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      });
      const tail = new THREE.Mesh(new THREE.ConeGeometry(.20, 1.55, 10), outer);
      tail.rotation.x = Math.PI / 2;
      tail.position.z = .77;
      group.add(tail);
      const core = new THREE.Mesh(new THREE.ConeGeometry(.09, .98, 10), inner);
      core.rotation.x = Math.PI / 2;
      core.position.z = .48;
      group.add(core);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this.glowTexture, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
        depthWrite: false, color: 0x49bfff,
      }));
      sprite.scale.set(1.9, 1.9, 1);
      sprite.position.z = .54;
      group.add(sprite);
      this.glow.push(sprite);
      this.flames.push({ group, outer, inner });
      car.add(group);
    }
    this.light = new THREE.PointLight(0x2baeff, 0, 9, 2);
    this.light.position.set(0, .63, 3.0);
    car.add(this.light);

    this.windPositions = new Float32Array(this.count * 6);
    this.windGeometry = new THREE.BufferGeometry();
    this.windGeometry.setAttribute('position', new THREE.BufferAttribute(this.windPositions, 3));
    this.windMaterial = new THREE.LineBasicMaterial({
      color: 0xb2f2ff, transparent: true, opacity: 0,
      depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    for (let i = 0; i < this.count; i++) {
      // Deterministic distribution avoids flicker and keeps the center of the screen clear.
      const x = (((i * 47) % 103) / 102 - .5) * 20;
      const y = (((i * 29 + 17) % 97) / 96 - .5) * 10;
      this.particles.push({
        x: Math.abs(x) < 1.8 ? x + (x < 0 ? -2.3 : 2.3) : x,
        y, z: -3 - ((i * 13) % 19),
        length: .8 + (i % 5) * .33, factor: .68 + (i % 4) * .17,
      });
    }
    this.wind = new THREE.LineSegments(this.windGeometry, this.windMaterial);
    this.wind.frustumCulled = false;
    camera.add(this.wind);
    // A camera must be part of the scene graph for camera-attached speed lines to render.
    if (!camera.parent) scene.add(camera);
  }

  update(dt: number, speed: number, boosting: boolean, time: number) {
    const ratio = THREE.MathUtils.clamp(Math.abs(speed) / 65, 0, 1);
    const target = boosting ? 1 : 0;
    this.intensity = THREE.MathUtils.damp(this.intensity, target, boosting ? 14 : 9, dt);
    const pulse = 1 + Math.sin(time * 37) * .12 + Math.cos(time * 19) * .08;
    for (let i = 0; i < this.flames.length; i++) {
      const flame = this.flames[i];
      flame.outer.opacity = this.intensity * .78;
      flame.inner.opacity = this.intensity * .92;
      flame.group.scale.set(1, 1, Math.max(.05, this.intensity * (1.12 + pulse * .54)));
      const sprite = this.glow[i];
      (sprite.material as THREE.SpriteMaterial).opacity = this.intensity * .88;
      sprite.scale.setScalar(1.6 + this.intensity * .65);
    }
    this.light.intensity = this.intensity * 9;
    this.windMaterial.opacity = THREE.MathUtils.clamp(
      (ratio - .25) * .50 + this.intensity * .6, 0, .85,
    );
    this.wind.visible = this.windMaterial.opacity > .025;
    const advance = dt * (3 + ratio * 24 + this.intensity * 25);
    for (let i = 0; i < this.count; i++) {
      const p = this.particles[i];
      p.z += advance * p.factor;
      if (p.z > -1.1) {
        p.z -= 24;
        p.x = (((i * 31 + Math.floor(time * 2) * 17) % 99) / 98 - .5) * 20;
      }
      const start = i * 6;
      // Perspective projection makes these lines rush past the camera.
      this.windPositions[start] = p.x;
      this.windPositions[start + 1] = p.y;
      this.windPositions[start + 2] = p.z;
      this.windPositions[start + 3] = p.x * 1.06;
      this.windPositions[start + 4] = p.y * 1.06;
      this.windPositions[start + 5] = p.z - p.length * (1 + ratio + this.intensity);
    }
    (this.windGeometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose() {
    this.camera.remove(this.wind);
    this.car.remove(this.light);
    for (const flame of this.flames) {
      this.car.remove(flame.group);
      flame.group.traverse(object => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
        if (object instanceof THREE.Sprite) object.material.dispose();
      });
      flame.outer.dispose();
      flame.inner.dispose();
    }
    this.windGeometry.dispose();
    this.windMaterial.dispose();
    this.glowTexture.dispose();
    this.light.dispose();
  }
}
