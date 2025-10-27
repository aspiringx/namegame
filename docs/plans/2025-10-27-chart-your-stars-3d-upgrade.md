# Chart Your Stars - 3D Sphere Upgrade Plan
**Date:** January 27, 2025  
**Status:** Planning

## Overview
Transform the Chart Your Stars demo from flat 2D disks to immersive 3D spheres with smooth camera transitions. Goal: Make it feel magical, majestic, and professional - like flying through space in a spaceship.

---

## Phase 1: Fix Critical Bugs (Do First)
**Goal:** Make current experience smooth and professional

### 1A. Smooth Camera Transitions Between Stars ⏳
- **Problem:** Stars disappear/reappear, camera jumps
- **Fix:** Implement smooth camera flight path from star A → star B
  - Keep both stars visible during transition
  - Smooth lerp with easing (slow start, fast middle, slow arrival)
  - "Takeoff" animation: pull back from current star before flying to next
  - "Landing" animation: gentle deceleration as we approach target
- **Status:** Not started

### 1B. Fix Star Scaling/Opacity During UI Interaction ⏳
- **Problem:** Star becomes bigger/transparent when clicking buttons
- **Fix:** Lock star appearance when "arrived" state is active
  - Disable transition animations during button interaction
  - Only animate during approach/departure phases
- **Status:** Not started

### 1C. Improve Constellation Visibility on Mobile ⏳
- **Problem:** 15 constellation stars hard to distinguish from background
- **Fix:** 
  - Increase constellation star brightness (0.9+ opacity vs 0.3 for background)
  - Larger base size for constellation stars
  - Optional: subtle pulsing glow animation
- **Status:** Not started

---

## Phase 2: Convert to 3D Spheres
**Goal:** Transform flat disks into 3D celestial spheres

### 2A. Replace Geometry ⏳
- Change `circleGeometry` → `sphereGeometry`
- Keep texture mapping working
- Implement billboard behavior (face always points to camera)
- **Status:** Not started

### 2B. Add Atmospheric Effects ⏳
- Glowing halo around each sphere (shader or layered meshes)
- Subtle rotation animation when idle
- Depth-based fog/glow intensity
- **Status:** Not started

### 2C. Camera Behavior Enhancement ⏳
- **Takeoff sequence:**
  1. Camera pulls back from sphere (2-3 units)
  2. Rotates to face next target
  3. Accelerates toward next star
  
- **Landing sequence:**
  1. Decelerate as approaching
  2. Gentle arc to "orbit" then settle in front
  3. Final position: centered in HUD
- **Status:** Not started

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
