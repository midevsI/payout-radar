import { whopsdk } from "@/lib/whop-sdk";

export type PlanTier = "free" | "pro";

export async function getPlanTier(accountId: string): Promise<PlanTier> {
	const planId = process.env.WHOP_PRO_PLAN_ID;
	if (!planId) return "free";
	const memberships = await whopsdk.memberships.list({ company_id: accountId, plan_ids: [planId], statuses: ["active"] });
	return memberships.data.length > 0 ? "pro" : "free";
}
