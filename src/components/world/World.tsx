import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Cloud, Clouds, Stars, Environment, SoftShadows } from "@react-three/drei";
import { EffectComposer, Bloom, SSAO, SMAA, ToneMapping, BrightnessContrast, HueSaturation } from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import Terrain from "./Terrain";
import Player from "./Player";
import { SpawnArea, Village, Factory, Projects, Mountain, ContactPortal, Trees, PlayerHouse } from "./Zones";
import { useGame } from "@/store/game";

// ----- Day/Night cycle -----
// t in [0,1): 0 = sunset, 0.25 = night, 0.5 = dawn, 0.75 = noon, back to sunset
const CYCLE_SECONDS = 180;

type Keyframe = {
  t: number;
  sun: [number, number, number]; // sun direction (will be normalized & scaled)
  sunColor: string;
  sunIntensity: number;
  ambient: string;
  ambientIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  fog: string;
  fogDensity: number;
  rim: string;
  rimIntensity: number;
  starsOpacity: number;
  bloom: number;
  turbidity: number;
  rayleigh: number;
};

const KEYS: Keyframe[] = [
  { // sunset — warm orange, sun on horizon
    t: 0,
    sun: [-30, 1.5, -100], sunColor: "#ff7043", sunIntensity: 1.4,
    ambient: "#ffb178", ambientIntensity: 0.35,
    hemiSky: "#ff8c5a", hemiGround: "#2a1530", hemiIntensity: 0.55,
    fog: "#ff7a3d", fogDensity: 0.012,
    rim: "#ff5e3a", rimIntensity: 2.2,
    starsOpacity: 0.2, bloom: 1.1,
    turbidity: 10, rayleigh: 4,
  },
  { // dusk — magenta/violet twilight, sun just below horizon
    t: 0.10,
    sun: [-30, -2, -100], sunColor: "#b35a86", sunIntensity: 0.75,
    ambient: "#9968a6", ambientIntensity: 0.28,
    hemiSky: "#7a4a8a", hemiGround: "#1a0f28", hemiIntensity: 0.48,
    fog: "#6b3a6e", fogDensity: 0.014,
    rim: "#c64a8a", rimIntensity: 1.3,
    starsOpacity: 0.55, bloom: 1.25,
    turbidity: 6, rayleigh: 2.2,
  },
  { // deep twilight — cool blue, last light fading
    t: 0.18,
    sun: [-30, -6, -100], sunColor: "#5566aa", sunIntensity: 0.35,
    ambient: "#5a6aa0", ambientIntensity: 0.22,
    hemiSky: "#34427a", hemiGround: "#0e1228", hemiIntensity: 0.4,
    fog: "#1d2550", fogDensity: 0.016,
    rim: "#6a78cc", rimIntensity: 0.9,
    starsOpacity: 0.85, bloom: 1.35,
    turbidity: 3, rayleigh: 1.0,
  },
  { // night
    t: 0.28,
    sun: [-30, -10, -100], sunColor: "#3a4a8a", sunIntensity: 0.15,
    ambient: "#3b4a78", ambientIntensity: 0.18,
    hemiSky: "#1a2a55", hemiGround: "#05060f", hemiIntensity: 0.35,
    fog: "#0a0e22", fogDensity: 0.018,
    rim: "#5a6cff", rimIntensity: 0.6,
    starsOpacity: 1.0, bloom: 1.4,
    turbidity: 2, rayleigh: 0.5,
  },
  { // dawn
    t: 0.5,
    sun: [60, 2, -100], sunColor: "#ffb878", sunIntensity: 1.0,
    ambient: "#ffd1a3", ambientIntensity: 0.4,
    hemiSky: "#ffc89a", hemiGround: "#2a1f30", hemiIntensity: 0.55,
    fog: "#ffc18a", fogDensity: 0.011,
    rim: "#ff9966", rimIntensity: 1.4,
    starsOpacity: 0.25, bloom: 1.0,
    turbidity: 8, rayleigh: 3,
  },
  { // noon - bright Minecraft daylight, ACES-ready
    t: 0.72,
    sun: [40, 90, -20], sunColor: "#fff5e1", sunIntensity: 1.6,
    ambient: "#ffffff", ambientIntensity: 0.55,
    hemiSky: "#a8d4ff", hemiGround: "#6b4f33", hemiIntensity: 0.65,
    fog: "#bcd9f5", fogDensity: 0.0035,
    rim: "#ffffff", rimIntensity: 0.2,
    starsOpacity: 0, bloom: 0.22,
    turbidity: 2, rayleigh: 0.6,
  },
  { // back to sunset
    t: 1,
    sun: [-30, 1.5, -100], sunColor: "#ff7043", sunIntensity: 1.4,
    ambient: "#ffb178", ambientIntensity: 0.35,
    hemiSky: "#ff8c5a", hemiGround: "#2a1530", hemiIntensity: 0.55,
    fog: "#ff7a3d", fogDensity: 0.012,
    rim: "#ff5e3a", rimIntensity: 2.2,
    starsOpacity: 0.2, bloom: 1.1,
    turbidity: 10, rayleigh: 4,
  },
];

