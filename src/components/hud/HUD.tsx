import { useEffect } from "react";
import { useGame, ZONES, type ZoneId } from "@/store/game";
import heroAsset from "@/assets/blockfolio-hero.png.asset.json";
import { Settings, User, Newspaper, Globe, BookOpen, Brush, MessageSquare, Play, DoorOpen } from "lucide-react";

const heroBg = heroAsset.url;

const ZONE_CONTENT: Record<Exclude<ZoneId, "spawn">, { title: string; body: string }> = {
  village: {
    title: "About Me",
    body: "Creative developer crafting immersive web worlds. I blend code, art and motion to build playful, cinematic interfaces. When I'm not shipping pixels, I'm exploring procedural art and game design.",
  },
  factory: {
    title: "Skills Forge",
    body: "React • TypeScript • Three.js / R3F • Node.js • Python • AI / ML • MongoDB • PostgreSQL • GLSL Shaders • GSAP • TailwindCSS • Postprocessing • Rapier physics.",
  },
  projects: {
    title: "Projects Biome",
    body: "AI Lab — neural studio for generative experiments.\nWeb City — full-stack SaaS platform.\nData Towers — analytics dashboard with live streams.\nGame Arena — multiplayer hackathon winner.",
  },
  mountain: {
    title: "Experience Peak",
    body: "Senior Frontend → Creative Engineer → Tech Lead. Multiple shipped products, hackathon wins, open-source contributions and a love for the craft of building delightful software.",
  },
  portal: {
    title: "Contact Portal",
    body: "Step through to reach me:\n• hello@portfolio.dev\n• github.com/you\n• twitter.com/you\nThe portal is always open — say hi.",
  },
};

