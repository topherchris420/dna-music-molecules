import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { EntrainmentMode } from "./WetwareSimulator";

interface WetwareCymaticGeometryProps {
  frequencies: number[];
  isPlaying: boolean;
  resonanceIntensity: number;
  entrainmentMode: EntrainmentMode;
}

const WetwareCymaticGeometry = ({
  frequencies,
  isPlaying,
  resonanceIntensity,
  entrainmentMode,
}: WetwareCymaticGeometryProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  const getModeColor = (mode: EntrainmentMode): THREE.Color => {
    switch (mode) {
      case "focus":
        return new THREE.Color(`hsl(200, 85%, 60%)`);
      case "relaxation":
        return new THREE.Color(`hsl(260, 75%, 65%)`);
      case "coherence":
        return new THREE.Color(`hsl(280, 70%, 70%)`);
    }
  };

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          frequency1: { value: frequencies[0] / 100 },
          frequency2: { value: frequencies[1] / 100 },
          frequency3: { value: frequencies[2] / 100 },
          intensity: { value: resonanceIntensity },
          baseColor: { value: getModeColor(entrainmentMode) },
        },
        vertexShader: `
          uniform float time;
          uniform float frequency1;
          uniform float frequency2;
          uniform float frequency3;
          uniform float intensity;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            
            vec3 pos = position;
            
            // Multi-frequency cymatic distortion
            float dist1 = sin(pos.x * frequency1 * 3.0 + time) * 
                         cos(pos.y * frequency1 * 2.0 + time);
            float dist2 = sin(pos.y * frequency2 * 2.5 + time * 1.3) * 
                         cos(pos.z * frequency2 * 3.0 + time * 1.3);
            float dist3 = sin(pos.z * frequency3 * 2.0 + time * 0.7) * 
                         cos(pos.x * frequency3 * 2.5 + time * 0.7);
            
            float displacement = (dist1 + dist2 + dist3) * intensity * 0.3;
            
            pos += normal * displacement;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 baseColor;
          uniform float time;
          uniform float intensity;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            // Fresnel effect
            vec3 viewDir = normalize(cameraPosition - vPosition);
            float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.5);
            
            // Pulsing glow
            float pulse = sin(time * 2.0) * 0.3 + 0.7;
            
            // Color based on position and normal
            vec3 color = baseColor * (0.6 + fresnel * 0.4) * pulse;
            color += vec3(fresnel * 0.5) * intensity;
            
            gl_FragColor = vec4(color, 0.85 + fresnel * 0.15);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    [frequencies, resonanceIntensity, entrainmentMode]
  );

  useFrame((state, delta) => {
    if (meshRef.current && isPlaying) {
      timeRef.current += delta;
      shaderMaterial.uniforms.time.value = timeRef.current;
      shaderMaterial.uniforms.frequency1.value = frequencies[0] / 100;
      shaderMaterial.uniforms.frequency2.value = frequencies[1] / 100;
      shaderMaterial.uniforms.frequency3.value = frequencies[2] / 100;
      shaderMaterial.uniforms.intensity.value = resonanceIntensity;
      shaderMaterial.uniforms.baseColor.value = getModeColor(entrainmentMode);

      // Gentle rotation
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} material={shaderMaterial}>
      <icosahedronGeometry args={[1.5, 4]} />
    </mesh>
  );
};

interface WetwareCymaticSceneProps {
  frequencies: number[];
  isPlaying: boolean;
  resonanceIntensity: number;
  entrainmentMode: EntrainmentMode;
}

export const WetwareCymaticScene = ({
  frequencies,
  isPlaying,
  resonanceIntensity,
  entrainmentMode,
}: WetwareCymaticSceneProps) => {
  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border border-border bg-card/10">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.4} color="#8b5cf6" />
        <WetwareCymaticGeometry
          frequencies={frequencies}
          isPlaying={isPlaying}
          resonanceIntensity={resonanceIntensity}
          entrainmentMode={entrainmentMode}
        />
        <OrbitControls enableZoom={true} enablePan={false} />
      </Canvas>
      <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-background/70 px-3 py-1.5 rounded backdrop-blur-sm">
        3D Cymatic Resonance Pattern
      </div>
    </div>
  );
};
