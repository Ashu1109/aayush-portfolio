"use client";

import { KeyLight } from "@/components/key-light";
import { Reveal } from "@/components/scroll/reveal";
import { useEffect, useRef, useState } from "react";

/**
 * Dew Run: an original Mario-style endless runner drawn on a 2D canvas.
 * Jump the mossy stones, grab the dewdrops, chase the best score. Pauses whenever
 * the section leaves the viewport or the tab hides.
 */

type Mode = "idle" | "playing" | "paused" | "over";

type World = {
  coins: { r: number; taken: boolean; x: number; y: number }[];
  distance: number;
  mode: Mode;
  obstacles: { h: number; w: number; x: number }[];
  player: { grounded: boolean; vy: number; y: number };
  score: number;
  spawnIn: number;
  speed: number;
  time: number;
};

const GROUND = 250;
const HEIGHT = 300;
const PLAYER_X = 90;
const GRAVITY = 2600;
const JUMP_VELOCITY = -940;
// Pre-rename key, kept so returning players keep their best score.
const BEST_KEY = "ember-run-best";

const freshWorld = (mode: Mode): World => ({
  coins: [],
  distance: 0,
  mode,
  obstacles: [],
  player: { grounded: true, vy: 0, y: GROUND },
  score: 0,
  spawnIn: 1.2,
  speed: 340,
  time: 0,
});

/** The leaf sprite, side view: trots with a little bob, stretches mid-jump. */
const drawSprite = (
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  x: number,
  y: number,
  time: number,
  running: boolean,
  airborne: boolean
) => {
  if (!sprite.complete || !sprite.naturalWidth) {
    return;
  }
  const w = 40;
  const h = (w * sprite.naturalHeight) / sprite.naturalWidth;
  const bob = running ? Math.abs(Math.sin(time * 14)) * 3 : 0;
  const stretch = airborne ? 1.08 : 1;
  ctx.save();
  ctx.translate(x + w / 2, y - bob);
  ctx.scale(1 / stretch, stretch);
  ctx.drawImage(sprite, -w / 2, -h, w, h);
  ctx.restore();
};

