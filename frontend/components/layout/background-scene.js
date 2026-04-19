"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Points, PointMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { useTheme } from "./theme-provider";

function SignalField({ colors }) {
  const meshRef = useRef(null);
  const pointRef = useRef(null);
  const positions = useMemo(() => {
    const points = [];

    for (let index = 0; index < 1800; index += 1) {
      points.push((Math.random() - 0.5) * 18);
      points.push((Math.random() - 0.5) * 12);
      points.push((Math.random() - 0.5) * 14);
    }

    return new Float32Array(points);
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.03;
      meshRef.current.rotation.y += delta * 0.06;
    }

    if (pointRef.current) {
      pointRef.current.rotation.y -= delta * 0.04;
    }
  });

  return (
    <>
      <Float speed={1.6} rotationIntensity={0.2} floatIntensity={0.4}>
        <group ref={meshRef}>
          <mesh position={[0, 0, -1.5]} rotation={[1.1, 0.2, 0]}>
            <torusGeometry args={[3.2, 0.02, 16, 220]} />
            <meshStandardMaterial
              color={colors.signal}
              emissive={colors.signal}
              emissiveIntensity={0.8}
            />
          </mesh>
          <mesh position={[1.8, 1.4, -2.5]} rotation={[0.6, 0.9, 0.4]}>
            <icosahedronGeometry args={[0.7, 1]} />
            <meshStandardMaterial
              color={colors.secondary}
              emissive={colors.secondary}
              emissiveIntensity={0.7}
              wireframe
            />
          </mesh>
          <mesh position={[-2.6, -1.3, -2.1]}>
            <sphereGeometry args={[0.5, 18, 18]} />
            <meshStandardMaterial
              color={colors.accent}
              emissive={colors.accent}
              emissiveIntensity={0.45}
            />
          </mesh>
        </group>
      </Float>

      <Points ref={pointRef} positions={positions} stride={3}>
        <PointMaterial color={colors.points} size={0.03} transparent opacity={0.5} />
      </Points>
    </>
  );
}

export function BackgroundScene() {
  const { mounted, theme } = useTheme();
  const isLight = mounted && theme === "light";
  const colors = isLight
    ? {
        signal: "#0f766e",
        secondary: "#2563eb",
        accent: "#d97706",
        points: "#0f172a"
      }
    : {
        signal: "#56c7ff",
        secondary: "#3972ff",
        accent: "#ffc25c",
        points: "#dbeafe"
      };

  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 transition-opacity duration-500 ${
        isLight ? "opacity-30" : "opacity-46"
      }`}
    >
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.68} />
        <pointLight color={colors.signal} intensity={9} position={[2, 2, 2]} />
        <pointLight color={colors.accent} intensity={5} position={[-2, -2, 3]} />
        <SignalField colors={colors} />
      </Canvas>
    </div>
  );
}
