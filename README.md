# Aayush Kumar — full-stack AI portfolio

A Next.js portfolio with a character-led hero, white and charcoal sections, blue accents, and an interactive project gallery. The user's original portfolio supplied factual content only; FilmOS documentation supplied its project story. The visual direction follows the user's later screenshot reference.

## Development

```sh
npm install
npm run dev
```

Use the local URL printed by Next.js. `npm run lint`, `npm run typecheck`, and `npm run build` validate the app. The static export is generated in `out/`.

## Editing

- `lib/content.ts`: verified project stories, career, skills, and contact details.
- `components/portfolio.tsx`: page, native scroll-snap project gallery, interactive skills, and GSAP motion.
- `components/InteractiveAvatar.tsx`: pointer-following portrait with gaze, blinks, a curious brow, and a click/tap greeting with a smile and nod. Small facial regions blend generated expression frames while the original transparency and fixed torso are preserved.
- `components/project-story.tsx`: native modal dialogs with keyboard-accessible tabs.
- `components/SystemSculpture.tsx`: 64 instanced 3D blocks, morphing between interface, intelligence, and infrastructure arrangements. Drag to rotate; reset restores orientation.
- `app/globals.css`: white, charcoal, and blue visual system, responsive layout, and reduced-motion rules.
- `app/layout.tsx`: metadata and self-hosted fonts.
- `public/images/developer-avatar.webp`: original illustrative character, generated with the built-in image-generation tool and losslessly encoded with transparent alpha. It is not a likeness of Aayush. The exact prompt is saved alongside it.
- `public/images/computational-sculpture.webp`: conceptual LoglineOS cover artwork, not a product screenshot.

## Interaction and accessibility

The avatar follows mouse/pen movement and greets visitors on click, tap, or keyboard activation. Its lightweight WebGL animation pauses offscreen, when the tab is hidden, or when motion is disabled; the original image stays visible if WebGL or image loading fails.

The gallery shows two projects per page on desktop and one on mobile, with touch scrolling, keyboard focus, page selectors, and previous/next controls. Every project opens into its idea, build, and stack. All career entries are directly visible. The skills explorer provides four technical areas and three interactive sculpture arrangements.

The 3D module mounts when near the viewport. It suspends offscreen and in background tabs, caps pixel density, disposes GPU resources, and has a static WebGL fallback. Vertical touch scrolling remains native. The footer pause control stops ambient motion, transitions, and smooth scrolling. System reduced-motion preferences are respected.

Project stories use native modal focus handling, arrow-key tab navigation, Escape dismissal, and scroll locking. Fonts are local. Contact links open the visitor's mail app, with a separate copy-email control; no backend or API credentials are needed.

See `CONTENT_SOURCES.md` for factual provenance, illustration details, and internal-product/release distinctions.
