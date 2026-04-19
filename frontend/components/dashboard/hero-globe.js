"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Stars } from "@react-three/drei";

function PulseSphere() {
  const globeRef = useRef(null);
  const ringRef = useRef(null);
  const shardRef = useRef(null);

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.14;
      globeRef.current.rotation.x = Math.sin(Date.now() * 0.00028) * 0.1;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.34;
      ringRef.current.rotation.x += delta * 0.08;
    }

    if (shardRef.current) {
      shardRef.current.rotation.x -= delta * 0.2;
      shardRef.current.rotation.z += delta * 0.2;
    }
  });

  return (
    <Float speed={2.1} rotationIntensity={0.55} floatIntensity={1.2}>
      <group>
        <mesh ref={globeRef}>
          <sphereGeometry args={[1.32, 64, 64]} />
          <meshStandardMaterial
            color="#0f172a"
            emissive="#0d9488"
            emissiveIntensity={0.52}
            metalness={0.25}
            roughness={0.42}
            wireframe
          />
        </mesh>

        <mesh ref={ringRef} rotation={[1.2, 0.3, 0]}>
          <torusGeometry args={[1.9, 0.018, 16, 180]} />
          <meshStandardMaterial color="#fb7185" emissive="#fb7185" emissiveIntensity={1.1} />
        </mesh>

        <mesh ref={shardRef} position={[1.1, -0.75, -0.25]}>
          <octahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.7} />
        </mesh>
      </group>
    </Float>
  );
}

export function HeroGlobe() {
  return (
    <div className="relative h-full min-h-[340px] overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_center,_rgba(45,212,191,0.12),_transparent_48%)]">
      <div className="absolute left-4 top-4 z-10 max-w-[250px] rounded-3xl border border-line/20 bg-surface/75 p-4 backdrop-blur">
        <p className="eyebrow">3D Threat Field</p>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Lazily loaded Three.js visualization with layered motion and ambient signal geometry.
        </p>
      </div>

      <Canvas camera={{ position: [0, 0, 5.4], fov: 48 }}>
        <ambientLight intensity={1.2} />
        <pointLight color="#2dd4bf" intensity={28} position={[0, 0, 3]} />
        <pointLight color="#fb7185" intensity={10} position={[3, -1, 2]} />
        <Stars depth={80} factor={4} fade radius={50} saturation={0} speed={0.7} />
        <PulseSphere />
        <OrbitControls autoRotate autoRotateSpeed={0.28} enablePan={false} enableZoom={false} />
      </Canvas>
    </div>
  );
}
