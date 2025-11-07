import { useRef, useState, useEffect } from 'react'
import { useTexture } from '@react-three/drei'

interface LogoProps {
  url: string
  width: number
  height: number
  position: [number, number, number]
  opacity: number
}

export default function Logo({ url, width, height, position, opacity }: LogoProps) {
  const meshRef = useRef(null)
  const [scale, setScale] = useState(1)
  
  // Load the texture with useTexture (better caching than useLoader)
  const texture = useTexture(url)
  
  // Responsive scaling based on viewport width
  useEffect(() => {
    const updateScale = () => {
      const viewportWidth = window.innerWidth
      if (viewportWidth < 640) {
        // Mobile: scale down to 40%
        setScale(0.4)
      } else if (viewportWidth < 1024) {
        // Tablet: scale down to 70%
        setScale(0.7)
      } else {
        // Desktop: full size
        setScale(1.0)
      }
    }
    
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])
  
  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={opacity}
        side={2}
      />
    </mesh>
  )
}
