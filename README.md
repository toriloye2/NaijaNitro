# 🏎️ Naija Nitro 🇳🇬

**Lagos Asphalt** is a Nigeria-inspired browser arcade racing game. The ongoing migration replaces the original single-file JavaScript demo with a **TypeScript + Vite + Three.js + Rapier** codebase and a **React UI**.

> **Current main-branch racing prototype with interactive garage:** This is a new driving-engine prototype, **not feature parity with v6.0.0**. The previous v6 game remains available under `game/index.html`. Current graphical and AI fidelity remains prototype-level. The new engine currently has an interactive Nigeria-themed 3D car garage, race countdown, animated nitro and wind effects, plus an upgraded Third Mainland Bridge-inspired oval test circuit, a more detailed reference-driven 2010 Camry Muscle-inspired sedan, a timing HUD, seven rival racing cars, nitro pickups, best-lap tracking and Rapier rigid-body collision handling. Automated build checks pass, but this graphics update still needs hands-on browser testing.

## Technology

| Layer | Technology |
|---|---|
| Development | TypeScript + Vite |
| Rendering | Three.js |
| Physics | Rapier 3D WASM (rigid bodies, colliders, ground and barriers) |
| UI | React, interactive 3D garage, CSS menus, pause, countdown and finish overlays |
| Audio | Procedural Web Audio engine RPM, wind and nitro synthesis (no external samples); Howler.js installed but not used for this feature |
| 3D art pipeline | Procedural detailed Camry-inspired sedan and bridge geometry today; Blender art planned |
| Hosting | Netlify or Vercel |
| Source control | GitHub |

### Why Rapier?

Rapier provides actual 3D rigid-body simulation and collision resolution, replacing the old geometry-only collision calculations. **This is not a full wheel/suspension simulation yet.** The steering, throttle, traction and drift response remain deliberately arcade-controlled. A raycast-wheel suspension controller, tire grip and weight transfer are future physics milestones.

## Getting started

Install **Node.js 22 or newer** and run:

