import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { createCamryMuscle } from './CamryMuscle';
import { createThirdMainland } from './ThirdMainland';

export type Telemetry = { speed: number; nitro: number; lap: number; time: number; status: string; drift: boolean };
type Controls = 'left' | 'right' | 'gas' | 'brake' | 'drift' | 'nitro';
const clamp = THREE.MathUtils.clamp;
const ROAD_RADIUS_X = 115;
const ROAD_RADIUS_Z = 75;
const ROAD_WIDTH = 27;

export class NitroGame {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(65, 1, 0.1, 800);
  private renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  private world!: RAPIER.World;
  private chassis!: RAPIER.RigidBody;
  private car!: THREE.Group;
  private wheels: THREE.Group[] = [];
  private keys = new Set<string>();
  private touches = new Set<string>();
  private animation = 0;
  private last = 0;
  private accumulator = 0;
  private speed = 0;
  private yaw = 0;
  private side = 0;
  private nitro = 100;
  private elapsed = 0;
  private lap = 1;
  private lastAngle = 0;
  private progress = 0;
  private active = false;
  private ready = false;
  private disposed = false;
  private status = 'Physics initialization';
  private input = { left: ['KeyA','ArrowLeft'], right: ['KeyD','ArrowRight'], gas: ['KeyW','ArrowUp'], brake: ['KeyS','ArrowDown'], drift: ['Space'], nitro: ['ShiftLeft','ShiftRight'] };
  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (e.code === 'KeyR' && !e.repeat) { this.reset(); this.active = true; this.status = 'Racing'; }
  };
  private readonly onKeyUp = (e: KeyboardEvent) => this.keys.delete(e.code);
  private readonly onResize = () => this.resize();
  private readonly onBlur = () => this.keys.clear();

  constructor(private host: HTMLElement, private onTelemetry: (data: Telemetry) => void) {
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.host.append(this.renderer.domElement);
    this.resize();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }
  async init() {
    await RAPIER.init();
    if (this.disposed) return;
    this.world = new RAPIER.World({ x: 0, y: -18, z: 0 });
    this.scene.background = new THREE.Color('#9ed0df');
    this.scene.fog = new THREE.Fog('#9ed0df', 125, 470);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x5d899b, 2.4));
    const sun = new THREE.DirectionalLight(0xffecc4, 2.1);
    sun.position.set(-80, 120, 50); this.scene.add(sun);
    createThirdMainland(this.scene, this.world);
    const camry = createCamryMuscle();
    this.car = camry.group;
    this.wheels = camry.wheels;
    this.scene.add(this.car);
    this.chassis = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(ROAD_RADIUS_X, 1.5, 0).setLinearDamping(.3).setAngularDamping(2).lockRotations());
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(1.15, .45, 2.25).setFriction(1.1).setRestitution(.05), this.chassis);
    this.reset();
    this.ready = true;
    this.status = 'Ready';
    this.animation = requestAnimationFrame(this.frame);
  }
  private pressed(key: Controls) { return this.touches.has(key) || this.input[key].some(c => this.keys.has(c)); }
  setTouch(key: string, value: boolean) { if (value) this.touches.add(key); else this.touches.delete(key); }
  start() { if (!this.ready) return; this.reset(); this.active = true; this.status = 'Racing'; }
  reset() {
    if (!this.chassis) return;
    this.active = false; this.speed = 0; this.side = 0; this.yaw = Math.PI; this.nitro = 100;
    this.elapsed = 0; this.lap = 1; this.lastAngle = 0; this.progress = 0;
    this.chassis.setTranslation({ x: ROAD_RADIUS_X, y: 1.6, z: 0 }, true);
    this.chassis.setLinvel({ x: 0, y: 0, z: 0 }, true);
    this.chassis.setAngvel({ x: 0, y: 0, z: 0 }, true);
    this.chassis.setRotation({ x: 0, y: Math.sin(this.yaw / 2), z: 0, w: Math.cos(this.yaw / 2) }, true);
  }
  private tick(dt: number) {
    if (!this.active) { this.world.step(); this.sync(); return; }
    this.elapsed += dt;
    const p = this.chassis.translation();
    const angle = Math.atan2(p.z / ROAD_RADIUS_Z, p.x / ROAD_RADIUS_X);
    // Follow ellipse centerline using an arcade-style heading and velocity controller.
    const desiredHeading = Math.atan2(ROAD_RADIUS_X * Math.sin(angle), -ROAD_RADIUS_Z * Math.cos(angle));
    let headingError = Math.atan2(Math.sin(desiredHeading - this.yaw), Math.cos(desiredHeading - this.yaw));
    const gas = this.pressed('gas'), brake = this.pressed('brake'), drifting = this.pressed('drift');
    const boosting = gas && this.pressed('nitro') && this.nitro > 0 && this.speed > 8;
    const maxSpeed = boosting ? 92 : 69;
    if (gas) this.speed += (boosting ? 53 : 32) * dt;
    if (brake) this.speed -= (this.speed > 0 ? 52 : 12) * dt;
    this.speed -= (1.3 + .0035 * this.speed * this.speed) * dt;
    this.speed = clamp(this.speed, -8, maxSpeed);
    if (!gas && !brake && Math.abs(this.speed) < .15) this.speed = 0;
    this.nitro = clamp(this.nitro + (boosting ? -31 : drifting && Math.abs(this.speed) > 15 ? 9 : 4) * dt, 0, 100);
    let steering = Number(this.pressed('left')) - Number(this.pressed('right'));
    this.yaw += (steering * (drifting ? 1.65 : 1.1) + clamp(headingError, -.45, .45) * .65) * Math.min(1, Math.abs(this.speed) / 9) * dt;
    this.side += ((drifting ? steering * this.speed * .22 : 0) - this.side) * Math.min(1, dt * (drifting ? 2.2 : 8));
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const vx = forward.x * this.speed + right.x * this.side;
    const vz = forward.z * this.speed + right.z * this.side;
    const velocity = this.chassis.linvel();
    this.chassis.setLinvel({ x: vx, y: velocity.y, z: vz }, true);
    this.chassis.setRotation({ x: 0, y: Math.sin(this.yaw / 2), z: 0, w: Math.cos(this.yaw / 2) }, true);
    this.world.step();
    // Compare actual velocity with desired velocity, so collisions impact the speedometer.
    const after = this.chassis.linvel();
    const actual = after.x * forward.x + after.z * forward.z;
    if (Math.abs(actual) < Math.abs(this.speed) * .75 && Math.abs(this.speed) > 6) {
      this.speed = actual;
      this.status = 'Impact / traction loss';
    } else this.status = boosting ? '⚡ NITRO' : drifting ? 'DRIFT' : 'GRIP';
    // Count a complete anti-clockwise circuit rather than accepting a shortcut across the finish.
    let delta = angle - this.lastAngle;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    if (delta > 0 && delta < .35) this.progress += delta;
    this.lastAngle = angle;
    if (this.progress >= Math.PI * 2 - .12 && Math.abs(angle) < .19) {
      this.progress = 0; this.lap++;
      if (this.lap > 3) { this.active = false; this.status = 'Race finished · press R to reset'; }
    }
    if (p.y < -5) this.reset();
    this.sync();
  }
  private sync() {
    if (!this.car || !this.chassis) return;
    const p = this.chassis.translation();
    this.car.position.set(p.x, p.y - .43, p.z);
    for (const wheel of this.wheels) wheel.rotation.x -= this.speed / 60 / .49;
    const rotation = this.chassis.rotation();
    this.car.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }
  private frame = (now: number) => {
    if (this.disposed) return;
    this.animation = requestAnimationFrame(this.frame);
    const dt = this.last ? Math.min(.06, (now - this.last) / 1000) : 0;
    this.last = now; this.accumulator += dt;
    let ticks = 0;
    while (this.accumulator >= 1 / 60 && ticks++ < 4) { this.tick(1 / 60); this.accumulator -= 1 / 60; }
    if (ticks > 4) this.accumulator = 0;
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const target = this.car.position.clone().addScaledVector(forward, -11.7).add(new THREE.Vector3(0, 4.6, 0));
    this.camera.position.lerp(target, Math.min(1, dt * 5));
    this.camera.lookAt(this.car.position.clone().addScaledVector(forward, 15).add(new THREE.Vector3(0, 1.35, 0)));
    this.renderer.render(this.scene, this.camera);
    this.onTelemetry({ speed: this.speed, nitro: this.nitro, lap: Math.min(this.lap, 3), time: this.elapsed, status: this.status, drift: this.pressed('drift') });
  };
  private resize() {
    const w = this.host.clientWidth || innerWidth, h = this.host.clientHeight || innerHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  dispose() {
    this.disposed = true; cancelAnimationFrame(this.animation);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.renderer.dispose(); this.renderer.domElement.remove();
    this.scene.traverse(obj => { if (obj instanceof THREE.Mesh) { obj.geometry.dispose(); const materials = Array.isArray(obj.material) ? obj.material : [obj.material]; materials.forEach(m => m.dispose()); } });
    if (this.world) this.world.free();
  }
}
