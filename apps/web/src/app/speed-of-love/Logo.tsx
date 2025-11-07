import { useRef } from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'

interface LogoProps {
  url: string
  width: number
  height: number
  position: [number, number, number]
  opacity: number
}

export default function Logo({ url, width, height, position, opacity }: LogoProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Load the texture
  const texture = useLoader(THREE.TextureLoader, url)
  
  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={opacity}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
