import { shopifyApp, ApiVersion, LogSeverity } from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { db } from "./db.server";

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
  // The Prisma session storage type uses a nested @shopify/shopify-api that's
  // structurally identical to the one the SDK expects but TypeScript sees them
  // as different declarations (private `compressedScopes`). Cast is safe at runtime.
  // @ts-expect-error - duplicate @shopify/shopify-api in node_modules
  sessionStorage: new PrismaSessionStorage(db),
  logger: {
    level: LogSeverity.Debug, // TEMPORAL: dejar Debug para ver el error exacto de validacion
    // @ts-expect-error - timestamps not required
    log: (level, msg, ...args) => console.log(`[shopify-sdk/${level}]`, msg, ...args),
  },
});

export default shopify;
export const apiVersion = ApiVersion.April25;
