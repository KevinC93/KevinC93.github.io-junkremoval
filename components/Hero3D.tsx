'use client'


import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Float } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'


function Knot() {
const ref = useRef<THREE.Mesh>(null!)
useFrame((state) => {
const t = state.clock.getElapsedTime()
if (ref.current) {
ref.current.rotation.x = t * 0.2
ref.current.rotation.y = t * 0.3
}
})
return (
<Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
<mesh ref={ref} castShadow>
<torusKnotGeometry args={[1.1, 0.35, 220, 32]} />
<meshPhysicalMaterial
metalness={0.8}
roughness={0.2}
color={'#0af'}
clearcoat={1}
clearcoatRoughness={0.1}
emissive={'#0af'}
emissiveIntensity={0.15}
/>
</mesh>
</Float>
)
}


export default function Hero3D() {
return (
<div className="absolute inset-0 -z-10">
<Canvas camera={{ position: [0, 0, 4], fov: 50 }} shadows>
<color attach="background" args={[0, 0, 0]} />
<ambientLight intensity={0.4} />
<directionalLight position={[3, 4, 5]} intensity={1.2} castShadow />
<Knot />
<OrbitControls enablePan={false} enableZoom={false} />
</Canvas>
{/* blue glow */}
<div className="absolute inset-0 bg-[radial-gradient(600px_300px_at_70%_30%,rgba(0,170,255,0.25),transparent_60%)]" />
</div>
)
}
