# Chart Your Stars - 3D Sphere Upgrade Plan
**Date:** January 27, 2025  
**Status:** Planning

## Overview
Transform the Chart Your Stars demo from flat 2D disks to immersive 3D spheres with smooth camera transitions. Goal: Make it feel magical, majestic, and professional - like flying through space in a spaceship.

---

## Terminology and Star Perception Factors

### Critical: These Factors Work Together
**NEVER adjust just one factor in isolation.** Changes to any of these affect how users perceive star size, position, and distance. Always consider the full system when making adjustments.

### The HUD (Heads-Up Display)
- **Definition:** The rectangle bounded by the four green corner markers visible on screen
- **Center:** The crosshairs in the middle of the HUD rectangle
- **Important:** "Centering in HUD" means centering in this rectangle, NOT just the viewport
- **Current state:** HUD center = viewport center (aligned for simplicity)

### Coordinate System & Directions
- **Three.js coordinates:**
  - X-axis: left (-) to right (+)
  - Y-axis: down (-) to up (+)
  - Z-axis: into screen (-) to out of screen (+)
- **Camera movement effects:**
  - Subtracting from `camera.position.y` moves camera DOWN → star appears HIGHER on screen
  - Adding to `camera.position.y` moves camera UP → star appears LOWER on screen
  - Subtracting from `camera.position.z` moves camera CLOSER → star appears LARGER
  - Adding to `camera.position.z` moves camera FARTHER → star appears SMALLER
- **Language precision:** Always specify "camera moves down" vs "star appears higher" to avoid confusion

### Factors Affecting Star Appearance (Must Consider Together)
1. **Star size (`baseSize`)** - The 3D object's actual size in world units (currently 3.0)
2. **Camera distance (`viewDistance`)** - How far camera is from star (currently 6.5)
3. **Camera FOV (field of view)** - Set at canvas level, affects perspective (60°)
4. **Camera position:**
   - X: horizontal alignment (currently `targetPos.x`)
   - Y: vertical alignment (currently `targetPos.y - 2`)
   - Z: depth (currently `targetPos.z + 6.5`)
5. **Camera rotation/angle** - Which way camera is looking (currently `lookAt(targetPos)`)
6. **Star opacity** - Affects visibility and perceived distance
7. **Star glow/halo size** - Affects perceived size and brightness
8. **Transition progress** - Affects multiple properties during animation
9. **Distance from camera** - Calculated dynamically, affects LOD and rendering

### Depth Perception Factors
- **Size scaling:** Distant objects appear smaller (perspective)
- **Opacity:** Distant objects appear dimmer
- **Glow intensity:** Closer objects have brighter halos
- **Texture detail:** Faces only visible when close enough
- **Layering:** Z-position affects render order and occlusion

### Common Mistakes to Avoid
1. ❌ Adjusting star size without considering camera distance
2. ❌ Changing camera position without checking HUD alignment
3. ❌ Modifying one opacity value without checking related opacity calculations
4. ❌ Using "up/down" without specifying camera vs screen space
5. ❌ Saying "centered" without specifying HUD vs viewport vs world space

---

## How to Remember Context After Reloads and Restarts

### If Windsurf Crashes or You Need to Restart

**User Actions (do these first):**
1. ✅ Open this plan doc: `/docs/plans/2025-10-27-chart-your-stars-3d-upgrade.md`
2. ✅ Share the "Progress Log" section showing what's been completed
3. ✅ Run: `git log --oneline -10` to see recent commits
4. ✅ Run: `git diff` to see any uncommitted changes
5. ✅ If there were specific issues, describe them briefly

**Cascade Actions (I will do these):**
1. 🤖 Read this entire plan document first
2. 🤖 Review the "Terminology and Star Perception Factors" section
3. 🤖 Check my memories for Chart Your Stars context
4. 🤖 Read the recent git commits you shared
5. 🤖 Ask clarifying questions about current state before making changes

### Quick Context Recovery Template

**User says:**
```
Context recovery needed:
- Last working on: [Phase/task from plan doc]
- Recent commits: [paste git log output]
- Current issue: [if any]
- Files open: [list key files]
```

