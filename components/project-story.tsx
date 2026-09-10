'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUpRight, X } from 'lucide-react';
import { contact, type Project } from '@/lib/content';

const tabs = ['The idea', 'The build', 'The stack'] as const;

export default function ProjectStory({ project, onClose }: { project: Project; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    const previousOverflow = document.body.style.overflow;
    node.showModal();
    document.body.style.overflow = 'hidden';
    return () => { node.close(); document.body.style.overflow = previousOverflow; };
  }, []);

  function navigateTabs(event: KeyboardEvent, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % 3 : event.key === 'ArrowLeft' ? (index + 2) % 3 : event.key === 'Home' ? 0 : event.key === 'End' ? 2 : null;
    if (next !== null) { event.preventDefault(); setTab(next); tabRefs.current[next]?.focus(); }
  }

  return <dialog ref={dialog} className={`story-dialog story-${project.id}`} aria-labelledby="story-title" data-lenis-prevent onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <article className="story-inner">
      <header className="story-header"><span className="eyebrow">A CLOSER LOOK / {project.number}</span><button className="round-button" aria-label="Close project story" onClick={onClose} autoFocus><X size={22} /></button></header>
      <div className="story-heading"><span className="small-label">{project.kind}</span><h2 id="story-title">{project.name}</h2><p>{project.subtitle}</p></div>
      <div className="story-meta"><span>{project.role}</span><span>{project.detail}</span></div>
      <div className="story-tabs" role="tablist" aria-label="Project details">{tabs.map((label, i) => <button key={label} ref={el => { tabRefs.current[i] = el; }} id={`story-tab-${i}`} type="button" role="tab" aria-selected={tab === i} aria-controls={`story-panel-${i}`} tabIndex={tab === i ? 0 : -1} onKeyDown={event => navigateTabs(event, i)} onClick={() => setTab(i)}>{label}</button>)}</div>
      <div key={tab} className="story-panel" id={`story-panel-${tab}`} role="tabpanel" aria-labelledby={`story-tab-${tab}`} tabIndex={0}>
        {tab === 0 ? <><h3>The interesting problem.</h3><p>{project.challenge}</p><h3>The approach.</h3><p>{project.solution}</p></> : tab === 1 ? <><h3>Under the hood.</h3><p>{project.ownership}</p><div className="story-callout">{project.id === 'filmos' ? 'Co-built and validated ahead of release. A public launch is not claimed.' : project.id === 'studio' ? 'An internal product for the Logline team.' : project.id === 'logline' ? 'The v2 platform uses Temporal Cloud + Redis for durable, real-time workflows.' : 'A Redis queue connects the application to isolated Docker workers.'}</div></> : <><h3>The building blocks.</h3><div className="story-stack">{project.stack.map((tool, i) => <span key={tool}><span>0{i + 1}</span>{tool}</span>)}</div><p>Connected across the interface, workflows, and data layer.</p></>}
      </div>
      <footer className="story-footer">{project.links.length ? project.links.map(link => <a key={link.href} className="button button-ink" href={link.href} target="_blank" rel="noopener noreferrer">{link.label}<ArrowUpRight size={18} /></a>) : <a className="button button-ink" href={`mailto:${contact.email}`}>Talk through the project<ArrowUpRight size={18} /></a>}</footer>
    </article>
  </dialog>;
}
