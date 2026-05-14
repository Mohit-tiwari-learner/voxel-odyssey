# Blockfolio → Ultra-Realistic Voxel World Plan

## Part A — Graphics enhancements that beat the real game

These go *past* vanilla Minecraft (closer to RTX / Distant Horizons / Complementary Shaders look).

### 1. Lighting & atmosphere
- **PBR materials** for every block (albedo + normal + roughness + AO maps instead of flat color + noise).
- **Soft contact shadows + cascaded shadow maps** (PCSS) for crisp tree/house shadows.
- **Volumetric god-rays** through tree canopies and the portal frame.
- **HDR sky + real sun disk** (Sky shader already there — add `Environment` HDRI for reflections on water/metal).
- **SSR (screen-space reflections)** on water instead of the flat plane we have now.
- **SSAO** in the post pipeline for crevice darkening between blocks.
- **Bloom tuned per-emissive** (portal, lanterns, machine cores) — already partly in.
- **Color grading LUT** + filmic tone mapping (ACES) for that "cover-art" punch.

### 2. World detail
- **Sub-voxel geometry** — bevelled block edges, grass tufts on top faces, pebbles on stone, snow micro-displacement.
- **Animated foliage** — leaves and grass sway via vertex shader wind.
- **Realistic water** — Gerstner waves, foam at shoreline, caustics on the sand.
- **Particle weather** — drifting pollen by day, fireflies around the portal, light snow on the mountain peak.
- **Distant fog with aerial perspective** (blue-shift over distance) instead of flat fog color.
- **Parallax-occlusion mapping** on stone/wood blocks so faces look 3D up close.

### 3. Performance/scale
- **Greedy meshing** instead of one InstancedMesh per cube → 5-10× more terrain at same FPS.
- **Frustum + distance LOD** — far chunks merge into a low-poly silhouette.
- **Baked AO per vertex** for that "Minecraft + shaders" look without runtime cost.

---

## Part B — Content to reach feature-parity with real Minecraft

Right now we have terrain, trees, 5 zones, a portal, and a robot NPC. To feel like an actual Minecraft world we should add:

### Structures
- **Player house** at spawn (bed, crafting table, furnace, chest, torches, glass windows).
- **Village** upgrade: multiple houses, paths, lamp posts, a well, farm plots with wheat/carrots.
- **Mine entrance** in the mountain side — dark tunnel with torches and ore blocks (coal, iron, diamond glow).
- **Nether-style biome** behind the contact portal (red rock, lava pools, glowstone).
- **Floating islands** above the projects biome, connected by bridges.
- **Ruined temple / dungeon** with loot chest that opens to a project case study.

### Characters / mobs (voxel + idle animations)
- **Steve-style player avatar** (third-person toggle).
- **Villagers** in the About village that wander and "trade" → trigger dialogue popups about you.
- **Cows, pigs, chickens, sheep** roaming the grass biome.
- **Iron golem** guarding the village.
- **Bats** in the mine, **fish** in the water, **bees** around flowers.
- **Friendly wolf / pet** that follows the player.
- **Enderman-style guardian** at the contact portal.

### Interactables
- **Crafting table** that opens a "tech stack" recipe UI.
- **Furnace** smelting animation when hovering Skills Factory.
- **Chests** at each zone that "open" and reveal that zone's content panel.
- **Signposts** with hand-painted text in front of every structure.
- **Jukebox** in the village playing chiptune ambient.
- **Day/night toggle lever** at spawn (you already have the cycle infra).
- **Portal activation** — walk in to teleport (camera fly-through) to contact form.

### Vegetation & decoration
- **Flowers** (poppies, dandelions, blue orchids) scattered in grass biome.
- **Tall grass + ferns**.
- **Different tree types** per biome — oak (have), birch, dark oak, pine on mountain, cherry blossom near projects.
- **Pumpkins + jack-o-lanterns** by the house.
- **Lanterns + fences** lighting paths between zones.

### World-feel
- **Ambient sound** — wind, birds, water lapping, footsteps on grass/stone/wood.
- **Background music** loop (calming C418-style).
- **HUD additions** — hotbar with "inventory" of skills, hearts as a fun health bar that's always full, XP bar that fills as you discover zones, minimap.
- **Achievements popup** ("Discovered: Skills Factory") in Minecraft toast style.

---

## Part C — Suggested build phases (so it stays shippable)

```text
Phase 1  Lighting overhaul        SSAO, ACES, soft shadows, HDRI env, fog aerial
Phase 2  World shell              Greedy mesh + LOD + animated foliage + waves
Phase 3  Player house + signs     Bed, crafting table, furnace, chests, torches
Phase 4  Mobs                     Cows, chickens, villagers, pet wolf w/ wander AI
Phase 5  Mine + Nether biome      Tunnel, ores, lava, glowstone behind portal
Phase 6  Interactables            Chest-opens-panel, furnace=skills, lever=day/night
Phase 7  Audio + HUD polish       Hotbar, hearts, XP bar, ambient + footstep SFX
Phase 8  Post-FX final pass       Volumetric rays, bloom tuning, LUT grading
```

Each phase is independently shippable and visibly upgrades the world.

---

## Where to start

I recommend **Phase 1 + a player house (start of Phase 3)** as the first build — it gives the biggest visible "wow" jump (lighting + a real building at spawn) without rewriting the terrain system.

Tell me which phase(s) to ship first and I'll execute.
