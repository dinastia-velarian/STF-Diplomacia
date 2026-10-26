import { Hono } from "hono";
import { currentUser } from "./auth";

export const court = new Hono<{ Bindings: { DB?: D1Database } }>();

court.get("/fila", async (c) => {
  c.header("Cache-Control", "no-store");
  if (!c.env.DB) return c.json({ error: "Banco indisponível." }, 503);
  const user = await currentUser(c).catch(() => null);
  if (!user) return c.json({ error: "Autenticação necessária." }, 401);
  try {
    const permitted = await c.env.DB.prepare("SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND ur.revoked_at IS NULL AND r.name IN ('minister', 'president', 'court_clerk') LIMIT 1").bind(user.id).first();
    if (!permitted) return c.json({ error: "Acesso restrito." }, 403);
    const result = await c.env.DB.prepare("SELECT case_number, title, case_type, status, created_at FROM cases WHERE visibility = 'public' AND status IN ('submitted','triage','instruction') ORDER BY created_at LIMIT 50").all();
    return c.json({ cases: result.results ?? [] });
  } catch {
    return c.json({ error: "Fila indisponível." }, 503);
  }
});
