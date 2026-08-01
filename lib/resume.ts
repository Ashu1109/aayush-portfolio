/**
 * Single source of truth for resume content.
 * Rendered in the page sections and injected into the chat system prompt,
 * so the site and the AI never disagree.
 */

export const CONTACT = {
  email: "aayushkumarhigh@gmail.com",
  location: "Jamshedpur, Jharkhand, India",
  name: "Aayush Kumar",
  phone: "+91 74886 12219",
} as const;

export type Experience = {
  company: string;
  role: string;
  period: string;
  summary: string;
  highlights: string[];
  stack: string[];
};

export const EXPERIENCE: Experience[] = [
  {
    company: "LoglineAI",
    highlights: [
      "Designed a resilient, event-driven microservices platform on Kafka and Redpanda that orchestrates a 14-agent Claude pipeline, resolving identity drift in long-form narratives.",
      "Engineered transactional outbox patterns for atomic consistency, SSE fan-out for real-time propagation, and schema optimization in PostgreSQL with Prisma.",
      "Owned the DevOps lifecycle: multi-tenant, model-agnostic routing on AWS ECS with Terraform, plus observability with OpenTelemetry and SigNoz.",
    ],
    period: "Feb 2026 - Present",
    role: "Full Stack Engineer, AI",
    stack: ["Kafka", "Redpanda", "PostgreSQL", "Prisma", "AWS ECS", "Terraform", "OpenTelemetry"],
    summary:
      "Owns end-to-end architecture for a platform that keeps a 14-agent Claude pipeline coherent across long-form stories.",
  },
  {
    company: "Grovio AI",
    highlights: [
      "Architected the infrastructure for an AI-native marketing OS and oversaw production deployment of autonomous multi-agent workflows.",
      "Built high-concurrency backends with asynchronous job orchestration and database optimization for persistent, tool-enabled agent workflows.",
      "Owned reliability and performance tuning for bursty, multi-tenant workloads with careful state management and fault tolerance.",
    ],
    period: "Jun 2025 - Jan 2026",
    role: "Full Stack Engineer (Founding Team)",
    stack: ["Node.js", "PostgreSQL", "Redis", "AWS", "Multi-agent systems"],
    summary:
      "Built the backbone of an AI-native marketing OS running autonomous agents in production.",
  },
  {
    company: "Quanta AI Labs",
    highlights: [
      "Engineered generative features on OpenAI and Anthropic APIs with streaming, prompt caching, and tool-use orchestration to cut latency.",
      "Architected end-to-end RAG pipelines with vector storage, retrieval, and reranking; managed the lifecycle from spec to production.",
    ],
    period: "Sep 2024 - Jun 2025",
    role: "Generative AI Engineer (Intern)",
    stack: ["Python", "RAG", "Vector search", "OpenAI", "Anthropic"],
    summary:
      "Shipped production RAG pipelines and low-latency generative features.",
  },
];

export const SKILLS = [
  { group: "Languages", items: ["Python", "TypeScript", "JavaScript", "C/C++"] },
  { group: "Web & Backend", items: ["Next.js", "Node.js", "Express.js", "Prisma", "Temporal", "Redis", "Apache Kafka", "Redpanda", "SSE"] },
  { group: "AI / ML", items: ["Generative AI", "RAG pipelines", "LangChain", "Crew AI", "Google ADK"] },
  { group: "Databases", items: ["PostgreSQL", "MySQL", "MongoDB"] },
  { group: "DevOps", items: ["Docker", "AWS (EC2, ECR, ECS, S3, SQS, RDS)", "Nginx", "Terraform", "GitHub Actions", "OpenTelemetry", "SigNoz"] },
] as const;

export const EDUCATION = {
  degree: "B.Tech in Computer Science and Engineering",
  detail: "CGPA 7.66",
  period: "2022 - 2026",
  school: "National Institute of Technology, Jamshedpur",
} as const;

export const LEADERSHIP = {
  bullets: [
    "Organized 5+ workshops and hackathons, building technical culture for 200+ juniors.",
    "Mentored 50+ students in DSA and full-stack development through code reviews.",
  ],
  org: "Programming Club, NIT Jamshedpur",
  period: "Apr 2024 - Present",
  role: "Event Organizer & Mentor",
} as const;