function smooth(x: number) { return x * x * (3 - 2 * x); }

function lerpKey(a: Keyframe, b: Keyframe, k: number): Keyframe {
  const s = smooth(k);
  const lerp = (x: number, y: number) => x + (y - x) * s;
  const lerp3 = (x: [number, number, number], y: [number, number, number]) =>
    [lerp(x[0], y[0]), lerp(x[1], y[1]), lerp(x[2], y[2])] as [number, number, number];
  const mixCol = (x: string, y: string) =>
    "#" + new THREE.Color(x).lerp(new THREE.Color(y), s).getHexString();
  return {
    t: 0,
    sun: lerp3(a.sun, b.sun),
    sunColor: mixCol(a.sunColor, b.sunColor),
    sunIntensity: lerp(a.sunIntensity, b.sunIntensity),
    ambient: mixCol(a.ambient, b.ambient),
    ambientIntensity: lerp(a.ambientIntensity, b.ambientIntensity),
    hemiSky: mixCol(a.hemiSky, b.hemiSky),
    hemiGround: mixCol(a.hemiGround, b.hemiGround),
    hemiIntensity: lerp(a.hemiIntensity, b.hemiIntensity),
    fog: mixCol(a.fog, b.fog),
    fogDensity: lerp(a.fogDensity, b.fogDensity),
    rim: mixCol(a.rim, b.rim),
    rimIntensity: lerp(a.rimIntensity, b.rimIntensity),
    starsOpacity: lerp(a.starsOpacity, b.starsOpacity),
    bloom: lerp(a.bloom, b.bloom),
    turbidity: lerp(a.turbidity, b.turbidity),
    rayleigh: lerp(a.rayleigh, b.rayleigh),
  };
}

function sampleCycle(t: number): Keyframe {
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (t >= KEYS[i].t && t <= KEYS[i + 1].t) {
      const k = (t - KEYS[i].t) / (KEYS[i + 1].t - KEYS[i].t);
      return lerpKey(KEYS[i], KEYS[i + 1], k);
    }
  }
  return KEYS[0];
}

