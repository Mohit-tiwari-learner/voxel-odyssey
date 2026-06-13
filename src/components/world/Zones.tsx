import React from "react";
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Text, Float, Sparkles } from "@react-three/drei";
import { useGame } from "@/store/game";

/* Shared shaded box geometry + noise texture for "Minecraft pop" */
const SHADED_BOX = (() => {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const faceShade = [0.88, 0.86, 1.18, 0.55, 0.96, 0.80];
  const colors = new Float32Array(24 * 3);
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = (f * 4 + v) * 3;
      colors[i] = colors[i + 1] = colors[i + 2] = faceShade[f];
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
})();

const BLOCK_TEX = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(32, 32);
  let s = 13;
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < 32 * 32; i++) {
    const n = 220 + Math.floor((rng() - 0.5) * 40);
    img.data[i * 4] = n; img.data[i * 4 + 1] = n; img.data[i * 4 + 2] = n; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipmapLinearFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
})();

/* Tiny helper: a stack of voxel blocks */
function Block({ position, color, size = 1, emissive }: { position: [number, number, number]; color: string; size?: number; emissive?: string }) {
  return (
    <mesh position={position} scale={size} castShadow receiveShadow geometry={SHADED_BOX}>
      <meshStandardMaterial
        map={BLOCK_TEX ?? undefined}
        color={color}
        vertexColors
        roughness={0.9}
        metalness={0}
        flatShading
        emissive={emissive ?? "#000"}
        emissiveIntensity={emissive ? 0.7 : 0}
      />
    </mesh>
  );
}

/* Floating label above a zone */
function ZoneLabel({ position, color, children }: { position: [number, number, number]; color: string; children: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(s.clock.elapsedTime * 1.5) * 0.4;
  });
  return (
    <group ref={ref} position={position}>
      <Text fontSize={1.6} color={color} outlineColor="#000" outlineWidth={0.08} anchorX="center" anchorY="middle">
        {children}
      </Text>
    </group>
  );
}

/* SPAWN AREA — floating logo + portal beacons toward zones */
export function SpawnArea() {
  return (
    <group>
      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.6}>
        <group position={[0, 10, -6]}>
          {/* Pixel "P" logo */}
          {[
            [0,2],[0,1],[0,0],[0,-1],[0,-2],[1,2],[2,2],[2,1],[1,0],
          ].map(([x,y],i)=>(
            <Block key={i} position={[x*1.1, y*1.1, 0]} color="#f6c453" emissive="#f6c453" />
          ))}
        </group>
      </Float>
      <ZoneLabel position={[0, 7, 0]} color="#f6c453">PORTFOLIO</ZoneLabel>
      <Sparkles count={60} scale={[20, 6, 20]} size={3} color="#fff5c2" speed={0.4} position={[0, 4, 0]} />
      {/* NPC robot guide — grounded to terrain */}
      <group position={[3, heightAt(3, 6) + 1, 6]}>
        <Block position={[0,1,0]} color="#bbbec4" />
        <Block position={[0,0,0]} color="#7c8087" />
        <Block position={[-0.6,0.9,0.51]} color="#42e2f5" emissive="#42e2f5" size={0.2} />
        <Block position={[0.6,0.9,0.51]} color="#42e2f5" emissive="#42e2f5" size={0.2} />
      </group>
    </group>
  );
}

/* ABOUT VILLAGE — a small medieval voxel hamlet: cobble path, main cottage,
 * well, market stall, fenced garden with crops, lanterns and signposts. */
