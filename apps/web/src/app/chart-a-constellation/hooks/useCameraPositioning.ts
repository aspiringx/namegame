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

interface CameraPosition {
  position: THREE.Vector3
  lookAt: THREE.Vector3
  constellationCenter: THREE.Vector3
  geometricCenter: THREE.Vector3
  yOffsetWorld: number  // Y offset to translate constellation for HUD centering
}

/**
 * Calculates optimal camera position to center constellation in HUD
 */
export function useCameraPositioning() {
  const calculateConstellationBounds = (
    stars: Map<string, StarData>,
    starPositions: [number, number, number][]
  ) => {
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    let minZ = Infinity, maxZ = -Infinity
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
      placedStarCount
    }
  }

  const calculateHUDBounds = (
    viewportDimensions: ViewportDimensions,
    layoutMeasurements: LayoutMeasurements
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
      viewportHeight
    }
  }

  const positionCameraForConstellation = (
    stars: Map<string, StarData>,
    starPositions: [number, number, number][],
    viewportDimensions: ViewportDimensions,
    layoutMeasurements: LayoutMeasurements
  ): CameraPosition | null => {
    const bounds = calculateConstellationBounds(stars, starPositions)
    if (!bounds) {
      // No stars placed yet - return default position
      return {
        position: new THREE.Vector3(0, 0, 25),
        lookAt: new THREE.Vector3(0, 0, 0),
        constellationCenter: new THREE.Vector3(0, 0, 0),
        geometricCenter: new THREE.Vector3(0, 0, 0),
        yOffsetWorld: 0
      }
    }

    const hud = calculateHUDBounds(viewportDimensions, layoutMeasurements)
    const { center, dimensions, maxDimension } = bounds
    const { width, height, depth } = dimensions

    console.log('🔍 HUD Calculation:', {
      viewportHeight: viewportDimensions.height,
      headerHeight: layoutMeasurements.headerHeight,
      navPanelHeight: layoutMeasurements.navPanelHeight,
      availableSpace: viewportDimensions.height - layoutMeasurements.headerHeight - layoutMeasurements.navPanelHeight,
      hudHeight: hud.hudHeight,
      hudOffsetPx: hud.hudOffsetPx
    })

    const fovRadians = (60 * Math.PI) / 180
    const targetFillPercent = 0.75  // Reduced to ensure stars fit with margin

    // Calculate distance to fit constellation within HUD bounds
    // Use HUD dimensions, not viewport dimensions
    const aspectRatio = hud.viewportWidth / hud.viewportHeight
    const horizontalFov = 2 * Math.atan(Math.tan(fovRadians / 2) * aspectRatio)

    // Distance needed to fit width within HUD width
    const hudWidthWorld = hud.hudWidthPx / hud.viewportWidth * 2 * Math.tan(horizontalFov / 2)
    const distanceForWidth = (width / (hudWidthWorld * targetFillPercent))

    // Distance needed to fit height within HUD height  
    const hudHeightWorld = hud.hudHeight / hud.viewportHeight * 2 * Math.tan(fovRadians / 2)
    const distanceForHeight = (height / (hudHeightWorld * targetFillPercent))

    const baseDistance = Math.max(distanceForWidth, distanceForHeight, depth * 2)

    // Ensure minimum distance so stars show as photos
    const maxStarRadius = 10
    const minDistanceForPhotos = 20 + maxDimension / 2 + maxStarRadius
    const zDistance = Math.max(baseDistance, minDistanceForPhotos)

    // Calculate Y offset for HUD centering
    const worldHeightAtDistance = 2 * zDistance * Math.tan(fovRadians / 2)
    const pixelsToWorldUnits = worldHeightAtDistance / hud.viewportHeight
    const yOffsetWorld = hud.hudOffsetPx * pixelsToWorldUnits

    // Apply Y offset to camera and lookAt (constellation stays at origin)
    const cameraX = 0
    const cameraY = yOffsetWorld  // Move camera to account for HUD offset
    const cameraZ = zDistance

    const lookAtX = 0
    const lookAtY = yOffsetWorld  // Look at same Y as camera to keep constellation centered
    const lookAtZ = 0

    return {
      position: new THREE.Vector3(cameraX, cameraY, cameraZ),
      lookAt: new THREE.Vector3(lookAtX, lookAtY, lookAtZ),
      constellationCenter: new THREE.Vector3(0, 0, 0),
      geometricCenter: new THREE.Vector3(0, 0, 0),
      yOffsetWorld  // Return for logging purposes
    }
  }

  return {
    positionCameraForConstellation,
    calculateConstellationBounds,
    calculateHUDBounds
  }
}
