import { type ActionFunctionArgs } from "react-router";

import shopify from "~/lib/shopify.server";
import { db } from "~/lib/db.server";
import { getSettings } from "~/lib/settings.server";
import { notifyDiscountCreated } from "~/lib/notifications.server";

const json = Response.json;

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await shopify.authenticate.webhook(request);

  try {
    const settings = await getSettings({} as any); // fallback to defaults on webhook
    const code = payload?.discount?.codes?.edges?.[0]?.node?.code ?? "(sin código)";
    const title = payload?.title ?? "";
    const value =
      payload?.customerGets?.value?.percentage != null
        ? `${payload.customerGets.value.percentage * 100}%`
        : payload?.customerGets?.value?.discountAmount?.amount ?? "";
    const endsAt = payload?.endsAt ?? null;

    await notifyDiscountCreated(settings, { code, title, value, endsAt });
    await db.notificationLog.create({
      data: { shop: shop!, type: "discount_created", discountId: payload?.admin_graphql_api_id ?? null, payload: JSON.stringify(payload), status: "ok" },
    });
  } catch (err: any) {
    await db.notificationLog.create({
      data: { shop: shop ?? "unknown", type: "discount_created", payload: JSON.stringify(payload), status: "error", message: err?.message ?? String(err) },
    });
    return new Response(`Error: ${err?.message}`, { status: 500 });
  }

  return json({ ok: true, topic });
};
