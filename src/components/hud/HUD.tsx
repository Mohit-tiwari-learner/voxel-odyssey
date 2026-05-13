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
  // Minecraft-style chunky stone title
  const stoneTextStyle: React.CSSProperties = {
    fontFamily: 'var(--font-pixel)',
    color: '#d8d8d8',
    background: 'linear-gradient(180deg, #f4f4f4 0%, #c8c8c8 45%, #8a8a8a 50%, #6a6a6a 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 6px 0 rgba(0,0,0,0.55), 0 10px 22px rgba(0,0,0,0.6)',
    filter: 'drop-shadow(0 4px 0 #2a2a2a)',
    letterSpacing: '0.06em',
    lineHeight: 1,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-white">
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #6cc7ff 0%, #9ddcff 38%, #cdeaff 60%, #7bbf5e 60%, #4f8f3f 100%)',
          imageRendering: 'pixelated',
        }}
      />

      {/* Pixel clouds */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { l: '8%', t: '14%', w: 140, d: 0 },
          { l: '70%', t: '8%', w: 180, d: 6 },
          { l: '40%', t: '22%', w: 110, d: 12 },
          { l: '82%', t: '30%', w: 90, d: 4 },
          { l: '18%', t: '34%', w: 120, d: 9 },
        ].map((c, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: c.l,
              top: c.t,
              width: c.w,
              height: c.w * 0.32,
              background: '#ffffff',
              boxShadow:
                '0 -10px 0 #ffffff, 14px -22px 0 #ffffff, -18px -14px 0 #ffffff, 30px -8px 0 #ffffff, -32px 0 0 #ffffff',
              animation: `cloud-drift ${40 + i * 7}s linear ${-c.d}s infinite`,
              opacity: 0.95,
              imageRendering: 'pixelated',
            }}
          />
        ))}
      </div>

      {/* Distant pixel mountains */}
      <div
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          bottom: '40%',
          height: 120,
          background:
            'linear-gradient(180deg, transparent 0%, transparent 30%, #5a8b6b 30%, #3e6a4f 100%)',
          clipPath:
            'polygon(0 100%, 6% 70%, 12% 85%, 18% 55%, 26% 78%, 34% 50%, 42% 75%, 50% 60%, 58% 80%, 66% 55%, 74% 78%, 82% 65%, 90% 82%, 100% 70%, 100% 100%)',
          opacity: 0.85,
        }}
      />

      {/* Grass block ground band */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none">
        {/* Grass top stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-3"
          style={{
            background:
              'repeating-linear-gradient(90deg, #4f8f3f 0 14px, #5ea34a 14px 28px)',
            boxShadow: 'inset 0 -2px 0 #2e5a26',
          }}
        />
        {/* Dirt voxels */}
        <div
          className="absolute top-3 left-0 right-0 bottom-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #5a3a22 0 32px, #6b4528 32px 64px), repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 32px), repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 32px)',
            backgroundBlendMode: 'multiply, normal, normal',
          }}
        />
      </div>

      {/* Floating decorative falling blocks */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${(i * 53 + 7) % 96}%`,
              top: `-${20 + (i % 5) * 10}px`,
              width: 22,
              height: 22,
              background: ['#7b4a25', '#5ea34a', '#9aa0a6', '#c8995a', '#7ec0ff'][i % 5],
              boxShadow:
                'inset -3px -3px 0 rgba(0,0,0,0.35), inset 3px 3px 0 rgba(255,255,255,0.25), 0 2px 0 rgba(0,0,0,0.3)',
              animation: `mc-fall ${6 + (i % 6)}s linear ${i * 0.4}s infinite`,
              transform: `rotate(${(i * 23) % 30 - 15}deg)`,
              imageRendering: 'pixelated',
            }}
          />
        ))}
      </div>

      {/* Center content */}
      <div className="relative h-full w-full flex flex-col items-center justify-center px-6 text-center">
        <div className="pixel-text text-sm md:text-base opacity-90 mb-3" style={{ color: '#fff7d6', textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}>
          ▸ A VOXEL PORTFOLIO EXPERIENCE
        </div>

        <h1
          className="text-6xl md:text-8xl lg:text-9xl mb-6 anim-blockfall"
          style={stoneTextStyle}
        >
          BLOCKFOLIO
        </h1>

        <p
          className="pixel-text text-base md:text-xl mb-8 leading-relaxed"
          style={{ color: '#fffdf2', textShadow: '2px 2px 0 rgba(0,0,0,0.75)' }}
        >
          Spawn into a handcrafted voxel world.<br />
          Explore biomes. Visit machines. Climb the peak.<br />
          Step through the portal to say hello.
        </p>

        <button
          disabled={!loaded}
          onClick={onStart}
          className="pixel-text text-2xl md:text-3xl px-10 py-4 transition active:translate-y-[3px] disabled:opacity-60 disabled:cursor-wait"
          style={{
            color: '#ffffff',
            background:
              'linear-gradient(180deg, #8bd16a 0%, #6db84a 50%, #4f9a35 100%)',
            border: '3px solid #2e5a26',
            boxShadow:
              'inset 0 3px 0 rgba(255,255,255,0.35), inset 0 -4px 0 rgba(0,0,0,0.35), 0 6px 0 #234a1d, 0 8px 18px rgba(0,0,0,0.45)',
            textShadow: '2px 2px 0 rgba(0,0,0,0.7)',
            imageRendering: 'pixelated',
          }}
        >
          {loaded ? '▶ ENTER WORLD' : 'GENERATING TERRAIN…'}
        </button>

        <div
          className="mt-8 pixel-text text-sm opacity-90"
          style={{ color: '#fffdf2', textShadow: '2px 2px 0 rgba(0,0,0,0.7)' }}
        >
          Best with sound on • Mouse + Keyboard recommended
        </div>
      </div>

      <style>{`
        @keyframes cloud-drift {
          from { transform: translateX(-10vw); }
          to { transform: translateX(110vw); }
        }
        @keyframes mc-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(180deg); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
