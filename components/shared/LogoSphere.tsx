'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

function SphereMesh() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12
    }
  })

  return (
    <group ref={groupRef}>
      {/* Solid dark core */}
      <mesh>
        <sphereGeometry args={[1.3, 128, 128]} />
        <meshStandardMaterial
          color="#050510"
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[1.32, 48, 48]} />
        <meshBasicMaterial
          color="#ffffff"
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[1.28, 32, 32]} />
        <meshBasicMaterial
          color="#2a3a5f"
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Particle dots */}
      <ParticleDots />
    </group>
  )
}

function ParticleDots() {
  const points = useMemo(() => {
    const pts: [number, number, number][] = []
    const count = 120
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 1.34
      pts.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ])
    }
    return pts
  }, [])

  return (
    <>
      {points.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </>
  )
}

export function LogoSphere() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.5} />

        <pointLight position={[4, 3, 4]} intensity={2} color="#4a6ba0" />
        <pointLight position={[-4, -2, 3]} intensity={1} color="#1a2540" />
        <pointLight position={[0, 5, 0]} intensity={0.6} color="#ffffff" />

        <SphereMesh />

        {/* FULL 360° rotation on all axes */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          rotateSpeed={0.8}
          enableDamping
          dampingFactor={0.1}
        />
      </Canvas>
    </div>
  )
}