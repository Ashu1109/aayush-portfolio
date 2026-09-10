'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, ArrowDown, ArrowRight, ArrowLeft, ArrowUp, Github, Menu, X, Pause, Play, Copy, Check, Braces, Network, Layers3, Cloud, Box, ShieldCheck, Sparkles, Code2, Video, ImageIcon, MousePointer2, Move, RotateCcw, Atom, Cpu, MapPin, Mail, Terminal, Database, Workflow } from 'lucide-react';
import { contact, experience, expertise, projects, type Project } from '@/lib/content';
import ProjectStory from './project-story';
import InteractiveAvatar from './InteractiveAvatar';

const Sculpture = dynamic(() => import('./SystemSculpture'), { ssr: false, loading: () => <div className="sculpture-loading" aria-hidden="true"><Box size={80} strokeWidth={1}/></div> });
const motionQuery = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (callback: () => void) => { const query = window.matchMedia(motionQuery); query.addEventListener('change', callback); return () => query.removeEventListener('change', callback); };
const readMotion = () => window.matchMedia(motionQuery).matches;
const serverMotion = () => false;
const navigation = [['home', 'Home'], ['services', 'Expertise'], ['experience', 'Experience'], ['work', 'Projects'], ['about', 'About'], ['contact', 'Contact']] as const;
const modes = [
  { id: 'interface', label: 'Web', title: 'Start with the experience.', text: 'Interfaces that make complex products feel simple.', tools: ['React', 'Next.js', 'TypeScript'], icon: MousePointer2 },
  { id: 'intelligence', label: 'AI', title: 'Connect the intelligence.', text: 'Agents and generative workflows, working together.', tools: ['Python', 'RAG', 'Multi-agent systems'], icon: Network },
  { id: 'infrastructure', label: 'Systems', title: 'Give it a solid foundation.', text: 'Reliable workflows, data, and cloud infrastructure.', tools: ['Temporal', 'Docker', 'AWS'], icon: Layers3 },
] as const;
type Mode = (typeof modes)[number]['id'];

function ProjectArtwork({ id }: { id: string }) {
  if (id === 'filmos') return <div className="project-art art-filmos" aria-hidden="true"><span className="art-category">AI FILM PRODUCTION</span><span className="filmos-logo">FilmOS<span>✳</span></span><p className="art-description">The creative process.<br/>Connected.</p><div className="approval-path"><span><Layers3/>Reference</span><ArrowRight/><span><ShieldCheck/>Approve</span><ArrowRight/><span><Sparkles/>Generate</span></div><span className="art-footnote">HUMAN APPROVALS. CREATIVE CONTROL.</span></div>;
  if (id === 'logline') return <div className="project-art art-logline" aria-hidden="true"><Image src="/images/computational-sculpture.webp" alt="" width={1200} height={800} sizes="(max-width: 720px) 90vw, 45vw"/><span className="art-category">LOGLINEOS / V2</span><span className="logline-cover-title">One script.<br/>A world<br/>of possibility.</span><span className="agent-badge"><Network size={20}/>14 agents. One creative pipeline.</span></div>;
  if (id === 'studio') return <div className="project-art art-studio" aria-hidden="true"><span className="art-category">LOGLINEAI STUDIO</span><div className="studio-count">200<span>+</span></div><p className="art-description">models. one creative studio.</p><div className="studio-tools"><span><ImageIcon/>Image</span><span><Video/>Video</span><span><Braces/>MCP</span></div><span className="art-footnote">FROM AN IDEA TO SOMETHING YOU CAN SEE.</span></div>;
  return <div className="project-art art-sandbox" aria-hidden="true"><span className="art-category">CODE EXECUTION ENGINE</span><div className="code-title">Write it.<br/>Run it.<span>_</span></div><div className="code-pipeline"><span><Code2/>Code</span><ArrowRight/><span><Box/>Sandbox</span><ArrowRight/><span><Check/>Result</span></div><span className="art-footnote">ISOLATED WORKERS. RELIABLE EXECUTION.</span></div>;
}

