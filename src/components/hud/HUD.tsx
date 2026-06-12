import { useEffect, useState } from "react";
import { useGame, ZONES, type ZoneId } from "@/store/game";
import heroAsset from "@/assets/blockfolio-hero-v2.png.asset.json";
import { Settings, User, Newspaper, Globe, BookOpen, Brush, MessageSquare, Play, DoorOpen, Gamepad2, Mouse, X, Volume2, Eye, Github, Twitter, Mail } from "lucide-react";

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
  const visited = Array.from(useGame.getState().unlocked).length;
  const zoneIds = Object.keys(ZONES) as ZoneId[];
  const slotColors = ["#f6c453", "#5ec8f0", "#fb8500", "#c77dff", "#8ecae6", "#a663cc"];
  const panelStyle: React.CSSProperties = {
    background: "linear-gradient(180deg, rgba(20,22,28,0.92), rgba(14,16,20,0.92))",
    border: "1.5px solid rgba(246,196,83,0.45)",
    borderRadius: "14px",
    boxShadow: "0 6px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40 select-none">
      {/* Crosshair */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-3 w-3 border-2 border-white/80 shadow-[0_0_10px_rgba(0,0,0,0.6)]" />
      </div>

      {/* Top — Current Zone */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 anim-blockfall flex items-center gap-2 px-3 py-1.5 sm:gap-3 sm:px-4 sm:py-2 sm:top-5 max-w-[60vw]" style={panelStyle}>
        <DiamondIcon color={zone.color} />
        <div className="min-w-0">
          <div className="pixel-text text-[9px] sm:text-[11px] tracking-[0.22em] text-white/55">CURRENT ZONE</div>
          <div className="pixel-text text-base sm:text-xl leading-tight truncate" style={{ color: "#f6c453", textShadow: "0 0 12px rgba(246,196,83,0.5)" }}>
            {zone.name}
          </div>
        </div>
      </div>

      {/* Quest tracker */}
      <div className="absolute top-3 right-3 anim-blockfall px-3 py-2 max-w-[40vw] sm:max-w-[280px] sm:px-4 sm:py-2.5 sm:top-5 sm:right-5" style={panelStyle}>
        <div className="pixel-text text-[9px] sm:text-[11px] tracking-[0.22em] text-white/55 mb-1">▸ QUEST</div>
        <div className="pixel-text text-sm sm:text-base leading-tight" style={{ color: "#f6c453", textShadow: "0 0 10px rgba(246,196,83,0.45)" }}>
          {zone.hint}
        </div>
        <div className="mt-2 h-1 sm:h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full" style={{
            width: `${Math.max(6, (visited / 6) * 100)}%`,
            background: "linear-gradient(90deg,#f6c453,#ffb22c)",
            boxShadow: "0 0 8px rgba(246,196,83,0.7)",
          }} />
        </div>
        <div className="pixel-text text-[9px] sm:text-[11px] mt-1 text-white/55">Visited {visited}/6 zones</div>
      </div>

      {/* Controls — hidden on mobile */}
      <div className="hidden md:block absolute bottom-5 left-5 anim-blockfall px-4 py-2.5" style={panelStyle}>
        <div className="pixel-text text-[11px] tracking-[0.22em] text-white/55 mb-2 flex items-center gap-1.5">
          CONTROLS <Gamepad2 className="w-3.5 h-3.5" />
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
          <CtrlRow keys={["W","A","S","D"]} label="Move" />
          <CtrlRow keys={[<Mouse key="m" className="w-4 h-4" />]} label="Look" />
          <CtrlRow keys={["Shift"]} label="Sprint" wide />
          <CtrlRow keys={["E"]} label="Interact" />
          <CtrlRow keys={["Space"]} label="Jump" wide />
          <CtrlRow keys={["ESC"]} label="Release" wide />
        </div>
      </div>

      {/* Hotbar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 p-1 sm:gap-1.5 sm:p-1.5 sm:bottom-5" style={panelStyle}>
        {zoneIds.map((z, i) => {
          const active = z === currentZone;
          const c = slotColors[i] ?? "#fff";
          return (
            <div
              key={z}
              className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center pixel-text text-lg sm:text-xl rounded-[8px] sm:rounded-[10px] transition"
              style={{
                background: active ? "rgba(246,196,83,0.15)" : "rgba(0,0,0,0.45)",
                border: active ? "2px solid #f6c453" : "1.5px solid rgba(255,255,255,0.08)",
                color: c,
                boxShadow: active
                  ? "inset 0 0 12px rgba(246,196,83,0.35), 0 0 14px rgba(246,196,83,0.45)"
                  : "inset 0 1px 0 rgba(255,255,255,0.05)",
                textShadow: `0 0 8px ${c}`,
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

type PanelKey =
  | "news"
  | "settings"
  | "profile"
  | "options"
  | "quit"
  | "website"
  | "guide"
  | "skins"
  | "feedback"
  | null;

function LoadingScreen({ onStart, loaded }: { onStart: () => void; loaded: boolean }) {
  const [panel, setPanel] = useState<PanelKey>(null);
  const [muted, setMuted] = useState(false);
  const [fov, setFov] = useState(75);
  const [quality, setQuality] = useState<"low" | "medium" | "high">("high");
  const [quitConfirm, setQuitConfirm] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") setPanel(null);
      if (e.code === "Enter" && loaded && !panel) onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loaded, panel, onStart]);

  const handleQuit = () => {
    setQuitConfirm(true);
    setPanel("quit");
  };
  const reallyQuit = () => {
    // Best-effort: try window.close (works if opened via script), else navigate away
    window.close();
    setTimeout(() => {
      window.location.href = "about:blank";
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-white">
      <img
        src={heroBg}
        alt="Blockfolio — A Voxel Portfolio Experience"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ imageRendering: "auto" }}
      />

      {/* Top-left: News tile */}
      <button
        onClick={() => setPanel("news")}
        className="absolute top-3 left-3 sm:top-4 sm:left-4 w-12 h-14 sm:w-14 sm:h-16 flex flex-col items-center justify-center gap-0.5 hover:scale-105 transition cursor-pointer"
        style={{
          background: "linear-gradient(180deg,#3a4f5e 0%,#243340 100%)",
          border: "2px solid rgba(0,0,0,0.6)",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.18), 0 4px 0 rgba(0,0,0,0.5)",
        }}
      >
        <Newspaper className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
        <span className="pixel-text text-[10px]" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.8)" }}>News</span>
      </button>

      {/* Top-right: Settings + Profile */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-2">
        <IconChip onClick={() => setPanel("settings")} title="Settings"><Settings className="w-5 h-5" /></IconChip>
        <IconChip onClick={() => setPanel("profile")} title="Profile"><User className="w-5 h-5" /></IconChip>
      </div>

      {/* Bottom-right: TIP panel */}
      <div
        className="hidden sm:flex absolute bottom-24 right-4 max-w-[220px] px-3 py-2 items-start gap-2"
        style={{
          background: "rgba(20,30,25,0.7)",
          border: "2px solid rgba(120,200,120,0.35)",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.08), 0 4px 0 rgba(0,0,0,0.4)",
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="pixel-text text-sm text-emerald-300" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.8)" }}>TIP</div>
          <div className="pixel-text text-[11px] leading-snug opacity-90">
            Explore, create, and showcase your voxel imagination.
          </div>
        </div>
        <div
          className="w-7 h-7 flex-shrink-0"
          style={{
            background: "linear-gradient(180deg,#4caf50 0%,#2e7d32 100%)",
            border: "2px solid #1b3a1b",
            imageRendering: "pixelated",
            boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.35), inset 2px 2px 0 rgba(255,255,255,0.25)",
          }}
          aria-label="Creeper"
        />
      </div>

      {/* Bottom-center stack */}
      <div className="absolute bottom-10 sm:bottom-14 left-1/2 -translate-x-1/2 w-full max-w-[420px] px-4 flex flex-col items-stretch gap-2.5">
        <button
          disabled={!loaded}
          onClick={onStart}
          className="pixel-text text-lg sm:text-xl py-2.5 flex items-center justify-center gap-2 transition active:translate-y-[3px] disabled:opacity-60 disabled:cursor-wait"
          style={{
            color: "#ffffff",
            background: "linear-gradient(180deg,#8bc24a 0%,#6aa838 45%,#4d8a26 100%)",
            border: "3px solid #1f3b10",
            boxShadow: "inset 0 3px 0 rgba(255,255,255,0.35), inset 0 -4px 0 rgba(0,0,0,0.35), 0 5px 0 #1a2a0a, 0 8px 20px rgba(0,0,0,0.5)",
            textShadow: "2px 2px 0 rgba(0,0,0,0.7)",
          }}
        >
          <Play className="w-5 h-5 fill-white" />
          {loaded ? "ENTER WORLD" : "GENERATING…"}
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <FakeMenuButton label="OPTIONS" icon={<Settings className="w-4 h-4" />} onClick={() => setPanel("options")} />
          <FakeMenuButton label="QUIT" icon={<DoorOpen className="w-4 h-4" />} onClick={handleQuit} />
        </div>

        <div className="mt-0.5 flex items-center justify-center gap-2">
          <SmallIcon onClick={() => setPanel("website")} title="Website"><Globe className="w-4 h-4" /></SmallIcon>
          <SmallIcon onClick={() => setPanel("guide")} title="Guide"><BookOpen className="w-4 h-4" /></SmallIcon>
          <SmallIcon onClick={() => setPanel("skins")} title="Skins"><Brush className="w-4 h-4" /></SmallIcon>
          <SmallIcon onClick={() => setPanel("feedback")} title="Feedback"><MessageSquare className="w-4 h-4" /></SmallIcon>
        </div>
      </div>

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

      {/* Modal panel */}
      {panel && (
        <Modal onClose={() => { setPanel(null); setQuitConfirm(false); }} title={panelTitle(panel)}>
          {panel === "news" && (
            <div className="space-y-3 pixel-text text-sm">
              <NewsItem date="Jun 12, 2026" title="v1.0 Voxel Edition launched" body="Six explorable zones, smooth day/night cycle, and improved physics." />
              <NewsItem date="Jun 05, 2026" title="New Projects Biome" body="Living projects now sprout as biomes you can walk through." />
              <NewsItem date="May 28, 2026" title="Performance update" body="20% faster terrain generation on low-end devices." />
            </div>
          )}
          {panel === "settings" && (
            <div className="space-y-4 pixel-text text-sm">
              <Row label="Sound">
                <button onClick={() => setMuted((m) => !m)} className="hud-panel px-3 py-1 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> {muted ? "Muted" : "On"}
                </button>
              </Row>
              <Row label={`Field of View: ${fov}°`}>
                <input type="range" min={60} max={110} value={fov} onChange={(e) => setFov(+e.target.value)} className="w-full accent-yellow-400" />
              </Row>
              <Row label="Quality">
                <div className="flex gap-2">
                  {(["low","medium","high"] as const).map((q) => (
                    <button key={q} onClick={() => setQuality(q)}
                      className="hud-panel px-3 py-1"
                      style={{ background: quality === q ? "rgba(246,196,83,0.25)" : undefined, borderColor: quality === q ? "#f6c453" : undefined }}>
                      {q.toUpperCase()}
                    </button>
                  ))}
                </div>
              </Row>
            </div>
          )}
          {panel === "profile" && (
            <div className="space-y-3 pixel-text text-sm">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14" style={{ background: "linear-gradient(135deg,#f6c453,#fb8500)", border: "2px solid #1f1409" }} />
                <div>
                  <div className="text-lg" style={{ color: "#f6c453" }}>Player_01</div>
                  <div className="opacity-70">Explorer • Level 1</div>
                </div>
              </div>
              <div className="opacity-80">Sign-in coming soon. Your progress is saved locally for now.</div>
            </div>
          )}
          {panel === "options" && (
            <div className="space-y-3 pixel-text text-sm">
              <Row label="Show FPS"><Toggle /></Row>
              <Row label="Invert Mouse"><Toggle /></Row>
              <Row label="Reduced Motion"><Toggle /></Row>
              <Row label="View Distance"><Eye className="w-5 h-5 inline mr-1" />Far</Row>
            </div>
          )}
          {panel === "quit" && quitConfirm && (
            <div className="space-y-4 pixel-text text-sm">
              <div>Are you sure you want to quit Blockfolio?</div>
              <div className="flex gap-3">
                <button onClick={reallyQuit} className="hud-panel px-4 py-2" style={{ borderColor: "#ef4444", color: "#fca5a5" }}>Yes, quit</button>
                <button onClick={() => { setPanel(null); setQuitConfirm(false); }} className="hud-panel px-4 py-2">Cancel</button>
              </div>
            </div>
          )}
          {panel === "website" && (
            <div className="space-y-2 pixel-text text-sm">
              <a href="https://lovable.dev" target="_blank" rel="noreferrer" className="hud-panel block px-3 py-2 hover:bg-white/10">→ lovable.dev</a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hud-panel block px-3 py-2 hover:bg-white/10 flex items-center gap-2"><Github className="w-4 h-4" /> GitHub</a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hud-panel block px-3 py-2 hover:bg-white/10 flex items-center gap-2"><Twitter className="w-4 h-4" /> Twitter</a>
            </div>
          )}
          {panel === "guide" && (
            <div className="space-y-2 pixel-text text-sm">
              <p>Welcome to Blockfolio — a voxel portfolio you can walk through.</p>
              <ul className="list-disc list-inside opacity-90 space-y-1">
                <li>Use <b>WASD</b> to move, <b>mouse</b> to look</li>
                <li>Press <b>E</b> near landmarks to interact</li>
                <li>Visit all six zones to learn about the developer</li>
                <li>Press <b>Esc</b> anytime to release the cursor</li>
              </ul>
            </div>
          )}
          {panel === "skins" && (
            <div className="grid grid-cols-4 gap-3">
              {["#f6c453","#5ec8f0","#fb8500","#c77dff","#8ecae6","#a663cc","#4caf50","#ef4444"].map((c) => (
                <button key={c} className="aspect-square hover:scale-105 transition"
                  style={{ background: c, border: "2px solid #111", boxShadow: "inset -3px -3px 0 rgba(0,0,0,0.35), inset 3px 3px 0 rgba(255,255,255,0.25)" }} />
              ))}
            </div>
          )}
          {panel === "feedback" && (
            <FeedbackForm onSent={() => setPanel(null)} />
          )}
        </Modal>
      )}
    </div>
  );
}

