import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { getCreatorSettings, getPlanTier, getTrackedBounties } from "@/lib/db";
import { listBounties } from "@/lib/bounty-api";
import { PostMortemToggle, ThresholdForm } from "./DashboardClient";

export default async function DashboardPage({ params }: { params: Promise<{ companyId: string }> }) {
	const { companyId } = await params;
	await whopsdk.verifyUserToken(await headers());
	const [tracked, tier, thresholds] = await Promise.all([getTrackedBounties(companyId), getPlanTier(companyId), getCreatorSettings(companyId)]);
	const bounties = (await Promise.all(tracked.map(async (row) => (await listBounties(companyId, row.last_status)).find((bounty) => bounty.id === row.bounty_id)))).filter(Boolean);
	return <main className="p-8 max-w-4xl mx-auto space-y-6">
		<header><p className="text-sm text-gray-600">Payout Radar</p><h1 className="text-3xl font-bold">Bounty runway</h1><p className="text-gray-600">Know when campaign budget is about to run out.</p></header>
		{tier === "pro" && <section className="rounded border p-4"><h2 className="font-semibold mb-3">Threshold alerts</h2><ThresholdForm accountId={companyId} initial={thresholds} /></section>}
		<section className="space-y-3">{bounties.length === 0 && <p className="text-gray-600">No tracked bounties yet.</p>}
			{bounties.map((bounty) => { const row = tracked.find((item) => item.bounty_id === bounty.id)!; const pct = bounty.budget_amount ? Math.max(0, 1 - bounty.gross_paid_out_amount / bounty.budget_amount) : 0; const days = Math.max(0, Math.floor((Date.now() - new Date(bounty.created_at).getTime()) / 86_400_000)); return <article className="rounded border p-4" key={bounty.id}><div className="flex justify-between"><h2 className="font-semibold">{bounty.id}</h2><span>{bounty.status}</span></div><div className="mt-3 h-3 rounded bg-gray-200"><div className="h-3 rounded bg-green-500" style={{ width: `${pct * 100}%` }} /></div><p className="mt-2 text-sm">{Math.round(pct * 100)}% budget remaining · {bounty.spots_remaining} spots · {days} days running</p>{tier === "pro" && <PostMortemToggle accountId={companyId} bountyId={bounty.id} enabled={row.auto_post_mortem} />}</article>; })}
		</section>
	</main>;
}