```bash
git clone https://github.com/toriloye2/NaijaNitro.git
cd NaijaNitro
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
| Restart race | R |
| Pause / resume | P |

Touch input buttons are included for experimentation on touch-enabled devices. A clickable **START RACE** button unlocks Web Audio, and the race begins with a 3-second countdown. **P** pauses and resumes; **R** restarts with a countdown. The sound button toggles mute. Nitro requires acceleration and sufficient speed.

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

**The TypeScript migration is merged to `main`; the Camry/bridge graphics upgrade has been merged into `main` after passing CI, but gameplay still needs hands-on testing before public launch.** Prefer a private Netlify/Vercel preview until then.

For Netlify, select this branch and use the settings already in `netlify.toml`: build command `npm run build`, publish directory `dist`, Node 22.

For Vercel, import the repo with Vite selected. Build with `npm run build` and output `dist`.

Future pushes to `main` can trigger automatic deployments on connected hosting platforms.

## Roadmap

- [x] Vite + TypeScript project structure
- [x] Three.js scene and Lagos-inspired test circuit
- [x] Rapier rigid body and physical ground / guardrail colliders
- [x] React HUD with keyboard and touch controls
- [ ] Verify clean `npm install` / `npm run build` in CI
- [ ] Browser gameplay smoke test and fix handling issues
- [ ] Raycast-wheel suspension, tire grip and weight transfer
- [x] Add seven kinematic AI opponents, simple catch-up racing, position tracking and nitro pickups
- [x] Add procedural asphalt and additional Lagos Lagoon ferries, palms and reflectors
- [ ] Expand AI with safe overtaking and actual vehicle physics
- [ ] Migrate second legacy circuit and car selection
- [x] Add improved stylized Third Mainland Bridge roadway, rails, supports, signs and Lagos skyline
- [x] Add 2010 Camry Muscle-inspired 3D vehicle with lights, windows, wheels and trim
- [x] Add Nigeria-themed interactive 3D car showroom and live paint customization
- [ ] Import production-quality Blender meshes and more recognizable Nigerian landmarks
- [x] Add reactive synthesized engine, wind and nitro audio (Web Audio API)
- [x] Add cinematic title screen, pause, finish overlays, countdown, boost camera FOV, nitro flames and wind streaks
- [ ] Add polished sampled engine, skid and collision audio and refine the mix
- [ ] Test desktop / mobile FPS and accessibility
- [ ] Merge stabilized version into `main`

## License

No license has been selected. All rights are reserved by the repository owner unless a license is added.

## Camry Muscle graphics upgrade (feature branch)

The vehicle is an **original procedural, stylized model inspired by the 2007–2011 Toyota Camry XV40**, popularly nicknamed *Camry Muscle* in Nigeria. No proprietary Toyota 3D asset is included. The surrounding track is a **fictional oval inspired by** Lagos's Third Mainland Bridge, not a geographically accurate recreation. Improvements include road lane markings, bridge deck, railings, piers, Lagos signs, lighting poles, water and a coastal skyline.

**Testing still needed:** actual browser appearance, mobile performance, collision stability and driving feedback. This code is not yet an asset-quality, licensed Toyota replica, and the bridge is not to scale.

## Cinematic racing update

- **Opening screen:** Naija Nitro branding, playable launch CTA, controls help, Camry Muscle edition and Lagos track identity.
- **Race states:** menu → countdown → race → pause / finish with restart and return-to-menu actions.
- **Nitro:** hold **W + Shift** (or GAS + NITRO) at speed while the meter has charge. Boost adds blue/cyan twin exhaust flames, glow, field-of-view expansion, motion streaks, screen tint, acceleration and a synth hiss. Meter recharges gradually and while drifting.
- **Wind:** speed-dependent camera wind particles and a synthesized rushing-wind audio layer.
- **Audio:** synthesized procedural sound using Web Audio, activated on the player's Start click. This deliberately avoids downloading or embedding copyrighted engine recordings. Browsers may disable audio until a user gesture.
- **Performance:** lightweight reusable geometries and responsive CSS overlays. Device-specific performance remains unverified.

**Graphics note:** These are stylized visual effects, not yet photorealistic particle simulations or an Asphalt-quality cinematic pipeline. The legacy road physics are intentionally preserved.

## Competitive racing and graphics upgrade

- Three-lap eight-car race with seven computer-controlled opponents, kinematic collision bodies, and live position ranking.
- Four visible cyan nitro-recharge collectibles per circuit loop; each has an 18-second cooldown after pickup.
- Best lap display and finish position.
- Procedurally textured asphalt with UVs, shore palms, Lagos Lagoon ferries, reflective markers and start-grid styling.
- Arcade AI follows an ellipse and uses a simple player-gap adjustment. It does **not** yet implement tactical overtakes or robust opponent collision avoidance.
- Road geometry and skyline are optimized stylized placeholders, not photorealistic recreations. Browser frame rates and handling require testing.

## Lagos Racing Division garage

The main menu now displays a new original 3D showroom inspired by Nigerian workshop culture, with national green-white-green accents, Lagos Racing Division branding, neon lighting, platform podium, detailed workshop bays, wheels and signage.

- Rotate the XV40 Camry Muscle-inspired car using the arrow buttons.
- Choose between six finishes: Pearl Silver, Lagos Green, Midnight Black, Sunset Red, Electric Blue and Champagne Gold.
- Car paint is applied to both the showroom model and the in-race model, without changing physics.
- See car performance stat bars, selected track, race event, and an 8-car race start button.
- Responsive compact layout on smaller screens.

This is an early procedural **3D garage scene**, not a photorealistic licensed vehicle or a fully functional purchasing/upgrades system. The displayed performance ratings are illustrative. The main game uses the existing simplified physics and track while higher-fidelity models and customization are still being developed.

## Camry Muscle reference-model revision

The user-provided silver front three-quarter, black rear three-quarter and champagne front-closeup photos guide the new **procedural XV40 Camry Muscle-style** model. This update changes the actual Three.js vehicle mesh used in the garage and in races, including:

- Tapered three-box sedan profile, longer hood, sloping windscreen, roof and rear deck.
- Swept headlights, amber corner lamps, grille outline, fog light accents, bumper intakes and plate recesses.
- Wraparound rear lamp clusters, silver decklid trim and rear bumper details.
- Four-door windows, B-pillars, chrome window surrounds, painted mirrors, side door seams and handles.
- 5-spoke-style alloy wheels, rubber tyres, wheel-arch accents and reflective clearcoat paint.
- Continued six-color customization with independently configurable materials for garage and race cars.

**Accuracy and licensing:** This is an original stylized geometry approximation based on visual references, not a laser scan, official Toyota model, imported licensed mesh or photorealistic rendering. The photos themselves are not embedded. Geometry is constructed in TypeScript at runtime; a professionally made Blender/GLB model and hands-on visual QA will still be needed to reach premium commercial-game fidelity.
