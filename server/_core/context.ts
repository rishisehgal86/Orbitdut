import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Try local JWT authentication first
    const cookieHeader = opts.req.headers.cookie;
    if (cookieHeader) {
      const cookies = parseCookie(cookieHeader);
      const token = cookies[COOKIE_NAME];
      
      if (token) {
        // Try to verify JWT token
        const { verifyToken } = await import("../auth");
        const { getDb } = await import("../db");
        const { users } = await import("../../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const payload = await verifyToken(token);
        if (payload && payload.userId) {
          const db = await getDb();
          if (db) {
            const result = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
            if (result.length > 0) {
              user = result[0];
            }
          }
        }
      }
    }
    
    // OAuth disabled - using local authentication only
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
