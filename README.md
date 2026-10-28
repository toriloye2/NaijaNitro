<div align="center">

# 🏎️ Naija Nitro 🇳🇬
### Lagos Asphalt • Browser-Based Arcade Racing

**Experience high-speed arcade racing on Nigeria-inspired circuits, straight from your browser.**

[Play locally](#-getting-started) · [Controls](#-controls) · [Deploy](#-deployment) · [Roadmap](#-roadmap)

</div>

---

## 🎮 About the Project

**Naija Nitro** is an in-development browser racing project inspired by fast-paced arcade racers and the roads, architecture, and atmosphere of Nigeria. Its first game mode, **Lagos Asphalt**, focuses on **closed-course racing** rather than free roam.

Our design priorities are:

1. **Great car handling first:** responsive steering, satisfying drifting, braking and nitro.
2. **Proper racing:** laps, checkpoints, opponents, positions and times.
3. **A recognizable Nigerian identity:** highways, waterfront scenery, road signs and urban settings.
4. **Fast browser performance:** no install required, playable on desktop with touch controls for mobile experimentation.

> **Project status:** `v6.0.0` is a **prototype / release candidate**, **not a fully tested public release**. Tracks are stylized fictional interpretations, not geographically accurate reconstructions. Vehicle handling and AI are custom simplified systems. Gameplay, accessibility and device performance still need hands-on verification.

## ✨ Current Features

- 🌉 **Two Lagos-inspired circuits:** Third Mainland Sprint and Lagos Island Circuit
- 🚘 **Three car profiles:** Street GT, Sport Coupe and Hyper RS
- 🏁 **Game modes:** three-lap race and solo time trial
- 🤖 **Three computer-controlled opponents** in race mode
- ⚡ **Arcade driving:** acceleration, braking, drift, nitro and basic wall/vehicle collisions
- ⏱️ **Race HUD:** countdown, speedometer, lap timer, checkpoints and position
- 💾 **Best lap records:** saved locally in your browser (per track and car)
- 📱 **Experimental touch controls** on touch-enabled devices

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| HTML, CSS, JavaScript | Game interface, logic and controls |
| [Three.js](https://threejs.org/) | 3D rendering |
| Browser localStorage | Local lap records |
| [Netlify](https://www.netlify.com/) or [Vercel](https://vercel.com/) | Static website hosting |
| GitHub | Source code and version history |

The prototype currently uses Three.js from an external **ES module CDN**, so an internet connection is needed to load the game engine. There is **no build step** or backend.

## 📁 Project Structure

```text
NaijaNitro/
├── index.html         # Redirects visitors to /game/
├── game/
│   └── index.html     # Lagos Asphalt browser prototype
├── netlify.toml       # Netlify publish configuration
├── vercel.json        # Vercel configuration
└── README.md          # Project documentation
```

## 🚀 Getting Started

### Option A: VS Code Live Server

1. Clone the repository:
   ```bash
   git clone https://github.com/toriloye2/NaijaNitro.git
   cd NaijaNitro
   ```
2. Open the project in **VS Code**.
3. Install the **Live Server** extension if needed.
4. Right-click `index.html` and choose **Open with Live Server**.
5. Start a race using the in-game menu.

### Option B: Python HTTP server

From the repository root:

```bash
python -m http.server 8000
```

Then visit **http://localhost:8000**.

> Opening the HTML directly through `file://` is not recommended. Use a local HTTP server.

## 🎮 Controls

| Action | Keyboard |
|---|---|
| Accelerate | W / ↑ |
| Brake / Reverse | S / ↓ |
| Steer left | A / ← |
| Steer right | D / → |
| Drift | Space |
| Nitro | Shift |
| Pause / Resume | P |
| Restart race | R |

Touch-enabled devices display on-screen buttons. Mobile support is still experimental.

## 🌐 Deployment

The project can be deployed as a **static website**.

### Netlify (recommended for first testing)

1. Go to [Netlify](https://app.netlify.com/start) and select **Add new project / Import an existing project**.
2. Connect **GitHub** and choose `toriloye2/NaijaNitro`.
3. Use these settings:
   - **Production branch:** `main`
   - **Build command:** leave empty
   - **Publish directory:** `.` (repository root)
4. Click **Deploy**.
5. Open the generated Netlify URL and verify the race loads.

**Automatic updates:** Once Netlify is connected, pushing commits to `main` triggers a new deployment. Use development branches and merge tested updates into `main` to avoid publishing unfinished features.

### Vercel

Import this GitHub repository at [vercel.com/new](https://vercel.com/new). Select **Other** for the framework if prompted, leave the build command empty and deploy from the repository root.

## 🗺️ Roadmap

- [x] Browser racing prototype
- [x] Two Nigeria-inspired circuits
- [x] Selectable cars, nitro, drifting and lap timing
- [x] Basic opponent AI
- [ ] Hands-on browser testing and bug fixing
- [ ] Improved tire traction, suspension and vehicle weight transfer
- [ ] Improved AI racing lines, overtaking and collision avoidance
- [ ] More detailed Nigerian track art and landmarks
- [ ] Sound design, engine audio and effects
- [ ] Mobile performance optimization
- [ ] Full quality assurance before public launch
- [ ] Online multiplayer (future phase)

## 🔁 Development Workflow

- **`main`:** release/testing deployments; keep it as stable as practical.
- **Feature branches:** work on physics, circuits, visuals and game modes.
- **Pull requests:** review and test changes before merging.
- **Version tags:** label notable releases, for example `v6.0.0`, `v6.1.0` and `v7.0.0`.

## 🤝 Contributing

The game is under active early development. If you'd like to help, open an issue describing the bug or improvement, then propose a change through a pull request. Please avoid uploading unlicensed third-party car models, logos, music or visual assets.

## 📄 License

**No open-source license has been selected yet.** Source availability on GitHub does not automatically grant permission to reuse or redistribute the code. A license can be added once the project owner chooses one.

---

<div align="center">

**Built for the thrill of racing, with a Nigerian identity. 🇳🇬**

*Naija Nitro • Lagos Asphalt*

</div>
