# Content provenance

Original source: https://github.com/Ashu1109/aayush-portfolio — `lib/resume.ts`. Only factual profile, employment, skills, education, projects, and verified URLs were used. No source UI/UX was reused.

FilmOS was explicitly added at the user's request. Sources supplied by the user: the FilmOS documentation in `docs/filmos/` from the LoglineOS film-edition project.

- `README.md`: project identity; Aayush + Avinash, two full-stack developers.
- `SYSTEM_DESIGN.md`: current architecture, tenant isolation, human approvals, and Temporal generation workflows.
- `AUDIT_REMEDIATION.md` (2026-09-07): implemented and validated features; distinguishes branch validation from production release.
- `AUDIT_FEATURE_COVERAGE.csv`: incomplete/deferred work, excluded from completed feature claims.

## Deliberate distinctions

- LoglineOS v2 uses Temporal Cloud and Redis. Kafka/Redpanda belongs to the earlier v1 architecture.
- FilmOS is co-built and validated ahead of release; no public production URL is asserted.
- LoglineAI Studio is an internal product with no public URL.
- The original LeetCode Clone has no verified repository URL. Its displayed descriptive name is “Code execution engine.”
- No availability claim, client quote, LinkedIn URL, or downloadable CV was invented. The hero character is an original illustration, not a portrait or claimed likeness of Aayush.
- Old portfolio-specific game and chatbot descriptions were not carried into this new implementation.

## Redesign artwork

The LoglineOS cover includes a generated conceptual glass-and-metal computational sculpture. It is illustrative artwork, not a screenshot or depiction of the actual platform. The skills playground's interactive block sculpture is procedural Three.js geometry. Neither artwork introduces product or usage claims.

The September 11 redesign follows the user's visual reference: white and charcoal sections, blue accents, capsule navigation, a character-led hero, and a project gallery. The generic original developer avatar was explicitly requested and generated with the built-in image generation tool. Its exact prompt is recorded in `public/images/developer-avatar-prompt.txt`; the transparent final asset is `public/images/developer-avatar.webp` (losslessly encoded from the generated PNG). It is not based on any real person's likeness. The decorative service diagrams are conceptual explanations of capabilities, not product screenshots.

## Avatar interaction

At the user's request, the original avatar now follows the pointer and responds with blinks, a curious brow, and a happy greeting. `components/InteractiveAvatar.tsx` uses a lightweight WebGL portrait deformation with a fixed torso, head movement around a neck pivot, localized gaze, and facial expression blending. The happy and blink expression images were generated as identity-preserving edits with the built-in image generation tool; exact prompts are saved alongside the assets. The expression outputs have opaque backgrounds, so only small facial RGB regions are sampled; alpha always comes from the original transparent illustration. They must not be used as full-frame overlays. Motion pauses offscreen, when the document is hidden, through the user's motion control, and for reduced-motion preferences. The original portrait remains the rendering fallback.