export const Runner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World>(freshWorld("idle"));
  const [best, setBest] = useState(0);

  useEffect(() => {
    // Async so hydration completes before the stored best score lands.
    const bestRaf = requestAnimationFrame(() => {
      setBest(Number(localStorage.getItem(BEST_KEY)) || 0);
    });

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const sprite = new window.Image();
    sprite.src = "/sprite/side.webp";
    if (!canvas || !ctx) {
      return;
    }

    let width = 0;
    let rafId = 0;
    let last = 0;
    let visible = false;

    const resize = () => {
      width = canvas.clientWidth;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(HEIGHT * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    // Canvas font strings can't resolve CSS variables, so read the next/font
    // families off <html> once.
    const rootStyle = getComputedStyle(document.documentElement);
    const headingFont = `${rootStyle.getPropertyValue("--font-outfit")}, sans-serif`;
    const monoFont = `${rootStyle.getPropertyValue("--font-geist-mono")}, monospace`;

    const overlay = (title: string, hint: string) => {
      ctx.textAlign = "center";
      ctx.fillStyle = "#f7f6e7";
      ctx.font = `600 26px ${headingFont}`;
      ctx.fillText(title, width / 2, 128);
      ctx.fillStyle = "#9ea899";
      ctx.font = `12px ${monoFont}`;
      ctx.fillText(hint, width / 2, 156);
    };

    const step = (dt: number) => {
      const world = worldRef.current;
      world.time += dt;
      const { player } = world;

      if (world.mode === "playing") {
        world.speed = Math.min(720, 340 + world.time * 14);
        world.distance += world.speed * dt;
        world.score = Math.floor(world.distance / 20);

        player.vy += GRAVITY * dt;
        player.y = Math.min(GROUND, player.y + player.vy * dt);
        player.grounded = player.y >= GROUND;
        if (player.grounded) {
          player.vy = 0;
        }

        // Spawn a stone, sometimes with a dewdrop floating past it.
        world.spawnIn -= dt;
        if (world.spawnIn <= 0) {
          world.spawnIn = 0.9 + Math.random() * 1.1 - world.speed / 2400;
          const tall = Math.random() < 0.3;
          world.obstacles.push({
            h: tall ? 64 : 36,
            w: 26 + Math.random() * 18,
            x: width + 40,
          });
          if (Math.random() < 0.65) {
            world.coins.push({
              r: 7,
              taken: false,
              x: width + 40 + 120 + Math.random() * 80,
              y: GROUND - 90 - Math.random() * 60,
            });
          }
        }

        for (const obstacle of world.obstacles) {
          obstacle.x -= world.speed * dt;
        }
        for (const coin of world.coins) {
          coin.x -= world.speed * dt;
        }
        world.obstacles = world.obstacles.filter((o) => o.x + o.w > -20);
        world.coins = world.coins.filter((c) => c.x > -20 && !c.taken);

        // Collisions: sprite box vs stones, sprite center vs dewdrops.
        const px = PLAYER_X;
        const py = player.y;
        for (const o of world.obstacles) {
          const top = GROUND - o.h;
          if (px + 34 > o.x && px + 4 < o.x + o.w && py > top + 4) {
            world.mode = "over";
            const finalScore = world.score;
            setBest((prev) => {
              const next = Math.max(prev, finalScore);
              localStorage.setItem(BEST_KEY, String(next));
              return next;
            });
          }
        }
        for (const c of world.coins) {
          if (Math.hypot(c.x - (px + 20), c.y - (py - 24)) < c.r + 18) {
            c.taken = true;
            world.score += 10;
            world.distance += 200;
          }
        }
      }
    };

    const draw = () => {
      const world = worldRef.current;
      ctx.clearRect(0, 0, width, HEIGHT);

      // Parallax fireflies drifting in the background.
      ctx.fillStyle = "rgba(219, 236, 193, 0.16)";
      for (let i = 0; i < 14; i++) {
        const x = (i * 173 - world.distance * (0.2 + (i % 3) * 0.12)) % (width + 40);
        ctx.fillRect((x + width + 40) % (width + 40) - 20, 40 + ((i * 67) % 170), 3, 3);
      }

      // Ground.
      ctx.fillStyle = "#404b42";
      ctx.fillRect(0, GROUND, width, 2);
      ctx.fillStyle = "rgba(64, 75, 66, 0.4)";
      for (let i = 0; i < width / 34 + 2; i++) {
        const x = (i * 34 - (world.distance % 34)) | 0;
        ctx.fillRect(x, GROUND + 8, 14, 2);
      }

      for (const o of world.obstacles) {
        ctx.fillStyle = "#242e26";
        ctx.fillRect(o.x, GROUND - o.h, o.w, o.h);
        ctx.strokeStyle = "#707b70";
        ctx.strokeRect(o.x + 0.5, GROUND - o.h + 0.5, o.w - 1, o.h - 1);
        // Moss cap so hazards read instantly against the dark.
        ctx.fillStyle = "rgba(164, 205, 121, 0.8)";
        ctx.fillRect(o.x, GROUND - o.h, o.w, 4);
      }

      for (const c of world.coins) {
        const pulse = 1 + Math.sin(world.time * 6 + c.x * 0.05) * 0.15;
        ctx.fillStyle = "rgba(214, 238, 245, 0.18)";
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * pulse * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(226, 244, 248, 0.85)";
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * pulse, 0, Math.PI * 2);
        ctx.fill();
        // Glint, so it reads as a water drop rather than a coin.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(c.x - c.r * 0.45, c.y - c.r * 0.5, 2, 2);
      }

      drawSprite(
        ctx,
        sprite,
        PLAYER_X,
        world.player.y,
        world.time,
        world.mode === "playing" && world.player.grounded,
        !world.player.grounded
      );

      ctx.textAlign = "right";
      ctx.fillStyle = "#a4cd79";
      ctx.font = `600 18px ${monoFont}`;
      ctx.fillText(String(world.score).padStart(5, "0"), width - 20, 34);

      if (world.mode === "idle") {
        overlay("Dew Run", "Space or tap to start. Jump the stones, grab the dewdrops.");
      } else if (world.mode === "over") {
        overlay(`Run over at ${world.score}`, "Space or tap to go again.");
      } else if (world.mode === "paused") {
        overlay("Paused", "Space or tap to resume.");
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      draw();
      rafId = requestAnimationFrame(loop);
    };

    const start = () => {
      last = performance.now();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    };

    const act = () => {
      const world = worldRef.current;
      if (world.mode === "idle" || world.mode === "over") {
        worldRef.current = freshWorld("playing");
        return;
      }
      if (world.mode === "paused") {
        world.mode = "playing";
        return;
      }
      if (world.player.grounded) {
        world.player.vy = JUMP_VELOCITY;
        world.player.grounded = false;
      }
    };

    const onPointer = (event: PointerEvent) => {
      event.preventDefault();
      act();
    };
    const onKey = (event: KeyboardEvent) => {
      if (!visible || (event.code !== "Space" && event.code !== "ArrowUp")) {
        return;
      }
      // Ignore keys typed into any editable element: the game only owns
      // Space/ArrowUp when the user isn't writing text.
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      ) {
        return;
      }
      event.preventDefault();
      act();
    };

    // Off-screen or hidden tab: freeze the run instead of killing it.
    const suspend = () => {
      if (worldRef.current.mode === "playing") {
        worldRef.current.mode = "paused";
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          start();
        } else {
          suspend();
          cancelAnimationFrame(rafId);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) {
        suspend();
        cancelAnimationFrame(rafId);
      } else if (visible) {
        start();
      }
    };

    canvas.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(bestRaf);
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <Reveal className="relative isolate px-6 py-32 lg:px-[4vw] lg:py-40" id="game">
      <KeyLight corner="br" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2
          className="text-[clamp(2.5rem,5vw,5rem)] font-semibold leading-none tracking-tight text-moss-50"
          data-split
        >
          Still here? Take a run.
        </h2>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-moss-500" data-reveal>
          Best {String(best).padStart(5, "0")}
        </p>
      </div>
      <div
        className="mt-10 overflow-hidden rounded-2xl border border-moss-800 bg-moss-950/70 backdrop-blur-sm"
        data-reveal
      >
        <canvas
          aria-label="Dew Run: press space or tap to jump over stones and collect dewdrops"
          className="block h-[300px] w-full cursor-pointer touch-none"
          ref={canvasRef}
          role="img"
        />
      </div>
    </Reveal>
  );
};
