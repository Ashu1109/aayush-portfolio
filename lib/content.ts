export const contact = {
  name: 'Aayush Kumar',
  email: 'aayushkumarhigh@gmail.com',
  github: 'https://github.com/Ashu1109',
  workGithub: 'https://github.com/Aayush-hoichoi',
  location: 'Jamshedpur, India',
};

export const projects = [
  {
    id: 'filmos', number: '01', name: 'FilmOS', kind: 'AI FILM PRODUCTION · ENTERPRISE PLATFORM',
    subtitle: 'AI filmmaking, with people in control.',
    description: 'A connected production workspace: from reference libraries and human approvals to shot-aware generation and traceable delivery.',
    stack: ['Next.js', 'Temporal', 'TypeScript', 'PostgreSQL'],
    role: 'Co-built with Avinash · Full-stack engineering',
    challenge: 'Film production involves many people, assets, and decisions. AI generation needs to respect that creative context, so every shot uses the right approved references and every handoff stays traceable.',
    solution: 'FilmOS connects screenplay versions, character and reference libraries, configurable approval chains, shot-aware generation, MoCap delivery, and immutable archive handoffs. Approved references synchronize transactionally into shot records.',
    ownership: 'As part of a two-developer team, I helped build the Next.js, API, and worker platform. The system combines tenant-isolated resources, Temporal generation workflows, real-time status, model budgets, and provenance-aware archives. The documented implementation is validated in branch; release acceptance is separate.',
    links: [], detail: 'Human approvals · Durable workflows',
  },
  {
    id: 'logline', number: '02', name: 'LoglineOS', kind: 'MULTI-AGENT SYSTEMS · AI FILMMAKING',
    subtitle: 'From a screenplay to a world on screen.',
    description: 'A production platform that turns scripts into consistent, editor-ready video. Fourteen agents. One coherent creative pipeline.',
    stack: ['Next.js', 'Temporal', 'PostgreSQL', 'AWS'],
    role: 'Full-stack architecture · Platform engineering',
    challenge: 'AI-generated stories lose visual identity between shots. Turning a script into a film needs more than a sequence of model calls: it needs a system that remembers, coordinates, and recovers.',
    solution: 'A staged, 14-agent workflow moves from script analysis through casting, scene visuals, storyboards, and video generation. A locked reference stack keeps faces, costumes, and locations consistent across shots.',
    ownership: 'I co-led the v1-to-v2 rebuild and own the Next.js frontend, Express API, Temporal render worker, shared asset schema, real-time event contracts, and AWS infrastructure. Temporal Cloud and Redis now power the asynchronous backbone, with Terraform-managed ECS deployments and OpenTelemetry observability.',
    links: [{label: 'Explore the platform', href: 'https://v2.logline.ai'}, {label: 'Read the rebuild story', href: 'https://logline-transition-site.vercel.app'}],
    detail: '14-agent pipeline',
  },
  {
    id: 'studio', number: '03', name: 'LoglineAI Studio', kind: 'GENERATIVE AI · DEVELOPER TOOLS',
    subtitle: 'Creative power. One connected studio.',
    description: 'Image and video generation across 200+ models, with a remote MCP server that brings the same tools directly to Claude.',
    stack: ['Next.js', 'MCP', 'Clerk', 'PostgreSQL'],
    role: 'End-to-end product & infrastructure',
    challenge: 'Creative teams need access to many generative models without fragmented permissions, runaway spend, or a separate workflow for every tool.',
    solution: 'One internal studio unifies generation, galleries, project membership, per-model budgets, quotas, and usage attribution. An OAuth-protected remote MCP server gives Claude clients the same permissions and billing as the web application.',
    ownership: 'I built the studio end to end, including a Cinema Studio for motion capture, compositing, and performance transfer. Its prompt-enhancement pipeline preserves performance, audio, and camera invariants, binds reference assets precisely, and falls back gracefully if enhancement is declined.',
    links: [], detail: 'Internal product · 200+ models',
  },
  {
    id: 'sandbox', number: '04', name: 'Code execution engine', kind: 'FULL-STACK ENGINEERING · SANDBOXING',
    subtitle: 'A safe place for code to run.',
    description: 'A LeetCode-style platform with queued execution, isolated Docker workers, and a shared, consistent data layer.',
    stack: ['Next.js', 'Docker', 'Redis', 'Prisma'],
    role: 'Full-stack development · Execution infrastructure',
    challenge: 'Running submitted code requires isolation and reliable job coordination. The interface, queue, workers, and database all need to agree on the execution lifecycle.',
    solution: 'A Redis-queued execution engine dispatches code to sandboxed Docker workers. Docker Compose orchestrates the services, while shared Prisma migrations keep the application and workers aligned.',
    ownership: 'I built the secure code execution platform across its Next.js application, job queue, sandboxed workers, and database layer.',
    links: [], detail: 'Redis queues · Docker isolation',
  },
] as const;
export type Project = (typeof projects)[number];

export const experience = [
  { company: 'LoglineAI', role: 'Full Stack Engineer, AI', period: 'FEB 2026 — PRESENT', current: true, text: 'Building the platform behind consistent AI filmmaking. Owning the web experience, generation workflows, and the infrastructure that brings it all together.', tags: ['Multi-agent systems', 'Temporal', 'AWS'] },
  { company: 'Grovio AI', role: 'Full Stack Engineer · Founding Team', period: 'JUN 2025 — JAN 2026', current: false, text: 'Built the backbone of an AI-native marketing OS: autonomous agents, high-concurrency backends, and reliable production workloads.', tags: ['Node.js', 'Redis', 'Agent orchestration'] },
  { company: 'Quanta AI Labs', role: 'Generative AI Engineer · Intern', period: 'SEP 2024 — JUN 2025', current: false, text: 'Shipped end-to-end RAG pipelines and generative features with streaming, prompt caching, and tool-use orchestration.', tags: ['Python', 'RAG', 'OpenAI & Anthropic'] },
];

export const expertise = [
  { number: '01', title: 'Interfaces that connect.', description: 'Thoughtful web experiences, backed by systems that make every interaction count.', tags: ['Next.js', 'React', 'TypeScript', 'JavaScript'], icon: 'web' },
  { number: '02', title: 'Intelligence that works.', description: 'Agents, retrieval, and generative workflows designed to do useful work in production.', tags: ['Python', 'RAG', 'LangChain', 'Crew AI', 'Google ADK'], icon: 'ai' },
  { number: '03', title: 'Systems that hold up.', description: 'Reliable APIs, durable workflows, and data models built for the whole product.', tags: ['Node.js', 'Express', 'Temporal', 'Redis', 'PostgreSQL', 'Prisma'], icon: 'backend' },
  { number: '04', title: 'From commit to cloud.', description: 'Infrastructure, deployment, and observability. Owning the last mile as carefully as the first.', tags: ['AWS', 'Docker', 'Terraform', 'GitHub Actions', 'OpenTelemetry'], icon: 'cloud' },
];