function panelTitle(p: Exclude<PanelKey, null>) {
  return {
    news: "News",
    settings: "Settings",
    profile: "Profile",
    options: "Options",
    quit: "Quit Game",
    website: "Links",
    guide: "Guide",
    skins: "Skins",
    feedback: "Feedback",
  }[p];
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-[92%] max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg,#1a2530 0%,#0e1620 100%)",
          border: "3px solid #0a0f15",
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.12), 0 8px 0 rgba(0,0,0,0.6), 0 12px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="pixel-text text-xl" style={{ color: "#f6c453", textShadow: "2px 2px 0 rgba(0,0,0,0.7)" }}>{title}</div>
          <button onClick={onClose} className="text-white/80 hover:text-white" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="opacity-90">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Toggle() {
  const [on, setOn] = useState(false);
  return (
    <button onClick={() => setOn((o) => !o)}
      className="w-12 h-6 relative rounded-full transition"
      style={{ background: on ? "#4d8a26" : "#3a3a3a", border: "2px solid #111" }}>
      <span className="absolute top-0.5 w-4 h-4 bg-white transition-all" style={{ left: on ? 24 : 2 }} />
    </button>
  );
}

function NewsItem({ date, title, body }: { date: string; title: string; body: string }) {
  return (
    <div className="hud-panel p-3">
      <div className="opacity-60 text-xs">{date}</div>
      <div style={{ color: "#f6c453" }}>{title}</div>
      <div className="opacity-85 mt-1">{body}</div>
    </div>
  );
}

