# Three.js + Theatre.js Animation Concepts

## Overview

We're building a cinematic 3D animation sequence called "Speed of Love" using
Three.js for 3D rendering and Theatre.js for timeline-based animation
management.

**The Problem:** Managing complex animation sequences with manual timing
(setTimeout, lerp calculations) is error-prone and hard to debug. We can't
visually see what's happening when.

**The Solution:** Theatre.js provides a visual timeline editor that lets us:

- Scrub through animations frame-by-frame to debug issues
- Adjust timing visually without code changes
- Export timeline data as JSON for runtime playback
- Separate animation logic from rendering logic

## Architecture

### Current Setup (Pre-Theatre.js)

```
Scene.tsx
├── Manual timing with setTimeout()
├── useFrame() for lerp animations
├── React state for opacity/position
└── Conditional rendering based on scene type
```

### New Setup (With Theatre.js)

```
Scene.tsx
├── Theatre.js Project (container for all timelines)
├── Theatre.js Sheet (timeline for current scene)
├── Theatre.js Objects (animated properties)
└── useFrame() syncs Theatre.js time with Three.js
```

## Key Concepts

**Timeline Asset (Reusable):** Animation definition with tracks and clips. Can
be used across multiple scenes.

**Timeline Instance (Scene-Specific):** Binds a Timeline Asset to specific
components in a scene. Contains the "who" (which stars, which camera).

**Track:** A single property being animated over time (e.g., camera position,
star opacity).

**Clip:** A segment of animation on a track with start/end frames and easing.

**Binding:** Connection between a track and an actual Three.js object/component.

**Frame-Based Timing:** Using frames (1/60th second at 60fps) instead of
milliseconds. Frame 60 = 1 second, Frame 120 = 2 seconds.

## Implementation Plan

1. **Install Theatre.js** (✓ Complete)

   - `@theatre/core` - Runtime (production)
   - `@theatre/studio` - Visual editor (dev only)

2. **Set up Theatre.js in Scene.tsx** (✓ Complete)

   - Initialize project and sheet
   - Create Theatre.js objects for animated properties
   - Load studio in development mode only

3. **Refactor to config-driven architecture** (✓ Complete)

   - Created `speed-of-love-animation-config.json` with animation properties for all scenes
   - Created `theatreConfig.ts` to dynamically generate Theatre.js objects from config
   - Refactored `Scene.tsx` to use config helpers instead of hard-coded values
   - All animation durations, property ranges, and defaults now come from config
   - Theatre.js state (keyframes) loaded automatically from JSON

4. **Convert Scenes 1-3 to Theatre.js** (✓ Complete)

   - **Scene 1:** Stars fade in (starsOpacity: 0→1)
   - **Scene 2:** Hero star appears and grows (heroStarOpacity, heroStarScale: 0→1)
   - **Scene 3:** Primary stars brighten, constellation forms (primaryStarsOpacity: 0.3→1, constellationOpacity: 0→0.6)
   - All scenes auto-play on load
   - All scenes use config-driven approach

5. **Convert remaining scenes** (Scene 4, 5, 6, 7, 8, 9)

   - Apply same pattern to each scene
   - Build up complexity incrementally

## Configuration Files Overview

The Speed of Love animation uses three JSON configuration files, each with a specific purpose:

### 1. `speed-of-love-intro.json` - Scene Definitions
**Location:** `/apps/web/public/docs/scripts/speed-of-love-intro.json`

**Purpose:** Defines the high-level structure and content of each scene.

**Contains:**
- Scene metadata (description, narration, scene type)
- Camera settings (position, FOV)
- Visual elements (stars, colors, effects)
- Scene-specific configurations (twinkle effects, connection lines, etc.)

**Used by:** `StarField.tsx` to manage scene progression and pass scene data to components.

**Example:**
```json
{
  "scene": 1,
  "description": "Stars fade in slowly",
  "narration": "Your universe has billions of stars...",
  "cameraPosition": [0, 0, 150],
  "cameraFOV": 50,
  "primaryStars": { "count": 15, "radius": 100 }
}
```

### 2. `speed-of-love-animation-config.json` - Animation Properties
**Location:** `/apps/web/public/docs/scripts/speed-of-love-animation-config.json`