export function Village() {
  const base = ZONES_LOCAL.village;

  // Palette
  const OAK = "#b6824a";
  const OAK_DARK = "#7a4f29";
  const PLANK = "#caa472";
  const COBBLE = "#8a8d92";
  const COBBLE_DARK = "#6b6e72";
  const ROOF = "#7a2e2e";
  const ROOF_DARK = "#5a1f1f";
  const DIRT = "#6b4a2b";
  const LEAF = "#3f7a3a";
  const WHEAT = "#e0c060";
  const WATER = "#5fbfe0";
  const LAMP = "#ffe6a8";

  const blocks: React.ReactElement[] = [];

  // --- Cobble path winding through the village (z-axis spine) ---
  for (let z = -10; z <= 10; z++) {
    const wobble = Math.round(Math.sin(z * 0.4) * 1);
    for (let dx = -1; dx <= 1; dx++) {
      const x = wobble + dx;
      blocks.push(
        <Block key={`pth-${z}-${dx}`} position={[x, 0, z]} color={(x + z) % 2 === 0 ? COBBLE : COBBLE_DARK} />
      );
    }
  }

  // --- Main cottage (4x5 footprint, pitched roof, door + windows) ---
  const hx = -5, hz = -2;
  const W = 5, D = 4, H = 3;
  // Plank floor
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
      blocks.push(<Block key={`hf-${x}-${z}`} position={[hx + x, 0, hz + z]} color={PLANK} />);
    }
  }
  // Walls
  for (let x = 0; x < W; x++) {
    for (let y = 1; y <= H; y++) {
      // back wall (far from path)
      blocks.push(<Block key={`hbw-${x}-${y}`} position={[hx + x, y, hz - 1]} color={x % 2 ? OAK : OAK_DARK} />);
      // front wall — door at x=2, y=1..2; window at x=0/4, y=2
      const isDoor = x === 2 && (y === 1 || y === 2);
      const isWin = (x === 0 || x === 4) && y === 2;
      if (isDoor) continue;
      if (isWin) {
        blocks.push(
          <mesh key={`hgw-${x}-${y}`} position={[hx + x, y, hz + D]} geometry={SHADED_BOX} castShadow receiveShadow>
            <meshPhysicalMaterial color="#b8e8ff" transmission={0.85} thickness={0.3} roughness={0.05} transparent opacity={0.6} />
          </mesh>
        );
      } else {
        blocks.push(<Block key={`hfw-${x}-${y}`} position={[hx + x, y, hz + D]} color={x % 2 ? OAK : OAK_DARK} />);
      }
    }
  }
  for (let z = 0; z < D; z++) {
    for (let y = 1; y <= H; y++) {
      blocks.push(<Block key={`hlw-${z}-${y}`} position={[hx - 1, y, hz + z]} color={z % 2 ? OAK : OAK_DARK} />);
      blocks.push(<Block key={`hrw-${z}-${y}`} position={[hx + W, y, hz + z]} color={z % 2 ? OAK : OAK_DARK} />);
    }
  }
  // Pitched roof (two slopes)
  for (let z = -1; z <= D; z++) {
    const off = Math.min(Math.abs(z - (D - 1) / 2), 2);
    const ry = H + 1 + (2 - off);
    for (let x = -1; x <= W; x++) {
      blocks.push(<Block key={`hr-${x}-${z}`} position={[hx + x, ry, hz + z]} color={off === 0 ? ROOF_DARK : ROOF} />);
    }
  }
  // Door frame
  blocks.push(<Block key="hd1" position={[hx + 2, 3, hz + D]} color={OAK_DARK} />);
  // Chimney
  blocks.push(<Block key="hch1" position={[hx + W - 1, H + 3, hz]} color={COBBLE_DARK} />);
  blocks.push(<Block key="hch2" position={[hx + W - 1, H + 4, hz]} color={COBBLE_DARK} />);
  // Lantern by door
  blocks.push(<Block key="hl1" position={[hx + 1, 3, hz + D]} color={LAMP} emissive={LAMP} size={0.4} />);
  blocks.push(<Block key="hl2" position={[hx + 3, 3, hz + D]} color={LAMP} emissive={LAMP} size={0.4} />);

  // --- Well (4x4 cobble rim, water inside, two posts + roof) ---
  const wx = 4, wz = -4;
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      const onRim = Math.max(Math.abs(x), Math.abs(z)) === 1;
      if (onRim) blocks.push(<Block key={`wr-${x}-${z}`} position={[wx + x, 1, wz + z]} color={COBBLE} />);
    }
  }
  blocks.push(
    <mesh key="ww" position={[wx, 1, wz]} geometry={SHADED_BOX} receiveShadow>
      <meshStandardMaterial color={WATER} transparent opacity={0.85} roughness={0.2} />
    </mesh>
  );
  blocks.push(<Block key="wp1" position={[wx - 1, 2, wz - 1]} color={OAK_DARK} size={0.3} />);
  blocks.push(<Block key="wp1b" position={[wx - 1, 3, wz - 1]} color={OAK_DARK} size={0.3} />);
  blocks.push(<Block key="wp2" position={[wx + 1, 2, wz + 1]} color={OAK_DARK} size={0.3} />);
  blocks.push(<Block key="wp2b" position={[wx + 1, 3, wz + 1]} color={OAK_DARK} size={0.3} />);
  for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++)
    blocks.push(<Block key={`wrf-${x}-${z}`} position={[wx + x, 4, wz + z]} color={ROOF} />);

  // --- Market stall (open-front, plank counter + striped awning) ---
  const sx = 4, sz = 4;
  // counter
  for (let x = -1; x <= 1; x++) {
    blocks.push(<Block key={`sc-${x}`} position={[sx + x, 1, sz]} color={OAK_DARK} />);
  }
  // posts
  blocks.push(<Block key="sp1" position={[sx - 1, 2, sz]} color={OAK_DARK} size={0.3} />);
  blocks.push(<Block key="sp1b" position={[sx - 1, 3, sz]} color={OAK_DARK} size={0.3} />);
  blocks.push(<Block key="sp2" position={[sx + 1, 2, sz]} color={OAK_DARK} size={0.3} />);
  blocks.push(<Block key="sp2b" position={[sx + 1, 3, sz]} color={OAK_DARK} size={0.3} />);
  // striped awning
  for (let x = -1; x <= 1; x++) {
    blocks.push(<Block key={`sa-${x}`} position={[sx + x, 4, sz]} color={x === 0 ? "#e8e8e8" : "#c43b3b"} />);
    blocks.push(<Block key={`sa2-${x}`} position={[sx + x, 4, sz + 1]} color={x === 0 ? "#c43b3b" : "#e8e8e8"} />);
  }
  // wares on counter
  blocks.push(<Block key="sw1" position={[sx - 1, 2, sz]} color="#fdc500" size={0.4} />);
  blocks.push(<Block key="sw2" position={[sx, 2, sz]} color="#42e2f5" size={0.4} />);
  blocks.push(<Block key="sw3" position={[sx + 1, 2, sz]} color="#ffafcc" size={0.4} />);

  // --- Fenced garden with wheat rows ---
  const gx = -5, gz = 5;
  for (let x = 0; x < 4; x++) {
    for (let z = 0; z < 3; z++) {
      blocks.push(<Block key={`gd-${x}-${z}`} position={[gx + x, 0, gz + z]} color={DIRT} />);
      // wheat stalks (small blocks)
      if (z % 2 === 0) blocks.push(<Block key={`gw-${x}-${z}`} position={[gx + x, 1, gz + z]} color={WHEAT} size={0.5} />);
    }
  }
  // fence posts around garden
  for (let x = -1; x <= 4; x++) {
    blocks.push(<Block key={`fnp1-${x}`} position={[gx + x, 1, gz - 1]} color={OAK_DARK} size={0.2} />);
    blocks.push(<Block key={`fnp2-${x}`} position={[gx + x, 1, gz + 3]} color={OAK_DARK} size={0.2} />);
  }
  for (let z = -1; z <= 3; z++) {
    blocks.push(<Block key={`fnp3-${z}`} position={[gx - 1, 1, gz + z]} color={OAK_DARK} size={0.2} />);
    blocks.push(<Block key={`fnp4-${z}`} position={[gx + 4, 1, gz + z]} color={OAK_DARK} size={0.2} />);
  }

  // --- A small oak tree near the cottage ---
  const tx = -1, tz = 4;
  for (let y = 1; y <= 3; y++) blocks.push(<Block key={`tt-${y}`} position={[tx, y, tz]} color={OAK_DARK} />);
  for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) for (let y = 3; y <= 4; y++)
    blocks.push(<Block key={`tl-${x}-${y}-${z}`} position={[tx + x, y, tz + z]} color={LEAF} />);
  blocks.push(<Block key="tl-top" position={[tx, 5, tz]} color={LEAF} />);

  // --- Signpost at path entrance ---
  blocks.push(<Block key="sg-post" position={[2, 1, 9]} color={OAK_DARK} size={0.25} />);
  blocks.push(<Block key="sg-board" position={[2, 2, 9]} color={OAK} size={0.9} />);

  return (
    <group position={base}>
      {blocks}
      <Float floatIntensity={0.6}>
        <Text position={[2, 3.4, 9]} fontSize={0.45} color="#fff" outlineColor="#000" outlineWidth={0.05}>
          ABOUT ME
        </Text>
      </Float>
      <Sparkles count={20} scale={[12, 3, 12]} size={1.4} color="#fff5c2" speed={0.4} position={[0, 2, 0]} />
      <ZoneLabel position={[0, 8, 0]} color="#8ecae6">ABOUT VILLAGE</ZoneLabel>
    </group>
  );
}

