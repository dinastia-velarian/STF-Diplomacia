import { Hono } from "hono";

type Bindings = { DB?: D1Database; DOCUMENTS?: R2Bucket };
const app = new Hono<{ Bindings: Bindings }>();

const page = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#11100e"/><title>Supremo Tribunal Federal | Diplomacia</title>
<meta name="description" content="Portal institucional do Supremo Tribunal Federal da República Federativa do Brasil no jogo Diplomacia."/>
<style>
:root{color-scheme:dark;--bg:#0d0d0d;--panel:#191817;--gold:#c8a66b;--line:#383024;--muted:#b5afa6}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:#f6f0e6;font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif}
a{color:inherit;text-decoration:none}a:hover{color:var(--gold)}.wrap{max-width:1140px;margin:auto;padding:0 24px}
header{border-bottom:1px solid var(--line);background:#11100f}.nav{min-height:82px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:15px;font-family:Georgia,serif;font-size:19px;letter-spacing:.07em}.seal{border:1px solid var(--gold);color:var(--gold);border-radius:50%;width:48px;height:48px;display:grid;place-items:center;font-size:18px}
nav{display:flex;gap:24px;flex-wrap:wrap;font-size:14px;color:var(--muted)}
.hero{padding:112px 0 96px;background:radial-gradient(ellipse at 80% 0%,#392c1c 0%,transparent 48%),linear-gradient(145deg,#181611,#0d0d0d 70%)}
.eyebrow{color:var(--gold);text-transform:uppercase;letter-spacing:.2em;font-size:12px;font-weight:700}
h1{font:clamp(38px,6vw,74px)/1.12 Georgia,serif;letter-spacing:-.025em;max-width:800px;margin:20px 0}h2{font:35px/1.2 Georgia,serif;margin:10px 0 16px}
.lead{color:#c8c1b6;font-size:18px;max-width:650px}.btn{display:inline-block;border:1px solid var(--gold);padding:12px 22px;color:#18140f;background:var(--gold);font-weight:700;border-radius:3px;margin-top:24px}
section.content{padding:72px 0}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:32px}
.card{border:1px solid var(--line);background:var(--panel);padding:28px;border-radius:5px;min-height:210px}
.card h3{font:24px Georgia,serif;margin:0 0 12px}.card p,.small{color:var(--muted)}.tag{display:inline-block;color:var(--gold);font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin-bottom:14px}
.notice{padding:24px;border-left:3px solid var(--gold);background:#191714;color:#d5cdc0;margin-top:40px}
footer{border-top:1px solid var(--line);padding:32px 0;color:var(--muted);font-size:13px}
@media(max-width:760px){.nav{padding:18px 0}nav{gap:12px}.hero{padding:75px 0}.grid{grid-template-columns:1fr}.card{min-height:auto}}
</style></head><body>
<header><div class="wrap nav"><a class="brand" href="/"><span class="seal">STF</span><span>SUPREMO TRIBUNAL FEDERAL</span></a>
<nav aria-label="Navegação principal"><a href="#institucional">Institucional</a><a href="#servicos">Serviços</a><a href="#transparencia">Transparência</a></nav></div></header>
<main><div class="hero"><div class="wrap"><div class="eyebrow">República Federativa do Brasil · Diplomacia RP</div>
<h1>Justiça, Constituição e segurança jurídica.</h1>
<p class="lead">Portal institucional do Supremo Tribunal Federal no universo de roleplay do jogo Diplomacia. Um espaço dedicado à organização da Justiça, à publicidade dos atos e à consulta das normas.</p>
<a class="btn" href="#servicos">Conheça o portal</a></div></div>
<section class="content" id="institucional"><div class="wrap"><span class="eyebrow">O Tribunal</span><h2>Instituição e compromisso</h2>
<p class="lead">O STF integra a estrutura institucional de roleplay brasileiro, com foco na interpretação das normas, no devido processo e na transparência dos julgamentos.</p>
<div class="grid" id="servicos">
<article class="card"><span class="tag">Em desenvolvimento</span><h3>Processos judiciais</h3><p>Consulta pública de processos, movimentações e documentos conforme as regras de publicidade.</p></article>
<article class="card"><span class="tag">Em desenvolvimento</span><h3>Decisões e julgamentos</h3><p>Publicação de decisões, votos e resultados dos julgamentos do Tribunal.</p></article>
<article class="card"><span class="tag">Em desenvolvimento</span><h3>Biblioteca jurídica</h3><p>Consulta às normas, à Constituição de RP e aos atos institucionais cadastrados.</p></article>
</div><div class="notice" id="transparencia"><strong>Portal em implantação.</strong> Esta é a primeira versão pública. Cadastro, peticionamento e áreas restritas ainda não estão disponíveis. Nenhum processo ou decisão real foi publicado.</div>
</div></section></main>
<footer><div class="wrap">STF Diplomacia · Plataforma de roleplay, independente de órgãos oficiais do Brasil e sem vínculo com o Supremo Tribunal Federal real.</div></footer>
</body></html>`;

app.get("/", (c) => c.html(page));
app.get("/api/health", (c) => c.json({ ok: true, service: "STF Diplomacia" }));
export default app;
