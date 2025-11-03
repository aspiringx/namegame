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

3. **Convert Scene 1 to Theatre.js** (✓ In Progress)

   - Created `scene1Animation` object with `starsOpacity` property
   - Added `useFrame` hook to read Theatre.js values
   - Connected opacity to PrimaryStars and BackgroundStars components
   - Fixed: Moved sheet/object creation outside component to prevent re-creation errors
   - **Next:** Create keyframes in Studio to animate the fade-in
   
   **Note:** Currently hardcoding Theatre.js config in Scene.tsx for learning. Will refactor to load from JSON config file once we understand the flow.

4. **Test Scene 1**

   - Use scrubbing to preview the fade-in animation
   - Adjust timing visually in Studio
   - Export JSON for production

5. **Convert remaining scenes** (Scene 2, 3, 4, etc.)

   - Apply same pattern to each scene
   - Build up complexity incrementally

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
