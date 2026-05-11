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

export const ZONES: Record<ZoneId, Zone> = {
  spawn:    { id: "spawn",    name: "Spawn Valley",     hint: "Walk forward — the world awaits",       position: [0, 0, 0],     color: "#f6c453" },
  village:  { id: "village",  name: "About Village",    hint: "Meet the developer behind the blocks",  position: [-40, 0, -10], color: "#8ecae6" },
  factory:  { id: "factory",  name: "Skills Factory",   hint: "Industrial machines forge each skill",  position: [40, 0, -10],  color: "#fb8500" },
  projects: { id: "projects", name: "Projects Biome",   hint: "Explore living project worlds",         position: [0, 0, -55],   color: "#a663cc" },
  mountain: { id: "mountain", name: "Experience Peak",  hint: "Ascend to view the career timeline",    position: [55, 0, -65],  color: "#cdb4db" },
  portal:   { id: "portal",   name: "Contact Portal",   hint: "Step through to send a message",        position: [-55, 0, -65], color: "#c77dff" },
};

interface GameState {
  loaded: boolean;
  started: boolean;
  pointerLocked: boolean;
  currentZone: ZoneId;
  unlocked: Set<ZoneId>;
  interactionTarget: string | null;
  dialog: { title: string; body: string } | null;
  setLoaded: (v: boolean) => void;
  start: () => void;
  setPointerLocked: (v: boolean) => void;
  setZone: (z: ZoneId) => void;
  unlock: (z: ZoneId) => void;
  setInteraction: (t: string | null) => void;
  openDialog: (d: { title: string; body: string } | null) => void;
}

export const useGame = create<GameState>((set) => ({
  loaded: false,
  started: false,
  pointerLocked: false,
  currentZone: "spawn",
  unlocked: new Set(["spawn"]),
  interactionTarget: null,
  dialog: null,
  setLoaded: (v) => set({ loaded: v }),
  start: () => set({ started: true }),
  setPointerLocked: (v) => set({ pointerLocked: v }),
  setZone: (z) => set((s) => ({
    currentZone: z,
    unlocked: new Set([...s.unlocked, z]),
  })),
  unlock: (z) => set((s) => ({ unlocked: new Set([...s.unlocked, z]) })),
  setInteraction: (t) => set({ interactionTarget: t }),
  openDialog: (d) => set({ dialog: d }),
}));
