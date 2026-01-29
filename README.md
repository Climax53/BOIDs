# BOIDS Game (Electron)

A desktop version of the BOIDS simulation with adjustable flock, predators, obstacles, and theme controls.

## What it does
- Real‑time boids flocking simulation (regular + predator types).
- Drifting obstacles you can scale up/down.
- Theme picker for background styles.
- Optional idle cursor assist that can keep the system active when enabled.

## Requirements
- Windows 10/11
- Node.js (LTS recommended)
- Python 3.11 (for native module rebuilds)
- Visual Studio Build Tools with **Desktop development with C++**

## Setup
```powershell
cd "C:\Users\<your-username>\Downloads\BOIDs-main"
npm install
```

Install the native mouse module (required for the idle cursor assist):
```powershell
npm install robotjs
```

Rebuild native modules for Electron:
```powershell
$env:npm_config_python="C:\Users\<your-username>\AppData\Local\Programs\Python\Python311\python.exe"
npx electron-rebuild -f -w robotjs
```

## Run
```powershell
npm start
```

## Controls
- **Menu (hamburger)**: bottom‑left.
- **Regular Boids / Predatory Boids**: set counts and save.
- **Obstacles**: set count (max 10) and save.
- **Background**: switch themes instantly.
- **Mouse BOID**: enables idle cursor assist after 3 seconds of inactivity.

## Notes
- If you update code, restart the app to see changes.
- If `robotjs` fails to rebuild, confirm:
  - Python 3.11 path is set in `npm_config_python`
  - Visual Studio Build Tools include the VC++ toolset + Windows SDK
