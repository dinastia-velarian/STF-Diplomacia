import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';
import { JSDOM } from 'jsdom';
const bundle = await build({entryPoints:['src/index.ts'],bundle:true,write:false,format:'esm',platform:'browser'});
const mf = new Miniflare({modules:true,script:bundle.outputFiles[0].text,compatibilityDate:'2026-10-24',d1Databases:['DB']});
after(()=>mf.dispose());
const db = await mf.getD1Database('DB');
for (const file of (await readdir('migrations')).sort()) {
 const sql=await readFile('migrations/'+file,'utf8');
 // Each migration statement (including triggers) ends at a newline.
 const statements=sql.replace(/^--.*$/gm,'').trim().split(/;\s*\n/).filter(Boolean);
 for(const statement of statements) await db.prepare(statement).run();
}
const base='https://stf.test';
async function request(path,cookie='',body,origin=base){
 return mf.dispatchFetch(base+path,{method:body===undefined?'GET':'POST',headers:{...(cookie?{cookie}:{}),origin,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
}
async function json(path,cookie='',body,status=200){const r=await request(path,cookie,body);const data=await r.json();assert.equal(r.status,status,JSON.stringify(data));return data;}
const users={};
for(const role of ['citizen','technical_admin','president','court_clerk','minister','other']){
 const username='TEST_'+role;
 await json('/api/auth/register','',{username,password:'Test123!'},201);
 const r=await request('/api/auth/login','',{username,password:'Test123!'});assert.equal(r.status,200);
 const cookie=r.headers.get('set-cookie').split(';')[0];
 const user=await db.prepare('SELECT id FROM users WHERE game_username=?').bind(username).first();
 users[role]={id:user.id,cookie};
 if(!['citizen','other'].includes(role)) await db.prepare('INSERT INTO user_roles(user_id,role_id) VALUES(?,?)').bind(user.id,'role_'+role).run();
}
const admin=users.technical_admin.cookie, minister=users.minister.cookie, president=users.president.cookie, clerk=users.court_clerk.cookie;
const filing={title:'TEST Processo judicial isolado',description:'Fundamentação fictícia para verificar o fluxo judicial sem utilizar dados reais.',case_type:'acao'};
async function file(){return (await json('/api/judicial/processos',users.citizen.cookie,filing,201)).case_number;}
test('autenticação, suspensão, expiração, logout e CSRF',async()=>{
 await json('/api/admin/resumo','',undefined,401);
 await json('/api/court/fila',users.citizen.cookie,undefined,403);
 await json('/api/court/fila',admin,undefined,403);
 await json('/api/admin/resumo',minister,undefined,403);
 assert.equal((await request('/api/judicial/processos',users.citizen.cookie,filing,'https://evil.test')).status,403);
 await json('/api/auth/login','',{username:'TEST_citizen',password:'wrong'},401);
 await json('/api/admin/usuarios/status',admin,{user_id:users.other.id,status:'suspended'});
 await json('/api/auth/me',users.other.cookie,undefined,401);
 await json('/api/admin/usuarios/status',admin,{user_id:users.other.id,status:'active'});
 const login=await request('/api/auth/login','',{username:'TEST_other',password:'Test123!'});
 const cookie=login.headers.get('set-cookie').split(';')[0];
 await json('/api/auth/logout',cookie,{});
 await json('/api/auth/me',cookie,undefined,401);
 await db.prepare("UPDATE sessions SET expires_at='2000-01-01T00:00:00Z' WHERE user_id=?").bind(users.other.id).run();
 await json('/api/auth/me',users.other.cookie,undefined,401);
});
test('composição: nomear, impedir duplicação concorrente, exonerar e renomear',async()=>{
 const body={user_id:users.citizen.id,role:'minister',action:'grant'};
 const results=await Promise.all([request('/api/admin/usuarios/cargo',admin,body),request('/api/admin/usuarios/cargo',admin,body)]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 let data=await json('/api/admin/magistrados',admin);assert.equal(data.magistrates.filter(x=>x.id===users.citizen.id).length,1);
 await json('/api/admin/usuarios/cargo',admin,{...body,action:'revoke'});
 await json('/api/admin/usuarios/cargo',admin,{...body,action:'revoke'},409);
 await json('/api/admin/usuarios/cargo',admin,body);
 await json('/api/admin/usuarios/cargo',admin,{...body,action:'revoke'});
 await json('/api/admin/usuarios/status',admin,{user_id:users.other.id,status:'suspended'});
 await json('/api/admin/usuarios/cargo',admin,{...body,user_id:users.other.id},409);
 await json('/api/admin/usuarios/status',admin,{user_id:users.other.id,status:'active'});
 await json('/api/admin/usuarios/cargo',admin,{...body,role:'technical_admin'},400);
});
test('protocolo, distribuição concorrente, relatoria, admissibilidade e decisão imutável',async()=>{
 const number=await file();
 assert.ok((await json('/api/judicial/meus-processos',users.citizen.cookie)).processes.some(x=>x.case_number===number));
 await json('/api/court/distribuir',admin,{case_number:number,judge_id:users.minister.id},403);
 await json('/api/court/distribuir',minister,{case_number:number,judge_id:users.minister.id},403);
 await json('/api/court/distribuir',clerk,{case_number:number,judge_id:users.citizen.id},400);
 const dist=await Promise.all([request('/api/court/distribuir',president,{case_number:number,judge_id:users.minister.id}),request('/api/court/distribuir',clerk,{case_number:number,judge_id:users.minister.id})]);
 assert.deepEqual(dist.map(r=>r.status).sort(),[200,409]);
 const reason='Fundamentação fictícia suficiente para admissibilidade.';
 await json('/api/court/admissibilidade',president,{case_number:number,action:'admit',reason},409);
 await json('/api/court/julgar',minister,{case_number:number,content:'Teste de decisão fundamentada. '.repeat(5)},409);
 await json('/api/court/admissibilidade',minister,{case_number:number,action:'admit',reason});
 await json('/api/court/admissibilidade',minister,{case_number:number,action:'admit',reason},409);
 await json('/api/court/movimentacoes',minister,{case_number:number,details:'Movimentação fictícia de instrução.'},201);
 const judgment={case_number:number,content:'Decisão fictícia de teste sem qualquer efeito em dados reais. '.repeat(3),constitutional_basis:'Norma fictícia'};
 const judges=await Promise.all([request('/api/court/julgar',minister,judgment),request('/api/court/julgar',minister,judgment)]);
 assert.deepEqual(judges.map(r=>r.status).sort(),[200,409]);
 assert.ok((await json('/api/public/decisoes')).decisions.some(x=>x.case_number===number));
 const row=await db.prepare('SELECT id FROM cases WHERE case_number=?').bind(number).first();
 const history=await json('/api/admin/processos/'+row.id+'/movimentacoes',admin);
 assert.deepEqual(history.events.map(x=>x.event_type).sort(),['admitted','assigned','decided','note','submitted']);
 await assert.rejects(db.prepare("UPDATE decisions SET content='alteração' WHERE case_id=?").bind(row.id).run(),/immutable/);
 await assert.rejects(db.prepare('DELETE FROM decisions WHERE case_id=?').bind(row.id).run(),/cannot be deleted/);
 await json('/api/court/movimentacoes',minister,{case_number:number,details:'Não pode movimentar encerrado.'},409);
 await db.prepare("UPDATE cases SET visibility='sealed' WHERE id=?").bind(row.id).run();
 assert.ok(!(await json('/api/public/processos')).processes.some(x=>x.case_number===number));
 assert.ok(!(await json('/api/public/decisoes')).decisions.some(x=>x.case_number===number));
});
test('rejeição e rollback de falha na auditoria',async()=>{
 let number=await file();await json('/api/court/distribuir',clerk,{case_number:number,judge_id:users.minister.id});
 await json('/api/court/admissibilidade',minister,{case_number:number,action:'reject',reason:'Motivo fictício suficiente para rejeitar o pedido.'});
 await json('/api/court/julgar',minister,{case_number:number,content:'Decisão fictícia sem efeito. '.repeat(5)},409);
 number=await file();
 await db.prepare("CREATE TRIGGER test_fail BEFORE INSERT ON audit_logs WHEN NEW.action='case.assigned' BEGIN SELECT RAISE(ABORT,'test failure'); END").run();
 await json('/api/court/distribuir',clerk,{case_number:number,judge_id:users.minister.id},503);
 const row=await db.prepare('SELECT id,assigned_judge FROM cases WHERE case_number=?').bind(number).first();assert.equal(row.assigned_judge,null);
 const count=await db.prepare("SELECT COUNT(*) AS n FROM case_events WHERE case_id=? AND event_type='assigned'").bind(row.id).first();assert.equal(count.n,0);
 await db.prepare('DROP TRIGGER test_fail').run();
});
test('painel executa JavaScript e atualiza normas e composição após ações',async()=>{
 const html=await (await request('/administracao')).text();
 const failures=[];let dom;
 dom=new JSDOM(html,{url:base+'/administracao',runScripts:'dangerously',beforeParse(window){
 window.confirm=()=>true;
 window.fetch=async(path,options={})=>{const body=options.body===undefined?undefined:JSON.parse(options.body);return request(path,admin,body);};
 window.addEventListener('error',e=>failures.push(e.message));
 }});
 const w=dom.window,d=w.document;
 async function until(fn){for(let i=0;i<200;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw Error('Painel não atualizou: '+d.querySelector('#message').textContent);}
 await until(()=>!d.querySelector('#private').hidden&&d.querySelector('#settingsForm input').value==='STF Diplomacia');
 const form=d.querySelector('#normForm');form.elements.norm_type.value='Teste';form.elements.title.value='TEST Norma isolada';form.elements.content.value='Texto fictício para testar a publicação e atualização da legislação.';
 form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 await until(()=>d.querySelector('#norms').textContent.includes('TEST Norma isolada'));
 assert.equal(form.elements.title.value,'');
 const row=[...d.querySelectorAll('#users tr')].find(x=>x.textContent.includes('TEST_citizen'));
 row.querySelector('select').value='minister';row.querySelectorAll('button')[1].click();
 await until(()=>d.querySelector('#magistrates').textContent.includes('TEST_citizen'));
 await until(()=>d.querySelectorAll('#sanctionSettings input[type="checkbox"]').length===7);
 const first=d.querySelector('#sanctionSettings textarea');
 first.value='Advertência alterada durante teste local.';
 first.dispatchEvent(new w.Event('input',{bubbles:true}));
 d.querySelector('#saveSanctions').click();
 await until(()=>d.querySelector('#sanctionStatus').textContent.includes('atualizado'));
 assert.equal((await json('/api/admin/sancoes/configuracao',admin)).sanctions[0].description,first.value);
 assert.deepEqual(failures,[]);dom.window.close();
});
test('arquivamento preserva histórico, restauração e exclusão protegida',async()=>{
 const number=await file();const row=await db.prepare('SELECT id FROM cases WHERE case_number=?').bind(number).first();
 const path='/api/admin/processos/'+row.id;
 await json(path+'/arquivar',users.citizen.cookie,{reason:'Teste de arquivamento'},403);
 await json(path+'/arquivar',minister,{reason:'Teste de arquivamento'},403);
 await json('/api/admin/resumo',president,undefined,403);
 await json(path+'/arquivar',president,{reason:'Teste de arquivamento'});
 assert.ok((await json('/api/admin/processos',admin)).cases.find(x=>x.id===row.id).archived_at);
 assert.equal((await json(path+'/movimentacoes',admin)).events.length,1);
 await json(path+'/restaurar',president,{});
 assert.equal((await json('/api/admin/processos',admin)).cases.find(x=>x.id===row.id).archived_at,null);
 await json(path+'/excluir',admin,{confirmation:'INVALIDO'},400);
 // Only this newly created synthetic local case is deleted.
 await json(path+'/excluir',admin,{confirmation:number});
 assert.equal(await db.prepare('SELECT id FROM cases WHERE id=?').bind(row.id).first(),null);
 const published=await db.prepare('SELECT c.id,c.case_number FROM cases c JOIN decisions d ON d.case_id=c.id LIMIT 1').first();
 await json('/api/admin/processos/'+published.id+'/excluir',admin,{confirmation:published.case_number},409);
 const backup=await json('/api/admin/backup',admin);
 assert.ok(backup.data.users.every(u=>!('password_hash' in u)));
});
test('arquivamento impede novas movimentações e distribuição',async()=>{
 const number=await file();
 const record=await db.prepare('SELECT id FROM cases WHERE case_number=?').bind(number).first();
 await json('/api/admin/processos/'+record.id+'/arquivar',president,{reason:'Teste de processo arquivado.'});
 const queue=await json('/api/court/fila',president);
 assert.ok(queue.cases.some(x=>x.case_number===number&&x.archived_at));
 await json('/api/court/distribuir',clerk,{case_number:number,judge_id:users.minister.id},409);
 await json('/api/court/movimentacoes',president,{case_number:number,details:'Tentativa de movimentação em arquivo.'},409);
 await json('/api/admin/processos/'+record.id+'/restaurar',president,{});
 await json('/api/court/distribuir',clerk,{case_number:number,judge_id:users.minister.id});
});
test('arquivamento impede admissibilidade e julgamento',async()=>{
 const number=await file();
 const record=await db.prepare('SELECT id FROM cases WHERE case_number=?').bind(number).first();
 const route='/api/admin/processos/'+record.id;
 await json('/api/court/distribuir',clerk,{case_number:number,judge_id:users.minister.id});
 await json(route+'/arquivar',president,{reason:'Teste de suspensão da tramitação.'});
 await json('/api/court/admissibilidade',minister,{case_number:number,action:'admit',reason:'Fundamentação de teste suficientemente detalhada.'},409);
 await json(route+'/restaurar',president,{});
 await json('/api/court/admissibilidade',minister,{case_number:number,action:'admit',reason:'Fundamentação de teste suficientemente detalhada.'});
 await json(route+'/arquivar',president,{reason:'Teste de bloqueio de julgamento.'});
 await json('/api/court/julgar',minister,{case_number:number,content:'Decisão fundamentada exclusivamente para teste. '.repeat(4)},409);
});
test('superadministrador edita capa com proteção contra HTML e trilha de auditoria',async()=>{
 const route='/api/admin/configuracoes';
 await json(route,users.citizen.cookie,{key:'home_heading',value:'Alteração não autorizada'},403);
 const title='STF Diplomacia <script>alert(1)</script>';
 await json(route,admin,{key:'home_heading',value:title});
 await json(route,admin,{key:'home_eyebrow',value:'Justiça e transparência'});
 await json(route,admin,{key:'home_description',value:'Portal de testes do Supremo Tribunal Federal'});
 const page=await (await request('/')).text();
 assert.ok(page.includes('STF Diplomacia &lt;script&gt;alert(1)&lt;/script&gt;'));
 assert.ok(!page.includes('<h1>STF Diplomacia <script>'));
 assert.ok(page.includes('Justiça e transparência'));
 assert.ok(page.includes('Portal de testes do Supremo Tribunal Federal'));
 const log=await db.prepare("SELECT COUNT(*) AS n FROM audit_logs WHERE action='admin.setting.update' AND resource_id='home_heading'").first();
 assert.ok(log.n>=1);
});
test('catálogo de sanções é editável somente pelo administrador',async()=>{
 const route='/api/admin/sancoes/configuracao';
 await json(route,users.citizen.cookie,undefined,403);
 await json(route,president,undefined,403);
 const original=await json(route,admin);
 assert.ok(original.sanctions.some(x=>x.code==='warning'));
 await json(route,president,{sanctions:original.sanctions},403);
 const edited=original.sanctions.map(x=>({...x}));
 edited[0].description='Advertência de teste, sem aplicação real.';
 await json(route,admin,{sanctions:edited});
 const updated=await json(route,admin);
 assert.equal(updated.sanctions[0].description,edited[0].description);
 const audit=await db.prepare("SELECT COUNT(*) AS total FROM audit_logs WHERE action='admin.sanctions.catalog.update'").first();
 assert.ok(audit.total>=1);
 await json(route,admin,{sanctions:[{code:'invalid'}]},400);
});
test('painel continua operante com migração de arquivamento pendente',async()=>{
 await db.prepare('DROP TABLE case_archives').run();
 const data=await json('/api/admin/processos',admin);assert.equal(data.archive_available,false);assert.ok(data.cases.length);
 await json('/api/court/fila',president);
 const id=data.cases[0].id;
 for(const action of ['arquivar','restaurar','excluir'])await json('/api/admin/processos/'+id+'/'+action,admin,{reason:'Teste fictício',confirmation:data.cases[0].case_number},503);
 assert.ok(await db.prepare('SELECT id FROM cases WHERE id=?').bind(id).first());
 await json('/api/admin/legislacao',admin);await json('/api/admin/decisoes',admin);await json('/api/admin/configuracoes',admin);
});
