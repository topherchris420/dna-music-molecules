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
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(0);

  // Create shader material for cymatic patterns
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          frequencies: { value: frequencies.map(f => f / 1000) },
          biofeedback: { value: biofeedback },
          isPlaying: { value: isPlaying ? 1.0 : 0.0 },
        },
        vertexShader: `
          uniform float time;
          uniform float frequencies[4];
          uniform float biofeedback;
          uniform float isPlaying;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            
            vec3 pos = position;
            
            if (isPlaying > 0.5) {
              // Create cymatic wave patterns
              float wave = 0.0;
              for (int i = 0; i < 4; i++) {
                wave += sin(pos.x * frequencies[i] * 10.0 + time) * 
                        cos(pos.y * frequencies[i] * 10.0 + time) *
                        sin(pos.z * frequencies[i] * 10.0 + time);
              }
              
              wave *= 0.15 * (1.0 + biofeedback * 0.5);
              pos += normal * wave;
            }
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float biofeedback;
          uniform float isPlaying;
          
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vec3 color = vec3(0.2, 0.4, 0.8);
            
            if (isPlaying > 0.5) {
              // Frequency-based coloring
              float pattern = sin(vPosition.x * 5.0 + time) * 
                             cos(vPosition.y * 5.0 + time) * 
                             sin(vPosition.z * 5.0 + time);
              
              color = vec3(
                0.3 + pattern * 0.3 + biofeedback * 0.2,
                0.5 + pattern * 0.2,
                0.8 + pattern * 0.1
              );
            }
            
            // Fresnel effect
            float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            color += vec3(fresnel * 0.3);
            
            gl_FragColor = vec4(color, 0.9);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    []
  );

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;

    timeRef.current += 0.01;
    materialRef.current.uniforms.time.value = timeRef.current;
    materialRef.current.uniforms.frequencies.value = frequencies.map(f => f / 1000);
    materialRef.current.uniforms.biofeedback.value = biofeedback;
    materialRef.current.uniforms.isPlaying.value = isPlaying ? 1.0 : 0.0;

    if (isPlaying) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.rotation.x += 0.002;
    }
  });

  return (
    <mesh ref={meshRef} material={shaderMaterial}>
      <icosahedronGeometry args={[1.5, 4]} />
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
