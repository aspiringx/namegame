# Scene 4 Theatre.js Setup - Complete

## What I've Done

Scene 4 is now fully configured to use Theatre.js for animation. All the code is in place - you just need to create the keyframes in Theatre.js Studio.

### 1. Configuration Added
- ✅ Scene 4 is already defined in `speed-of-love-animation-config.json`
- ✅ Duration: 10 seconds
- ✅ 10 animated properties defined:
  - `oldConstellationOpacity` (1.0 → 0)
  - `oldPrimaryStarsOpacity` (1.0 → 0)
  - `cameraX` (0 → 150) - move right
  - `cameraY` (0 → ?) - move up/down
  - `cameraZ` (150 → ?) - pull back
  - `heroStarX` (0 → 150) - move right
  - `heroStarY` (0 → ?) - move up/down
  - `heroStarZ` (0 → ?) - move forward/back
  - `newPrimaryStarsOpacity` (0 → 1.0)
  - `newConstellationOpacity` (0 → 0.6)

### 2. Code Changes in Scene.tsx
- ✅ Added 10 Theatre.js state variables for Scene 4
- ✅ Added useFrame hook to read Scene 4 animation values
- ✅ Updated camera position to use `theatreCameraX`, `theatreCameraY`, `theatreCameraZ` (full 3D movement)
- ✅ Updated hero star position to use `theatreHeroStarX`, `theatreHeroStarY`, `theatreHeroStarZ` (full 3D movement)
- ✅ Updated old primary stars opacity
- ✅ Added old constellation lines with fade out
- ✅ Updated new primary stars opacity
- ✅ Updated new constellation opacity
- ✅ Disabled old lerping-based animation system

### 3. What Scene 4 Will Do
Based on the 10-second timeline, here's the suggested keyframe timing:

**Phase 1: Fade Out Old Constellation (0-1.5s)**
- `oldConstellationOpacity`: 1.0 → 0
- `oldPrimaryStarsOpacity`: 1.0 → 0.3

**Phase 2: Travel (1.5-7.5s)** - 3D cinematic movement
- `cameraX`: 0 → 150 (move right)
- `cameraY`: 0 → 30 (move up - suggested)
- `cameraZ`: 150 → 200 (pull back - suggested)
- `heroStarX`: 0 → 150 (move right)
- `heroStarY`: 0 → 30 (move up - suggested)
- `heroStarZ`: 0 → 0 (stay at origin depth)
- `oldPrimaryStarsOpacity`: 0.3 → 0

**Phase 3: Arrival Pause (7.5-8.5s)**
- Everything holds steady

**Phase 4: New Constellation Forms (8.5-10s)**
- `newPrimaryStarsOpacity`: 0 → 1.0
- `newConstellationOpacity`: 0 → 0.6

## What You Need to Do

1. **Start the dev server:**
   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Open the app and navigate to Scene 4**

3. **Open Theatre.js Studio** (Option-\)

4. **Create keyframes for Scene 4 Animation:**
   
   You'll see "Scene 4 Animation" in the Outline with 10 properties. For each property, create keyframes at the suggested times above:

   **At 0 seconds:**
   - oldConstellationOpacity: 1.0
   - oldPrimaryStarsOpacity: 1.0
   - cameraX: 0, cameraY: 0, cameraZ: 150
   - heroStarX: 0, heroStarY: 0, heroStarZ: 0
   - newPrimaryStarsOpacity: 0
   - newConstellationOpacity: 0
   - Click diamond icons for all

   **At 1.5 seconds:**
   - oldConstellationOpacity: 0
   - oldPrimaryStarsOpacity: 0.3
   - Click diamond icons

   **At 7.5 seconds:**
   - cameraX: 150, cameraY: 30, cameraZ: 200 (3D arc movement)
   - heroStarX: 150, heroStarY: 30, heroStarZ: 0
   - oldPrimaryStarsOpacity: 0
   - Click diamond icons

   **At 8.5 seconds:**
   - (Everything holds - no new keyframes needed)

   **At 10 seconds:**
   - newPrimaryStarsOpacity: 1.0
   - newConstellationOpacity: 0.6
   - Click diamond icons

5. **Test by scrubbing the timeline**
   - Old constellation should fade out
   - Camera and hero should move right
   - New stars should appear at X=150
   - New constellation should connect

6. **Export the state:**
   ```javascript
   exportTheatreState()
   ```
   
7. **Replace the file:**
   - Move downloaded file to `/apps/web/public/docs/scripts/speed-of-love-theatre-state.json`

8. **Test auto-play:**
   - Refresh browser
   - Navigate to Scene 4
   - Should auto-play the full 10-second sequence

## Notes

- The old Scene 4 animation loop has been disabled (wrapped in `if (false)`)
- Once you confirm Theatre.js works, we can delete the old animation code
- Scene 4 uses the same config-driven approach as Scenes 1-3
- All values come from `speed-of-love-animation-config.json`

## Potential Issues

If the animation doesn't look right:
- Check that new stars are positioned at X=150 (xOffset parameter)
- Verify hero star group is moving with the camera
- Make sure old constellation uses `primaryStarPositions` from Scene 3
- Adjust keyframe timing if phases feel too fast/slow