/* FACTORY — animated machines */
export function Factory() {
  const base = ZONES_LOCAL.factory;
  const skills = ["React", "Node.js", "Python", "Three.js", "AI/ML", "Mongo"];
  // Stepped cobble pyramid leading from ground to the central core platform.
  // 4 steps × 1 block tall — each step is walkable (player JUMP allows ≤1.1u).
  const stairs: React.ReactElement[] = [];
  for (let s = 0; s < 4; s++) {
    const inner = s;            // shrinking ring toward center
    const outer = 3 - s;        // top step is 1×1
    for (let x = -outer; x <= outer; x++) {
      for (let z = -outer; z <= outer; z++) {
        const onRing = Math.max(Math.abs(x), Math.abs(z)) > inner;
        if (onRing) {
          stairs.push(
            <Block key={`st-${s}-${x}-${z}`} position={[x, s + 1, z]} color={s % 2 ? "#7c8087" : "#8a8d92"} />
          );
        }
      }
    }
  }
  return (
    <group position={base}>
      {skills.map((s, i) => {
        const angle = (i / skills.length) * Math.PI * 2;
        const r = 6;
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        return <Machine key={s} label={s} position={[x, 1, z]} hue={i / skills.length} />;
      })}
      {stairs}
      {/* Central core sits just above the top stair (y=4) */}
      <CoreOrb position={[0, 5.2, 0]} />
      <ZoneLabel position={[0, 10, 0]} color="#fb8500">SKILLS FACTORY</ZoneLabel>
    </group>
  );
}

function Machine({ position, label, hue }: { position: [number, number, number]; label: string; hue: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const color = useMemo(() => new THREE.Color().setHSL(hue * 0.85, 0.7, 0.55).getStyle(), [hue]);
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * (0.6 + hue);
  });
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshLambertMaterial color="#3a3f48" />
      </mesh>
      <mesh ref={ref} position={[0, 2, 0]} castShadow>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} metalness={0.3} roughness={0.4} />
      </mesh>
      <Float floatIntensity={0.4} speed={2}>
        <Text position={[0, 4.3, 0]} fontSize={0.5} color={color} outlineColor="#000" outlineWidth={0.04}>
          {label}
        </Text>
      </Float>
      <Sparkles count={12} scale={[2, 3, 2]} size={2} color={color} speed={1.5} position={[0, 2, 0]} />
    </group>
  );
}

