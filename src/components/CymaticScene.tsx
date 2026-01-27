import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface CymaticGeometryProps {
  frequencies: number[];
  isPlaying: boolean;
  biofeedback: number;
}

const CymaticGeometry = ({ frequencies, isPlaying, biofeedback }: CymaticGeometryProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  // Ensure we have valid frequencies
  const safeFrequencies = frequencies.length >= 4 
    ? frequencies.slice(0, 4) 
    : [...frequencies, ...Array(4 - frequencies.length).fill(440)].slice(0, 4);

  // Create shader material for cymatic patterns
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          freq1: { value: safeFrequencies[0] / 1000 },
          freq2: { value: safeFrequencies[1] / 1000 },
          freq3: { value: safeFrequencies[2] / 1000 },
          freq4: { value: safeFrequencies[3] / 1000 },
          biofeedback: { value: biofeedback },
          isPlaying: { value: isPlaying ? 1.0 : 0.0 },
        },
        vertexShader: `
          uniform float time;
          uniform float freq1;
          uniform float freq2;
          uniform float freq3;
          uniform float freq4;
          uniform float biofeedback;
          uniform float isPlaying;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            
            vec3 pos = position;
            
            if (isPlaying > 0.5) {
              // Create cymatic wave patterns using individual frequencies
              float wave = sin(pos.x * freq1 * 10.0 + time) * 
                          cos(pos.y * freq1 * 10.0 + time) *
                          sin(pos.z * freq1 * 10.0 + time);
              wave += sin(pos.x * freq2 * 10.0 + time * 1.1) * 
                      cos(pos.y * freq2 * 10.0 + time * 1.1) *
                      sin(pos.z * freq2 * 10.0 + time * 1.1);
              wave += sin(pos.x * freq3 * 10.0 + time * 0.9) * 
                      cos(pos.y * freq3 * 10.0 + time * 0.9) *
                      sin(pos.z * freq3 * 10.0 + time * 0.9);
              wave += sin(pos.x * freq4 * 10.0 + time * 1.2) * 
                      cos(pos.y * freq4 * 10.0 + time * 1.2) *
                      sin(pos.z * freq4 * 10.0 + time * 1.2);
              
              wave *= 0.1 * (1.0 + biofeedback * 0.5);
              pos += normal * wave;
            }
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float biofeedback;
          uniform float isPlaying;
          uniform float freq1;
          uniform float freq2;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vec3 color = vec3(0.2, 0.4, 0.8);
            
            if (isPlaying > 0.5) {
              // Frequency-based coloring with more vibrant colors
              float pattern = sin(vPosition.x * 5.0 + time) * 
                             cos(vPosition.y * 5.0 + time) * 
                             sin(vPosition.z * 5.0 + time);
              
              // Map different frequencies to different hues
              float hue1 = freq1 * 2.0;
              float hue2 = freq2 * 2.0;
              
              color = vec3(
                0.4 + pattern * 0.3 + sin(hue1 + time) * 0.2,
                0.5 + pattern * 0.2 + cos(hue2 + time) * 0.2,
                0.9 + pattern * 0.1
              );
              
              color += biofeedback * 0.15;
            }
            
            // Fresnel effect for edge glow
            vec3 viewDir = normalize(cameraPosition - vPosition);
            float fresnel = pow(1.0 - abs(dot(viewDir, vNormal)), 2.5);
            color += vec3(fresnel * 0.4, fresnel * 0.3, fresnel * 0.5);
            
            gl_FragColor = vec4(color, 0.9);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    [safeFrequencies, biofeedback, isPlaying]
  );

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    timeRef.current += delta;
    shaderMaterial.uniforms.time.value = timeRef.current;
    shaderMaterial.uniforms.freq1.value = safeFrequencies[0] / 1000;
    shaderMaterial.uniforms.freq2.value = safeFrequencies[1] / 1000;
    shaderMaterial.uniforms.freq3.value = safeFrequencies[2] / 1000;
    shaderMaterial.uniforms.freq4.value = safeFrequencies[3] / 1000;
    shaderMaterial.uniforms.biofeedback.value = biofeedback;
    shaderMaterial.uniforms.isPlaying.value = isPlaying ? 1.0 : 0.0;

    if (isPlaying) {
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.x += delta * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} material={shaderMaterial}>
      <icosahedronGeometry args={[1.5, 5]} />
    </mesh>
  );
};

interface CymaticSceneProps {
  frequencies: number[];
  isPlaying: boolean;
  biofeedback: number;
}

export const CymaticScene = ({ frequencies, isPlaying, biofeedback }: CymaticSceneProps) => {
  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border border-border bg-card/10">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <color attach="background" args={["#0a0f14"]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#4a90e2" />
        <CymaticGeometry
          frequencies={frequencies}
          isPlaying={isPlaying}
          biofeedback={biofeedback}
        />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
      <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded">
        Cymatic Projection — 3D Geometry of Sound
      </div>
    </div>
  );
};
