import { createFaceRig, type Mood } from "@/components/sprite-face";
import { gsap } from "gsap";

/** Dispatch on the host element to make the sprite hop with joy. */
export const SPRITE_CHEER = "sprite:cheer";
/** Fired on the host each time the sprite hops (the water shakes off). */
export const SPRITE_HOP = "sprite:hop";

// Cursor speed (px/ms, smoothed) that reads as being shaken about.
const DIZZY_SPEED = 2.8;
// Idle seconds before the eyes droop; a yawn and sleep follow (~9s in all).
const DROWSY_AFTER_S = 6;
const GLANCE_AFTER_S = 2.5;

// Each poke cycles to the next reaction; a flurry of pokes makes it dizzy.
const POKES: { gesture: "hop" | "startle" | "tilt"; hearts?: boolean; mood: Mood }[] = [
  { gesture: "hop", mood: "happy" },
  { gesture: "startle", mood: "surprised" },
  { gesture: "hop", hearts: true, mood: "love" },
  { gesture: "tilt", mood: "wink" },
];

/**
 * The sprite's behaviour: eyes follow the cursor, it blinks, glances around
 * when you go still, yawns and falls asleep when you leave it alone, gets happy when you
 * hover it, dizzy when you whip the cursor around, and reacts to pokes with a
 * different emotion and gesture each time.
 *
 * Expects under `host`: `[data-face]` rigs, `[data-gesture]` (the body
 * layer gestures move), optional `[data-poke]` (hover/click target),
 * `[data-fx-heart]` and `[data-fx-zee]` particles. Create inside a GSAP
 * context; call the returned cleanup to drop the DOM listeners.
 */