function CoreOrb({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.x = s.clock.elapsedTime * 0.4;
      ref.current.rotation.y = s.clock.elapsedTime * 0.6;
      const sc = 1 + Math.sin(s.clock.elapsedTime * 2) * 0.05;
      ref.current.scale.setScalar(sc);
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[1.5, 0]} />
      <meshStandardMaterial color="#fb8500" emissive="#fb8500" emissiveIntensity={1.2} />
    </mesh>
  );
}

/* PROJECTS BIOME — a small voxel tech city: paved plaza, four themed
 * buildings around a fountain, street lamps, benches, and signage.
 * Aims for "realistic Minecraft town" instead of floating pillars. */
export function Projects() {
  const base = ZONES_LOCAL.projects;

  // Palette
  const PAVE_LIGHT = "#b9b6ad";
  const PAVE_DARK = "#8d8a82";
  const PAVE_EDGE = "#5b5953";
  const GRASS_TRIM = "#5fa85a";
  const WATER = "#5fbfe0";
  const LAMP_POST = "#2b2b2b";
  const LAMP_BULB = "#ffe6a8";

  const projects = [
    { name: "AI Lab",      color: "#42e2f5", accent: "#0a3d4a", roof: "#0e6b80", glass: "#9eefff" },
    { name: "Web Studio",  color: "#ffafcc", accent: "#5a2741", roof: "#8a3559", glass: "#ffd6e6" },
    { name: "Data Tower",  color: "#bde0fe", accent: "#23456b", roof: "#2f5d8f", glass: "#dceefd" },
    { name: "Game Arena",  color: "#fdc500", accent: "#5a4400", roof: "#8a6a00", glass: "#fff1a8" },
  ];

  const blocks: React.ReactElement[] = [];

  // --- Plaza foundation (24x24 paved square with checker + grass border) ---
  const R = 12;
  for (let x = -R; x <= R; x++) {
    for (let z = -R; z <= R; z++) {
      const edge = Math.max(Math.abs(x), Math.abs(z));
      if (edge === R) {
        blocks.push(<Block key={`pe-${x}-${z}`} position={[x, 0, z]} color={PAVE_EDGE} />);
      } else if (edge === R - 1) {
        blocks.push(<Block key={`pg-${x}-${z}`} position={[x, 0, z]} color={GRASS_TRIM} />);
      } else {
        const checker = (x + z) % 2 === 0 ? PAVE_LIGHT : PAVE_DARK;
        blocks.push(<Block key={`pv-${x}-${z}`} position={[x, 0, z]} color={checker} />);
      }
    }
  }

  // --- Central fountain (3x3 stone rim, water inside, 1-block jet) ---
  for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
      const onRim = Math.max(Math.abs(x), Math.abs(z)) === 2;
      if (onRim) blocks.push(<Block key={`fr-${x}-${z}`} position={[x, 1, z]} color="#9a9690" />);
    }
  }
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      blocks.push(
        <mesh key={`fw-${x}-${z}`} position={[x, 1, z]} geometry={SHADED_BOX} receiveShadow>
          <meshStandardMaterial color={WATER} transparent opacity={0.85} roughness={0.2} metalness={0.1} />
        </mesh>
      );
    }
  }
  // jet
  blocks.push(<Block key="jet" position={[0, 2, 0]} color={WATER} emissive={WATER} />);

  // --- Walkways from plaza center to each building corner ---
  // (handled by checker — buildings sit at corners)

  // --- Street lamps at four mid-edges ---
  const lampPositions: [number, number][] = [
    [0, -R + 2], [0, R - 2], [-R + 2, 0], [R - 2, 0],
  ];
  lampPositions.forEach(([lx, lz], i) => {
    blocks.push(<Block key={`lp1-${i}`} position={[lx, 1, lz]} color={LAMP_POST} size={0.25} />);
    blocks.push(<Block key={`lp2-${i}`} position={[lx, 2, lz]} color={LAMP_POST} size={0.25} />);
    blocks.push(<Block key={`lp3-${i}`} position={[lx, 3, lz]} color={LAMP_POST} size={0.25} />);
    blocks.push(<Block key={`lb-${i}`} position={[lx, 3.6, lz]} color={LAMP_BULB} emissive={LAMP_BULB} size={0.55} />);
  });

  // --- Benches (two log seats + slab back) at cardinal sides ---
  const benchSides: [number, number, number][] = [
    [5, 0, -8], [-5, 0, -8], [5, 0, 8], [-5, 0, 8],
  ];
  benchSides.forEach(([bx, , bz], i) => {
    for (let dx = -1; dx <= 1; dx++) {
      blocks.push(<Block key={`bs-${i}-${dx}`} position={[bx + dx, 1, bz]} color="#7a4f29" size={0.85} />);
    }
  });

  // --- Four buildings, one per corner ---
  const cornerOffsets: [number, number][] = [
    [-8, -8], [8, -8], [-8, 8], [8, 8],
  ];

  projects.forEach((p, i) => {
    const [cx, cz] = cornerOffsets[i];
    const w = 5, d = 5, h = 5; // base footprint + height
    // Foundation (cobble)
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < d; z++) {
        blocks.push(<Block key={`bf-${i}-${x}-${z}`} position={[cx + x - 2, 1, cz + z - 2]} color="#7c8087" />);
      }
    }
    // Walls (accent color), with a doorway facing plaza center
    const doorSide = cx < 0 && cz < 0 ? "++" : cx > 0 && cz < 0 ? "-+" : cx < 0 && cz > 0 ? "+-" : "--";
    for (let y = 2; y <= h; y++) {
      for (let x = -2; x <= 2; x++) {
        for (let z = -2; z <= 2; z++) {
          const onEdge = Math.abs(x) === 2 || Math.abs(z) === 2;
          if (!onEdge) continue;
          // doorway (2-block tall) on the side facing the plaza
          const isDoorFront =
            (doorSide.includes("+") ? z === -2 : z === 2) && x === 0 && (y === 2 || y === 3);
          const isDoorSide =
            (doorSide[0] === "+" ? x === -2 : x === 2) && z === 0 && (y === 2 || y === 3);
          if (isDoorFront || isDoorSide) continue;
          // windows: middle ring y=3 at x=±1 or z=±1 (corners)
          const isWindow = y === 3 && ((Math.abs(x) === 2 && Math.abs(z) === 1) || (Math.abs(z) === 2 && Math.abs(x) === 1));
          if (isWindow) {
            blocks.push(
              <mesh key={`bg-${i}-${x}-${y}-${z}`} position={[cx + x, y, cz + z]} geometry={SHADED_BOX} castShadow receiveShadow>
                <meshPhysicalMaterial color={p.glass} emissive={p.glass} emissiveIntensity={0.35} transmission={0.7} thickness={0.3} roughness={0.1} transparent opacity={0.7} />
              </mesh>
            );
          } else {
            blocks.push(<Block key={`bw-${i}-${x}-${y}-${z}`} position={[cx + x, y, cz + z]} color={p.accent} />);
          }
        }
      }
    }
    // Pitched roof — two-step pyramid
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        blocks.push(<Block key={`br1-${i}-${x}-${z}`} position={[cx + x, h + 1, cz + z]} color={p.roof} />);
      }
    }
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        blocks.push(<Block key={`br2-${i}-${x}-${z}`} position={[cx + x, h + 2, cz + z]} color={p.roof} />);
      }
    }
    // Roof beacon — themed glowing block
    blocks.push(<Block key={`bc-${i}`} position={[cx, h + 3, cz]} color={p.color} emissive={p.color} size={0.7} />);

    // Floating label above each building
    blocks.push(
      <Float key={`bl-${i}`} floatIntensity={0.5} speed={1.4}>
        <Text position={[cx, h + 5, cz]} fontSize={0.7} color={p.color} outlineColor="#000" outlineWidth={0.05}>
          {p.name}
        </Text>
      </Float>
    );
    blocks.push(
      <Sparkles key={`sp-${i}`} count={14} scale={[3, 4, 3]} size={1.6} color={p.color} speed={0.8} position={[cx, h + 2, cz]} />
    );
  });

  return (
    <group position={base}>
      {blocks}
      <Sparkles count={30} scale={[4, 3, 4]} size={1.8} color={WATER} speed={1.2} position={[0, 2.5, 0]} />
      <ZoneLabel position={[0, 14, 0]} color="#a663cc">PROJECTS DISTRICT</ZoneLabel>
    </group>
  );
}

