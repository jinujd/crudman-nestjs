---
layout: none
title: CRUDMan NestJS
---

<style>
  :root {
    --royal-navy: #0b1f3a;
    --royal-purple: #352D77;
    --royal-gold: #c9a227;
    --royal-cream: #f6f3ea;
  }
  html, body { margin: 0; padding: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background: var(--royal-cream); color: var(--royal-navy); }
  a { color: var(--royal-gold); text-decoration: none; }
  .hero { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 24px; padding: 56px 24px; background: linear-gradient(140deg, var(--royal-purple), var(--royal-navy)); color: white; }
  .hero h1 { font-size: 44px; line-height: 1.1; margin: 0 0 12px; }
  .hero p { font-size: 18px; opacity: .95; }
  .hero .cta { margin-top: 18px; display: flex; gap: 12px; }
  .btn { padding: 12px 16px; border-radius: 10px; border: 2px solid rgba(255,255,255,.2); color: white; }
  .btn.primary { background: var(--royal-gold); color: var(--royal-navy); border-color: var(--royal-gold); font-weight: 600; }
  .container { max-width: 1060px; margin: 0 auto; padding: 0 20px; }
  .logo-wrap { display:flex; justify-content:center; }
  .logo-badge { background: #fff; border-radius: 999px; padding: 12px; box-shadow: 0 6px 22px rgba(0,0,0,.25); display:inline-block; }
  .logo { width: 180px; filter: drop-shadow(0 6px 18px rgba(0,0,0,.2)); }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .card { background: white; border-radius: 14px; padding: 18px; border: 1px solid #e9e6da; box-shadow: 0 6px 20px rgba(11,31,58,.06); }
  .muted { color: #4c5670; }
  table.features { width: 100%; border-collapse: collapse; margin: 16px 0; background: white; border-radius: 14px; overflow: hidden; border: 1px solid #e9e6da; }
  table.features th, table.features td { padding: 12px 14px; border-bottom: 1px solid #eee7d0; vertical-align: top; }
  table.features th { background: #f9f6eb; color: var(--royal-purple); text-align: left; font-weight: 700; }
  .footer { text-align:center; padding: 24px; color: #6c7390; }
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
  .site-header { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.92); backdrop-filter: saturate(180%) blur(8px); border-bottom: 1px solid #eee7d0; }
  .site-header .nav { display:flex; align-items:center; justify-content:space-between; max-width:1060px; margin:0 auto; padding: 10px 20px; }
  .site-header .brand { display:flex; align-items:center; gap:10px; color: var(--royal-purple); font-weight: 700; }
  .site-header .brand img { width: 28px; height: 28px; }
  .site-header .links { display:flex; gap: 16px; }
  .site-header .links a { color: var(--royal-navy); padding: 8px 10px; border-radius: 8px; }
  .site-header .links a:hover { background:#f3efe0 }
</style>

<header class="site-header">
  <div class="nav">
    <div class="brand"><img src="assets/crudman-logo.svg" alt="logo" /> crudman-nestjs</div>
    <nav class="links">
      <a href="#home">Home</a>
      <a href="#features">Features</a>
      <a href="#readme">Readme</a>
      <a href="#about">About</a>
    </nav>
  </div>
</header>

<section id="home" class="hero">
  <div class="container">
    <h1>crudman-nestjs</h1>
    <p>Ship production-grade CRUD APIs for NestJS in minutes: adapter-driven, validation-first, cache-aware, and Swagger-friendly out of the box.</p>
    <div class="cta">
      <a class="btn primary" href="https://github.com/jinujd/crudman-nestjs#readme">Get Started</a>
      <a class="btn" href="https://github.com/jinujd/crudman-nestjs">GitHub</a>
    </div>
  </div>
  <div class="logo-wrap">
    <span class="logo-badge"><img class="logo" src="assets/crudman-logo.svg" alt="CRUD Man Logo" /></span>
  </div>
</section>

<div class="container">
  <h2 id="features" style="color:var(--royal-purple)">Why crudman?</h2>
  <div class="grid">
    <div class="card">
      <h3>Plug-and-play</h3>
      <p class="muted">Drop-in module, instant CRUD routes, and elegant overrides when you need full control.</p>
    </div>
    <div class="card">
      <h3>Adapter-first</h3>
      <p class="muted">TypeORM today, Sequelize-ready tomorrow—swap ORM or validators without upheaval.</p>
    </div>
    <div class="card">
      <h3>Swagger-native</h3>
      <p class="muted">Entity-driven schemas with polished response envelopes for list, details, create, update, delete.</p>
    </div>
  </div>

  <h2 style="color:var(--royal-purple)">Features</h2>
  <table class="features">
    <tr><th>Capability</th><th>What you get</th></tr>
    <tr><td>Auto CRUD endpoints</td><td>Spin up list, details, create, update, delete—in a single decorator or base class.</td></tr>
    <tr><td>PATCH-first updates</td><td>Modern partial updates by default (configurable to PUT).</td></tr>
    <tr><td>Relations by default</td><td>Include all relations automatically; fine-tune with include/exclude patterns.</td></tr>
    <tr><td>Attributes selection</td><td>All columns by default, plus include/exclude to shape payloads.</td></tr>
    <tr><td>Powerful querying</td><td>Clean filtering, sorting, pagination, and keyword search with safe whitelists.</td></tr>
    <tr><td>Validation built-in</td><td>Fastest-validator out of the box; swap to Joi/Zod via adapters.</td></tr>
    <tr><td>Caching</td><td>Per-endpoint NodeCache with smart invalidation after writes.</td></tr>
    <tr><td>Hooks everywhere</td><td>Before/after action, query, and validation—extend without forking.</td></tr>
    <tr><td>Swagger enhancer</td><td>Auto envelopes for list/details/create/update/delete; entity schemas derived from metadata.</td></tr>
    <tr><td>Save (upsert)</td><td>Single endpoint to create or update based on presence of an id.</td></tr>
    <tr><td>Programmatic calls</td><td>Call other sections’ actions safely within hooks or services.</td></tr>
    <tr><td>CSV/Excel export</td><td>One header switch away—deliver CSV or Excel without code changes.</td></tr>
    <tr><td>Bulk import</td><td>Effortless data onramp with conflict policies, batching, and dry runs.</td></tr>
    <tr><td>Bulk delete</td><td>Clear data at scale with safety valves and transparent reporting.</td></tr>
  </table>

  <h2 style="color:var(--royal-purple)">Install</h2>
  <pre><code>npm i crudman-nestjs</code></pre>

  <h2 style="color:var(--royal-purple)">One-minute setup</h2>
  <pre><code>@UseCrud({ sections: { users: { model: User } } })
@Controller('api/users')
export class UsersController extends CrudControllerBase('users') {}</code></pre>

  <h2 id="readme" style="color:var(--royal-purple)">README</h2>
  <div id="readme-container" class="card" style="overflow:auto; max-height: 60vh"></div>

  <h2 id="about" style="color:var(--royal-purple)">About</h2>
  <div class="card">
    <p class="muted" style="margin:0 0 8px">Maintained by</p>
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
      // Headings, lists, inline code (keep existing HTML intact)
      let html = tmp
        .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>')
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
      if (el) el.innerHTML = html
    } catch {}
  })()
</script>
