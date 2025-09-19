---
layout: none
title: CRUDMan NestJS
---

<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  :root {
    --royal-crimson: #890304;
    --royal-navy: #00113a;
    --royal-purple: #002263;
    --royal-gold: #f8f2bf;
    --royal-cream: #e8e5c3;
    --accent-a: #890304; /* crimson */
    --accent-b: #002263; /* royal blue */
    --accent-c: #f8f2bf; /* soft gold */
  }
  html, body { margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background: var(--royal-cream); color: var(--royal-navy); scroll-behavior: smooth; }
  a { color: var(--royal-gold); text-decoration: none; }
  .hero { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 24px; padding: 72px 24px 56px; background: linear-gradient(140deg, var(--royal-purple), var(--royal-navy)); color: white; }
  .hero h1 { font-size: 44px; line-height: 1.1; margin: 0 0 12px; }
  .hero p { font-size: 18px; opacity: .95; }
  .hero .cta { margin-top: 18px; display: flex; gap: 12px; }
  .btn { padding: 12px 16px; border-radius: 4px; border: 2px solid rgba(255,255,255,.2); color: white; }
  .btn.primary { background: var(--royal-gold); color: var(--royal-navy); border-color: var(--royal-gold); font-weight: 600; }
  .btn { border-color: rgba(248,242,191,.4) }
  .container { max-width: 1060px; margin: 0 auto; padding: 0 20px; }
  .badge-nest { display:inline-block; margin-left: 10px; padding: 4px 8px; font-size: 12px; border-radius: 999px; background: rgba(248,242,191,.2); color: var(--royal-gold); border: 1px solid rgba(248,242,191,.4); font-weight: 700 }
  .logo-wrap { display:flex; justify-content:center; }
  .logo-badge { background: #fff; border-radius: 999px; padding: 12px; box-shadow: 0 6px 22px rgba(0,0,0,.25); display:inline-block; }
  .logo { width: 180px; filter: drop-shadow(0 6px 18px rgba(0,0,0,.2)); }
  /* Terminal window */
  .terminal { border-radius: 14px; background: #0f1424; color: #e8ecff; border: 1px solid rgba(255,255,255,.12); box-shadow: 0 10px 36px rgba(4,10,28,.45); overflow: hidden; }
  .terminal .tbar { display:flex; align-items:center; gap:8px; padding: 10px 12px; background: linear-gradient(180deg, #151b32, #0f1424); border-bottom: 1px solid rgba(255,255,255,.08); }
  .terminal .dot { width: 10px; height: 10px; border-radius: 50%; display:inline-block; }
  .terminal .dot.red { background: #ff5f56 }
  .terminal .dot.amber { background: #ffbd2e }
  .terminal .dot.green { background: #27c93f }
  .terminal .tbody { padding: 16px 18px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 13.5px; line-height: 1.5; }
  .terminal pre { margin: 0 0 12px; white-space: pre-wrap; }
  .terminal code, .terminal kbd { color: #c7d2ff }
  .terminal .prompt { color: #9ca8ff }
  /* Floating terminal animation */
  @keyframes gentleFloat { 0% { transform: translateY(0) } 50% { transform: translateY(-10px) } 100% { transform: translateY(0) } }
  .terminal { animation: gentleFloat 8s ease-in-out infinite; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .card { background: white; border-radius: 14px; padding: 18px; border: 1px solid #e9e6da; box-shadow: 0 6px 20px rgba(11,31,58,.06); }
  .muted { color: #4c5670; }
  /* Feature cards */
  .feat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin: 16px 0 }
  @media (max-width: 960px) { .feat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) } }
  @media (max-width: 640px) { .feat-grid { grid-template-columns: 1fr } }
  .feat-card { background: #fff; border-radius: 14px; border: 1px solid #e9e6da; padding: 14px; box-shadow: 0 6px 18px rgba(0,17,58,.06); transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease }
  .feat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,17,58,.10); border-color: #e2dfc6 }
  .feat-head { display:flex; align-items:center; gap: 10px; margin-bottom: 8px }
  .feat-icon { width: 22px; height: 22px; stroke: var(--royal-purple); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round }
  .feat-title { font-weight: 800; color: #2a225f }
  .feat-desc { color: #4c5670; font-size: 14px; line-height: 1.5 }
  /* Icons */
  .icon { width: 20px; height: 20px; vertical-align: -4px; margin-right: 8px; }
  .ticon { width: 16px; height: 16px; vertical-align: -2px; margin-right: 6px; opacity: 0.9 }
  .icon, .ticon { stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round }
  .icon-badge { width: 28px; height: 28px; vertical-align: -6px; margin-right: 8px }
  .footer { text-align:center; padding: 36px 24px; color: #ffffff; background: linear-gradient(160deg, var(--royal-crimson), var(--royal-navy)); border-top: 1px solid rgba(255,255,255,.12); margin-top: 48px; }
  /* Author card */
  .author-card { background: linear-gradient(135deg, var(--royal-navy), var(--royal-purple)); color: #fff; border-radius: 14px; padding: 18px; border: 1px solid rgba(255,255,255,.12); box-shadow: 0 10px 28px rgba(0,17,58,.25); }
  .author-header { display:flex; align-items:center; gap: 12px; margin-bottom: 10px }
  .author-avatar { width: 42px; height: 42px; border-radius: 8px; background: #fff; padding: 6px; box-shadow: 0 4px 16px rgba(0,0,0,.2) }
  .author-name { font-weight: 800; letter-spacing: .2px }
  .author-contacts { display:grid; grid-template-columns: 1fr; gap: 8px; }
  .author-row { display:flex; align-items:center; gap: 10px; }
  .author-row a { color: var(--royal-gold) }
  .aicon { width: 18px; height: 18px; stroke: #fff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round }
  /* Animations */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes float { 0% { transform: translateY(0) } 50% { transform: translateY(-6px) } 100% { transform: translateY(0) } }
  .hero h1 { animation: fadeUp .6s ease-out both; }
  .hero p { animation: fadeUp .7s ease-out both; }
  .hero .cta { animation: fadeUp .8s ease-out both; }
  .logo { animation: float 4s ease-in-out infinite; }
  .card { animation: fadeUp .6s ease-out both; }
  .card:nth-child(2) { animation-delay: .1s }
  .card:nth-child(3) { animation-delay: .2s }
  /* Header */
  .site-header { position: sticky; top: 0; z-index: 60; background: rgba(232,229,195,0.75); backdrop-filter: saturate(180%) blur(14px); border-bottom: 1px solid #e2dfc6; box-shadow: 0 6px 24px rgba(0,17,58,0.08); }
  .site-header .nav { display:flex; align-items:center; justify-content:space-between; max-width:1060px; margin:0 auto; padding: 12px 20px; }
  .site-header .brand { display:flex; align-items:center; gap:12px; color: var(--royal-purple); font-weight: 800; letter-spacing: .2px; font-size: 18px; }
  .site-header .brand img { width: 36px; height: 36px; filter: drop-shadow(0 2px 8px rgba(11,31,58,.2)); }
  .site-header .links { display:flex; gap: 10px; align-items:center; }
  .site-header .links a { color: var(--royal-navy); padding: 8px 12px; border-radius: 4px; border: 1px solid transparent; transition: all .2s ease; font-weight: 600; }
  .site-header .links a:hover { background:#f3efe0; border-color: #e8dfc4; transform: translateY(-1px) }
  .site-header .links a.active { background: var(--royal-gold); color: var(--royal-navy); border-color: #e2dfc6; box-shadow: 0 2px 8px rgba(0,17,58,.12) }
  .site-header .links .cta-gh { background: var(--royal-crimson); color: #fff; border-color: var(--royal-crimson); box-shadow: 0 6px 24px rgba(137,3,4,.25); }
  .site-header .links .cta-gh:hover { filter: brightness(1.05) }
  /* Trust row */
  .trust { display:flex; align-items:center; justify-content:center; gap: 16px; padding: 12px 16px; background: rgba(232,229,195,.6); border-top: 1px solid #e2dfc6; border-bottom: 1px solid #e2dfc6 }
  .trust img { height: 22px }
  /* Copy buttons and toast */
  .copy-btn { position: absolute; top: 8px; right: 8px; font-size: 12px; background: rgba(248,242,191,.95); color: #00113a; border: 1px solid #e2dfc6; border-radius: 4px; padding: 4px 8px; cursor: pointer }
  .copy-btn:hover { filter: brightness(0.98) }
  pre { position: relative }
  .toast { position: fixed; right: 16px; bottom: 16px; background: linear-gradient(135deg, var(--royal-purple), var(--royal-navy)); color: #fff; padding: 10px 14px; border-radius: 8px; box-shadow: 0 10px 28px rgba(0,17,58,.25); opacity: 0; transform: translateY(8px); transition: all .2s ease; pointer-events: none; z-index: 80 }
  .toast.show { opacity: 1; transform: translateY(0) }
  /* WhatsApp widget */
  .wa-widget { position: fixed; right: 18px; bottom: 84px; z-index: 70; display: flex; align-items: center; gap: 8px; text-decoration: none; background: #25D366; color: #00113a; padding: 10px 12px; border-radius: 999px; box-shadow: 0 10px 24px rgba(0,0,0,.2); border: 1px solid rgba(0,0,0,.08) }
  .wa-widget:hover { filter: brightness(1.05); transform: translateY(-1px) }
  .wa-icon { width: 18px; height: 18px; fill: #00113a }
</style>

<header class="site-header">
  <div class="nav">
    <div class="brand"><img src="assets/crudman-logo.svg" alt="logo" /> crudman-nestjs</div>
    <nav class="links">
      <a href="#home">Home</a>
      <a href="#features">Features</a>
      <a href="#readme">Readme</a>
      <a href="#about">About</a>
      <a class="cta-gh" href="https://github.com/jinujd/crudman-nestjs" target="_blank" rel="noopener">GitHub</a>
    </nav>
  </div>
</header>

<section id="home" class="hero">
  <div class="container">
    <h1>crudman-nestjs <span class="badge-nest">for NestJS</span></h1>
    <p>A minimal, adapter-driven CRUD layer for <strong>NestJS</strong>. From zero to production in minutes—no boilerplate, no fuss. Decorate, ship, scale.</p>
    <div class="cta">
      <a class="btn primary" href="https://github.com/jinujd/crudman-nestjs#readme">Get Started</a>
      <a class="btn" href="https://github.com/jinujd/crudman-nestjs">GitHub</a>
    </div>
  </div>
  <div style="padding: 8px 24px">
    <div class="terminal">
      <div class="tbar"><span class="dot red"></span><span class="dot amber"></span><span class="dot green"></span></div>
      <div class="tbody">
        <pre><code>// companies.controller.ts
import { Controller } from '@nestjs/common'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { Company } from './company.entity'

@UseCrud({ sections: { companies: { model: Company } } })
@Controller('api/companies')
export class CompaniesController extends CrudControllerBase('companies') {}</code></pre>
        <pre class="prompt">$ Generated APIs (no boilerplate):
$ GET    /api/companies
$ GET    /api/companies/:id
$ POST   /api/companies
$ PATCH  /api/companies/:id
$ DELETE /api/companies/:id</pre>
      </div>
    </div>
  </div>
</section>

<div class="trust">
  <a href="https://github.com/jinujd/crudman-nestjs" target="_blank" rel="noopener"><img alt="GitHub stars" src="https://img.shields.io/github/stars/jinujd/crudman-nestjs?style=flat&color=00113a&labelColor=f8f2bf&label=stars"></a>
  <a href="https://www.npmjs.com/package/crudman-nestjs" target="_blank" rel="noopener"><img alt="NPM downloads" src="https://img.shields.io/npm/dm/crudman-nestjs.svg?logo=npm&logoColor=white&color=00113a&labelColor=f8f2bf&label=downloads"></a>
  <a href="https://github.com/jinujd/crudman-nestjs/actions" target="_blank" rel="noopener"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/jinujd/crudman-nestjs/node.js.yml?branch=main&label=CI&color=00113a&labelColor=f8f2bf"></a>
  <a href="https://github.com/jinujd/crudman-nestjs/discussions" target="_blank" rel="noopener"><img alt="Chat" src="https://img.shields.io/badge/Chat-Discussions-00113a.svg?labelColor=f8f2bf"></a>
  <img alt="License" src="https://img.shields.io/badge/license-MIT-00113a.svg?labelColor=f8f2bf">
 </div>

<div class="container">
  <h2 id="features" style="color:#2a225f">Why crudman?</h2>
  <div class="grid">
    <div class="card">
      <h3>
        <svg class="icon-badge" viewBox="0 0 24 24" style="color:var(--accent-a)">
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".12"/>
          <path d="M13 2L3 15h7l-2 7 10-13h-7z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Plug-and-play
      </h3>
      <p class="muted">Drop-in module, instant CRUD routes, and elegant overrides when you need full control.</p>
    </div>
    <div class="card">
      <h3>
        <svg class="icon-badge" viewBox="0 0 24 24" style="color:var(--accent-b)">
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".12"/>
          <path d="M4 12l8-5 8 5-8 5-8-5z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 16l8 5 8-5" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Adapter-first
      </h3>
      <p class="muted">TypeORM today, Sequelize-ready tomorrow—swap ORM or validators without upheaval.</p>
    </div>
    <div class="card">
      <h3>
        <svg class="icon-badge" viewBox="0 0 24 24" style="color:var(--accent-c)">
          <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".12"/>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14 2v6h6" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Swagger-native
      </h3>
      <p class="muted">Entity-driven schemas with polished response envelopes for list, details, create, update, delete.</p>
    </div>
  </div>

  <h2 style="color:#2a225f">Features</h2>
  <div class="feat-grid">
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg><div class="feat-title">Auto CRUD endpoints</div></div><div class="feat-desc">Spin up list, details, create, update, delete—in a single decorator or base class.</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><path d="M4 12h16M4 7h10M4 17h10"/></svg><div class="feat-title">PATCH-first updates</div></div><div class="feat-desc">Modern partial updates by default (configurable to PUT).</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><path d="M7 7h4v10H7zM13 7h4v10h-4z"/></svg><div class="feat-title">Relations by default</div></div><div class="feat-desc">Include all relations automatically; fine-tune with include/exclude patterns.</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg><div class="feat-title">Attributes selection</div></div><div class="feat-desc">All columns by default, plus include/exclude to shape payloads.</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><path d="M4 4h16v6H4zM4 12h10v8H4zM16 12h4v8h-4z"/></svg><div class="feat-title">Powerful querying</div></div><div class="feat-desc">Clean filtering, sorting, pagination, and keyword search with safe whitelists.</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 7v6h5"/></svg><div class="feat-title">Validation built-in</div></div><div class="feat-desc">Fastest-validator out of the box; swap to Joi/Zod via adapters.</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12"/><rect x="6" y="8" width="12" height="8"/></svg><div class="feat-title">Caching</div></div><div class="feat-desc">Per-endpoint NodeCache with smart invalidation after writes.</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><path d="M4 6h10M4 10h16M4 14h16M4 18h10"/></svg><div class="feat-title">Hooks everywhere</div></div><div class="feat-desc">Before/after action, query, and validation—extend without forking.</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg><div class="feat-title">Swagger enhancer</div></div><div class="feat-desc">Auto envelopes for list/details/create/update/delete; entity schemas derived from metadata.</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><path d="M12 5l6 6H6l6-6zM6 15h12"/></svg><div class="feat-title">Save (upsert)</div></div><div class="feat-desc">Single endpoint to create or update based on presence of an id.</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 8h10M7 12h6"/></svg><div class="feat-title">Programmatic calls</div></div><div class="feat-desc">Call other sections’ actions safely within hooks or services.</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><rect x="4" y="18" width="16" height="2"/></svg><div class="feat-title">CSV/Excel export</div></div><div class="feat-desc">One header switch away—deliver CSV or Excel without code changes.</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><rect x="4" y="3" width="16" height="4"/></svg><div class="feat-title">Bulk import</div></div><div class="feat-desc">Effortless data onramp with conflict policies, batching, and dry runs.</div></div>
    <div class="feat-card"><div class="feat-head"><svg class="feat-icon" viewBox="0 0 24 24"><path d="M3 6h18M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg><div class="feat-title">Bulk delete</div></div><div class="feat-desc">Clear data at scale with safety valves and transparent reporting.</div></div>
  </div>

  <h2 style="color:#2a225f">Install</h2>
  <div class="terminal" style="margin-bottom:16px; position: relative">
    <div class="tbar"><span class="dot red"></span><span class="dot amber"></span><span class="dot green"></span></div>
    <div class="tbody">
      <pre class="prompt">$ npm i crudman-nestjs</pre>
    </div>
    <button class="copy-btn" data-code="npm i crudman-nestjs" aria-label="Copy install command">Copy</button>
  </div>

  <h2 style="color:#2a225f">One-minute setup</h2>
  <div class="terminal" style="position: relative">
    <div class="tbar"><span class="dot red"></span><span class="dot amber"></span><span class="dot green"></span></div>
    <div class="tbody">
      <pre><code>// users.controller.ts
import { Controller } from '@nestjs/common'
import { UseCrud, CrudControllerBase } from 'crudman-nestjs'
import { User } from './user.entity'

@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}</code></pre>
    </div>
    <button class="copy-btn" data-code="@UseCrud({ sections: { users: { model: User } } })\n@Controller('api/users')\nexport class UsersController extends CrudControllerBase('users') {}" aria-label="Copy setup snippet">Copy</button>
  </div>

  <h2 id="readme" style="color:#2a225f">README</h2>
  <div id="readme-container" class="card" style="overflow:auto; max-height: 80vh"></div>

  <h2 id="about" style="color:#2a225f">About</h2>
  <div class="author-card">
    <div class="author-header">
      <div class="author-avatar"><img src="assets/crudman-logo.svg" alt="logo" style="width:100%; height:100%"/></div>
      <div>
        <div class="author-name">Jinu Joseph Daniel</div>
        <div class="muted" style="color:#e8e5c3">Author</div>
      </div>
    </div>
    <div class="author-contacts">
      <div class="author-row"><svg class="aicon" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M4 7l8 6 8-6"/></svg><a href="mailto:jinujosephdaniel@gmail.com">jinujosephdaniel@gmail.com</a></div>
      <div class="author-row"><svg class="aicon" viewBox="0 0 24 24"><path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011.1-.2 11.6 11.6 0 003.5 1.1 1 1 0 011 .99V20a2 2 0 01-2 2A18 18 0 014 6a2 2 0 012-2h1.8a1 1 0 01.99 1 11.6 11.6 0 001.1 3.5 1 1 0 01-.2 1.1l-2.2 2.2z"/></svg><a href="tel:+918157811122">+91 81578 111 22</a></div>
      <div class="author-row"><svg class="aicon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 17v-7l5 3 5-3v7"/></svg><a href="https://in.linkedin.com/in/jinujosephdaniel" target="_blank" rel="noopener">in.linkedin.com/in/jinujosephdaniel</a></div>
    </div>
  </div>

</div>
<div class="footer">Made with care · MIT License</div>

<script>
  // Lightweight README fetch & render fallback if served via GitHub Pages without Jekyll plugins
  (async function() {
    try {
      const res = await fetch('https://raw.githubusercontent.com/jinujd/crudman-nestjs/main/README.md')
      if (!res.ok) return
      const md = await res.text()
      // Simple markdown renderer that preserves raw HTML in README, while protecting code blocks
      const codeBlocks = []
      let tmp = md.replace(/```([\s\S]*?)```/g, (_m, code) => {
        codeBlocks.push(code)
        return `@@CODEBLOCK_${codeBlocks.length - 1}@@`
      })
      // Headings, lists, quotes, inline code (keep existing HTML intact)
      let html = tmp
        .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
        .replace(/^>\s?(.*)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^\-\s+(.*)$/gm, '<li>$1</li>')
        .replace(/(<li>[^<]*<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '<br/><br/>')
      // Restore fenced code blocks with escaped HTML inside (no copy buttons in README)
      html = html.replace(/@@CODEBLOCK_(\d+)@@/g, (_m, idx) => {
        const i = Number(idx)
        const esc = String(codeBlocks[i]).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
        return `<pre><code>${esc}</code></pre>`
      })
      const el = document.getElementById('readme-container')
      if (el) {
        el.innerHTML = html
        // Fix image paths from README (e.g., docs/assets/ → assets/ for GitHub Pages docs root)
        const imgs = el.querySelectorAll('img')
        imgs.forEach((img) => {
          const raw = img.getAttribute('src') || ''
          const fix = (s) => {
            if (/^https?:\/\//i.test(s)) return s
            let x = s.replace(/^\.\/?/, '').replace(/^\//, '')
            if (x.startsWith('docs/assets/')) return 'assets/' + x.slice('docs/assets/'.length)
            if (x.startsWith('docs/')) return x.replace(/^docs\//, '')
            if (x.startsWith('assets/assets/')) return x.replace(/^assets\/assets\//, 'assets/')
            return x
          }
          const fixed = fix(raw)
          if (fixed !== raw) img.setAttribute('src', fixed)
        })
      }
    } catch {}
  })()

  // Active section highlighting
  (function() {
    const links = Array.from(document.querySelectorAll('.site-header .links a[href^="#"]'))
    const map = new Map()
    links.forEach(a => {
      const id = a.getAttribute('href').slice(1)
      const sec = document.getElementById(id)
      if (sec) map.set(sec, a)
    })
    const setActive = (el) => {
      links.forEach(l => l.classList.remove('active'))
      if (el) el.classList.add('active')
    }
    const io = new IntersectionObserver((entries) => {
      let topMost = null
      entries.forEach(e => {
        if (e.isIntersecting) {
          if (!topMost || e.boundingClientRect.top < topMost.boundingClientRect.top) topMost = e
        }
      })
      if (topMost) setActive(map.get(topMost.target))
    }, { rootMargin: '-20% 0px -70% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] })
    map.forEach((_, sec) => io.observe(sec))
    // Also update on click
    links.forEach(a => a.addEventListener('click', () => {
      setTimeout(() => setActive(a), 100)
    }))
  })()

  // Copy handling for terminal cards + toast
  (function() {
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.textContent = 'Copied to clipboard'
    document.body.appendChild(toast)
    const showToast = () => { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1200) }
    document.addEventListener('click', async (e) => {
      const t = e.target
      if (t && t.classList && t.classList.contains('copy-btn')) {
        const code = t.getAttribute('data-code') || ''
        try { await navigator.clipboard.writeText(code); showToast() } catch {}
      }
    })
  })()
</script>

<!-- WhatsApp Chat with Author (GetButton.io) -->
<script type="text/javascript">
  (function () {
    var options = {
      whatsapp: "+918157811122",
      call_to_action: "Chat with author",
      position: "right",
    };
    var proto = document.location.protocol, host = "getbutton.io", url = proto + "//static." + host;
    var s = document.createElement('script'); s.type = 'text/javascript'; s.async = true; s.src = url + '/widget-send-button/js/init.js';
    s.onload = function () { WhWidgetSendButton.init(host, proto, options); };
    var x = document.getElementsByTagName('script')[0]; x.parentNode.insertBefore(s, x);
  })();
 </script>