/* MOUNTAIN — terrain is a climbable dome (see Terrain.plateauAdjust).
 * We only add a snow cap, summit flag, checkpoint banners and decoration. */
export function Mountain() {
  const base = ZONES_LOCAL.mountain;
  const blocks: React.ReactElement[] = [];

  // Snow cap — a small 5×5 platform sitting flush on the dome's summit.
  for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
      if (Math.hypot(x, z) <= 2.4) {
        blocks.push(<Block key={`cap-${x}-${z}`} position={[x, 1, z]} color="#eef4ff" />);
      }
    }
  }
  // Cairn / checkpoint stones at three altitudes around the dome.
  const cairns: [number, number, string][] = [
    [-6, -4, "#7c8087"],
    [5, -7, "#7c8087"],
    [-2, 8, "#7c8087"],
  ];

  return (
    <group position={base}>
      {blocks}
      {cairns.map(([cx, cz, c], i) => {
        const cy = heightAt(base[0] + cx, base[2] + cz) - base[1];
        return (
          <group key={`cn-${i}`} position={[cx, cy, cz]}>
            <Block position={[0, 1, 0]} color={c} />
            <Block position={[0, 2, 0]} color="#5b6066" size={0.6} />
          </group>
        );
      })}
      {/* Summit flag */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 4, 6]} />
        <meshStandardMaterial color="#3a2a1d" />
      </mesh>
      <mesh position={[0.7, 4.7, 0]} castShadow>
        <planeGeometry args={[1.2, 0.7]} />
        <meshStandardMaterial color="#c43b3b" side={THREE.DoubleSide} />
      </mesh>
      <Float floatIntensity={1} speed={1}>
        <Text position={[0, 7, 0]} fontSize={1.2} color="#fff5c2" outlineColor="#000" outlineWidth={0.06}>
          EXPERIENCE
        </Text>
      </Float>
      <Sparkles count={40} scale={[10, 6, 10]} size={3} color="#fff5c2" speed={0.6} position={[0, 3, 0]} />
      <ZoneLabel position={[0, 11, 0]} color="#cdb4db">EXPERIENCE PEAK</ZoneLabel>
    </group>
  );
}

