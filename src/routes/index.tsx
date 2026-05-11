import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import HUD from "@/components/hud/HUD";
import { useGame } from "@/store/game";

const World = lazy(() => import("@/components/world/World"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blockfolio — A Voxel Portfolio Adventure" },
      { name: "description", content: "Explore a handcrafted voxel world portfolio. WASD to move, mouse to look, E to interact. Built with Three.js, React Three Fiber and shaders." },
      { property: "og:title", content: "Blockfolio — A Voxel Portfolio Adventure" },
      { property: "og:description", content: "Spawn into a stylized Minecraft-inspired world. Skills become machines, projects become biomes, contact is a portal." },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  const started = useGame((s) => s.started);
  const setLoaded = useGame((s) => s.setLoaded);
  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => setLoaded(true), 900);
    return () => clearTimeout(t);
  }, [setLoaded]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#1a0f1f]">
      {mounted && started && (
        <Suspense fallback={null}>
          <World />
        </Suspense>
      )}
      <HUD />
    </main>
  );
}