function FeedbackForm({ onSent }: { onSent: () => void }) {
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) {
    return <div className="pixel-text text-sm" style={{ color: "#8bc24a" }}>Thanks! Your feedback was recorded locally.</div>;
  }
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        try { localStorage.setItem("blockfolio_feedback_" + Date.now(), msg); } catch {}
        setSent(true);
        setTimeout(onSent, 1200);
      }}
    >
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Tell us what you think…"
        className="w-full h-28 p-2 pixel-text text-sm bg-black/40 border-2 border-white/15 outline-none focus:border-yellow-400/60 text-white"
        required
      />
      <div className="flex items-center justify-between">
        <a href="mailto:hello@portfolio.dev" className="pixel-text text-xs opacity-75 hover:opacity-100 flex items-center gap-1"><Mail className="w-3 h-3" /> email instead</a>
        <button type="submit" className="hud-panel pixel-text px-4 py-2" style={{ borderColor: "#8bc24a", color: "#bef264" }}>Send</button>
      </div>
    </form>
  );
}

function IconChip({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-white/90 hover:scale-105 active:translate-y-[2px] transition"
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

function SmallIcon({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-9 h-9 flex items-center justify-center text-white/85 hover:text-white active:translate-y-[2px] transition"
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

function FakeMenuButton({ label, icon, onClick }: { label: string; icon?: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="pixel-text text-sm sm:text-base py-1.5 flex items-center justify-center gap-2 opacity-95 hover:brightness-110 transition active:translate-y-[2px]"
      style={{
        color: "#ffffff",
        background: "linear-gradient(180deg,#9a9a9a 0%,#7a7a7a 50%,#5a5a5a 100%)",
        border: "2px solid #2a2a2a",
        boxShadow: "inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.4), 0 3px 0 #1a1a1a",
        textShadow: "2px 2px 0 rgba(0,0,0,0.7)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function DiamondIcon({ color }: { color: string }) {
  return (
    <div
      className="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center flex-shrink-0"
      style={{
        background: "rgba(0,0,0,0.45)",
        border: "1.5px solid rgba(246,196,83,0.6)",
        borderRadius: "10px",
      }}
    >
      <div
        className="w-4 h-4"
        style={{
          background: color,
          transform: "rotate(45deg)",
          boxShadow: `0 0 10px ${color}, inset 0 0 4px rgba(255,255,255,0.5)`,
          borderRadius: 2,
        }}
      />
    </div>
  );
}

function KeyCap({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className="pixel-text flex items-center justify-center"
      style={{
        minWidth: wide ? 44 : 26,
        height: 26,
        padding: "0 6px",
        background: "rgba(0,0,0,0.55)",
        border: "1.5px solid rgba(246,196,83,0.55)",
        borderRadius: 6,
        color: "#f6c453",
        fontSize: 13,
        lineHeight: 1,
        textShadow: "0 0 6px rgba(246,196,83,0.5)",
        boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.4)",
      }}
    >
      {children}
    </div>
  );
}

function CtrlRow({ keys, label, wide }: { keys: React.ReactNode[]; label: string; wide?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {keys.map((k, i) => (
          <KeyCap key={i} wide={wide}>{k}</KeyCap>
        ))}
      </div>
      <span className="pixel-text text-sm text-white/85">{label}</span>
    </div>
  );
}