**I will respond:**
```
Context recovered. I've reviewed:
✅ Plan doc progress
✅ Terminology section
✅ Recent commits
✅ Current phase: [X]

Ready to continue with: [specific next step]
Confirm before I proceed?
```

### Key Documents to Reference
1. **This plan:** `/docs/plans/2025-10-27-chart-your-stars-3d-upgrade.md`
2. **Main files:**
   - `/apps/web/src/app/chart-your-stars-demo/StarField.tsx`
   - `/apps/web/src/app/chart-your-stars-demo/ChartYourStars.tsx`
3. **Memory tag:** Search my memories for `chart_your_stars`

### Git Commands for Context
```bash
# See recent commits
git log --oneline -10

# See what changed in last commit
git show HEAD

# See uncommitted changes
git diff

# See which files changed recently
git log --name-only -5

# See full history of this feature branch
git log --oneline --graph chart-your-stars-demo
```

### What NOT to Do After Restart
- ❌ Don't start making changes immediately
- ❌ Don't assume I remember the current state
- ❌ Don't skip reviewing the plan doc
- ❌ Don't forget to check for uncommitted work

---

## Phase 1: Fix Critical Bugs (Do First)
**Goal:** Make current experience smooth and professional

### 1A. Smooth Camera Transitions Between Stars 🔄
- **Problem:** Stars disappear/reappear, camera jumps
- **Fix:** Implement smooth camera flight path from star A → star B
  - Keep both stars visible during transition
  - Smooth lerp with easing (slow start, fast middle, slow arrival)
  - "Takeoff" animation: pull back from current star before flying to next
  - "Landing" animation: gentle deceleration as we approach target
- **Status:** In progress
- **Implementation:**
  - ✅ Added 'takeoff' phase to journeyPhase state
  - ✅ Added takeoff refs (takeoffProgress, takeoffStartPos, previousStarPos)
  - ✅ Implemented takeoff animation in useFrame (pulls camera back 15 units along Z-axis)
  - ✅ Added onTakeoffComplete callback to transition from takeoff → flying
  - ✅ Modified handleProceedAfterPlacement to initiate takeoff instead of direct flying
  - ⏳ Need to test: Camera should pull back from star A, then fly smoothly to star B

### 1B. Fix Star Scaling/Opacity During UI Interaction ✅
- **Problem:** Star becomes bigger/transparent when clicking buttons
- **Fix:** Lock star appearance when "arrived" state is active
  - Disable transition animations during button interaction
  - Only animate during approach/departure phases
- **Status:** Complete
- **Implementation:**
  - ✅ Added locked appearance refs (lockedSize, lockedOpacity, lockedTransitionProgress)
  - ✅ Lock values when `isTarget && (journeyPhase === 'arrived' || 'placed')`
  - ✅ Reset locks when transitioning out of arrived/placed phase
  - ✅ Star now maintains consistent size, opacity, and transition state during UI interaction

### 1C. Improve Constellation Visibility on Mobile ✅
- **Problem:** 15 constellation stars hard to distinguish from background
- **Fix:** 
  - Increase constellation star brightness (0.9+ opacity vs 0.3 for background)
  - Larger base size for constellation stars
  - Optional: subtle pulsing glow animation
- **Status:** Complete
- **Implementation:**
  - ✅ Boosted opacity during intro phase: 0.6-0.9 (was 0.15-0.7)
  - ✅ Increased size during intro phase: 2.0-3.5 (was 1.5-3.0)
  - ✅ Stars automatically dim/shrink when journey starts to focus on target star

---

## Phase 2: Convert to 3D Spheres
**Goal:** Transform flat disks into 3D celestial spheres

### 2A. Hybrid 3D Effect ✅
- ~~Change `circleGeometry` → `sphereGeometry`~~ **Decision: Keep flat circles with 3D shading**
- Keep texture mapping working with aspect ratio preservation
- Maintain billboard behavior (face always points to camera)
- **Status:** Complete
- **Decision:** Hybrid approach - flat circles with sphere-like shading when distant
- **Implementation:**
  - ✅ Kept circle geometry for performance and image quality
  - ✅ Added sphere-like shading shader to star core (radial gradient + lighting)
  - ✅ 3D effect visible when distant, fades as images appear
  - ✅ Improved shader to preserve aspect ratio (no stretching)
  - ✅ Billboard behavior maintained through existing lookAt logic
  - ✅ Smooth transition from "3D sphere" to flat image
