import { Hono } from "hono";

type Bindings = { DB?: D1Database; DOCUMENTS?: R2Bucket };
const app = new Hono<{ Bindings: Bindings }>();
app.get("/", (c) => c.json({ service: "STF Diplomacia", status: "setup", version: "0.1.0" }));
app.get("/api/health", (c) => c.json({ ok: true }));
// Rotas judiciais e autenticação serão ativadas somente após validação de acesso e segurança.
export default app;
