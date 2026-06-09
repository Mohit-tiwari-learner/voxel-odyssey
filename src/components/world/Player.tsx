import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { useGame, ZONES, type ZoneId } from "@/store/game";
import { heightAt } from "./Terrain";

const SPEED = 8;
const SPRINT = 14;
const JUMP = 7;
const GRAVITY = 22;

export default function Player() {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const velocity = useRef(new THREE.Vector3());
  const onGround = useRef(true);
  const keys = useRef<Record<string, boolean>>({});
  const setPointerLocked = useGame((s) => s.setPointerLocked);
  const setZone = useGame((s) => s.setZone);
  const setInteraction = useGame((s) => s.setInteraction);
  const currentZone = useGame((s) => s.currentZone);
  const introPlaying = useGame((s) => s.introPlaying);

  useEffect(() => {
    camera.position.set(0, 6, 14);
    camera.lookAt(0, 3, 0);
    const down = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [camera]);

  useFrame((_, dt) => {
    if (introPlaying) return;
    const d = Math.min(dt, 0.05);
    const k = keys.current;
    const sprint = k["ShiftLeft"] || k["ShiftRight"];
    const speed = sprint ? SPRINT : SPEED;

    // direction relative to camera
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    if (k["KeyW"] || k["ArrowUp"]) move.add(forward);
    if (k["KeyS"] || k["ArrowDown"]) move.sub(forward);
    if (k["KeyD"] || k["ArrowRight"]) move.add(right);
    if (k["KeyA"] || k["ArrowLeft"]) move.sub(right);
    if (move.lengthSq() > 0) move.normalize().multiplyScalar(speed);

    velocity.current.x = move.x;
    velocity.current.z = move.z;

    // jump
    if ((k["Space"]) && onGround.current) {
      velocity.current.y = JUMP;
      onGround.current = false;
    }
    velocity.current.y -= GRAVITY * d;

    // Save previous horizontal position so we can revert if we'd "wall-clip" up
    const prevX = camera.position.x;
    const prevZ = camera.position.z;

    camera.position.x += velocity.current.x * d;
    camera.position.z += velocity.current.z * d;

    // Block horizontal motion into voxel walls — only auto-step up if the rise
    // is at most ~1 block (so the player can't fly up a tower by walking).
    const standY = camera.position.y - 2.6;
    const groundAhead = heightAt(Math.round(camera.position.x), Math.round(camera.position.z));
    const MAX_STEP = 1.1;
    if (onGround.current && groundAhead - standY > MAX_STEP) {
      camera.position.x = prevX;
      camera.position.z = prevZ;
    }

    camera.position.y += velocity.current.y * d;

    // ground collision via terrain heightmap
    const ground = heightAt(Math.round(camera.position.x), Math.round(camera.position.z)) + 2.6;
    if (camera.position.y <= ground) {
      camera.position.y = ground;
      velocity.current.y = 0;
      onGround.current = true;
    } else {
      onGround.current = false;
    }

    // zone detection
    let nearest: ZoneId = "spawn";
    let bestDist = Infinity;
    (Object.values(ZONES)).forEach((z) => {
      const dx = camera.position.x - z.position[0];
      const dz = camera.position.z - z.position[2];
      const d2 = dx * dx + dz * dz;
      if (d2 < bestDist) { bestDist = d2; nearest = z.id; }
    });
    if (bestDist < 18 * 18 && nearest !== currentZone) {
      setZone(nearest);
    }

    // interaction proximity (within 6 of any zone center)
    const z = ZONES[nearest];
    const dist = Math.sqrt(bestDist);
    if (dist < 7 && nearest !== "spawn") {
      setInteraction(z.name);
    } else {
      setInteraction(null);
    }
  });

  return introPlaying ? null : (
    <PointerLockControls
      ref={controlsRef}
      onLock={() => setPointerLocked(true)}
      onUnlock={() => setPointerLocked(false)}
    />
  );
}
