# 🏎️ Naija Nitro 🇳🇬

**Lagos Asphalt** is a Nigeria-inspired browser arcade racing game. The ongoing migration replaces the original single-file JavaScript demo with a **TypeScript + Vite + Three.js + Rapier** codebase and a **React UI**.

> **Migration branch / alpha:** This is a new driving-engine prototype, **not feature parity with v6.0.0**. The previous v6 game with two track options, cars and AI remains available on the `main` branch under `game/index.html`. The new engine currently has a single oval Lagos-inspired test circuit, one car, a timing HUD and physics-driven collision body. It has not yet been browser-tested.

## Technology

| Layer | Technology |
|---|---|
| Development | TypeScript + Vite |
| Rendering | Three.js |
| Physics | Rapier 3D WASM (rigid bodies, colliders, ground and barriers) |
| UI | React |
| Audio | Howler.js dependency (audio system not yet wired up) |
| 3D art pipeline | Blender planned; procedural placeholder geometry today |
| Hosting | Netlify or Vercel |
| Source control | GitHub |

### Why Rapier?

Rapier provides actual 3D rigid-body simulation and collision resolution, replacing the old geometry-only collision calculations. **This is not a full wheel/suspension simulation yet.** The steering, throttle, traction and drift response remain deliberately arcade-controlled. A raycast-wheel suspension controller, tire grip and weight transfer are future physics milestones.

## Getting started

Install **Node.js 22 or newer** and run:

```bash
git clone https://github.com/toriloye2/NaijaNitro.git
cd NaijaNitro
git checkout migration/vite-typescript-rapier
npm install
npm run dev
```

Open the local URL printed by Vite.

### Build a production bundle

```bash
npm run build
npm run preview
```

The built static site is generated into `dist/`.

## Game controls

| Action | Key |
|---|---|
| Accelerate | W / Up Arrow |
| Brake | S / Down Arrow |
| Steer | A/D or Left/Right Arrows |
| Drift | Space |
| Nitro | Shift |
| Reset driving simulation | R |

Touch input buttons are included for experimentation on touch-enabled devices.

## Project structure

```text
NaijaNitro/
├── index.html                 # New Vite app entry
├── src/
│   ├── main.tsx               # React game HUD and touch controls
│   ├── style.css              # Responsive UI
│   └── game/
│       └── NitroGame.ts       # Three.js / Rapier simulation
├── game/index.html            # Legacy v6 single-file prototype
├── package.json
├── tsconfig.json
├── vite.config.ts
├── netlify.toml
├── vercel.json
└── README.md
```

## Deployment

**Do not deploy the migration branch to the public production site until the build and gameplay are tested.** Use a Netlify branch deploy / Vercel preview deployment first.

For Netlify, select this branch and use the settings already in `netlify.toml`: build command `npm run build`, publish directory `dist`, Node 22.

For Vercel, import the repo with Vite selected. Build with `npm run build` and output `dist`.

When the migration is tested, merging the branch into `main` will trigger automatic deployment on connected hosting platforms.

## Roadmap

- [x] Vite + TypeScript project structure
- [x] Three.js scene and Lagos-inspired test circuit
- [x] Rapier rigid body and physical ground / guardrail colliders
- [x] React HUD with keyboard and touch controls
- [ ] Verify clean `npm install` / `npm run build` in CI
- [ ] Browser gameplay smoke test and fix handling issues
- [ ] Raycast-wheel suspension, tire grip and weight transfer
- [ ] Migrate two legacy circuits, car selection, races and AI opponents
- [ ] Add proper 3D Nigerian landmarks and Blender models
- [ ] Hook up Howler engine, skid and collision audio
- [ ] Test desktop / mobile FPS and accessibility
- [ ] Merge stabilized version into `main`

## License

No license has been selected. All rights are reserved by the repository owner unless a license is added.