function ServiceVisual({ index }: { index: number }) {
  if (index === 0) return <div className="service-visual interface-visual" aria-hidden="true"><div className="mini-browser"><div className="mini-browser-bar"><i/><i/><i/><span>your next idea</span></div><div className="mini-browser-content"><div className="mini-sidebar"><span/><span/><span/></div><div className="mini-interface"><span className="mini-heading"/><div className="mini-panels"><span><MousePointer2/></span><span><Code2/></span></div><div className="mini-lines"><i/><i/></div></div></div></div><div className="visual-chip"><Atom size={17}/>React + Next.js</div></div>;
  if (index === 1) return <div className="service-visual ai-visual" aria-hidden="true"><div className="agent-diagram"><span className="agent-node node-input"><Braces/>Context</span><div className="agent-line"/><span className="agent-core"><Cpu/></span><div className="agent-line"/><span className="agent-node node-output"><Sparkles/>Create</span></div><div className="visual-chip"><Workflow size={17}/>Agents, in sync</div></div>;
  return <div className="service-visual backend-visual" aria-hidden="true"><div className="backend-row"><span><Terminal/>API</span><ArrowRight/><span><Database/>Data</span><ArrowRight/><span><Cloud/>Cloud</span></div><div className="system-status"><span><Check size={14}/>Durable workflows</span><span><ShieldCheck size={14}/>Isolated workers</span></div><div className="visual-chip"><Layers3 size={17}/>Built for production</div></div>;
}

