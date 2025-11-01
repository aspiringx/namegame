import { useRef, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

export default function HUD3D() {
  const { camera, size } = useThree()
  const hudRef = useRef<THREE.Group>(null)

  // Calculate initial yOffset immediately to prevent jump
  const calculateYOffset = () => {
    const header = document.querySelector('h1')?.parentElement
    const headerRect = header?.getBoundingClientRect()
    const headerBottom = headerRect ? headerRect.bottom : 0

    const navPanel = document.getElementById('nav-panel')
    const navPanelRect = navPanel?.getBoundingClientRect()
    const navPanelTop = navPanelRect ? navPanelRect.top : size.height

    const availableSpace = navPanelTop - headerBottom
    const centerY = headerBottom + availableSpace / 2
    const viewportCenterY = size.height / 2
    const offsetPx = centerY - viewportCenterY

    const fovRadians = (60 * Math.PI) / 180
    const distance = 15
    const worldHeightAtDistance = 2 * distance * Math.tan(fovRadians / 2)
    const pixelsToWorldUnits = worldHeightAtDistance / size.height
    return -offsetPx * pixelsToWorldUnits
  }

  const [yOffset, setYOffset] = useState(calculateYOffset)
  const currentYOffset = useRef(yOffset)
  const initialNavPanelTop = useRef<number | null>(null)

  // Measure DOM elements to find vertical center between header and nav panel
  useEffect(() => {
    const measureVerticalCenter = () => {
      const header = document.querySelector('h1')?.parentElement
      const headerRect = header?.getBoundingClientRect()
      const headerBottom = headerRect ? headerRect.bottom : 0

      const navPanel = document.getElementById('nav-panel')
      const navPanelRect = navPanel?.getBoundingClientRect()
      const currentNavPanelTop = navPanelRect ? navPanelRect.top : size.height

      // Lock to initial nav panel position to prevent jumping when content changes
      if (initialNavPanelTop.current === null && navPanelRect) {
        initialNavPanelTop.current = currentNavPanelTop
      }
      const navPanelTop = initialNavPanelTop.current ?? currentNavPanelTop

      // Calculate center of available space
      const availableSpace = navPanelTop - headerBottom
      const centerY = headerBottom + availableSpace / 2
      const viewportCenterY = size.height / 2
      const offsetPx = centerY - viewportCenterY

      // Convert to world units
      // Screen Y increases downward, World Y increases upward
      // If center is ABOVE viewport center (negative offsetPx), move HUD UP (positive world Y)
      const fovRadians = (60 * Math.PI) / 180
      const distance = 15
      const worldHeightAtDistance = 2 * distance * Math.tan(fovRadians / 2)
      const pixelsToWorldUnits = worldHeightAtDistance / size.height
      const worldOffset = -offsetPx * pixelsToWorldUnits // Negate to invert Y axis

      setYOffset(worldOffset)
    }

    // Measure immediately and on resize only
    measureVerticalCenter()
    window.addEventListener('resize', measureVerticalCenter)

    return () => {
      window.removeEventListener('resize', measureVerticalCenter)
    }
  }, [size.height])

  // HUD stays fixed relative to camera with smooth vertical offset transitions
  useFrame(() => {
    if (hudRef.current) {
      // Smoothly interpolate to target Y offset
      currentYOffset.current += (yOffset - currentYOffset.current) * 0.05

      // Position HUD in front of camera
      hudRef.current.position.copy(camera.position)
      hudRef.current.quaternion.copy(camera.quaternion)
      hudRef.current.translateZ(-15) // 15 units in front of camera
      hudRef.current.translateY(currentYOffset.current) // Adjust vertical position smoothly
    }
  })

  // HUD dimensions - simple fixed sizes that work across devices
  const isMobile = size.width < 640

  // Use simple, tested dimensions
  // These are sized to fit nicely within the viewport at distance 15
  const hudWidth = isMobile ? 6 : 10
  const hudHeight = isMobile ? 8 : 7
  const cornerSize = isMobile ? 0.5 : 0.6
  const cornerThickness = isMobile ? 0.07 : 0.08

  const hudColor = '#00ff88'

  return (
    <group ref={hudRef}>
      {/* Top-left corner */}
      <group position={[-hudWidth / 2, hudHeight / 2, 0]}>
        <mesh position={[cornerSize / 2, 0, 0]}>
          <boxGeometry args={[cornerSize, cornerThickness, 0.01]} />
          <meshBasicMaterial color={hudColor} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, -cornerSize / 2, 0]}>
          <boxGeometry args={[cornerThickness, cornerSize, 0.01]} />
          <meshBasicMaterial color={hudColor} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Top-right corner */}
      <group position={[hudWidth / 2, hudHeight / 2, 0]}>
        <mesh position={[-cornerSize / 2, 0, 0]}>
          <boxGeometry args={[cornerSize, cornerThickness, 0.01]} />
          <meshBasicMaterial color={hudColor} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, -cornerSize / 2, 0]}>
          <boxGeometry args={[cornerThickness, cornerSize, 0.01]} />
          <meshBasicMaterial color={hudColor} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Bottom-left corner */}
      <group position={[-hudWidth / 2, -hudHeight / 2, 0]}>
        <mesh position={[cornerSize / 2, 0, 0]}>
          <boxGeometry args={[cornerSize, cornerThickness, 0.01]} />
          <meshBasicMaterial color={hudColor} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, cornerSize / 2, 0]}>
          <boxGeometry args={[cornerThickness, cornerSize, 0.01]} />
          <meshBasicMaterial color={hudColor} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Bottom-right corner */}
      <group position={[hudWidth / 2, -hudHeight / 2, 0]}>
        <mesh position={[-cornerSize / 2, 0, 0]}>
          <boxGeometry args={[cornerSize, cornerThickness, 0.01]} />
          <meshBasicMaterial color={hudColor} transparent opacity={0.8} />
        </mesh>
        <mesh position={[0, cornerSize / 2, 0]}>
          <boxGeometry args={[cornerThickness, cornerSize, 0.01]} />
          <meshBasicMaterial color={hudColor} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* Center crosshair */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.01]} />
        <meshBasicMaterial color={hudColor} transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.02, 0.3, 0.01]} />
        <meshBasicMaterial color={hudColor} transparent opacity={0.3} />
      </mesh>
    </group>
  )
}