- **Why hybrid approach:** True spheres caused image quality issues. Flat circles with radial gradient shading provide the illusion of 3D depth when distant, while maintaining clear, high-quality images when close. Best of both worlds with better performance.

### 2B. Add Atmospheric Effects ✅
- Glowing halo around each sphere (shader or layered meshes)
- ~~Subtle rotation animation when idle~~ **Skipped - not visible with billboard behavior**
- Depth-based fog/glow intensity
- **Status:** Complete
- **Implementation:**
  - ✅ Glowing halo already implemented (soft blue glow layer)
  - ✅ Depth-based glow intensity (opacity varies with distance)
  - ✅ Sphere-like shading with radial gradient
  - ⏭️ Rotation skipped - not visible on billboarded flat circles

### 2C. Camera Behavior Enhancement ✅
- **Initial flight from overview:**
  1. ✅ Gradual pan from constellation center to target star
  2. ✅ Delayed look direction transition (starts at t=0.2)
  3. ✅ Ease-in-out curve for smooth, cinematic movement
  4. ✅ Constellation stars stay visible and gradually fade
  5. ✅ Photo appears only when close (distance < 40)
  
- **Landing sequence:**
  1. ✅ Smooth deceleration as approaching
  2. ✅ Final position: centered in HUD
  3. ✅ Clean photo display without edge artifacts

- **Status:** Complete (initial flight)
- **Implementation:**
  - ✅ Bezier curve flight path with gradual X/Y panning
  - ✅ Delayed camera look direction transition with easing
  - ✅ Distance-based constellation dimming (stays bright until distance < 80)
  - ✅ Delayed photo transition (starts at 40, complete at 20)
  - ✅ Fixed texture filtering and aspect ratio for clean images
- **Next:** Need to implement takeoff sequence for star-to-star transitions

---

## Phase 3: Polish & Magic
**Goal:** Make it feel majestic and professional

### 3A. Visual Polish ⏳
- Particle trail during flight (stars streaking past)
- Constellation lines that connect stars (fade in when zoomed out)
- Lens flare effect when passing close to bright stars
- Subtle camera shake on takeoff/landing
- **Status:** Not started

### 3B. Animation Refinement ⏳
- Easing functions for all movements (no linear motion)
- Face texture fades in as you approach (not instant)
- Sphere rotation slows as you arrive (gives weight/presence)
- **Status:** Not started

### 3C. Performance ⏳
- LOD (Level of Detail) for distant spheres
- Optimize texture loading
- Ensure 60fps on mobile
- **Status:** Not started

---

## Implementation Order

**Session 1: Phase 1 (Critical Fixes)**
1. Fix camera transitions - smooth flight between stars
2. Fix star appearance during UI interaction
3. Improve constellation visibility

**Session 2: Phase 2A-B (3D Conversion)**
1. Convert to sphere geometry
2. Implement billboard textures
3. Add atmospheric glow

**Session 3: Phase 2C + 3 (Polish)**
1. Takeoff/landing sequences
2. Visual effects (particles, trails)
3. Final polish and performance

---

## Notes & Decisions

### Key Insight: Spaceship Landing/Takeoff
After arriving at a star, the transition to the next should feel like:
1. A spaceship that landed on a moon
2. Takes off (pulls back, rotates)
3. Flies to the next celestial sphere
4. Lands gently in front of it

### Technical Constraints
- Must work on mobile (performance critical)
- WebP textures work with Three.js TextureLoader
- Currently using 15 unique real user photos (thumb.webp)

---

## Progress Log

### 2025-01-27
- ✅ Created plan document
- ✅ Replaced dicebear avatars with 15 unique real user photos
- 🔄 Ready to start Phase 1

---

## Legend
- ⏳ Not started
- 🔄 In progress
- ✅ Complete
- ❌ Blocked/Issue
