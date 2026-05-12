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
      // target plateau height per zone
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
const SAND = new THREE.Color("#e8d39b");
const STONE = new THREE.Color("#7c8087");
const SNOW = new THREE.Color("#eef4ff");

/**
 * Instanced voxel terrain — one big InstancedMesh.
 * Generates a stylized valley with biome color tinting per zone.
 */
export default function Terrain({ size = 90 }: Props) {
  const { positions, colors } = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    const half = size / 2;
    for (let x = -half; x < half; x++) {
      for (let z = -half; z < half; z++) {
        let h = heightAt(x, z);
        // Carve valleys near zone centers, raise mountain
        const dMountain = Math.hypot(x - 55, z - 65);
        if (dMountain < 18) h += Math.max(0, 14 - dMountain * 0.7);
        // Lower around portal area for drama
        const dPortal = Math.hypot(x + 55, z - 65);
        if (dPortal < 10) h = Math.min(h, 0);

        // top block color
        const c = new THREE.Color();
        if (h >= 10) c.copy(SNOW);
        else if (h >= 5) c.copy(STONE);
        else if (h <= -1) c.copy(SAND);
        else c.copy(rand(x + 1, z + 3) > 0.5 ? GRASS : GRASS_DARK);

        // Top block
        pos.push(x, h, z);
        col.push(c.r, c.g, c.b);

        // A couple stacked dirt/stone blocks beneath for depth visible at edges
        for (let d = 1; d <= 2; d++) {
          pos.push(x, h - d, z);
          const dc = h - d > 4 ? STONE : new THREE.Color("#6b4a2b");
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
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: false });
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
    m.castShadow = false;
    m.receiveShadow = true;
    return m;
  }, [positions, colors, count]);

  return <primitive object={mesh} />;
}

export { heightAt };