/* PORTAL — ring of obsidian + animated portal plane */
export function ContactPortal() {
  const base = ZONES_LOCAL.portal;
  const portalRef = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (portalRef.current) {
      const m = portalRef.current.material as THREE.ShaderMaterial;
      m.uniforms.uTime.value = s.clock.elapsedTime;
    }
  });

  // Frame around portal
  const frame: React.ReactElement[] = [];
  for (let y = 0; y < 5; y++) {
    for (let x = -2; x <= 2; x++) {
      if (y === 0 || y === 4 || x === -2 || x === 2) {
        frame.push(<Block key={`f-${x}-${y}`} position={[x, y + 1, 0]} color="#1c0a2e" emissive="#3a0ca3" />);
      }
    }
  }

  const shader = useMemo(() => ({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      // Simple swirling portal
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
      }
      void main(){
        vec2 uv = vUv - 0.5;
        float a = atan(uv.y, uv.x);
        float r = length(uv);
        float n = noise(vec2(a*3.0 + uTime*0.6, r*8.0 - uTime*1.2));
        vec3 col = mix(vec3(0.45,0.1,0.7), vec3(0.1,0.85,1.0), n);
        col += pow(1.0 - r*1.8, 3.0) * vec3(1.0, 0.8, 1.0);
        float alpha = smoothstep(0.5, 0.2, r);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
  }), []);

  return (
    <group position={base}>
      {frame}
      <mesh ref={portalRef} position={[0, 3, 0.1]}>
        <planeGeometry args={[3.6, 4.2]} />
        <shaderMaterial args={[shader]} />
      </mesh>
      <Sparkles count={50} scale={[6, 8, 2]} size={3} color="#c77dff" speed={1.2} position={[0, 3, 0]} />
      <ZoneLabel position={[0, 9, 0]} color="#c77dff">CONTACT PORTAL</ZoneLabel>
    </group>
  );
}

import { ZONES } from "@/store/game";
import { heightAt } from "./Terrain";

function grounded(id: keyof typeof ZONES): [number, number, number] {
  const [x, , z] = ZONES[id].position;
  // Terrain top of block 'h' is at y = h + 0.5. Components place their first
  // row at local y=1 (bottom at group_y + 0.5), so group_y = heightAt(x,z).
  return [x, heightAt(x, z), z];
}

const ZONES_LOCAL = {
  village: grounded("village"),
  factory: grounded("factory"),
  projects: grounded("projects"),
  mountain: grounded("mountain"),
  portal: grounded("portal"),
} as const;