**Purpose:** Defines Theatre.js animation properties, types, ranges, and defaults for each scene.

**Contains:**
- Animation duration for each scene
- Property definitions (opacity, scale, position, etc.)
- Property types and value ranges
- Default/initial values

**Used by:** `theatreConfig.ts` to dynamically create Theatre.js objects and sheets.

**Example:**
```json
{
  "scene": 1,
  "animation": {
    "duration": 2.0,
    "properties": {
      "starsOpacity": {
        "type": "number",
        "range": [0, 1],
        "default": 0
      }
    }
  }
}
```

**Why separate from scene definitions?** This file focuses purely on animation mechanics, while `speed-of-love-intro.json` focuses on scene content. This separation allows animation properties to be modified without touching scene structure.

### 3. `speed-of-love-theatre-state.json` - Keyframe Data
**Location:** `/apps/web/public/docs/scripts/speed-of-love-theatre-state.json`

**Purpose:** Stores Theatre.js keyframes and timeline data created in the visual editor.

**Contains:**
- Keyframe positions (time in seconds)
- Keyframe values (property values at specific times)
- Easing curves (Bezier handles)
- Static overrides (initial values)

**Generated by:** Theatre.js Studio (exported via `exportTheatreState()` in browser console)

**Used by:** `theatreConfig.ts` loads this when creating the Theatre.js project.

**Example:**
```json
{
  "sheetsById": {
    "Scene 1": {
      "staticOverrides": { "byObject": { "Scene 1 Animation": { "starsOpacity": 0 } } },
      "sequence": {
        "tracksByObject": {
          "Scene 1 Animation": {
            "trackData": {
              "keyframes": [
                { "position": 0, "value": 0 },
                { "position": 2, "value": 1 }
              ]
            }
          }
        }
      }
    }
  }
}
```

## File Relationships

```
speed-of-love-intro.json (scene content)
         ↓
    StarField.tsx (scene management)
         ↓
    Scene.tsx (rendering)
         ↓
speed-of-love-animation-config.json (animation properties)
         ↓
    theatreConfig.ts (Theatre.js setup)
         ↓
speed-of-love-theatre-state.json (keyframes)
         ↓
    Theatre.js (animation playback)
```

## Theatre.js State File Structure (Detailed)

### File Location
```
/apps/web/public/docs/scripts/speed-of-love-theatre-state.json
```

### Structure Overview
```json
{
  "sheetsById": {
    "Scene 1": { /* Sheet for Scene 1 */ },
    "Scene 2": { /* Sheet for Scene 2 */ },
    // ... one sheet per scene
  }
}
```

### Sheet Structure
Each sheet contains:

**`staticOverrides.byObject`** - Initial/default values for properties
```json
"byObject": {
  "Scene 1 Animation": {
    "starsOpacity": 0  // Starting value
  }
}
```

**`sequence`** - Timeline and keyframe data
- `subUnitsPerUnit`: Time subdivision (30 = 30 frames per second in the editor)
- `length`: Total duration in seconds
- `type`: "PositionalSequence" (time-based animation)
- `tracksByObject`: Keyframe data for each animated object

**`trackData`** - Individual property animations
```json
"trackData": {
  "ASnwz1b_90": {  // Internal ID
    "type": "BasicKeyframedTrack",
    "__debugName": "Scene 1 Animation:[\"starsOpacity\"]",
    "keyframes": [
      {
        "id": "K7wzPwT63h",
        "position": 0,      // Time in seconds
        "value": 0,         // Property value at this time
        "handles": [...]    // Bezier curve handles for easing
      },
      {
        "position": 2,
        "value": 1
      }
    ]
  }
}
```

### Key Terms

**sheetsById** - Map of all sheets (scenes) in the project. Key = sheet name.

**staticOverrides** - Default/initial values before animation starts.

**sequence** - The timeline containing all keyframes and playback settings.

**tracksByObject** - Groups tracks by the Theatre.js object they animate.

**trackData** - Individual property animations with keyframes.

**keyframes** - Specific values at specific times. Theatre.js interpolates between them.

**handles** - Bezier curve control points defining easing between keyframes.

**position** - Time in seconds where a keyframe occurs.

**value** - The property value at that keyframe.

### Workflow

