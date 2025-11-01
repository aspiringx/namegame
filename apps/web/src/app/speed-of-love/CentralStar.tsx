import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface CentralStarProps {
  brightness?: number
  animationDuration?: number
  onProgressChange?: (opacity: number) => void
}

export default function CentralStar({
  brightness = 1.5,
  animationDuration = 2000,
  onProgressChange,
}: CentralStarProps) {
  const meshRef = useRef<THREE.Points>(null)
  const haloRef = useRef<THREE.Points>(null)
  const startTime = useRef(Date.now())
  const currentSize = useRef(0)
  const currentHaloSize = useRef(0)
  const currentOpacity = useRef(0)

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

  // Animate size and opacity for both core and halo
  useFrame(() => {
    if (!meshRef.current || !haloRef.current) return

    const elapsed = Date.now() - startTime.current
    const progress = Math.min(elapsed / animationDuration, 1)
    
    // Ease-out cubic for smooth growth
    const eased = 1 - Math.pow(1 - progress, 3)
    
    // Grow core from 0 to 24 (much larger and closer feeling)
    const targetSize = 24 * brightness
    currentSize.current = THREE.MathUtils.lerp(currentSize.current, targetSize * eased, 0.1)
    
    // Halo grows even larger and expands more slowly
    const targetHaloSize = 48 * brightness
    const haloEased = 1 - Math.pow(1 - progress, 2) // Slower ease for halo
    currentHaloSize.current = THREE.MathUtils.lerp(currentHaloSize.current, targetHaloSize * haloEased, 0.08)
    
    // Fade in opacity
    const targetOpacity = 1.0 * brightness
    currentOpacity.current = THREE.MathUtils.lerp(currentOpacity.current, targetOpacity * eased, 0.1)
    
    const material = meshRef.current.material as THREE.PointsMaterial
    material.size = currentSize.current
    material.opacity = currentOpacity.current
    
    const haloMaterial = haloRef.current.material as THREE.PointsMaterial
    haloMaterial.size = currentHaloSize.current
    haloMaterial.opacity = currentOpacity.current * 0.7 // Visible golden halo
    
    // Fade other stars as hero star appears (from 1.0 to 0.6)
    if (onProgressChange) {
      const otherStarsOpacity = 1.0 - (eased * 0.4) // Fade to 60%
      onProgressChange(otherStarsOpacity)
    }
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