function DayNightCycle({
  sunRef, ambientRef, hemiRef, rimRef, starsRef, skyRef, bloomRef,
}: {
  sunRef: React.MutableRefObject<THREE.DirectionalLight | null>;
  ambientRef: React.MutableRefObject<THREE.AmbientLight | null>;
  hemiRef: React.MutableRefObject<THREE.HemisphereLight | null>;
  rimRef: React.MutableRefObject<THREE.PointLight | null>;
  starsRef: React.MutableRefObject<any>;
  skyRef: React.MutableRefObject<any>;
  bloomRef: React.MutableRefObject<any>;
}) {
  const { scene } = useThree();
  const fog = useMemo(() => scene.fog as THREE.FogExp2, [scene]);
  const bg = useMemo(() => scene.background as THREE.Color, [scene]);
  const sunDir = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    // Slow day/night cycle — one full loop every CYCLE_SECONDS.
    const t = (clock.getElapsedTime() / CYCLE_SECONDS) % 1;
    const k = sampleCycle(t);

    sunDir.current.set(k.sun[0], k.sun[1], k.sun[2]).normalize();

    if (sunRef.current) {
      sunRef.current.position.set(k.sun[0], k.sun[1], k.sun[2]).normalize().multiplyScalar(80);
      sunRef.current.color.set(k.sunColor);
      sunRef.current.intensity = k.sunIntensity;
    }
    if (ambientRef.current) {
      ambientRef.current.color.set(k.ambient);
      ambientRef.current.intensity = k.ambientIntensity;
    }
    if (hemiRef.current) {
      hemiRef.current.color.set(k.hemiSky);
      hemiRef.current.groundColor.set(k.hemiGround);
      hemiRef.current.intensity = k.hemiIntensity;
    }
    if (rimRef.current) {
      rimRef.current.position.set(k.sun[0], Math.max(5, k.sun[1] + 25), k.sun[2]);
      rimRef.current.color.set(k.rim);
      rimRef.current.intensity = k.rimIntensity;
    }
    if (fog) {
      fog.color.set(k.fog);
      fog.density = k.fogDensity;
    }
    if (bg) bg.lerp(new THREE.Color(k.fog), 0.05);
    if (starsRef.current) {
      const m = starsRef.current.material as THREE.Material & { opacity: number; transparent: boolean };
      if (m) { m.transparent = true; m.opacity = k.starsOpacity; }
    }
    if (skyRef.current?.material?.uniforms) {
      const u = skyRef.current.material.uniforms;
      if (u.sunPosition) u.sunPosition.value.set(k.sun[0], k.sun[1], k.sun[2]);
      if (u.turbidity) u.turbidity.value = k.turbidity;
      if (u.rayleigh) u.rayleigh.value = k.rayleigh;
    }
    if (bloomRef.current) bloomRef.current.intensity = k.bloom;
  });

  return null;
}

function CinematicIntro() {
  const { camera } = useThree();
  const introPlaying = useGame((s) => s.introPlaying);
  const finishIntro = useGame((s) => s.finishIntro);
  const startTime = useRef<number | null>(null);
  const done = useRef(false);

  // Waypoints: [position, lookAt]
  const path = useMemo(() => ([
    { p: new THREE.Vector3(0, 38, 70),  l: new THREE.Vector3(0, 4, 0) },   // high establishing shot
    { p: new THREE.Vector3(-22, 18, 42), l: new THREE.Vector3(0, 4, 0) },  // sweep around
    { p: new THREE.Vector3(14, 10, 26), l: new THREE.Vector3(0, 4, 0) },   // descend
    { p: new THREE.Vector3(0, 6, 14),   l: new THREE.Vector3(0, 3, 0) },   // settle into player POV
  ]), []);
  const DURATION = 6.5;

  useEffect(() => {
    if (introPlaying) {
      startTime.current = null;
      done.current = false;
    }
  }, [introPlaying]);

  useFrame(({ clock }) => {
    if (!introPlaying || done.current) return;
    if (startTime.current === null) startTime.current = clock.getElapsedTime();
    const elapsed = clock.getElapsedTime() - startTime.current;
    const t = Math.min(elapsed / DURATION, 1);

    // ease in-out cubic
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // sample along path
    const seg = e * (path.length - 1);
    const i = Math.min(Math.floor(seg), path.length - 2);
    const k = seg - i;
    const ks = k * k * (3 - 2 * k);
    const pos = path[i].p.clone().lerp(path[i + 1].p, ks);
    const look = path[i].l.clone().lerp(path[i + 1].l, ks);

    camera.position.copy(pos);
    camera.lookAt(look);

    if (t >= 1) {
      done.current = true;
      finishIntro();
    }
  });

  return null;
}