export const PROJECTS = [
  {
    description:
      "Internal AI media studio at Logline AI: one surface for image and video generation across 200+ models, with project-gated access, per-model budgets, quotas, and usage attribution. Ships a built-in MCP server (OAuth via Clerk) so Claude agents can drive generations with the exact same permissions and billing as the web app.",
    name: "LoglineAI Studio",
    stack: ["Next.js", "Clerk", "MCP", "PostgreSQL", "200+ gen models"],
  },
  {
    description:
      "Secure code execution platform with a Redis-queued engine and sandboxed Docker workers, orchestrated via Docker Compose with shared Prisma migrations.",
    name: "LeetCode Clone",
    stack: ["Next.js", "Docker", "Redis", "Prisma"],
  },
  {
    description:
      "This site: a Three.js painted canvas, GSAP-driven scroll scenes, an AI assistant that answers questions about my work, and Ember Run, a playable pixel endless runner at the bottom.",
    name: "This portfolio",
    stack: ["Next.js", "Three.js", "GSAP", "AI SDK", "Canvas 2D"],
  },
] as const;

export const LINKS = {
  githubPersonal: "https://github.com/Ashu1109",
  githubWork: "https://github.com/Aayush-hoichoi",
  loglinePlatform: "https://v2.logline.ai",
  loglineTransition: "https://logline-transition-site.vercel.app",
} as const;

const loglineContext = `
# Deep Context: Logline AI and LoglineOS (Aayush's current work)

## The company
Logline AI is an AI audio-visual creative venture under hoichoi (India's leading Bengali OTT platform) and SVF (Shree Venkatesh Films, East India's largest entertainment company), led by Vishnu Mohta. Roughly 38 people across three divisions: Services (AI creative studio for client work), IP (original content: Mahishasuramardini, Samrat Ashoka, Chanakya, and more), and LoglineOS - the proprietary AI production platform being productized as SaaS. Aayush is one of the engineers on the LoglineOS tech team.

## What LoglineOS does
Converts a screenplay into editor-ready video for micro-drama and short-form content. A 14-agent AI pipeline parses and analyzes the script into a Master Sheet (one row per shot), then a staged, lock-gated flow runs: cast and faces, costumes/locations/props, scene visuals, storyboard (first/last frame images), and Kling v3 video generation. Every shot is generated from a locked reference stack (face + costume + location + scene visual + frame prompts) so identity stays consistent across shots - the core innovation over generic tools that drift.

## Aayush's exact ownership (v2)
Two engineers build the platform; Aayush owns everything in the logline.ai monorepo (his colleague Mohit owns the separate Python agent service). Aayush's scope:
- Frontend: Next.js 16 App Router, React 19, Zustand, Shadcn UI, SSE listener, S3 direct uploads, all review/generation UI
- Backend: Express 5 REST API, Clerk auth, Temporal workflow dispatch, SSE fan-out, job-reaper, Zod validation
- Worker: Node.js Temporal render worker - image generation (gpt-image-2 + Gemini 3 Pro Image) and video generation (Kling v3), with retry and idempotency
- Database: Prisma schema + migrations, the unified asset schema (one Asset/AssetVariation/GeneratedImage/AssetSheet/AssetBinding model with a single access layer)
- Infra/DevOps: AWS ECS/ECR/RDS/S3 via Terraform, CI/CD, Temporal Cloud + Redis wiring, OpenTelemetry + SigNoz observability, OpenMeter billing
- Generation pipeline architecture, workflows, and the image-generation prompt engineering
- Shared SSE event contracts package

## LoglineAI Studio (internal tool Aayush built)
A separate internal AI media studio Aayush built end to end at Logline: a single web surface where the team generates images and videos across 200+ state-of-the-art models. It has project-membership gating, per-model budgets and user balances, quotas, and full usage/billing attribution, plus an admin console and gallery. Its standout feature is a built-in remote MCP server (OAuth via Clerk with Dynamic Client Registration) that lets Claude clients - claude.ai connectors, Claude Code, Claude Desktop - drive generations as the signed-in user with the exact same permissions, jobs, and billing as the web app. It also sends WhatsApp spend alerts when generation costs spike. There is no public link; it is internal to Logline.

## Cinema Studio and motion-capture enhancement (Aayush's technical work)
Inside LoglineAI Studio, Aayush built a Cinema Studio for video-to-video generation (motion capture, green-screen compositing, and performance transfer) and engineered the prompt-enhancement pipeline that makes the output directable:
- Designed the generation modes around locked invariants: the pipeline pins what must not change (performance, audio, camera) so the model only alters what the user asked for - this is what keeps motion-capture output consistent instead of drifting.
- Built a server-side LLM prompt enhancer that restructures raw user prompts into strict per-mode production-brief templates, with attached assets bound by exact labels so each reference lands in the right slot.
- Handled enhancer refusals as structured responses with graceful fallback to the raw prompt, so a declined restructure never fails the generation job.
- Added cinematic camera direction (body, lens, focal length, aperture) as a sanitized, length-capped block woven into the brief server-side - camera input can never inject into the template - with savable camera presets.
- Kept generation API keys server-only, and inspected + downscaled media client-side before upload to stay within model input limits.

## The v1 to v2 rebuild (2026)
Aayush co-led rebuilding the entire platform from v1 to v2 - the async backbone moved from Kafka/Redpanda + transactional outbox to Temporal Cloud workflows with Redis pub/sub for realtime; the pipeline grew from 10 Claude agents to 14 multi-provider agents; five per-type asset families were unified into one schema; deployment moved from EC2 + SSH restarts to Terraform-managed ECS with rolling deploys; and v2 added Studio batch generation, voice casting, and scene-video loops.
- Live platform: ${"https://v2.logline.ai"}
- The v1 to v2 transition story (interactive site with the timeline, headline deltas, who built it, and how it was built with Claude Code): ${"https://logline-transition-site.vercel.app"}
`.trim();

