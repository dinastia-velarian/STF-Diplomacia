import { Hono } from "hono";
import { auth } from "./auth";
import { judicial } from "./judicial";
import { portal } from "./portal";
import { court } from "./court";
import { docket } from "./docket";
import { ministerPanel } from "./minister-panel";
import { admin } from "./admin";
import { adminPanel } from "./admin-panel";
import { adminExtended } from "./admin-extended";

type Bindings = { DB?: D1Database; DOCUMENTS?: R2Bucket };
const app = new Hono<{ Bindings: Bindings }>();
app.use("/api/*", async (c, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method)) {
    const origin = c.req.header("origin");
    if (!origin || origin !== new URL(c.req.url).origin) return c.json({ error: "Origem não autorizada." }, 403);
    const contentType = c.req.header("content-type") || "";
    if (c.req.method !== "DELETE" && !contentType.toLowerCase().startsWith("application/json")) return c.json({ error: "Envie dados JSON." }, 415);
    const length = Number(c.req.header("content-length") || 0);
    if (length > 65536) return c.json({ error: "Requisição muito grande." }, 413);
  }
  await next();
});
app.route("/api/auth", auth);
app.route("/api/judicial", judicial);
app.route("/api/court", court);
app.route("/api/court", docket);
app.route("/api/admin", admin);
app.route("/api/admin", adminExtended);
app.route("/", portal);
app.route("/", ministerPanel);
app.route("/", adminPanel);

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
nav{display:flex;align-items:center;gap:20px;flex-wrap:wrap;justify-content:flex-end}nav a{font-size:12px;font-weight:700;color:#35423c;transition:color .2s}nav a:hover{color:#a37c42}.navcta{background:#1a332d;color:#fff;padding:14px 20px;display:inline-flex;gap:12px;align-items:center;font-size:12px;font-weight:700;white-space:nowrap}.navcta:hover{background:#294c43}
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

/* Identidade visual 2026: grafite, azul elétrico e superfícies editoriais */
:root{--ink:#101b30;--pine:#111827;--pine2:#090f1e;--gold:#536dfe;--paper:#f2f5fa;--muted:#637188;--line:#dce4ef}
body{background:#f2f5fa;color:#152039;font-family:"DM Sans",Arial,sans-serif}
.topbar{background:#080e1b;color:#9aaac8}.topbar b{color:#81b4ff}
.sitehead{background:rgba(255,255,255,.97);border-bottom:1px solid #e3eaf5;box-shadow:0 4px 28px #13233b09}
.crest{border-radius:15px;background:#101d37;color:#c5d8ff;border:0}.crest:after{border:1px solid #526c9d55;border-radius:11px}
.idcopy strong{color:#101b32}.idcopy small{color:#6d7c93}
nav{gap:17px;flex-wrap:wrap;justify-content:flex-end}nav a{color:#43526b}.loginlink{border:1px solid #d8e1ee;border-radius:10px;padding:11px 14px}.loginlink:hover{background:#f2f5ff}
.navcta{background:#3e5cf4;color:white;border-radius:10px;box-shadow:0 8px 22px #3e5cf42e}.navcta:hover{background:#2949e2}
.hero{background:#0a1224;min-height:680px}.hero:before{background:radial-gradient(ellipse at 77% 36%,#3c61c54d,transparent 47%),radial-gradient(ellipse at 95% 90%,#45c3db25,transparent 48%),linear-gradient(105deg,#080f20 4%,#0f1c35 57%,#172d50 100%)}
.heroart{width:57%;opacity:.7;background:linear-gradient(90deg,transparent,#172c54aa),repeating-linear-gradient(0deg,transparent 0 48px,#a5c7ff0d 49px 50px);mask-image:linear-gradient(90deg,transparent,#000 40%)}
.pediment{background:linear-gradient(135deg,#4d6fc9,#a4c9f8 48%,#28487c);opacity:.22}.beam{background:#a5bfe9;opacity:.18}.columns i{background:repeating-linear-gradient(90deg,#42618b 0 7px,#9bbbe2 9px 19px,#476895 22px 29px);opacity:.24}
.hero .container{min-height:680px}.herocopy{padding:110px 0 120px}.hero .eyebrow{color:#9cc6ff}.hero .eyebrow:before{background:#77a7f7}
h1{font-size:clamp(44px,5.5vw,78px);letter-spacing:-.055em}h1 em{color:#a6c6ff}.herocopy>p{color:#c3cfe3;font-size:16px}
.primary{background:#5576ff;color:white;border-radius:10px;box-shadow:0 12px 28px #3554d533}.primary:hover{background:#7790ff}.ghost{border-color:#8fb2ff;color:#edf3ff}.heroindex{color:#abc6f6}.heroindex span{background:#779bdf}
.ribbon{background:white;border-bottom:1px solid #e1e7f0}.ribbon .label{color:#71809a}.ribbon .value{color:#172c4a}.ribbon .sep{background:#dfe7f1}
.section{padding:105px 0}.section .eyebrow,.instcopy .eyebrow{color:#4565d7}.section h2,.instcopy h2{color:#101c35}.sectionintro{color:#64728a}
.cards{gap:20px}.card{border:1px solid #e1e7f2;border-radius:18px;box-shadow:0 12px 35px #1c35500a;padding:37px 33px;min-height:325px}.card:hover{border-color:#a3b6ff;box-shadow:0 22px 46px #264cb41c;transform:translateY(-6px)}.cardicon{background:#edf2ff;border:0;border-radius:13px;color:#4968e9}.card h3{color:#172744}.card p{color:#6b7890}.cardbottom{color:#3f5ddb;border-color:#e8edf6}
.institution{background:#e8eef8}.instart{background:radial-gradient(circle at 50% 35%,#294d89,#101b35 70%);border-radius:22px;box-shadow:0 24px 50px #172c5330}.instart:before{border-color:#a5bff84a;border-radius:15px}.instart:after{border-color:#a5bff83d}.instseal{border-color:#9cbcff;color:#dce9ff}.instcopy p{color:#62738c}
.notice{background:#fff;border-color:#e1e7f1}.noticemark{color:#5576ff}.notice p{color:#6a7a93}footer{background:#0b1426;color:#cbd6eb}.footbrand{color:#f4f7ff}.footnote{color:#9aa9c3}
@media(max-width:740px){.hero,.hero .container{min-height:590px}.heroart{width:100%;opacity:.32}.herocopy{padding:78px 0 95px}nav{justify-content:flex-start}.loginlink{padding:10px 12px}}
</style>
</head>
<body>
<div class="topbar"><div class="container"><span>REPÚBLICA FEDERATIVA DO BRASIL <b>·</b> UNIVERSO DIPLOMACIA</span><span>PORTAL INSTITUCIONAL <b> / </b> RP</span></div></div>
<header class="sitehead"><div class="container headinner">
<a class="identity" href="/" aria-label="Página inicial do STF Diplomacia"><span class="crest"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 5v28M8 13h24M11 13l-6 12h12l-6-12Zm18 0-6 12h12l-6-12ZM14 34h12M10 37h20"/></svg></span><span class="idcopy"><strong>Supremo Tribunal Federal</strong><small>República Federativa do Brasil</small></span></a>
<nav aria-label="Menu principal"><a href="#institucional">O Tribunal</a><a href="#servicos">Serviços</a><a href="#transparencia">Transparência</a><a href="/conta" class="loginlink">Entrar</a><a href="/cadastro" class="loginlink">Criar conta</a><a class="navcta" href="/processos">Consultar processos <span aria-hidden="true">↗</span></a></nav>
</div></header>
<main>
<section class="hero"><div class="heroart" aria-hidden="true"><div class="pediment"></div><div class="beam"></div><div class="columns"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
<div class="container"><div class="herocopy"><div class="eyebrow">Poder Judiciário · Diplomacia RP</div>
<h1>Justiça, confiança e <em>um novo futuro.</em></h1>
<p>Uma nova experiência para a Justiça no universo Diplomacia. Protocole ações, acompanhe processos e consulte decisões em um portal moderno, transparente e independente.</p>
<div class="heroactions"><a class="primary" href="/processos">Consultar processos <span aria-hidden="true">↗</span></a><a class="ghost" href="#institucional">Conheça a instituição</a></div></div></div>
<div class="heroindex"><span></span> SUPREMO TRIBUNAL FEDERAL</div></section>
<div class="ribbon"><div class="container ribboninner"><div><div class="label">Instituição</div><div class="value">Supremo Tribunal Federal</div></div><span class="sep"></span><div><div class="label">Jurisdição</div><div class="value">Brasil · Diplomacia RP</div></div><span class="sep"></span><div><div class="label">Portal</div><div class="value">Acesso público</div></div><span class="sep"></span><div><div class="label">Situação</div><div class="value">Implantação em andamento</div></div></div></div>
<section class="section" id="servicos"><div class="container"><div class="sectiontop"><div><div class="eyebrow">Serviços e informação</div><h2>O Tribunal mais próximo<br>de cada cidadão.</h2></div><p class="sectionintro">Uma plataforma em construção para organizar os atos judiciais e ampliar o acesso público às informações do STF no jogo.</p></div>
<div class="cards">
<article class="card"><span class="cardicon"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7"/></svg></span><h3>Consulta processual</h3><p>Acompanhamento de ações, movimentações e documentos conforme as regras de publicidade.</p><a class="cardbottom" href="/processos">Abrir consulta processual <span aria-hidden="true">↗</span></a></article>
<article class="card"><span class="cardicon"><svg viewBox="0 0 24 24"><path d="m5 20 9-9M12 4l8 8M10 6l8 8M3 21h9M16 2l6 6"/></svg></span><h3>Julgamentos e decisões</h3><p>Consulta a decisões, votos e resultados publicados pelos integrantes do Tribunal.</p><a class="cardbottom" href="/decisoes">Consultar decisões <span aria-hidden="true">↗</span></a></article>
<article class="card"><span class="cardicon"><svg viewBox="0 0 24 24"><path d="M12 6C9 4 6 4 3 5v15c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v15"/></svg></span><h3>Biblioteca jurídica</h3><p>Normas, atos institucionais e Constituição de RP reunidos em um único lugar.</p><a class="cardbottom" href="/legislacao">Abrir biblioteca jurídica <span aria-hidden="true">↗</span></a></article>
</div></div></section>
<section class="institution" id="institucional"><div class="container instgrid"><div class="instart" aria-hidden="true"><div class="instseal"><b>STF</b><small>DIPLOMACIA</small></div></div><div class="instcopy"><div class="eyebrow">Nossa instituição</div><h2>Uma Justiça construída sobre princípios.</h2><p>O Supremo Tribunal Federal de roleplay integra a experiência institucional do Brasil no jogo Diplomacia. Este portal foi concebido para reunir informações, fortalecer a transparência e apoiar a organização dos procedimentos judiciais.</p><p>As atribuições judiciais e a administração técnica da plataforma serão mantidas separadas, respeitando as competências de cada função.</p></div></div></section>
<section class="notice" id="transparencia"><div class="container noticeinner"><span class="noticemark" aria-hidden="true">✳</span><div><strong>Transparência desde o primeiro dia.</strong><p>O portal está em desenvolvimento contínuo. O cadastro e o protocolo de processos já estão disponíveis; novos módulos judiciais serão liberados progressivamente.</p></div></div></section>
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
app.get("/processos", (c) => c.html(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Consulta processual · STF Diplomacia</title><style>body{margin:0;background:#f6f4ef;color:#172e28;font:16px system-ui,sans-serif}header{background:#142d27;color:white;padding:25px max(20px,calc((100% - 980px)/2))}a{color:inherit}main{max-width:980px;margin:65px auto;padding:0 20px}h1{font:40px Georgia,serif}form{display:flex;gap:10px}input{flex:1;padding:15px;border:1px solid #c8d1c9;font:inherit;min-width:0}button{background:#17382f;color:white;border:0;padding:15px 25px;cursor:pointer}.item{padding:20px;background:white;border:1px solid #d9dfd9;margin-top:12px}.muted{color:#64756b}footer{margin-top:60px;color:#64756b;font-size:12px}body{background:#f2f5fa!important;color:#152039!important;font-family:system-ui,sans-serif!important}header{background:#0b1426!important;border-bottom:3px solid #5576ff!important}main{margin-top:55px!important}h1{color:#152039!important}form,.item{border-radius:16px!important;border:1px solid #dce5f4!important;box-shadow:0 12px 32px #172a4b10!important}button{background:#4767ef!important;border-radius:9px!important;color:white!important}button:hover{background:#304bd0!important}input{border-radius:9px!important;border-color:#dce5f4!important}a{color:#4767ef}header a{color:#dce8ff!important}</style></head><body><header><a href="/">← STF DIPLOMACIA</a></header><main><p class="muted">SERVIÇOS JUDICIAIS</p><h1>Consulta processual</h1><p>Pesquise por número ou título de processos públicos. Processos restritos ou sigilosos não são exibidos.</p><form id="search"><input id="q" maxlength="80" aria-label="Número ou título do processo" placeholder="Número ou título do processo"><button>Pesquisar</button></form><div id="results" role="status" aria-live="polite"><p class="muted">Carregando...</p></div><footer>Portal independente de roleplay do jogo Diplomacia, sem vínculo com o STF real.</footer></main><script>const form=document.querySelector('#search'),target=document.querySelector('#results');async function load(){target.textContent='Consultando...';try{const q=document.querySelector('#q').value;const r=await fetch('/api/public/processos?q='+encodeURIComponent(q));const data=await r.json();target.replaceChildren();if(!data.available){target.textContent=data.message||'Consulta indisponível.';return}if(!data.processes.length){target.textContent='Nenhum processo público encontrado.';return}for(const p of data.processes){const div=document.createElement('div');div.className='item';const h=document.createElement('strong');h.textContent=p.case_number+' · '+p.title;const info=document.createElement('p');info.className='muted';info.textContent=p.case_type+' · '+p.status+' · '+p.created_at;div.append(h,info);target.append(div)}}catch{target.textContent='Não foi possível carregar a consulta.'}}form.addEventListener('submit',e=>{e.preventDefault();load()});load()</script></body></html>`));


const internalStyle = "body{margin:0;background:#f6f4ef;color:#172e28;font:16px system-ui,sans-serif}header{background:#142d27;color:white;padding:25px max(20px,calc((100% - 980px)/2))}a{color:inherit}main{max-width:980px;margin:65px auto;padding:0 20px}h1{font:40px Georgia,serif}.item{padding:20px;background:white;border:1px solid #d9dfd9;margin-top:12px}.muted{color:#64756b}footer{margin-top:60px;color:#64756b;font-size:12px}";
function publicPage(title: string, description: string, api: string, collection: string): string {
  const script = `const target=document.querySelector('#results');async function load(){try{const r=await fetch(${JSON.stringify(api)});const data=await r.json();target.replaceChildren();if(!data.available){target.textContent=data.message||'Consulta indisponível.';return}const items=data[${JSON.stringify(collection)}]||[];if(!items.length){target.textContent='Nenhum registro público disponível no momento.';return}for(const item of items){const div=document.createElement('article');div.className='item';const h=document.createElement('strong');h.textContent=item.title||item.case_number||'Registro';const p=document.createElement('p');p.className='muted';p.textContent=[item.norm_type,item.case_number,item.effective_from,item.published_at].filter(Boolean).join(' · ');div.append(h,p);target.append(div)}}catch{target.textContent='Não foi possível carregar os registros.'}}load()`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · STF Diplomacia</title><style>${internalStyle}</style></head><body><header><a href="/">← STF DIPLOMACIA</a></header><main><p class="muted">PORTAL DE TRANSPARÊNCIA</p><h1>${title}</h1><p>${description}</p><div id="results" role="status" aria-live="polite"><p class="muted">Carregando...</p></div><footer>Plataforma independente de roleplay do jogo Diplomacia, sem vínculo com o STF real.</footer></main><script>${script}</script></body></html>`;
}
app.get("/legislacao", (c) => c.html(publicPage("Biblioteca jurídica", "Consulta pública às normas cadastradas no STF Diplomacia.", "/api/public/legislacao", "norms")));
app.get("/decisoes", (c) => c.html(publicPage("Decisões e julgamentos", "Somente decisões publicadas e vinculadas a processos públicos são exibidas.", "/api/public/decisoes", "decisions")));
app.get("/api/public/decisoes", async (c) => {
  c.header("Cache-Control", "no-store");
  if (!c.env.DB) return c.json({ available: false, decisions: [], message: "Decisões em preparação." });
  try {
    const result = await c.env.DB.prepare("SELECT d.id, c.case_number, c.title, d.published_at FROM decisions d JOIN cases c ON c.id = d.case_id WHERE d.status = 'published' AND c.visibility = 'public' ORDER BY d.published_at DESC LIMIT 50").all();
    return c.json({ available: true, decisions: result.results ?? [] });
  } catch {
    return c.json({ available: false, decisions: [], message: "Decisões temporariamente indisponíveis." }, 503);
  }
});


app.get("/conta", c => c.html(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Minha conta · STF Diplomacia</title><style>body{background:#f6f4ef;color:#162e2a;font:16px system-ui;margin:0}header{background:#162e2a;color:white;padding:24px max(20px,calc((100% - 920px)/2))}a{color:inherit}main{max-width:480px;margin:55px auto;padding:0 20px}h1{font:38px Georgia,serif}form{background:white;border:1px solid #dcded7;padding:28px;display:grid;gap:14px}label{display:grid;gap:6px}input{font:inherit;padding:12px;border:1px solid #bccbc4}button{background:#162e2a;color:white;border:0;padding:14px;cursor:pointer;font:inherit}.muted{color:#60746b}#notice{min-height:24px}footer{font-size:12px;margin-top:45px;color:#60746b}body{background:#f2f5fa!important;color:#152039!important;font-family:system-ui,sans-serif!important}header{background:#0b1426!important;border-bottom:3px solid #5576ff!important}header a{color:#dce8ff!important}main{margin-top:55px!important}h1{color:#152039!important}form{border-radius:18px!important;border:1px solid #dce5f4!important;box-shadow:0 16px 42px #172a4b12!important}button{background:#4767ef!important;border-radius:10px!important;font-weight:700!important}button:hover{background:#304bd0!important}input{border-radius:9px!important;border-color:#dce5f4!important}a{color:#4767ef}.muted,footer{color:#64738d!important}</style></head><body><header><a href="/">← STF DIPLOMACIA</a></header><main><h1>Acesso ao Tribunal</h1><p class="muted">Utilize seu nome de jogador do Diplomacia. O cadastro não concede poderes judiciais.</p><form id="account"><label>Nome no Diplomacia<input id="username" required minlength="3" maxlength="40" autocomplete="username"></label><label>Senha<input id="password" type="password" required minlength="6" maxlength="128" autocomplete="current-password"></label><button id="login" type="submit">Entrar</button><a href="/cadastro" style="display:block;text-align:center;background:#e8eee9;color:#162e2a;padding:14px;text-decoration:none;border:1px solid #bccbc4">Criar uma conta</a><p id="notice" role="status" aria-live="polite"></p></form><footer>Plataforma independente de roleplay do jogo Diplomacia. Sem vínculo com o STF real.</footer></main><script>const form=document.querySelector('#account'),notice=document.querySelector('#notice');async function submit(mode){notice.textContent='Aguarde...';const username=document.querySelector('#username').value,password=document.querySelector('#password').value;try{const response=await fetch('/api/auth/'+mode,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});const data=await response.json();notice.textContent=data.error||data.message||(data.ok?'Autenticado com sucesso.':'Não foi possível concluir.');if(data.ok&&mode==='login'){document.querySelector('#password').value='';window.location.href='/meus-processos'}}catch{notice.textContent='Serviço indisponível.'}}form.addEventListener('submit',e=>{e.preventDefault();submit('login')});</script></body></html>`));

app.get("/cadastro", c => c.html(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Criar conta · STF Diplomacia</title><style>body{background:#f6f4ef;color:#162e2a;font:16px system-ui;margin:0}header{background:#162e2a;color:white;padding:24px max(20px,calc((100% - 920px)/2))}a{color:inherit}main{max-width:480px;margin:55px auto;padding:0 20px}h1{font:38px Georgia,serif}form{background:white;border:1px solid #dcded7;padding:28px;display:grid;gap:14px}label{display:grid;gap:6px}input{font:inherit;padding:12px;border:1px solid #bccbc4}button{background:#162e2a;color:white;border:0;padding:14px;cursor:pointer;font:inherit}.muted{color:#60746b}#notice{min-height:24px}body{background:#f2f5fa!important;color:#152039!important;font-family:system-ui,sans-serif!important}header{background:#0b1426!important;border-bottom:3px solid #5576ff!important}header a{color:#dce8ff!important}main{margin-top:55px!important}h1{color:#152039!important}form{border-radius:18px!important;border:1px solid #dce5f4!important;box-shadow:0 16px 42px #172a4b12!important}button{background:#4767ef!important;border-radius:10px!important;font-weight:700!important}button:hover{background:#304bd0!important}input{border-radius:9px!important;border-color:#dce5f4!important}a{color:#4767ef}.muted,footer{color:#64738d!important}</style></head><body><header><a href="/">← STF DIPLOMACIA</a></header><main><h1>Criar conta</h1><p class="muted">Cadastre-se usando seu nome de jogador do Diplomacia.</p><form id="signup"><label>Nome no Diplomacia<input name="username" required minlength="3" maxlength="40" autocomplete="username"></label><label>Senha (6 a 12 caracteres)<input name="password" type="password" required minlength="6" maxlength="12" autocomplete="new-password"></label><label>Confirmar senha<input name="confirm" type="password" required minlength="6" maxlength="12" autocomplete="new-password"></label><button type="submit">Criar minha conta</button><p id="notice" role="status" aria-live="polite"></p></form><p><a href="/conta">Já tenho conta · Entrar</a></p></main><script>const form=document.querySelector("#signup"),notice=document.querySelector("#notice");form.addEventListener("submit",async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form));if(data.password!==data.confirm){notice.textContent="As senhas não coincidem.";return}const button=form.querySelector("button");button.disabled=true;notice.textContent="Criando conta...";try{const r=await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:data.username,password:data.password})});const result=await r.json();if(!r.ok){notice.textContent=result.error||"Erro no cadastro.";return}notice.textContent="Conta criada! Redirecionando para entrar...";form.reset();setTimeout(()=>location.assign("/conta"),1200)}catch{notice.textContent="Serviço indisponível."}finally{button.disabled=false}})</script></body></html>`));

export default app;
