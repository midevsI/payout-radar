import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPlanTier } from "@/lib/plan";
import { getTrackedBounties, upsertTrackedBounty } from "@/lib/db";
import { whopsdk } from "@/lib/whop-sdk";

export async function POST(request: Request) {
	await whopsdk.verifyUserToken(await headers());
	const body = await request.json() as { accountId?: string; bountyId?: string };
	if (!body.accountId || !body.bountyId) return NextResponse.json({ error: "accountId and bountyId are required" }, { status: 400 });
	const tier = await getPlanTier(body.accountId);
	const tracked = await getTrackedBounties(body.accountId);
	if (tier === "free" && !tracked.some((row) => row.bounty_id === body.bountyId) && tracked.length >= 1) {
		return NextResponse.json({ error: "Free plans can track one bounty." }, { status: 403 });
	}
	await upsertTrackedBounty(body.accountId, body.bountyId, tier);
	return NextResponse.json({ ok: true });
}
