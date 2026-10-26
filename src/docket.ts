import { Hono } from "hono";
import { currentUser } from "./auth";

export const docket = new Hono<{ Bindings: { DB?: D1Database } }>();
const courtRoles = ["minister", "president", "court_clerk"];
async function access(c: any) {
  if (!c.env.DB) return null;
  const user = await currentUser(c).catch(() => null);
  if (!user) return null;
  const found = await c.env.DB.prepare("SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND ur.revoked_at IS NULL").bind(user.id).all<{ name: string }>();
  const roles = (found.results ?? []).map(row => row.name);
  return roles.some(role => courtRoles.includes(role)) ? { user, roles } : null;
}
docket.get("/relatores", async c => {
  c.header("Cache-Control", "no-store");
  if (!c.env.DB) return c.json({ error: "Banco indisponível." }, 503);
  try {
    if (!await access(c)) return c.json({ error: "Acesso restrito ao Tribunal." }, 403);
    const result = await c.env.DB.prepare("SELECT DISTINCT u.id,u.game_username FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE ur.revoked_at IS NULL AND u.status='active' AND r.name IN ('minister','president') ORDER BY u.game_username").all();
    return c.json({ judges: result.results ?? [] });
  } catch {
    return c.json({ error: "Consulta indisponível." }, 503);
  }
});
docket.post("/distribuir", async c => {
  c.header("Cache-Control", "no-store");
  if (!c.env.DB) return c.json({ error: "Banco indisponível." }, 503);
  try {
    const actor = await access(c);
    if (!actor || !actor.roles.some(role => ["president", "court_clerk"].includes(role))) return c.json({ error: "Somente a Presidência ou a Secretaria pode distribuir processos." }, 403);
    const body = await c.req.json().catch(() => null);
    const number = typeof body?.case_number === "string" ? body.case_number : "";
    const judge = typeof body?.judge_id === "string" ? body.judge_id : "";
    if (!/^STF-[0-9]{4}-[A-F0-9]{8}$/.test(number) || !/^[0-9a-f-]{36}$/.test(judge)) return c.json({ error: "Dados inválidos." }, 400);
    const valid = await c.env.DB.prepare("SELECT 1 FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id WHERE u.id=? AND u.status='active' AND ur.revoked_at IS NULL AND r.name IN ('minister','president') LIMIT 1").bind(judge).first();
    if (!valid) return c.json({ error: "Relator não autorizado." }, 400);
    const record = await c.env.DB.prepare("SELECT id FROM cases WHERE case_number=? AND status IN ('submitted','triage','instruction') AND assigned_judge IS NULL").bind(number).first<{id:string}>();
    if (!record) return c.json({ error: "Processo indisponível para distribuição." }, 409);
    const result = await c.env.DB.prepare("UPDATE cases SET assigned_judge=? WHERE id=? AND assigned_judge IS NULL").bind(judge, record.id).run();
    if (!result.meta.changes) return c.json({ error: "Processo já distribuído." }, 409);
    await c.env.DB.batch([
      c.env.DB.prepare("INSERT INTO case_events (id,case_id,actor_id,event_type,details) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), record.id, actor.user.id, "assigned", "Relatoria distribuída."),
      c.env.DB.prepare("INSERT INTO audit_logs (id,actor_id,action,resource_type,resource_id) VALUES (?,?,?,?,?)").bind(crypto.randomUUID(), actor.user.id, "case.assigned", "case", record.id)
    ]);
    return c.json({ ok: true, message: "Relatoria distribuída." });
  } catch {
    return c.json({ error: "Distribuição indisponível." }, 503);
  }
});