const resumeText = `
# Aayush Kumar
${CONTACT.location} | ${CONTACT.phone} | ${CONTACT.email}
Personal GitHub: ${LINKS.githubPersonal} | Work GitHub (hoichoi/Logline): ${LINKS.githubWork}

## Education
${EDUCATION.school}, ${EDUCATION.period}. ${EDUCATION.degree}, ${EDUCATION.detail}.

## Work Experience
${EXPERIENCE.map(
  (job) => `### ${job.company} (${job.period}) - ${job.role}
${job.highlights.map((h) => `- ${h}`).join("\n")}`
).join("\n\n")}

## Technical Skills
${SKILLS.map((s) => `- ${s.group}: ${s.items.join(", ")}`).join("\n")}
- Tools: Git, GitHub, GitHub Actions, Claude Code, Codex, Cursor, CMUX

## Projects
${PROJECTS.map((p) => `- ${p.name}: ${p.description} (${p.stack.join(", ")})`).join("\n")}

## Leadership
${LEADERSHIP.org} | ${LEADERSHIP.role} (${LEADERSHIP.period})
${LEADERSHIP.bullets.map((b) => `- ${b}`).join("\n")}
`.trim();

export const CHAT_SYSTEM_PROMPT = `You are the AI assistant on Aayush Kumar's portfolio website. Visitors are usually recruiters, hiring managers, and engineers evaluating Aayush for a role.

If asked what model or technology powers you, say you are Aayush's portfolio assistant and leave it at that; never name the underlying model or provider.

Answer questions about Aayush using only the resume below. Be warm, direct, and concise; lead with the most relevant facts. When a question maps to concrete experience, cite the company and what he built there. If asked something the resume does not cover (salary expectations, notice period, references, personal details), say you don't have that information and suggest emailing Aayush at ${CONTACT.email}. Never invent employers, dates, metrics, or skills.

If asked why Aayush is a strong candidate, ground the answer in the resume: founding-team ownership at two AI startups, production multi-agent infrastructure, and end-to-end DevOps experience.

When someone asks about Logline AI, LoglineOS, or wants to see his work, use the deep-context section and share the relevant link: the live platform at ${LINKS.loglinePlatform}, and the interactive v1-to-v2 transition story at ${LINKS.loglineTransition} (it shows the rebuild timeline and how it was built). Share links as plain URLs or markdown links.

<resume>
${resumeText}
</resume>

<logline_deep_context>
${loglineContext}
</logline_deep_context>`;
