import { shopifyApp, ApiVersion, LogSeverity } from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { db } from "./db.server";

// CRITICAL: log config at module load (BEFORE anything else) so we can see
// exactly what the SDK was initialized with.
console.log("[shopify.server] === SDK CONFIG AT STARTUP ===");
console.log("[shopify.server] APP_URL:", process.env.APP_URL);
console.log("[shopify.server] SHOPIFY_API_KEY:", process.env.SHOPIFY_API_KEY);
console.log("[shopify.server] SHOPIFY_API_SECRET length:", process.env.SHOPIFY_API_SECRET?.length ?? 0);
console.log("[shopify.server] SHOPIFY_API_SECRET first 4:", process.env.SHOPIFY_API_SECRET?.substring(0, 4) ?? "MISSING", "last 4:", process.env.SHOPIFY_API_SECRET?.substring(-4) ?? "MISSING");
console.log("[shopify.server] SCOPES raw:", JSON.stringify(process.env.SCOPES));
console.log("[shopify.server] SCOPES parsed:", process.env.SCOPES?.split(",") ?? "UNDEFINED (using default)");
console.log("[shopify.server] apiVersion:", ApiVersion.April25);
console.log("[shopify.server] isEmbeddedApp: true");
console.log("[shopify.server] ==============================");

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: process.env.SCOPES?.split(",") ?? [
    "write_products",
    "write_discounts",
    "write_price_rules",
  ],
  appUrl: process.env.APP_URL ?? "https://esprit-shopify-tools.fly.dev",
  apiVersion: ApiVersion.April25,
  isEmbeddedApp: true,
  sessionStorage: new PrismaSessionStorage(db),
  logger: {
    level: LogSeverity.Debug,
    // @ts-expect-error - timestamps not required
    log: (level, msg, ...args) => console.log(`[shopify-sdk/${level}]`, msg, ...args),
  },
});

export default shopify;
export const apiVersion = ApiVersion.April25;
