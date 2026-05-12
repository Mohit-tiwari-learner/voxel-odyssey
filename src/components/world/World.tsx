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
        <hemisphereLight args={["#ff8c5a", "#2a1530", 0.55]} />
        {/* Rim light from the sun direction */}
        <pointLight position={[-60, 25, -80]} intensity={2.2} color="#ff5e3a" distance={220} decay={1.2} />

        {/* Procedural clouds — sunset tinted */}
        <Clouds material={THREE.MeshBasicMaterial}>
          <Cloud seed={1} position={[20, 35, -40]} bounds={[22, 4, 22]} volume={8} color="#ff8a5c" opacity={0.75} />
          <Cloud seed={2} position={[-30, 40, -30]} bounds={[24, 5, 24]} volume={9} color="#ffb27a" opacity={0.7} />
          <Cloud seed={3} position={[10, 32, 30]} bounds={[20, 4, 20]} volume={8} color="#c44a6a" opacity={0.55} />
          <Cloud seed={4} position={[-50, 45, -70]} bounds={[28, 6, 28]} volume={10} color="#ffd28a" opacity={0.8} />
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
          <Bloom intensity={1.1} luminanceThreshold={0.4} luminanceSmoothing={0.3} mipmapBlur />
          <ChromaticAberration offset={[0.0008, 0.0012] as any} radialModulation modulationOffset={0.5} />
          <Vignette eskil={false} offset={0.15} darkness={0.85} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
