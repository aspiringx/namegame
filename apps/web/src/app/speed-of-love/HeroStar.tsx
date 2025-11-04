import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface HeroStarProps {
  brightness?: number
  opacity: number // Theatre.js controlled opacity
  scale: number // Theatre.js controlled scale
}

export default function HeroStar({
  brightness = 1.5,
  opacity,
  scale,
}: HeroStarProps) {
  const meshRef = useRef<THREE.Points>(null)
  const haloRef = useRef<THREE.Points>(null)

  // Create golden/white gradient texture for the star core
  const starTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!

    // Create radial gradient with golden glow
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)') // Bright white center
    gradient.addColorStop(0.2, 'rgba(255, 250, 220, 1)') // Bright golden
    gradient.addColorStop(0.5, 'rgba(255, 230, 180, 0.9)') // Warm glow
    gradient.addColorStop(0.8, 'rgba(255, 200, 120, 0.4)') // Outer glow
    gradient.addColorStop(1, 'rgba(255, 180, 80, 0)') // Fade to transparent

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)

    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }, [])

  // Create expanding halo texture
  const haloTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    // Create large radial gradient for halo - brighter colors
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
    gradient.addColorStop(0, 'rgba(255, 250, 220, 0.8)')
    gradient.addColorStop(0.3, 'rgba(255, 240, 200, 0.6)')
    gradient.addColorStop(0.6, 'rgba(255, 220, 150, 0.3)')
    gradient.addColorStop(1, 'rgba(255, 200, 100, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 256, 256)

    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }, [])

  // Create geometry with single point at center
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array([0, 0, 0])
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  // Apply Theatre.js controlled size and opacity
  useFrame(() => {
    if (!meshRef.current || !haloRef.current) return

    const baseSize = 24 * brightness
    const baseHaloSize = 48 * brightness

    const material = meshRef.current.material as THREE.PointsMaterial
    material.size = baseSize * scale
    material.opacity = opacity * brightness

    const haloMaterial = haloRef.current.material as THREE.PointsMaterial
    haloMaterial.size = baseHaloSize * scale
    haloMaterial.opacity = opacity * brightness * 0.7
  })

  return (
    <group>
      {/* Expanding halo behind the star */}
      <points ref={haloRef} geometry={geometry} renderOrder={999}>
        <pointsMaterial
          size={0}
          map={haloTexture}
          transparent
          opacity={0}
          sizeAttenuation={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Bright core star */}
      <points ref={meshRef} geometry={geometry} renderOrder={1000}>
        <pointsMaterial
          size={0}
          map={starTexture}
          transparent
          opacity={0}
          sizeAttenuation={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
