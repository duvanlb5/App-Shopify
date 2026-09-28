import type { NotificationSettings } from "./settings.server";
import { getSettings } from "./settings.server";
import { notifyExpiring } from "./notifications.server";

export async function checkExpiringAndNotify(admin: any): Promise<{ ok: boolean; sent: number; error?: string }> {
  let settings: NotificationSettings;
  try {
    settings = await getSettings(admin);
  } catch (err: any) {
    return { ok: false, sent: 0, error: `getSettings: ${err?.message ?? err}` };
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + settings.warningDaysBefore * 24 * 60 * 60 * 1000);

  const response = await admin.graphql(
    `query expiringDiscounts($cursor: String) {
       discountNodes(first: 50, after: $cursor, query: "status:active") {
         pageInfo { hasNextPage endCursor }
         edges {
           node {
             id
             discount {
               __typename
               ... on DiscountCodeBasic { codes(first:1) { edges { node { code } } } startsAt endsAt title status }
               ... on DiscountCodeBxgy { codes(first:1) { edges { node { code } } } startsAt endsAt title status }
               ... on DiscountCodeFreeShipping { codes(first:1) { edges { node { code } } } startsAt endsAt title status }
               ... on DiscountCodeApp { codes(first:1) { edges { node { code } } } startsAt endsAt title status }
             }
           }
         }
       }
     }`,
  );
  const json = await response.json();
  const conn = json.data?.discountNodes;
  if (!conn) return { ok: false, sent: 0, error: "No discountNodes returned" };

  const items: { code: string; title: string; endsAt: string }[] = [];
  for (const edge of conn.edges) {
    const d = edge.node.discount;
    if (!d || d.status !== "ACTIVE" || !d.endsAt) continue;
    const endsAt = new Date(d.endsAt);
    if (endsAt >= now && endsAt <= horizon) {
      const code = d.codes?.edges?.[0]?.node?.code ?? "(sin código)";
      items.push({ code, title: d.title ?? "(sin título)", endsAt: endsAt.toISOString().slice(0, 10) });
    }
  }

  if (items.length === 0) return { ok: true, sent: 0 };

  const result = await notifyExpiring(settings, items);
  return { ok: result.ok, sent: items.length, error: result.error };
}
