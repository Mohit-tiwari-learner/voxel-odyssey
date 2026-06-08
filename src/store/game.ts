import { create } from "zustand";

export type ZoneId =
  | "spawn"
  | "village"
  | "factory"
  | "projects"
  | "mountain"
  | "portal";

export interface Zone {
  id: ZoneId;
  name: string;
  hint: string;
  position: [number, number, number];
  color: string;
}

// Map layout (top-down, all inside 90×90 terrain, half-extent = 45):
//
//   portal(-32,-32) . . . mountain(32,-32)
//             .   projects(0,-36)  .
//   village(-32,-8) . . . factory(32,-8)
//           house(-16,10)  spawn(0,0)
//
// Every zone is well inside ±40 so it has solid ground beneath it.
export const ZONES: Record<ZoneId, Zone> = {
  spawn:    { id: "spawn",    name: "Spawn Valley",     hint: "Walk forward — the world awaits",       position: [0, 0, 0],     color: "#f6c453" },
  village:  { id: "village",  name: "About Village",    hint: "Meet the developer behind the blocks",  position: [-32, 0, -8],  color: "#8ecae6" },
  factory:  { id: "factory",  name: "Skills Factory",   hint: "Industrial machines forge each skill",  position: [32, 0, -8],   color: "#fb8500" },
  projects: { id: "projects", name: "Projects Biome",   hint: "Explore living project worlds",         position: [0, 0, -34],   color: "#a663cc" },
  mountain: { id: "mountain", name: "Experience Peak",  hint: "Ascend to view the career timeline",    position: [32, 0, -32],  color: "#cdb4db" },
  portal:   { id: "portal",   name: "Contact Portal",   hint: "Step through to send a message",        position: [-32, 0, -32], color: "#c77dff" },
};

interface GameState {
  loaded: boolean;
  started: boolean;
  introPlaying: boolean;
  pointerLocked: boolean;
  currentZone: ZoneId;
  unlocked: Set<ZoneId>;
  interactionTarget: string | null;
  dialog: { title: string; body: string } | null;
  setLoaded: (v: boolean) => void;
  start: () => void;
  finishIntro: () => void;
  setPointerLocked: (v: boolean) => void;
  setZone: (z: ZoneId) => void;
  unlock: (z: ZoneId) => void;
  setInteraction: (t: string | null) => void;
  openDialog: (d: { title: string; body: string } | null) => void;
}

export const useGame = create<GameState>((set) => ({
  loaded: false,
  started: false,
  introPlaying: false,
  pointerLocked: false,
  currentZone: "spawn",
  unlocked: new Set(["spawn"]),
  interactionTarget: null,
  dialog: null,
  setLoaded: (v) => set({ loaded: v }),
  start: () => set({ started: true, introPlaying: true }),
  finishIntro: () => set({ introPlaying: false }),
  setPointerLocked: (v) => set({ pointerLocked: v }),
  setZone: (z) => set((s) => ({
    currentZone: z,
    unlocked: new Set([...s.unlocked, z]),
  })),
  unlock: (z) => set((s) => ({ unlocked: new Set([...s.unlocked, z]) })),
  setInteraction: (t) => set({ interactionTarget: t }),
  openDialog: (d) => set({ dialog: d }),
}));
