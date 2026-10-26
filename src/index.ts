import { Hono } from "hono";

type Bindings = { DB?: D1Database; DOCUMENTS?: R2Bucket };
const app = new Hono<{ Bindings: Bindings }>();

const page = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#101819">
<meta name="description" content="Portal institucional do Supremo Tribunal Federal no universo de roleplay do jogo Diplomacia.">
<title>STF · Supremo Tribunal Federal | Diplomacia</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet">
<style>
:root{--ink:#15201f;--pine:#162e2a;--pine2:#0c211e;--gold:#bd9860;--paper:#f6f4ef;--muted:#68736e;--line:#dcded7}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;color:var(--ink);background:var(--paper);font-family:"DM Sans",Arial,sans-serif;-webkit-font-smoothing:antialiased}a{color:inherit;text-decoration:none}button{font:inherit}a:focus-visible,button:focus-visible{outline:3px solid var(--gold);outline-offset:4px}
.container{max-width:1240px;margin:auto;padding:0 38px}.eyebrow{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase}.serif{font-family:"Libre Baskerville",Georgia,serif}
.topbar{background:#10231f;color:#d4ded7;font-size:11px;letter-spacing:.08em}.topbar .container{display:flex;justify-content:space-between;align-items:center;min-height:33px}.topbar b{color:#d8b47c;font-weight:600}
.sitehead{background:#fff;border-bottom:1px solid #e7e8e3;position:relative;z-index:5}.headinner{height:93px;display:flex;align-items:center;justify-content:space-between;gap:25px}
.identity{display:flex;align-items:center;gap:17px;min-width:0}.crest{width:57px;height:57px;border:1px solid #cbb38d;display:grid;place-items:center;position:relative;color:#8c7148;flex:none}.crest:after{content:"";position:absolute;inset:4px;border:1px solid #e9dfcd}.crest svg{width:33px;height:33px}.idcopy{display:flex;flex-direction:column;gap:4px}.idcopy strong{font-family:"Libre Baskerville",Georgia,serif;font-size:18px;letter-spacing:-.035em;white-space:nowrap}.idcopy small{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#78817b}
nav{display:flex;align-items:center;gap:29px}nav a{font-size:12px;font-weight:700;color:#35423c;transition:color .2s}nav a:hover{color:#a37c42}.navcta{background:#1a332d;color:#fff;padding:14px 20px;display:inline-flex;gap:12px;align-items:center;font-size:12px;font-weight:700;white-space:nowrap}.navcta:hover{background:#294c43}
.hero{background:#102721;color:#fff;position:relative;overflow:hidden;min-height:630px}.hero:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 79% 45%,rgba(182,151,101,.15),transparent 48%),linear-gradient(100deg,rgba(7,26,23,.99) 0%,rgba(12,35,30,.95) 46%,rgba(13,39,32,.42) 100%);z-index:1}
.heroart{position:absolute;right:0;top:0;height:100%;width:64%;opacity:.77;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0 62px,rgba(0,0,0,.17) 63px 72px,transparent 73px 125px),linear-gradient(180deg,transparent 0 20%,rgba(4,17,15,.25) 100%);mask-image:linear-gradient(90deg,transparent,#000 30%)}
.pediment{position:absolute;right:5%;top:80px;width:76%;height:120px;background:linear-gradient(135deg,#9c9b8c,#d6c7a7 47%,#686c60);clip-path:polygon(50% 0,100% 100%,0 100%);opacity:.4}.beam{position:absolute;right:3%;top:195px;width:80%;height:23px;background:#c5bca7;opacity:.33}.columns{position:absolute;right:7%;top:220px;bottom:0;width:72%;display:flex;justify-content:space-around}.columns i{width:13%;background:repeating-linear-gradient(90deg,#73796c 0 7px,#b6b19b 9px 19px,#7e8273 22px 29px);box-shadow:inset 12px 0 18px #374940;opacity:.48}
.hero .container{position:relative;z-index:2;display:flex;align-items:center;min-height:630px}.herocopy{max-width:690px;padding:95px 0 110px}.hero .eyebrow{color:#d5b782;display:flex;align-items:center;gap:14px}.hero .eyebrow:before{content:"";width:32px;height:1px;background:#d5b782}
h1{font:400 clamp(43px,5.4vw,75px)/1.16 "Libre Baskerville",Georgia,serif;letter-spacing:-.055em;margin:31px 0 25px}h1 em{color:#d6b680;font-style:normal}.herocopy>p{color:#c2cdc5;font-size:15px;line-height:1.9;max-width:510px}.heroactions{display:flex;align-items:center;gap:27px;flex-wrap:wrap;margin-top:35px}.primary{background:#d2b27e;color:#14251f;display:inline-flex;align-items:center;gap:25px;padding:17px 23px;font-size:12px;font-weight:700}.primary:hover{background:#e3c99d}.ghost{font-size:12px;color:#e8e6dd;border-bottom:1px solid #b8a17a;padding-bottom:6px}
.heroindex{position:absolute;bottom:32px;right:38px;z-index:3;color:#d8c8a9;font-size:10px;letter-spacing:.17em}.heroindex span{display:inline-block;width:46px;height:1px;background:#b99a67;vertical-align:middle;margin-right:12px}
.ribbon{background:#eae8e0;border-bottom:1px solid #d9d8ce}.ribboninner{min-height:83px;display:flex;align-items:center;justify-content:space-between;gap:22px}.ribbon .label{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#66736a;font-weight:700}.ribbon .value{font-family:"Libre Baskerville",Georgia,serif;font-size:14px;color:#243b32}.ribbon .sep{height:30px;width:1px;background:#cfcfc5}
.section{padding:100px 0}.sectiontop{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-bottom:38px}.section .eyebrow{color:#9d7a48}.section h2{font:400 clamp(31px,3.2vw,43px)/1.35 "Libre Baskerville",Georgia,serif;letter-spacing:-.05em;margin:16px 0 0;max-width:670px}.sectionintro{max-width:360px;color:#68736e;font-size:13px;line-height:1.9;margin:0}
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.card{background:#fff;border:1px solid #e4e5df;padding:36px 31px;min-height:312px;display:flex;flex-direction:column;transition:transform .2s,border-color .2s,box-shadow .2s}.card:hover{transform:translateY(-4px);border-color:#c9b28e;box-shadow:0 12px 30px #12241d10}.cardicon{width:47px;height:47px;border:1px solid #e4ddd1;display:grid;place-items:center;color:#9c7b4a}.cardicon svg{width:23px;height:23px;stroke:currentColor;fill:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}.card h3{font:400 21px/1.4 "Libre Baskerville",Georgia,serif;margin:27px 0 12px;letter-spacing:-.04em}.card p{font-size:13px;line-height:1.85;color:#718078;margin:0}.cardbottom{border-top:1px solid #eeeae3;padding-top:17px;margin-top:auto;color:#987b52;font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:700}
.institution{background:#e8ebe5;padding:90px 0}.instgrid{display:grid;grid-template-columns:1fr 1fr;gap:90px;align-items:center}.instart{min-height:360px;background:#17362f;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center}.instart:before{content:"";position:absolute;inset:30px;border:1px solid #a9946b55}.instart:after{content:"";position:absolute;width:270px;height:270px;border:1px solid #a9946b33;border-radius:50%}.instseal{width:175px;height:175px;border:2px solid #c7a56b;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#d7bc8c;z-index:1}.instseal b{font:50px Georgia,serif;letter-spacing:-.08em}.instseal small{font-size:9px;letter-spacing:.24em}.instcopy p{color:#637168;font-size:14px;line-height:2;max-width:470px}.instcopy .eyebrow{color:#947448}.instcopy h2{font:400 38px/1.3 "Libre Baskerville",Georgia,serif;letter-spacing:-.05em;margin:17px 0}
.notice{background:#fff;border-top:1px solid #e3e5df;padding:40px 0}.noticeinner{display:flex;align-items:center;gap:22px}.noticemark{color:#a9854e;font-size:30px}.notice strong{display:block;font-size:14px;margin-bottom:4px}.notice p{color:#738079;font-size:12px;line-height:1.7;margin:0}
footer{background:#10231f;color:#c1cfc4;padding:42px 0}.footinner{display:flex;justify-content:space-between;align-items:center;gap:20px}.footbrand{font:19px "Libre Baskerville",Georgia,serif;color:#f4efe4}.footnote{font-size:11px;color:#91a49a;max-width:570px;line-height:1.8;text-align:right}
@media(max-width:950px){nav{gap:14px}.idcopy strong{font-size:15px}.instgrid{gap:40px}.ribboninner{flex-wrap:wrap;padding-top:22px;padding-bottom:22px}.ribbon .sep{display:none}}
@media(max-width:740px){.container{padding:0 22px}.topbar .container{gap:10px}.topbar span:last-child{display:none}.headinner{height:auto;padding-top:18px;padding-bottom:18px;align-items:flex-start;flex-direction:column}nav{width:100%;justify-content:space-between;gap:12px;flex-wrap:wrap}.navcta{padding:10px 12px}.hero,.hero .container{min-height:590px}.heroart{width:100%;opacity:.32}.herocopy{padding:78px 0 95px}h1{font-size:clamp(40px,10vw,60px)}.heroindex{right:22px}.ribboninner{gap:16px}.ribbon .value{font-size:12px}.section{padding:70px 0}.sectiontop{display:block}.sectionintro{margin-top:20px}.cards{grid-template-columns:1fr}.card{min-height:270px}.instgrid{grid-template-columns:1fr}.instart{min-height:290px}.institution{padding:65px 0}.noticeinner{align-items:flex-start}.footinner{flex-direction:column;align-items:flex-start}.footnote{text-align:left}}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.card{transition:none}}
</style>
</head>
<body>
<div class="topbar"><div class="container"><span>REPÚBLICA FEDERATIVA DO BRASIL <b>·</b> UNIVERSO DIPLOMACIA</span><span>PORTAL INSTITUCIONAL <b> / </b> RP</span></div></div>
<header class="sitehead"><div class="container headinner">
<a class="identity" href="/" aria-label="Página inicial do STF Diplomacia"><span class="crest"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 5v28M8 13h24M11 13l-6 12h12l-6-12Zm18 0-6 12h12l-6-12ZM14 34h12M10 37h20"/></svg></span><span class="idcopy"><strong>Supremo Tribunal Federal</strong><small>República Federativa do Brasil</small></span></a>
<nav aria-label="Menu principal"><a href="#institucional">O Tribunal</a><a href="#servicos">Serviços</a><a href="#transparencia">Transparência</a><a class="navcta" href="#servicos">Acessar portal <span aria-hidden="true">↗</span></a></nav>
</div></header>
<main>
<section class="hero"><div class="heroart" aria-hidden="true"><div class="pediment"></div><div class="beam"></div><div class="columns"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
<div class="container"><div class="herocopy"><div class="eyebrow">Poder Judiciário · Diplomacia RP</div>
<h1>A justiça como <em>fundamento</em> de uma nação.</h1>
<p>Um novo espaço para a Justiça brasileira no universo Diplomacia. Transparência, independência institucional e respeito à Constituição de roleplay.</p>
<div class="heroactions"><a class="primary" href="#servicos">Explorar o tribunal <span aria-hidden="true">↗</span></a><a class="ghost" href="#institucional">Conheça a instituição</a></div></div></div>
<div class="heroindex"><span></span> SUPREMO TRIBUNAL FEDERAL</div></section>
<div class="ribbon"><div class="container ribboninner"><div><div class="label">Instituição</div><div class="value">Supremo Tribunal Federal</div></div><span class="sep"></span><div><div class="label">Jurisdição</div><div class="value">Brasil · Diplomacia RP</div></div><span class="sep"></span><div><div class="label">Portal</div><div class="value">Acesso público</div></div><span class="sep"></span><div><div class="label">Situação</div><div class="value">Implantação em andamento</div></div></div></div>
<section class="section" id="servicos"><div class="container"><div class="sectiontop"><div><div class="eyebrow">Serviços e informação</div><h2>O Tribunal mais próximo<br>de cada cidadão.</h2></div><p class="sectionintro">Uma plataforma em construção para organizar os atos judiciais e ampliar o acesso público às informações do STF no jogo.</p></div>
<div class="cards">
<article class="card"><span class="cardicon"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7"/></svg></span><h3>Consulta processual</h3><p>Acompanhamento de ações, movimentações e documentos conforme as regras de publicidade.</p><div class="cardbottom">Em desenvolvimento <span aria-hidden="true">↗</span></div></article>
<article class="card"><span class="cardicon"><svg viewBox="0 0 24 24"><path d="m5 20 9-9M12 4l8 8M10 6l8 8M3 21h9M16 2l6 6"/></svg></span><h3>Julgamentos e decisões</h3><p>Consulta a decisões, votos e resultados publicados pelos integrantes do Tribunal.</p><div class="cardbottom">Em desenvolvimento <span aria-hidden="true">↗</span></div></article>
<article class="card"><span class="cardicon"><svg viewBox="0 0 24 24"><path d="M12 6C9 4 6 4 3 5v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v15"/></svg></span><h3>Biblioteca jurídica</h3><p>Normas, atos institucionais e Constituição de RP reunidos em um único lugar.</p><div class="cardbottom">Em desenvolvimento <span aria-hidden="true">↗</span></div></article>
</div></div></section>
<section class="institution" id="institucional"><div class="container instgrid"><div class="instart" aria-hidden="true"><div class="instseal"><b>STF</b><small>DIPLOMACIA</small></div></div><div class="instcopy"><div class="eyebrow">Nossa instituição</div><h2>Uma Justiça construída sobre princípios.</h2><p>O Supremo Tribunal Federal de roleplay integra a experiência institucional do Brasil no jogo Diplomacia. Este portal foi concebido para reunir informações, fortalecer a transparência e apoiar a organização dos procedimentos judiciais.</p><p>As atribuições judiciais e a administração técnica da plataforma serão mantidas separadas, respeitando as competências de cada função.</p></div></div></section>
<section class="notice" id="transparencia"><div class="container noticeinner"><span class="noticemark" aria-hidden="true">✳</span><div><strong>Transparência desde o primeiro dia.</strong><p>O portal está em implantação. Cadastro, peticionamento e consultas processuais ainda não foram ativados. Nenhum dado processual fictício é apresentado como registro oficial.</p></div></div></section>
</main><footer><div class="container footinner"><span class="footbrand">STF <span style="color:#c8a675">·</span> Diplomacia</span><span class="footnote">Projeto independente de roleplay do jogo Diplomacia. Sem vínculo com o Supremo Tribunal Federal ou qualquer órgão oficial da República Federativa do Brasil.</span></div></footer>
</body></html>`;

app.get("/", (c) => c.html(page));
app.get("/api/health", (c) => c.json({ ok: true, service: "STF Diplomacia" }));

type PublicCase = { case_number: string; title: string; case_type: string; status: string; created_at: string };
app.get("/api/public/processos", async (c) => {
  c.header("Cache-Control", "no-store");
  const q = (c.req.query("q") ?? "").trim();
  if (q.length > 80) return c.json({ error: "Consulta muito longa." }, 400);
  if (!c.env.DB) return c.json({ available: false, processes: [], message: "Consulta processual em preparação." });
  try {
    const pattern = "%" + q.replace(/[%_]/g, (character) => "\\" + character) + "%";
    const statement = q
      ? c.env.DB.prepare("SELECT case_number, title, case_type, status, created_at FROM cases WHERE visibility = 'public' AND (case_number LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\') ORDER BY created_at DESC LIMIT 30").bind(pattern, pattern)
      : c.env.DB.prepare("SELECT case_number, title, case_type, status, created_at FROM cases WHERE visibility = 'public' ORDER BY created_at DESC LIMIT 30");
    const result = await statement.all<PublicCase>();
    return c.json({ available: true, processes: result.results ?? [] });
  } catch {
    return c.json({ available: false, processes: [], message: "Consulta temporariamente indisponível." }, 503);
  }
});
app.get("/api/public/legislacao", async (c) => {
  c.header("Cache-Control", "no-store");
  if (!c.env.DB) return c.json({ available: false, norms: [], message: "Biblioteca jurídica em preparação." });
  try {
    const result = await c.env.DB.prepare("SELECT id, norm_type, title, effective_from FROM legal_norms ORDER BY created_at DESC LIMIT 50").all();
    return c.json({ available: true, norms: result.results ?? [] });
  } catch {
    return c.json({ available: false, norms: [], message: "Biblioteca temporariamente indisponível." }, 503);
  }
});
app.get("/processos", (c) => c.html(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Consulta processual · STF Diplomacia</title><style>body{margin:0;background:#f6f4ef;color:#172e28;font:16px system-ui,sans-serif}header{background:#142d27;color:white;padding:25px max(20px,calc((100% - 980px)/2))}a{color:inherit}main{max-width:980px;margin:65px auto;padding:0 20px}h1{font:40px Georgia,serif}form{display:flex;gap:10px}input{flex:1;padding:15px;border:1px solid #c8d1c9;font:inherit;min-width:0}button{background:#17382f;color:white;border:0;padding:15px 25px;cursor:pointer}.item{padding:20px;background:white;border:1px solid #d9dfd9;margin-top:12px}.muted{color:#64756b}footer{margin-top:60px;color:#64756b;font-size:12px}</style></head><body><header><a href="/">← STF DIPLOMACIA</a></header><main><p class="muted">SERVIÇOS JUDICIAIS</p><h1>Consulta processual</h1><p>Pesquise por número ou título de processos públicos. Processos restritos ou sigilosos não são exibidos.</p><form id="search"><input id="q" maxlength="80" aria-label="Número ou título do processo" placeholder="Número ou título do processo"><button>Pesquisar</button></form><div id="results" role="status" aria-live="polite"><p class="muted">Carregando...</p></div><footer>Portal independente de roleplay do jogo Diplomacia, sem vínculo com o STF real.</footer></main><script>const form=document.querySelector('#search'),target=document.querySelector('#results');async function load(){target.textContent='Consultando...';try{const q=document.querySelector('#q').value;const r=await fetch('/api/public/processos?q='+encodeURIComponent(q));const data=await r.json();target.replaceChildren();if(!data.available){target.textContent=data.message||'Consulta indisponível.';return}if(!data.processes.length){target.textContent='Nenhum processo público encontrado.';return}for(const p of data.processes){const div=document.createElement('div');div.className='item';const h=document.createElement('strong');h.textContent=p.case_number+' · '+p.title;const info=document.createElement('p');info.className='muted';info.textContent=p.case_type+' · '+p.status+' · '+p.created_at;div.append(h,info);target.append(div)}}catch{target.textContent='Não foi possível carregar a consulta.'}}form.addEventListener('submit',e=>{e.preventDefault();load()});load()</script></body></html>`));

export default app;
