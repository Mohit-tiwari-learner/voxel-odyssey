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
  // Big chunky Minecraft-style logo letters
  const logoStyle: React.CSSProperties = {
    fontFamily: 'var(--font-pixel)',
    color: '#e8e8e8',
    background:
      'linear-gradient(180deg, #f6f6f6 0%, #c7c7c7 38%, #8a8a8a 55%, #5e5e5e 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow:
      '0 4px 0 rgba(0,0,0,0.55), 0 8px 0 rgba(0,0,0,0.45), 0 14px 28px rgba(0,0,0,0.6)',
    filter:
      'drop-shadow(0 3px 0 #2a2a2a) drop-shadow(0 6px 0 #1a1a1a)',
    letterSpacing: '0.08em',
    lineHeight: 1,
    transform: 'rotate(-2deg)',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-white">
      {/* Hero Minecraft-style background image */}
      <img
        src={heroBg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Subtle vignette + readability overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%), linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* Foreground UI */}
      <div className="relative h-full w-full flex flex-col items-center px-6 text-center">
        {/* Top: huge tilted logo */}
        <div className="mt-[5vh] md:mt-[6vh] anim-blockfall">
          <h1
            className="text-7xl md:text-9xl lg:text-[11rem]"
            style={logoStyle}
          >
            BLOCKFOLIO
          </h1>
          <div
            className="mt-2 pixel-text text-xs md:text-sm tracking-[0.3em]"
            style={{
              color: '#fff7d6',
              textShadow: '2px 2px 0 rgba(0,0,0,0.8)',
              transform: 'rotate(-1deg)',
            }}
          >
            A VOXEL PORTFOLIO EXPERIENCE
          </div>
        </div>

        {/* Spacer pushes button area to lower half */}
        <div className="flex-1" />

        {/* Bottom: button stack like Minecraft menu */}
        <div className="mb-[8vh] w-full max-w-md flex flex-col items-stretch gap-3">
          <button
            disabled={!loaded}
            onClick={onStart}
            className="pixel-text text-xl md:text-2xl py-3 transition active:translate-y-[3px] disabled:opacity-60 disabled:cursor-wait"
            style={{
              color: '#ffffff',
              background:
                'linear-gradient(180deg, #b9b9b9 0%, #8f8f8f 50%, #6a6a6a 100%)',
              border: '3px solid #2a2a2a',
              boxShadow:
                'inset 0 3px 0 rgba(255,255,255,0.35), inset 0 -4px 0 rgba(0,0,0,0.4), 0 6px 0 #1a1a1a, 0 10px 24px rgba(0,0,0,0.5)',
              textShadow: '2px 2px 0 rgba(0,0,0,0.7)',
              imageRendering: 'pixelated',
            }}
          >
            {loaded ? '▶ ENTER WORLD' : 'GENERATING TERRAIN…'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <FakeMenuButton label="Options..." />
            <FakeMenuButton label="Quit" />
          </div>
        </div>

        {/* Footer corners */}
        <div
          className="absolute bottom-2 left-3 pixel-text text-xs"
          style={{ color: '#fff', textShadow: '2px 2px 0 rgba(0,0,0,0.8)' }}
        >
          Blockfolio 1.0 (Voxel Edition)
        </div>
        <div
          className="absolute bottom-2 right-3 pixel-text text-xs"
          style={{ color: '#fff', textShadow: '2px 2px 0 rgba(0,0,0,0.8)' }}
        >
          Copyright Mojang-style ✦ Made for the web
        </div>
      </div>

      {/* Splash text — yellow tilted, like Minecraft */}
      <div
        className="absolute pointer-events-none pixel-text"
        style={{
          top: '14vh',
          right: '12vw',
          color: '#ffdc00',
          textShadow: '2px 2px 0 rgba(80,60,0,0.9)',
          transform: 'rotate(-18deg)',
          fontSize: 'clamp(14px, 1.8vw, 26px)',
          animation: 'splash-pulse 0.6s ease-in-out infinite alternate',
        }}
      >
        Now with shaders!
      </div>

      <style>{`
        @keyframes splash-pulse {
          from { transform: rotate(-18deg) scale(1); }
          to   { transform: rotate(-18deg) scale(1.08); }
        }
      `}</style>
    </div>
  );
}

function FakeMenuButton({ label }: { label: string }) {
  return (
    <button
      disabled
      className="pixel-text text-base md:text-lg py-2 cursor-not-allowed opacity-80"
      style={{
        color: '#ffffff',
        background:
          'linear-gradient(180deg, #9a9a9a 0%, #7a7a7a 50%, #5a5a5a 100%)',
        border: '3px solid #2a2a2a',
        boxShadow:
          'inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -3px 0 rgba(0,0,0,0.4), 0 4px 0 #1a1a1a',
        textShadow: '2px 2px 0 rgba(0,0,0,0.7)',
      }}
    >
      {label}
    </button>
  );
}
