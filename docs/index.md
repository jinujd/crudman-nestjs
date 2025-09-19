---
layout: none
title: CRUDMan NestJS
---

<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  :root {
    --royal-navy: #0b1f3a;
    --royal-purple: #352D77;
    --royal-gold: #c9a227;
    --royal-cream: #f6f3ea;
  }
  html, body { margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background: var(--royal-cream); color: var(--royal-navy); scroll-behavior: smooth; }
  a { color: var(--royal-gold); text-decoration: none; }
  .hero { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 24px; padding: 72px 24px 56px; background: linear-gradient(140deg, var(--royal-purple), var(--royal-navy)); color: white; }
  .hero h1 { font-size: 44px; line-height: 1.1; margin: 0 0 12px; }
  .hero p { font-size: 18px; opacity: .95; }
  .hero .cta { margin-top: 18px; display: flex; gap: 12px; }
  .btn { padding: 12px 16px; border-radius: 2px; border: 2px solid rgba(255,255,255,.2); color: white; }
  .btn.primary { background: var(--royal-gold); color: var(--royal-navy); border-color: var(--royal-gold); font-weight: 600; }
  .container { max-width: 1060px; margin: 0 auto; padding: 0 20px; }
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
  table.features { width: 100%; border-collapse: collapse; margin: 16px 0; background: white; border-radius: 14px; overflow: hidden; border: 1px solid #e9e6da; }
  table.features th, table.features td { padding: 12px 14px; border-bottom: 1px solid #eee7d0; vertical-align: top; }
  table.features th { background: #f9f6eb; color: var(--royal-purple); text-align: left; font-weight: 700; }
  /* Icons */
  .icon { width: 20px; height: 20px; vertical-align: -4px; margin-right: 8px; }
  .ticon { width: 16px; height: 16px; vertical-align: -2px; margin-right: 6px; opacity: 0.9 }
  .icon, .ticon { stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round }
  .footer { text-align:center; padding: 36px 24px; color: #ffffff; background: linear-gradient(160deg, var(--royal-purple), var(--royal-navy)); border-top: 1px solid rgba(255,255,255,.12); margin-top: 48px; }
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
  .site-header { position: sticky; top: 0; z-index: 60; background: rgba(255,255,255,0.75); backdrop-filter: saturate(180%) blur(14px); border-bottom: 1px solid #eee7d0; box-shadow: 0 6px 24px rgba(11,31,58,0.06); }
  .site-header .nav { display:flex; align-items:center; justify-content:space-between; max-width:1060px; margin:0 auto; padding: 12px 20px; }
  .site-header .brand { display:flex; align-items:center; gap:12px; color: var(--royal-purple); font-weight: 800; letter-spacing: .2px; font-size: 18px; }
  .site-header .brand img { width: 36px; height: 36px; filter: drop-shadow(0 2px 8px rgba(11,31,58,.2)); }
  .site-header .links { display:flex; gap: 10px; align-items:center; }
  .site-header .links a { color: var(--royal-navy); padding: 8px 12px; border-radius: 2px; border: 1px solid transparent; transition: all .2s ease; font-weight: 600; }
  .site-header .links a:hover { background:#f3efe0; border-color: #e8dfc4; transform: translateY(-1px) }
  .site-header .links .cta-gh { background: var(--royal-purple); color: #fff; border-color: var(--royal-purple); box-shadow: 0 6px 24px rgba(53,45,119,.25); }
  .site-header .links .cta-gh:hover { filter: brightness(1.05) }
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
    <h1>crudman-nestjs</h1>
    <p>From zero to production-grade CRUD in minutes—no boilerplate, no fuss. Decorate, ship, scale.</p>
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

<div class="container">
  <h2 id="features" style="color:#2a225f">Why crudman?</h2>
  <div class="grid">
    <div class="card">
      <h3><svg class="icon" viewBox="0 0 24 24"><path d="M13 2L3 15h7l-2 7 10-13h-7z"/></svg>Plug-and-play</h3>
      <p class="muted">Drop-in module, instant CRUD routes, and elegant overrides when you need full control.</p>
    </div>
    <div class="card">
      <h3><svg class="icon" viewBox="0 0 24 24"><path d="M4 12l8-5 8 5-8 5-8-5z"/><path d="M4 16l8 5 8-5"/></svg>Adapter-first</h3>
      <p class="muted">TypeORM today, Sequelize-ready tomorrow—swap ORM or validators without upheaval.</p>
    </div>
    <div class="card">
      <h3><svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>Swagger-native</h3>
      <p class="muted">Entity-driven schemas with polished response envelopes for list, details, create, update, delete.</p>
    </div>
  </div>

  <h2 style="color:#2a225f">Features</h2>
  <table class="features">
    <tr><th>Capability</th><th>What you get</th></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>Auto CRUD endpoints</td><td>Spin up list, details, create, update, delete—in a single decorator or base class.</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><path d="M4 12h16M4 7h10M4 17h10"/></svg>PATCH-first updates</td><td>Modern partial updates by default (configurable to PUT).</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><path d="M7 7h4v10H7zM13 7h4v10h-4z"/></svg>Relations by default</td><td>Include all relations automatically; fine-tune with include/exclude patterns.</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>Attributes selection</td><td>All columns by default, plus include/exclude to shape payloads.</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><path d="M4 4h16v6H4zM4 12h10v8H4zM16 12h4v8h-4z"/></svg>Powerful querying</td><td>Clean filtering, sorting, pagination, and keyword search with safe whitelists.</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 7v6h5"/></svg>Validation built-in</td><td>Fastest-validator out of the box; swap to Joi/Zod via adapters.</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12"/><rect x="6" y="8" width="12" height="8"/></svg>Caching</td><td>Per-endpoint NodeCache with smart invalidation after writes.</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><path d="M4 6h10M4 10h16M4 14h16M4 18h10"/></svg>Hooks everywhere</td><td>Before/after action, query, and validation—extend without forking.</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>Swagger enhancer</td><td>Auto envelopes for list/details/create/update/delete; entity schemas derived from metadata.</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><path d="M12 5l6 6H6l6-6zM6 15h12"/></svg>Save (upsert)</td><td>Single endpoint to create or update based on presence of an id.</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M7 8h10M7 12h6"/></svg>Programmatic calls</td><td>Call other sections’ actions safely within hooks or services.</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><rect x="4" y="18" width="16" height="2"/></svg>CSV/Excel export</td><td>One header switch away—deliver CSV or Excel without code changes.</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><rect x="4" y="3" width="16" height="4"/></svg>Bulk import</td><td>Effortless data onramp with conflict policies, batching, and dry runs.</td></tr>
    <tr><td><svg class="ticon" viewBox="0 0 24 24"><path d="M3 6h18M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Bulk delete</td><td>Clear data at scale with safety valves and transparent reporting.</td></tr>
  </table>

  <h2 style="color:#2a225f">Install</h2>
  <pre><code>npm i crudman-nestjs</code></pre>

  <h2 style="color:#2a225f">One-minute setup</h2>
  <pre><code>@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}</code></pre>

  <h2 id="readme" style="color:#2a225f">README</h2>
  <div id="readme-container" class="card" style="overflow:auto; max-height: 60vh"></div>

  <h2 id="about" style="color:#2a225f">About</h2>
  <div class="card">
    <p class="muted" style="margin:0 0 8px">Author</p>
    <div style="font-weight:700; color:var(--royal-navy); margin-bottom:8px">Jinu Joseph Daniel</div>
    <div>Email: <a href="mailto:jinujosephdaniel@gmail.com">jinujosephdaniel@gmail.com</a></div>
    <div>Phone: <a href="tel:+918157811122">+91 81578 111 22</a></div>
    <div>LinkedIn: <a href="https://in.linkedin.com/in/jinujosephdaniel" target="_blank" rel="noopener">in.linkedin.com/in/jinujosephdaniel</a></div>
  </div>

  <div class="footer">Made with care · MIT License</div>
</div>

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
      // Restore fenced code blocks with escaped HTML inside
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
</script>
