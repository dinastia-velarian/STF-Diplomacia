import { Hono } from "hono";

export const ministerPanel = new Hono();

ministerPanel.get("/painel-ministros", c => c.html(`<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Painel dos Ministros · STF Diplomacia</title>
<style>
body{margin:0;background:#f6f4ef;color:#172e28;font:16px system-ui}
header{background:#142d27;color:#fff;padding:24px max(20px,calc((100% - 940px)/2))}
a{color:inherit}
main{max-width:940px;margin:55px auto;padding:0 20px}
h1{font:40px Georgia,serif}
.panel{background:#fff;border:1px solid #d9dfd9;padding:25px;margin:20px 0}
button{background:#17382f;color:#fff;border:0;padding:13px 20px;cursor:pointer;font:inherit}
.item{padding:16px 0;border-top:1px solid #d9dfd9}
.muted{color:#65776c}
</style>
</head>
<body>
<header><a href="/">← STF DIPLOMACIA</a></header>
<main>
<p class="muted">ÁREA RESTRITA</p>
<h1>Painel dos Ministros</h1>
<p>Consulta dos processos pendentes de análise pelos membros autorizados do Tribunal.</p>
<div class="panel">
<button id="refresh" type="button">Atualizar fila</button>
<div id="results" role="status" aria-live="polite">Carregando...</div><section id="distribution" hidden><h2>Distribuir relatoria</h2><label for="judge">Ministro relator</label> <select id="judge"></select> <button id="assign" type="button">Distribuir processo selecionado</button><p id="assignment-status" role="status"></p></section>
</div>
<p class="muted">A distribuição de relatoria e os julgamentos serão disponibilizados após os testes do banco e das permissões.</p>
</main>
<script>
let selectedCase = "";
async function load() {
 const target = document.querySelector("#results");
 target.textContent = "Consultando fila...";
 try {
  const response = await fetch("/api/court/fila", { credentials: "same-origin" });
  const data = await response.json();
  target.replaceChildren();
  if (!response.ok) { target.textContent = data.error || "Acesso indisponível."; return; }
  if (!data.cases.length) { target.textContent = "Nenhum processo na fila."; return; }
  for (const item of data.cases) {
   const article = document.createElement("article");
   article.className = "item";
   const title = document.createElement("strong");
   title.textContent = item.case_number + " · " + item.title;
   const select = document.createElement("button"); select.type = "button"; select.textContent = "Selecionar para distribuição"; select.addEventListener("click", () => { selectedCase = item.case_number; document.querySelector("#assignment-status").textContent = "Selecionado: " + selectedCase; });
   const details = document.createElement("p");
   details.className = "muted";
   details.textContent = item.case_type + " · " + item.status + " · " + item.created_at;
   article.append(title, details, select);
   target.append(article);
  }
 } catch { target.textContent = "Não foi possível carregar a fila."; }
}
async function loadJudges(){try{const r=await fetch("/api/court/relatores");if(!r.ok)return;const data=await r.json();const select=document.querySelector("#judge");for(const judge of data.judges){const option=document.createElement("option");option.value=judge.id;option.textContent=judge.game_username;select.append(option)}document.querySelector("#distribution").hidden=!data.judges.length}catch{}}
document.querySelector("#assign").addEventListener("click",async()=>{const status=document.querySelector("#assignment-status");if(!selectedCase){status.textContent="Selecione um processo.";return}try{const r=await fetch("/api/court/distribuir",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({case_number:selectedCase,judge_id:document.querySelector("#judge").value})});const data=await r.json();status.textContent=data.message||data.error||"Operação indisponível.";if(r.ok)load()}catch{status.textContent="Falha na distribuição."}});
document.querySelector("#refresh").addEventListener("click", load);
loadJudges();
load();
</script>
</body>
</html>`));
