import { useMemo } from "react";
import * as THREE from "three";
import { ZONES } from "@/store/game";

// Deterministic pseudo-random
function rand(x: number, z: number) {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

// Flatten plateaus around each zone so structures sit on solid, level ground
function plateauAdjust(x: number, z: number, base: number) {
  let h = base;
  for (const zone of Object.values(ZONES)) {
    const [zx, , zz] = zone.position;
    const d = Math.hypot(x - zx, z - zz);
    if (d < 16) {
      const target = zone.id === "mountain" ? 6 : zone.id === "portal" ? -1 : 1;
      const blend = Math.min(1, (16 - d) / 12);
      h = h * (1 - blend) + target * blend;
    }
  }
  return h;
}

function heightAt(x: number, z: number) {
  const base =
    Math.sin(x * 0.08) * 1.2 +
    Math.cos(z * 0.07) * 1.2 +
    Math.sin((x + z) * 0.04) * 1.5 +
    rand(Math.floor(x), Math.floor(z)) * 0.6;
  return Math.round(plateauAdjust(x, z, base));
}

interface Props {
  size?: number;
}

const GRASS = new THREE.Color("#5fa85a");
const GRASS_DARK = new THREE.Color("#3f7a3a");
const GRASS_DRY = new THREE.Color("#7fb96a");
const SAND = new THREE.Color("#e8d39b");
const STONE = new THREE.Color("#7c8087");
const STONE_DARK = new THREE.Color("#5b6066");
const SNOW = new THREE.Color("#eef4ff");
const DIRT = new THREE.Color("#6b4a2b");
const DIRT_DARK = new THREE.Color("#4d3520");

/** Procedural pixel noise texture — adds surface detail to every voxel. */
function makeNoiseTexture(seed = 1, contrast = 35) {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(32, 32);
  let s = seed;
  const rng = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < 32 * 32; i++) {
    const n = 220 + Math.floor((rng() - 0.5) * contrast);
    img.data[i * 4] = n;
    img.data[i * 4 + 1] = n;
    img.data[i * 4 + 2] = n;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestMipmapLinearFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

/** Build a 1x1x1 box with per-face shading baked into vertex colors.
 *  Top is bright, bottom dark, +Z/-Z slightly different — that "Minecraft pop". */
function makeShadedBox() {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  // Face order in BoxGeometry: +X, -X, +Y(top), -Y(bottom), +Z, -Z
  const faceShade = [0.88, 0.86, 1.18, 0.55, 0.96, 0.80];
  const colors = new Float32Array(24 * 3);
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = (f * 4 + v) * 3;
      const s = faceShade[f];
      colors[i] = s;
      colors[i + 1] = s;
      colors[i + 2] = s;
    }
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

/**
 * Instanced voxel terrain — one big InstancedMesh.
 * Adds noise texture + per-face shading + richer biome color variation.
 */
export default function Terrain({ size = 180 }: Props) {
  const { positions, colors } = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    const half = size / 2;
    for (let x = -half; x < half; x++) {
      for (let z = -half; z < half; z++) {
        const h = heightAt(x, z);

        // top block color with subtle per-block variation
        const c = new THREE.Color();
        const r = rand(x + 1, z + 3);
        if (h >= 10) {
          c.copy(SNOW).offsetHSL(0, 0, (r - 0.5) * 0.04);
        } else if (h >= 5) {
          c.copy(r > 0.5 ? STONE : STONE_DARK).offsetHSL(0, 0, (rand(x, z) - 0.5) * 0.05);
        } else if (h <= -1) {
          c.copy(SAND).offsetHSL(0, (r - 0.5) * 0.1, (r - 0.5) * 0.06);
        } else {
          const pick = r;
          if (pick > 0.66) c.copy(GRASS);
          else if (pick > 0.33) c.copy(GRASS_DARK);
          else c.copy(GRASS_DRY);
          c.offsetHSL((rand(x + 7, z + 11) - 0.5) * 0.02, 0, (rand(x + 5, z) - 0.5) * 0.05);
        }

        pos.push(x, h, z);
        col.push(c.r, c.g, c.b);

        // stacked dirt/stone beneath
        for (let d = 1; d <= 2; d++) {
          pos.push(x, h - d, z);
          const dc = h - d > 4
            ? (rand(x + d, z) > 0.5 ? STONE : STONE_DARK)
            : (rand(x, z + d) > 0.5 ? DIRT : DIRT_DARK);
          col.push(dc.r, dc.g, dc.b);
        }
      }
    }
    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(col),
    };
  }, [size]);

  const count = positions.length / 3;

  const mesh = useMemo(() => {
    const geo = makeShadedBox();
    const map = makeNoiseTexture(7, 40);
    const mat = new THREE.MeshStandardMaterial({
      map,
      vertexColors: true,
      roughness: 0.95,
      metalness: 0,
      flatShading: true,
    });
    const m = new THREE.InstancedMesh(geo, mat, count);
    m.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    const dummy = new THREE.Object3D();
    const colorAttr = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    for (let i = 0; i < count; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      colorAttr.setXYZ(i, colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]);
    }
    m.instanceColor = colorAttr;
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }, [positions, colors, count]);

  return (
    <group>
      <primitive object={mesh} />
      {/* Water plane fills low areas (sand biome) */}
      <Water />
    </group>
  );
}

function Water() {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uShallow: { value: new THREE.Color("#7fd6e8") },
      uDeep: { value: new THREE.Color("#1a4a6e") },
    }),
    []
  );

  useFrame((_, dt) => {
    if (matRef.current) {
      (matRef.current.uniforms.uTime.value as number) += dt;
    }
  });

  return (
    <mesh
      ref={ref}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.05, 0]}
      receiveShadow
    >
      {/* Match terrain footprint (90×90) with enough subdivisions for waves */}
      <planeGeometry args={[90, 90, 80, 80]} />
      <shaderMaterial
        ref={matRef}
        transparent
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime;
          varying vec2 vUv;
          varying float vWave;
          void main() {
            vUv = uv;
            vec3 p = position;
            float w =
              sin(p.x * 0.6 + uTime * 1.2) * 0.08 +
              cos(p.y * 0.5 + uTime * 0.9) * 0.08 +
              sin((p.x + p.y) * 0.3 + uTime * 0.6) * 0.05;
            p.z += w;
            vWave = w;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform vec3 uShallow;
          uniform vec3 uDeep;
          varying vec2 vUv;
          varying float vWave;
          float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
          void main() {
            // animated sparkle/foam stripes
            float stripes = sin((vUv.x + vUv.y) * 80.0 + uTime * 1.5) * 0.5 + 0.5;
            float foam = smoothstep(0.85, 1.0, stripes) * 0.25;
            vec3 col = mix(uDeep, uShallow, 0.55 + vWave * 1.5);
            col += foam;
            gl_FragColor = vec4(col, 0.78);
          }
        `}
      />
    </mesh>
  );
}

export { heightAt };