export const createSpriteBrain = (host: HTMLElement, isFlipped: () => boolean = () => false) => {
  const rig = createFaceRig(host);
  const body = host.querySelector<HTMLElement>("[data-gesture]");
  const poke = host.querySelector<HTMLElement>("[data-poke]");
  const hearts = gsap.utils.toArray<HTMLElement>("[data-fx-heart]", host);
  const zees = gsap.utils.toArray<HTMLElement>("[data-fx-zee]", host);

  let hovering = false;
  let asleep = false;
  let lastMove = performance.now();
  let lastSample = { t: lastMove, x: 0, y: 0 };
  let speed = 0;
  let dizzyCooldown = 0;
  let pokeIndex = 0;
  let pokeTimes: number[] = [];
  let revert: gsap.core.Tween | null = null;
  let doze: gsap.core.Timeline | null = null;
  let bedtime: gsap.core.Timeline | null = null;
  // Held so waking can stop them: killTweensOf misses keyframe tweens.
  let snores: gsap.core.Tween[] = [];

  const base = (): Mood => (hovering ? "happy" : "neutral");

  /** Show a mood for `seconds`, then fall back to the resting mood. */
  const react = (mood: Mood, seconds: number) => {
    revert?.kill();
    rig.setMood(mood);
    revert = gsap.delayedCall(seconds, () => rig.setMood(base()));
  };

  const gesture = {
    hop: () =>
      gsap
        .timeline({ onStart: () => host.dispatchEvent(new Event(SPRITE_HOP)) })
        .to(body, { duration: 0.1, scaleX: 1.08, scaleY: 0.9 })
        .to(body, { duration: 0.22, ease: "power2.out", scaleX: 0.94, scaleY: 1.08, y: -38 })
        .to(body, { duration: 0.22, ease: "power2.in", y: 0 })
        .to(body, { duration: 0.08, scaleX: 1.07, scaleY: 0.92 })
        .to(body, { duration: 0.45, ease: "elastic.out(1, 0.4)", scaleX: 1, scaleY: 1 }),
    shake: () =>
      gsap.fromTo(
        body,
        { x: -8 },
        { duration: 0.06, ease: "sine.inOut", repeat: 7, x: 8, yoyo: true, onComplete: () => gsap.set(body, { x: 0 }) }
      ),
    startle: () =>
      gsap
        .timeline()
        .to(body, { duration: 0.12, ease: "power2.out", scale: 1.07, y: -14 })
        .to(body, { duration: 0.5, ease: "elastic.out(1, 0.45)", scale: 1, y: 0 }),
    tilt: () =>
      gsap
        .timeline()
        .to(body, { duration: 0.25, ease: "back.out(2)", rotation: -9 })
        .to(body, { delay: 0.7, duration: 0.5, ease: "elastic.out(1, 0.5)", rotation: 0 }),
    wiggle: () =>
      gsap
        .timeline()
        .to(body, { duration: 0.1, rotation: 6 })
        .to(body, { duration: 0.14, rotation: -6 })
        .to(body, { duration: 0.14, rotation: 4 })
        .to(body, { duration: 0.3, ease: "elastic.out(1, 0.4)", rotation: 0 }),
  };

  const burstHearts = () =>
    hearts.forEach((heart, index) =>
      gsap.fromTo(
        heart,
        { autoAlpha: 0, scale: 0.4, x: 0, y: 0 },
        {
          delay: index * 0.12,
          duration: 1.4,
          ease: "power1.out",
          keyframes: { autoAlpha: [0, 1, 1, 0] },
          scale: 1,
          x: gsap.utils.random(-30, 30),
          y: -90,
        }
      )
    );

  const snooze = () => {
    rig.setMood("asleep");
    rig.breathe(true);
    doze = gsap
      .timeline({ repeat: -1 })
      .to(body, { duration: 1.8, ease: "sine.inOut", rotation: 3, y: 5 })
      .to(body, { duration: 1.8, ease: "sine.inOut", rotation: 0, y: 0 });
    snores = zees.map((zee, index) =>
      gsap.fromTo(
        zee,
        { autoAlpha: 0, scale: 0.5, x: 0, y: 0 },
        {
          delay: index * 0.9,
          duration: 2.7,
          ease: "sine.out",
          keyframes: { autoAlpha: [0, 1, 0] },
          repeat: -1,
          scale: 1.1,
          x: 22,
          y: -60,
        }
      )
    );
  };

  /** Lids droop, then a big stretching yawn, then it nods off. */
  const fallAsleep = () => {
    asleep = true;
    revert?.kill();
    rig.setMood("sleepy");
    bedtime = gsap
      .timeline()
      .add(() => rig.setMood("yawn"), 1.6)
      // Stretch up and lean back with the yawn, then sink into sleep.
      .to(body, { duration: 0.7, ease: "sine.out", rotation: -3, scaleX: 0.96, scaleY: 1.07, y: -6 }, 1.6)
      .to(body, { duration: 0.9, ease: "sine.inOut", rotation: 0, scaleX: 1, scaleY: 1, y: 0 }, 3)
      .add(snooze, 3.3);
  };

  const wake = () => {
    asleep = false;
    bedtime?.kill();
    doze?.kill();
    rig.breathe(false);
    snores.forEach((snore) => snore.kill());
    snores = [];
    gsap.set(zees, { autoAlpha: 0 });
    gsap.to(body, { duration: 0.3, rotation: 0, scaleX: 1, scaleY: 1, y: 0 });
    // The move that woke it shouldn't also read as being shaken about.
    dizzyCooldown = performance.now() + 1500;
    gesture.startle();
    react("surprised", 0.7);
  };

  const onPointerMove = (event: PointerEvent) => {
    const now = performance.now();
    const dt = Math.max(1, now - lastSample.t);
    const dist = Math.hypot(event.clientX - lastSample.x, event.clientY - lastSample.y);
    speed = speed * 0.85 + (dist / dt) * 0.15;
    lastSample = { t: now, x: event.clientX, y: event.clientY };
    lastMove = now;

    if (asleep) {
      wake();
    } else if (speed > DIZZY_SPEED && now > dizzyCooldown) {
      dizzyCooldown = now + 3000;
      gesture.shake();
      react("dizzy", 1.3);
    }

    const rect = host.getBoundingClientRect();
    const x = gsap.utils.clamp(-1, 1, (event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth * 0.4));
    const y = gsap.utils.clamp(-1, 1, (event.clientY - (rect.top + rect.height * 0.55)) / (window.innerHeight * 0.4));
    rig.look(isFlipped() ? -x : x, y);
  };

  const onEnter = () => {
    hovering = true;
    if (asleep) {
      wake();
      return;
    }
    if (!revert?.isActive()) {
      rig.setMood("happy");
      gesture.wiggle();
    }
  };

  const onLeave = () => {
    hovering = false;
    if (!asleep && !revert?.isActive()) {
      rig.setMood("neutral");
    }
  };

  const onPoke = (event: MouseEvent) => {
    // Mouse pokes drop focus so a later key press (even a screenshot
    // shortcut) doesn't paint the keyboard focus ring; keyboard pokes keep it.
    if (event.detail > 0) {
      poke?.blur();
    }
    const now = performance.now();
    lastMove = now;
    if (asleep) {
      wake();
      return;
    }
    pokeTimes = [...pokeTimes.filter((t) => now - t < 1200), now];
    if (pokeTimes.length >= 4) {
      pokeTimes = [];
      gesture.shake();
      react("dizzy", 1.5);
      return;
    }
    const next = POKES[pokeIndex % POKES.length];
    pokeIndex += 1;
    gesture[next.gesture]();
    if (next.hearts) {
      burstHearts();
    }
    react(next.mood, 1.6);
  };

  const onCheer = () => {
    lastMove = performance.now();
    if (asleep) {
      wake();
    }
    gesture.hop();
    react("happy", 2.2);
  };

  // Life between interactions: blinks, idle glances, and dozing off.
  const scheduleBlink = () =>
    gsap.delayedCall(gsap.utils.random(2.2, 5.5), () => {
      rig.blink();
      if (Math.random() < 0.2) {
        gsap.delayedCall(0.28, rig.blink);
      }
      scheduleBlink();
    });
  const scheduleIdle = () =>
    gsap.delayedCall(gsap.utils.random(1.4, 2.8), () => {
      const idle = (performance.now() - lastMove) / 1000;
      if (!asleep && idle > DROWSY_AFTER_S) {
        fallAsleep();
      } else if (!asleep && idle > GLANCE_AFTER_S) {
        rig.look(gsap.utils.random(-0.8, 0.8), gsap.utils.random(-0.6, 0.5));
      }
      scheduleIdle();
    });
  scheduleBlink();
  scheduleIdle();

  // Scrolling, typing or touching is activity too, so it never dozes off
  // while someone is reading with a trackpad.
  const onActivity = () => {
    lastMove = performance.now();
    if (asleep) {
      wake();
    }
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("scroll", onActivity, { passive: true });
  window.addEventListener("keydown", onActivity);
  window.addEventListener("touchstart", onActivity, { passive: true });
  host.addEventListener(SPRITE_CHEER, onCheer);
  poke?.addEventListener("pointerenter", onEnter);
  poke?.addEventListener("pointerleave", onLeave);
  poke?.addEventListener("click", onPoke);

  return () => {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("scroll", onActivity);
    window.removeEventListener("keydown", onActivity);
    window.removeEventListener("touchstart", onActivity);
    host.removeEventListener(SPRITE_CHEER, onCheer);
    poke?.removeEventListener("pointerenter", onEnter);
    poke?.removeEventListener("pointerleave", onLeave);
    poke?.removeEventListener("click", onPoke);
  };
};
