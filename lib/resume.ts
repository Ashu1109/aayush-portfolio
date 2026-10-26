/** Single source of truth for resume content, rendered by the page sections. */

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
    // Ordered by weight: the journey shows the first three.
    highlights: [
      "FilmOS: built and own a film-production platform end to end (Next.js web app, Express API, Temporal workers and a Tauri desktop app). 500 daily active users; saves Rs. 7L+ (about $8K) a month in production tooling and agency fees.",
      "LoglineOS: architected and shipped a 5-service AI pre-production monorepo powered by a 14-agent Claude/Gemini pipeline, orchestrated with Temporal and deployed to AWS ECS via Terraform. Cut p50 generation latency 20x (about 10 min to 30 s) by splitting Temporal tasks per image, so one slow image no longer holds up the batch.",
      "Reliability and security: instrumented every service with OpenTelemetry into SigNoz and put AWS WAF in front of production. Fixed all 8 P0 security findings, including a cross-tenant data leak, and ran a 51-issue production-readiness audit.",
      "FilmOS platform: multi-tenant role-based access control stored as data, tenant-isolated S3 storage, approval chains, shot-aware Temporal workflows and traceable archive handoffs, on a 154-model Postgres schema with 246 API routes and additive-only migrations.",
      "FilmOS AI agent and editors: shipped an in-app production agent that generates scenes and assembles a cut through the same permission-checked API routes the UI uses, traced in Langfuse. Built the editors it drives: a timeline editor (built on OpenCut), a 3D stage-blocking editor (three.js/R3F) and a storyboard canvas.",
      "LoglineOS infra and data: replaced Kafka/Redpanda and a transactional outbox with Temporal Cloud and Redis Pub/Sub (live progress over server-sent events). Collapsed 15+ type-specific tables into one asset model with a zero-data-loss RDS migration.",
      "LoglineAI Studio: image and video generation across 200+ models with project access, budgets, quotas and usage billing. Added an OAuth-protected MCP server for Claude, plus Cinema Studio (motion capture, compositing, performance transfer).",
      "Leadership and delivery: managed the creative team and coordinated with the official Seedance team through launch. Built the testing and CI setup: 1,100+ test files in sharded CI with enforced coverage floors (Claude Code, Vitest, Zod).",
    ],
    period: "Feb 2026 - Present",
    role: "Full Stack Engineer, AI",
    stack: ["Next.js", "Temporal", "PostgreSQL", "Redis", "Tauri", "three.js", "AWS ECS", "Terraform", "OpenTelemetry"],
    summary:
      "Builds and owns FilmOS end to end, and the 14-agent pipeline behind LoglineOS. 500 people use it every day.",
  },
  {
    company: "Grovio AI",
    highlights: [
      "Architected an AI-native marketing OS monorepo with isolated prod and staging environments and a full local setup for autonomous multi-agent workflows.",
      "Built SSE-streamed agent chat with artifact previews, image generation, and scheduled content publishing.",
      "Owned asynchronous job orchestration for persistent, tool-enabled agents: state management, fault tolerance, and performance under bursty multi-tenant load.",
    ],
    period: "Jun 2025 - Jan 2026",
    role: "Full Stack Engineer (Founding Team)",
    stack: ["Node.js", "PostgreSQL", "Redis", "SSE", "Multi-agent systems"],
    summary:
      "Built the backbone of an AI-native marketing OS running autonomous agents in production.",
  },
  {
    company: "Quanta AI Labs",
    highlights: [
      "Shipped generative features on OpenAI and Anthropic APIs; cut latency and cost via streaming, prompt caching, and tool use.",
      "Built production RAG pipelines end to end (spec to deploy) combining vector storage, retrieval, and reranking.",
    ],
    period: "Sep 2024 - Jun 2025",
    role: "Generative AI Engineer (Intern)",
    stack: ["Python", "RAG", "Vector search", "OpenAI", "Anthropic"],
    summary:
      "Shipped production RAG pipelines and low-latency generative features.",
  },
];

