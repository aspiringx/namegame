import { useEffect, useRef, useCallback, MutableRefObject } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface SphericalCoords {
  radius: number
  theta: number
  phi: number
}

interface UseManualCameraProps {
  enabled: boolean
  journeyPhase: string
  cameraSpherical: MutableRefObject<SphericalCoords>
  autoPilotCameraTarget: MutableRefObject<THREE.Vector3>
}

export function useManualCamera({
  enabled,
  journeyPhase,
  cameraSpherical,
  autoPilotCameraTarget,
}: UseManualCameraProps) {
  const { camera, gl } = useThree()

  // Helper to check if in any returning phase
  const isReturningPhase = useCallback(
    () =>
      journeyPhase === 'returning' ||
      journeyPhase === 'returning-batch-complete' ||
      journeyPhase === 'returning-journey-complete',
    [journeyPhase],
  )

  // Drag state
  const isDragging = useRef(false)
  const previousMousePosition = useRef({ x: 0, y: 0 })
  const touchStartDistance = useRef(0)
  const initialPinchRadius = useRef(0)
  const manualModeJustInitialized = useRef(false)
  const hasLoggedManualInit = useRef(false)
  const manualFrameCount = useRef(0)

  // Set up event listeners for manual controls
  useEffect(() => {
    if (!enabled || !isReturningPhase()) {
      return
    }

    const canvas = gl.domElement
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0

    // Helper to get distance between two touch points
    const getTouchDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    if (isTouchDevice) {
      // Touch event handlers
      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          // Two fingers - pinch zoom
          e.preventDefault()
          touchStartDistance.current = getTouchDistance(e.touches)
          initialPinchRadius.current = cameraSpherical.current.radius
        } else if (e.touches.length === 1) {
          // Single finger - rotation
          e.preventDefault()
          isDragging.current = true
          previousMousePosition.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          }
        }
      }

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          // Pinch zoom
          e.preventDefault()
          const currentDistance = getTouchDistance(e.touches)
          const distanceChange = touchStartDistance.current - currentDistance
          const zoomSpeed = 0.5
          cameraSpherical.current.radius = Math.max(
            15,
            Math.min(
              150,
              initialPinchRadius.current + distanceChange * zoomSpeed,
            ),
          )
        } else if (e.touches.length === 1 && isDragging.current) {
          // Single finger rotation
          e.preventDefault()
          const deltaX = e.touches[0].clientX - previousMousePosition.current.x
          const deltaY = e.touches[0].clientY - previousMousePosition.current.y

          const rotationSpeed = 0.005
          cameraSpherical.current.theta -= deltaX * rotationSpeed
          cameraSpherical.current.phi += deltaY * rotationSpeed

          const minPhi = 0.1
          const maxPhi = Math.PI - 0.1
          cameraSpherical.current.phi = Math.max(
            minPhi,
            Math.min(maxPhi, cameraSpherical.current.phi),
          )

          previousMousePosition.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          }
        }
      }

      const handleTouchEnd = () => {
        isDragging.current = false
        touchStartDistance.current = 0
      }

      canvas.addEventListener('touchstart', handleTouchStart, {
        passive: false,
      })
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
      canvas.addEventListener('touchend', handleTouchEnd)
      canvas.addEventListener('touchcancel', handleTouchEnd)

      return () => {
        canvas.removeEventListener('touchstart', handleTouchStart)
        canvas.removeEventListener('touchmove', handleTouchMove)
        canvas.removeEventListener('touchend', handleTouchEnd)
        canvas.removeEventListener('touchcancel', handleTouchEnd)
      }
    } else {
      // Desktop mouse handlers
      const handlePointerDown = (e: PointerEvent) => {
        isDragging.current = true
        previousMousePosition.current = { x: e.clientX, y: e.clientY }
        canvas.style.cursor = 'grabbing'
      }

      const handlePointerMove = (e: PointerEvent) => {
        if (!isDragging.current) return

        const deltaX = e.clientX - previousMousePosition.current.x
        const deltaY = e.clientY - previousMousePosition.current.y

        const rotationSpeed = 0.005
        cameraSpherical.current.theta -= deltaX * rotationSpeed
        cameraSpherical.current.phi += deltaY * rotationSpeed

        const minPhi = 0.1
        const maxPhi = Math.PI - 0.1
        cameraSpherical.current.phi = Math.max(
          minPhi,
          Math.min(maxPhi, cameraSpherical.current.phi),
        )

        previousMousePosition.current = { x: e.clientX, y: e.clientY }
      }

      const handlePointerUp = () => {
        isDragging.current = false
        canvas.style.cursor = 'grab'
      }

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault()
        const zoomSpeed = 0.05
        cameraSpherical.current.radius += e.deltaY * zoomSpeed
        cameraSpherical.current.radius = Math.max(
          10,
          Math.min(100, cameraSpherical.current.radius),
        )
      }

      canvas.addEventListener('pointerdown', handlePointerDown)
      canvas.addEventListener('pointermove', handlePointerMove)
      canvas.addEventListener('pointerup', handlePointerUp)
      canvas.addEventListener('pointerleave', handlePointerUp)
      canvas.addEventListener('wheel', handleWheel, { passive: false })

      canvas.style.cursor = 'grab'

      return () => {
        canvas.removeEventListener('pointerdown', handlePointerDown)
        canvas.removeEventListener('pointermove', handlePointerMove)
        canvas.removeEventListener('pointerup', handlePointerUp)
        canvas.removeEventListener('pointerleave', handlePointerUp)
        canvas.removeEventListener('wheel', handleWheel)
        canvas.style.cursor = 'default'
      }
    }
  }, [enabled, gl.domElement, cameraSpherical, isReturningPhase])

  // Initialize manual mode when enabled
  useEffect(() => {
    if (enabled && isReturningPhase()) {
      manualModeJustInitialized.current = true
      hasLoggedManualInit.current = false
      manualFrameCount.current = 0
    }
  }, [enabled, cameraSpherical, autoPilotCameraTarget, isReturningPhase])

  // Update function to be called per-frame
  const updateCamera = () => {
    if (!enabled || !isReturningPhase()) return

    const { radius, theta, phi } = cameraSpherical.current
    const target = autoPilotCameraTarget.current

    // Convert spherical to Cartesian coordinates
    const targetX = target.x + radius * Math.sin(phi) * Math.sin(theta)
    const targetY = target.y + radius * Math.cos(phi)
    const targetZ = target.z + radius * Math.sin(phi) * Math.cos(theta)

    // First frame: set position directly
    if (manualModeJustInitialized.current) {
      camera.position.set(targetX, targetY, targetZ)
      camera.lookAt(target.x, target.y, target.z)
      manualModeJustInitialized.current = false
      manualFrameCount.current = 1
    } else {
      // Subsequent frames: smooth damping
      manualFrameCount.current++

      const dampingFactor = 0.08
      camera.position.x += (targetX - camera.position.x) * dampingFactor
      camera.position.y += (targetY - camera.position.y) * dampingFactor
      camera.position.z += (targetZ - camera.position.z) * dampingFactor

      camera.lookAt(target.x, target.y, target.z)
    }
  }

  return { updateCamera }
}