function SceneContents() {
  const sunRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const hemiRef = useRef<THREE.HemisphereLight | null>(null);
  const rimRef = useRef<THREE.PointLight | null>(null);
  const starsRef = useRef<any>(null);
  const skyRef = useRef<any>(null);
  const bloomRef = useRef<any>(null);

  return (
    <>
      {/* Soft contact shadows for crisp tree/house edges */}
      <SoftShadows size={28} samples={16} focus={0.6} />

      <Sky
        ref={skyRef}
        distance={450000}
        sunPosition={[40, 90, -20]}
        inclination={0.6}
        azimuth={0.25}
        turbidity={2}
        rayleigh={0.6}
        mieCoefficient={0.003}
        mieDirectionalG={0.85}
      />
      {/* HDRI environment for realistic reflections on water/metal */}
      <Environment preset="park" background={false} environmentIntensity={0.55} />
      <Stars ref={starsRef} radius={300} depth={50} count={1500} factor={4} fade speed={0.4} />

      <ambientLight ref={ambientRef} intensity={0.55} color="#ffffff" />
      <directionalLight
        ref={sunRef}
        castShadow
        position={[40, 90, -20]}
        intensity={1.6}
        color="#fff5e1"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
        shadow-camera-far={220}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
      />
      <hemisphereLight ref={hemiRef} args={["#a8d4ff", "#6b4f33", 0.65]} />
      <pointLight ref={rimRef} position={[40, 115, -20]} intensity={0.2} color="#ffffff" distance={220} decay={1.2} />

      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud seed={1} position={[20, 38, -40]} bounds={[18, 2, 18]} volume={5} color="#ffffff" opacity={1} />
        <Cloud seed={2} position={[-30, 42, -30]} bounds={[20, 2, 20]} volume={6} color="#ffffff" opacity={1} />
        <Cloud seed={3} position={[10, 36, 30]} bounds={[16, 2, 16]} volume={5} color="#ffffff" opacity={1} />
        <Cloud seed={4} position={[-50, 46, -70]} bounds={[24, 2, 24]} volume={6} color="#ffffff" opacity={1} />
      </Clouds>

      <Terrain size={110} />
      <Trees />
      <SpawnArea />
      <PlayerHouse />
      <Village />
      <Factory />
      <Projects />
      <Mountain />
      <ContactPortal />

      <Player />
      <CinematicIntro />

      <EffectComposer multisampling={4} enableNormalPass>
        {/* Crevice darkening between blocks */}
        <SSAO
          blendFunction={BlendFunction.MULTIPLY}
          samples={16}
          radius={0.18}
          intensity={22}
          luminanceInfluence={0.6}
          worldDistanceThreshold={40}
          worldDistanceFalloff={10}
          worldProximityThreshold={6}
          worldProximityFalloff={2}
        />
        <Bloom ref={bloomRef} intensity={0.22} luminanceThreshold={0.78} luminanceSmoothing={0.22} mipmapBlur />
        {/* Subtle cover-art punch */}
        <HueSaturation hue={0} saturation={0.08} />
        <BrightnessContrast brightness={0.0} contrast={0.06} />
        {/* ACES filmic tone mapping for HDR -> screen */}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <SMAA />
      </EffectComposer>

      <DayNightCycle
        sunRef={sunRef}
        ambientRef={ambientRef}
        hemiRef={hemiRef}
        rimRef={rimRef}
        starsRef={starsRef}
        skyRef={skyRef}
        bloomRef={bloomRef}
      />
    </>
  );
}

export default function World() {
  const setLoaded = useGame((s) => s.setLoaded);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(t);
  }, [setLoaded]);

  return (
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      dpr={[1, 1.5]}
      camera={{ fov: 70, near: 0.1, far: 400, position: [0, 6, 14] }}
      onCreated={({ scene, gl }) => {
        scene.fog = new THREE.FogExp2("#bcd9f5", 0.0035);
        scene.background = new THREE.Color("#7fbfff");
        gl.toneMapping = THREE.NoToneMapping; // ToneMapping pass handles ACES
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <Suspense fallback={null}>
        <SceneContents />
      </Suspense>
    </Canvas>
  );
}