/* PLAYER HOUSE — spawn cabin with bed, crafting table, furnace, chest, torches */
export function PlayerHouse() {
  const cx = -16, cz = 10;
  const gy = heightAt(cx, cz) + 1;

  // Materials palette
  const OAK = "#b6824a";
  const OAK_DARK = "#7a4f29";
  const COBBLE = "#8a8d92";
  const STONE_DARK = "#3e4147";
  const ROOF = "#7a2e2e";
  const ROOF_DARK = "#5a1f1f";
  const PLANK_FLOOR = "#caa472";

  const blocks: React.ReactElement[] = [];
  const W = 7, D = 6, H = 4;

  // Floor (planks)
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
      blocks.push(<Block key={`fl-${x}-${z}`} position={[x - 3, 0, z - 2]} color={PLANK_FLOOR} />);
    }
  }
  // Walls
  for (let x = -3; x <= 3; x++) {
    for (let y = 1; y <= H; y++) {
      // back wall
      blocks.push(<Block key={`bw-${x}-${y}`} position={[x, y, -3]} color={x === 0 || x === 0 ? OAK : OAK_DARK} />);
      // front wall — leave doorway at x=0,y=1,2
      if (!(x === 0 && (y === 1 || y === 2))) {
        // window slot at x=±2 y=2
        if ((x === -2 || x === 2) && y === 2) {
          blocks.push(
            <mesh key={`gw-${x}-${y}`} position={[x, y, 3]} castShadow receiveShadow geometry={SHADED_BOX}>
              <meshPhysicalMaterial color="#b8e8ff" transmission={0.85} thickness={0.4} roughness={0.05} ior={1.45} transparent opacity={0.55} />
            </mesh>
          );
        } else {
          blocks.push(<Block key={`fw-${x}-${y}`} position={[x, y, 3]} color={x % 2 === 0 ? OAK : OAK_DARK} />);
        }
      }
    }
  }
  for (let z = -2; z <= 2; z++) {
    for (let y = 1; y <= H; y++) {
      // window on left wall y=2 z=0
      if (z === 0 && y === 2) {
        blocks.push(
          <mesh key={`glw-${z}-${y}`} position={[-3, y, z]} castShadow receiveShadow geometry={SHADED_BOX}>
            <meshPhysicalMaterial color="#b8e8ff" transmission={0.85} thickness={0.4} roughness={0.05} ior={1.45} transparent opacity={0.55} />
          </mesh>
        );
        blocks.push(
          <mesh key={`grw-${z}-${y}`} position={[3, y, z]} castShadow receiveShadow geometry={SHADED_BOX}>
            <meshPhysicalMaterial color="#b8e8ff" transmission={0.85} thickness={0.4} roughness={0.05} ior={1.45} transparent opacity={0.55} />
          </mesh>
        );
      } else {
        blocks.push(<Block key={`lw-${z}-${y}`} position={[-3, y, z]} color={z % 2 === 0 ? OAK : OAK_DARK} />);
        blocks.push(<Block key={`rw-${z}-${y}`} position={[3, y, z]} color={z % 2 === 0 ? OAK : OAK_DARK} />);
      }
    }
  }
  // Cobblestone foundation ring — drop one block below the floor so it
  // reads as a basement edge and doesn't z-fight with the plank floor.
  for (let x = -3; x <= 3; x++) {
    blocks.push(<Block key={`fb-${x}`} position={[x, -1, -3]} color={COBBLE} />);
    blocks.push(<Block key={`ff-${x}`} position={[x, -1, 3]} color={COBBLE} />);
  }
  for (let z = -2; z <= 2; z++) {
    blocks.push(<Block key={`fl2-${z}`} position={[-3, -1, z]} color={COBBLE} />);
    blocks.push(<Block key={`fr2-${z}`} position={[3, -1, z]} color={COBBLE} />);
  }
  // Pitched roof — two slopes meeting at center
  for (let z = -3; z <= 3; z++) {
    const offset = Math.abs(z);
    const ry = H + 1 + (3 - offset);
    for (let x = -3; x <= 3; x++) {
      blocks.push(<Block key={`rf-${x}-${z}`} position={[x, ry, z]} color={offset === 0 ? ROOF_DARK : ROOF} />);
    }
  }

  return (
    <group position={[cx, gy, cz]}>
      {blocks}

      {/* Door frame indicators */}
      <Block position={[-1, 1, 3]} color={OAK_DARK} />
      <Block position={[1, 1, 3]} color={OAK_DARK} />

      {/* Bed (red wool + white pillow) */}
      <mesh position={[-2, 1.3, -2]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.5, 2.4]} />
        <meshStandardMaterial color="#c43b3b" roughness={0.95} />
      </mesh>
      <mesh position={[-2, 1.5, -2.9]} castShadow>
        <boxGeometry args={[1.4, 0.3, 0.5]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.9} />
      </mesh>

      {/* Crafting table */}
      <group position={[2, 1, -2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#8a5a2a" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.51, 0]} castShadow>
          <boxGeometry args={[1.01, 0.05, 1.01]} />
          <meshStandardMaterial color="#3a2a1d" roughness={0.7} />
        </mesh>
      </group>

      {/* Furnace */}
      <group position={[1, 1, -2.4]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1.2, 1]} />
          <meshStandardMaterial color={STONE_DARK} roughness={0.9} />
        </mesh>
        {/* Glowing fire mouth */}
        <mesh position={[0, -0.05, 0.51]}>
          <planeGeometry args={[0.55, 0.4]} />
          <meshBasicMaterial color="#ffb347" toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0.2, 1]} color="#ff8a3c" intensity={1.6} distance={6} decay={1.6} />
      </group>

      {/* Chest */}
      <group position={[2.1, 1, 1.5]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.9, 0.9]} />
          <meshStandardMaterial color="#9b6a2c" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.1, 0.46]} castShadow>
          <boxGeometry args={[0.18, 0.18, 0.05]} />
          <meshStandardMaterial color="#3a2a1d" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* Torches on walls */}
      {[
        [-2.9, 2.5, -1.5],
        [-2.9, 2.5, 1.5],
        [2.9, 2.5, -1.5],
        [2.9, 2.5, 1.5],
      ].map(([x, y, z], i) => (
        <group key={`t-${i}`} position={[x, y, z]}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.06, 0.5, 6]} />
            <meshStandardMaterial color="#5a3a1d" />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshBasicMaterial color="#ffd27a" toneMapped={false} />
          </mesh>
          <pointLight color="#ffb05a" intensity={1.2} distance={7} decay={1.6} position={[0, 0.4, 0]} />
        </group>
      ))}

      {/* Outdoor lantern + path stones */}
      <group position={[0, 0.5, 5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2.5, 6]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color="#fff1b8" toneMapped={false} />
        </mesh>
        <pointLight position={[0, 1.4, 0]} color="#ffd27a" intensity={2.2} distance={14} decay={1.5} />
      </group>

      {/* Welcome sign */}
      <group position={[-1.5, 1.4, 4.2]} rotation={[0, 0.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.6, 0.9, 0.08]} />
          <meshStandardMaterial color="#8a5a2a" roughness={0.9} />
        </mesh>
        <Text position={[0, 0, 0.06]} fontSize={0.22} color="#fff" outlineColor="#000" outlineWidth={0.02} maxWidth={1.4} textAlign="center">
          WELCOME{"\n"}HOME
        </Text>
      </group>

      <ZoneLabel position={[0, 9, 0]} color="#ffd27a">SPAWN HOUSE</ZoneLabel>
    </group>
  );
}

