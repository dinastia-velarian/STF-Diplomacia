import { Hono } from "hono";
import { currentUser } from "./auth";

export const judicial = new Hono<{ Bindings: { DB?: D1Database } }>();

judicial.get("/meus-processos", async c => {
  c.header("Cache-Control", "no-store");
  if (!c.env.DB) return c.json({ error: "Sistema em preparação." }, 503);
  const user = await currentUser(c).catch(() => null);
  if (!user) return c.json({ error: "Entre na sua conta." }, 401);
  try {
    const result = await c.env.DB.prepare("SELECT case_number, title, case_type, status, created_at FROM cases WHERE filed_by = ? ORDER BY created_at DESC LIMIT 50").bind(user.id).all();
    return c.json({ processes: result.results ?? [] });
  } catch {
    return c.json({ error: "Consulta indisponível." }, 503);
  }
});

judicial.post("/processos", async c => {
  c.header("Cache-Control", "no-store");
  if (!c.env.DB) return c.json({ error: "Protocolo em preparação." }, 503);
  const user = await currentUser(c).catch(() => null);
  if (!user) return c.json({ error: "Entre na sua conta." }, 401);
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") return c.json({ error: "Dados inválidos." }, 400);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const caseType = typeof body.case_type === "string" ? body.case_type : "";
  const types = ["acao", "reclamacao", "consulta", "recurso", "controle_constitucionalidade"];
  if (title.length < 10 || title.length > 160 || description.length < 30 || description.length > 10000 || !types.includes(caseType)) return c.json({ error: "Confira o tipo, título e descrição." }, 400);
  const id = crypto.randomUUID();
  const number = "STF-" + new Date().getUTCFullYear() + "-" + crypto.randomUUID().slice(0, 8).toUpperCase();
  try {
    await c.env.DB.batch([
      c.env.DB.prepare("INSERT INTO cases (id, case_number, case_type, title, description, filed_by) VALUES (?, ?, ?, ?, ?, ?)").bind(id, number, caseType, title, description, user.id),
      c.env.DB.prepare("INSERT INTO case_parties (case_id, user_id, party_type) VALUES (?, ?, 'claimant')").bind(id, user.id),
      c.env.DB.prepare("INSERT INTO case_events (id, case_id, actor_id, event_type) VALUES (?, ?, ?, 'submitted')").bind(crypto.randomUUID(), id, user.id),
      c.env.DB.prepare("INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id) VALUES (?, ?, 'case.created', 'case', ?)").bind(crypto.randomUUID(), user.id, id)
    ]);
    return c.json({ ok: true, case_number: number }, 201);
  } catch {
    return c.json({ error: "Não foi possível protocolar." }, 503);
  }
});
