import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Lazy-init the Drizzle client so module load never reads process.env.
// Vercel's "collect page data" build step otherwise crashes when DATABASE_URL
// is not present in the Preview environment.
type Drizzle = ReturnType<typeof drizzle<typeof schema>>;
let _db: Drizzle | null = null;

function getDb(): Drizzle {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Configure it in Vercel → Settings → Environment Variables for this environment.",
    );
  }
  _db = drizzle(neon(url), { schema });
  return _db;
}

export const db = new Proxy({} as Drizzle, {
  get(_t, prop) {
    const target = getDb();
    const value = Reflect.get(target as object, prop);
    return typeof value === "function" ? value.bind(target) : value;
  },
}) as Drizzle;
