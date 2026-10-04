import { type ActionFunctionArgs } from "react-router";

import shopify from "~/lib/shopify.server";
import { db } from "~/lib/db.server";

const json = Response.json;

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await shopify.authenticate.webhook(request);
  await db.notificationLog.create({
    data: { shop: shop ?? "unknown", type: "discount_deleted", discountId: payload?.admin_graphql_api_id ?? null, payload: JSON.stringify(payload), status: "ok" },
  });
  return json({ ok: true, topic });
};
