import { Hono } from "hono";
import { currentUser } from "./auth";
import { administrativeAccess } from "./admin";
export const adminExtended = new Hono<{Bindings:{DB?:D1Database}}>();
adminExtended.use("*",async(c,next)=>{
 if(!c.env.DB)return c.json({error:"Banco indisponível"},503);
 const user=await currentUser(c).catch(()=>null);
 if(!user)return c.json({error:"Login necessário"},401);
 const allowed=await c.env.DB.prepare("SELECT r.name FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND ur.revoked_at IS NULL AND r.name IN ('technical_admin','president')").bind(user.id).all<{name:string}>();
 const names=(allowed.results||[]).map(x=>x.name);
 const isAdmin=names.includes("technical_admin");
 const isPresident=names.includes("president");
 const isArchiveRoute=c.req.method==="POST" && c.req.path.startsWith("/api/admin/processos/") && (c.req.path.endsWith("/arquivar") || c.req.path.endsWith("/restaurar"));
 if(!isAdmin && !(isPresident && isArchiveRoute))return c.json({error:"Acesso restrito"},403);
 c.header("Cache-Control","no-store");await next();
});
async function archiveAvailable(db:D1Database){
 return !!await db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='case_archives'").first();
}
adminExtended.use("/processos/:id/*",async(c,next)=>{
 if(c.req.method==="POST"&&!await archiveAvailable(c.env.DB!))return c.json({error:"Gerenciamento de arquivamento temporariamente indisponível."},503);
 await next();
});
adminExtended.get("/processos",async c=>{
 const archive_available=await archiveAvailable(c.env.DB!);
 const query=archive_available?"SELECT c.id,c.case_number,c.title,c.status,c.visibility,c.assigned_judge,c.created_at, a.archived_at FROM cases c LEFT JOIN case_archives a ON a.case_id=c.id ORDER BY c.created_at DESC LIMIT 200":"SELECT id,case_number,title,status,visibility,assigned_judge,created_at,NULL AS archived_at FROM cases ORDER BY created_at DESC LIMIT 200";
 const rows=await c.env.DB!.prepare(query).all();
 return c.json({cases:rows.results,archive_available});
});