export default function Portfolio() {
  const shell = useRef<HTMLDivElement>(null);
  const projectTrack = useRef<HTMLDivElement>(null);
  const lab = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mode, setMode] = useState<Mode>('intelligence');
  const [motionPaused, setMotionPaused] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [activeSkill, setActiveSkill] = useState(1);
  const [sceneKey, setSceneKey] = useState(0);
  const [labVisible, setLabVisible] = useState(false);
  const [gallery, setGallery] = useState({ page: 0, count: 2 });
  const reducedMotion = useSyncExternalStore(subscribeMotion, readMotion, serverMotion);
  const lenis = useRef<import('lenis').default | null>(null);
  const modalOpen = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeMode = modes.find(item => item.id === mode)!;
  const paused = motionPaused || reducedMotion;

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (paused) return;
    gsap.from('.hero-title-line', { y: 30, opacity: 0, duration: 1, stagger: .13, ease: 'power3.out' });
    gsap.from('.hero-portrait', { y: 45, opacity: 0, duration: 1.25, delay: .15, ease: 'power3.out' });
    gsap.from('.hero-side, .hero-cta', { y: 18, opacity: 0, duration: .8, delay: .5, stagger: .12, ease: 'power3.out' });
    gsap.utils.toArray<HTMLElement>('.reveal').forEach(element => {
      gsap.from(element, { y: 28, opacity: 0, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true } });
    });
    let active = true;
    document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh(); });
    return () => { active = false; };
  }, { scope: shell, dependencies: [paused], revertOnUpdate: true });

  useEffect(() => {
    if (paused) return;
    let cancelled = false;
    import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      const instance = new Lenis({ autoRaf: true, duration: .95, anchors: { offset: -35 }, smoothWheel: true });
      lenis.current = instance;
      instance.on('scroll', ScrollTrigger.update);
      if (modalOpen.current) instance.stop();
    });
    return () => { cancelled = true; lenis.current?.destroy(); lenis.current = null; };
  }, [paused]);
  useEffect(() => { modalOpen.current = Boolean(selectedProject); if (selectedProject) lenis.current?.stop(); else lenis.current?.start(); }, [selectedProject]);
  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onEscape);
    const sections = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) setActiveSection(entry.target.id); }, { rootMargin: '-10% 0px -65% 0px' });
    navigation.forEach(([id]) => { const element = document.getElementById(id); if (element) sections.observe(element); });
    const scene = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { setLabVisible(true); scene.disconnect(); } }, { rootMargin: '350px' });
    if (lab.current) scene.observe(lab.current);
    return () => { sections.disconnect(); scene.disconnect(); window.removeEventListener('keydown', onEscape); if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);
  useEffect(() => {
    const track = projectTrack.current;
    if (!track) return;
    const update = () => {
      const stride = track.clientWidth + 24;
      const count = Math.max(1, Math.round((track.scrollWidth + 24) / stride));
      const page = Math.min(count - 1, Math.max(0, Math.round(track.scrollLeft / stride)));
      setGallery(previous => previous.page === page && previous.count === count ? previous : { page, count });
    };
    const observer = new ResizeObserver(update);
    observer.observe(track);
    track.addEventListener('scroll', update, { passive: true });
    update();
    return () => { observer.disconnect(); track.removeEventListener('scroll', update); };
  }, []);
  function goToGalleryPage(page: number) {
    const track = projectTrack.current;
    if (track) track.scrollTo({ left: page * (track.clientWidth + 24), behavior: paused ? 'instant' : 'smooth' });
  }
  async function copyEmail() {
    try { await navigator.clipboard.writeText(contact.email); setCopied(true); setCopyFailed(false); if (copyTimer.current) clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(false), 2500); } catch { setCopyFailed(true); }
  }

  return <div ref={shell} className="portfolio" data-motion={paused ? 'paused' : 'on'}>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header"><a href="#home" className="brand" aria-label="Aayush Kumar home">aayush<span>.</span></a><nav className="desktop-nav" aria-label="Main navigation">{navigation.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined}>{label}</a>)}</nav><a className="nav-github" href={contact.github} target="_blank" rel="noopener noreferrer" aria-label="Aayush on GitHub"><Github size={21}/></a><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="mobile-menu">{menuOpen ? <X/> : <Menu/>}</button>{menuOpen && <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile navigation">{navigation.map(([id, label]) => <a href={`#${id}`} key={id} onClick={() => setMenuOpen(false)}>{label}<ArrowUpRight size={18}/></a>)}</nav>}</header>
    <main id="main" tabIndex={-1}>
      <section id="home" className="hero" aria-labelledby="hero-title">
        <div className="hero-intro"><span className="hello-pill">Hello, world <span>✳</span></span><h1 id="hero-title"><span className="hero-title-line">I’m <span className="blue-text">Aayush,</span></span><span className="hero-title-line">Full Stack AI Developer.</span></h1></div>
        <div className="hero-stage"><div className="hero-side hero-statement"><span className="statement-icon"><Braces size={28} strokeWidth={1.6}/></span><h2>Big ideas.<br/>Thoughtful execution.</h2><p>I build the interface, the intelligence, and everything in between.</p><a href="#about" className="small-text-link">A little about me<ArrowUpRight size={16}/></a></div>
          <div className="hero-portrait"><div className="portrait-backdrop"/><InteractiveAvatar paused={paused}/><span className="portrait-caption" id="avatar-hint">{paused ? 'CLICK TO SAY HELLO.' : 'MOVE YOUR CURSOR. CLICK TO SAY HELLO.'}</span></div>
          <div className="hero-side hero-stack"><div className="stack-bubbles"><a href="#services" aria-label="Explore frontend development"><Atom/></a><a href="#services" aria-label="Explore artificial intelligence"><Cpu/></a><a href="#services" aria-label="Explore full-stack systems"><Braces/></a></div><p>Human-centered products.<br/>AI-powered possibilities.</p><span className="location-label"><MapPin size={14}/>{contact.location}</span></div>
          <div className="hero-cta"><a href="#work" className="hero-primary">View projects<ArrowUpRight size={21}/></a><a href="#contact" className="hero-secondary">Let’s talk<ArrowUpRight size={19}/></a></div>
        </div>
        <a href="#services" className="hero-scroll"><ArrowDown size={15}/><span>A little further down</span></a>
      </section>

      <section id="services" className="services-section dark-section section-pad"><div className="section-heading reveal"><div><span className="eyebrow">FROM IDEA TO INTERFACE</span><h2>What I <span>bring.</span></h2></div><p>A full-stack perspective.<br/>Every layer, working together.</p></div><div className="service-grid">{[{ title: 'Frontend development', description: 'Clear interfaces. Considered interactions.', mode: 'interface' }, { title: 'AI & agent systems', description: 'Intelligence with a useful purpose.', mode: 'intelligence' }, { title: 'Backend & infrastructure', description: 'The engineering behind the experience.', mode: 'infrastructure' }].map((service, index) => <a key={service.title} href="#playground" className="service-card reveal" onClick={() => { setMode(service.mode as Mode); setActiveSkill(index); }}><div className="service-card-title"><h3>{service.title}</h3><ArrowUpRight size={20}/></div><p>{service.description}</p><ServiceVisual index={index}/><span className="service-explore">Explore the stack<ArrowRight size={17}/></span></a>)}</div></section>

      <section id="experience" className="experience-section section-pad"><div className="center-heading reveal"><span className="eyebrow">THE JOURNEY SO FAR</span><h2>My work <span className="blue-text">experience.</span></h2></div><div className="timeline">{experience.map((job, index) => <article key={job.company} className={`timeline-item reveal ${job.current ? 'current-job' : ''}`}><div className="timeline-company"><h3>{job.company}</h3><span>{job.period}</span>{job.current && <span className="current-label">Currently building</span>}</div><div className="timeline-node" aria-hidden="true"><span/></div><div className="timeline-role"><span className="timeline-number">0{index + 1}</span><h3>{job.role}</h3><p>{job.text}</p><div className="pill-list">{job.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div></article>)}</div></section>

      <section id="work" className="work-section dark-section section-pad" aria-label="Selected projects"><div className="section-heading reveal"><div><span className="eyebrow">SELECTED WORK / 01—04</span><h2>Let’s take a look at<br/>my <span>projects.</span></h2></div><a href={contact.github} target="_blank" rel="noopener noreferrer" className="button button-light">Visit GitHub<Github size={19}/></a></div><div ref={projectTrack} className="project-track" tabIndex={0} aria-label="Project gallery. Scroll horizontally to explore." data-lenis-prevent>{projects.map(project => <article className={`work-card work-${project.id}`} key={project.id}><button className="work-art-button" onClick={() => setSelectedProject(project)} aria-label={`Explore ${project.name}`}><ProjectArtwork id={project.id}/><span className="work-open"><ArrowUpRight size={26}/></span></button><div className="work-copy"><div className="pill-list">{project.stack.map(tool => <span key={tool}>{tool}</span>)}</div><h3><button onClick={() => setSelectedProject(project)}>{project.name}<ArrowUpRight size={23}/></button></h3><p>{project.description}</p><button className="project-story-link" onClick={() => setSelectedProject(project)}>Explore the project<ArrowRight size={17}/></button></div></article>)}</div><div className="gallery-controls"><span className="gallery-note">Built across the whole stack.</span><div className="gallery-dots" aria-label="Project pages">{Array.from({ length: gallery.count }, (_, index) => <button key={index} aria-label={`Go to project page ${index + 1}`} aria-current={gallery.page === index ? 'true' : undefined} onClick={() => goToGalleryPage(index)}><span/></button>)}</div><div className="gallery-arrows"><button className="round-button" aria-label="Previous projects" disabled={gallery.page === 0} onClick={() => goToGalleryPage(gallery.page - 1)}><ArrowLeft size={20}/></button><button className="round-button" aria-label="Next projects" disabled={gallery.page >= gallery.count - 1} onClick={() => goToGalleryPage(gallery.page + 1)}><ArrowRight size={20}/></button></div><span className="sr-only" aria-live="polite">Project page {gallery.page + 1} of {gallery.count}</span></div></section>

      <section id="about" className="about-section section-pad"><div className="about-intro reveal"><div><span className="eyebrow">THE PERSON BEHIND THE PIXELS</span><h2>A curious mind.<br/>A <span className="blue-text">builder</span> at heart.</h2></div><div className="about-copy"><p>I’m Aayush, a full-stack AI engineer from Jamshedpur, India. I like turning complex problems into things people can actually use.</p><p>At LoglineAI, I connect the interface, the agents, and the infrastructure. From a founding team to AI filmmaking, I’ve always liked getting involved in the whole product.</p><div className="about-facts"><div><strong>NIT Jamshedpur</strong><span>B.Tech · Computer Science<br/>2022–2026</span></div><div><strong>50<span>+</span> students</strong><span>Mentored in DSA &<br/>full-stack development</span></div></div></div></div>
        <div id="playground" ref={lab} className="lab-section"><div className="lab-copy reveal"><span className="eyebrow">A LITTLE ROOM TO EXPERIMENT</span><h2>Different layers.<br/>One <span className="blue-text">connected mind.</span></h2><p>Good products happen when the pieces work together. Pick a layer to see how I build.</p><div className="skill-choices" role="group" aria-label="Explore technical expertise">{expertise.map((skill, index) => <button key={skill.number} onClick={() => { setActiveSkill(index); setMode(index === 0 ? 'interface' : index === 1 ? 'intelligence' : 'infrastructure'); }} aria-pressed={activeSkill === index}><span>0{index + 1}</span>{['Frontend', 'AI & agents', 'Backend', 'Cloud & delivery'][index]}<ArrowUpRight size={19}/></button>)}</div><div className="skill-detail" aria-live="polite" aria-atomic="true"><h3>{expertise[activeSkill].title}</h3><p>{expertise[activeSkill].description}</p><div className="pill-list">{expertise[activeSkill].tags.map(tag => <span key={tag}>{tag}</span>)}</div></div></div><div className="playground-card reveal"><div className="playground-top"><span><Move size={15}/>Drag to explore</span><button className="scene-reset round-button" aria-label="Reset sculpture rotation" title="Reset rotation" onClick={() => setSceneKey(key => key + 1)}><RotateCcw size={17}/></button></div><div className="sculpture-wrap">{labVisible ? <Sculpture key={sceneKey} mode={mode} paused={paused}/> : <div className="sculpture-loading" aria-hidden="true"><Box size={80} strokeWidth={1}/></div>}</div><div className="mode-controls" aria-label="Change sculpture arrangement">{modes.map(item => <button key={item.id} aria-pressed={mode === item.id} onClick={() => { setMode(item.id); setActiveSkill(item.id === 'interface' ? 0 : item.id === 'intelligence' ? 1 : 2); }}><item.icon size={16}/>{item.label}</button>)}</div><div className="mode-description" aria-live="polite" aria-atomic="true"><h3>{activeMode.title}</h3><p>{activeMode.text}</p></div></div></div>
      </section>
    </main>
    <footer id="contact" className="contact-section dark-section section-pad"><div className="contact-heading reveal"><span className="eyebrow">HAVE SOMETHING IN MIND?</span><h2>Let’s build<br/>something <span>great.</span></h2><a href={`mailto:${contact.email}`} className="contact-arrow" aria-label="Start a conversation with Aayush"><ArrowUpRight/></a></div><div className="contact-details"><div><p>A new product, an interesting problem,<br/>or just a good conversation.</p><a className="button button-light" href={`mailto:${contact.email}`}>Let’s talk<ArrowUpRight size={19}/></a></div><div className="contact-address"><span className="contact-label"><Mail size={16}/>DROP ME A LINE</span><div className="contact-email"><a href={`mailto:${contact.email}`}>{contact.email}</a><button onClick={copyEmail} className="round-button" aria-label={copied ? 'Email copied' : 'Copy email address'}>{copied ? <Check size={18}/> : <Copy size={18}/>}</button></div><span role="status" className="copy-status">{copied ? 'Email copied!' : copyFailed ? 'Select the email address to copy it, or open your email app.' : ''}</span><div className="contact-social"><a href={contact.github} target="_blank" rel="noopener noreferrer">GitHub<ArrowUpRight size={17}/></a><a href={contact.workGithub} target="_blank" rel="noopener noreferrer">Work GitHub<ArrowUpRight size={17}/></a><span><MapPin size={15}/>{contact.location}</span></div></div></div><div className="footer-bar"><a href="#home" className="brand">aayush<span>.</span></a><span>Made with curiosity. Built with care.</span><button className="motion-toggle" onClick={() => setMotionPaused(!motionPaused)} disabled={reducedMotion} aria-pressed={paused}>{paused ? <Play size={14}/> : <Pause size={14}/>} {reducedMotion ? 'Reduced motion' : motionPaused ? 'Play motion' : 'Pause motion'}</button><a href="#home" className="back-top round-button" aria-label="Back to top"><ArrowUp size={20}/></a></div></footer>
    {selectedProject && <ProjectStory key={selectedProject.id} project={selectedProject} onClose={() => setSelectedProject(null)}/>}
  </div>;
}
