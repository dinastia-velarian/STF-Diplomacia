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
<section class="panel"><h2>Análise de admissibilidade</h2><p class="muted">Somente o ministro relator pode analisar o processo selecionado.</p><label for="reason">Fundamentação</label><p><textarea id="reason" rows="6" maxlength="5000" style="width:100%;box-sizing:border-box" placeholder="Fundamente a decisão (mínimo de 30 caracteres)"></textarea></p><button id="admit" type="button">Admitir processo</button> <button id="reject" type="button">Rejeitar processo</button><p id="admission-status" role="status"></p></section>
<section class="panel"><h2>Registrar movimentação</h2><p class="muted">Anotação processual com registro de autoria e auditoria.</p><textarea id="movementDetails" rows="4" maxlength="3000" style="width:100%;box-sizing:border-box" placeholder="Descreva a movimentação (mínimo 10 caracteres)"></textarea><p><button id="recordMovement" type="button">Registrar movimentação</button></p><p id="movementStatus" role="status"></p></section><section class="panel"><h2>Publicar decisão</h2><p class="muted">Somente o relator pode julgar processos admitidos. A publicação é definitiva e não pode ser editada.</p><label for="basis">Fundamento constitucional</label><p><textarea id="basis" rows="3" maxlength="5000" style="width:100%;box-sizing:border-box"></textarea></p><label for="judgment">Decisão fundamentada</label><p><textarea id="judgment" rows="9" maxlength="20000" style="width:100%;box-sizing:border-box" placeholder="Mínimo de 80 caracteres"></textarea></p><button id="publish" type="button">Publicar decisão</button><p id="judgment-status" role="status"></p></section></main>
<script>
let selectedCase = "";
async function submitMovement(){const status=document.querySelector("#movementStatus");const details=document.querySelector("#movementDetails").value.trim();if(!selectedCase||details.length<10){status.textContent="Selecione um processo e descreva a movimentação.";return}try{const r=await fetch("/api/court/movimentacoes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({case_number:selectedCase,details})});const data=await r.json();status.textContent=data.message||data.error||"Falha";if(r.ok)document.querySelector("#movementDetails").value=""}catch{status.textContent="Falha de conexão."}}

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
async function decide(action){const status=document.querySelector("#admission-status");const reason=document.querySelector("#reason").value.trim();if(!selectedCase||reason.length<30){status.textContent="Selecione um processo e informe pelo menos 30 caracteres de fundamentação.";return}if(!confirm("Confirmar decisão de admissibilidade?"))return;try{const r=await fetch("/api/court/admissibilidade",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({case_number:selectedCase,action,reason})});const data=await r.json();status.textContent=data.message||data.error||"Operação indisponível.";if(r.ok)load()}catch{status.textContent="Não foi possível registrar a análise."}}
document.querySelector("#admit").addEventListener("click",()=>decide("admit"));
document.querySelector("#reject").addEventListener("click",()=>decide("reject"));
document.querySelector("#publish").addEventListener("click",async()=>{const status=document.querySelector("#judgment-status");const content=document.querySelector("#judgment").value.trim();const constitutional_basis=document.querySelector("#basis").value.trim();if(!selectedCase||content.length<80){status.textContent="Selecione o processo e escreva pelo menos 80 caracteres.";return}if(!confirm("Publicar decisão definitiva? Esta ação não poderá ser desfeita."))return;try{const response=await fetch("/api/court/julgar",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({case_number:selectedCase,content,constitutional_basis})});const data=await response.json();status.textContent=data.message||data.error||"Operação indisponível.";if(response.ok)load()}catch{status.textContent="Falha na publicação."}});
document.querySelector("#recordMovement").onclick=submitMovement;
document.querySelector("#refresh").addEventListener("click", load);
loadJudges();
load();
</script>
</body>
</html>`));
