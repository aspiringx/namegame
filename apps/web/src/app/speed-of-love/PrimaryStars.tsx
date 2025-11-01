import { useMemo, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface PrimaryStarsProps {
  radius?: number
  count?: number
  size?: number
  opacity?: number
  onPositionsReady?: (positions: Float32Array) => void
}

export default function PrimaryStars({
  radius = 100,
  count = 15,
  size = 4.0,
  opacity = 1.0,
  onPositionsReady,
}: PrimaryStarsProps) {
  const { size: viewport } = useThree()

  // Responsive star count: 4 min, 15 max based on viewport width
  const responsiveCount = useMemo(() => {
    const ratio = viewport.width / 2560 // 2560 is max desktop width
    const calculated = Math.round(ratio * count)
    return Math.min(Math.max(calculated, 4), count)
  }, [viewport.width, count])

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(responsiveCount * 3)
    const cols = new Float32Array(responsiveCount * 3)
    const starSizes = new Float32Array(responsiveCount)

    // Calculate frustum bounds at the radius distance
    const aspect = viewport.width / viewport.height
    const fov = 50 // From scene default
    const vFOV = (fov * Math.PI) / 180
    const frustumHeight = 2 * Math.tan(vFOV / 2) * radius
    const frustumWidth = frustumHeight * aspect

    for (let i = 0; i < responsiveCount; i++) {
      // Distribute stars across full visible viewport
      pos[i * 3] = (Math.random() - 0.5) * frustumWidth // X: full width
      pos[i * 3 + 1] = (Math.random() - 0.5) * frustumHeight // Y: full height
      pos[i * 3 + 2] = (Math.random() - 0.5) * radius * 0.4 // Z: depth variation around z=0

      // Organic size variation (0.8x to 1.4x base size)
      const sizeMultiplier = 0.8 + Math.random() * 0.6
      starSizes[i] = sizeMultiplier

      // Brightness variation (70-100%)
      const brightness = 0.7 + Math.random() * 0.3

      // Color temperature variation
      const temp = Math.random()
      if (temp > 0.7) {
        // Warmer stars (30% chance) - yellowish
        cols[i * 3] = brightness * 1.0
        cols[i * 3 + 1] = brightness * 0.95
        cols[i * 3 + 2] = brightness * 0.85
      } else if (temp < 0.3) {
        // Cooler stars (30% chance) - blueish
        cols[i * 3] = brightness * 0.85
        cols[i * 3 + 1] = brightness * 0.95
        cols[i * 3 + 2] = brightness * 1.0
      } else {
        // Neutral white (40% chance)
        cols[i * 3] = brightness
        cols[i * 3 + 1] = brightness
        cols[i * 3 + 2] = brightness
      }
    }
    return { positions: pos, colors: cols, sizes: starSizes }
  }, []) // Empty deps - generate once and never change

  // Notify parent of star positions
  useEffect(() => {
    if (onPositionsReady) {
      onPositionsReady(positions)
    }
  }, [positions, onPositionsReady])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [positions, colors, sizes])

  // Create circular texture for stars with sharp gradient
  const starTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.7, 'rgba(255,255,255,1)') // Stay opaque until 70%
    gradient.addColorStop(0.9, 'rgba(255,255,255,0.6)') // Quick fade
    gradient.addColorStop(1, 'rgba(255,255,255,0)') // Transparent edge
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }, [])

  // Smooth opacity animation
  const currentOpacity = useRef(0)
  const targetOpacity = useRef(opacity)
  
  useEffect(() => {
    // Update target when prop changes
    targetOpacity.current = opacity
    // Initial fade in
    if (currentOpacity.current === 0) {
      setTimeout(() => {
        targetOpacity.current = opacity
      }, 100)
    }
  }, [opacity])

  // Custom shader material to enable per-star size variation
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          baseSize: { value: size },
          map: { value: starTexture },
          opacity: { value: 0 },
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float baseSize;
          
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = baseSize * size;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D map;
          uniform float opacity;
          varying vec3 vColor;
          
          void main() {
            vec4 texColor = texture2D(map, gl_PointCoord);
            gl_FragColor = vec4(vColor, 1.0) * texColor * opacity;
          }
        `,
        transparent: true,
        depthWrite: false,
      }),
    [size, starTexture]
  )

  // Smoothly animate opacity in shader
  useFrame(() => {
    // Lerp to target opacity
    currentOpacity.current = THREE.MathUtils.lerp(
      currentOpacity.current,
      targetOpacity.current,
      0.05
    )
    
    shaderMaterial.uniforms.opacity.value = currentOpacity.current
  })

  return <points geometry={geometry} material={shaderMaterial} />
}