1. **Create keyframes in Studio** - Drag playhead, set values, click diamond icon
2. **Export state** - Run `exportTheatreState()` in console
3. **Save to file** - Move downloaded JSON to `/public/docs/scripts/`
4. **Load in code** - Import and pass to `getProject('Name', { state: theatreState })`
5. **Repeat** - As you add scenes, re-export to update the file

### Important Notes

- **One file for all scenes** - All sheets live in the same state file
- **Manual export required** - Changes in Studio don't auto-save to the file
- **Production uses this file** - No Studio UI in production, just loads the JSON
- **Version control friendly** - JSON format works well with git

## Handling Multi-Phase Scenes (e.g., Scene 4)

Some scenes have multiple phases (Scene 4 has 5: fade, travel, arrive, pause, form). Theatre.js handles this within a **single sheet** using one continuous timeline.

### Approach: Single Timeline with Time Ranges

**One sheet = one scene**, regardless of complexity. Phases are just different time segments on the same timeline.

**Example: Scene 4 (10 seconds total)**
```
Scene 4 Sheet Timeline:
├─ 0.0-1.5s: Phase 1 - Fade out old constellation
├─ 1.5-7.5s: Phase 2 - Camera travels to new location
├─ 7.5-8.5s: Phase 3 - Arrival pause
└─ 8.5-10.0s: Phase 4 - New constellation fades in
```

**In code:**
```javascript
// Play the entire scene (all phases)
scene4Sheet.sequence.play({ range: [0, 10] })

// Or play specific phases if needed
scene4Sheet.sequence.play({ range: [1.5, 7.5] }) // Just the travel phase
```

### Why Not Separate Sheets Per Phase?

❌ **Don't do this:**
```
Scene 4 Phase 1 (separate sheet)
Scene 4 Phase 2 (separate sheet)
Scene 4 Phase 3 (separate sheet)
```

✅ **Do this:**
```
Scene 4 (one sheet with all phases on one timeline)
```

**Reasons:**
- **Visual continuity** - See the entire scene flow in one timeline view
- **Easier timing** - Drag keyframes to adjust when phases transition
- **Better debugging** - Scrub through the whole scene to find issues
- **Simpler code** - One `play()` call instead of coordinating multiple sequences
- **Natural overlaps** - Phases can overlap (e.g., new stars start fading in before old ones finish fading out)

### Theatre.js Terminology Clarification

**Important:** In Theatre.js, "sequence" has two meanings:

1. **`sheet.sequence`** - The playback controller for a sheet's timeline (singular)
   - Every sheet has ONE sequence
   - You call `.play()`, `.pause()`, `.position` on it
   
2. **"Sequence" (concept)** - A series of animations over time
   - This is what we mean when we say "animation sequence"
   - Not a separate Theatre.js object, just the timeline itself

**Our terminology:**
- **Scene** = One Theatre.js sheet
- **Phase** = A time range within a scene's timeline
- **Sheet** = Container for one scene's timeline and objects
- **Sequence** = The playback controller (`sheet.sequence`)

## Resources

