import { Hono, type Context } from "hono";

type Env = { Bindings: { DB?: D1Database } };
export const auth = new Hono<Env>();
const encoder = new TextEncoder();
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
const sha256 = async (value: string) => hex(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))));
async function passwordHash(password: string, salt?: string): Promise<string> {
  const realSalt = salt ?? hex(crypto.getRandomValues(new Uint8Array(16)));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(realSalt), iterations: 100000, hash: "SHA-256" }, key, 256);
  return "pbkdf2-sha256:100000:" + realSalt + ":" + hex(new Uint8Array(derived));
}
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
const error = (message: string, status: 400 | 401 | 409 | 503 = 400) => ({ message, status });
const parse = async (c: any) => {
  const length = Number(c.req.header("content-length") || 0);
  if (length > 4096) throw error("Requisição muito grande.");
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== "object") throw error("Dados inválidos.");
  return body;
};
auth.post("/register", async c => {
  c.header("Cache-Control", "no-store");
  if (!c.env.DB) return c.json({ error: "Cadastro indisponível enquanto o banco é configurado." }, 503);
  try {
    const body = await parse(c);
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^[\p{L}\p{N}][\p{L}\p{N} _.-]{2,39}$/u.test(username)) return c.json({ error: "Nome deve ter entre 3 e 40 caracteres." }, 400);
    if (password.length < 6 || password.length > 12) return c.json({ error: "A senha deve ter entre 6 e 12 caracteres." }, 400);
    const id = crypto.randomUUID();
    const hash = await passwordHash(password);
    await c.env.DB.prepare("INSERT INTO users (id, game_username, password_hash) VALUES (?, ?, ?)").bind(id, username, hash).run();
    return c.json({ ok: true, message: "Conta criada. Entre com suas credenciais." }, 201);
  } catch (e: any) {
    if (e?.status) return c.json({ error: e.message }, e.status);
    if (String(e).includes("UNIQUE")) return c.json({ error: "Nome de jogador já cadastrado." }, 409);
    return c.json({ error: "Cadastro indisponível." }, 503);
  }
});
auth.post("/login", async c => {
  c.header("Cache-Control", "no-store");
  if (!c.env.DB) return c.json({ error: "Login indisponível enquanto o banco é configurado." }, 503);
  try {
    const body = await parse(c);
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || password.length > 128) return c.json({ error: "Credenciais inválidas." }, 401);
    const user = await c.env.DB.prepare("SELECT id, game_username, password_hash, status FROM users WHERE game_username = ?").bind(username).first<{ id: string; game_username: string; password_hash: string; status: string }>();
    if (!user || user.status !== "active") return c.json({ error: "Credenciais inválidas." }, 401);
    const pieces = user.password_hash.split(":");
    if (pieces.length !== 4 || pieces[0] !== "pbkdf2-sha256" || pieces[1] !== "100000") return c.json({ error: "Credenciais inválidas." }, 401);
    if (!safeEqual(await passwordHash(password, pieces[2]), user.password_hash)) return c.json({ error: "Credenciais inválidas." }, 401);
    const token = hex(crypto.getRandomValues(new Uint8Array(32)));
    const expiry = new Date(Date.now() + 7 * 86400000).toISOString();
    await c.env.DB.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)").bind(crypto.randomUUID(), user.id, await sha256(token), expiry).run();
    c.header("Set-Cookie", "stf_session=" + token + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800");
    return c.json({ ok: true, username: user.game_username });
  } catch (e: any) {
    if (e?.status) return c.json({ error: e.message }, e.status);
    return c.json({ error: "Login indisponível." }, 503);
  }
});
export async function currentUser(c: Context<Env>) {
  if (!c.env.DB) return null;
  const token = /(?:^|;\s*)stf_session=([0-9a-f]{64})(?:;|$)/.exec(c.req.header("cookie") || "")?.[1];
  if (!token) return null;
  return c.env.DB.prepare("SELECT u.id, u.game_username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND u.status = 'active'").bind(await sha256(token), new Date().toISOString()).first<{ id: string; game_username: string }>();
}
auth.get("/me", async c => {
  c.header("Cache-Control", "no-store");
  const user = await currentUser(c).catch(() => null);
  if (!user) return c.json({ authenticated: false }, 401);
  const roles=await c.env.DB!.prepare("SELECT r.name FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=? AND ur.revoked_at IS NULL").bind(user.id).all<{name:string}>();return c.json({ authenticated: true, username: user.game_username, roles: [...new Set(["citizen",...(roles.results||[]).map(r=>r.name)])] });
});
auth.post("/logout", async c => {
  c.header("Cache-Control", "no-store");
  const token = /(?:^|;\s*)stf_session=([0-9a-f]{64})(?:;|$)/.exec(c.req.header("cookie") || "")?.[1];
  if (token && c.env.DB) await c.env.DB.prepare("UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ?").bind(await sha256(token)).run().catch(() => {});
  c.header("Set-Cookie", "stf_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
  return c.json({ ok: true });
});