export const SKILLS = [
  { group: "Languages", items: ["TypeScript", "JavaScript", "Python", "C/C++", "SQL"] },
  { group: "Frontend", items: ["Next.js", "React", "Tailwind CSS", "Zustand", "three.js / React Three Fiber", "Yjs"] },
  { group: "Backend", items: ["Node.js", "Express.js", "Temporal", "Kafka/Redpanda", "Redis Streams", "Prisma", "Zod", "Server-sent events", "Turborepo / pnpm"] },
  { group: "AI / LLM", items: ["Multi-agent orchestration (Claude, Gemini, OpenAI, DeepSeek)", "MCP (OAuth-protected servers)", "Seedance / Seedream", "RAG", "LangChain", "CrewAI", "Langfuse", "Claude Code"] },
  { group: "Databases", items: ["PostgreSQL (pgvector)", "MySQL", "MongoDB"] },
  { group: "DevOps", items: ["Docker", "AWS (ECS, RDS, EC2, S3, SQS, ECR, CloudFront, WAF, KMS, IAM, SSM)", "Terraform", "Nginx", "GitHub Actions", "OpenTelemetry (SigNoz)"] },
  { group: "Security & Testing", items: ["Role-based access control", "Multi-tenant isolation", "OAuth 2.0 / JWT", "Vitest", "React Testing Library"] },
] as const;

export const EDUCATION = {
  degree: "B.Tech in Computer Science and Engineering",
  detail: "CGPA 8.0",
  period: "2022 - 2026",
  school: "National Institute of Technology, Jamshedpur",
} as const;

// Most recent first.
export const LEADERSHIP = [
  {
    bullets: ["Trained hoichoi teams to build production tools with Claude Code and agentic workflows."],
    org: "hoichoi",
    period: "2026",
    role: "AI Adoption & Claude Code Enablement",
  },
  {
    bullets: [
      "Organized 5+ workshops and hackathons for 200+ juniors.",
      "Mentored 50+ students in DSA and full-stack development.",
    ],
    org: "Programming Club, NIT Jamshedpur",
    period: "Apr 2024 - May 2026",
    role: "Event Organizer & Mentor",
  },
] as const;

export const PROJECTS = [
  {
    description:
      "LoglineAI's film-production platform, built and owned end to end: Next.js web app, Express API, Temporal workers and a Tauri desktop app. An in-app agent generates scenes and assembles cuts through the same permission-checked routes as the UI, driving a timeline editor, a 3D stage-blocking editor and a storyboard canvas. 500 daily users; saves Rs. 7L+ a month.",
    name: "FilmOS",
    stack: ["Next.js", "Express", "Temporal", "Tauri", "three.js / R3F", "Langfuse"],
  },
  {
    description:
      "AI pre-production monorepo of 5 services around a 14-agent Claude/Gemini pipeline, orchestrated with Temporal Cloud on AWS ECS. Cut p50 generation latency 20x (about 10 min to 30 s), with live progress streamed over Redis Pub/Sub and server-sent events.",
    name: "LoglineOS",
    stack: ["Temporal Cloud", "Claude", "Gemini", "Redis", "AWS ECS", "Terraform"],
  },
  {
    description:
      "Internal AI media studio at Logline AI: one surface for image and video generation across 200+ models, with project-gated access, per-model budgets, quotas, and usage billing. Ships an OAuth-protected MCP server so Claude agents can drive generations with the same permissions as the web app, plus Cinema Studio for motion capture, compositing and performance transfer.",
    name: "LoglineAI Studio",
    stack: ["Next.js", "Clerk", "MCP", "PostgreSQL", "200+ gen models"],
  },
  {
    description:
      "This site: a scroll-staged story around a leaf sprite with a live, animated face (it follows your cursor, blinks, dozes off, and reacts to pokes), a Three.js firefly-glow canvas, and Dew Run, a playable endless runner at the bottom.",
    name: "This portfolio",
    stack: ["Next.js", "Three.js", "GSAP", "SVG", "Canvas 2D"],
  },
] as const;

export const LINKS = {
  githubPersonal: "https://github.com/Ashu1109",
  githubWork: "https://github.com/Aayush-hoichoi",
  linkedin: "https://www.linkedin.com/in/aayush-kumar-54a346258/",
} as const;
