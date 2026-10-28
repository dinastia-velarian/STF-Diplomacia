import { Hono } from "hono";
import { currentUser } from "./auth";

export const admin = new Hono<{ Bindings: { DB?: D1Database } }>();
admin.use("*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  if (!c.env.DB) return c.json({ error: "Banco não configurado." }, 503);
  const user = await currentUser(c).catch(() => null);
  if (!user) return c.json({ error: "Autenticação necessária." }, 401);
  const authorized = await c.env.DB.prepare("SELECT 1 FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND ur.revoked_at IS NULL AND r.name='technical_admin' LIMIT 1").bind(user.id).first().catch(() => null);
  if (!authorized) return c.json({ error: "Acesso exclusivo do superadministrador." }, 403);
  c.set("actorId" as never, user.id as never);
  await next();
});
admin.get("/resumo", async c => {
  try {
    const [users, cases, decisions, roles] = await c.env.DB!.batch([
      c.env.DB!.prepare("SELECT COUNT(*) AS total FROM users"),
      c.env.DB!.prepare("SELECT COUNT(*) AS total FROM cases"),
      c.env.DB!.prepare("SELECT COUNT(*) AS total FROM decisions WHERE status='published'"),
      c.env.DB!.prepare("SELECT COUNT(*) AS total FROM user_roles WHERE revoked_at IS NULL")
    ]);
    return c.json({ users: users.results[0], cases: cases.results[0], decisions: decisions.results[0], roles: roles.results[0] });
  } catch { return c.json({ error: "Resumo indisponível." }, 503); }
});
admin.get("/usuarios", async c => {
  try {
    const result = await c.env.DB!.prepare("SELECT u.id,u.game_username,u.status,u.created_at,COALESCE(GROUP_CONCAT(CASE WHEN ur.revoked_at IS NULL THEN r.name END), '') AS roles FROM users u LEFT JOIN user_roles ur ON ur.user_id=u.id LEFT JOIN roles r ON r.id=ur.role_id GROUP BY u.id ORDER BY u.created_at DESC LIMIT 200").all();
    return c.json({ users: result.results ?? [] });
  } catch { return c.json({ error: "Usuários indisponíveis." }, 503); }
});
admin.get("/auditoria", async c => {
  try {
    const result = await c.env.DB!.prepare("SELECT a.action,a.resource_type,a.resource_id,a.created_at,u.game_username AS actor FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 100").all();
    return c.json({ entries: result.results ?? [] });
  } catch { return c.json({ error: "Auditoria indisponível." }, 503); }
});
admin.post("/usuarios/status", async c => {
  try {
    const body = await c.req.json().catch(() => null);
    if (typeof body?.user_id !== "string" || !["active","suspended"].includes(body?.status)) return c.json({ error: "Dados inválidos." }, 400);
    const actor = await currentUser(c);
    if (body.user_id === actor?.id) return c.json({ error: "Não é permitido suspender a própria conta." }, 400);
    const target = await c.env.DB!.prepare("SELECT id FROM users WHERE id=?").bind(body.user_id).first();
    if (!target) return c.json({ error: "Usuário não encontrado." }, 404);
    await c.env.DB!.batch([
      c.env.DB!.prepare("UPDATE users SET status=? WHERE id=?").bind(body.status, body.user_id),
      c.env.DB!.prepare("INSERT INTO audit_logs(id,actor_id,action,resource_type,resource_id,metadata) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),actor!.id,"admin.user.status","user",body.user_id,JSON.stringify({status:body.status}))
    ]);
    return c.json({ ok:true });
  } catch { return c.json({ error: "Alteração indisponível." }, 503); }
});
admin.post("/usuarios/cargo", async c => {
  try {
    const body = await c.req.json().catch(() => null);
    if (typeof body?.user_id !== "string" || !["citizen","lawyer","minister","president","court_clerk"].includes(body?.role) || !["grant","revoke"].includes(body?.action)) return c.json({ error:"Dados inválidos." },400);
    const actor = await currentUser(c);
    const role = await c.env.DB!.prepare("SELECT id FROM roles WHERE name=?").bind(body.role).first<{id:string}>();
    const user = await c.env.DB!.prepare("SELECT id,status FROM users WHERE id=?").bind(body.user_id).first<{id:string;status:string}>();
    if (!role || !user) return c.json({ error:"Usuário ou cargo inexistente." },404);
    if (body.action === "grant") {
      if (user.status !== "active") return c.json({ error:"Não é permitido nomear usuário suspenso." },409);
      const existing = await c.env.DB!.prepare("SELECT 1 FROM user_roles WHERE user_id=? AND role_id=? AND revoked_at IS NULL").bind(body.user_id,role.id).first();
      if (existing) return c.json({ error:"Cargo já atribuído." },409);
      const result = await c.env.DB!.batch([
        c.env.DB!.prepare("INSERT INTO user_roles(user_id,role_id,granted_by,granted_at) SELECT ?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id=? AND role_id=? AND revoked_at IS NULL)").bind(body.user_id,role.id,actor!.id,new Date().toISOString(),body.user_id,role.id),
        c.env.DB!.prepare("INSERT INTO audit_logs(id,actor_id,action,resource_type,resource_id,metadata) SELECT ?,?,?,?,?,? WHERE changes()>0").bind(crypto.randomUUID(),actor!.id,"admin.role.grant","user",body.user_id,JSON.stringify({role:body.role}))
      ]);
      if (!result[0].meta.changes) return c.json({error:"Cargo já atribuído."},409);
    } else {
      const result = await c.env.DB!.batch([
        c.env.DB!.prepare("UPDATE user_roles SET revoked_at=CURRENT_TIMESTAMP WHERE user_id=? AND role_id=? AND revoked_at IS NULL").bind(body.user_id,role.id),
        c.env.DB!.prepare("INSERT INTO audit_logs(id,actor_id,action,resource_type,resource_id,metadata) SELECT ?,?,?,?,?,? WHERE changes()>0").bind(crypto.randomUUID(),actor!.id,"admin.role.revoke","user",body.user_id,JSON.stringify({role:body.role}))
      ]);
      if (!result[0].meta.changes) return c.json({error:"Cargo não está ativo."},409);
    }
    return c.json({ok:true});
  } catch {return c.json({error:"Operação indisponível."},503);}
});
