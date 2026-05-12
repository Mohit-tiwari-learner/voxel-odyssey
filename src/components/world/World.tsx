import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky, Cloud, Clouds, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";
import Terrain from "./Terrain";
import Player from "./Player";
import { SpawnArea, Village, Factory, Projects, Mountain, ContactPortal, Trees } from "./Zones";
import { useGame } from "@/store/game";

export default function World() {
  const setLoaded = useGame((s) => s.setLoaded);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(t);
  }, [setLoaded]);

  return (
    <Canvas
      shadows
      gl={{ antialias: false, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      camera={{ fov: 70, near: 0.1, far: 400, position: [0, 6, 14] }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2("#ff7a3d", 0.012);
        scene.background = new THREE.Color("#ff7a3d");
      }}
    >
      <Suspense fallback={null}>
        {/* Sky & atmosphere — dramatic sunset */}
        <Sky
          distance={450000}
          sunPosition={[-30, 1.5, -100]}
          inclination={0.495}
          azimuth={0.25}
          turbidity={10}
          rayleigh={4}
          mieCoefficient={0.005}
          mieDirectionalG={0.95}
        />
        <Stars radius={300} depth={50} count={1500} factor={4} fade speed={0.4} />

        {/* Lighting — warm sunset */}
        <ambientLight intensity={0.35} color="#ffb178" />
        <directionalLight
          castShadow
          position={[-40, 20, -60]}
          intensity={1.4}
          color="#ff9966"
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={200}
          shadow-camera-left={-80}
          shadow-camera-right={80}
          shadow-camera-top={80}
          shadow-camera-bottom={-80}
        />
        <hemisphereLight args={["#ffd9a3", "#3b2e1a", 0.4]} />

        {/* Procedural clouds */}
        <Clouds material={THREE.MeshBasicMaterial}>
          <Cloud seed={1} position={[20, 35, -40]} bounds={[20, 4, 20]} volume={8} color="#fff8e0" opacity={0.7} />
          <Cloud seed={2} position={[-30, 38, -20]} bounds={[20, 4, 20]} volume={8} color="#ffe7b3" opacity={0.65} />
          <Cloud seed={3} position={[10, 32, 30]} bounds={[20, 4, 20]} volume={8} color="#fff8e0" opacity={0.6} />
        </Clouds>

        {/* World */}
        <Terrain size={90} />
        <Trees />
        <SpawnArea />
        <Village />
        <Factory />
        <Projects />
        <Mountain />
        <ContactPortal />

        <Player />

        <EffectComposer multisampling={0}>
          <Bloom intensity={0.7} luminanceThreshold={0.55} luminanceSmoothing={0.2} mipmapBlur />
          <ChromaticAberration offset={[0.0006, 0.0009] as any} radialModulation modulationOffset={0.4} />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
