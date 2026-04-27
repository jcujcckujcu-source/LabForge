import type { Context, MiddlewareHandler, Next } from "hono";
import { verifyJwt } from "../lib/jwt";
import type { CloudflareEnv } from "../index";

export type AuthEnv = {
  Bindings: CloudflareEnv;
  Variables: { userId: string };
};

export const requireAuth: MiddlewareHandler<AuthEnv> = async (
  c: Context<AuthEnv>,
  next: Next
) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const token = authHeader.slice(7);
    const payload = await verifyJwt(token, c.env.JWT_SECRET);
    c.set("userId", payload.sub);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
};
