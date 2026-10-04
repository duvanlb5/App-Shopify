import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";

import shopify from "~/lib/shopify.server";
import { checkExpiringAndNotify } from "~/lib/scheduler.server";

const json = Response.json;

const CRON_SECRET = process.env.CRON_SECRET ?? "change-me";

async function run(request: Request) {
  const header = request.headers.get("x-cron-secret");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  const provided = header ?? querySecret;
  if (provided !== CRON_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const { admin } = await shopify.authenticate.admin(request);
    const result = await checkExpiringAndNotify(admin);
    return json({ ok: true, ...result });
  } catch (err: any) {
    return json({ ok: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

export const action = async ({ request }: ActionFunctionArgs) => run(request);
export const loader = async ({ request }: LoaderFunctionArgs) => run(request);
