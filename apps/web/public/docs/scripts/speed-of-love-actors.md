# Speed of Love Play

A threejs animation is like a play. Our stage, actors, and props interact across
scenes to tell a story.

This document is our Ubiquitous Language dictionary, precisely defining elements
with names, properties, and behaviors. Our code should mirror this to be clear.

## 3D Space

The space in which everything exists. It has boundaries. Elements in it have
positions (X, Y, and Z coordinates). They can move and rotate.

## Stage

The portion of 3D space that the user sees on a device viewport. Play elements
may be "on stage" or "off stage" at any time.

The stage is a fixed size, 100% of the _visible_ viewport width and height. The
reported viewport can be larger than the _visible_ viewport. e.g. We depend on
units like `dvh` to measure the _visible_ viewport height.

I'm confused about our StarField.

- It has a Canvas that appears to fill the viewport dimensions in 2D space.
- It contains our Scene component which has some constant elements, like
  BackgroundStars, and other elements that change over time based on the state
  of the current scene, like PrimaryStars, CentralStar, and ConstellationLines,
  and HeroConstellationLines.

### Example: PrimaryStars

Here, we generate a number of stars responsive to the viewport size. The initial
ones are positioned in the viewport. As the CentralStar appears to travel away
from the first constellation, it should move toward this new set of
PrimaryStars.

This has been our current problem:

1. First primary stars look good
2. We move away from them, but the new PrimaryStars don't enter the camera's
   view as we approach them.

### Camera and Perception

The camera is the point of view from which the user perceives the stage. The
visual perception of size and position is determined by the camera's position
(it's X, Y, and Z coordinates), orientation (where it's pointing), zoom level,
field of view (fov), etc.

Like any element in 3D space, the camera can move and rotate.

When creating the perception of animation, you must be clear about what's
moving. Are you moving an element? Are you moving the camera? Are you moving
both?

## Scenes

A scene adds the element of _time_ to the play. It orchestrates the behaviors of
elements and/or the camera to tell the story the someone can perceive.

Our scenes are defined in [speed-of-love-intro.json](speed-of-love-intro.json).

Each has a narration (the text that appears on screen), description (intended
visual perception of the stage during the narration), and other properties that
dictate what happens on the stage for a period of time.

### Actors

These are the elements that populate the stage.

- StarField: the 3D space upon which all stars are positioned.

## List of Actors

- Camera
- StarField: The background of stars that fill the viewport
- HeroStar: The central star that represents the authenticated user.
- BackgroundStars: Smaller stars of varying brightness and size that fill the
  background. Some twinkle.

- PrimaryStars: Larger stars from which we make constellations
- Constellation: A group of primary stars that form a pattern, usually together
  with the HeroStar
- ConnectionLines: Lines that connect stars in a constellation
- CentralStar
- BackgroundStars
- TwinkleEffect
- OrbitChange
- RippleEffect
- DimStar
- LovePulse
- ConstellationReform
- LogoReveal

## Scene 1 – cosmicView
