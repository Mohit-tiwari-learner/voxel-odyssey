import { useEffect } from "react";
import { useGame, ZONES, type ZoneId } from "@/store/game";

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
  const { started, start, loaded, pointerLocked, currentZone, interactionTarget, dialog, openDialog } = useGame();

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
      {!pointerLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <div className="hud-panel px-8 py-6 text-center anim-blockfall">
            <div className="pixel-text text-3xl glow-gold mb-2">CLICK TO PLAY</div>
            <div className="pixel-text text-sm opacity-80">Mouse will lock — press Esc to release</div>
          </div>
        </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a0f1f] text-white overflow-hidden">
      {/* Falling block decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-6 h-6"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              background: ["#f6c453", "#5fa85a", "#42e2f5", "#c77dff", "#fb8500"][i % 5],
              transform: `rotate(${i * 17}deg)`,
              boxShadow: "inset -3px -3px 0 rgba(0,0,0,0.3), inset 3px 3px 0 rgba(255,255,255,0.2)",
              animation: `blockfall ${1 + (i % 5) * 0.2}s ease-out ${i * 0.04}s both`,
            }}
          />
        ))}
      </div>

      <div className="relative text-center max-w-xl px-6">
        <div className="pixel-text text-sm opacity-70 mb-2">▸ A VOXEL PORTFOLIO EXPERIENCE</div>
        <h1 className="pixel-text text-5xl md:text-7xl glow-gold mb-3">BLOCKFOLIO</h1>
        <p className="pixel-text text-base md:text-lg opacity-80 mb-8 leading-relaxed">
          Spawn into a handcrafted voxel world.<br />
          Explore biomes. Visit machines. Climb the peak.<br />
          Step through the portal to say hello.
        </p>

        <button
          disabled={!loaded}
          onClick={onStart}
          className="hud-panel pixel-text text-2xl px-8 py-3 transition hover:bg-white/10 hover:scale-[1.03] disabled:opacity-50 disabled:cursor-wait glow-gold"
        >
          {loaded ? "▶ ENTER WORLD" : "GENERATING TERRAIN…"}
        </button>

        <div className="mt-8 pixel-text text-xs opacity-50">
          Best with sound on • Mouse + Keyboard recommended
        </div>
      </div>
    </div>
  );
}
