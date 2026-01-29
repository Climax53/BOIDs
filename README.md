# BOIDS Game (Electron)

A desktop version of the BOIDS simulation with adjustable flock, predators, obstacles, and theme controls.

## What it does
- Real-time boids flocking simulation (regular + predator types).
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
- **Menu (hamburger)**: bottom-left.
- **Regular Boids / Predatory Boids**: set counts and save.
- **Obstacles**: set count (max 10) and save.
- **Background**: switch themes instantly.
- **Mouse BOID**: enables idle cursor assist after 3 seconds of inactivity.
- **Chaos Mode**: toggles color-based flocking behavior.

## Feature details
### Mouse BOID (idle cursor assist)
- **What it does**: adds an invisible "mouse boid" that steers like a regular boid and uses `robotjs` to gently move the system cursor along its path.
- **How it works**: after ~3 seconds of no user input, the app starts moving the cursor about every 70ms to keep the system active.
- **How to disable**: move the mouse, click anywhere, or press any key to immediately stop it; clicking also pauses the assist briefly (~1.2s) and resets the idle timer. You can also uncheck **Mouse BOID** in the menu.

### Chaos Mode
- **What it does**: breaks up mixed-color cohesion. Regular boids only cohere with same-color boids and actively avoid other colors.
- **How it works**: color groups tighten into their own clusters while treating other colors like threats, which makes movement more turbulent. Predators behave normally.
- **How to disable**: uncheck **Chaos Mode** in the menu.

## Notes
- If you update code, restart the app to see changes.
- If `robotjs` fails to rebuild, confirm:
  - Python 3.11 path is set in `npm_config_python`
  - Visual Studio Build Tools include the VC++ toolset + Windows SDK