export default function HUD() {
  const { started, start, loaded, pointerLocked, currentZone, interactionTarget, dialog, openDialog, introPlaying } = useGame();

  // Press E to interact
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyE" && interactionTarget && currentZone !== "spawn") {
        const c = ZONE_CONTENT[currentZone as Exclude<ZoneId, "spawn">];
        if (c) openDialog(c);
      }
      if (e.code === "Escape" && dialog) openDialog(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interactionTarget, currentZone, dialog, openDialog]);

  if (!started) {
    return <LoadingScreen onStart={start} loaded={loaded} />;
  }

  const zone = ZONES[currentZone];

  return (
    <div className="pointer-events-none fixed inset-0 z-40 select-none">
      {/* Crosshair */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-3 w-3 border-2 border-white/80 shadow-[0_0_10px_rgba(0,0,0,0.6)]" />
      </div>

      {/* Top quest bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 hud-panel px-5 py-2 anim-blockfall">
        <div className="pixel-text text-xs uppercase opacity-70">Current Zone</div>
        <div className="pixel-text text-xl glow-gold" style={{ color: zone.color }}>{zone.name}</div>
      </div>

      {/* Quest tracker */}
      <div className="absolute top-4 right-4 hud-panel px-4 py-3 max-w-xs anim-blockfall">
        <div className="pixel-text text-[10px] uppercase opacity-70 mb-1">▸ Quest</div>
        <div className="pixel-text text-base glow-gold leading-tight">{zone.hint}</div>
        <div className="mt-2 pixel-text text-[10px] opacity-60">
          Visited {Array.from(useGame.getState().unlocked).length}/6 zones
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 hud-panel px-4 py-3 anim-blockfall">
        <div className="pixel-text text-[10px] uppercase opacity-70 mb-1">Controls</div>
        <div className="pixel-text text-sm leading-snug">
          <span className="glow-gold">WASD</span> Move &nbsp;
          <span className="glow-gold">Shift</span> Sprint &nbsp;
          <span className="glow-gold">Space</span> Jump<br />
          <span className="glow-gold">Mouse</span> Look &nbsp;
          <span className="glow-gold">E</span> Interact &nbsp;
          <span className="glow-gold">Esc</span> Release
        </div>
      </div>

      {/* Mini hotbar (decorative) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 hud-panel px-2 py-2">
        {(Object.keys(ZONES) as ZoneId[]).map((z, i) => {
          const active = z === currentZone;
          return (
            <div
              key={z}
              className="w-12 h-12 border-2 flex items-center justify-center pixel-text text-xs"
              style={{
                background: active ? ZONES[z].color : "rgba(0,0,0,0.4)",
                borderColor: active ? "#fff" : "rgba(255,255,255,0.3)",
                color: active ? "#1a1a1a" : ZONES[z].color,
                boxShadow: active ? `0 0 14px ${ZONES[z].color}` : "none",
              }}
              title={ZONES[z].name}
            >
              {i + 1}
            </div>
          );
        })}
      </div>

      {/* Pointer-lock prompt */}
      {!pointerLocked && !introPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <div className="hud-panel px-8 py-6 text-center anim-blockfall">
            <div className="pixel-text text-3xl glow-gold mb-2">CLICK TO PLAY</div>
            <div className="pixel-text text-sm opacity-80">Mouse will lock — press Esc to release</div>
          </div>
        </div>
      )}

      {/* Cinematic letterbox during intro */}
      {introPlaying && (
        <>
          <div className="absolute top-0 left-0 right-0 bg-black" style={{ height: '12vh', animation: 'bar-in-top 0.7s ease-out both' }} />
          <div className="absolute bottom-0 left-0 right-0 bg-black" style={{ height: '12vh', animation: 'bar-in-bottom 0.7s ease-out both' }} />
          <div className="absolute bottom-[14vh] left-1/2 -translate-x-1/2 pixel-text text-base md:text-xl glow-gold" style={{ animation: 'fade-in 1s ease-out 0.7s both' }}>
            Welcome to Blockfolio…
          </div>
          <style>{`
            @keyframes bar-in-top { from { transform: translateY(-100%); } to { transform: translateY(0); } }
            @keyframes bar-in-bottom { from { transform: translateY(100%); } to { transform: translateY(0); } }
          `}</style>
        </>
      )}

      {/* Interaction prompt */}
      {interactionTarget && !dialog && (
        <div className="absolute left-1/2 bottom-32 -translate-x-1/2 hud-panel px-5 py-2 anim-blockfall">
          <div className="pixel-text text-base">
            Press <span className="glow-gold">[E]</span> to enter <span className="glow-cyan">{interactionTarget}</span>
          </div>
        </div>
      )}

      {/* Dialog */}
      {dialog && (
        <div className="absolute inset-0 flex items-end md:items-center justify-center bg-black/30 pointer-events-auto" onClick={() => openDialog(null)}>
          <div className="hud-panel scanlines relative max-w-2xl w-[92%] m-4 p-6 anim-blockfall" onClick={(e) => e.stopPropagation()}>
            <div className="pixel-text text-3xl glow-gold mb-3">{dialog.title}</div>
            <div className="pixel-text text-lg leading-relaxed whitespace-pre-line opacity-95">
              {dialog.body}
            </div>
            <button
              className="mt-5 hud-panel pixel-text text-sm px-4 py-2 hover:bg-white/10 transition"
              onClick={() => openDialog(null)}
            >
              [ESC] Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingScreen({ onStart, loaded }: { onStart: () => void; loaded: boolean }) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-white">
      {/* Full-bleed hero image (BLOCKFOLIO logo + scene baked in) */}
      <img
        src={heroBg}
        alt="Blockfolio — A Voxel Portfolio Experience"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ imageRendering: "auto" }}
      />

      {/* Top-left: News tile */}
      <button
        className="absolute top-4 left-4 w-16 h-20 flex flex-col items-center justify-center gap-1 hover:scale-105 transition cursor-pointer"
        style={{
          background: "linear-gradient(180deg,#3a4f5e 0%,#243340 100%)",
          border: "2px solid rgba(0,0,0,0.6)",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.18), 0 4px 0 rgba(0,0,0,0.5)",
        }}
      >
        <Newspaper className="w-7 h-7 text-emerald-300" />
        <span className="pixel-text text-[11px]" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.8)" }}>News</span>
      </button>

      {/* Top-right: Settings + Profile */}
      <div className="absolute top-4 right-4 flex gap-2">
        <IconChip><Settings className="w-6 h-6" /></IconChip>
        <IconChip><User className="w-6 h-6" /></IconChip>
      </div>

      {/* Bottom-right: TIP panel with creeper */}
      <div
        className="absolute bottom-20 right-4 max-w-[260px] px-4 py-3 flex items-start gap-3"
        style={{
          background: "rgba(20,30,25,0.7)",
          border: "2px solid rgba(120,200,120,0.35)",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.08), 0 4px 0 rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex-1">
          <div className="pixel-text text-base text-emerald-300" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.8)" }}>TIP</div>
          <div className="pixel-text text-xs leading-snug opacity-90">
            Explore, create, and showcase your voxel imagination.
          </div>
        </div>
        <div
          className="w-9 h-9 flex-shrink-0"
          style={{
            background:
              "linear-gradient(180deg,#4caf50 0%,#2e7d32 100%)",
            border: "2px solid #1b3a1b",
            imageRendering: "pixelated",
            boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.35), inset 2px 2px 0 rgba(255,255,255,0.25)",
          }}
          aria-label="Creeper"
        />
      </div>

      {/* Bottom-center: Enter World + Options/Quit + icon bar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[560px] px-4 flex flex-col items-stretch gap-3">
        {/* Big green Enter World */}
        <button
          disabled={!loaded}
          onClick={onStart}
          className="pixel-text text-2xl py-3 flex items-center justify-center gap-3 transition active:translate-y-[3px] disabled:opacity-60 disabled:cursor-wait"
          style={{
            color: "#ffffff",
            background:
              "linear-gradient(180deg,#8bc24a 0%,#6aa838 45%,#4d8a26 100%)",
            border: "3px solid #1f3b10",
            boxShadow:
              "inset 0 3px 0 rgba(255,255,255,0.35), inset 0 -4px 0 rgba(0,0,0,0.35), 0 6px 0 #1a2a0a, 0 10px 24px rgba(0,0,0,0.5)",
            textShadow: "2px 2px 0 rgba(0,0,0,0.7)",
          }}
        >
          <Play className="w-6 h-6 fill-white" />
          {loaded ? "ENTER WORLD" : "GENERATING TERRAIN…"}
        </button>

        <div className="grid grid-cols-2 gap-3">
          <FakeMenuButton label="OPTIONS..." icon={<Settings className="w-5 h-5" />} />
          <FakeMenuButton label="QUIT" icon={<DoorOpen className="w-5 h-5" />} />
        </div>

        {/* Small icon row */}
        <div className="mt-1 flex items-center justify-center gap-2">
          <SmallIcon><Globe className="w-5 h-5" /></SmallIcon>
          <SmallIcon><BookOpen className="w-5 h-5" /></SmallIcon>
          <SmallIcon><Brush className="w-5 h-5" /></SmallIcon>
          <SmallIcon><MessageSquare className="w-5 h-5" /></SmallIcon>
        </div>
      </div>

      {/* Footers */}
      <div
        className="absolute bottom-3 left-4 pixel-text text-xs leading-tight"
        style={{ color: "#fff", textShadow: "2px 2px 0 rgba(0,0,0,0.85)" }}
      >
        <div>Blockfolio 1.0 (Voxel Edition)</div>
        <div className="opacity-90">Made with <span className="text-red-500">❤</span> for the community</div>
      </div>
      <div
        className="absolute bottom-3 right-4 pixel-text text-xs"
        style={{ color: "#fff", textShadow: "2px 2px 0 rgba(0,0,0,0.85)" }}
      >
        © 2026 Mojang-style ✦ All rights reserved
      </div>
    </div>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="w-12 h-12 flex items-center justify-center text-white/90 hover:scale-105 transition"
      style={{
        background: "linear-gradient(180deg,#3a4f5e 0%,#243340 100%)",
        border: "2px solid rgba(0,0,0,0.6)",
        boxShadow: "inset 0 2px 0 rgba(255,255,255,0.18), 0 4px 0 rgba(0,0,0,0.5)",
      }}
    >
      {children}
    </button>
  );
}

function SmallIcon({ children }: { children: React.ReactNode }) {
  return (
    <button
      className="w-11 h-11 flex items-center justify-center text-white/85 hover:text-white transition"
      style={{
        background: "linear-gradient(180deg,#2d3d4a 0%,#1a262f 100%)",
        border: "2px solid rgba(0,0,0,0.6)",
        boxShadow: "inset 0 2px 0 rgba(255,255,255,0.12), 0 3px 0 rgba(0,0,0,0.45)",
      }}
    >
      {children}
    </button>
  );
}

function FakeMenuButton({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <button
      className="pixel-text text-lg py-2 flex items-center justify-center gap-2 opacity-95 hover:brightness-110 transition active:translate-y-[2px]"
      style={{
        color: "#ffffff",
        background: "linear-gradient(180deg,#9a9a9a 0%,#7a7a7a 50%,#5a5a5a 100%)",
        border: "3px solid #2a2a2a",
        boxShadow:
          "inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.4), 0 4px 0 #1a1a1a",
        textShadow: "2px 2px 0 rgba(0,0,0,0.7)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
