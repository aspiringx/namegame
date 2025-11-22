import * as THREE from 'three'
import { StarData } from '../types'

interface ViewportDimensions {
  width: number
  height: number
}

interface LayoutMeasurements {
  headerHeight: number
  navPanelHeight: number
}

interface SphericalPosition {
  radius: number // Distance from target
  theta: number // Horizontal angle (radians)
  phi: number // Vertical angle from Y axis (radians)
  target: THREE.Vector3 // Point to orbit around
}

/**
 * Calculates optimal camera position to center constellation in HUD
 */
export function useCameraPositioning() {
  const calculateConstellationBounds = (
    stars: Map<string, StarData>,
    starPositions: [number, number, number][],
  ) => {
    let minX = Infinity,
      maxX = -Infinity
    let minY = Infinity,
      maxY = -Infinity
    let minZ = Infinity,
      maxZ = -Infinity
    let placedStarCount = 0

    starPositions.forEach((pos, index) => {
      const starId = Array.from(stars.keys())[index]
      const starData = stars.get(starId)

      // Only include stars with constellation positions
      if (starData?.constellationPosition) {
        minX = Math.min(minX, pos[0])
        maxX = Math.max(maxX, pos[0])
        minY = Math.min(minY, pos[1])
        maxY = Math.max(maxY, pos[1])
        minZ = Math.min(minZ, pos[2])
        maxZ = Math.max(maxZ, pos[2])
        placedStarCount++
      }
    })

    if (placedStarCount === 0) {
      return null
    }

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const centerZ = (minZ + maxZ) / 2
    const width = maxX - minX
    const height = maxY - minY
    const depth = maxZ - minZ

    return {
      center: new THREE.Vector3(centerX, centerY, centerZ),
      dimensions: { width, height, depth },
      maxDimension: Math.max(width, height, depth),
      placedStarCount,
    }
  }

  const calculateHUDBounds = (
    viewportDimensions: ViewportDimensions,
    layoutMeasurements: LayoutMeasurements,
  ) => {
    const { width: viewportWidth, height: viewportHeight } = viewportDimensions
    const { headerHeight, navPanelHeight } = layoutMeasurements
    const isMobile = viewportWidth < 640

    // HUD dimensions
    const hudHeight = isMobile
      ? Math.min(300, viewportHeight * 0.35)
      : Math.min(600, viewportHeight * 0.5)

    // Calculate HUD position - centered between header and nav panel
    const availableSpace = viewportHeight - headerHeight - navPanelHeight
    const topPosition = headerHeight + (availableSpace - hudHeight) / 2

    // HUD center in screen space
    const hudCenterY = topPosition + hudHeight / 2
    const viewportCenterY = viewportHeight / 2
    const hudOffsetPx = hudCenterY - viewportCenterY
    const hudWidthPx = Math.min(900, viewportWidth * 0.8)

    return {
      hudHeight,
      hudWidthPx,
      hudOffsetPx,
      isMobile,
      viewportWidth,
      viewportHeight,
    }
  }

  const calculateSphericalForConstellation = (
    stars: Map<string, StarData>,
    starPositions: [number, number, number][],
    viewportDimensions: ViewportDimensions,
    layoutMeasurements: LayoutMeasurements,
  ): SphericalPosition | null => {
    const isMobile = viewportDimensions.width < 640
    const bounds = calculateConstellationBounds(stars, starPositions)
    if (!bounds) {
      // No stars placed yet - return default position
      return {
        radius: 25,
        theta: 0,
        phi: Math.PI / 2, // Looking straight ahead
        target: new THREE.Vector3(0, 0, 0),
      }
    }

    const hud = calculateHUDBounds(viewportDimensions, layoutMeasurements)
    const { dimensions, maxDimension } = bounds
    const { width, height, depth } = dimensions

    const fovRadians = (60 * Math.PI) / 180
    // targetFillPercent controls how much of the viewport to fill with the
    // constellation (0.5 = half, 1.0 = full). In other words, how much of the
    // HUD the constellation fills.
    const targetFillPercent = isMobile ? 1.15 : 1

    // First, calculate initial Z distance to fit constellation in viewport
    const aspectRatio = hud.viewportWidth / hud.viewportHeight
    const horizontalFov = 2 * Math.atan(Math.tan(fovRadians / 2) * aspectRatio)

    // Calculate world size at distance = 1
    const viewportHeightWorldAt1 = 2 * Math.tan(fovRadians / 2)
    const viewportWidthWorldAt1 = 2 * Math.tan(horizontalFov / 2)

    // HUD size as fraction of viewport
    const hudHeightFraction = hud.hudHeight / hud.viewportHeight
    const hudWidthFraction = hud.hudWidthPx / hud.viewportWidth

    // Distance needed to fit constellation in HUD
    const distanceForWidth =
      width / (viewportWidthWorldAt1 * hudWidthFraction * targetFillPercent)
    const distanceForHeight =
      height / (viewportHeightWorldAt1 * hudHeightFraction * targetFillPercent)

    const baseDistance = Math.max(
      distanceForWidth,
      distanceForHeight,
      depth * 2,
    )

    // Ensure minimum distance so stars show as photos
    const maxStarRadius = 10
    const minDistanceForPhotos = 20 + maxDimension / 2 + maxStarRadius

    // For single stars (maxDimension = 0), use a fixed comfortable viewing distance
    // Match the distance used for individual star arrivals (4.5-6.5)
    const singleStarDistance = isMobile ? 8 : 10
    const zDistance =
      bounds.placedStarCount === 1
        ? singleStarDistance
        : Math.max(baseDistance, minDistanceForPhotos)

    // Calculate Y offset to center constellation in HUD
    // When camera at (0, Y, Z) looks at (0, 0, 0), the origin projects to viewport center
    // To make origin appear at HUD center instead, offset camera Y by HUD's offset
    const worldHeightAtDistance = 2 * zDistance * Math.tan(fovRadians / 2)
    const pixelsToWorldUnits = worldHeightAtDistance / hud.viewportHeight

    // Apply the same visual correction to vertically center placed star
    // constellations in the HUD. A higher number (like -15) causes it to shift
    // up more in the HUD.
    // Related:
    // - adjustmentFactor for centering the cluster of primary stars that are
    //   not placed (Scene.tsx).
    // - visualCorrectionPx for centering individual star in HUD (Scene.tsx).
    // - viewDistance for the size of the star in the HUD (Scene.tsx).
    // - targetFillPercent for size of constellation in the HUD (in this file).
    const visualCorrectionPx = isMobile ? -15 : -20
    const yOffsetWorld =
      (-hud.hudOffsetPx + visualCorrectionPx) * pixelsToWorldUnits

    // Target is constellation's actual center point
    const target = bounds.center.clone()

    // Camera positioned relative to constellation center
    // Use target.x to account for horizontal offset of constellation
    const dx = target.x
    const dy = target.y + yOffsetWorld
    const dz = target.z + zDistance

    const radius = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const theta = Math.atan2(dx, dz) // 0 (looking down +Z axis)
    const phi = Math.acos(dy / radius) // Angle from +Y axis

    return { radius, theta, phi, target }
  }

  return {
    calculateSphericalForConstellation,
    calculateConstellationBounds,
    calculateHUDBounds,
  }
}