/* TREES, ROCKS & BUSHES — scattered nature, all grounded to terrain.
 * - Trees only on grass (1 ≤ h ≤ 5), never in water or on stone/snow.
 * - Varied canopy shapes (oak / pine) and trunk heights for realism.
 * - Rocks cluster on stone (h ≥ 5), bushes on grass.
 */
export function Trees() {
  const { trees, rocks, bushes } = useMemo(() => {
    const trees: { x: number; z: number; y: number; kind: "oak" | "pine"; h: number; seed: number }[] = [];
    const rocks: { x: number; z: number; y: number; s: number }[] = [];
    const bushes: { x: number; z: number; y: number }[] = [];
    let seed = 1;
    const rng = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    for (let i = 0; i < 260; i++) {
      const x = Math.round((rng() - 0.5) * 90);
      const z = Math.round((rng() - 0.5) * 90);
      // Keep clear of every zone so nothing pokes through buildings
      if (Object.values(ZONES).some((zo) => Math.hypot(x - zo.position[0], z - zo.position[2]) < 12)) continue;
      // Keep clear of the player house
      if (Math.hypot(x - -16, z - 10) < 8) continue;
      const y = heightAt(x, z);

      if (y >= 1 && y <= 5) {
        // Grass biome — trees + bushes
        const r = rng();
        if (r < 0.78) {
          trees.push({
            x, z, y,
            kind: rng() > 0.55 ? "pine" : "oak",
            h: 3 + Math.floor(rng() * 3), // 3..5 trunk
            seed: Math.floor(rng() * 9999),
          });
        } else {
          bushes.push({ x, z, y });
        }
      } else if (y >= 6 && y <= 9) {
        // Foothills — small rocks
        if (rng() > 0.5) rocks.push({ x, z, y, s: 0.8 + rng() * 0.6 });
      }
    }
    return { trees, rocks, bushes };
  }, []);

  return (
    <group>
      {trees.map((t, i) => {
        const blocks: React.ReactElement[] = [];
        // trunk
        for (let h = 0; h < t.h; h++) {
          blocks.push(<Block key={`tr-${h}`} position={[0, h + 1, 0]} color="#5a3a1d" />);
        }
        if (t.kind === "pine") {
          // Conifer: stacked shrinking leaf layers above trunk
          const top = t.h + 1;
          blocks.push(<Block key="p1" position={[0, top, 0]} color="#2f6a32" size={2.4} />);
          blocks.push(<Block key="p2" position={[0, top + 1, 0]} color="#3f7a3a" size={1.8} />);
          blocks.push(<Block key="p3" position={[0, top + 2, 0]} color="#5fa85a" size={1.1} />);
        } else {
          // Oak: bushy round canopy as a 3x3x2 cluster
          const ly = t.h + 1;
          for (let lx = -1; lx <= 1; lx++) {
            for (let lz = -1; lz <= 1; lz++) {
              for (let ldy = 0; ldy <= 1; ldy++) {
                // Skip corners of the top layer for a rounder silhouette
                if (ldy === 1 && Math.abs(lx) === 1 && Math.abs(lz) === 1) continue;
                const tint = (lx + lz + ldy + t.seed) % 3 === 0 ? "#3f7a3a" : "#5fa85a";
                blocks.push(<Block key={`o-${lx}-${lz}-${ldy}`} position={[lx, ly + ldy, lz]} color={tint} />);
              }
            }
          }
        }
        return <group key={`t-${i}`} position={[t.x, t.y, t.z]}>{blocks}</group>;
      })}

      {rocks.map((r, i) => (
        <group key={`rk-${i}`} position={[r.x, r.y, r.z]}>
          <Block position={[0, 1, 0]} color="#7c8087" size={r.s} />
          {r.s > 1.1 && <Block position={[0.4, 1.6, 0.2]} color="#5b6066" size={r.s * 0.6} />}
        </group>
      ))}

      {bushes.map((b, i) => (
        <group key={`bu-${i}`} position={[b.x, b.y, b.z]}>
          <Block position={[0, 0.8, 0]} color="#3f7a3a" size={0.9} />
          <Block position={[0.3, 1.2, 0.1]} color="#5fa85a" size={0.6} />
        </group>
      ))}
    </group>
  );
}