adminExtended.post("/processos/:id/arquivar",async c=>{
 const actor=await currentUser(c);const id=c.req.param("id");
 const b=await c.req.json().catch(()=>null);const reason=typeof b?.reason==="string"?b.reason.trim():"";
 if(reason.length<10||reason.length>500)return c.json({error:"Informe motivo de 10 a 500 caracteres."},400);
 const db=c.env.DB!;const item=await db.prepare("SELECT id,case_number,status FROM cases WHERE id=?").bind(id).first<{id:string,case_number:string,status:string}>();
 if(!item)return c.json({error:"Processo não encontrado."},404);
 if(await db.prepare("SELECT 1 FROM case_archives WHERE case_id=?").bind(id).first())return c.json({error:"Processo já arquivado."},409);
 await db.batch([
 db.prepare("INSERT INTO case_archives(case_id,archived_by,previous_status,reason) VALUES(?,?,?,?)").bind(id,actor!.id,item.status,reason),
 db.prepare("INSERT INTO audit_logs(id,actor_id,action,resource_type,resource_id,metadata) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),actor!.id,"admin.case.archive","case",id,JSON.stringify({number:item.case_number,reason}))
 ]);
 return c.json({ok:true,message:"Processo arquivado. Histórico preservado."});
});
adminExtended.post("/processos/:id/restaurar",async c=>{
 const actor=await currentUser(c);const id=c.req.param("id"),db=c.env.DB!;
 const archive=await db.prepare("SELECT case_id FROM case_archives WHERE case_id=?").bind(id).first();
 if(!archive)return c.json({error:"Processo não está arquivado."},404);
 await db.batch([
 db.prepare("DELETE FROM case_archives WHERE case_id=?").bind(id),
 db.prepare("INSERT INTO audit_logs(id,actor_id,action,resource_type,resource_id) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),actor!.id,"admin.case.restore","case",id)
 ]);
 return c.json({ok:true,message:"Processo restaurado."});
});
adminExtended.post("/processos/:id/excluir",async c=>{
 const actor=await currentUser(c);const id=c.req.param("id"),db=c.env.DB!;
 const b=await c.req.json().catch(()=>null);
 const item=await db.prepare("SELECT id,case_number,title,status FROM cases WHERE id=?").bind(id).first<{id:string,case_number:string,title:string,status:string}>();
 if(!item)return c.json({error:"Processo inexistente."},404);
 if(b?.confirmation!==item.case_number)return c.json({error:"Digite o número completo do processo para confirmar."},400);
 const protectedRows=await db.prepare("SELECT (SELECT COUNT(*) FROM decisions WHERE case_id=?) AS decisions,(SELECT COUNT(*) FROM votes WHERE case_id=?) AS votes,(SELECT COUNT(*) FROM case_documents WHERE case_id=?) AS documents").bind(id,id,id).first<{decisions:number,votes:number,documents:number}>();
 if((protectedRows?.decisions||0)>0||(protectedRows?.votes||0)>0||(protectedRows?.documents||0)>0)return c.json({error:"Exclusão bloqueada: processo possui decisões, votos ou documentos. Utilize Arquivar."},409);
 await db.batch([
 db.prepare("DELETE FROM case_archives WHERE case_id=?").bind(id),
 db.prepare("DELETE FROM constitutional_reviews WHERE case_id=?").bind(id),
 db.prepare("DELETE FROM case_parties WHERE case_id=?").bind(id),
 db.prepare("DELETE FROM case_events WHERE case_id=?").bind(id),
 db.prepare("DELETE FROM cases WHERE id=?").bind(id),
 db.prepare("INSERT INTO audit_logs(id,actor_id,action,resource_type,resource_id,metadata) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),actor!.id,"admin.case.delete","case",id,JSON.stringify({number:item.case_number,title:item.title}))
 ]);
 return c.json({ok:true,message:"Processo excluído permanentemente."});
});

adminExtended.get("/legislacao",async c=>{
 const rows=await c.env.DB!.prepare("SELECT id,norm_type,title,content,effective_from,effective_until FROM legal_norms ORDER BY created_at DESC LIMIT 200").all();
 return c.json({norms:rows.results});
});
adminExtended.post("/legislacao",async c=>{
 const b=await c.req.json().catch(()=>null);
 const title=typeof b?.title==="string"?b.title.trim():"";
 const content=typeof b?.content==="string"?b.content.trim():"";
 const normType=typeof b?.norm_type==="string"?b.norm_type.trim():"";
 if(title.length<5||title.length>200||content.length<20||content.length>20000||normType.length<2||normType.length>80)return c.json({error:"Dados inválidos"},400);
 const actor=await currentUser(c);const id=crypto.randomUUID();
 await c.env.DB!.batch([
 c.env.DB!.prepare("INSERT INTO legal_norms(id,norm_type,title,content) VALUES(?,?,?,?)").bind(id,normType,title,content),
 c.env.DB!.prepare("INSERT INTO audit_logs(id,actor_id,action,resource_type,resource_id) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),actor!.id,"admin.norm.create","legal_norm",id)
 ]);return c.json({ok:true,id},201);
});
adminExtended.get("/decisoes",async c=>{
 const rows=await c.env.DB!.prepare("SELECT d.id,d.case_id,d.status,d.published_at,substr(d.content,1,250) AS summary FROM decisions d ORDER BY d.created_at DESC LIMIT 200").all();
 return c.json({decisions:rows.results});
});
adminExtended.get("/configuracoes",async c=>{
 const rows=await c.env.DB!.prepare("SELECT key,value,updated_at FROM site_settings ORDER BY key").all();
 return c.json({settings:rows.results});
});
adminExtended.post("/configuracoes",async c=>{
 const b=await c.req.json().catch(()=>null);
 if(!["site_title","announcement","maintenance_notice","contact_telegram","maintenance_mode","registration_enabled","filing_enabled","public_search_enabled"].includes(b?.key)||typeof b?.value!=="string"||b.value.length>2000|| (b.key==="site_title"&&b.value.trim().length<3))return c.json({error:"Dados inválidos"},400);
 if(["maintenance_mode","registration_enabled","filing_enabled","public_search_enabled"].includes(b.key)&&!["true","false"].includes(b.value))return c.json({error:"Use true ou false"},400);
 const actor=await currentUser(c);
 await c.env.DB!.batch([
 c.env.DB!.prepare("INSERT INTO site_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP").bind(b.key,b.value),
 c.env.DB!.prepare("INSERT INTO audit_logs(id,actor_id,action,resource_type,resource_id) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),actor!.id,"admin.setting.update","setting",b.key)
 ]);return c.json({ok:true});
});

adminExtended.get("/magistrados",async c=>{
 const rows=await c.env.DB!.prepare("SELECT u.id,u.game_username,r.name AS role,ur.granted_at FROM user_roles ur JOIN users u ON u.id=ur.user_id JOIN roles r ON r.id=ur.role_id WHERE ur.revoked_at IS NULL AND r.name IN ('minister','president','court_clerk') ORDER BY r.name,u.game_username LIMIT 300").all();
 return c.json({magistrates:rows.results});
});

adminExtended.get("/processos/:id/movimentacoes",async c=>{
 const target=await c.env.DB!.prepare("SELECT id,case_number,title,status FROM cases WHERE id=?").bind(c.req.param("id")).first();
 if(!target)return c.json({error:"Processo inexistente"},404);
 const rows=await c.env.DB!.prepare("SELECT e.event_type,e.details,e.created_at,u.game_username AS actor FROM case_events e JOIN users u ON u.id=e.actor_id WHERE e.case_id=? ORDER BY e.created_at DESC LIMIT 200").bind(c.req.param("id")).all();
 return c.json({case:target,events:rows.results});
});

adminExtended.get("/backup",async c=>{
 const tables=["users","roles","user_roles","cases","case_parties","case_events","decisions","votes","legal_norms","constitutional_reviews","consultations","audit_logs","site_settings"];
 const data:Record<string,unknown>={};
 for(const table of tables){const result=await c.env.DB!.prepare(table==="users"?"SELECT id,game_username,status,created_at FROM users LIMIT 5000":"SELECT * FROM "+table+" LIMIT 5000").all();if((result.results||[]).length===5000)return c.json({error:"Limite de exportação atingido; use backup completo do D1 no Cloudflare"},409);data[table]=result.results}
 c.header("Content-Disposition",'attachment; filename="stf-diplomacia-backup.json"');
 return c.json({exported_at:new Date().toISOString(),data});
});