- [Theatre.js Documentation](https://www.theatrejs.com/docs/latest/getting-started)
- [Theatre.js + React Three Fiber](https://www.theatrejs.com/docs/latest/manual/react-three-fiber)
- [Unity Timeline Concepts](https://docs.unity3d.com/Packages/com.unity.timeline@1.7/manual/index.html) -
  Visual reference for timeline concepts
- [Three.js Animation System](https://discoverthreejs.com/book/first-steps/animation-system/)
- [Universal Scene Description (USD)](https://openusd.org/docs/api/_usd__overview_and_purpose.html)

---

## Glossary

### Three.js Technical Terms

**Mesh** - A 3D object combining geometry (shape) and material (appearance). Our
stars are meshes.

**Geometry** - The shape/structure of a 3D object (vertices, faces). We use
`SphereGeometry` for stars.

**Material** - Defines how a surface looks (color, shininess, transparency). We
use `MeshStandardMaterial`.

**Scene** - Container holding all 3D objects, lights, and cameras. The root of
the 3D world.

**Camera** - Defines the viewpoint. We use `PerspectiveCamera` (mimics human eye
perspective).

**FOV (Field of View)** - Camera's viewing angle in degrees. Higher = wider
view, lower = zoomed in. We use 50-60°.

**Vector3** - A 3D coordinate `[x, y, z]`. Used for position, rotation, scale.

**Position** - Location in 3D space. `[0, 0, 0]` is the origin/center.

**Lerp (Linear Interpolation)** - Smoothly transitioning between two values.
`lerp(0, 100, 0.5) = 50`.

**useFrame** - React Three Fiber hook that runs every frame (~60 times/second).
Used for animations.

**Group** - Container for multiple objects that move together. Our hero star is
in a group.

**Opacity** - Transparency level. 0 = invisible, 1 = fully visible.

**Ref** - React reference to access a component's underlying object directly.

### Animation Concepts

**Animation** - The process of changing properties over time to create the
illusion of movement. In Three.js, this means updating object positions,
rotations, scales, colors, or other properties each frame.

**Render** - The process of converting 3D scene data (meshes, lights, camera)
into a 2D image displayed on screen. Three.js renders ~60 times per second
(60fps) to create smooth motion.

**Timeline** - Visual representation of animation over time, with multiple
tracks running in parallel.

**Track** - A single property being animated (e.g., camera position track,
opacity track).

**Clip** - A segment of animation on a track with defined start/end times.

**Keyframe** - A specific value at a specific time. Animation interpolates
between keyframes.

**Easing** - How animation accelerates/decelerates. Linear = constant speed,
easeInOut = slow start/end.

- [Easing Functions Reference](https://easings.net/)

**Frame** - Single image in animation sequence. At 60fps, 1 frame = 1/60th
second.

**FPS (Frames Per Second)** - Animation speed. 60fps = 60 frames shown per
second (standard for web).

**Duration** - How long an animation lasts, measured in frames or milliseconds.

**Sequence** - Series of animations that play one after another or overlap.

**Phase** - A distinct stage within a scene (e.g., Scene 4 has 5 phases: fade,
travel, arrive, pause, form).

### Theatre.js Specific

**Project** - Top-level container for all Theatre.js timelines in your app.

**Sheet** - A single timeline within a project. Each scene typically has one
sheet.

**Theatre Object** - A set of properties that Theatre.js can animate (position,
opacity, etc.).

**Studio** - Theatre.js visual editor UI (dev only). Provides timeline scrubbing
and keyframe editing.

**Playhead** - The blue vertical line in the timeline showing current time
position. Drag it left/right to preview animation at any point (this action is
called "scrubbing").

**Scrubbing** - Dragging the playhead left/right along the timeline to manually
preview the animation. Lets you see exactly what's happening at any moment
without playing the full sequence.

**Sequence (Theatre.js)** - Theatre.js API for programmatic animation control.
Can play, pause, or control timeline playback programmatically.

### Unity Timeline Terms (Reference)

**Timeline Asset** - Reusable animation definition (like a recipe).

**Timeline Instance** - Specific use of a Timeline Asset in a scene (like
cooking that recipe).

**Playable Director** - Unity component that plays Timeline Assets (similar to
Theatre.js sheet.sequence).

**Binding** - Connection between a track and a specific GameObject/Component.

**Activation Track** - Track that shows/hides objects at specific times.

### Film Production Terms

**Script Breakdown** - Scene-by-scene analysis identifying all required elements
(cast, props, effects).

**Dope Sheet / Exposure Sheet** - Frame-by-frame animation planning document
from traditional animation.

- [Exposure Sheet Explanation](https://en.wikipedia.org/wiki/Exposure_sheet)

**Scene** - A continuous sequence in one location/time. Our animation has 9
scenes.

**Shot** - A single camera angle/position. We mostly use one continuous shot per
scene.

**Narration** - Voice-over text that accompanies the visuals.

### React Three Fiber

**Canvas** - Root component that creates the Three.js renderer and scene.

**Fiber** - React renderer for Three.js. Lets us use Three.js with React
components.

**Drei** - Helper library for common Three.js patterns (cameras, controls,
etc.).

### Performance Terms

**Bundle Size** - Total JavaScript file size sent to browser. Smaller = faster
load.

**Tree Shaking** - Removing unused code from production bundle.

**Lazy Loading** - Loading code only when needed (e.g., studio only in dev
mode).

**Frame Rate** - How many frames rendered per second. 60fps = smooth, <30fps =
choppy.
