import { Hono } from "hono";
import { currentUser } from "./auth";
export const adminExtended = new Hono<{Bindings:{DB?:D1Database}}>();
adminExtended.use("*",async(c,next)=>{
 if(!c.env.DB)return c.json({error:"Banco indisponível"},503);
 const user=await currentUser(c).catch(()=>null);
 if(!user)return c.json({error:"Login necessário"},401);
 const allowed=await c.env.DB.prepare("SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND ur.revoked_at IS NULL AND r.name='technical_admin'").bind(user.id).first();
 if(!allowed)return c.json({error:"Acesso restrito"},403);
 c.header("Cache-Control","no-store");await next();
});
adminExtended.get("/processos",async c=>{
 const rows=await c.env.DB!.prepare("SELECT id,case_number,title,status,visibility,assigned_judge,created_at FROM cases ORDER BY created_at DESC LIMIT 200").all();
 return c.json({cases:rows.results});
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
 if(!["site_title","announcement","maintenance_notice","contact_telegram"].includes(b?.key)||typeof b?.value!=="string"||b.value.length>2000|| (b.key==="site_title"&&b.value.trim().length<3))return c.json({error:"Dados inválidos"},400);
 const actor=await currentUser(c);
 await c.env.DB!.batch([
 c.env.DB!.prepare("INSERT INTO site_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP").bind(b.key,b.value),
 c.env.DB!.prepare("INSERT INTO audit_logs(id,actor_id,action,resource_type,resource_id) VALUES(?,?,?,?,?)").bind(crypto.randomUUID(),actor!.id,"admin.setting.update","setting",b.key)
 ]);return c.json({ok:true});
});
