import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, Cloud, Clouds, Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";
import Terrain from "./Terrain";
import Player from "./Player";
import { SpawnArea, Village, Factory, Projects, Mountain, ContactPortal, Trees } from "./Zones";
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
  { // sunset
    t: 0,
    sun: [-30, 1.5, -100], sunColor: "#ff7043", sunIntensity: 1.4,
    ambient: "#ffb178", ambientIntensity: 0.35,
    hemiSky: "#ff8c5a", hemiGround: "#2a1530", hemiIntensity: 0.55,
    fog: "#ff7a3d", fogDensity: 0.012,
    rim: "#ff5e3a", rimIntensity: 2.2,
    starsOpacity: 0.2, bloom: 1.1,
    turbidity: 10, rayleigh: 4,
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
  { // noon
    t: 0.72,
    sun: [40, 90, -20], sunColor: "#fff5d6", sunIntensity: 1.7,
    ambient: "#ffeec8", ambientIntensity: 0.55,
    hemiSky: "#bfe2ff", hemiGround: "#3b2e1a", hemiIntensity: 0.65,
    fog: "#cfe6ff", fogDensity: 0.006,
    rim: "#fff1c2", rimIntensity: 0.4,
    starsOpacity: 0, bloom: 0.7,
    turbidity: 4, rayleigh: 1.2,
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
      <Sky
        ref={skyRef}
        distance={450000}
        sunPosition={[-30, 1.5, -100]}
        inclination={0.495}
        azimuth={0.25}
        turbidity={10}
        rayleigh={4}
        mieCoefficient={0.005}
        mieDirectionalG={0.95}
      />
      <Stars ref={starsRef} radius={300} depth={50} count={1500} factor={4} fade speed={0.4} />

      <ambientLight ref={ambientRef} intensity={0.35} color="#ffb178" />
      <directionalLight
        ref={sunRef}
        castShadow
        position={[-40, 20, -60]}
        intensity={1.4}
        color="#ff9966"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
        shadow-camera-far={200}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
      />
      <hemisphereLight ref={hemiRef} args={["#ff8c5a", "#2a1530", 0.55]} />
      <pointLight ref={rimRef} position={[-60, 25, -80]} intensity={2.2} color="#ff5e3a" distance={220} decay={1.2} />

      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud seed={1} position={[20, 35, -40]} bounds={[22, 4, 22]} volume={8} color="#ff8a5c" opacity={0.75} />
        <Cloud seed={2} position={[-30, 40, -30]} bounds={[24, 5, 24]} volume={9} color="#ffb27a" opacity={0.7} />
        <Cloud seed={3} position={[10, 32, 30]} bounds={[20, 4, 20]} volume={8} color="#c44a6a" opacity={0.55} />
        <Cloud seed={4} position={[-50, 45, -70]} bounds={[28, 6, 28]} volume={10} color="#ffd28a" opacity={0.8} />
      </Clouds>

      <Terrain size={90} />
      <Trees />
      <SpawnArea />
      <Village />
      <Factory />
      <Projects />
      <Mountain />
      <ContactPortal />

      <Player />
      <CinematicIntro />

      <EffectComposer multisampling={0}>
        <Bloom ref={bloomRef} intensity={1.1} luminanceThreshold={0.4} luminanceSmoothing={0.3} mipmapBlur />
        <ChromaticAberration offset={[0.0008, 0.0012] as any} radialModulation modulationOffset={0.5} />
        <Vignette eskil={false} offset={0.15} darkness={0.85} />
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
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2("#ff7a3d", 0.012);
        scene.background = new THREE.Color("#ff7a3d");
      }}
    >
      <Suspense fallback={null}>
        <SceneContents />
      </Suspense>
    </Canvas>
  );
}
